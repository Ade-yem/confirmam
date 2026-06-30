# ConfirmAm Frontend — PLAN.md
> Handoff document for the frontend build. Read this entirely before writing a single line of code.
> Every decision here is either sourced directly from the design spec or was explicitly agreed during planning.
> Where a decision extends the spec, it is marked **[EXTENDED]** so it can be reviewed or reverted.

---

## 1. Project Identity

**What this is:** A software payment terminal for merchants in busy shops, markets, restaurants, and roadside businesses across Nigeria.

**What this is not:** A banking app, a crypto exchange, an accounting dashboard, or an admin panel.

**The governing feeling:** Confidence. Every screen, animation, colour, and interaction must answer one question: *Can the merchant complete this transaction with confidence in under five seconds?* If the answer is no, simplify.

---

## 2. Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | React 18 + Vite | Agreed during planning. Not Next.js. No SSR. |
| Language | TypeScript | Type safety on transaction data and event payloads is non-negotiable |
| State | Zustand | Agreed. Lightweight, plays well with SSE push events |
| Routing | React Router v6 | Standard SPA routing for the 5 screens |
| Styling | Tailwind CSS v3 | Mobile-first by default. Responsive prefixes handle all breakpoints |
| Icons | Lucide React | Specified in the design doc. Outlined only — never filled |
| Font | Inter | Primary choice from spec. Load via `@fontsource/inter` (no Google Fonts network call) |
| HTTP | Axios | Clean interceptor layer for mock/real switching |
| SSE | Native `EventSource` | Wrapped in a custom service. No library needed |
| Voice | Browser `SpeechSynthesis` API | Agreed. Zero network dependency. Works offline |
| Mock server | Vite dev middleware | For simulating incoming payment webhooks during dev |
| Package manager | npm | Default for Vite projects |

---

## 3. Folder Structure

Feature-based organisation as specified in the design doc. Do not reorganise by file type.

```
src/
│
├── app/
│   ├── App.tsx
│   ├── Router.tsx
│   └── Providers.tsx           # Wraps Zustand stores, any global context
│
├── screens/                    # One folder per primary screen
│   ├── Dashboard/
│   │   └── index.tsx
│   ├── ReceivePayment/
│   │   ├── index.tsx
│   │   └── ConfirmationOverlay.tsx
│   ├── SendMoney/
│   │   └── index.tsx
│   ├── Transactions/
│   │   └── index.tsx
│   └── Profile/
│       └── index.tsx
│
├── components/
│   ├── payment/
│   │   ├── AmountDisplay.tsx
│   │   ├── PaymentStatusCard.tsx
│   │   ├── VirtualAccountCard.tsx
│   │   ├── QRCard.tsx
│   │   └── ConfirmationModal.tsx
│   ├── transfer/
│   │   └── TransferForm.tsx
│   ├── transaction/
│   │   └── TransactionCard.tsx
│   ├── dashboard/
│   │   └── MerchantHeader.tsx
│   └── common/
│       ├── StatusBadge.tsx
│       ├── VoiceIndicator.tsx
│       ├── ConnectionBanner.tsx
│       └── AppNav.tsx          # Single nav component, responsive via Tailwind
│
├── hooks/
│   ├── usePaymentEvents.ts     # SSE subscription hook
│   ├── useVoice.ts             # SpeechSynthesis abstraction
│   └── useConnection.ts        # Online/offline + SSE state
│
├── services/
│   ├── api/
│   │   ├── index.ts            # Exports all API functions
│   │   ├── client.ts           # Axios instance + mock flag + interceptors
│   │   ├── dashboard.ts
│   │   ├── payment.ts
│   │   ├── transfer.ts
│   │   ├── transactions.ts
│   │   └── mocks/
│   │       ├── fixtures.ts     # Static mock data shaped like real API responses
│   │       └── delay.ts        # Artificial latency helper (400–900ms)
│   └── sse/
│       ├── eventSource.ts      # Real SSE connection manager
│       └── mockEmitter.ts      # Dev-only mock payment event emitter
│
├── store/
│   ├── paymentStore.ts
│   ├── transactionStore.ts
│   ├── connectionStore.ts
│   └── merchantStore.ts
│
├── layouts/
│   └── AppLayout.tsx           # Single layout — responsive nav + content shell
│
├── lib/
│   └── formatters.ts           # Currency, date, phone number formatters
│
├── utils/
│   └── cn.ts                   # Tailwind class merge utility (clsx + tailwind-merge)
│
├── types/
│   ├── payment.ts
│   ├── transaction.ts
│   └── merchant.ts
│
├── assets/
└── styles/
    └── globals.css             # Tailwind base directives + CSS custom properties
```

