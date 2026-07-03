import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import {
  NombaCreateVARequest,
  NombaCreateVAResponse,
  NombaBanksResponse,
  NombaLookupRequest,
  NombaLookupResponse,
  NombaTransferRequest,
  NombaTransferResponse,
  NombaTokenResponse,
  NombaCheckoutRequest,
  NombaCheckoutResponse,
  NombaVerifyCheckoutResponse,
  NombaRefundRequest,
  NombaRefundResponse,
} from './nomba.types';

/**
 * Service to orchestrate interactions with the external Nomba APIs.
 * Includes OAuth credentials acquisition, virtual account creation, bank retrieval,
 * account lookup, and outbound bank transfers.
 */
@Injectable()
export class NombaService {
  private readonly logger = new Logger(NombaService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {}

  /**
   * Retrieves a valid OAuth2 token to authorize Nomba API requests.
   * Caches token locally and refreshes it 5 minutes before expiration.
   * If credentials are not configured, falls back to a simulated token.
   *
   * @returns {Promise<string>} The active OAuth2 bearer token.
   * @throws {HttpException} If the external auth request fails.
   */
  async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      new Date() < this.tokenExpiresAt
    ) {
      return this.accessToken;
    }

    const baseUrl = process.env.NOMBA_BASE_URL || 'https://sandbox.nomba.com';
    const clientId = process.env.NOMBA_CLIENT_ID;
    const clientSecret = process.env.NOMBA_PRIVATE_KEY;
    const accountId = process.env.NOMBA_MAIN_ACCOUNT_ID;

    // Bypass external call if configuration is missing (useful for mock/dev state)
    if (!clientId || !clientSecret || !accountId) {
      this.logger.warn(
        'Nomba credentials missing in config. Generating a mock token.',
      );
      this.accessToken =
        'mock-access-token-' + Math.random().toString(36).substring(7);
      this.tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiry
      return this.accessToken;
    }

