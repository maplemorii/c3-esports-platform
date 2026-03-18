import { createRequire } from 'module';
import { existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/benit/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer');

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const screenshotsDir = resolve(__dirname, 'temporary screenshots');

const url = process.argv[2];
const labelArg = process.argv[3];

if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label]');
  process.exit(1);
}

// Derive label from URL path or use provided arg
function deriveLabel(url, override) {
  if (override) return override.replace(/[^a-z0-9-_]/gi, '-');
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname === '/' ? 'home' : pathname.replace(/^\//, '').replace(/\//g, '-');
    return slug || 'page';
  } catch {
    return 'page';
  }
}

// Get next screenshot number
function nextN(dir) {
  if (!existsSync(dir)) return 1;
  const files = readdirSync(dir);
  const nums = files
    .map(f => parseInt(f.match(/^screenshot-(\d+)-/)?.[1] ?? '0'))
    .filter(n => n > 0);
  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
}

const label = deriveLabel(url, labelArg);
const n = nextN(screenshotsDir);
const filename = `screenshot-${n}-${label}.png`;
const outputPath = join(screenshotsDir, filename);

console.log(`Screenshotting ${url} → temporary screenshots/${filename}`);

const browser = await puppeteer.launch({
  executablePath: 'C:/Users/benit/.cache/puppeteer/chrome/win64-127.0.6533.72/chrome-win64/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await page.screenshot({ path: outputPath, fullPage: false });
await browser.close();

console.log(`Saved: ${outputPath}`);
