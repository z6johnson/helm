'use client';

import type { DashboardTask, ClickUpStatus } from '@/lib/types';
import { TaskTile } from './TaskTile';
import { CreateTaskForm } from './CreateTaskForm';

type SourceFilter = 'all' | 'intake' | 'programs';

interface TaskGridProps {
  tasks: DashboardTask[];
  filter: SourceFilter;
  statuses: ClickUpStatus[];
  showCreateForm: boolean;
  onTaskUpdate: (task: DashboardTask) => void;
  onCreateTask: (name: string, status: string, dueDate?: number, description?: string, customFields?: Array<{ id: string; value: unknown }>) => Promise<void>;
  onCancelCreate: () => void;
}

export function TaskGrid({
  tasks,
  filter,
  statuses,
  showCreateForm,
  onTaskUpdate,
  onCreateTask,
  onCancelCreate,
}: TaskGridProps) {
  const filtered = filter === 'all'
    ? tasks
    : tasks.filter((t) => t.source === filter);

  const sorted = [...filtered].sort((a, b) => {
    // Nulls last
    if (a.dueDate === null && b.dueDate === null) return 0;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate - b.dueDate;
  });

  return (
    <div className="task-grid">
      {showCreateForm && (
        <CreateTaskForm
          statuses={statuses}
          onSubmit={onCreateTask}
          onCancel={onCancelCreate}
        />
      )}
      {sorted.map((task) => (
        <TaskTile
          key={task.id}
          task={task}
          statuses={statuses}
          onTaskUpdate={onTaskUpdate}
        />
      ))}
      {sorted.length === 0 && !showCreateForm && (
        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
          No tasks found
        </div>
      )}
    </div>
  );
}
