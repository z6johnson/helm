import { NextRequest, NextResponse } from 'next/server';
import {
  fetchTaskById,
  updateTaskStatus,
  updateTaskName,
  updateTaskCustomField,
  updateTaskDueDate,
} from '@/lib/clickup';
import { transformTask } from '@/lib/transform';
import { getCachedTasks, setCachedTasks } from '@/lib/cache';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const raw = await fetchTaskById(params.id);
    const task = transformTask(raw);
    return NextResponse.json(task);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    if (body.name) {
      await updateTaskName(params.id, body.name);
    }

    if (body.status) {
      await updateTaskStatus(params.id, body.status);
    }

    if (body.due_date !== undefined) {
      await updateTaskDueDate(params.id, body.due_date);
    }

    if (body.customField) {
      await updateTaskCustomField(
        params.id,
        body.customField.id,
        body.customField.value
      );
    }

    // Fetch updated task and update cache
    const raw = await fetchTaskById(params.id);
    const updatedTask = transformTask(raw);

    const cached = await getCachedTasks();
    if (cached) {
      cached.tasks = cached.tasks.map((t) =>
        t.id === params.id ? updatedTask : t
      );
      await setCachedTasks(cached);
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
