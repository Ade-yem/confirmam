import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../src/dashboard/dashboard.service';

// Mock the PrismaService class and module completely to prevent loading generated ESM Prisma files in Jest
jest.mock('../src/prisma/prisma.service', () => {
  return {
    PrismaService: jest.fn().mockImplementation(() => {
      return {
        transaction: {
          aggregate: jest.fn().mockResolvedValue({
            _sum: { amount: 10000 },
            _count: { id: 5 },
            _avg: { amount: 2000 },
          }),
          groupBy: jest.fn().mockResolvedValue([
            { senderName: 'Alice', _sum: { amount: 6000 }, _count: { id: 3 } },
            { senderName: 'Bob', _sum: { amount: 4000 }, _count: { id: 2 } },
          ]),
        },
      };
    }),
  };
});

import { PrismaService } from '../src/prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, PrismaService],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('should aggregate metrics correctly', async () => {
      const summary = await service.getSummary('merchant_123');
      expect(summary.todayRevenue).toBe(10000);
      expect(summary.todayPaymentCount).toBe(5);
      expect(summary.averagePayment).toBe(2000);
      expect(prisma.transaction.aggregate).toHaveBeenCalledTimes(4);
    });
  });

  describe('getTopCustomers', () => {
    it('should aggregate and map customer transaction summaries', async () => {
      const customers = await service.getTopCustomers('merchant_123');
      expect(customers.length).toBe(2);
      expect(customers[0].name).toBe('Alice');
      expect(customers[0].totalSpent).toBe(6000);
      expect(prisma.transaction.groupBy).toHaveBeenCalled();
    });
  });

  describe('getWeeklyRevenue', () => {
    it('should compile a rolling 7-day revenue array', async () => {
      const weekly = await service.getWeeklyRevenue('merchant_123');
      expect(weekly.length).toBe(7);
      expect(weekly[0].day).toBeDefined();
      expect(weekly[0].amount).toBe(10000);
      expect(prisma.transaction.aggregate).toHaveBeenCalledTimes(7);
    });
  });
});
