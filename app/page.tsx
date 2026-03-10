'use client';

import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import { TaskGrid } from '@/components/TaskGrid';
import { StatusBar } from '@/components/StatusBar';
import { ToastProvider, useToast } from '@/components/Toast';
import type { DashboardTask, CachePayload } from '@/lib/types';

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`API error ${r.status}`);
    return r.json();
  });

function countByStatus(tasks: DashboardTask[]) {
  let newCount = 0;
  let scoping = 0;
  let resourcing = 0;
  let programs = 0;
  for (const t of tasks) {
    if (t.source === 'programs') {
      programs++;
      continue;
    }
    const s = t.status.toLowerCase();
    if (s.includes('new')) newCount++;
    else if (s.includes('scoping')) scoping++;
    else if (s.includes('resourcing')) resourcing++;
  }
  return { new: newCount, scoping, resourcing, programs };
}

function DashboardInner() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { showToast } = useToast();
  const { data, error, isLoading, mutate } = useSWR<CachePayload>(
    '/api/tasks',
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
    }
  );

  const handleSync = useCallback(async () => {
    await fetch('/api/cron/sync', { method: 'POST' });
    mutate();
  }, [mutate]);

  const handleTaskUpdate = useCallback(
    (updatedTask: DashboardTask) => {
      if (!data) return;
      const updated = {
        ...data,
        tasks: data.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t
        ),
      };
      mutate(updated, false);
    },
    [data, mutate]
  );

  const handleCreateTask = useCallback(
    async (name: string, status: string, dueDate?: number, description?: string, customFields?: Array<{ id: string; value: unknown }>) => {
      try {
        const body: Record<string, unknown> = { name, status };
        if (dueDate != null) body.due_date = dueDate;
        if (description) body.description = description;
        if (customFields) body.custom_fields = customFields;
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to create task');
        const newTask: DashboardTask = await res.json();

        if (data) {
          mutate(
            {
              ...data,
              tasks: [...data.tasks, newTask],
              taskCount: data.taskCount + 1,
            },
            false
          );
        }
        setShowCreateForm(false);
      } catch {
        showToast('Failed to create task', 'error');
        throw new Error('Failed to create task');
      }
    },
    [data, mutate, showToast]
  );

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
          (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowCreateForm(true);
      }
      if (e.key === 'Escape') {
        setShowCreateForm(false);
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Helm</h1>
        </header>
        <div className="dashboard-body">
          <div className="task-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 200 }} />
            ))}
          </div>
        </div>
        <StatusBar
          lastSynced={null}
          taskCount={0}
          syncing={false}
          onSync={handleSync}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Helm</h1>
        </header>
        <div className="dashboard-body">
          <div className="empty-state" style={{ flex: 1 }}>
            Failed to load tasks. Check your connection and try again.
          </div>
        </div>
        <StatusBar
          lastSynced={null}
          taskCount={0}
          syncing={false}
          onSync={handleSync}
        />
      </div>
    );
  }

  const tasks = data?.tasks ?? [];
  const statuses = data?.statuses ?? [];
  const counts = countByStatus(tasks);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Helm</h1>
        <div className="header-actions">
          <div className="header-metrics">
            <span className="header-metric">
              <span className="header-metric__count">{counts.new}</span>
              <span className="header-metric__label">New</span>
            </span>
            <span className="header-metric__sep">&middot;</span>
            <span className="header-metric">
              <span className="header-metric__count">{counts.scoping}</span>
              <span className="header-metric__label">Scoping</span>
            </span>
            <span className="header-metric__sep">&middot;</span>
            <span className="header-metric">
              <span className="header-metric__count">{counts.resourcing}</span>
              <span className="header-metric__label">Resourcing</span>
            </span>
            {counts.programs > 0 && (
              <>
                <span className="header-metric__sep">|</span>
                <span className="header-metric">
                  <span className="header-metric__count">{counts.programs}</span>
                  <span className="header-metric__label">Programs</span>
                </span>
              </>
            )}
          </div>
          <button
            className="btn btn--primary"
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm}
          >
            + New Task
          </button>
        </div>
      </header>
      <div className="dashboard-body">
        <TaskGrid
          tasks={tasks}
          statuses={statuses}
          showCreateForm={showCreateForm}
          onTaskUpdate={handleTaskUpdate}
          onCreateTask={handleCreateTask}
          onCancelCreate={() => setShowCreateForm(false)}
        />
      </div>
      <StatusBar
        lastSynced={data?.lastSynced ?? null}
        taskCount={tasks.length}
        intakeCount={data?.intakeCount}
        programsCount={data?.programsCount}
        syncing={false}
        onSync={handleSync}
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <DashboardInner />
    </ToastProvider>
  );
}
