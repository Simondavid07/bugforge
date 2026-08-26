import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "https://bugforge-lyart.vercel.app";
const outputPath =
  process.env.PLAYWRIGHT_AUTH_STATE ?? "playwright/.auth/github.json";

async function main() {
  await fs.mkdir(outputPath.split("/").slice(0, -1).join("/") || ".", {
    recursive: true,
  });
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? "chromium",
    headless: false,
  });
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await page.goto("/");
  console.log(
    "Complete GitHub sign-in in the opened browser, then return here and press Enter."
  );
  await new Promise<void>(resolve =>
    process.stdin.once("data", () => resolve())
  );
  await context.storageState({ path: outputPath });
  await browser.close();
  console.log(`Saved Playwright auth state to ${outputPath}`);
}

void main();
