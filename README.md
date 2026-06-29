# ConfirmAm

> **Know your payment landed before anyone has to ask.**
> 
> *DevCareer × Nomba Hackathon | Build Track: Virtual Accounts as Infrastructure*

---

## 1. Overview & Problem Statement

Every day, thousands of Nigerian merchants encounter the same moment of uncertainty: a customer says the money has been sent, and business quietly comes to a halt. The merchant checks their SMS alerts, refreshes their banking application, asks for a screenshot, or calls out to someone nearby to verify the transfer. For a few awkward seconds, the transaction is suspended in ambiguity.

In a country where bank transfers have become the dominant method of payment, the transfer itself is no longer the challenge—**payment confirmation is**.

Traditional card-based POS terminals resolved this years ago with an audible beep and a physical receipt. But for the millions of merchants who now rely on bank transfers, no equivalent experience exists. They are left managing personal phones, delayed SMS notifications, and manual reconciliation. 

**ConfirmAm** is a software-only POS built for Nigeria's transfer-first economy. It transforms any smartphone into an intelligent payment terminal that instantly verifies bank transfers through Nomba's real-time payment infrastructure, giving merchants the speed and confidence of a traditional POS without requiring dedicated hardware.

---

## 2. Product Architecture & Technical Stack

ConfirmAm is engineered using an asynchronous, event-driven architecture designed for low latency, high resilience, and offline-first accessibility.


```
                 [Customer Initiates Transfer]
                               │
                               ▼
         [Nomba Virtual Account / Transfer API Rails]
                               │
                               ▼ (Instant Webhook Event)
                 [NestJS Backend Platform]
                               │
             ┌─────────────────┴─────────────────┐
             ▼ (Verify and Persist)              ▼ (Publish Event)
   [PostgreSQL + Redis]               [Server-Sent Events Stream]
             │                                   │
  (BullMQ Background Jobs)                       ▼ (Auto-Pushed over HTTP)
                                        [React PWA Merchant App]
                                                 │
                                                 ▼ (Local Audio Trigger)
                                 [Browser Speech Synthesis Engine]
                                                 │
                                                 ▼
                                [Voice Confirmation + Live UI Update]

```



### Core Technologies
*   **Frontend Tier:** React with Vite, TypeScript, Tailwind CSS, shadcn/ui, and Lucide Icons.
*   **Backend Tier:** NestJS (TypeScript), Prisma ORM, PostgreSQL, Redis, and BullMQ.
*   **Real-Time Layer:** Server-Sent Events (SSE) for low-bandwidth, unidirectional real-time data streaming.
*   **Payment Infrastructure:** Nomba Dedicated Virtual Accounts, Webhooks, Collections, Transfers, and Bank Resolution APIs.

---

## 3. Monorepo Repository Structure

This workspace is managed as a high-performance **pnpm monorepo**:


```

confirmam/
├── apps/
│   ├── api/                 # NestJS Event-Driven Transaction Backend
│   │   ├── prisma/          # Database schema definition & migrations
│   │   └── src/             # Modules for webhooks, SSE streaming, and transfers
│   └── web/                 # React + Vite Progressive Web Application (PWA)
│       ├── public/          # Static icons & PWA assets
│       └── src/             # UI, Service workers, and Speech Synthesis engine
├── packages/
│   └── types/               # Shared TypeScript data structures & contracts
├── pnpm-workspace.yaml      # Monorepo workspace configuration
├── postgres-docker-compose.yml # Dev environment local database & caching orchestration
└── pnpm-lock.yaml           # Unified workspace lockfile

```

---

## 4. Key Operational Features

*   **Hands-Free Voice Confirmation:** Utilizes the native Browser Speech Synthesis API to announce successful payments locally (e.g., *"Payment of ₦2,500 received from Adeyemi"*), completely eliminating the need to tap, touch, or refresh screens.
*   **Dynamic Virtual Accounts & QR Codes:** Instantly provisions unique, short-lived virtual accounts and matching QR layouts mapped to specific transaction amounts via Nomba's APIs.
*   **Offline-First Resilience:** Built as a Progressive Web App (PWA) using Service Workers and Workbox to allow instant layout rendering and structural access to historical transaction ledgers through IndexedDB even when network signals completely drop.
*   **Outbound Supplier Payments:** Features direct B2B settlements utilizing the Nomba Transfers and Bank Resolution APIs, allowing vendors to handle supplier cash-outs directly from collected pool balances safely.

---

## 5. Development Getting Started Guide

### Prerequisites
Ensure you have the following installed locally:
*   Node.js (v18+ recommended)
*   pnpm (`npm install -g pnpm`)
*   Docker (for background databases/queues)

### 1. Environment Setup
Clone the repository and copy the environment template root file:
```bash
cp .env.example .env

```

Fill out your specific **Nomba Sandbox/Production API keys**, JWT credentials, database secrets, and Redis connection blocks.

### 2. Install Project Workspace Dependencies

Run the following from the workspace root to install all app packages and link the shared modules:

```bash
pnpm install

```

### 3. Spin Up Infrastructure Databases

Orchestrate your development instance database (PostgreSQL) and memory layer (Redis) using the provided compose bundle:

```bash
docker-compose -f postgres-docker-compose.yml up -d

```

### 4. Run Core Datastore Migrations

Sync your PostgreSQL tables with your backend design schemas using Prisma ORM:

```bash
cd apps/api
pnpm prisma db push # Alternatively run: pnpm prisma migrate dev

```

### 5. Launch the Local Dev Development Server

To spin up both the **NestJS Backend Gateway** and the **React PWA Frontend** concurrently, return to the root folder and run:

```bash
pnpm dev

```

* **Frontend Client:** Accessible at `http://localhost:5173`
* **Backend Interface Engine:** Accessible at `http://localhost:3000`

---

## 6. Webhook Verification during Development

Because Nomba depends on active secure server endpoints to deliver live `payment_success` webhooks, use **ngrok** during local development to expose your NestJS gateway port:

```bash
ngrok http 3000

```

Copy the generated forward string (e.g., `https://your-subdomain.ngrok-free.app`) and configure it inside your Nomba merchant application developer dashboard settings.

---

## 7. License

This project is licensed under the terms enclosed within the workspace `LICENSE` file.