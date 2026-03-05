'use client';

import type { DashboardTask } from '@/lib/types';
import { FIELD_IDS } from '@/lib/types';

interface TaskCardProps {
  task: DashboardTask;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isStale = task.staleDays >= 14;
  const vcArea = task.customFields[FIELD_IDS.VC_AREA_ORG]?.value;
  const requester =
    task.customFields[FIELD_IDS.PROJECT_SPONSOR]?.value ||
    task.customFields[FIELD_IDS.REQUESTER_NAME]?.value;

  return (
    <div
      className={`task-card ${isStale ? 'task-card--stale' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="task-card__name">{task.name}</div>
      <div className="task-card__meta">
        <span
          className="task-card__status"
          style={{ color: task.statusColor }}
        >
          {task.status}
        </span>
        {requester && typeof requester === 'string' && (
          <span>{requester}</span>
        )}
        {vcArea && typeof vcArea === 'string' && <span>{vcArea}</span>}
        <span className={isStale ? 'task-card__stale' : ''}>
          {formatAge(task.staleDays)}
        </span>
        {task.dueDate && (
          <span
            className={
              task.dueDate < Date.now() ? 'task-card__stale' : ''
            }
          >
            Due {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
      {task.attentionReasons.length > 0 && (
        <div className="task-card__meta" style={{ marginTop: 4 }}>
          {task.attentionReasons.map((reason, i) => (
            <span
              key={i}
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-gray-400)',
              }}
            >
              {reason}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function formatAge(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDueDate(timestamp: number): string {
  const days = Math.floor((timestamp - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days}d`;
}
