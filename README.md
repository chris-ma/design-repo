# Design Inspiration Dashboard

Paste a Dribbble, Pinterest, Awwwards, or any other design URL — or upload a screenshot/image directly — and get back a screenshot, AI-generated tags, a dominant color palette, and a ready-to-paste prompt for recreating that look and feel with an AI coding tool.

## Stack

- **Next.js** (App Router, TypeScript, Tailwind) — dashboard UI + API routes
- **Appwrite** — Database (item records) + Storage (screenshots)
- **Playwright** — server-side screenshot capture (local Chromium in dev, [`@sparticuz/chromium-min`](https://github.com/Sparticuz/chromium) on Vercel)
- **Claude (Anthropic API)** — vision analysis: tags, color palette, replication prompt

## Setup

1. **Create an Appwrite project.** Use [Appwrite Cloud](https://cloud.appwrite.io) or a self-hosted instance. Note the endpoint and project ID.
2. **Create an API key** on that project with Database and Storage read/write scopes.
3. **Get an Anthropic API key** from the [Anthropic Console](https://console.anthropic.com/).
4. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, and `ANTHROPIC_API_KEY`. The `APPWRITE_DATABASE_ID` / `APPWRITE_ITEMS_COLLECTION_ID` / `APPWRITE_SCREENSHOTS_BUCKET_ID` defaults match what the setup script provisions — leave them as-is unless you have a reason to change them.
5. **Install dependencies:**
   ```bash
   npm install
   ```
6. **Provision the Appwrite database/collection/bucket** (safe to re-run any time):
   ```bash
   npm run setup
   ```
7. **Get a local Chromium** for screenshot capture (skip if already available on your system, e.g. this dev container):
   ```bash
   npx playwright install chromium
   ```
8. **Run the app:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, click "Add inspiration", and paste a URL.

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel (or use the Vercel CLI/MCP tooling).
2. In the Vercel project's **Environment Variables**, set the same variables from `.env.local`: `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, `APPWRITE_ITEMS_COLLECTION_ID`, `APPWRITE_SCREENSHOTS_BUCKET_ID`, `ANTHROPIC_API_KEY`.
3. Deploy. The build itself doesn't require these secrets (Appwrite/Anthropic clients are constructed lazily at request time), but every "Add inspiration" request does.

### Known limitation: Playwright on Vercel serverless

Vercel's serverless functions don't ship a system Chromium and can't bundle the full ~130MB browser. Production uses [`@sparticuz/chromium-min`](https://github.com/Sparticuz/chromium), which downloads a serverless-tuned Chromium build at cold start. This adds cold-start latency and a small extra failure mode (the download itself). The full add-item pipeline (cold start + page render + AI call) can take 15–40+ seconds for slow or JS-heavy pages — `POST /api/items` sets `maxDuration = 60`, but **check this against your actual Vercel plan's execution limit** (Hobby is more restrictive than Pro) before relying on it in production. If requests are timing out, the fix is to split screenshot capture and AI analysis into two separate requests so each gets its own timeout budget — not built here, but the architecture (screenshot persisted independently of the AI result) supports adding it later.

### Known limitation: some sites block headless browsers

Pinterest and similar sites may require login or serve a stripped-down page to a headless browser. This is an accepted limitation — the app renders whatever a logged-out headless Chromium sees, with no bot-detection evasion.

## How it works

**From a URL:**
1. You paste a URL into the dashboard.
2. The server launches headless Chromium, navigates to the page, scrolls to trigger lazy-loaded images, and takes a screenshot.
3. The screenshot is sent to Claude, which returns a title, tags, a dominant color palette, and a replication prompt as structured JSON.
4. The screenshot is uploaded to Appwrite Storage; the item (with tags/prompt) is saved to Appwrite Database. If the AI step fails, the screenshot is still saved so nothing is lost — the item is created with empty tags/prompt and a warning is returned.
5. Those empty items can be recovered later: both the dashboard row and the item page expose a **Generate breakdown** button that re-reads the saved screenshot and re-runs the analysis (`POST /api/items/[id]/reanalyze`). The same button appears as **Regenerate** on items that already have a breakdown, if you want a fresh one.

**From an uploaded image:** same as above, but skips the Chromium/screenshot step entirely — the uploaded PNG/JPEG (max 4MB, to stay under Vercel's serverless request body limit) goes straight to Claude for analysis. You can optionally attach a source link for attribution; without one, the item shows as "Uploaded" with no source URL.

The dashboard list lets you filter by tag/platform and search by title; the detail view shows the full screenshot, tags, and a copyable replication prompt.

## Project structure

```
scripts/setup-appwrite.ts        # one-time Appwrite provisioning (npm run setup)
src/app/page.tsx                 # dashboard grid + Add affordance
src/app/items/[id]/page.tsx      # item detail view
src/app/api/items/route.ts       # GET list+filter, POST create
src/app/api/items/[id]/route.ts  # GET single, DELETE
src/components/                  # ItemList, ItemRow, AddItemModal, TagFilterBar, CopyButton, DeleteItemButton
src/lib/appwrite/                # Appwrite client + config (lazy-constructed, no secrets needed at build time)
src/lib/screenshot.ts            # Playwright capture
src/lib/ai.ts                    # Claude vision analysis
src/lib/items.ts                 # URL validation, platform detection, Appwrite doc <-> DesignItem mapping
```
