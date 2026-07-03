import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import * as express from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { PaymentSession } from 'types';
import { z } from 'zod';

const createSessionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

/**
 * Controller handling payments session initialization
 * and receiving payment webhook notifications from Nomba.
 */
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  /**
   * Generates a new payment session, provisioning a virtual account from Nomba.
   *
   * @route POST /payments/session
   * @security JWT Auth
   * @param {Record<string, unknown>} body HTTP request body.
   * @param {any} merchant Extracted merchant info from JWT token.
   * @returns {Promise<PaymentSession>} The provisioned payment session details.
   */
  @Post('session')
  @UseGuards(JwtAuthGuard)
  async createSession(
    @Body() body: Record<string, unknown>,
    @CurrentMerchant() merchant: { id: string; name: string },
  ): Promise<PaymentSession> {
    const result = createSessionSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues[0]?.message || 'Validation failed',
      );
    }

    return this.paymentsService.createSession(
      merchant.id,
      result.data.amount,
      merchant.name,
    );
  }

  /**
   * Receives real-time webhook status notifications from Nomba.
   * Processes successful and failed transactions and broadcasts SSE alerts.
   *
   * @route POST /payments/webhook
   * @param {Record<string, unknown>} body HTTP parsed JSON body.
   * @param {Request} req Express request object containing the rawBody buffer.
   * @param {string} signature Value of the nomba-signature header.
   * @param {string} timestamp Value of the nomba-timestamp header.
   * @returns {Promise<{success: boolean}>} Success acknowledgement.
   */
  @Post('webhook')
  async handleWebhook(
    @Body() body: Record<string, unknown>,
    @Req() req: express.Request,
    @Headers('nomba-signature') signature: string,
    @Headers('nomba-timestamp') timestamp: string,
  ) {
    const rawBodyBuffer = (req as unknown as { rawBody?: Buffer }).rawBody;
    const rawBodyStr = rawBodyBuffer
      ? rawBodyBuffer.toString('utf8')
      : JSON.stringify(body);

    await this.paymentsService.handleWebhook(
      body,
      signature,
      timestamp,
      rawBodyStr,
    );
    return { success: true };
  }
}
