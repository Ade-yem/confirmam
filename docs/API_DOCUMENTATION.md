# ConfirmAm Backend API Documentation

Welcome to the ConfirmAm API documentation. This document describes the backend endpoints, payload structures, authentication flow, and real-time Server-Sent Events (SSE) interfaces.

---

## 1. General Setup & Authentication

### Base URL
- **Local Development**: `http://localhost:3000` (or as configured in `apps/api`)
- **Headers**: All JSON requests must send:
  ```http
  Content-Type: application/json
  ```

### Authentication Header
Endpoints marked with **[🔒 Auth Required]** require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 2. Authentication Endpoints (`/auth`)

### Register Merchant
Create a new merchant account.
- **Route**: `POST /auth/register`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "merchant@example.com",
    "password": "SecurePassword123",
    "name": "Adeyemi Stores"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "email": "merchant@example.com",
      "name": "Adeyemi Stores"
    }
  }
  ```

### Login Merchant
Authenticate using email and password.
- **Route**: `POST /auth/login`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "merchant@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "email": "merchant@example.com",
      "name": "Adeyemi Stores"
    }
  }
  ```

### Google OAuth Verification
Verifies a Google credential token (ID token) obtained by the frontend (SSO client).
- **Route**: `POST /auth/google/verify`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "credential": "google_credential_id_token_jwt..."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "email": "merchant@example.com",
      "name": "Adeyemi Stores"
    }
  }
  ```

---

## 3. Dashboard Endpoints (`/dashboard`)

### Retrieve Summary Metrics
- **Route**: `GET /dashboard/summary`
- **Auth**: **[🔒 Auth Required]**
- **Response** (`200 OK` - matches `DashboardSummary`):
  ```json
  {
    "todayRevenue": 248500,
    "todayPaymentCount": 14,
    "yesterdayRevenue": 221000,
    "pendingAmount": 0,
    "averagePayment": 17750
  }
  ```

### Retrieve Top Customers
- **Route**: `GET /dashboard/top-customers`
- **Auth**: **[🔒 Auth Required]**
- **Response** (`200 OK` - array of `Customer`):
  ```json
  [
    {
      "id": "c_1",
      "name": "Adeyemi",
      "paymentCount": 5,
      "totalSpent": 75000
    }
  ]
  ```

### Retrieve Weekly Revenue Chart Data
- **Route**: `GET /dashboard/weekly-revenue`
- **Auth**: **[🔒 Auth Required]**
- **Response** (`200 OK` - array of `WeeklyBar`):
  ```json
  [
    { "day": "Sun", "amount": 0 },
    { "day": "Mon", "amount": 45000 },
    { "day": "Tue", "amount": 120000 },
    { "day": "Wed", "amount": 35000 },
    { "day": "Thu", "amount": 248500 }
  ]
  ```

---

## 4. Payments & Event Streaming

### Create Payment Session
Initiates a new payment request and provisions a temporary virtual account.
- **Route**: `POST /payments/session`
- **Auth**: **[🔒 Auth Required]**
- **Request Body**:
  ```json
  {
    "amount": 5000
  }
  ```
- **Response** (`201 Created` - matches `PaymentSession`):
  ```json
  {
    "sessionId": "tx_abc123xyz",
    "virtualAccountNumber": "9901234567",
    "bankName": "Nomba Bank",
    "merchantName": "Adeyemi Stores",
    "amount": 5000,
    "expiresAt": "2026-07-02T15:37:07.000Z"
  }
  ```
  > [!NOTE]
  > The virtual account expires exactly 1 hour from creation.
  > The frontend is responsible for constructing the QR deep link payload using this data:
  > `confirmam://pay?merchantId=${merchantId}&sessionId=${sessionId}&amount=${amount}`

### Server-Sent Events (SSE) Stream
Listen for real-time payment confirmations.
- **Route**: `GET /payments/stream`
- **Auth**: Public (connection validation uses query-params/headers depending on EventSource implementation)
- **Response Type**: `text/event-stream`
- **Data payload**:Pushes messages under event name `payment_received`. The payload matches the `PaymentEvent` type:
  ```json
  {
    "sessionId": "tx_abc123xyz",
    "amount": 5000,
    "senderName": "John Doe",
    "senderBank": "Guaranty Trust Bank",
    "timestamp": "2026-07-02T14:40:00.000Z",
    "reference": "NOMBA_REF_123456"
  }
  ```

---

## 5. Transfers & Payouts (`/transfers`)

### Get Supported Banks List
- **Route**: `GET /transfers/banks`
- **Auth**: **[🔒 Auth Required]**
- **Response** (`200 OK` - array of `Bank`):
  ```json
  [
    { "code": "058", "name": "Guaranty Trust Bank" },
    { "code": "011", "name": "First Bank of Nigeria" }
  ]
  ```

### Resolve Account Name
Lookup recipient name by account number and bank.
- **Route**: `POST /transfers/resolve`
- **Auth**: **[🔒 Auth Required]**
- **Request Body**:
  ```json
  {
    "bankCode": "058",
    "accountNumber": "0123456789"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "name": "JOHN DOE"
  }
  ```

### Send Money / Payout
Execute outbound transfer.
- **Route**: `POST /transfers/send`
- **Auth**: **[🔒 Auth Required]**
- **Request Body** (matches `SendMoneyPayload`):
  ```json
  {
    "recipientBank": "Guaranty Trust Bank",
    "recipientAccountNumber": "0123456789",
    "recipientName": "JOHN DOE",
    "amount": 15000
  }
  ```
- **Response** (`201 Created` - matches `TransferResult`):
  ```json
  {
    "reference": "payout_tx_992384218",
    "status": "successful",
    "timestamp": "2026-07-02T14:42:15.000Z"
  }
  ```

---

## 6. Transactions (`/transactions`)

### Retrieve Transaction Logs
Fetch historical logs of incoming payments and outgoing transfers.
- **Route**: `GET /transactions`
- **Auth**: **[🔒 Auth Required]**
- **Query Parameters**:
  - `date` *(optional)*: Filter for a specific day in `YYYY-MM-DD` format.
- **Response** (`200 OK` - array of `Transaction`):
  ```json
  [
    {
      "id": "tx_abc123xyz",
      "direction": "incoming",
      "amount": 5000,
      "senderName": "John Doe",
      "timestamp": "2026-07-02T14:40:00.000Z",
      "status": "successful",
      "reference": "NOMBA_REF_123456"
    },
    {
      "id": "payout_tx_992384218",
      "direction": "outgoing",
      "amount": 15000,
      "recipientName": "JOHN DOE",
      "recipientBank": "Guaranty Trust Bank",
      "timestamp": "2026-07-02T14:42:15.000Z",
      "status": "successful",
      "reference": "payout_tx_992384218"
    }
  ]
  ```

---

## 7. Webhook Endpoint (`/payments/webhook`)

Used by the Nomba API callback trigger.
- **Route**: `POST /payments/webhook`
- **Auth**: Verified via header signature verification (Nomba key/HMAC validation)
- **Expected Payload** (matches `NombaWebhookPayload`):
  ```json
  {
    "event": "payment.success",
    "data": {
      "reference": "internal_transaction_ref_123",
      "amount": 5000,
      "accountNumber": "9901234567",
      "status": "success",
      "settledAt": "2026-07-02T14:40:00.000Z"
    }
  }
  ```
