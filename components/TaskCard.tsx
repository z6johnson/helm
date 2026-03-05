'use client';

import type { DashboardTask } from '@/lib/types';
import { FIELD_IDS } from '@/lib/types';

interface TaskCardProps {
  task: DashboardTask;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isStale = task.staleDays >= 14;
  const requester =
    task.customFields[FIELD_IDS.PROJECT_SPONSOR]?.value ||
    task.customFields[FIELD_IDS.REQUESTER_NAME]?.value;

  const daysUntilDue = task.dueDate
    ? Math.floor((task.dueDate - Date.now()) / 86400000)
    : null;
  const showDue = daysUntilDue !== null && daysUntilDue <= 7;

  return (
    <div
      className="task-card"
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
        <span className={isStale ? 'task-card__stale' : ''}>
          {formatAge(task.staleDays)}
        </span>
        {showDue && (
          <span
            className={`task-card__due ${daysUntilDue < 0 ? 'task-card__stale' : ''}`}
          >
            {formatDueDate(task.dueDate!)}
          </span>
        )}
      </div>
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
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
}
