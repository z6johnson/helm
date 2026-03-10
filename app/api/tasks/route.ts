import { NextRequest, NextResponse } from 'next/server';
import { getCachedTasks, setCachedTasks } from '@/lib/cache';
import { createTask, getUserId } from '@/lib/clickup';
import { transformTask } from '@/lib/transform';
import { buildPayload } from '@/lib/sync';

export async function GET() {
  try {
    // Try cache first
    const cached = await getCachedTasks();
    if (cached) {
      return NextResponse.json(cached);
    }

    // Cache miss — full sync
    const payload = await buildPayload();
    await setCachedTasks(payload);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const status = body.status || 'ai intake new requests';
    const userId = getUserId();
    const assignees = userId ? [userId] : [];

    const dueDate = body.due_date != null ? Number(body.due_date) : undefined;
    const description = typeof body.description === 'string' ? body.description : undefined;
    const customFields = Array.isArray(body.custom_fields) ? body.custom_fields : undefined;
    const raw = await createTask(body.name, status, assignees, dueDate, description, customFields);
    const task = transformTask(raw, 'intake');

    // Add to cache
    const cached = await getCachedTasks();
    if (cached) {
      cached.tasks.push(task);
      cached.taskCount = cached.tasks.length;
      cached.intakeCount = cached.tasks.filter((t) => t.source === 'intake').length;
      await setCachedTasks(cached);
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
