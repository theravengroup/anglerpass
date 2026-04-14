import { getLogoDataUri, getOgBackgroundDataUri } from '@/lib/og-logo';
import { jpegOgImage } from '@/lib/og-jpeg';

export const alt = 'Pricing — AnglerPass';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/jpeg';

export default async function Image() {
  const logoSrc = getLogoDataUri();
  const bgSrc = getOgBackgroundDataUri('hero');

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
        {/* Cinematic background */}
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
            background: 'linear-gradient(145deg, rgba(10,20,15,0.80) 0%, rgba(10,20,15,0.55) 40%, rgba(10,20,15,0.82) 100%)',
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
            width={90}
            height={74}
            style={{ marginBottom: 20 }}
          />

          {/* Eyebrow */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.25em',
              color: '#b8944e',
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
              fontSize: 72,
              fontWeight: 700,
              fontFamily: 'serif',
              color: '#f5f0e0',
              letterSpacing: '-1px',
              lineHeight: 1.1,
              marginBottom: 16,
              display: 'flex',
              textShadow: '0 2px 16px rgba(0,0,0,0.5)',
            }}
          >
            Pricing
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: 60,
              height: 2,
              background: '#b8944e',
              marginBottom: 20,
              display: 'flex',
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 22,
              fontWeight: 500,
              color: 'rgba(245,240,224,0.85)',
              maxWidth: 640,
              textAlign: 'center',
              lineHeight: 1.6,
              display: 'flex',
              textShadow: '0 1px 8px rgba(0,0,0,0.5)',
            }}
          >
            Transparent pricing for clubs, landowners, anglers, and guides.
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
              color: 'rgba(184,148,78,0.5)',
              letterSpacing: '0.15em',
              display: 'flex',
            }}
          >
            anglerpass.com
          </div>
        </div>
      </div>,
    size
  );
}
