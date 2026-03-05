'use client';

import type { DashboardTask, ClickUpStatus } from '@/lib/types';
import { PipelineItem } from './PipelineItem';

interface PipelineColumnProps {
  status: ClickUpStatus;
  tasks: DashboardTask[];
  onSelectTask: (taskId: string) => void;
}

export function PipelineColumn({
  status,
  tasks,
  onSelectTask,
}: PipelineColumnProps) {
  return (
    <div className="pipeline-group">
      <div className="pipeline-group__header">
        <div>
          <span
            className="pipeline-group__status-dot"
            style={{ backgroundColor: status.color }}
          />
          <span className="pipeline-group__name">{status.status}</span>
        </div>
        <span className="mono-count">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <div className="empty-state" style={{ height: 60 }}>
          No tasks
        </div>
      ) : (
        tasks.map((task) => (
          <PipelineItem
            key={task.id}
            task={task}
            onClick={() => onSelectTask(task.id)}
          />
        ))
      )}
    </div>
  );
}