    try {
      const url = `${baseUrl}/v1/auth/token/issue`;
      this.logger.log(`Requesting Nomba access token from: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accountId: accountId,
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Nomba auth request failed: ${response.status} - ${errorText}`,
        );
        throw new HttpException(
          `Nomba Auth failed: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const body = (await response.json()) as NombaTokenResponse;
      if (body.code !== '00') {
        throw new HttpException(
          `Nomba API returned error code ${body.code}: ${body.description}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      this.accessToken = body.data.access_token;
      // Set expiration subtracting a 5-minute safety buffer
      const expDate = new Date(body.data.expiresAt);
      this.tokenExpiresAt = new Date(expDate.getTime() - 5 * 60 * 1000);

      this.logger.log('Nomba OAuth token successfully refreshed.');
      return this.accessToken;
    } catch (err) {
      this.logger.error('Failed to retrieve Nomba access token', err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Internal Nomba communication failure',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Creates a dynamic virtual account via Nomba.
   *
   * @param {NombaCreateVARequest} req Details of the virtual account.
   * @returns {Promise<NombaCreateVAResponse>} Response details of the provisioned account.
   * @throws {HttpException} If Nomba returns an error or fails.
   */
  async createVirtualAccount(
    req: NombaCreateVARequest,
  ): Promise<NombaCreateVAResponse> {
    const token = await this.getAccessToken();
    const baseUrl = process.env.NOMBA_BASE_URL || 'https://sandbox.nomba.com';
    const accountId = process.env.NOMBA_MAIN_ACCOUNT_ID || 'mock-account-id';

    if (this.accessToken && this.accessToken.startsWith('mock-')) {
      // Mock Sandbox Response
      this.logger.log(
        `[MOCK] Provisioning virtual account for ref: ${req.accountRef}`,
      );
      return {
        code: '00',
        description: 'SUCCESS',
        data: {
          createdAt: new Date().toISOString(),
          accountHolderId:
            'holder_mock_' + Math.random().toString(36).substring(7),
          accountRef: req.accountRef,
          bvn: req.bvn || '',
          accountName: req.accountName,
          currency: 'NGN',
          bankName: 'ConfirmAm Bank',
          bankAccountNumber:
            '990' + Math.floor(1000000 + Math.random() * 9000000).toString(),
          bankAccountName: req.accountName,
          expired: false,
        },
      };
    }

    try {
      const response = await fetch(`${baseUrl}/v1/accounts/virtual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          accountId: accountId,
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Nomba Virtual Account creation failed: ${response.status} - ${errorText}`,
        );
        throw new HttpException(
          `Nomba Virtual Account creation error: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const body = (await response.json()) as NombaCreateVAResponse;
      if (body.code !== '00') {
        throw new HttpException(
          `Nomba API returned error ${body.code}: ${body.description}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      return body;
    } catch (err) {
      this.logger.error('Failed to create virtual account', err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Failed to connect to Nomba Virtual Account API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves the list of supported payout banks from Nomba.
   *
   * @returns {Promise<NombaBanksResponse>} List of banks.
   * @throws {HttpException} If the external call fails.
   */
  async fetchBanks(): Promise<NombaBanksResponse> {
    const token = await this.getAccessToken();
    const baseUrl = process.env.NOMBA_BASE_URL || 'https://sandbox.nomba.com';
    const accountId = process.env.NOMBA_MAIN_ACCOUNT_ID || 'mock-account-id';

    if (this.accessToken && this.accessToken.startsWith('mock-')) {
      // Mock Sandbox Response
      return {
        code: '00',
        description: 'SUCCESS',
        message: 'SUCCESS',
        status: true,
        data: [
          { code: '044', name: 'Access Bank', nipCode: null, logo: '' },
          {
            code: '057',
            name: 'Guaranty Trust Bank (GTBank)',
            nipCode: null,
            logo: '',
          },
          {
            code: '011',
            name: 'First Bank of Nigeria',
            nipCode: null,
            logo: '',
          },
          { code: '058', name: 'Zenith Bank', nipCode: null, logo: '' },
          {
            code: '033',
            name: 'United Bank for Africa (UBA)',
            nipCode: null,
            logo: '',
          },
          { code: '035', name: 'Wema Bank', nipCode: null, logo: '' },
          { code: '50211', name: 'Kuda Bank', nipCode: null, logo: '' },
          { code: '999992', name: 'OPay', nipCode: null, logo: '' },
          { code: '999991', name: 'PalmPay', nipCode: null, logo: '' },
          { code: '50515', name: 'Moniepoint MFB', nipCode: null, logo: '' },
        ],
      };
    }

    try {
      const response = await fetch(`${baseUrl}/v1/transfers/bank`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: accountId,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Nomba Fetch Banks failed: ${response.status} - ${errorText}`,
        );
        throw new HttpException(
          `Nomba Fetch Banks error: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const body = (await response.json()) as NombaBanksResponse;
      if (body.code !== '00') {
        throw new HttpException(
          `Nomba Fetch Banks API returned error ${body.code}: ${body.description || body.message}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      return body;
    } catch (err) {
      this.logger.error('Failed to fetch banks', err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Failed to connect to Nomba Transfers Banks API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Resolves a bank account number to retrieve the recipient's registered account name.
   *
   * @param {NombaLookupRequest} req The lookup parameters (bankCode, accountNumber).
   * @returns {Promise<NombaLookupResponse>} Resolved account name details.
   * @throws {HttpException} If resolution fails or is not found.
   */
  async lookupAccount(req: NombaLookupRequest): Promise<NombaLookupResponse> {
    const token = await this.getAccessToken();
    const baseUrl = process.env.NOMBA_BASE_URL || 'https://sandbox.nomba.com';
    const accountId = process.env.NOMBA_MAIN_ACCOUNT_ID || 'mock-account-id';

    if (this.accessToken && this.accessToken.startsWith('mock-')) {
      // Mock Sandbox Response
      const names: Record<string, string> = {
        '8123456790': 'Adeyemi Stores',
        '1234567890': 'Olumide Johnson',
        '0987654321': 'Grace Chinedu',
        '1112223334': 'Kelechi Nwosu',
        '5556667778': 'Fatima Bello',
      };
      const name = names[req.accountNumber] || 'Simulated Recipient';
      return {
        code: '00',
        description: 'Success',
        data: {
          accountNumber: req.accountNumber,
          accountName: name,
        },
      };
    }

    try {
      const response = await fetch(`${baseUrl}/v1/transfers/bank/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          accountId: accountId,
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Nomba Bank Lookup failed: ${response.status} - ${errorText}`,
        );
        throw new HttpException(
          `Verification failed. Verify the details and try again.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const body = (await response.json()) as NombaLookupResponse;
      if (body.code !== '00') {
        throw new HttpException(
          `Unable to verify account: ${body.description}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return body;
    } catch (err) {
      this.logger.error('Failed to resolve account name', err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Failed to connect to Nomba Bank Lookup API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Performs an outbound transfer from the parent merchant account to a bank account.
   *
   * @param {NombaTransferRequest} req The transfer payload details.
   * @returns {Promise<NombaTransferResponse>} Details of the created payout request.
   * @throws {HttpException} If the payout execution fails.
   */
  async performTransfer(
    req: NombaTransferRequest,
  ): Promise<NombaTransferResponse> {
    const token = await this.getAccessToken();
    const baseUrl = process.env.NOMBA_BASE_URL || 'https://sandbox.nomba.com';
    const accountId = process.env.NOMBA_MAIN_ACCOUNT_ID || 'mock-account-id';

    if (this.accessToken && this.accessToken.startsWith('mock-')) {
      // Mock Sandbox Response
      return {
        code: '00',
        description: 'Success',
        data: {
          amount: req.amount,
          fee: 50,
          timeCreated: new Date().toISOString(),
          id: 'mock_tx_send_' + Math.random().toString(36).substring(7),
          type: 'transfer',
          status: 'SUCCESS',
          meta: {
            merchantTxRef: req.merchantTxRef,
          },
        },
      };
    }

    try {
      const response = await fetch(`${baseUrl}/v2/transfers/bank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          accountId: accountId,
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Nomba Bank Transfer failed: ${response.status} - ${errorText}`,
        );
        throw new HttpException(
          `Bank Transfer failed: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const body = (await response.json()) as NombaTransferResponse;
      if (body.code !== '00') {
        throw new HttpException(
          `Nomba API returned error ${body.code}: ${body.description || body.message}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      return body;
    } catch (err) {
      this.logger.error('Failed to execute bank transfer', err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Failed to connect to Nomba Outbound Transfer API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Creates an online checkout order via Nomba.
   *
   * @param {NombaCheckoutRequest} req Details of the checkout order.
   * @returns {Promise<NombaCheckoutResponse>} The created checkout details.
   */
  async createCheckoutOrder(
    req: NombaCheckoutRequest,
  ): Promise<NombaCheckoutResponse> {
    const token = await this.getAccessToken();
    const baseUrl = process.env.NOMBA_BASE_URL || 'https://sandbox.nomba.com';
    const accountId = process.env.NOMBA_MAIN_ACCOUNT_ID || 'mock-account-id';

    if (this.accessToken && this.accessToken.startsWith('mock-')) {
      this.logger.log(`[MOCK] Creating online checkout order for amount: ${req.order.amount}`);
      return {
        code: '00',
        description: 'Success',
        data: {
          checkoutLink: `https://checkout.nomba.com/sandbox/mock_${req.order.orderReference || Math.random().toString(36).substring(7)}`,
          orderReference: req.order.orderReference || 'mock_ref_' + Math.random().toString(36).substring(7),
        },
      };
    }

    try {
      const response = await fetch(`${baseUrl}/v1/checkout/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          accountId: accountId,
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Nomba Checkout Order creation failed: ${response.status} - ${errorText}`,
        );
        throw new HttpException(
          `Checkout Order creation error: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const body = (await response.json()) as NombaCheckoutResponse;
      if (body.code !== '00') {
        throw new HttpException(
          `Nomba API returned error ${body.code}: ${body.description}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      return body;
    } catch (err) {
      this.logger.error('Failed to create checkout order', err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Failed to connect to Nomba Checkout Order API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Confirms a checkout transaction details based on order reference.
   *
   * @param {string} orderReference Unique reference code.
   * @param {string} orderId Unique id code.
   * @returns {Promise<NombaVerifyCheckoutResponse>} Response transaction receipt details.
   */
  async confirmCheckoutTransaction(
    orderReference: string,
  ): Promise<NombaVerifyCheckoutResponse> {
    const token = await this.getAccessToken();
    const baseUrl = process.env.NOMBA_BASE_URL || 'https://sandbox.nomba.com';
    const accountId = process.env.NOMBA_MAIN_ACCOUNT_ID || 'mock-account-id';

    if (this.accessToken && this.accessToken.startsWith('mock-')) {
      this.logger.log(`[MOCK] Confirming checkout transaction for reference: ${orderReference}`);
      return {
        code: '00',
        description: 'Success',
        status: true,
        data: {
          orderId: 'mock_order_id_' + Math.random().toString(36).substring(7),
          orderReference: orderReference,
          amount: 1000,
          currency: 'NGN',
          id: '',
          status: '',
          source: '',
          fixedCharge: '',
          gatewayMessage: '',
          type: '',
          customerBillerId: '',
          accountId: '',
          customerEmail: '',
          customerId: '',
          callbackUrl: '',
          timeCreated: '',
          timeUpdated: '',
          paymentVendorReference: '',
          billingVendorReference: '',
          senderName: '',
          userId: '',
          onlineCheckoutCardPanLast4Digits: '',
          onlineCheckoutOrderId: '',
          onlineCheckoutTokenizedCardPayment: '',
          onlineCheckoutOrderReference: '',
          onlineCheckoutCurrency: '',
          responseCode: '',
          onlineCheckoutPaymentMethod: '',
          merchantTxRef: '',
          productId: '',
          onlineCheckoutCardType: ''
        },
      };
    }

    try {
      const url = `${baseUrl}/v1/transactions/accounts/single?orderReference=${encodeURIComponent(orderReference)}`;
      const response = await fetch(
        url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            accountId: accountId,
          }
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Nomba Confirm Checkout failed: ${response.status} - ${errorText}`,
        );
        throw new HttpException(
          `Confirm Checkout error: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const body = (await response.json()) as NombaVerifyCheckoutResponse;
      if (body.code !== '00') {
        throw new HttpException(
          `Nomba API returned error ${body.code}: ${body.description}`,
          HttpStatus.BAD_GATEWAY,
        );
      }
      return body;
    } catch (err) {
      this.logger.error('Failed to confirm checkout transaction', err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Failed to connect to Nomba Confirm Checkout API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Process a full or partial refund for a completed checkout transaction.
   *
   * @param {NombaRefundRequest} req The refund parameters.
   * @returns {Promise<NombaRefundResponse>} Successful refund status.
   */
  async refundCheckoutOrder(
    req: NombaRefundRequest,
  ): Promise<NombaRefundResponse> {
    const token = await this.getAccessToken();
    const baseUrl = process.env.NOMBA_BASE_URL || 'https://sandbox.nomba.com';
    const accountId = process.env.NOMBA_MAIN_ACCOUNT_ID || 'mock-account-id';

    if (this.accessToken && this.accessToken.startsWith('mock-')) {
      this.logger.log(`[MOCK] Refunding checkout order for transaction: ${req.transactionId}`);
      return {
        code: '00',
        description: 'Success',
        data: {
          success: true,
          message: 'Refund processed successfully',
        },
      };
    }

    try {
      const response = await fetch(`${baseUrl}/v1/checkout/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          accountId: accountId,
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Nomba Refund Checkout failed: ${response.status} - ${errorText}`,
        );
        throw new HttpException(
          `Refund Checkout error: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const body = (await response.json()) as NombaRefundResponse;
      if (body.code !== '00') {
        throw new HttpException(
          `Nomba API returned error ${body.code}: ${body.description}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      return body;
    } catch (err) {
      this.logger.error('Failed to refund checkout order', err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Failed to connect to Nomba Refund Checkout API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
