'use client';

import type { DashboardTask } from '@/lib/types';
import { sortByAttentionScore } from '@/lib/scoring';
import { TaskCard } from './TaskCard';

interface AttentionFeedProps {
  tasks: DashboardTask[];
  onSelectTask: (taskId: string) => void;
}

export function AttentionFeed({ tasks, onSelectTask }: AttentionFeedProps) {
  const sorted = sortByAttentionScore(tasks);

  if (sorted.length === 0) {
    return <div className="empty-state">No intake requests</div>;
  }

  return (
    <div>
      {sorted.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={() => onSelectTask(task.id)}
        />
      ))}
    </div>
  );
}
