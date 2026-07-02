# Spec: ConfirmAm Backend API

## Objective
ConfirmAm is a hardware-free software POS built for Nigeria's transfer-first economy. The backend provides secure merchant authentication, dynamic virtual account generation through Nomba, transaction management, real-time payment confirmation via Server-Sent Events (SSE), and B2B payout capabilities using the Nomba Transfers API.

### Key Use Cases
1. **Merchant Registration & Login**: Merchants sign up with email, password, and business name. Upon registration, they obtain a JWT token.
2. **Merchant Profile**: Retrieve merchant credentials, business details, and linked payout/settlement accounts.
3. **Dynamic Virtual Account Creation**: When a payment session is initiated, the backend provisions a dynamic Nomba virtual account for the specific transaction amount, setting an expiry and expected amount.
4. **Real-time Webhook Processing**: Listen for Nomba `payment_success` webhooks, verify the HMAC-SHA256 signature, match the transaction in the database, and update its status.
5. **Real-time Notification (SSE)**: Stream transaction updates directly to connected merchant PWAs when status updates occur.
6. **B2B Bank Transfers**: Allow merchants to look up recipient account names and send money to other bank accounts using Nomba.
7. **Dashboard Summary**: Aggregate revenue, transaction counts, and pending amounts for the merchant dashboard.

---

## Tech Stack
- **Framework**: NestJS (v11)
- **Database ORM**: Prisma (v7) with PostgreSQL
- **Real-time**: Express Server-Sent Events (SSE)
- **Authentication**: JWT (`@nestjs/jwt`, `@nestjs/passport`)
- **Validation**: Zod & NestJS ValidationPipe
- **Integrations**: Nomba API (Sandbox/Production)

---

## Commands
- **Dev Server**: `pnpm --filter api start:dev` (runs with HMR / watch mode)
- **Database Push**: `pnpm --filter api prisma db push`
- **Build**: `pnpm --filter api build`
- **Lint**: `pnpm --filter api lint`
- **Test**: `pnpm --filter api test`

---

## Project Structure
We will structure the NestJS API application using standard domain-driven modules:
```
apps/api/src/
├── main.ts                       # Entrypoint (configures Cors, Global Pipes, Prefix)
├── app.module.ts                 # Main AppModule imports
├── prisma/                       # Prisma DB client module
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── common/                       # Shared guards, decorators, filters
│   ├── decorators/
│   │   └── current-merchant.decorator.ts
│   └── guards/
│       └── jwt.guard.ts
├── auth/                         # Merchant Authentication (Register, Login, Google)
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── jwt.strategy.ts
├── merchant/                     # Merchant Profile management
│   ├── merchant.module.ts
│   ├── merchant.controller.ts
│   └── merchant.service.ts
├── nomba/                        # Nomba Client Service (OAuth, VA, Bank Lookup, Bank Transfer)
│   ├── nomba.module.ts
│   ├── nomba.service.ts
│   └── nomba.types.ts
├── payments/                     # Payment Sessions & Webhooks & SSE
│   ├── payments.module.ts
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   └── sse.service.ts
├── transfers/                    # Bank list, account lookup, outbound transfers
│   ├── transfers.module.ts
│   ├── transfers.controller.ts
│   └── transfers.service.ts
└── dashboard/                    # Merchant dashboard metrics
    ├── dashboard.module.ts
    ├── dashboard.controller.ts
    └── dashboard.service.ts
```

---

## API Endpoints Definition

### 1. Authentication
* **`POST /api/auth/register`**
  - **Payload**: `{ "businessName": "Adeyemi Stores", "email": "merchant@confirmam.com", "password": "securepassword" }`
  - **Response**: `200 OK` `{ "token": "jwt-token-string", "user": { "email": "merchant@confirmam.com", "name": "Adeyemi Stores" } }`
* **`POST /api/auth/login`**
  - **Payload**: `{ "email": "merchant@confirmam.com", "password": "securepassword" }`
  - **Response**: `200 OK` `{ "token": "jwt-token-string", "user": { "email": "merchant@confirmam.com", "name": "Adeyemi Stores" } }`
* **`POST /api/auth/google`** (Google Login Mock/Bypass)
  - **Payload**: None
  - **Response**: `200 OK` `{ "token": "jwt-token-string", "user": { "email": "google-user@confirmam.com", "name": "Google User" } }`

### 2. Merchant Profile (JWT Protected)
* **`GET /api/merchant/profile`**
  - **Response**: `200 OK` `{ "id": "merchant-id", "name": "Adeyemi Stores", "location": "Lagos, NG", "virtualAccountNumber": "8123456790", "bankName": "ConfirmAm Bank" }`

### 3. Payments (JWT Protected except Webhooks)
* **`POST /api/payments/session`**
  - **Payload**: `{ "amount": 5000 }`
  - **Response**: `200 OK`
    ```json
    {
      "sessionId": "sess_xxxxxxx",
      "virtualAccountNumber": "9900012345",
      "bankName": "Nomba",
      "merchantName": "Adeyemi Stores",
      "amount": 5000,
      "qrCodeData": "confirmam://pay?merchantId=merchant_001&sessionId=sess_xxxxxxx&amount=5000",
      "expiresAt": "2026-07-02T06:47:00.000Z"
    }
    ```
