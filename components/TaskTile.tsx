'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { DashboardTask, ClickUpStatus, ClickUpComment } from '@/lib/types';
import { FIELD_IDS } from '@/lib/types';
import { ActivityStream } from './ActivityStream';
import { CommentInput } from './CommentInput';
import { useToast } from './Toast';

interface TaskTileProps {
  task: DashboardTask;
  statuses: ClickUpStatus[];
  onTaskUpdate: (task: DashboardTask) => void;
}

export function TaskTile({ task, statuses, onTaskUpdate }: TaskTileProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(task.name);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<ClickUpComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setNameValue(task.name);
  }, [task.name]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const handleNameSave = useCallback(async () => {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === task.name) {
      setNameValue(task.name);
      return;
    }

    const updatedTask = { ...task, name: trimmed };
    onTaskUpdate(updatedTask);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to update name');
    } catch {
      onTaskUpdate(task);
      setNameValue(task.name);
      showToast('Failed to update task name', 'error');
    }
  }, [nameValue, task, onTaskUpdate, showToast]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleNameSave();
      } else if (e.key === 'Escape') {
        setEditingName(false);
        setNameValue(task.name);
      }
    },
    [handleNameSave, task.name]
  );

  const handleStatusChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
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
        onTaskUpdate(task);
        showToast('Failed to update status', 'error');
      }
    },
    [task, statuses, onTaskUpdate, showToast]
  );

  const toggleComments = useCallback(() => {
    const opening = !commentsOpen;
    setCommentsOpen(opening);

    if (opening && !commentsFetched) {
      setLoadingComments(true);
      fetch(`/api/tasks/${task.id}/comments`)
        .then((res) => res.json())
        .then((data) => {
          setComments(data.comments || []);
          setCommentsFetched(true);
        })
        .catch(() => setComments([]))
        .finally(() => setLoadingComments(false));
    }
  }, [commentsOpen, commentsFetched, task.id]);

  const handleCommentAdded = useCallback(() => {
    fetch(`/api/tasks/${task.id}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => {});
  }, [task.id]);

  const sponsor = task.customFields[FIELD_IDS.PROJECT_SPONSOR];
  const sponsorValue = sponsor?.value;
  const sponsorDisplay =
    typeof sponsorValue === 'string'
      ? sponsorValue
      : Array.isArray(sponsorValue)
        ? sponsorValue.join(', ')
        : null;

  const isOverdue = task.dueDate !== null && task.dueDate < Date.now();

  const intakeStatuses = statuses
    .filter(
      (s) =>
        s.status.toLowerCase().includes('intake') &&
        s.type !== 'closed'
    )
    .sort((a, b) => a.orderindex - b.orderindex);

  return (
    <div
      className="task-tile"
      style={{ '--status-color': task.statusColor } as React.CSSProperties}
    >
      {/* Task Name */}
      <div className="task-tile__name-wrap">
        {editingName ? (
          <input
            ref={nameInputRef}
            className="task-tile__name-input"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
          />
        ) : (
          <h3
            className="task-tile__name"
            onClick={() => setEditingName(true)}
            title="Click to edit"
          >
            {task.name}
          </h3>
        )}
      </div>

      {/* Status + Due Date row */}
      <div className="task-tile__row">
        <select
          className="task-tile__status-select"
          value={task.status}
          onChange={handleStatusChange}
        >
          {intakeStatuses.map((s) => (
            <option key={s.id} value={s.status}>
              {s.status.replace(/^ai intake\s*/i, '')}
            </option>
          ))}
        </select>
        <span
          className={`task-tile__due ${isOverdue ? 'task-tile__due--overdue' : ''}`}
        >
          {task.dueDate
            ? new Date(task.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : 'No due date'}
        </span>
      </div>

      {/* Project Sponsor */}
      <div className="task-tile__field">
        <span className="field-label">Sponsor</span>
        <span className={`task-tile__field-value ${!sponsorDisplay ? 'task-tile__field-value--empty' : ''}`}>
          {sponsorDisplay || 'None'}
        </span>
      </div>

      {/* Comments */}
      <div className="task-tile__divider" />
      <button
        className="task-tile__comments-toggle"
        onClick={toggleComments}
      >
        <span>Comments</span>
        <span className="task-tile__toggle-arrow">
          {commentsOpen ? '\u25B4' : '\u25BE'}
        </span>
      </button>

      {commentsOpen && (
        <div className="task-tile__comments">
          <ActivityStream comments={comments} loading={loadingComments} />
          <CommentInput
            taskId={task.id}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      )}

      {/* ClickUp Link */}
      <a
        className="task-tile__link"
        href={task.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open in ClickUp &rarr;
      </a>
    </div>
  );
}
