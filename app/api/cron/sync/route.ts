import { NextRequest, NextResponse } from 'next/server';
import { fetchFilteredTasks, fetchListStatuses, INTAKE_STATUSES, getUserId } from '@/lib/clickup';
import { transformTasks, filterByUser } from '@/lib/transform';
import { setCachedTasks } from '@/lib/cache';
import type { CachePayload, SyncResult } from '@/lib/types';

async function performSync(): Promise<SyncResult> {
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

  return {
    success: true,
    taskCount: tasks.length,
    syncDuration,
  };
}

async function syncWithRetry(maxRetries = 3): Promise<SyncResult> {
  const delays = [1000, 2000, 4000]; // exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await performSync();
    } catch (error) {
      if (attempt === maxRetries) {
        return {
          success: false,
          taskCount: 0,
          syncDuration: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
  }
  // Unreachable, but TypeScript needs it
  return { success: false, taskCount: 0, syncDuration: 0, error: 'Max retries exceeded' };
}

// GET — called by Vercel Cron
export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await syncWithRetry();
  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}

// POST — manual sync from dashboard
export async function POST() {
  const result = await syncWithRetry();
  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}
