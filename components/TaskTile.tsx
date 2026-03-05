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
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(false);
  const [sponsorValue, setSponsorValue] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(task.description);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<ClickUpComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const sponsorInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    if (editingDueDate && dueDateInputRef.current) {
      dueDateInputRef.current.showPicker?.();
      dueDateInputRef.current.focus();
    }
  }, [editingDueDate]);

  useEffect(() => {
    if (editingSponsor && sponsorInputRef.current) {
      sponsorInputRef.current.focus();
      sponsorInputRef.current.select();
    }
  }, [editingSponsor]);

  useEffect(() => {
    setDescriptionValue(task.description);
  }, [task.description]);

  useEffect(() => {
    if (editingDescription && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [editingDescription]);

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

  const handleDueDateChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditingDueDate(false);
      const val = e.target.value;
      const newDueDate = val ? new Date(val + 'T00:00:00').getTime() : null;

      if (newDueDate === task.dueDate) return;

      const updatedTask = { ...task, dueDate: newDueDate };
      onTaskUpdate(updatedTask);

      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ due_date: newDueDate }),
        });
        if (!res.ok) throw new Error('Failed to update due date');
      } catch {
        onTaskUpdate(task);
        showToast('Failed to update due date', 'error');
      }
    },
    [task, onTaskUpdate, showToast]
  );

  const handleSponsorSave = useCallback(async () => {
    setEditingSponsor(false);
    const trimmed = sponsorValue.trim();
    const currentDisplay =
      typeof sponsor?.value === 'string'
        ? sponsor.value
        : Array.isArray(sponsor?.value)
          ? (sponsor.value as string[]).join(', ')
          : '';

    if (trimmed === currentDisplay) return;

    const updatedFields = { ...task.customFields };
    updatedFields[FIELD_IDS.PROJECT_SPONSOR] = {
      ...(updatedFields[FIELD_IDS.PROJECT_SPONSOR] || {
        id: FIELD_IDS.PROJECT_SPONSOR,
        name: 'Project Sponsor',
        type: 'short_text',
        rawValue: null,
      }),
      value: trimmed || null,
    };
    const updatedTask = { ...task, customFields: updatedFields };
    onTaskUpdate(updatedTask);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customField: {
            id: FIELD_IDS.PROJECT_SPONSOR,
            value: trimmed || null,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to update sponsor');
    } catch {
      onTaskUpdate(task);
      showToast('Failed to update sponsor', 'error');
    }
  }, [sponsorValue, task, onTaskUpdate, showToast]);

  const handleSponsorKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSponsorSave();
      } else if (e.key === 'Escape') {
        setEditingSponsor(false);
      }
    },
    [handleSponsorSave]
  );

  const handleDescriptionSave = useCallback(async () => {
    setEditingDescription(false);
    const trimmed = descriptionValue.trim();
    if (trimmed === task.description) return;

    const updatedTask = { ...task, description: trimmed };
    onTaskUpdate(updatedTask);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to update description');
    } catch {
      onTaskUpdate(task);
      setDescriptionValue(task.description);
      showToast('Failed to update description', 'error');
    }
  }, [descriptionValue, task, onTaskUpdate, showToast]);

  const handleDescriptionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleDescriptionSave();
      } else if (e.key === 'Escape') {
        setEditingDescription(false);
        setDescriptionValue(task.description);
      }
    },
    [handleDescriptionSave, task.description]
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
  const sponsorRawValue = sponsor?.value;
  const sponsorDisplay =
    typeof sponsorRawValue === 'string'
      ? sponsorRawValue
      : Array.isArray(sponsorRawValue)
        ? sponsorRawValue.join(', ')
        : null;

  const dueDateISO = task.dueDate
    ? new Date(task.dueDate).toISOString().split('T')[0]
    : '';

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
        {editingDueDate ? (
          <input
            ref={dueDateInputRef}
            className="task-tile__due-input"
            type="date"
            defaultValue={dueDateISO}
            onChange={handleDueDateChange}
            onBlur={() => setEditingDueDate(false)}
          />
        ) : (
          <span
            className={`task-tile__due task-tile__due--editable ${isOverdue ? 'task-tile__due--overdue' : ''}`}
            onClick={() => setEditingDueDate(true)}
            title="Click to edit due date"
          >
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'No due date'}
          </span>
        )}
      </div>

      {/* Project Sponsor */}
      <div className="task-tile__field">
        <span className="field-label">Sponsor</span>
        {editingSponsor ? (
          <input
            ref={sponsorInputRef}
            className="editable-input"
            value={sponsorValue}
            onChange={(e) => setSponsorValue(e.target.value)}
            onBlur={handleSponsorSave}
            onKeyDown={handleSponsorKeyDown}
            placeholder="Enter sponsor..."
          />
        ) : (
          <span
            className={`task-tile__field-value ${!sponsorDisplay ? 'task-tile__field-value--empty' : ''}`}
            onClick={() => {
              setSponsorValue(sponsorDisplay || '');
              setEditingSponsor(true);
            }}
            style={{ cursor: 'pointer' }}
            title="Click to edit sponsor"
          >
            {sponsorDisplay || 'None'}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="task-tile__field">
        <span className="field-label">Description</span>
        {editingDescription ? (
          <textarea
            ref={descriptionRef}
            className="task-tile__desc-textarea"
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            onBlur={handleDescriptionSave}
            onKeyDown={handleDescriptionKeyDown}
            placeholder="Enter description..."
            rows={3}
          />
        ) : (
          <span
            className={`task-tile__field-value ${!task.description ? 'task-tile__field-value--empty' : ''}`}
            onClick={() => {
              setDescriptionValue(task.description);
              setEditingDescription(true);
            }}
            style={{ cursor: 'pointer', whiteSpace: 'pre-wrap' }}
            title="Click to edit description"
          >
            {task.description || 'None'}
          </span>
        )}
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