---

## 4. Design Tokens

Single source of truth. Every value is taken directly from the design spec. Define all tokens in `tailwind.config.ts` AND as CSS custom properties in `globals.css`.

### 4.1 Colours

```ts
// tailwind.config.ts
colors: {
  emerald: {
    DEFAULT: '#0F8F5F',   // Primary — money, success, trust, growth
    dark:    '#0B7249',   // Hover and pressed states
    50:      '#E8F6EF',   // Subtle emerald tinted backgrounds
    100:     '#CDEEDE',   // Borders and dividers in emerald context
  },
  midnight: {
    DEFAULT: '#111827',   // Headers, navigation, primary text
    60:      '#4B5563',   // Secondary text
    40:      '#9CA3AF',   // Placeholders, captions, timestamps
  },
  lime:    '#7CFF6B',     // ACCENT — appears only when money arrives. See rule below.
  surface: '#FAFAF8',     // App background. Not pure white. Comfortable for long use.
  card:    '#FFFFFF',     // Card and panel surfaces
  coral:   '#EF4444',     // Error states
  amber:   '#F59E0B',     // Warning states
}
```

**Critical rule on Electric Lime (`#7CFF6B`):** This colour appears ONLY when money arrives — on the voice indicator bars and as a brief accent during the payment confirmation animation. It should feel like the "beep" of a POS machine. Very little. Very intentional. Never use it anywhere else.

### 4.2 Typography

```ts
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
}
fontSize: {
  // Currency and amount display — must dominate every payment screen
  'display':    ['64px', { lineHeight: '1',   fontWeight: '700', letterSpacing: '-0.02em' }],
  'display-sm': ['48px', { lineHeight: '1',   fontWeight: '700', letterSpacing: '-0.02em' }],
  // UI scale
  'headline':   ['20px', { lineHeight: '1.2', fontWeight: '700' }],
  'title':      ['16px', { lineHeight: '1.3', fontWeight: '700' }],
  'body':       ['14px', { lineHeight: '1.5', fontWeight: '400' }],
  'label':      ['13px', { lineHeight: '1.4', fontWeight: '500' }],
  'caption':    ['11px', { lineHeight: '1.4', fontWeight: '600' }],
}
```

Font weights from spec:
- `700` — Headlines
- `600` — Important numbers (not amounts)
- `500` — Labels
- `400` — Body

Amount values (₦) always use `text-display` or `text-display-sm`. They must visually dominate the screen they appear on.

### 4.3 Spacing, Radius, Shadows

```ts
borderRadius: {
  sm:    '10px',
  md:    '14px',
  lg:    '20px',   // Default — spec value. Feels modern and approachable.
  xl:    '24px',
  '2xl': '28px',
  full:  '9999px', // Pills and dots
}
boxShadow: {
  soft: '0 8px 24px rgba(17, 24, 39, 0.06)',    // Panels and cards
  card: '0 2px 8px rgba(17, 24, 39, 0.04)',     // Inner cards
  cta:  '0 8px 20px rgba(15, 143, 95, 0.40)',   // Emerald CTA buttons
}
```

Shadows must remain very soft. The UI should feel lightweight, never heavy.

---

## 5. Responsive Strategy

**This is a mobile-first application.** Mobile is the primary design target. Tablet and desktop are responsive extensions built on top of mobile using Tailwind's breakpoint prefixes. There is one layout component, one nav component, and one version of every screen.

### Breakpoints

```ts
// tailwind.config.ts
screens: {
  md: '768px',    // Tablet and up
  lg: '1200px',   // Desktop and up
}
```

Default (no prefix) always means mobile. Write mobile styles first, then override at `md:` and `lg:`.

### Navigation — `AppNav.tsx`

This is the only component where the structural change across breakpoints is significant. It is handled entirely with Tailwind responsive classes — no JavaScript breakpoint detection, no conditional rendering.

**Mobile (default):**
- Fixed bottom bar, full width
- Five items: Dashboard, Transactions, [Receive FAB], Send, Profile
- Receive Payment gets a raised FAB-style button in the center — it is the hero action
- Content area has `pb-20` to clear the nav

**Tablet (`md:`):**
- Fixed left rail, 96px wide
- Same five items, now vertical with icon + label stacked
- Receive FAB sits in the middle of the rail, raised with `mt-auto mb-auto` treatment
- Content area switches from `pb-20` to `pl-24`

