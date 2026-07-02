import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TransactionsService, TransactionResponse } from './transactions.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

/**
 * Controller exposing endpoints for checking transaction logs and histories.
 */
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  /**
   * Retrieves transaction history for the logged-in merchant.
   *
   * @route GET /transactions
   * @security JWT Auth
   * @param {{id: string}} merchant Current authenticated merchant profile.
   * @param {string} [date] Optional filter to only return transactions from a specific day (YYYY-MM-DD).
   * @returns {Promise<TransactionResponse[]>} Historical transaction list.
   */
  @Get()
  async getTransactions(
    @CurrentMerchant() merchant: { id: string },
    @Query('date') date?: string,
  ): Promise<TransactionResponse[]> {
    return this.transactionsService.getTransactions(merchant.id, date);
  }
}
