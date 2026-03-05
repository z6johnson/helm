'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { DashboardTask, ClickUpStatus, ClickUpComment } from '@/lib/types';
import { MetadataGrid } from './MetadataGrid';
import { ActivityStream } from './ActivityStream';
import { CommentInput } from './CommentInput';
import { useToast } from './Toast';

interface DetailDrawerProps {
  task: DashboardTask | null;
  statuses: ClickUpStatus[];
  onClose: () => void;
  onTaskUpdate: (task: DashboardTask) => void;
}

export function DetailDrawer({
  task,
  statuses,
  onClose,
  onTaskUpdate,
}: DetailDrawerProps) {
  const [comments, setComments] = useState<ClickUpComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const { showToast } = useToast();
  const drawerRef = useRef<HTMLDivElement>(null);
  const isOpen = task !== null;

  // Fetch comments when task changes
  useEffect(() => {
    if (!task) {
      setComments([]);
      return;
    }

    let cancelled = false;
    setLoadingComments(true);

    fetch(`/api/tasks/${task.id}/comments`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setComments(data.comments || []);
        }
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingComments(false);
      });

    return () => {
      cancelled = true;
    };
  }, [task?.id]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isOpen]);

  const handleStatusChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!task) return;
      const newStatus = e.target.value;
      const statusObj = statuses.find((s) => s.status === newStatus);

      const updatedTask: DashboardTask = {
        ...task,
        status: newStatus,
        statusColor: statusObj?.color || task.statusColor,
        statusOrderIndex: statusObj?.orderindex ?? task.statusOrderIndex,
      };
      onTaskUpdate(updatedTask);

      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error('Failed to update status');
      } catch {
        onTaskUpdate(task); // rollback
        showToast('Failed to update status', 'error');
      }
    },
    [task, statuses, onTaskUpdate, showToast]
  );

  const handleFieldUpdate = useCallback(
    (fieldId: string, _value: unknown, displayValue: string) => {
      if (!task) return;
      const updatedTask: DashboardTask = {
        ...task,
        customFields: {
          ...task.customFields,
          [fieldId]: {
            ...task.customFields[fieldId],
            value: displayValue,
          },
        },
      };
      onTaskUpdate(updatedTask);
    },
    [task, onTaskUpdate]
  );

  const handleCommentAdded = useCallback(() => {
    if (!task) return;
    // Refresh comments
    fetch(`/api/tasks/${task.id}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => {});
  }, [task]);

  return (
    <>
      <div
        className={`drawer-overlay ${isOpen ? 'drawer-overlay--open' : ''}`}
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        className={`drawer ${isOpen ? 'drawer--open' : ''}`}
        tabIndex={-1}
        role="dialog"
        aria-label={task?.name || 'Task details'}
      >
        {task && (
          <>
            <div className="drawer__header">
              <button className="drawer__close" onClick={onClose}>
                &times;
              </button>
              <div className="drawer__title">{task.name}</div>
              <div className="drawer__status-row">
                <select
                  className="editable-select"
                  value={task.status}
                  onChange={handleStatusChange}
                  style={{ width: 'auto', maxWidth: 280 }}
                >
                  {statuses
                    .filter((s) => s.type !== 'closed')
                    .sort((a, b) => a.orderindex - b.orderindex)
                    .map((s) => (
                      <option key={s.id} value={s.status}>
                        {s.status}
                      </option>
                    ))}
                </select>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-gray-400)',
                  }}
                >
                  Created{' '}
                  {new Date(task.dateCreated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <div className="drawer__body">
              <div className="drawer__section">
                <div className="drawer__section-title">Details</div>
                <MetadataGrid
                  task={task}
                  onFieldUpdate={handleFieldUpdate}
                />
              </div>

              {task.description && (
                <div className="drawer__section">
                  <div className="drawer__section-title">Description</div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      lineHeight: 'var(--line-height-relaxed)',
                      color: 'var(--color-gray-700)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {task.description}
                  </div>
                </div>
              )}

              <div className="drawer__section">
                <div className="drawer__section-title">Activity</div>
                <ActivityStream
                  comments={comments}
                  loading={loadingComments}
                />
              </div>
            </div>
            <CommentInput
              taskId={task.id}
              onCommentAdded={handleCommentAdded}
            />
          </>
        )}
      </div>
    </>
  );
}