* **`GET /api/payments/events`** (SSE Endpoint - Clients subscribe to this)
  - **Query Params**: `?merchantId=merchant-id`
  - **Response Headers**: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
  - **Broadcaster Event**: `payment_received` containing `PaymentEvent` payload:
    ```json
    {
      "sessionId": "sess_xxxxxxx",
      "amount": 5000,
      "senderName": "Adeyemi Daniels",
      "senderBank": "Nombank",
      "timestamp": "2026-07-02T06:33:00.000Z",
      "reference": "ref_xxxxxx"
    }
    ```
* **`POST /api/payments/webhook`** (Public Nomba Webhook Receiver)
  - **Headers**: `nomba-signature`, `nomba-timestamp`
  - **Payload**: Nomba payment webhook JSON structure.
  - **Signature Algorithm**: HMAC-SHA256 hash using the string `event_type:requestId:userId:walletId:transactionId:type:time:responseCode:timestamp` hashed with the configured `WEBHOOK_SECRET`.
  - **Response**: `200 OK` `{ "status": "processed" }`

### 4. Transactions (JWT Protected)
* **`GET /api/transactions`**
  - **Query Params**: `?date=YYYY-MM-DD` (optional)
  - **Response**: `200 OK` `Transaction[]`
    ```json
    [
      {
        "id": "tx_001",
        "direction": "incoming",
        "amount": 5000,
        "senderName": "Adeyemi",
        "timestamp": "2026-07-02T06:17:00.000Z",
        "status": "successful",
        "reference": "REF_001"
      }
    ]
    ```

### 5. Transfers (JWT Protected)
* **`GET /api/transfers/banks`**
  - **Response**: `200 OK` Bank list from Nomba:
    ```json
    [
      { "code": "044", "name": "Access Bank" },
      { "code": "057", "name": "Guaranty Trust Bank (GTBank)" }
    ]
    ```
* **`POST /api/transfers/resolve`**
  - **Payload**: `{ "bankCode": "044", "accountNumber": "1234567890" }`
  - **Response**: `200 OK` `{ "name": "Olumide Johnson" }`
* **`POST /api/transfers/send`**
  - **Payload**: `{ "recipientBank": "044", "recipientAccountNumber": "1234567890", "recipientName": "Olumide Johnson", "amount": 10000 }`
  - **Response**: `200 OK` `{ "reference": "ref_send_xxxx", "status": "successful", "timestamp": "2026-07-02T06:33:00.000Z" }`

### 6. Dashboard Metrics (JWT Protected)
* **`GET /api/dashboard/summary`**
  - **Response**: `200 OK` `{ "todayRevenue": 248500, "todayPaymentCount": 14, "yesterdayRevenue": 221000, "pendingAmount": 0, "averagePayment": 17750 }`
* **`GET /api/dashboard/top-customers`**
  - **Response**: `200 OK` `Customer[]`
* **`GET /api/dashboard/weekly-revenue`**
  - **Response**: `200 OK` `WeeklyBar[]`

---

## Code Style
- Use clean TypeScript with explicit types where appropriate.
- Follow NestJS injection patterns and controller/service separation.
- Structure API response payloads to match frontend expectations directly.
- Hash passwords using Node's native `crypto.scrypt` or PBKDF2.

---

## Testing Strategy
- Unit tests for Auth, NombaService, PaymentsService, and TransfersService using Jest.
- Mocking Nomba external HTTP calls to ensure reliable tests.
- E2E testing for webhook receipt and SSE broadcast triggers.

---

## Boundaries
- **Always do**: Validate input fields with class-validator/zod. Verify all incoming webhook request signatures using HMAC-SHA256 and the signature header.
- **Ask first**: Making changes to the database Prisma schema models, adding new external dependencies, changing CORS settings.
- **Never do**: Log client secrets, password hashes, or API private keys. Commit hardcoded credentials to repository.

---

## Success Criteria
1. **Working Auth Flow**: Register and login endpoints correctly validate password hashes and return JWT token.
2. **Dynamic Virtual Account Creation**: Creation of a payment session calls Nomba's `/v1/accounts/virtual` endpoint, stores the new transaction as `pending`, and returns the correct virtual account details.
3. **Webhook Verification & SSE Stream**:
   - Webhook callback endpoint verifies `nomba-signature`.
   - Validating webhook updates database transaction status to `confirmed`.
   - Connected SSE clients receive a real-time `payment_received` message containing the transaction details.
4. **Transfers Support**: Bank list retrieval, beneficiary lookup, and outbound transfer execution successfully communicate with Nomba.
5. **No Breakage of Mock Frontend**: Real endpoints behave identically to the mock fixtures when frontend mocks are disabled.

