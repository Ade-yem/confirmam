#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting full monorepo bootstrap for 'confirmam'..."

# Get the absolute starting path
ROOT_DIR="$(pwd)/confirmam"

# Function to spawn a command in a new terminal window based on OS
open_terminal_and_run() {
    local title=$1
    local dir=$2
    local cmd=$3

    echo "⚙️  Launching task in new window: $title"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "tell application \"Terminal\" to do script \"cd '$dir' && $cmd\""
    elif command -v gnome-terminal &> /dev/null; then
        # Linux (GNOME)
        gnome-terminal --title="$title" --working-directory="$dir" -- bash -c "$cmd; exec bash"
    elif command -v wt &> /dev/null; then
        # Windows Terminal
        wt -d "$dir" bash -c "$cmd; exec bash"
    elif command -v cmd &> /dev/null; then
        # Windows Git Bash Fallback
        start cmd /k "cd /d $dir && $cmd"
    else
        # Fallback if no windowing system is matched
        echo "⚠️  Could not detect a standard GUI terminal. Running in background..."
        (cd "$dir" && eval "$cmd") &
    fi
}

# ==========================================
# Step 1 — Bootstrap the root workspace
# ==========================================
echo "📁 Step 1: Bootstrapping root workspace..."
mkdir -p confirmam && cd confirmam
git init
pnpm init

# Write root package.json
cat > package.json << 'EOF'
{
  "name": "confirmam",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel -r dev",
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
EOF

# Create workspace configuration
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

# Create folder skeleton
mkdir -p apps/web apps/api packages/types

# ==========================================
# Step 2 — Shared types package
# ==========================================
echo "📦 Step 2: Setting up shared types package..."
cd packages/types
pnpm init

cat > package.json << 'EOF'
{
  "name": "types",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
EOF

mkdir -p src
cat > src/index.ts << 'EOF'
// transaction.ts
export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'expired'

export interface Transaction {
  id: string
  amount: number
  vaNumber: string
  ussdString: string
  status: TransactionStatus
  merchantId: string
  createdAt: string
  confirmedAt?: string
}

export interface VAResponse {
  transactionId: string
  vaNumber: string
  ussdString: string
  amount: number
  expiresAt: string
}

// webhook.ts
export interface NombaWebhookPayload {
  event: string
  data: {
    reference: string
    amount: number
    accountNumber: string
    status: string
    settledAt: string
  }
}

// sse.ts
export interface SSEEvent {
  type: 'payment_confirmed' | 'payment_failed' | 'payment_pending'
  transactionId: string
  amount: number
  timestamp: string
}
EOF

# Go back to root context to initialize concurrent app build threads
cd "$ROOT_DIR"

# ==========================================
# Step 3 & 4 — Parallel App Setup Threads
# ==========================================

# Command block for Frontend (Vite) Setup
WEB_CMD_STRING="echo '🌐 Starting Web App Setup...'; \
pnpm create vite . --template react-ts --yes; \
pnpm install; \
pnpm install tailwindcss @tailwindcss/vite vite-plugin-pwa; \
pnpm install dexie react-hook-form zod @hookform/resolvers; \
pnpm install types@workspace:*; \
cat > vite.config.ts << 'INNER_EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.confirmam/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' }
          }
        ]
      },
      manifest: {
        name: 'ConfirmAm',
        short_name: 'ConfirmAm',
        description: 'Software POS for transfer-first merchants',
        theme_color: '#0F6E56',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
INNER_EOF
node -e \"
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.name = 'web';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
\"; \
echo '✅ Frontend setup pipeline ready. You can close this window after verification.'"

# Command block for Backend (NestJS) Setup
API_CMD_STRING="echo '🖥️ Starting API Backend Setup...'; \
pnpm dlx @nestjs/cli new . --package-manager pnpm --skip-git; \
pnpm install @prisma/client prisma; \
pnpm install @nestjs/jwt passport-jwt @nestjs/passport; \
pnpm install zod types@workspace:*; \
pnpm install -D prisma; \
npx prisma init; \
cat > prisma/schema.prisma << 'INNER_EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env(\"DATABASE_URL\")
}

model Merchant {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  createdAt    DateTime      @default(now())
  transactions Transaction[]
}

model Transaction {
  id          String   @id @default(cuid())
  amount      Int
  vaNumber    String
  ussdString  String
  status      String   @default(\"pending\")
  merchantId  String
  merchant    Merchant @relation(fields: [merchantId], references: [id])
  webhookRef  String?
  createdAt   DateTime @default(now())
  confirmedAt DateTime?

  @@index([vaNumber])
  @@index([status])
}

model WebhookEvent {
  id        String   @id @default(cuid())
  payload   Json
  processed Boolean  @default(false)
  createdAt DateTime @default(now())
}
INNER_EOF
node -e \"
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.name = 'api';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
\"; \
echo '✅ Backend setup pipeline ready. You can close this window after verification.'"

# Launch frontend and backend concurrently in separate windows
open_terminal_and_run "Setup Frontend (Web)" "$ROOT_DIR/apps/web" "$WEB_CMD_STRING"
open_terminal_and_run "Setup Backend (API)" "$ROOT_DIR/apps/api" "$API_CMD_STRING"

# Wait a brief moment to ensure processes grabbed locks if falling back to background jobs
sleep 3

# ==========================================
# Step 5 & 6 — Env and Root configurations (Runs in main terminal)
# ==========================================
echo "🔧 Setting up shared configuration files..."

# Create .env.example
cat > .env.example << 'EOF'
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/confirmam
JWT_SECRET=your-jwt-secret-here
NOMBA_API_KEY=your-nomba-api-key
NOMBA_API_SECRET=your-nomba-api-secret
NOMBA_BASE_URL=https://api.nomba.com/v1
WEBHOOK_SECRET=your-webhook-signing-secret
EOF

# Duplicate configurations safely
cp .env.example apps/api/.env
cp .env.example apps/web/.env

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.env.local
.DS_Store
prisma/migrations/dev*
EOF

echo "--------------------------------------------------------"
echo "🎉 Central orchestrator setup complete!"
echo "--------------------------------------------------------"
echo "Next Steps:"
echo "1. Verify the child application installation windows finish without error."
echo "2. Run 'pnpm install' at the root repository once child terminals close."
echo "3. Run 'pnpm dev' to bring up both web and api concurrent runtime instances."
echo "--------------------------------------------------------"