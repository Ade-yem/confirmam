import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';

// Mock the PrismaService class and module completely to prevent loading generated ESM Prisma files in Jest
jest.mock('../src/prisma/prisma.service', () => {
  return {
    PrismaService: jest.fn().mockImplementation(() => {
      return {
        merchant: {
          findUnique: jest.fn(),
          create: jest.fn(),
        },
      };
    }),
  };
});

import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PrismaService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw if merchant exists', async () => {
      (prisma.merchant.findUnique as jest.Mock).mockResolvedValue({ id: 'exists' });
      await expect(
        service.register('Test', 'test@example.com', 'pass'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create merchant and return token', async () => {
      (prisma.merchant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.merchant.create as jest.Mock).mockResolvedValue({
        id: 'new-id',
        email: 'test@example.com',
        name: 'Test Business',
      });

      const res = await service.register('Test Business', 'test@example.com', 'password123');
      expect(res.token).toBe('mocked-token');
      expect(res.user.name).toBe('Test Business');
      expect(prisma.merchant.create).toHaveBeenCalled();
    });
  });
});
