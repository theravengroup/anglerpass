import { ImageResponse } from 'next/og';
import { getLogoDataUri, getOgBackgroundDataUri } from '@/lib/og-logo';

export const alt = 'AnglerPass — Private Water Access, Modernized';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoSrc = getLogoDataUri();
  const bgSrc = getOgBackgroundDataUri('hero');

  return new ImageResponse(
    (
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

        {/* Dark cinematic overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(10,20,15,0.75) 0%, rgba(10,20,15,0.55) 40%, rgba(10,20,15,0.80) 100%)',
            display: 'flex',
          }}
        />

        {/* Gold accent top edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, transparent 0%, #b8944e 30%, #d4b06a 50%, #b8944e 70%, transparent 100%)',
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
          {/* Logo mark */}
          <img
            src={logoSrc}
            width={110}
            height={90}
            style={{ marginBottom: 24 }}
          />

          {/* Brand name */}
          <div
            style={{
              fontSize: 86,
              fontWeight: 700,
              fontFamily: 'serif',
              color: '#f5f0e0',
              letterSpacing: '-2px',
              lineHeight: 1,
              marginBottom: 16,
              display: 'flex',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            AnglerPass
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: 80,
              height: 2,
              background: '#b8944e',
              marginBottom: 20,
              display: 'flex',
            }}
          />

          {/* Tagline — bold and visible */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 28,
              fontWeight: 600,
              color: '#f5f0e0',
              letterSpacing: '0.08em',
              textAlign: 'center',
              display: 'flex',
              textShadow: '0 1px 12px rgba(0,0,0,0.6)',
            }}
          >
            Private Water Access, Modernized
          </div>

          {/* Sub-description */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 17,
              fontWeight: 400,
              color: 'rgba(245,240,224,0.7)',
              maxWidth: 600,
              textAlign: 'center',
              lineHeight: 1.6,
              marginTop: 16,
              display: 'flex',
              textShadow: '0 1px 8px rgba(0,0,0,0.5)',
            }}
          >
            The platform for private fly fishing — properties, clubs, and anglers, all in one place.
          </div>
        </div>

        {/* Bottom bar */}
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
              color: 'rgba(184,148,78,0.6)',
              letterSpacing: '0.15em',
              display: 'flex',
            }}
          >
            anglerpass.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
