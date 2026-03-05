'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'var(--font-sans)',
        gap: 'var(--u4)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--weight-bold)',
          letterSpacing: 'var(--tracking-caps)',
          textTransform: 'uppercase' as const,
          color: 'var(--color-gray-500)',
        }}
      >
        Something went wrong
      </div>
      <div
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-400)',
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        {error.message}
      </div>
      <button className="btn btn--ghost" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