**Desktop (`lg:`):**
- Fixed left sidebar, 240px wide
- Items are horizontal rows: icon + full text label
- Active item gets an emerald-tinted background row + left accent bar
- Content area switches to `pl-60`

```tsx
// AppLayout.tsx — the shell is simple
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <AppNav />
      <main className="pb-20 md:pb-0 md:pl-24 lg:pl-60">
        {children}
      </main>
      <ConnectionBanner />
    </div>
  )
}
```

### Content Grids

Screens handle their own internal responsive layout using Tailwind grid/flex utilities directly. No layout component is responsible for content arrangement — only the nav shell.

```tsx
// Example: Dashboard grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  ...
</div>
```

---

## 6. The Five Screens

### 6.1 Dashboard

**Purpose:** Instant awareness. The merchant should understand their business state in one glance.

**Mobile (single column, top to bottom):**
- Merchant header (avatar, name, greeting, connection status dot)
- Today's Revenue card (dark background, large white amount, payment count)
- Quick actions row (Receive / Send as equal-width buttons)
- Recent Activity list (TransactionCards, newest first)
- No charts — numbers only, as specified

**Tablet (`md:`, two columns):**
- Left column: Revenue card → Quick actions → Mini stats (Avg payment, Pending)
- Right column: Recent Activity panel (scrollable)

**Desktop (`lg:`, three columns):** **[EXTENDED]**
- Left: Revenue card → Quick actions → Mini stats
- Centre: This week bar chart (pure CSS bars, no library) + Top Customers panel
- Right: Recent Activity panel

> The design spec says "no charts in MVP" in the context of the mobile dashboard where screen space is the constraint. The desktop bar chart is an extension agreed during planning. It is pure CSS — no charting library. If this is out of scope, collapse to two columns at `lg:`.

### 6.2 Receive Payment

**This is the hero screen. It must feel like a POS terminal waiting for payment.**

**Mobile (stacked, top to bottom):**
```
Amount (display size, dominant)
Virtual Account Card
QR Code card (centered)
Waiting pulse indicator
```

**Tablet and desktop (`md:`, side by side):**
```
Left side: Amount → Account card → Waiting indicator
Right side: QR Code (larger, centered vertically)
```

Achieve this with:
```tsx
<div className="flex flex-col md:flex-row md:items-center md:gap-16">
  <div className="flex flex-col gap-5">...</div>  {/* left */}
  <QRCard className="mx-auto md:mx-0" />           {/* right */}
</div>
```

The screen never feels stretched. On desktop it stays as a centred card within the content area — the QR code does not span the full desktop width.

**Waiting state:**
- Pulsing dot + "Waiting for payment…" in emerald text
- Connection status always visible
- No spinner. Pulsing dot only.

**On payment arrival — the Confirmation Sequence:**

This is the signature interaction. Total duration must be under two seconds.

```
1. SSE event received → paymentStore.handlePaymentReceived()
2. navigator.vibrate([200])  — mobile only, silent fallback everywhere else
3. Full-screen emerald radial glow pulses once (~300ms)
4. ConfirmationOverlay mounts — checkmark scales in with spring ease (~400ms)
5. Amount shown at display size
6. Voice plays: "Payment of ₦{amount} received from {senderName}."
7. VoiceIndicator (lime bars) shown while speech is active
8. After 3s or on "Done" tap — overlay unmounts, transaction prepends to history, screen resets to waiting
```

Voice is handled by `useVoice.ts`. It must never block the visual sequence — fire and don't await. The visual confirmation must complete regardless of whether voice succeeds.

Electric Lime (`#7CFF6B`) appears ONLY on the voice indicator bars during playback. Nowhere else on this screen.

### 6.3 Send Money

**Feels like composing a payment. Heavy emphasis on recipient confidence.**

Single-screen wizard — steps managed with local `useReducer`, not separate routes. The URL does not change between steps.

```
Step 1 — Select Bank
  Searchable dropdown. Common Nigerian banks listed first.

Step 2 — Enter Account Number
  10-digit input. Auto-advances to step 3 on the 10th digit.

Step 3 — Auto Resolve Name
  API call fires immediately on arrival at this step.
  Skeleton loader while resolving.
  Resolved name shown in large type — merchant reads and confirms.
  If resolution fails: inline error with retry.

Step 4 — Enter Amount
  Numpad-style input on mobile.
  Recipient name stays visible above the input — always in frame.

Step 5 — Confirm
  Full summary: recipient name (large), bank, account number, amount (large).
  Single "Send ₦{amount}" CTA button.
  No going back from this step without explicit "Cancel".
```

Recipient name must be visible at every step after resolution. The merchant must feel certain before tapping confirm.

