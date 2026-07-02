import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { TransfersService, TransferResult } from './transfers.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { z } from 'zod';

const resolveSchema = z.object({
  bankCode: z.string().min(1, 'Bank code is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
});

const transferSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  recipientBank: z.string().min(1, 'Recipient bank is required'),
  recipientAccountNumber: z.string().min(1, 'Recipient account number is required'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  narration: z.string().optional(),
});

/**
 * Controller exposing banking capabilities: querying bank lists,
 * resolving bank account names, and executing outbound fund transfers.
 */
@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private transfersService: TransfersService) {}

  /**
   * Retrieves all supported payout banks.
   *
   * @route GET /transfers/banks
   * @security JWT Auth
   * @returns {Promise<any>} List of banks from Nomba.
   */
  @Get('banks')
  async getBanks() {
    return this.transfersService.getBanks();
  }

  /**
   * Resolves a bank account number to retrieve the holder's name.
   * Exposes POST method to match the frontend request configuration.
   *
   * @route POST /transfers/resolve
   * @security JWT Auth
   * @param {Record<string, unknown>} body HTTP request body.
   * @returns {Promise<{ name: string }>} Resolved bank account name.
   */
  @Post('resolve')
  async resolveAccount(@Body() body: Record<string, unknown>) {
    const result = resolveSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0]?.message || 'Validation failed');
    }
    return this.transfersService.resolveAccount(result.data.bankCode, result.data.accountNumber);
  }

  /**
   * Initiates a funds transfer request.
   *
   * @route POST /transfers/send
   * @security JWT Auth
   * @param {Record<string, unknown>} body HTTP request body matching SendMoneyPayload.
   * @param {{id: string}} merchant Extracted merchant info from JWT token.
   * @returns {Promise<TransferResult>} Result of the transfer.
   */
  @Post('send')
  async sendTransfer(
    @Body() body: Record<string, unknown>,
    @CurrentMerchant() merchant: { id: string },
  ): Promise<TransferResult> {
    const result = transferSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0]?.message || 'Validation failed');
    }

    return this.transfersService.sendTransfer(merchant.id, result.data);
  }
}
