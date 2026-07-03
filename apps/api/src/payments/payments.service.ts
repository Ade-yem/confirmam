import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NombaService } from '../nomba/nomba.service';
import { SseService } from '../sse/sse.service';
import { PaymentSession } from 'types';
import { Prisma } from '@prisma/client';
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
  async createSession(
    merchantId: string,
    amount: number,
    merchantName: string,
  ): Promise<PaymentSession> {
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
      },
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
      this.logger.error(
        `Failed to provision virtual account for transaction: ${transaction.id}`,
        err,
      );

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
  async handleWebhook(
    payload: WebhookPayload,
    signature: string,
    timestamp: string,
    rawBody: string,
  ): Promise<void> {
    const safePayload = payload ?? {};

    // 1. Verify that the request comes legitimately from Nomba
    const verified = this.verifyWebhookSignature(
      safePayload,
      signature,
      timestamp,
      rawBody,
    );
    if (!verified) {
      this.logger.warn('Failed webhook signature verification.');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 2. Persist the webhook event in raw logs
    const eventRecord = await this.prisma.webhookEvent.create({
      data: {
        payload: safePayload as unknown as Prisma.InputJsonValue,
        processed: false,
      },
    });

    // 3. Extract transaction identifier (reference) and event type
    const eventType = safePayload.event_type || safePayload.event;
    const data = safePayload.data || {};

    // Support both nested Nomba format and flat workspace mock format
    const reference = data.transaction?.aliasAccountReference || data.reference;
    const webhookTxId =
      data.transaction?.transactionId || data.reference || 'unknown';

    if (!reference) {
      this.logger.warn(
        `Webhook ignored: reference field missing in payload. RequestId: ${safePayload.requestId}`,
      );
      return;
    }

    // Find our matching internal transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      this.logger.error(
        `Transaction with reference ${reference} not found in database.`,
      );
      return;
    }

    // If transaction is already completed/confirmed, ignore duplicate webhook calls
    if (transaction.status === 'confirmed') {
      this.logger.log(
        `Transaction ${transaction.id} already confirmed. Skipping.`,
      );
      await this.prisma.webhookEvent.update({
        where: { id: eventRecord.id },
        data: { processed: true },
      });
      return;
    }

    // Process status updates
    if (
      eventType === 'payment_success' ||
      eventType === 'payment_confirmed' ||
      eventType === 'confirmed'
    ) {
      const senderName =
        data.senderName ||
        data.transaction?.aliasAccountName ||
        'Paying Customer';
      const senderBank =
        data.senderBank || data.transaction?.originatingFrom || 'Unknown Bank';

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

      this.logger.log(
        `Payment CONFIRMED for Transaction ${transaction.id}. Broadcasting SSE.`,
      );

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
  private verifyWebhookSignature(
    payload: WebhookPayload,
    signature: string,
    timestamp: string,
    rawBody: string,
  ): boolean {
    const secret = process.env.NOMBA_WEBHOOK_SECRET;
    const safePayload = payload ?? {};

    if (!secret) {
      this.logger.error(
        'NOMBA_WEBHOOK_SECRET is not configured. Webhook signature verification failed.',
      );
      return false;
    }

    if (!signature) {
      return false;
    }

    try {
      const eventType = safePayload.event_type || '';
      const requestId = safePayload.requestId || '';
      const merchant = safePayload.data?.merchant || {};
      const transaction = safePayload.data?.transaction || {};
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

  /**
   * Generates a new checkout order session from Nomba.
   *
   * @param {string} merchantId ID of the initiating merchant.
   * @param {number} amount Payment amount.
   * @param {string} [customerEmail] Optional email of the customer.
   * @returns {Promise<{ checkoutLink: string; orderReference: string; amount: number }>}
   */
  async createCheckout(
    merchantId: string,
    amount: number,
    customerEmail?: string,
  ) {
    // 1. Create a pending Transaction record
    const transaction = await this.prisma.transaction.create({
      data: {
        direction: 'incoming',
        amount,
        status: 'pending',
        merchantId,
      },
    });

    try {
      // 2. Call Nomba to create the checkout order
      const nombaRes = await this.nombaService.createCheckoutOrder({
        order: {
          amount: amount.toFixed(2),
          currency: 'NGN',
          callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/payments/callback`,
          customerEmail,
          orderReference: transaction.reference,
        },
      });

      const checkoutLink = nombaRes.data.checkoutLink;

      // 3. Update the transaction record with the checkout link
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          ussdString: checkoutLink,
        },
      });

      return {
        checkoutLink,
        orderReference: nombaRes.data.orderReference,
        amount,
      };
    } catch (err) {
      this.logger.error(
        `Failed to create checkout order for transaction: ${transaction.id}`,
        err,
      );

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      });

      throw err;
    }
  }

  /**
   * Confirms a checkout transaction details with Nomba.
   *
   * @param {string} reference The unique order reference.
   * @returns {Promise<{ status: string; amount: number; confirmedAt: Date | null }>}
   */
  async verifyCheckout(reference: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with reference ${reference} not found`);
    }

    // Call Nomba to confirm the transaction status
    const nombaRes = await this.nombaService.confirmCheckoutTransaction(reference);

    if (nombaRes.status === true) {
      if (transaction.status !== 'confirmed') {
        const updatedTx = await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'confirmed',
            confirmedAt: new Date(),
            webhookRef: nombaRes.data.id,
          },
        });

        // Broadcast to SSE
        this.sseService.broadcast(transaction.merchantId, {
          sessionId: transaction.id,
          amount: transaction.amount,
          senderName: transaction.senderName || 'Paying Customer',
          senderBank: transaction.recipientBank || 'Unknown Bank',
          timestamp: updatedTx.confirmedAt?.toISOString() || new Date().toISOString(),
          reference: transaction.reference,
        });

        return {
          status: 'confirmed',
          amount: updatedTx.amount,
          confirmedAt: updatedTx.confirmedAt,
        };
      }
    }

    return {
      status: transaction.status,
      amount: transaction.amount,
      confirmedAt: transaction.confirmedAt,
    };
  }

  /**
   * Simulates a webhook notification locally for testing purposes.
   *
   * @param {string} reference The transaction reference to simulate success for.
   * @returns {Promise<{ success: boolean; message: string }>}
   */
  async simulateWebhook(reference: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with reference ${reference} not found`);
    }

    const mockTxId = 'sim_tx_' + Math.random().toString(36).substring(7);
    const eventType = 'payment_success';
    const requestId = 'req_' + Math.random().toString(36).substring(7);
    const userId = 'sim_user';
    const walletId = 'sim_wallet';
    const transactionId = mockTxId;
    const transactionType = 'card';
    const transactionTime = new Date().toISOString();
    const transactionResponseCode = '00';

    const webhookPayload = {
      event_type: eventType,
      requestId: requestId,
      data: {
        reference: reference,
        merchant: {
          userId,
          walletId,
        },
        transaction: {
          aliasAccountReference: reference,
          transactionAmount: transaction.amount,
          transactionId: mockTxId,
          aliasAccountName: 'Simulated Customer',
          originatingFrom: 'Simulated Bank',
          type: transactionType,
          time: transactionTime,
          responseCode: transactionResponseCode,
        },
      },
    };

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const secret = process.env.NOMBA_WEBHOOK_SECRET || 'test-secret';
    
    const hashingPayload = `${eventType}:${requestId}:${userId}:${walletId}:${transactionId}:${transactionType}:${transactionTime}:${transactionResponseCode}:${timestamp}`;

    const signature = crypto
      .createHmac('sha256', secret)
      .update(hashingPayload)
      .digest('base64');

    await this.handleWebhook(
      webhookPayload as any,
      signature,
      timestamp,
      JSON.stringify(webhookPayload),
    );

    return {
      success: true,
      message: 'Webhook simulation event successfully generated and processed.',
    };
  }

  /**
   * Processes a refund for a checkout order.
   *
   * @param {string} reference The transaction reference.
   * @param {number} [amount] Optional refund amount.
   * @returns {Promise<{ success: boolean; message: string }>}
   */
  async refundCheckout(reference: string, amount?: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with reference ${reference} not found`);
    }

    if (transaction.status !== 'confirmed' || !transaction.webhookRef) {
      throw new BadRequestException('Transaction is not confirmed or does not have a Nomba transaction ID');
    }

    // Call Nomba to process the refund
    const refundRes = await this.nombaService.refundCheckoutOrder({
      transactionId: transaction.webhookRef,
      amount,
    });

    if (refundRes.data?.success || refundRes.status === true) {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'refunded' },
      });
    }

    return {
      success: refundRes.data?.success,
      message: refundRes.data?.message || refundRes.description,
    };
  }
}