### 6.4 Transactions

**Think messaging app. Newest first.**

Each entry is a `TransactionCard`:
- Direction icon: ↓ green circle (incoming), ↑ blue circle (outgoing)
- Sender or recipient name
- Time (human-readable — "2:35 PM" not ISO string)
- Amount (green for incoming, midnight for outgoing)
- Status badge

**Mobile:** Full-width stacked list.
**Tablet and desktop (`md:`):** List widens, cards get more internal padding. No column split — a transaction list reads better as a single focused column even on wide screens.

**Empty state (never boring):**
> "No payments yet today. Your next payment will appear here instantly."

No pagination in MVP. Load all transactions for the current day on mount.

### 6.5 Profile

Merchant info, account details, basic settings. No detailed spec in the design doc — keep it minimal. Do not block any other work on this screen. Build it last.

---

## 7. State Management (Zustand)

Four stores. Keep them independent — no cross-store imports. Communicate between stores only through actions called at the point of use (e.g. the SSE hook calls both `paymentStore` and `transactionStore` on a payment event).

### `paymentStore`

```ts
interface PaymentStore {
  currentAmount: number | null
  waitingForPayment: boolean
  lastPayment: PaymentEvent | null
  confirmationVisible: boolean
  setAmount: (amount: number) => void
  startWaiting: () => void
  handlePaymentReceived: (event: PaymentEvent) => void
  dismissConfirmation: () => void
}
```

### `transactionStore`

```ts
interface TransactionStore {
  transactions: Transaction[]
  isLoading: boolean
  fetchTransactions: () => Promise<void>
  prependTransaction: (tx: Transaction) => void
}
```

### `connectionStore`

```ts
interface ConnectionStore {
  sseConnected: boolean
  networkOnline: boolean
  setSseConnected: (v: boolean) => void
  setNetworkOnline: (v: boolean) => void
}
```

### `merchantStore`

```ts
interface MerchantStore {
  merchant: Merchant | null
  todayRevenue: number
  todayPaymentCount: number
  isLoading: boolean
  fetchMerchant: () => Promise<void>
}
```

---

## 8. API Service Layer

**Golden rule: no screen or component ever calls `fetch` or `axios` directly. All data access goes through `services/api/`.**

### 8.1 Mock Switching

```ts
// services/api/client.ts
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'
```

Every API function checks this flag:

```ts
// services/api/dashboard.ts
export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (USE_MOCKS) return mockDelay(fixtures.dashboardSummary)
  return client.get('/dashboard/summary').then(r => r.data)
}
```

`mockDelay()` adds 400–900ms random latency so loading and skeleton states are exercised during development.

### 8.2 API Functions

```ts
// Dashboard
getDashboardSummary(): Promise<DashboardSummary>
getTopCustomers(): Promise<Customer[]>      // [EXTENDED] desktop panel
getWeeklyRevenue(): Promise<WeeklyBar[]>    // [EXTENDED] desktop chart

// Payments
initiatePaymentSession(amount: number): Promise<PaymentSession>
// Returns: { sessionId, virtualAccountNumber, bankName, qrCodeData, expiresAt }

// Transfers
resolveAccountName(bank: string, accountNumber: string): Promise<{ name: string }>
sendMoney(payload: SendMoneyPayload): Promise<TransferResult>

// Transactions
getTransactions(date?: string): Promise<Transaction[]>
```

### 8.3 Mock Fixtures

```ts
// services/api/mocks/fixtures.ts
// All shapes must exactly match what the real API will return.
// When the real API is ready, only the VITE_USE_MOCKS flag changes.

export const fixtures = {
  dashboardSummary: {
    todayRevenue: 248500,
    todayPaymentCount: 14,
    yesterdayRevenue: 221000,
    pendingAmount: 0,
    averagePayment: 17750,
  },
  merchant: {
    id: 'merchant_001',
    name: 'Adeyemi Stores',
    location: 'Lagos, NG',
    virtualAccountNumber: '8123456790',
    bankName: 'ConfirmAm',
  },
  transactions: [
    {
      id: 'tx_001',
      direction: 'incoming',
      amount: 5000,
      senderName: 'Adeyemi',
      timestamp: '2025-06-30T14:35:00Z',
      status: 'successful',
      reference: 'REF_001',
    },
    {
      id: 'tx_002',
      direction: 'outgoing',
      amount: 32000,
      recipientName: 'Supplier — Tunde',
      timestamp: '2025-06-30T13:10:00Z',
      status: 'successful',
      reference: 'REF_002',
    },
  ],
}
```

---

