import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from '../src/transfers/transfers.service';
import { NombaService } from '../src/nomba/nomba.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock the PrismaService class and module completely to prevent loading generated ESM Prisma files in Jest
jest.mock('../src/prisma/prisma.service', () => {
  return {
    PrismaService: jest.fn().mockImplementation(() => {
      return {
        merchant: {
          findUnique: jest.fn(),
        },
        transaction: {
          create: jest.fn(),
          update: jest.fn(),
        },
      };
    }),
  };
});

import { PrismaService } from '../src/prisma/prisma.service';

describe('TransfersService', () => {
  let service: TransfersService;
  let prisma: PrismaService;
  let nomba: NombaService;

  const mockNombaService = {
    fetchBanks: jest.fn().mockResolvedValue({
      code: '00',
      data: [{ bankCode: '011', bankName: 'First Bank' }],
    }),
    lookupAccount: jest.fn().mockResolvedValue({
      code: '00',
      data: { accountName: 'Test Resolved User' },
    }),
    performTransfer: jest.fn().mockResolvedValue({
      code: '00',
      data: { status: 'SUCCESS', paymentId: 'payout_tx_123' },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        PrismaService,
        { provide: NombaService, useValue: mockNombaService },
      ],
    }).compile();

    service = module.get<TransfersService>(TransfersService);
    prisma = module.get<PrismaService>(PrismaService);
    nomba = module.get<NombaService>(NombaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBanks', () => {
    it('should query banks list from Nomba', async () => {
      const res = await service.getBanks();
      expect(res.data.length).toBe(1);
      expect(nomba.fetchBanks).toHaveBeenCalled();
    });
  });

  describe('resolveAccount', () => {
    it('should throw if bank code or account number is missing', async () => {
      await expect(service.resolveAccount('', '123')).rejects.toThrow(BadRequestException);
    });

    it('should query account name lookup from Nomba', async () => {
      const res = await service.resolveAccount('011', '8123456789');
      expect(res.name).toBe('Test Resolved User');
      expect(nomba.lookupAccount).toHaveBeenCalledWith({
        bankCode: '011',
        accountNumber: '8123456789',
      });
    });
  });

  describe('sendTransfer', () => {
    it('should throw if amount is negative or zero', async () => {
      await expect(
        service.sendTransfer('merchant_123', {
          amount: 0,
          recipientBank: '011',
          recipientAccountNumber: '8123',
          recipientName: 'John',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if merchant profile is missing', async () => {
      (prisma.merchant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.sendTransfer('merchant_123', {
          amount: 500,
          recipientBank: '011',
          recipientAccountNumber: '8123',
          recipientName: 'John',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should register transaction, submit transfer to Nomba, and update status', async () => {
      (prisma.merchant.findUnique as jest.Mock).mockResolvedValue({
        id: 'merchant_123',
        name: 'Test Merchant',
      });
      (prisma.transaction.create as jest.Mock).mockResolvedValue({
        id: 'tx_123',
        reference: 'TX_OUT_REF',
        amount: 5000,
        createdAt: new Date(),
      });
      (prisma.transaction.update as jest.Mock).mockResolvedValue({
        id: 'tx_123',
        status: 'confirmed',
      });

      const res = await service.sendTransfer('merchant_123', {
        amount: 5000,
        recipientBank: '011',
        recipientAccountNumber: '8123456789',
        recipientName: 'Ade John',
      });

      expect(res.reference).toBe('TX_OUT_REF');
      expect(res.status).toBe('successful');
      expect(prisma.transaction.create).toHaveBeenCalled();
      expect(nomba.performTransfer).toHaveBeenCalledWith({
        amount: 5000,
        bankCode: '011',
        accountNumber: '8123456789',
        accountName: 'Ade John',
        merchantTxRef: 'TX_OUT_REF',
        senderName: 'Test Merchant',
      });
      expect(prisma.transaction.update).toHaveBeenCalled();
    });
  });
});
