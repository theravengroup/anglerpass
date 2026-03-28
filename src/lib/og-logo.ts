import { readFileSync } from 'fs';
import { join } from 'path';

let cached: string | null = null;

export function getLogoDataUri(): string {
  if (cached) return cached;
  const svg = readFileSync(
    join(process.cwd(), 'public/images/anglerpass-noword-logo.svg')
  );
  cached = `data:image/svg+xml;base64,${svg.toString('base64')}`;
  return cached;
}
