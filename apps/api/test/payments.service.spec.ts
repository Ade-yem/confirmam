import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../src/payments/payments.service';
import { NombaService } from '../src/nomba/nomba.service';
import { SseService } from '../src/sse/sse.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

// Mock the PrismaService class and module completely to prevent loading generated ESM Prisma files in Jest
jest.mock('../src/prisma/prisma.service', () => {
  return {
    PrismaService: jest.fn().mockImplementation(() => {
      return {
        transaction: {
          create: jest.fn(),
          update: jest.fn(),
          findUnique: jest.fn(),
        },
        webhookEvent: {
          create: jest.fn(),
          update: jest.fn(),
        },
      };
    }),
  };
});

import { PrismaService } from '../src/prisma/prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let nomba: NombaService;
  let sse: SseService;

  const mockNombaService = {
    createVirtualAccount: jest.fn().mockResolvedValue({
      code: '00',
      data: {
        bankAccountNumber: '9901234567',
        bankName: 'Moniepoint MFB',
        bankAccountName: 'Test Business',
      },
    }),
  };

  const mockSseService = {
    broadcast: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        PrismaService,
        { provide: NombaService, useValue: mockNombaService },
        { provide: SseService, useValue: mockSseService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
    nomba = module.get<NombaService>(NombaService);
    sse = module.get<SseService>(SseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should throw if amount is negative or zero', async () => {
      await expect(
        service.createSession('merchant_id', 0, 'Test Merchant'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create pending transaction, query Nomba, and save details', async () => {
      (prisma.transaction.create as jest.Mock).mockResolvedValue({
        id: 'tx_new_id',
        reference: 'TX_REF_MOCK',
        amount: 1500,
        status: 'pending',
        merchantId: 'merchant_id',
      });
      (prisma.transaction.update as jest.Mock).mockResolvedValue({
        id: 'tx_new_id',
        status: 'pending',
      });

      const res = await service.createSession('merchant_id', 1500, 'Test Merchant');
      expect(res.amount).toBe(1500);
      expect(res.virtualAccountNumber).toBe('9901234567');
      expect(res.sessionId).toBe('tx_new_id');
      expect(prisma.transaction.create).toHaveBeenCalled();
      expect(nomba.createVirtualAccount).toHaveBeenCalledWith({
        accountRef: 'TX_REF_MOCK',
        accountName: 'Test Merchant',
        expectedAmount: 1500,
        expiryDate: expect.any(String),
      });
      expect(prisma.transaction.update).toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('should throw Unauthorized if signature check fails', async () => {
      process.env.NOMBA_WEBHOOK_SECRET = 'secret';
      await expect(
        service.handleWebhook(
          { event: 'payment_success' },
          'bad-sig',
          'timestamp',
          'raw-body',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should bypass signature check in dev mode if flag is present', async () => {
      process.env.NOMBA_WEBHOOK_SECRET = 'secret';
      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue({
        id: 'tx_123',
        merchantId: 'merchant_123',
        amount: 2000,
        status: 'pending',
      });
      (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({ id: 'webhook_event_id' });

      const payload = {
        event_type: 'payment_success',
        bypass_signature: true,
        data: {
          reference: 'TX_REF_MOCK',
          transaction: {
            aliasAccountReference: 'TX_REF_MOCK',
            transactionAmount: 2000,
            transactionId: 'nomba_tx_123',
          },
        },
      };

      await service.handleWebhook(payload, '', '', '');
      expect(prisma.transaction.update).toHaveBeenCalled();
      expect(sse.broadcast).toHaveBeenCalled();
    });
  });
});
