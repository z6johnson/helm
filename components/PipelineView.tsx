'use client';

import { useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import type { DashboardTask, ClickUpStatus } from '@/lib/types';
import { FIELD_IDS } from '@/lib/types';
import { useToast } from './Toast';

interface PipelineViewProps {
  tasks: DashboardTask[];
  statuses: ClickUpStatus[];
  onSelectTask: (taskId: string) => void;
  onStatusChange: (updatedTask: DashboardTask) => void;
}

export function PipelineView({
  tasks,
  statuses,
  onSelectTask,
  onStatusChange,
}: PipelineViewProps) {
  const { showToast } = useToast();

  const sortedStatuses = [...statuses]
    .filter((s) => s.type !== 'closed')
    .sort((a, b) => a.orderindex - b.orderindex);

  const tasksByStatus = new Map<string, DashboardTask[]>();
  for (const status of sortedStatuses) {
    tasksByStatus.set(status.status, []);
  }
  for (const task of tasks) {
    const group = tasksByStatus.get(task.status);
    if (group) {
      group.push(task);
    } else {
      // Task has a status not in our list; add to first group
      const first = sortedStatuses[0];
      if (first) {
        tasksByStatus.get(first.status)?.push(task);
      }
    }
  }

  // Sort tasks within each group alphabetically
  Array.from(tasksByStatus.values()).forEach((group) => {
    group.sort((a, b) => a.name.localeCompare(b.name));
  });

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { draggableId, destination, source } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId) return;

      const task = tasks.find((t) => t.id === draggableId);
      if (!task) return;

      const newStatus = destination.droppableId;
      const targetStatusObj = statuses.find(
        (s) => s.status === newStatus
      );

      // Optimistic update
      const updatedTask: DashboardTask = {
        ...task,
        status: newStatus,
        statusColor: targetStatusObj?.color || task.statusColor,
        statusOrderIndex: targetStatusObj?.orderindex ?? task.statusOrderIndex,
      };
      onStatusChange(updatedTask);

      // Persist to API
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error('Failed to update status');
      } catch {
        // Rollback
        onStatusChange(task);
        showToast('Failed to update task status', 'error');
      }
    },
    [tasks, statuses, onStatusChange, showToast]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {sortedStatuses.map((status) => {
        const groupTasks = tasksByStatus.get(status.status) || [];

        return (
          <Droppable droppableId={status.status} key={status.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="pipeline-group"
              >
                <div className="pipeline-group__header">
                  <div>
                    <span
                      className="pipeline-group__status-dot"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="pipeline-group__name">
                      {status.status}
                    </span>
                  </div>
                  <span className="mono-count">{groupTasks.length}</span>
                </div>
                {groupTasks.length === 0 ? (
                  <div className="empty-state" style={{ height: 60 }}>
                    No tasks
                  </div>
                ) : (
                  groupTasks.map((task, index) => (
                    <Draggable
                      draggableId={task.id}
                      index={index}
                      key={task.id}
                    >
                      {(dragProvided) => {
                        const detail =
                          task.customFields[FIELD_IDS.VC_AREA_ORG]?.value ||
                          task.customFields[FIELD_IDS.TYPE_OF_PROJECT]?.value;

                        return (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="pipeline-item"
                            onClick={() => onSelectTask(task.id)}
                          >
                            <span className="pipeline-item__name">
                              {task.name}
                            </span>
                            {detail && typeof detail === 'string' && (
                              <span className="pipeline-item__detail">
                                {detail}
                              </span>
                            )}
                          </div>
                        );
                      }}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        );
      })}
    </DragDropContext>
  );
}
