'use client';

import type { ClickUpComment } from '@/lib/types';

interface ActivityStreamProps {
  comments: ClickUpComment[];
  loading: boolean;
}

export function ActivityStream({ comments, loading }: ActivityStreamProps) {
  if (loading) {
    return (
      <div className="activity-stream">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="comment">
            <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton--text" style={{ width: '40%' }} />
              <div className="skeleton skeleton--text" style={{ width: '80%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return <div className="empty-state" style={{ height: 48, fontSize: 'var(--font-size-xs)' }}>No comments yet</div>;
  }

  // Show oldest first (most recent at bottom)
  const sorted = [...comments].sort(
    (a, b) => Number(a.date) - Number(b.date)
  );

  return (
    <div className="activity-stream">
      {sorted.map((comment) => (
        <div key={comment.id} className="comment">
          <div className="comment__avatar">
            {comment.user.initials || getInitials(comment.user.username)}
          </div>
          <div className="comment__body">
            <div className="comment__header">
              <span className="comment__user">{comment.user.username}</span>
              <span className="comment__time">
                {formatCommentTime(Number(comment.date))}
              </span>
            </div>
            <div className="comment__text">{comment.comment_text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatCommentTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
