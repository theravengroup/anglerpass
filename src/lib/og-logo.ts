import { readFileSync } from 'fs';
import { join } from 'path';

let cachedLogo: string | null = null;
const bgCache: Record<string, string> = {};

export function getLogoDataUri(): string {
  if (cachedLogo) return cachedLogo;
  const svg = readFileSync(
    join(process.cwd(), 'public/images/anglerpass-noword-logo.svg')
  );
  cachedLogo = `data:image/svg+xml;base64,${svg.toString('base64')}`;
  return cachedLogo;
}

/**
 * Load a JPEG background image as a base64 data URI.
 * Images are cached in memory after first read.
 */
export function getOgBackgroundDataUri(
  name: 'hero' | 'virginia' | 'minnesota' | 'patagonia'
): string {
  if (bgCache[name]) return bgCache[name];
  const jpg = readFileSync(
    join(process.cwd(), `public/images/og/${name}-og.jpg`)
  );
  bgCache[name] = `data:image/jpeg;base64,${jpg.toString('base64')}`;
  return bgCache[name];
}
