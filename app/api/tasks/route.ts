import { NextRequest, NextResponse } from 'next/server';
import { getCachedTasks, setCachedTasks } from '@/lib/cache';
import { fetchFilteredTasks, fetchListStatuses, createTask, INTAKE_STATUSES, getUserId } from '@/lib/clickup';
import { transformTasks, transformTask, filterByUser } from '@/lib/transform';
import type { CachePayload } from '@/lib/types';

export async function GET() {
  try {
    // Try cache first
    let cached = await getCachedTasks();
    if (cached) {
      return NextResponse.json(cached);
    }

    // Cache miss — fetch live
    const start = Date.now();
    const [rawTasks, statuses] = await Promise.all([
      fetchFilteredTasks(INTAKE_STATUSES),
      fetchListStatuses(),
    ]);
    let tasks = transformTasks(rawTasks);
    const userId = getUserId();
    if (userId) {
      tasks = filterByUser(tasks, userId);
    }
    const syncDuration = Date.now() - start;

    const payload: CachePayload = {
      tasks,
      statuses,
      lastSynced: Date.now(),
      syncDuration,
      taskCount: tasks.length,
    };

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
    const raw = await createTask(body.name, status, assignees, dueDate);
    const task = transformTask(raw);

    // Add to cache
    const cached = await getCachedTasks();
    if (cached) {
      cached.tasks.push(task);
      cached.taskCount = cached.tasks.length;
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
