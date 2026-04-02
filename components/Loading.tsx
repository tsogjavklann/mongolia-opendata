'use client';

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="pulse-dot w-2 h-2 rounded-full"
          style={{ background: 'var(--accent)', animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <LoadingDots />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {message ?? '1212.mn-аас өгөгдөл татаж байна… (30-60 секунд болж болно)'}
      </p>
    </div>
  );
}
