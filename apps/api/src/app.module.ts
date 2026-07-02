import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NombaModule } from './nomba/nomba.module';
import { MerchantModule } from './merchant/merchant.module';
import { PaymentsModule } from './payments/payments.module';
import { SseModule } from './sse/sse.module';
import { TransfersModule } from './transfers/transfers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TransactionsModule } from './transactions/transactions.module';

/**
 * Main application module registering all domain-specific submodules.
 */
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NombaModule,
    MerchantModule,
    PaymentsModule,
    SseModule,
    TransfersModule,
    DashboardModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
