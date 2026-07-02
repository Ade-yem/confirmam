import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Module bundling all merchant dashboard metric configurations,
 * including controller, service, and Prisma database client.
 */
@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
