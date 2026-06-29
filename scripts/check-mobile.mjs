import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:5173';
const viewports = [375, 390, 430];
const paths = ['/', '/recruit/apply', '/recruit/id-card', '/recruit/confirm', '/recruit/progress', '/recruit/result'];

await mkdir('tmp/mobile-check', { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];

for (const width of viewports) {
  const page = await browser.newPage({
    viewport: { width, height: 812 },
    isMobile: true,
  });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  for (const path of paths) {
    await page.goto(`${base}${path}`);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const visibleButtons = await page.locator('button:visible').count();
    const title = await page.locator('.title').first().innerText({ timeout: 3000 });
    if (overflow) {
      failures.push(`${width}px ${path}: horizontal overflow`);
    }
    if (visibleButtons === 0) {
      failures.push(`${width}px ${path}: no visible button`);
    }
    if (!title.trim()) {
      failures.push(`${width}px ${path}: empty title`);
    }
    if (path === '/') {
      await page.screenshot({ path: `tmp/mobile-check/home-${width}.png`, fullPage: true });
    }
  }

  if (consoleErrors.length > 0) {
    failures.push(`${width}px console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
  }
  await page.close();
}

await browser.close();

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('mobile check passed: 375/390/430');
