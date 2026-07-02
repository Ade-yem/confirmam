import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NombaService } from '../nomba/nomba.service';
import { SseService } from '../sse/sse.service';
import { PaymentSession } from 'types';
import { Prisma } from '../../generated/prisma/client';
import * as crypto from 'crypto';

/**
 * Interface representing the structure of a Nomba payment status webhook.
 */
export interface WebhookPayload {
  event_type?: string;
  event?: string;
  requestId?: string;
  bypass_signature?: boolean;
  data?: {
    reference?: string;
    amount?: number;
    accountNumber?: string;
    status?: string;
    settledAt?: string;
    senderName?: string;
    senderBank?: string;
    merchant?: {
      userId?: string;
      walletId?: string;
      walletBalance?: number;
    };
    transaction?: {
      aliasAccountNumber?: string;
      fee?: number;
      sessionId?: string;
      type?: string;
      transactionId?: string;
      aliasAccountName?: string;
      responseCode?: string;
      originatingFrom?: string;
      transactionAmount?: number;
      narration?: string;
      time?: string;
      aliasAccountReference?: string;
      aliasAccountType?: string;
    };
  };
}

/**
 * Service managing payment sessions and webhook notifications.
 * Provisions virtual accounts from Nomba, processes incoming transaction success webhooks,
 * validates HMAC-SHA256 signatures, and broadcasts SSE updates to the dashboard.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private nombaService: NombaService,
    private sseService: SseService,
  ) {}

  /**
   * Provisions a new virtual account payment session for an inbound transaction.
   *
   * @param {string} merchantId ID of the merchant receiving funds.
   * @param {number} amount Payment amount in Naira.
   * @param {string} customerName Name of the paying customer.
   * @returns {Promise<VAResponse>} Configured virtual account payment details.
   */
  async createSession(merchantId: string, amount: number, merchantName: string): Promise<PaymentSession> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // 1. Create a pending incoming transaction record to acquire a unique reference
    const transaction = await this.prisma.transaction.create({
      data: {
        direction: 'incoming',
        amount: Math.round(amount),
        status: 'pending',
        merchantId,
      }
    });

    try {
      // 2. Call Nomba API to provision the virtual account with 1 hour expiry
      const expiryDate = new Date(Date.now() + 3600 * 1000).toISOString();
      const nombaRes = await this.nombaService.createVirtualAccount({
        accountRef: transaction.reference,
        accountName: merchantName,
        expectedAmount: amount,
        expiryDate,
      });

      const vaNumber = nombaRes.data.bankAccountNumber;
      const bankName = nombaRes.data.bankName;

      // 3. Update the transaction record with bank details
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          vaNumber,
          recipientBank: bankName,
          recipientName: nombaRes.data.bankAccountName,
        },
      });

      return {
        sessionId: transaction.id,
        virtualAccountNumber: vaNumber,
        bankName,
        merchantName,
        amount,
        expiresAt: expiryDate,
      };
    } catch (err) {
      this.logger.error(`Failed to provision virtual account for transaction: ${transaction.id}`, err);
      
      // Update transaction status to failed
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      });

      throw err;
    }
  }

  /**
   * Processes an incoming payment webhook notification from Nomba.
   * Verifies signatures, updates transaction state, and broadcasts updates via SSE.
   *
   * @param {WebhookPayload} payload Parsed body from the webhook request.
   * @param {string} signature HMAC-SHA256 signature from headers.
   * @param {string} timestamp Timestamp header for signature calculation.
   * @param {string} rawBody Unparsed string representation of request body.
   */
  async handleWebhook(payload: WebhookPayload, signature: string, timestamp: string, rawBody: string): Promise<void> {
    // 1. Verify that the request comes legitimately from Nomba
    const verified = this.verifyWebhookSignature(payload, signature, timestamp, rawBody);
    if (!verified) {
      this.logger.warn('Failed webhook signature verification.');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 2. Persist the webhook event in raw logs
    const eventRecord = await this.prisma.webhookEvent.create({
      data: {
        payload: payload as unknown as Prisma.InputJsonValue,
        processed: false,
      },
    });

    // 3. Extract transaction identifier (reference) and event type
    const eventType = payload.event_type || payload.event;
    const data = payload.data || {};
    
    // Support both nested Nomba format and flat workspace mock format
    const reference = data.transaction?.aliasAccountReference || data.reference;
    const webhookTxId = data.transaction?.transactionId || data.reference || 'unknown';

    if (!reference) {
      this.logger.warn(`Webhook ignored: reference field missing in payload. RequestId: ${payload.requestId}`);
      return;
    }

    // Find our matching internal transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      this.logger.error(`Transaction with reference ${reference} not found in database.`);
      return;
    }

    // If transaction is already completed/confirmed, ignore duplicate webhook calls
    if (transaction.status === 'confirmed') {
      this.logger.log(`Transaction ${transaction.id} already confirmed. Skipping.`);
      await this.prisma.webhookEvent.update({
        where: { id: eventRecord.id },
        data: { processed: true },
      });
      return;
    }

    // Process status updates
    if (eventType === 'payment_success' || eventType === 'payment_confirmed' || eventType === 'confirmed') {
      const senderName = data.senderName || data.transaction?.aliasAccountName || 'Paying Customer';
      const senderBank = data.senderBank || data.transaction?.originatingFrom || 'Unknown Bank';

      // 4. Update transaction status in database
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'confirmed',
          confirmedAt: new Date(),
          webhookRef: webhookTxId,
          senderName,
        },
      });

      this.logger.log(`Payment CONFIRMED for Transaction ${transaction.id}. Broadcasting SSE.`);

      // 5. Broadcast real-time SSE payment confirmation to the merchant dashboard
      this.sseService.broadcast(transaction.merchantId, {
        sessionId: transaction.id,
        amount: transaction.amount,
        senderName,
        senderBank,
        timestamp: new Date().toISOString(),
        reference: transaction.reference,
      });
    } else if (eventType === 'payment_failed' || eventType === 'failed') {
      // Update transaction status to failed
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          webhookRef: webhookTxId,
        },
      });

      this.logger.log(`Payment FAILED for Transaction ${transaction.id}.`);
    }

    // Mark event log as processed
    await this.prisma.webhookEvent.update({
      where: { id: eventRecord.id },
      data: { processed: true },
    });
  }

  /**
   * Verifies the integrity and origin of webhooks sent by Nomba.
   * Compares the computed HMAC-SHA256 signature with the received header signature.
   *
   * @private
   * @param {WebhookPayload} payload Parsed JSON payload.
   * @param {string} signature Received signature header value.
   * @param {string} timestamp Received timestamp header value.
   * @param {string} rawBody Raw string body from the request buffer.
   * @returns {boolean} True if signatures match or checking is bypassed, otherwise false.
   */
  private verifyWebhookSignature(payload: WebhookPayload, signature: string, timestamp: string, rawBody: string): boolean {
    const secret = process.env.NOMBA_WEBHOOK_SECRET;

    // Direct bypass check for development
    if (process.env.NODE_ENV !== 'production' && payload.bypass_signature === true) {
      return true;
    }

    if (!secret) {
      this.logger.warn('NOMBA_WEBHOOK_SECRET is not configured. Webhook signature checking is bypassed.');
      return true;
    }

    if (!signature) {
      return false;
    }

    try {
      const eventType = payload.event_type || '';
      const requestId = payload.requestId || '';
      const merchant = payload.data?.merchant || {};
      const transaction = payload.data?.transaction || {};
      const userId = merchant.userId || '';
      const walletId = merchant.walletId || '';
      const transactionId = transaction.transactionId || '';
      const transactionType = transaction.type || '';
      const transactionTime = transaction.time || '';
      let transactionResponseCode = transaction.responseCode || '';

      if (transactionResponseCode === 'null') {
        transactionResponseCode = '';
      }

      // Re-create Nomba's structured hashing payload
      const hashingPayload = `${eventType}:${requestId}:${userId}:${walletId}:${transactionId}:${transactionType}:${transactionTime}:${transactionResponseCode}:${timestamp || ''}`;

      const computed = crypto
        .createHmac('sha256', secret)
        .update(hashingPayload)
        .digest('base64');

      return computed.toLowerCase() === signature.toLowerCase();
    } catch (err) {
      this.logger.error('Failed to compute webhook signature', err);
      return false;
    }
  }
}
