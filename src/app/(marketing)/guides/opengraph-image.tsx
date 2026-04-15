import { getLogoDataUri, getOgBackgroundDataUri } from '@/lib/og-logo';
import { jpegOgImage } from '@/lib/og-jpeg';

export const alt = 'For Independent Guides — AnglerPass';
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

        {/* Charcoal overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(145deg, rgba(20,22,26,0.82) 0%, rgba(30,32,38,0.55) 40%, rgba(20,22,26,0.85) 100%)',
            display: 'flex',
          }}
        />

        {/* Charcoal-gold accent top edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, transparent 0%, #8a7a5a 30%, #a89670 50%, #8a7a5a 70%, transparent 100%)',
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
              color: '#8a7a5a',
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
            For Independent Guides
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: 60,
              height: 2,
              background: '#8a7a5a',
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
            Build your client base on private water. Manage availability and earn more with AnglerPass.
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
            background: 'linear-gradient(180deg, transparent 0%, rgba(20,22,26,0.9) 100%)',
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
              color: 'rgba(138,122,90,0.5)',
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
