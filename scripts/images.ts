// Exports the PNG images in docs/images from their SVG sources, with the fonts Inter and
// JetBrains Mono (open licenses, loaded from Google Fonts).
//   npm run images
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

const dir = path.join(__dirname, '..', 'docs', 'images');
const fonts =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono&display=block">';

type Image = { svg: string; png: string; scale: number; className?: string; crop?: boolean };

const images: Image[] = [
  // Wordmarks are cropped to what is drawn, so the README can size them by their height.
  { svg: 'wordmark.svg', png: 'wordmark-light.png', scale: 3, crop: true },
  { svg: 'wordmark.svg', png: 'wordmark-dark.png', scale: 3, crop: true, className: 'dark' },
  { svg: 'social-preview.svg', png: 'social-preview.png', scale: 1 },
];

async function main() {
  const browser = await chromium.launch();
  // The SVG is inlined so that it uses the page's fonts; <image href="logo.svg"> resolves
  // through <base>.
  const html = path.join(os.tmpdir(), 'plainwright-images.html');
  for (const image of images) {
    const svg = fs.readFileSync(path.join(dir, image.svg), 'utf8');
    fs.writeFileSync(
      html,
      `<!doctype html><base href="file://${dir}/">${fonts}<body style="margin:0">${svg}`,
    );
    const page = await browser.newPage({
      viewport: { width: 1280, height: 640 },
      deviceScaleFactor: image.scale,
    });
    await page.goto(`file://${html}`);
    await page.evaluate(() => document.fonts.ready);
    const svgElement = page.locator('svg').first();
    if (image.className)
      await svgElement.evaluate((node, name) => node.classList.add(name), image.className);
    const out = path.join(dir, image.png);
    if (image.crop) {
      const clip = await svgElement.evaluate((node) => {
        const drawn = (node as SVGSVGElement).getBBox();
        const at = node.getBoundingClientRect();
        return { x: at.x + drawn.x, y: at.y + drawn.y, width: drawn.width, height: drawn.height };
      });
      await page.screenshot({ path: out, clip, omitBackground: true });
    } else {
      await svgElement.screenshot({ path: out });
    }
    await page.close();
    console.log(`Wrote docs/images/${image.png}`);
  }
  await browser.close();
  fs.rmSync(html, { force: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
