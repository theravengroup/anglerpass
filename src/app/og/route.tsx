import type { NextRequest } from 'next/server';
import { getLogoDataUri, getOgBackgroundDataUri } from '@/lib/og-logo';
import { jpegOgImage } from '@/lib/og-jpeg';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') ?? 'AnglerPass';
  const subtitle =
    searchParams.get('subtitle') ?? 'Private Water Fly Fishing Access';
  const type = searchParams.get('type') ?? 'default';

  const logoSrc = getLogoDataUri();

  // Background + accent color by audience type
  const configMap: Record<string, { bg: 'hero' | 'virginia' | 'minnesota' | 'patagonia'; accent: string; overlay: string }> = {
    angler: {
      bg: 'patagonia',
      accent: '#b8944e',
      overlay: 'linear-gradient(145deg, rgba(42,31,14,0.82) 0%, rgba(42,31,14,0.55) 40%, rgba(42,31,14,0.85) 100%)',
    },
    club: {
      bg: 'minnesota',
      accent: '#5a9aad',
      overlay: 'linear-gradient(145deg, rgba(15,32,48,0.82) 0%, rgba(26,58,74,0.55) 40%, rgba(15,32,48,0.85) 100%)',
    },
    landowner: {
      bg: 'virginia',
      accent: '#4a7c5a',
      overlay: 'linear-gradient(145deg, rgba(15,38,24,0.82) 0%, rgba(26,58,42,0.55) 40%, rgba(15,38,24,0.85) 100%)',
    },
    default: {
      bg: 'hero',
      accent: '#b8944e',
      overlay: 'linear-gradient(180deg, rgba(10,20,15,0.75) 0%, rgba(10,20,15,0.55) 40%, rgba(10,20,15,0.80) 100%)',
    },
  };
  const config = configMap[type] ?? configMap.default;
  const bgSrc = getOgBackgroundDataUri(config.bg);

  return jpegOgImage(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cinematic background photo */}
        <img
          src={bgSrc}
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Dark overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: config.overlay,
            display: 'flex',
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, transparent 0%, ${config.accent} 50%, transparent 100%)`,
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            zIndex: 1,
            padding: '0 80px',
          }}
        >
          {/* Logo */}
          <img
            src={logoSrc}
            width={80}
            height={66}
            style={{ marginBottom: 20 }}
          />

          {/* Eyebrow */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.25em',
              color: config.accent,
              marginBottom: 16,
              display: 'flex',
              textShadow: '0 1px 8px rgba(0,0,0,0.4)',
            }}
          >
            ANGLERPASS
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 40 ? 46 : 58,
              fontWeight: 700,
              fontFamily: 'serif',
              color: '#f5f0e0',
              letterSpacing: '-1px',
              lineHeight: 1.15,
              textAlign: 'center',
              marginBottom: 16,
              display: 'flex',
              textShadow: '0 2px 16px rgba(0,0,0,0.5)',
              maxWidth: 900,
            }}
          >
            {title}
          </div>

          {/* Divider */}
          <div
            style={{
              width: 60,
              height: 2,
              background: config.accent,
              marginBottom: 16,
              display: 'flex',
            }}
          />

          {/* Subtitle */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 20,
              fontWeight: 500,
              color: 'rgba(245,240,224,0.8)',
              textAlign: 'center',
              lineHeight: 1.6,
              display: 'flex',
              textShadow: '0 1px 8px rgba(0,0,0,0.5)',
              maxWidth: 680,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 50,
            background: 'linear-gradient(180deg, transparent 0%, rgba(10,20,15,0.9) 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 14,
          }}
        >
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 13,
              fontWeight: 500,
              color: `${config.accent}80`,
              letterSpacing: '0.15em',
              display: 'flex',
            }}
          >
            anglerpass.com
          </div>
        </div>
      </div>,
    { width: 1200, height: 630 }
  );
}
