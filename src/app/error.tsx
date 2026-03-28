'use client';

/* eslint-disable @next/next/no-img-element */

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-forest-deep)',
        padding: '40px 32px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            marginBottom: 48,
          }}
        >
          <img
            src="/images/anglerpass-noword-logo.svg"
            alt=""
            style={{ height: 36, width: 'auto', opacity: 0.7 }}
          />
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22,
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '-.3px',
            }}
          >
            AnglerPass
          </span>
        </a>

        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'var(--color-bronze-light)',
            marginBottom: 16,
          }}
        >
          Something went wrong
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 500,
            color: 'var(--color-parchment)',
            letterSpacing: '-.5px',
            lineHeight: 1.15,
            margin: '0 0 16px',
          }}
        >
          Upstream conditions
        </h1>

        <p
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: 'rgba(240,234,214,.5)',
            marginBottom: 40,
          }}
        >
          We hit an unexpected snag. This has been noted and we&rsquo;re working on it.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '.3px',
              background: 'var(--color-bronze)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              transition: 'all .4s',
            }}
          >
            Try Again
          </button>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '.3px',
              textDecoration: 'none',
              background: 'transparent',
              color: 'var(--color-parchment)',
              border: '1px solid rgba(240,234,214,.2)',
              transition: 'all .4s',
            }}
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
