'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ClickUpStatus } from '@/lib/types';
import { FIELD_IDS } from '@/lib/types';

interface CreateTaskFormProps {
  statuses: ClickUpStatus[];
  onSubmit: (name: string, status: string, dueDate?: number, description?: string, customFields?: Array<{ id: string; value: unknown }>) => Promise<void>;
  onCancel: () => void;
}

export function CreateTaskForm({
  statuses,
  onSubmit,
  onCancel,
}: CreateTaskFormProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('ai intake new requests');
  const [dueDate, setDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sponsor, setSponsor] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (showDatePicker && dateInputRef.current) {
      dateInputRef.current.focus();
      (dateInputRef.current as unknown as { showPicker?: () => void }).showPicker?.();
    }
  }, [showDatePicker]);

  const intakeStatuses = statuses
    .filter(
      (s) =>
        s.status.toLowerCase().includes('intake') &&
        s.type !== 'closed'
    )
    .sort((a, b) => a.orderindex - b.orderindex);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) return;

      setSubmitting(true);
      try {
        const dueDateTs = dueDate
          ? new Date(dueDate + 'T00:00:00').getTime()
          : undefined;
        const customFields = sponsor.trim()
          ? [{ id: FIELD_IDS.PROJECT_SPONSOR, value: sponsor.trim() }]
          : undefined;
        await onSubmit(trimmed, status, dueDateTs, description.trim() || undefined, customFields);
      } finally {
        setSubmitting(false);
      }
    },
    [name, status, dueDate, sponsor, description, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [onCancel, handleSubmit]
  );

  return (
    <form
      className="create-form"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <div className="create-form__label">New Task</div>
      <input
        ref={inputRef}
        className="create-form__input"
        type="text"
        placeholder="Task name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={submitting}
      />
      <select
        className="task-tile__status-select"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={submitting}
      >
        {intakeStatuses.map((s) => (
          <option key={s.id} value={s.status}>
            {s.status.replace(/^ai intake\s*/i, '')}
          </option>
        ))}
      </select>
      {showDatePicker ? (
        <div className="create-form__due-wrapper">
          <input
            ref={dateInputRef}
            className="task-tile__due-input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={submitting}
          />
          <button
            type="button"
            className="create-form__due-clear"
            onClick={() => {
              setDueDate('');
              setShowDatePicker(false);
            }}
            disabled={submitting}
            title="Remove due date"
          >
            &times;
          </button>
        </div>
      ) : (
        <span
          className="create-form__due-placeholder"
          onClick={() => setShowDatePicker(true)}
        >
          No due date
        </span>
      )}
      <input
        className="create-form__input"
        type="text"
        placeholder="Project sponsor (optional)"
        value={sponsor}
        onChange={(e) => setSponsor(e.target.value)}
        disabled={submitting}
      />
      <textarea
        className="create-form__textarea"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={submitting}
        rows={3}
      />
      <div className="create-form__actions">
        <button
          type="button"
          className="create-form__cancel"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={submitting || !name.trim()}
        >
          {submitting ? 'Creating...' : 'Create'}
        </button>
      </div>
      <div className="create-form__hint">Ctrl/Cmd+Enter to submit &middot; Escape to cancel</div>
    </form>
  );
}
