import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AxeBuilder from "@axe-core/puppeteer";
import type { Page, Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

interface ScanOptions {
  startUrl: string;
  maxDepth?: number;
  maxScans?: number;
  concurrency?: number;
  puppeteerOptions?: any;
}

interface PageResult {
  url: string;
  result: any;
}

function getChromePath(): string {
  if (process.platform === "win32") {
    return "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";
  }
  if (process.platform === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }
  return "/usr/bin/google-chrome";
}

export async function runAccessibilityScan(
  options: ScanOptions
): Promise<PageResult[]> {
  const {
    startUrl,
    maxDepth = 2,
    maxScans = 10,
    puppeteerOptions = {},
    concurrency = 3,
  } = options;

  if (!startUrl || typeof startUrl !== "string") return [];

  const visited = new Set<string>();
  const results: PageResult[] = [];
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

  let browser: Browser | null = null;

  try {
    console.log("🚀 Launching Puppeteer with stealth mode...");

    const executablePath = process.env.CHROME_PATH || getChromePath();
    console.log(`🧭 Using Chrome executable: ${executablePath}`);

    // ✅ FIXED: assign to the existing variable, not redeclare it
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-ipc-flooding-protection",
      ],
      ...puppeteerOptions,
    });

    console.log("✅ Puppeteer launched successfully");

    while (queue.length && results.length < maxScans) {
      const batch = queue.splice(0, concurrency);

      const batchPromises = batch.map(async ({ url, depth }): Promise<void> => {
        if (visited.has(url) || depth > maxDepth) return;
        visited.add(url);

        console.log(`🔍 Scanning ${url} (depth ${depth})`);
        let page: Page | null = null;

        try {
          page = await browser!.newPage();

          await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
          );

          await page.setViewport({ width: 1920, height: 1080 });

          await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000,
          });

          await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));

          const axeBuilder = new AxeBuilder(page).withTags([
            "wcag2a",
            "wcag2aa",
            "wcag21a",
            "wcag21aa",
            "best-practice",
          ]);

          const axeResults = await axeBuilder.analyze();
          results.push({ url, result: axeResults });

          console.log(
            `✅ Completed scan for ${url} — ${axeResults.violations.length} violations`
          );

          if (depth < maxDepth) {
            const links: string[] = await page.$$eval("a[href]", (anchors) =>
              anchors
                .map((a) => (a as HTMLAnchorElement).href)
                .filter(
                  (href) =>
                    href.startsWith("http") &&
                    !href.includes("#") &&
                    !href.includes("mailto:") &&
                    !href.includes("tel:")
                )
                .slice(0, 10)
            );

            for (const link of links) {
              try {
                const normalized = new URL(link).toString();
                if (!visited.has(normalized) && results.length < maxScans) {
                  queue.push({ url: normalized, depth: depth + 1 });
                }
              } catch {
                continue;
              }
            }
          }
        } catch (err: any) {
          console.warn(`⚠️ Failed to scan ${url}:`, err.message || err);
        } finally {
          if (page && !page.isClosed()) {
            await page.close();
          }
        }
      });

      await Promise.all(batchPromises);
    }

    console.log(`🎯 Accessibility scan complete — total pages: ${results.length}`);
    return results;
  } catch (err) {
    console.error("❌ Error launching Puppeteer:", err);
    return results;
  } finally {
    if (browser) {
      await browser.close();
      console.log("🧹 Browser closed");
    }
  }
}
