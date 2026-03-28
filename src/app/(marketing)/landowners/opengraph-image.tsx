import { ImageResponse } from 'next/og';

export const alt = 'For Landowners — AnglerPass';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
          background: 'linear-gradient(145deg, #0f2618 0%, #1a3a2a 40%, #0f2618 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, transparent 0%, #2d5a3d 30%, #4a7c5a 50%, #2d5a3d 70%, transparent 100%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(45,90,61,0.15) 0%, transparent 60%)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '0.2em',
              color: 'rgba(240,234,214,0.35)',
              marginBottom: 20,
              display: 'flex',
            }}
          >
            ANGLERPASS
          </div>

          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: '#f0ead6',
              letterSpacing: '-1px',
              lineHeight: 1.1,
              marginBottom: 12,
              display: 'flex',
            }}
          >
            For Landowners
          </div>

          <div style={{ width: 50, height: 1, background: 'rgba(45,90,61,0.6)', marginBottom: 24, display: 'flex' }} />

          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 21,
              fontWeight: 400,
              color: 'rgba(240,234,214,0.5)',
              maxWidth: 620,
              textAlign: 'center',
              lineHeight: 1.6,
              display: 'flex',
            }}
          >
            Manage private water access professionally. Property registration, access controls, and booking management.
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 36, fontFamily: 'sans-serif' }}>
            {['Property Profiles', 'Access Controls', 'Revenue Tracking'].map((label) => (
              <div
                key={label}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  color: 'rgba(240,234,214,0.55)',
                  padding: '7px 16px',
                  borderRadius: 100,
                  border: '1px solid rgba(45,90,61,0.4)',
                  display: 'flex',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 32,
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
    { ...size }
  );
}
