'use client';

import { useState, useCallback } from 'react';
import type { DashboardTask, NormalizedField } from '@/lib/types';
import { DISPLAY_FIELD_IDS, EDITABLE_FIELD_TYPES } from '@/lib/types';
import { useToast } from './Toast';

interface MetadataGridProps {
  task: DashboardTask;
  onFieldUpdate: (fieldId: string, value: unknown, displayValue: string) => void;
}

export function MetadataGrid({ task, onFieldUpdate }: MetadataGridProps) {
  const fields = DISPLAY_FIELD_IDS.map((id) => task.customFields[id]).filter(
    (f): f is NormalizedField => f !== undefined && f.value !== null
  );

  if (fields.length === 0) {
    return <div className="empty-state" style={{ height: 80 }}>No metadata</div>;
  }

  // Separate long text fields (full-width) from compact fields (two-column)
  const compactFields = fields.filter(
    (f) => f.type !== 'text' && !isLongValue(f)
  );
  const longFields = fields.filter(
    (f) => f.type === 'text' || isLongValue(f)
  );

  return (
    <div>
      <div className="metadata-grid">
        {compactFields.map((field) => (
          <FieldCell
            key={field.id}
            field={field}
            taskId={task.id}
            onFieldUpdate={onFieldUpdate}
          />
        ))}
      </div>
      {longFields.map((field) => (
        <div key={field.id} className="metadata-field" style={{ marginTop: 'var(--u4)' }}>
          <div className="metadata-field__label">{field.name}</div>
          <div className="metadata-field__value metadata-field__value--long">
            {formatValue(field)}
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldCell({
  field,
  taskId,
  onFieldUpdate,
}: {
  field: NormalizedField;
  taskId: string;
  onFieldUpdate: (fieldId: string, value: unknown, displayValue: string) => void;
}) {
  const isEditable = EDITABLE_FIELD_TYPES.includes(field.type);
  const { showToast } = useToast();

  if (isEditable && field.type === 'drop_down' && field.options) {
    return (
      <DropdownField
        field={field}
        taskId={taskId}
        onFieldUpdate={onFieldUpdate}
      />
    );
  }

  if (isEditable && (field.type === 'short_text' || field.type === 'email')) {
    return (
      <InlineTextField
        field={field}
        taskId={taskId}
        onFieldUpdate={onFieldUpdate}
      />
    );
  }

  return (
    <div className="metadata-field">
      <div className="metadata-field__label">{field.name}</div>
      <div className="metadata-field__value">{formatValue(field)}</div>
    </div>
  );
}

function DropdownField({
  field,
  taskId,
  onFieldUpdate,
}: {
  field: NormalizedField;
  taskId: string;
  onFieldUpdate: (fieldId: string, value: unknown, displayValue: string) => void;
}) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOption = field.options?.find(
        (o) => o.id === e.target.value
      );
      if (!selectedOption) return;

      setSaving(true);
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customField: {
              id: field.id,
              value: selectedOption.orderindex,
            },
          }),
        });
        if (!res.ok) throw new Error('Failed to update field');
        onFieldUpdate(field.id, selectedOption.orderindex, selectedOption.name);
      } catch {
        showToast(`Failed to update ${field.name}`, 'error');
      } finally {
        setSaving(false);
      }
    },
    [field, taskId, onFieldUpdate, showToast]
  );

  const currentOption = field.options?.find(
    (o) => o.name === field.value
  );

  return (
    <div className="metadata-field">
      <div className="metadata-field__label">{field.name}</div>
      <select
        className="editable-select"
        value={currentOption?.id || ''}
        onChange={handleChange}
        disabled={saving}
      >
        <option value="">--</option>
        {field.options?.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function InlineTextField({
  field,
  taskId,
  onFieldUpdate,
}: {
  field: NormalizedField;
  taskId: string;
  onFieldUpdate: (fieldId: string, value: unknown, displayValue: string) => void;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(field.value || ''));
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (inputValue === String(field.value || '')) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customField: { id: field.id, value: inputValue },
        }),
      });
      if (!res.ok) throw new Error('Failed to update field');
      onFieldUpdate(field.id, inputValue, inputValue);
      setEditing(false);
    } catch {
      showToast(`Failed to update ${field.name}`, 'error');
    } finally {
      setSaving(false);
    }
  }, [field, taskId, inputValue, onFieldUpdate, showToast]);

  if (!editing) {
    return (
      <div className="metadata-field">
        <div className="metadata-field__label">{field.name}</div>
        <div
          className="metadata-field__value"
          onClick={() => setEditing(true)}
          style={{ cursor: 'pointer' }}
        >
          {formatValue(field)}
        </div>
      </div>
    );
  }

  return (
    <div className="metadata-field">
      <div className="metadata-field__label">{field.name}</div>
      <input
        className="editable-input"
        type={field.type === 'email' ? 'email' : 'text'}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') {
            setInputValue(String(field.value || ''));
            setEditing(false);
          }
        }}
        autoFocus
        disabled={saving}
      />
    </div>
  );
}

function formatValue(field: NormalizedField): string {
  if (field.value === null) return '';
  if (Array.isArray(field.value)) return field.value.join(', ');
  if (field.type === 'currency' && typeof field.value === 'number') {
    return `$${field.value.toLocaleString()}`;
  }
  if (field.type === 'date' && typeof field.value === 'string') {
    const d = new Date(Number(field.value));
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return String(field.value);
}

function isLongValue(field: NormalizedField): boolean {
  if (typeof field.value === 'string' && field.value.length > 100) return true;
  return false;
}