## 9. SSE & Real-Time Payment Events

### 9.1 Real SSE (Production)

```ts
// services/sse/eventSource.ts
export function connectToPaymentEvents(
  merchantId: string,
  onPayment: (event: PaymentEvent) => void,
  onConnectionChange: (connected: boolean) => void,
): () => void {
  const url = `${import.meta.env.VITE_SSE_BASE_URL}/events/payments?merchantId=${merchantId}`
  const source = new EventSource(url)

  source.addEventListener('payment_received', (e) => {
    onPayment(JSON.parse(e.data))
  })
  source.onopen = () => onConnectionChange(true)
  source.onerror = () => onConnectionChange(false)

  return () => source.close() // cleanup
}
```

### 9.2 `usePaymentEvents.ts`

```ts
// hooks/usePaymentEvents.ts
export function usePaymentEvents() {
  const handlePaymentReceived = usePaymentStore(s => s.handlePaymentReceived)
  const prependTransaction = useTransactionStore(s => s.prependTransaction)
  const setSseConnected = useConnectionStore(s => s.setSseConnected)
  const merchant = useMerchantStore(s => s.merchant)

  useEffect(() => {
    if (!merchant) return
    const cleanup = connectToPaymentEvents(
      merchant.id,
      (event) => {
        handlePaymentReceived(event)
        prependTransaction(paymentEventToTransaction(event))
      },
      setSseConnected,
    )
    return cleanup
  }, [merchant?.id])
}
```

Mount this hook once at the app level inside `Providers.tsx` so the SSE connection is global and persistent regardless of which screen the merchant is on.

### 9.3 Mock Payment Trigger (Dev Mode)

Incoming payment events are triggered manually via a POST request during development. This simulates the real production flow (payment provider → backend webhook → SSE → frontend) without a live backend.

**Vite dev server middleware:**

Add to `vite.config.ts`:

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    middlewares: [
      (req, res, next) => {
        if (req.method === 'POST' && req.url === '/mock/webhook/payment') {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            const payload = JSON.parse(body)
            // Signal the mock emitter — see mockEmitter.ts
            globalThis.__mockPaymentEmitter?.(payload)
            res.end(JSON.stringify({ ok: true }))
          })
        } else {
          next()
        }
      }
    ]
  }
})
```

Trigger a mock payment from the terminal at any time during development:

```bash
curl -X POST http://localhost:5173/mock/webhook/payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "senderName": "Adeyemi", "sessionId": "sess_test", "reference": "REF_TEST"}'
```

This exercises the exact same `usePaymentEvents` → `paymentStore` → `ConfirmationOverlay` → `useVoice` pipeline that the real SSE connection will use. Nothing changes when the real backend is wired up.

### 9.4 PaymentEvent Shape

```ts
interface PaymentEvent {
  sessionId: string
  amount: number        // In naira, whole number
  senderName: string
  senderBank?: string
  timestamp: string     // ISO 8601 UTC
  reference: string
}
```

---

## 10. Voice Service

```ts
// hooks/useVoice.ts
export function useVoice() {
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return   // Silent fallback — visual confirmation still completes

    window.speechSynthesis.cancel()       // Cancel any ongoing speech first

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-NG'             // Nigerian English. Falls back to en-US gracefully.
    utterance.rate = 0.95                // Slightly slower for clarity in noisy environments
    utterance.volume = 1.0

    window.speechSynthesis.speak(utterance)
  }, [])

  return { speak }
}
```

**Voice template for payment confirmation:**
```
"Payment of ₦{amount} received from {senderName}."
```

Format `amount` as a plain number string (e.g. `"5000"`) — `SpeechSynthesis` will speak it as "five thousand" naturally on most devices. Do not pass the formatted string with commas or the `₦` symbol into the utterance — pass only digits.

**Test voice on:**
- Android Chrome (most common merchant device)
- iOS Safari (quality varies significantly)

Voice must never block or delay the visual confirmation sequence. Call `speak()` and do not await it.

---

## 11. Component Specifications

Each component is independent and reusable. No component imports from a sibling component's folder.

### `AmountDisplay`
```tsx
interface Props {
  amount: number
  size?: 'display' | 'display-sm'   // defaults to 'display'
}
```
- Formats with `₦` prefix, thousands separator, no decimals for whole naira
- Uses `en-NG` locale for `Intl.NumberFormat`
- Must visually dominate its container — do not constrain width

### `PaymentStatusCard`
```tsx
interface Props {
  status: 'waiting' | 'received' | 'failed'
  amount?: number
  senderName?: string
}
```
- Waiting: pulsing dot + "Waiting for payment…" (emerald text on emerald-50 pill)
- Received: handled by `ConfirmationOverlay`, not this component
- Failed: coral icon + descriptive message

### `VirtualAccountCard`
```tsx
interface Props {
  accountNumber: string
  bankName: string
  merchantName: string
}
```
- Account number is tappable — copies to clipboard on tap
- Show brief toast confirmation: "Account number copied"
- Account number formatted with spaces for readability: `8123 4567 890`

### `QRCard`
```tsx
interface Props {
  data: string
  className?: string
}
```
- Renders QR code using `qrcode.react`
- "Scan to pay" caption below
- `className` passed through so parent can control sizing at breakpoints

### `TransactionCard`
```tsx
interface Props {
  transaction: Transaction
}
```
- ↓ green icon for incoming, ↑ blue icon for outgoing
- Name (600 weight), time (caption, midnight-40), amount (700 weight, coloured by direction)
- `StatusBadge` inline
- Full row is tappable (detail view is out of MVP scope — tap is a no-op for now, but the tap target must be built)

### `TransferForm`
- Multi-step wizard, state managed with `useReducer` locally
- Steps: bank → account → name resolve → amount → confirm
- Auto-advances from step 2 to step 3 on 10th digit
- Back button between all steps
- Recipient name stays visible above the fold from step 3 onwards

### `MerchantHeader`
```tsx
interface Props {
  merchant: Merchant
}
```
- Avatar: initials from merchant name, emerald background, rounded-lg
- Greeting changes by time of day: "Good morning", "Good afternoon", "Good evening"
- Connection status pill (emerald dot + "Online" / coral dot + "Offline")

### `StatusBadge`
```tsx
interface Props {
  status: 'successful' | 'pending' | 'failed'
}
```
- Coloured pill with text. Never just a coloured dot with no label (accessibility)
- Successful: emerald-50 background, emerald-dark text
- Pending: amber background (10% opacity), amber text
- Failed: coral background (10% opacity), coral text

### `VoiceIndicator`
- Four animated bars in Electric Lime (`#7CFF6B`)
- Bars animate independently with staggered delays (scaleY oscillation)
- Shown ONLY while `window.speechSynthesis.speaking === true`
- Wrapped in a dark midnight pill: `"Payment of ₦5,000 received from Adeyemi"`

