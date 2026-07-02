import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { MerchantService } from './merchant.service';

@Controller('merchant')
@UseGuards(JwtAuthGuard)
export class MerchantController {
  constructor(private merchantService: MerchantService) {}

  @Get('profile')
  async getProfile(@CurrentMerchant() merchant: any) {
    return this.merchantService.getProfile(merchant.id);
  }
}
