import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Interface representing the transaction structure returned to the client.
 * Matches the frontend Transaction model.
 */
export interface TransactionResponse {
  id: string;
  direction: 'incoming' | 'outgoing';
  amount: number;
  senderName?: string;
  recipientName?: string;
  recipientBank?: string;
  timestamp: string;
  status: 'successful' | 'pending' | 'failed';
  reference: string;
}

/**
 * Service managing query access to the merchant transaction log.
 * Provides custom filtering (e.g. by date), sorting, and status formatting.
 */
@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves transactions associated with a specific merchant.
   * Optionally filters by a target day.
   *
   * @param {string} merchantId ID of the merchant.
   * @param {string} [date] Optional date string (YYYY-MM-DD) to filter results.
   * @returns {Promise<TransactionResponse[]>} List of formatted transactions.
   */
  async getTransactions(merchantId: string, date?: string): Promise<TransactionResponse[]> {
    const whereClause: Prisma.TransactionWhereInput = { merchantId };

    if (date) {
      const parsedDate = new Date(date);
      // Ensure the parsed date is valid
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(parsedDate);
        endOfDay.setHours(23, 59, 59, 999);

        whereClause.createdAt = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    const list = await this.prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return list.map((tx) => {
      let finalStatus: 'successful' | 'pending' | 'failed' = 'pending';
      if (tx.status === 'confirmed') {
        finalStatus = 'successful';
      } else if (tx.status === 'failed') {
        finalStatus = 'failed';
      }

      return {
        id: tx.id,
        direction: tx.direction === 'incoming' ? 'incoming' : 'outgoing',
        amount: tx.amount,
        senderName: tx.senderName || undefined,
        recipientName: tx.recipientName || undefined,
        recipientBank: tx.recipientBank || undefined,
        timestamp: tx.createdAt.toISOString(),
        status: finalStatus,
        reference: tx.reference,
      };
    });
  }
}