### `ConnectionBanner`
- Positioned fixed at top of viewport, full width, `z-50`
- Shown when `sseConnected === false` OR `networkOnline === false`
- Network offline: amber — "You're offline. Reconnecting…"
- SSE disconnected: coral — "Live payments paused. Reconnecting…"
- Pushes content down — does not overlap it
- Connection status must always be visible — this is specified in the design doc

### `ConfirmationOverlay` (ReceivePayment screen)
- Full-screen overlay triggered by `paymentStore.confirmationVisible`
- Radial emerald glow background (CSS radial-gradient)
- Animated checkmark ring entrance (scale 0 → 1, spring-like cubic-bezier, 400ms)
- Amount at display size
- "PAYMENT RECEIVED" label in emerald-dark, uppercase, letter-spaced
- Sender name and time
- `VoiceIndicator` visible while speech plays
- "Done" button — dismisses overlay, resets waiting state

---

## 12. Animations & Motion

**Principle from the spec:** Animations communicate state changes. Never decorate.

| Animation | Trigger | Spec |
|---|---|---|
| Waiting pulse | Always on waiting screen | Dot scales 1→1.3 and fades at 50%. 1.4s ease-in-out, infinite loop |
| Screen glow | Payment received | Full-viewport radial-gradient flashes emerald-50 and fades. 300ms. One shot. |
| Checkmark entrance | Confirmation overlay mounts | Scale 0→1, `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring feel). 400ms. 100ms delay after glow |
| Voice bars | `speechSynthesis.speaking` | Each bar scaleY oscillates with staggered delays. 0.9s ease-in-out, infinite loop |
| Transaction slide-in | New tx prepended to store | Slides down from above with fade. 250ms ease-out. |
| Skeleton shimmer | Data fetching | Background position animation on gradient. No spinners except connection banner |

**`prefers-reduced-motion`:** Wrap every animation in a check. If reduced motion is preferred, all transitions must cut to instant. Add this utility once in `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 13. Accessibility

Non-negotiable minimums:

