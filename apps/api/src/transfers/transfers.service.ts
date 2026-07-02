import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NombaService } from '../nomba/nomba.service';
import { NombaBanksResponse } from '../nomba/nomba.types';

/**
 * Interface representing the details required for executing a transfer.
 * Aligns with the frontend SendMoneyPayload interface.
 */
export interface TransferDetails {
  amount: number;
  recipientBank: string;
  recipientAccountNumber: string;
  recipientName: string;
  narration?: string;
}

/**
 * Interface representing the result of an executed transfer.
 * Aligns with the frontend TransferResult interface.
 */
export interface TransferResult {
  reference: string;
  status: 'successful' | 'pending' | 'failed';
  timestamp: string;
}

/**
 * Service managing outbound funds transfers and destination lookup.
 * Integrates with Nomba Service for bank queries and payout transfers.
 */
@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private prisma: PrismaService,
    private nombaService: NombaService,
  ) {}

  /**
   * Fetches the list of supported payout banks.
   *
   * @returns {Promise<NombaBanksResponse>} List of banks.
   */
  async getBanks(): Promise<NombaBanksResponse> {
    return this.nombaService.fetchBanks();
  }

  /**
   * Resolves the bank account name for a given bank code and account number.
   *
   * @param {string} bankCode The target bank code.
   * @param {string} accountNumber The bank account number.
   * @returns {Promise<{ name: string }>} Resolved holder name object.
   */
  async resolveAccount(bankCode: string, accountNumber: string): Promise<{ name: string }> {
    if (!bankCode || !accountNumber) {
      throw new BadRequestException('Bank code and account number are required');
    }
    const res = await this.nombaService.lookupAccount({ bankCode, accountNumber });
    return { name: res.data.accountName };
  }

  /**
   * Initiates an outbound transfer from the merchant's account.
   *
   * @param {string} merchantId ID of the initiating merchant.
   * @param {TransferDetails} details Details of the transfer destination and amount.
   * @returns {Promise<TransferResult>} Result of the transfer execution.
   */
  async sendTransfer(
    merchantId: string,
    details: TransferDetails,
  ): Promise<TransferResult> {
    const { amount, recipientBank, recipientAccountNumber, recipientName } = details;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // 1. Fetch current merchant profile to retrieve sender name
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    // 2. Create a pending outgoing transaction record in the DB
    const transaction = await this.prisma.transaction.create({
      data: {
        direction: 'outgoing',
        amount: Math.round(amount),
        status: 'pending',
        merchantId,
        recipientBank,
        recipientAccountNumber,
        recipientName,
      },
    });

    try {
      // 3. Initiate the payout transfer via Nomba Service
      const nombaRes = await this.nombaService.performTransfer({
        amount,
        bankCode: recipientBank,
        accountNumber: recipientAccountNumber,
        accountName: recipientName,
        merchantTxRef: transaction.reference,
        senderName: merchant.name,
      });

      // 4. Map Nomba payout transfer status to internal status
      let finalStatus: 'successful' | 'pending' | 'failed' = 'pending';
      let confirmedAt: Date | undefined = undefined;

      const nombaStatus = nombaRes.data?.status;

      if (nombaStatus === 'SUCCESS') {
        finalStatus = 'successful';
        confirmedAt = new Date();
      } else if (nombaStatus === 'FAILED') {
        finalStatus = 'failed';
      }

      // Update the transaction record
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: finalStatus === 'successful' ? 'confirmed' : finalStatus, // DB stores 'confirmed' or status
          confirmedAt,
          webhookRef: nombaRes.data?.id || null,
        },
      });

      return {
        reference: transaction.reference,
        status: finalStatus,
        timestamp: transaction.createdAt.toISOString(),
      };
    } catch (err) {
      this.logger.error(`Payout transfer failed for transaction: ${transaction.id}`, err);

      // Set transaction status to failed on API errors
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      });

      throw err;
    }
  }
}
