'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ClickUpStatus } from '@/lib/types';

interface CreateTaskFormProps {
  statuses: ClickUpStatus[];
  onSubmit: (name: string, status: string) => Promise<void>;
  onCancel: () => void;
}

export function CreateTaskForm({
  statuses,
  onSubmit,
  onCancel,
}: CreateTaskFormProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('ai intake new requests');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        await onSubmit(trimmed, status);
      } finally {
        setSubmitting(false);
      }
    },
    [name, status, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
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
    </form>
  );
}
