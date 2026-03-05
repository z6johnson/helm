'use client';

interface StatusBarProps {
  lastSynced: number | null;
  taskCount: number;
  syncing: boolean;
  onSync: () => void;
}

export function StatusBar({
  lastSynced,
  taskCount,
  syncing,
  onSync,
}: StatusBarProps) {
  const syncText = lastSynced
    ? `Last sync: ${formatRelativeTime(lastSynced)}`
    : 'Not synced';

  return (
    <div className="status-bar">
      <div className="status-bar__left">
        <span
          className={`status-bar__dot ${
            syncing
              ? 'status-bar__dot--syncing'
              : lastSynced
                ? 'status-bar__dot--ok'
                : ''
          }`}
        />
        <span>{syncText}</span>
        <span>{taskCount} tasks</span>
      </div>
      <button
        className="status-bar__sync-btn"
        onClick={onSync}
        disabled={syncing}
      >
        {syncing ? 'Syncing...' : 'Sync now'}
      </button>
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