- All tap targets minimum **44×44px** on mobile
- Colour contrast ratio **≥ 4.5:1** for all text — verify emerald text on surface backgrounds in particular
- All icon-only buttons have an `aria-label`
- `TransactionCard` uses `aria-label` that speaks: "Incoming payment of five thousand naira from Adeyemi, successful, 2:35 PM"
- `ConnectionBanner` uses `role="alert"` so screen readers announce connection changes immediately
- `VoiceIndicator` is `aria-hidden="true"` — it is decorative; the visual confirmation carries the meaning
- Responsive text scaling — do not suppress the user's system font size preferences with fixed `px` on body
- Keyboard navigation: all interactive elements reachable and operable by keyboard

---

## 14. Loading & Empty States

### Loading
- Use **skeleton loaders** everywhere
- Skeleton shapes must match the exact dimensions of the content they replace
- Dashboard: skeleton for the revenue card, skeleton for each transaction row
- Name resolution in Send Money: skeleton where the resolved name will appear
- No spinners on content screens. The one acceptable spinner is in `ConnectionBanner` — it is a status indicator, not a loading state

### Empty States
Never blank. Empty states direct the merchant toward action.

| Screen | Empty state copy |
|---|---|
| Transactions — no payments today | "No payments yet today. Your next payment will appear here instantly." |
| Transactions — no results | "No transactions match this search." |
| Send Money — no recent recipients | "Your recent recipients will appear here." |
| Dashboard — no activity | "Ready to receive your first payment today." |

---

## 15. Error Handling

Errors never say "Something went wrong." They say what went wrong and what to do next.

| Scenario | UI Treatment |
|---|---|
| Network offline | `ConnectionBanner` amber — "You're offline. Reconnecting…" |
| SSE disconnected | `ConnectionBanner` coral — "Live payments paused. Reconnecting…" |
| Account name resolution fails | Inline error below account field — "Unable to verify this account. Check the number and try again." |
| Send money API fails | Full error state within the send flow — shows amount and recipient, offers retry |
| Any API call fails | Inline error in the relevant section. Never a full-page error for a partial failure |

---

## 16. Environment Variables

```env
# .env.development
VITE_USE_MOCKS=true
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SSE_BASE_URL=http://localhost:3000

# .env.production
VITE_USE_MOCKS=false
VITE_API_BASE_URL=https://api.confirmam.com
VITE_SSE_BASE_URL=https://api.confirmam.com
```

Never commit `.env.production`. Never hardcode URLs anywhere in the codebase.

---

## 17. Data Contract

Agreed shapes for all API responses. The backend must match these exactly, or the mock fixtures must be updated. Share this section with the backend dev.

### Transaction
```ts
interface Transaction {
  id: string
  direction: 'incoming' | 'outgoing'
  amount: number                        // Naira, whole number
  senderName?: string                   // Populated for incoming
  recipientName?: string                // Populated for outgoing
  recipientBank?: string
  timestamp: string                     // ISO 8601 UTC
  status: 'successful' | 'pending' | 'failed'
  reference: string
}
```

### PaymentSession
```ts
interface PaymentSession {
  sessionId: string
  virtualAccountNumber: string
  bankName: string
  merchantName: string
  amount: number
  qrCodeData: string                    // Raw string for QR generation
  expiresAt: string                     // ISO 8601 UTC
}
```

### PaymentEvent (SSE payload)
```ts
interface PaymentEvent {
  sessionId: string
  amount: number                        // Naira, whole number
  senderName: string
  senderBank?: string
  timestamp: string                     // ISO 8601 UTC
  reference: string
}
```

### Merchant
```ts
interface Merchant {
  id: string
  name: string
  location?: string
  virtualAccountNumber: string
  bankName: string
}
```

### DashboardSummary
```ts
interface DashboardSummary {
  todayRevenue: number
  todayPaymentCount: number
  yesterdayRevenue: number              // Used to calculate % change
  pendingAmount: number
  averagePayment: number
}
```

### SendMoneyPayload
```ts
interface SendMoneyPayload {
  recipientBank: string
  recipientAccountNumber: string
  recipientName: string                 // As resolved by the API
  amount: number
}
```

### TransferResult
```ts
interface TransferResult {
  reference: string
  status: 'successful' | 'pending' | 'failed'
  timestamp: string
}
```

---

## 18. Dev Commands

