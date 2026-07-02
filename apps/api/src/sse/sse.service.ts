import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { SSEEvent } from 'types';

/**
 * Service facilitating Server-Sent Events (SSE) broadcasting.
 * Uses an RxJS Subject to push payment status updates to subscribed dashboard clients.
 */
@Injectable()
export class SseService {
  private readonly sseSubject = new Subject<{ merchantId: string; event: SSEEvent }>();

  /**
   * Broadcasts a payment status event to all active SSE streams.
   *
   * @param {string} merchantId ID of the merchant receiving the payment.
   * @param {SSEEvent} event Details of the payment event.
   */
  broadcast(merchantId: string, event: SSEEvent): void {
    this.sseSubject.next({ merchantId, event });
  }

  /**
   * Subscribes a client to real-time events. Filtered optionally by merchant ID.
   *
   * @param {string} merchantId ID of the merchant to filter events for.
   * @returns {Observable<MessageEvent>} An RxJS stream of MessageEvents.
   */
  subscribe(merchantId: string): Observable<MessageEvent> {
    return this.sseSubject.asObservable().pipe(
      filter((data) => !merchantId || data.merchantId === merchantId),
      map((data) => ({
        data: data.event,
      } as MessageEvent)),
    );
  }
}
