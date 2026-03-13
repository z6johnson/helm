'use client';

import { useState, useRef, useCallback } from 'react';
import useSWR from 'swr';
import type { Quarter, MeasurementPayload, MeasurementIndicator, MeasurementDimension } from '@/lib/types';
import { useToast } from '@/components/Toast';

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`API error ${r.status}`);
    return r.json();
  });

function IndicatorCard({
  indicator,
  quarter,
  onSaved,
}: {
  indicator: MeasurementIndicator;
  quarter: Quarter;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const isManual = indicator.source === 'manual';
  const displayValue =
    indicator.value !== null ? formatValue(indicator.value, indicator.unit) : '\u2014';

  const handleStartEdit = () => {
    if (!isManual) return;
    setInputValue(indicator.value !== null ? String(indicator.value) : '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = useCallback(async () => {
    setEditing(false);
    const parsed = inputValue.trim() === '' ? null : Number(inputValue);
    if (parsed !== null && isNaN(parsed)) return;
    if (parsed === indicator.value) return;

    try {
      await fetch('/api/measurements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quarter,
          values: { [indicator.key]: parsed },
        }),
      });
      onSaved();
    } catch {
      showToast('Failed to save measurement', 'error');
    }
  }, [inputValue, indicator.value, indicator.key, quarter, onSaved, showToast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  return (
    <div
      className={`command-indicator ${isManual ? 'command-indicator--editable' : ''}`}
      onClick={handleStartEdit}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="command-indicator__input"
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span className="command-indicator__value">{displayValue}</span>
      )}
      <span className="command-indicator__label">{indicator.label}</span>
      <span className="command-indicator__badge">
        {indicator.source === 'clickup' ? 'auto' : indicator.unit}
      </span>
    </div>
  );
}

function formatValue(value: number, unit: string): string {
  if (unit === 'percent') return `${value}%`;
  return String(value);
}

function DimensionSection({
  dimension,
  quarter,
  onSaved,
}: {
  dimension: MeasurementDimension;
  quarter: Quarter;
  onSaved: () => void;
}) {
  return (
    <section className="command-dimension">
      <div className="command-dimension__header">
        <h2 className="command-dimension__title">{dimension.title}</h2>
        <p className="command-dimension__subtitle">{dimension.subtitle}</p>
      </div>
      <div className="command-indicators">
        <div className="command-indicators__column">
          <span className="command-indicators__heading">Leading</span>
          {dimension.leading.map((ind) => (
            <IndicatorCard
              key={ind.key}
              indicator={ind}
              quarter={quarter}
              onSaved={onSaved}
            />
          ))}
        </div>
        <div className="command-indicators__column">
          <span className="command-indicators__heading">Lagging</span>
          {dimension.lagging.map((ind) => (
            <IndicatorCard
              key={ind.key}
              indicator={ind}
              quarter={quarter}
              onSaved={onSaved}
            />
          ))}
        </div>
      </div>
      <div className="command-alignment">
        {dimension.alignment.map((a, i) => (
          <span key={i} className="command-alignment__item">
            {a.advances} &middot; {a.ucPrinciple}
          </span>
        ))}
      </div>
    </section>
  );
}

export function CommandDashboard({
  quarter,
}: {
  quarter: Quarter;
}) {
  const { data, isLoading, mutate } = useSWR<MeasurementPayload>(
    `/api/measurements?quarter=${quarter}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleSaved = useCallback(() => {
    mutate();
  }, [mutate]);

  if (isLoading || !data) {
    return (
      <div className="command-dashboard">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 180, marginBottom: 24 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="command-dashboard">
      {data.dimensions.map((dim) => (
        <DimensionSection
          key={dim.id}
          dimension={dim}
          quarter={quarter}
          onSaved={handleSaved}
        />
      ))}
    </div>
  );
}
