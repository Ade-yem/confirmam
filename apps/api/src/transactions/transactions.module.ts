import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Module bundling all historical transaction configurations,
 * including controller, service, and Prisma database client.
 */
@Module({
  imports: [PrismaModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
