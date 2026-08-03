import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium as playwrightChromium, type Browser } from "playwright-core";

const VIEWPORT = { width: 1440, height: 900 };
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const NAVIGATION_TIMEOUT_MS = 20_000;
const OVERALL_TIMEOUT_MS = 45_000;

export interface CaptureResult {
  screenshot: Buffer;
  pageTitle: string;
  pageDescription?: string;
}

export async function captureScreenshot(url: string): Promise<CaptureResult> {
  return withTimeout(capture(url), OVERALL_TIMEOUT_MS, `Timed out capturing screenshot for ${url}`);
}

async function capture(url: string): Promise<CaptureResult> {
  const { executablePath, args } = await resolveChromium();
  const browser: Browser = await playwrightChromium.launch({
    executablePath,
    args,
    headless: true,
  });

  try {
    const context = await browser.newContext({ viewport: VIEWPORT, userAgent: USER_AGENT });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });

    // Trigger lazy-loaded images by scrolling down in a few increments, then back to top.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      const scrollHeight = document.body.scrollHeight;
      for (let y = 0; y < scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);

    const screenshot = await page.screenshot({ type: "png" });
    const pageTitle = await page.title();
    const pageDescription = await page
      .locator('meta[name="description"], meta[property="og:description"]')
      .first()
      .getAttribute("content")
      .catch(() => null);

    return {
      screenshot: Buffer.from(screenshot),
      pageTitle: pageTitle || new URL(url).hostname,
      pageDescription: pageDescription ?? undefined,
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

async function resolveChromium(): Promise<{ executablePath: string; args: string[] }> {
  if (process.env.VERCEL) {
    // No system Chromium on Vercel serverless — fetch a serverless-tuned build at cold start.
    // Host chromium-vX.Y.Z-pack.x64.tar somewhere reachable and set CHROMIUM_PACK_URL,
    // or leave unset to use the matching official GitHub release pack.
    const chromiumMin = (await import("@sparticuz/chromium-min")).default;
    // Matches the installed @sparticuz/chromium-min version (149.0.0) — bump both together.
    const defaultPackUrl =
      "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";
    const packUrl = process.env.CHROMIUM_PACK_URL || defaultPackUrl;
    const executablePath = await chromiumMin.executablePath(packUrl);
    return { executablePath, args: chromiumMin.args };
  }

  const executablePath = resolveLocalChromiumPath();
  return { executablePath, args: [] };
}

function resolveLocalChromiumPath(): string {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  }

  // This whole branch only ever runs in local dev (never on Vercel, guarded by the
  // caller's `process.env.VERCEL` check), scanning a fixed local browser-cache directory.
  // Annotated so Turbopack's file tracer doesn't conservatively bundle the entire
  // project into the Vercel serverless function just because it sees dynamic path.join/fs calls.
  const browsersRoot =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    join(/*turbopackIgnore: true*/ process.env.HOME || "", ".cache", "ms-playwright");

  if (existsSync(/*turbopackIgnore: true*/ browsersRoot)) {
    const candidates = readdirSync(/*turbopackIgnore: true*/ browsersRoot)
      .filter((name) => name.startsWith("chromium-"))
      .sort()
      .reverse();

    for (const candidate of candidates) {
      for (const relative of ["chrome-linux/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-win/chrome.exe"]) {
        const path = join(/*turbopackIgnore: true*/ browsersRoot, candidate, relative);
        if (existsSync(/*turbopackIgnore: true*/ path)) {
          return path;
        }
      }
    }
  }

  throw new Error(
    "Could not find a local Chromium install for screenshot capture. Run `npx playwright install chromium`, " +
      "or set PLAYWRIGHT_CHROMIUM_PATH to an explicit executable path.",
  );
}
