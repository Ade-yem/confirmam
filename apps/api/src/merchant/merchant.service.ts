import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  async getProfile(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
    });
    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }
    return {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      bankName: merchant.bankName,
    };
  }
}
