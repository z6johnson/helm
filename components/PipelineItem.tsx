'use client';

import type { DashboardTask } from '@/lib/types';
import { FIELD_IDS } from '@/lib/types';

interface PipelineItemProps {
  task: DashboardTask;
  onClick: () => void;
}

export function PipelineItem({ task, onClick }: PipelineItemProps) {
  const detail =
    task.customFields[FIELD_IDS.VC_AREA_ORG]?.value ||
    task.customFields[FIELD_IDS.TYPE_OF_PROJECT]?.value;

  return (
    <div
      className="pipeline-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span className="pipeline-item__name">{task.name}</span>
      {detail && typeof detail === 'string' && (
        <span className="pipeline-item__detail">{detail}</span>
      )}
    </div>
  );
}
