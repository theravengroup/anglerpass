import { ImageResponse } from 'next/og';

export const alt = 'AnglerPass — Private Water Access, Modernized';
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
        {/* Decorative top line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, transparent 0%, #b8944e 50%, transparent 100%)',
            display: 'flex',
          }}
        />

        {/* Subtle radial glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at 30% 20%, rgba(184,148,78,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(74,124,104,0.08) 0%, transparent 50%)',
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
              color: '#b8944e',
              marginBottom: 24,
              display: 'flex',
            }}
          >
            Private Water Access, Modernized
          </div>

          {/* Logo text */}
          <div
            style={{
              fontSize: 82,
              fontWeight: 700,
              color: '#f0ead6',
              letterSpacing: '-1.5px',
              lineHeight: 1,
              marginBottom: 28,
              display: 'flex',
            }}
          >
            AnglerPass
          </div>

          {/* Divider */}
          <div
            style={{
              width: 60,
              height: 1,
              background: 'rgba(184,148,78,0.4)',
              marginBottom: 28,
              display: 'flex',
            }}
          />

          {/* Description */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 22,
              fontWeight: 400,
              color: 'rgba(240,234,214,0.55)',
              maxWidth: 680,
              textAlign: 'center',
              lineHeight: 1.6,
              display: 'flex',
            }}
          >
            The operating platform for private fly fishing. Manage properties, memberships, and fishing days — all in one place.
          </div>

          {/* Three audience pills */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 40,
              fontFamily: 'sans-serif',
            }}
          >
            {[
              { label: 'Landowners', accent: false },
              { label: 'Clubs', accent: false },
              { label: 'Anglers', accent: true },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  color: item.accent ? '#f0ead6' : 'rgba(240,234,214,0.7)',
                  padding: '8px 20px',
                  borderRadius: 100,
                  border: `1px solid ${item.accent ? 'rgba(184,148,78,0.35)' : 'rgba(240,234,214,0.12)'}`,
                  display: 'flex',
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontFamily: 'sans-serif',
            fontSize: 13,
            color: 'rgba(240,234,214,0.25)',
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
