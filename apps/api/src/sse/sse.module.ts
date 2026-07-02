import { Module } from '@nestjs/common';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';

/**
 * Module wrapping Server-Sent Events controller and service.
 * Exported globally so that webhook handlers can trigger events.
 */
@Module({
  controllers: [SseController],
  providers: [SseService],
  exports: [SseService],
})
export class SseModule {}
