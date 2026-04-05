import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') ?? 'AnglerPass';
  const subtitle =
    searchParams.get('subtitle') ?? 'Private Water Fly Fishing Access';
  const type = searchParams.get('type') ?? 'default';

  // Accent color by audience type
  const accentMap: Record<string, string> = {
    angler: '#9a7340',
    club: '#3a6b7c',
    landowner: '#1a3a2a',
    default: '#b8944e',
  };
  const accent = accentMap[type] ?? accentMap.default;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background:
            'linear-gradient(145deg, #0f2618 0%, #1a3a2a 40%, #0f2618 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'serif',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
            display: 'flex',
          }}
        />

        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(184,148,78,0.06) 0%, transparent 60%)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1,
            maxWidth: 900,
            padding: '0 60px',
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 14,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              color: accent,
              marginBottom: 24,
              display: 'flex',
            }}
          >
            AnglerPass
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 40 ? 48 : 60,
              fontWeight: 700,
              color: '#f0ead6',
              letterSpacing: '-1px',
              lineHeight: 1.15,
              textAlign: 'center',
              marginBottom: 20,
              display: 'flex',
            }}
          >
            {title}
          </div>

          {/* Divider */}
          <div
            style={{
              width: 60,
              height: 1,
              background: `${accent}66`,
              marginBottom: 20,
              display: 'flex',
            }}
          />

          {/* Subtitle */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 20,
              fontWeight: 400,
              color: 'rgba(240,234,214,0.5)',
              textAlign: 'center',
              lineHeight: 1.6,
              display: 'flex',
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Water wave decoration */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <svg
            width="1200"
            height="60"
            viewBox="0 0 1200 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 40 Q150 20 300 35 Q450 50 600 30 Q750 10 900 35 Q1050 60 1200 40 V60 H0 Z"
              fill="rgba(58,107,124,0.08)"
            />
            <path
              d="M0 45 Q150 30 300 42 Q450 54 600 38 Q750 22 900 42 Q1050 62 1200 45 V60 H0 Z"
              fill="rgba(58,107,124,0.05)"
            />
          </svg>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            fontFamily: 'sans-serif',
            fontSize: 13,
            color: 'rgba(240,234,214,0.2)',
            display: 'flex',
          }}
        >
          anglerpass.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
