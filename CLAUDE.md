# Claude Project Guide for ConfirmAm

## Project summary
ConfirmAm is a transfer-first payment confirmation platform for Nigerian merchants. It combines a NestJS backend, a React/Vite frontend, Prisma/PostgreSQL, Redis, and Nomba payment infrastructure to provide instant payment verification and merchant-facing confirmation flows.

## Repository structure
- apps/api: NestJS backend, Prisma schema, webhook/event handling, transaction services
- apps/web: React + Vite PWA frontend for merchants
- packages/types: shared TypeScript types used across apps
- docs: architecture and product documentation

## Common commands
Run from the repository root:
- pnpm install
- pnpm dev
- pnpm dev:web
- pnpm dev:api
- pnpm build
- pnpm typecheck

## Development notes
- This is a pnpm monorepo. Prefer workspace-aware commands.
- Backend work typically belongs in apps/api.
- Frontend work typically belongs in apps/web.
- **Single Source of Truth for Types**: All types and interfaces that are shared or used across both frontend and backend MUST be defined in the `packages/types` workspace package (`packages/types/src/index.ts`). Respective application modules/folders may only define their own strictly local, module-specific types.
- Shared contracts should be updated in packages/types when API or UI data shapes change.
- Prisma schema changes should be reflected in apps/api/prisma/schema.prisma and corresponding migrations.

## API Rationale & Session Rules
- **SSE Streams**: Pushes successful payments under the event name `payment_received` containing `PaymentEvent` fields (`sessionId`, `amount`, `senderName`, `senderBank`, `timestamp`, `reference`).

## Architecture priorities
Architecture summary lives in [ARCHITECTURE_SUMMARY.md](./docs/ARCHITECTURE_SUMMARY.md)
- Keep payment flows event-driven and resilient.
- Preserve clear separation between financial integration, backend services, and UI logic.
- Prefer minimal, well-scoped changes over broad rewrites.
- Maintain type safety and keep frontend/backend contracts aligned.

## Working style
- Make small, focused changes.
- Prefer existing patterns and component structure over introducing new abstractions.
- When changing behavior, update relevant docs or types where appropriate.
- Verify with the relevant build or typecheck command after meaningful changes.
