import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NombaModule } from '../nomba/nomba.module';
import { SseModule } from '../sse/sse.module';

/**
 * Module bundling all payment processing configurations,
 * including controller, service, Prisma, Nomba integration, and SSE.
 */
@Module({
  imports: [PrismaModule, NombaModule, SseModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
