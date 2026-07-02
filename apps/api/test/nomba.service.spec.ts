import { Test, TestingModule } from '@nestjs/testing';
import { NombaService } from '../src/nomba/nomba.service';

describe('NombaService', () => {
  let service: NombaService;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    // Clear out credentials to force simulated mock fallbacks during tests
    delete process.env.NOMBA_CLIENT_ID;
    delete process.env.NOMBA_PRIVATE_KEY;
    delete process.env.NOMBA_MAIN_ACCOUNT_ID;
    process.env.NOMBA_BASE_URL = 'https://sandbox.nomba.com';

    const module: TestingModule = await Test.createTestingModule({
      providers: [NombaService],
    }).compile();

    service = module.get<NombaService>(NombaService);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccessToken', () => {
    it('should fallback to mock token if credentials are missing', async () => {
      const token = await service.getAccessToken();
      expect(token).toContain('mock-access-token');
    });

    it('should return cached token if not expired', async () => {
      const firstToken = await service.getAccessToken();
      const secondToken = await service.getAccessToken();
      expect(firstToken).toBe(secondToken);
    });
  });

  describe('createVirtualAccount', () => {
    it('should return a simulated virtual account in dev/mock mode', async () => {
      const res = await service.createVirtualAccount({
        accountRef: 'ref_123',
        accountName: 'Test Account',
      });
      expect(res.code).toBe('00');
      expect(res.data.accountRef).toBe('ref_123');
      expect(res.data.bankName).toBe('ConfirmAm Bank');
      expect(res.data.bankAccountNumber).toBeDefined();
    });
  });

  describe('lookupAccount', () => {
    it('should resolve pre-defined merchant name in mock mode', async () => {
      const res = await service.lookupAccount({
        accountNumber: '8123456790',
        bankCode: '011',
      });
      expect(res.code).toBe('00');
      expect(res.data.accountName).toBe('Adeyemi Stores');
    });
  });

  describe('performTransfer', () => {
    it('should simulate transfer creation and return success status', async () => {
      const res = await service.performTransfer({
        amount: 500,
        accountNumber: '1234567890',
        accountName: 'John Doe',
        bankCode: '044',
        merchantTxRef: 'ref_send_tx',
        senderName: 'ConfirmAm Merchant',
      });
      expect(res.code).toBe('00');
      expect(res.data.status).toBe('SUCCESS');
    });
  });
});
