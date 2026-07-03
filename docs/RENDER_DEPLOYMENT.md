# Render Deployment Guide (ConfirmAm Monorepo)

Because your request asked to *"deploy only the [name] to render"* (with a minor typo in the application name), this guide covers step-by-step instructions for **both** core parts of the monorepo:

1. **The React + Vite Frontend** (`apps/web`) - Deployed as a **Static Site**.
2. **The NestJS + Prisma Backend** (`apps/api`) - Deployed as a **Web Service**.

---

## ⚠️ Critical Monorepo Rule for Render
In a standard single-project repository, you might set Render's **Root Directory** field to the project folder. **Do not do this here.** 

Both `apps/web` and `apps/api` import the shared types package (`packages/types`) from the monorepo root. If you set the **Root Directory** to `apps/web` or `apps/api` on Render, the build will fail because the builder will not be able to resolve `packages/types` outside its directory.

*   **Rule:** Always leave the **Root Directory** field **blank** (defaulting to the repository root) so the build runner has access to the whole workspace. We will target the specific app using `pnpm --filter` flags.

---

## Option A: Deploying Only the Frontend (`apps/web`)
The React application is a Single Page Application (SPA). It should be deployed as a **Static Site** on Render.

### Step 1: Create a Static Site on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Static Site**.
3. Connect your Git repository.

### Step 2: Configure Build & Publish Settings
Configure the service settings as follows:

| Field | Value | Rationale |
| :--- | :--- | :--- |
| **Name** | `confirmam-web` | Name of your choice |
| **Runtime** | `Node` | Native Node environment |
| **Root Directory** | *Leave blank* | Keeps access to workspace packages |
| **Build Command** | `pnpm install && pnpm build:web` | Installs monorepo deps and builds only the web frontend |
| **Publish Directory** | `apps/web/dist` | The directory Vite outputs built files to |

### Step 3: Configure Environment Variables
Expand the **Environment Variables** section and add:

| Key | Value (Example) | Rationale |
| :--- | :--- | :--- |
| **VITE_API_BASE_URL** | `https://confirmam-api.onrender.com/api` | Base URL of your deployed NestJS API + `/api` |
| **VITE_SSE_BASE_URL** | `https://confirmam-api.onrender.com` | Base URL of your API for Server-Sent Events |
| **VITE_USE_MOCKS** | `false` | Ensures production builds connect to the actual backend |
| **NODE_VERSION** | `20` | (Recommended) Sets the Node.js runtime version |

### Step 4: Configure React Router Rewrites (SPA Routing)
Since React Router handles routing in the browser, visiting direct URLs (like `/dashboard`) will trigger a `404 Not Found` on Render unless you rewrite them to `index.html`.

1. In your Static Site settings page, scroll down to the **Redirects/Rewrites** section.
2. Click **Add Rule**.
3. Configure the rewrite:
   * **Source**: `/*`
   * **Destination**: `/index.html`
   * **Action**: `Rewrite`
4. Save changes.

---

## Option B: Deploying Only the Backend (`apps/api`)
The NestJS application handles database queries and payment webhooks. It should be deployed as a **Web Service** on Render.

### Step 1: Set Up your Database & Environment
The NestJS backend requires a PostgreSQL database. 
* You can spin up a **Render PostgreSQL** instance on the dashboard.
* Alternatively, use your existing **Neon Database** URL (found in `.env.prod`).

### Step 2: Create a Web Service on Render
1. Click **New +** and select **Web Service**.
2. Connect your Git repository.

### Step 3: Configure Build & Start Settings
Configure the service settings as follows:

| Field | Value | Rationale |
| :--- | :--- | :--- |
| **Name** | `confirmam-api` | Name of your choice |
| **Runtime** | `Node` | Native Node environment |
| **Root Directory** | *Leave blank* | Keeps access to workspace packages |
| **Build Command** | `pnpm install && pnpm build:api` | Installs deps, runs `prisma generate`, runs migrations, and builds NestJS |
| **Start Command** | `pnpm --filter api start:prod` | Runs the production NestJS bundle |

> [!NOTE]
> Under the hood, `pnpm build:api` executes `prisma generate && prisma migrate deploy && nest build`. This means migrations will deploy to your database automatically during the build step.

### Step 4: Configure Environment Variables
Expand **Environment Variables** and define the variables from `.env.prod`:

| Key | Value / Action |
| :--- | :--- |
| **DATABASE_URL** | Paste your connection string (Neon or Render Postgres) |
| **FRONTEND_URL** | Your deployed frontend URL (e.g. `https://confirmam-web.onrender.com`) |
| **APP_URL** | The URL of this API Web Service (e.g. `https://confirmam-api.onrender.com`) |
| **JWT_SECRET** | Click **Generate** to create a secure secret |
| **WEBHOOK_SECRET** | Click **Generate** to create a secure secret |
| **NODE_ENV** | `production` |
| **NODE_VERSION** | `20` (Recommended) |

#### Nomba Sandbox/Production Credentials
If utilizing real or sandbox payment rails, add:
* `NOMBA_BASE_URL` (e.g. `https://sandbox.nomba.com` or `https://api.nomba.com/v1`)
* `NOMBA_CLIENT_ID`
* `NOMBA_PRIVATE_KEY`
* `NOMBA_MAIN_ACCOUNT_ID`
* `NOMBA_SUB_ACCOUNT_ID`

---

## Option C: Deploying Both (Render Blueprint / `render.yaml`)
We have created a `render.yaml` file at the root of your project. If you want to deploy **both** services simultaneously and let Render configure the links automatically:

1. Push the `render.yaml` to your Git repository repository.
2. In the Render Dashboard, click **New +** and select **Blueprint**.
3. Select your repository.
4. Render will read the `render.yaml` and create both `confirmam-api` and `confirmam-web` with the exact build commands, start commands, rewrite rules, and env configurations already mapped.
5. You will only need to input secret values (such as `DATABASE_URL` and `NOMBA` keys) inside the Blueprint setup screen.
