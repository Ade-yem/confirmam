import { Module } from '@nestjs/common';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NombaModule } from '../nomba/nomba.module';

/**
 * Module bundling all transfer processing configurations,
 * including controller, service, Prisma, and Nomba integration.
 */
@Module({
  imports: [PrismaModule, NombaModule],
  controllers: [TransfersController],
  providers: [TransfersService],
})
export class TransfersModule {}
