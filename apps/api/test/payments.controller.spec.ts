import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from '../src/payments/payments.controller';
import { PaymentsService } from '../src/payments/payments.service';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../src/common/guards/jwt.guard';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    createCheckout: jest.fn().mockResolvedValue({
      checkoutLink: 'https://checkout.nomba.com/sandbox/mock_link',
      orderReference: 'TX_REF_MOCK',
      amount: 2000,
    }),
    verifyCheckout: jest.fn().mockResolvedValue({
      status: 'confirmed',
      amount: 2000,
      confirmedAt: new Date(),
    }),
    simulateWebhook: jest.fn().mockResolvedValue({
      success: true,
      message: 'Webhook simulation event successfully generated and processed.',
    }),
    refundCheckout: jest.fn().mockResolvedValue({
      success: true,
      message: 'Refund processed successfully',
    }),
    handleWebhook: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCheckout', () => {
    it('should validate request body and call createCheckout', async () => {
      const payload = { amount: 2000, customerEmail: 'test@example.com' };
      const merchant = { id: 'merchant_123' };

      const res = await controller.createCheckout(payload, merchant);
      expect(res.amount).toBe(2000);
      expect(service.createCheckout).toHaveBeenCalledWith('merchant_123', 2000, 'test@example.com');
    });

    it('should throw BadRequestException if amount is negative or invalid', async () => {
      const payload = { amount: -50 };
      const merchant = { id: 'merchant_123' };

      await expect(controller.createCheckout(payload, merchant)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyCheckout', () => {
    it('should call verifyCheckout with reference', async () => {
      const res = await controller.verifyCheckout('TX_REF_MOCK');
      expect(res.status).toBe('confirmed');
      expect(service.verifyCheckout).toHaveBeenCalledWith('TX_REF_MOCK');
    });
  });

  describe('simulateWebhook', () => {
    it('should call simulateWebhook with reference', async () => {
      const res = await controller.simulateWebhook('TX_REF_MOCK');
      expect(res.success).toBe(true);
      expect(service.simulateWebhook).toHaveBeenCalledWith('TX_REF_MOCK');
    });
  });

  describe('refundCheckout', () => {
    it('should call refundCheckout with reference and valid body', async () => {
      const res = await controller.refundCheckout('TX_REF_MOCK', { amount: 1000 });
      expect(res.success).toBe(true);
      expect(service.refundCheckout).toHaveBeenCalledWith('TX_REF_MOCK', 1000);
    });

    it('should call refundCheckout with undefined amount if body is empty', async () => {
      const res = await controller.refundCheckout('TX_REF_MOCK', {});
      expect(res.success).toBe(true);
      expect(service.refundCheckout).toHaveBeenCalledWith('TX_REF_MOCK', undefined);
    });
  });
});
