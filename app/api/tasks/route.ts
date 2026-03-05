import { NextResponse } from 'next/server';
import { getCachedTasks, setCachedTasks } from '@/lib/cache';
import { fetchFilteredTasks, fetchListStatuses, INTAKE_STATUSES, getUserId } from '@/lib/clickup';
import { transformTasks, filterByUser } from '@/lib/transform';
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
