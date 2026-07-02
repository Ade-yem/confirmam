# Overall Architecture Summary

## Overview

ConfirmAm is engineered as a lightweight, event-driven software POS built for Nigeria's transfer-first
economy. Rather than replacing existing banking infrastructure, it builds on top of Nomba's financial
APIs to provide merchants with instant payment confirmation, seamless bank transfers, and the
confidence of a traditional POS terminal without dedicated hardware.

The platform follows a layered architecture that separates financial infrastructure, backend services,
real-time event processing, and the merchant-facing Progressive Web App. This modular approach
keeps the system scalable, resilient, and easy to extend while maintaining a simple deployment
footprint suitable for both hackathon development and production growth.

## Architecture Layers

### Financial Infrastructure Layer

Nomba serves as the financial backbone of ConfirmAm.

This layer provides:

```
Dedicated Virtual Accounts for collecting payments
Collections API for incoming transfer processing
Webhooks for real-time payment events
Transaction Verification for reconciliation
Transfers API for outbound bank transfers
Bank Resolution APIs for account validation
```
Rather than processing money directly, ConfirmAm orchestrates these services to create a seamless
merchant experience.

### Application Backend

The backend is implemented using NestJS with a modular, event-driven architecture.

Its responsibilities include:

```
Merchant authentication and authorization
Payment session management
Virtual account provisioning
Webhook processing and verification
Transaction persistence
Outbound transfer initiation
Real-time event broadcasting
Background job processing
Audit logging and monitoring
```



Redis provides temporary state management and caching, while BullMQ handles asynchronous
workloads such as webhook retries, reconciliation, and notification delivery.

### Data Layer

PostgreSQL serves as the primary system of record.

Core entities include:

```
Merchants
Devices
Virtual Accounts
Incoming Transactions
Outgoing Transfers
Webhook Events
Notification History
Audit Logs
```
Prisma ORM provides type-safe database access and schema migrations throughout the application.

### Real-Time Communication Layer

Rather than polling the server, merchant devices maintain a Server-Sent Events (SSE) connection.

Whenever Nomba delivers a successful payment webhook:

```
The backend validates the transaction.
The payment is persisted.
Background jobs are scheduled if required.
A real-time payment event is streamed immediately to connected devices.
```
Because communication flows only from server to client, SSE provides lower bandwidth usage,
automatic reconnection, and significantly simpler infrastructure than WebSockets.

### Merchant Experience Layer

The merchant interface is delivered as a Progressive Web App built with React, Vite, and TypeScript.

Key capabilities include:

```
Dynamic virtual account generation
QR-based payment collection
Live transaction updates
Voice payment confirmation
Offline transaction history
Outbound bank transfers
Responsive mobile-first interface
```
Through the Browser Speech Synthesis API, merchants receive immediate spoken confirmations
without relying on third-party speech services.

Example:

"Payment of ₦5,000 received from Adeyemi."

## End-to-End Transaction Flow

The complete payment lifecycle follows an event-driven pipeline:

```
Merchant creates a payment request.
ConfirmAm requests a dedicated virtual account from Nomba.
Customer completes a bank transfer.
Nomba emits a payment webhook.
NestJS validates and verifies the transaction.
Transaction details are persisted to PostgreSQL.
Redis updates temporary transaction state.
BullMQ schedules any required reconciliation or retry tasks.
The backend publishes a Server-Sent Event.
The merchant's Progressive Web App receives the update instantly.
A voice notification announces the successful payment while the transaction appears in the live
activity feed.
```
The same backend also supports outbound transfers by validating recipient bank details, initiating
transfers through Nomba, and tracking transfer status using the same event-driven infrastructure.

## Design Principles

ConfirmAm's architecture is guided by five core principles:

```
Event-Driven: Payment events are processed and delivered immediately as they occur.
Hardware-Free: Every smartphone becomes a capable software POS.
Offline-Resilient: Merchants retain access to essential functionality even under unstable
network conditions.
Scalable: Modular services and asynchronous processing support future growth without major
architectural changes.
Developer-Friendly: A modern TypeScript stack, automated documentation, and clean service
boundaries enable rapid development and long-term maintainability.
```
By combining Nomba's financial infrastructure with modern web technologies, ConfirmAm delivers a
fast, reliable, and intelligent payment experience that removes the friction between "I've sent the
money" and "Payment received."