'use client';

import type { DashboardTask, ClickUpStatus } from '@/lib/types';
import { TaskTile } from './TaskTile';
import { CreateTaskForm } from './CreateTaskForm';

interface TaskGridProps {
  tasks: DashboardTask[];
  statuses: ClickUpStatus[];
  showCreateForm: boolean;
  onTaskUpdate: (task: DashboardTask) => void;
  onCreateTask: (name: string, status: string) => Promise<void>;
  onCancelCreate: () => void;
}

export function TaskGrid({
  tasks,
  statuses,
  showCreateForm,
  onTaskUpdate,
  onCreateTask,
  onCancelCreate,
}: TaskGridProps) {
  const sorted = [...tasks].sort((a, b) => {
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
