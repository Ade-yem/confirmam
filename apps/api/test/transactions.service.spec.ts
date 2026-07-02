import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from '../src/transactions/transactions.service';

// Mock the PrismaService class and module completely to prevent loading generated ESM Prisma files in Jest
jest.mock('../src/prisma/prisma.service', () => {
  return {
    PrismaService: jest.fn().mockImplementation(() => {
      return {
        transaction: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'tx_1',
              direction: 'incoming',
              amount: 5000,
              senderName: 'Alice',
              status: 'confirmed',
              reference: 'REF1',
              createdAt: new Date('2026-07-01T12:00:00Z'),
            },
            {
              id: 'tx_2',
              direction: 'outgoing',
              amount: 3000,
              recipientName: 'Supplier Bob',
              status: 'pending',
              reference: 'REF2',
              createdAt: new Date('2026-07-02T14:00:00Z'),
            },
          ]),
        },
      };
    }),
  };
});

import { PrismaService } from '../src/prisma/prisma.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionsService, PrismaService],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTransactions', () => {
    it('should query merchant transaction log and map status', async () => {
      const list = await service.getTransactions('merchant_123');
      expect(list.length).toBe(2);
      expect(list[0].id).toBe('tx_1');
      expect(list[0].status).toBe('successful');
      expect(list[1].status).toBe('pending');
      expect(prisma.transaction.findMany).toHaveBeenCalled();
    });

    it('should compile query filter clauses if date query is set', async () => {
      await service.getTransactions('merchant_123', '2026-07-02');
      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });
});