```bash
# Install dependencies
npm install

# Start dev server (mocks on)
npm run dev

# Start dev server (against real API)
VITE_USE_MOCKS=false npm run dev

# Trigger a mock payment during development
curl -X POST http://localhost:5173/mock/webhook/payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "senderName": "Adeyemi", "sessionId": "sess_test", "reference": "REF_TEST"}'

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 19. Build Order

Work in this sequence. Each phase produces something testable before moving to the next.

**Phase 1 — Foundation**
1. Vite + React + TypeScript scaffold
2. Tailwind config with all design tokens (colours, type scale, radius, shadows)
3. CSS custom properties in `globals.css`
4. `@fontsource/inter` installed and applied globally
5. React Router with 5 routes and empty placeholder screens
6. `AppLayout.tsx` — single shell with responsive nav padding
7. `AppNav.tsx` — bottom nav (mobile) responding up to rail (md) and sidebar (lg) via Tailwind classes only

**Phase 2 — Data Layer**
8. All four Zustand stores with full TypeScript interfaces
9. Axios client with `VITE_USE_MOCKS` flag
10. Mock fixtures for all data types
11. All API service functions (mock mode)
12. `useVoice.ts` — test in isolation in a scratch component
13. `useConnection.ts` — test online/offline detection
14. `usePaymentEvents.ts` + `mockEmitter.ts` — test the mock webhook curl trigger end-to-end

**Phase 3 — Core Components**
15. `AmountDisplay` — test with edge cases (₦0, ₦1,000,000+)
16. `StatusBadge`
17. `TransactionCard` — all directions and statuses
18. `MerchantHeader`
19. `VirtualAccountCard` with clipboard copy + toast
20. `ConnectionBanner` — test both offline and SSE-disconnected states

**Phase 4 — Receive Payment Screen (Priority)**
21. Waiting state — amount, account card, QR, pulse indicator
22. `QRCard` with `qrcode.react`
23. Confirmation overlay — full animation sequence
24. Voice playback integration with `VoiceIndicator`
25. Vibration on mobile
26. Transaction auto-prepend on confirmation
27. Full end-to-end test: curl mock webhook → glow → checkmark → voice → history

**Phase 5 — Dashboard Screen**
28. Revenue card
29. Quick action buttons (route to Receive and Send)
30. Recent activity list
31. Skeleton loaders for all dashboard sections
32. Responsive grid (1 col → 2 col → 3 col)
33. Desktop bar chart + top customers [EXTENDED]

**Phase 6 — Send Money Screen**
34. Step 1: Bank selection (searchable)
35. Step 2: Account number input with auto-advance
36. Step 3: Name resolution (mock API + loading skeleton + error state)
37. Step 4: Amount entry
38. Step 5: Confirmation summary + submit
39. Success state after send

**Phase 7 — Transactions Screen**
40. Full transaction list
41. Empty state
42. Skeleton loaders

**Phase 8 — Profile Screen**
43. Merchant info display
44. Account details
45. Keep it minimal

**Phase 9 — Polish**
46. All empty states across every screen
47. All error states across every screen
48. `prefers-reduced-motion` audit — every animation must respect it
49. Accessibility audit: contrast ratios, tap targets, aria labels, keyboard nav
50. Cross-device voice test: Android Chrome, iOS Safari
51. Offline behaviour end-to-end: disconnect network, confirm banner appears, reconnect, confirm it clears
52. Full responsive pass: test every screen at 375px, 768px, 1200px, 1440px

---

## 20. Out of Scope

Do not build these unless explicitly added to scope:

- Authentication / login screen
- Push notifications
- Transaction export (PDF or CSV)
- In-app support or chat
- Multi-merchant or team accounts
- Dark mode (not in the spec — Midnight is used for elements, not the app background)
- Any charting library (the desktop week chart is pure CSS bar heights only)

---

## 21. Notes for the Agent

- **Mobile first, always.** Write the default (unprefixed) Tailwind classes for mobile. Add `md:` and `lg:` overrides only after the mobile version is correct. Never write desktop styles first and try to shrink down.
- The single `AppNav.tsx` component handles all three nav patterns with responsive Tailwind classes. Do not create separate nav components per breakpoint.
- The mock webhook trigger (Phase 2, step 14) tests the full pipeline without any backend. Use it constantly — it is the fastest way to validate the confirmation sequence.
- Voice quality on Android Chrome vs iOS Safari differs significantly. The `lang: 'en-NG'` locale may fall back to `en-US` on some devices — this is acceptable. What is not acceptable is voice failure breaking the visual confirmation. Always decouple them.
- `getTopCustomers()` and `getWeeklyRevenue()` are [EXTENDED] API calls not in the original spec. Their mock fixtures are ready. Coordinate with the backend dev to confirm if these endpoints will exist before building the desktop panels that consume them.
- Every colour, font weight, radius, and shadow in this document comes directly from the design spec. Do not substitute values. Extend the Tailwind theme — do not scatter arbitrary values through components.
- Amount values must always use `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })` for display, and plain digit strings for voice.
