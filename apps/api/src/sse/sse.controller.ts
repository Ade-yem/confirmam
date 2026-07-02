import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SseService } from './sse.service';

/**
 * Controller exposing Server-Sent Events (SSE) endpoints.
 * Used by the frontend dashboard to receive real-time alerts.
 */
@Controller('events')
export class SseController {
  constructor(private sseService: SseService) {}

  /**
   * SSE stream endpoint delivering real-time payment updates.
   *
   * @route GET /events/payments
   * @param {string} merchantId Optional filter for the merchant dashboard.
   * @returns {Observable<MessageEvent>} Real-time Server-Sent Event stream.
   */
  @Sse('payments')
  payments(@Query('merchantId') merchantId: string): Observable<MessageEvent> {
    return this.sseService.subscribe(merchantId);
  }
}
