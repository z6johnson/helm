'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { AttentionFeed } from '@/components/AttentionFeed';
import { PipelineView } from '@/components/PipelineView';
import { DetailDrawer } from '@/components/DetailDrawer';
import { StatusBar } from '@/components/StatusBar';
import { ToastProvider } from '@/components/Toast';
import type { DashboardTask, ClickUpStatus, CachePayload } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function countByStatus(tasks: DashboardTask[]) {
  let newCount = 0;
  let scoping = 0;
  let resourcing = 0;
  for (const t of tasks) {
    const s = t.status.toLowerCase();
    if (s.includes('new')) newCount++;
    else if (s.includes('scoping')) scoping++;
    else if (s.includes('resourcing')) resourcing++;
  }
  return { new: newCount, scoping, resourcing };
}

export default function Dashboard() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR<CachePayload>(
    '/api/tasks',
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
    }
  );

  const handleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

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

  const selectedTask = data?.tasks.find((t) => t.id === selectedTaskId) ?? null;

  if (isLoading) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>AI Strategy Intake</h1>
        </header>
        <div className="dashboard-body">
          <div className="panel-feed">
            <div className="panel-header">
              <span className="section-label">Attention Feed</span>
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton skeleton--card" />
            ))}
          </div>
          <div className="panel-pipeline">
            <div className="panel-header">
              <span className="section-label">Pipeline</span>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton skeleton--card" />
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
          <h1>AI Strategy Intake</h1>
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
    <ToastProvider>
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>AI Strategy Intake</h1>
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
          </div>
        </header>
        <div className="dashboard-body">
          <div className="panel-feed">
            <div className="panel-header">
              <span className="section-label">Attention Feed</span>
            </div>
            <AttentionFeed tasks={tasks} onSelectTask={handleSelectTask} />
          </div>
          <div className="panel-pipeline">
            <div className="panel-header">
              <span className="section-label">Pipeline</span>
            </div>
            <PipelineView
              tasks={tasks}
              statuses={statuses}
              onSelectTask={handleSelectTask}
              onStatusChange={handleTaskUpdate}
            />
          </div>
        </div>
        <StatusBar
          lastSynced={data?.lastSynced ?? null}
          taskCount={tasks.length}
          syncing={false}
          onSync={handleSync}
        />
        <DetailDrawer
          task={selectedTask}
          statuses={statuses}
          onClose={handleCloseDrawer}
          onTaskUpdate={handleTaskUpdate}
        />
      </div>
    </ToastProvider>
  );
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
