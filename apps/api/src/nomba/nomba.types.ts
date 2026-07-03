/**
 * Representation of the access token response from Nomba OAuth API.
 */
export interface NombaTokenResponse {
  code: string;
  description: string;
  data: {
    access_token: string;
    expiresAt: string; // ISO timestamp
  };
}

/**
 * Payload parameters required to create a Nomba virtual account.
 */
export interface NombaCreateVARequest {
  accountRef: string;
  accountName: string;
  bvn?: string;
  expiryDate?: string;
  expectedAmount?: number;
}

/**
 * Response structure when a virtual account is successfully provisioned.
 */
export interface NombaCreateVAResponse {
  code: string;
  description: string;
  data: {
    createdAt: string;
    accountHolderId: string;
    accountRef: string;
    bvn: string;
    accountName: string;
    currency: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    callbackUrl?: string;
    expired: boolean;
  };
}

/**
 * Represents a single bank returned by Nomba's bank list API.
 */
export interface NombaBank {
  name: string;
  code: string;
  nipCode: string | null;
  logo: string;
}

/**
 * Nomba bank list response.
 */
export interface NombaBanksResponse {
  code: string;
  description: string;
  message: string;
  status: boolean;
  data: NombaBank[];
}

/**
 * Payload required for performing account name resolution.
 */
export interface NombaLookupRequest {
  accountNumber: string;
  bankCode: string;
}

/**
 * Response returned from the bank account lookup endpoint.
 */
export interface NombaLookupResponse {
  code: string;
  description: string;
  data: {
    accountNumber: string;
    accountName: string;
  };
}

/**
 * Payload parameters required to execute an outbound bank transfer.
 */
export interface NombaTransferRequest {
  amount: number;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  merchantTxRef: string; // Idempotency key
  senderName: string;
  narration?: string;
}

/**
 * Response details from executing a transfer via Nomba.
 */
export interface NombaTransferResponse {
  code: string;
  description: string;
  status?: boolean;
  message?: string;
  data: {
    amount: number | string;
    fee: number;
    timeCreated: string;
    id: string;
    type: string;
    status: string; // SUCCESS, PENDING_BILLING, etc.
    meta?: {
      merchantTxRef: string;
      api_client_id?: string;
      api_account_id?: string;
      rrn?: string;
    };
  };
}

/**
 * Payload parameters required to create an online checkout order.
 */
export interface NombaCheckoutRequest {
  order: {
    amount: string;
    currency: string;
    callbackUrl: string;
    customerEmail?: string;
    orderReference?: string;
  };
}

/**
 * Response structure when a checkout order is created.
 */
export interface NombaCheckoutResponse {
  code: string;
  description: string;
  data: {
    checkoutLink: string;
    orderReference: string;
  };
}

/**
 * Response structure when fetching checkout transaction/order details.
 */
export interface NombaVerifyCheckoutResponse {
  code: string;
  description: string;
  status: boolean;
  data: {
    id: string;
    amount: number;
    status: string;
    source: string;
    fixedCharge: string;
    gatewayMessage: string;
    type: string;
    customerBillerId: string;
    accountId: string;
    orderId: string;
    customerEmail: string;
    customerId: string;
    orderReference: string;
    callbackUrl: string;
    currency: string;
    timeCreated: string;
    timeUpdated: string;
    paymentVendorReference: string;
    billingVendorReference: string;
    senderName: string;
    userId: string;
    onlineCheckoutCardPanLast4Digits: string;
    onlineCheckoutOrderId: string;
    onlineCheckoutTokenizedCardPayment: string;
    onlineCheckoutOrderReference: string;
    onlineCheckoutCurrency: string;
    responseCode: string;
    onlineCheckoutPaymentMethod: string;
    merchantTxRef: string;
    productId: string;
    onlineCheckoutCardType: string;
  }

}

/**
 * Payload parameters required to refund a checkout order.
 */
export interface NombaRefundRequest {
  transactionId: string;
  amount?: number;
}

/**
 * Response structure when a refund is requested.
 */
export interface NombaRefundResponse {
  code: string;
  description: string;
  status?: boolean;
  data?: {
    success: boolean;
    message: string;
  };
}
