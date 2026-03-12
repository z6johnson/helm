import {
  fetchFilteredTasks,
  fetchListStatuses,
  fetchTasksFromList,
  fetchComments,
  moveTaskToList,
  addComment,
  discoverAiOcmLists,
  INTAKE_STATUSES,
  getUserId,
} from './clickup';
import { transformTasks, filterByUser, filterByAssignee } from './transform';
import { inferAiOcmCategory } from './categorize';
import { AI_OCM_CATEGORIES } from './types';
import type { CachePayload, AiOcmListMap, ClickUpTask } from './types';

// Module-level cache for discovered list IDs (survives across requests in the same process)
let cachedListMap: AiOcmListMap | null = null;

async function getAiOcmLists(): Promise<AiOcmListMap> {
  if (cachedListMap) return cachedListMap;
  cachedListMap = await discoverAiOcmLists();
  console.log('[Helm] Discovered AI OCM lists:', cachedListMap);
  return cachedListMap;
}

async function promoteAcceptedTasks(
  acceptedRaw: ClickUpTask[],
  aiOcmLists: AiOcmListMap
): Promise<{ promoted: number; errors: number }> {
  let promoted = 0;
  let errors = 0;

  for (const raw of acceptedRaw) {
    try {
      const description = raw.text_content || raw.description || '';

      // Fetch comments to help with categorization
      let commentsText = '';
      try {
        const comments = await fetchComments(raw.id);
        commentsText = comments.map((c) => c.comment_text).join(' ');
      } catch {
        // If comments fetch fails, proceed with description only
      }

      const category = inferAiOcmCategory(description, commentsText);
      if (!category) {
        console.log(`[Helm] Could not categorize accepted task "${raw.name}" (${raw.id}) — skipping`);
        continue;
      }

      const targetListId = aiOcmLists[category];
      const categoryName = AI_OCM_CATEGORIES[category];
      await moveTaskToList(raw.id, targetListId);
      await addComment(
        raw.id,
        `[Helm] Auto-promoted to Programs → AI OCM → ${categoryName}`
      );
      console.log(`[Helm] Promoted task "${raw.name}" to ${categoryName}`);
      promoted++;
    } catch (err) {
      console.error(`[Helm] Failed to promote task "${raw.name}" (${raw.id}):`, err);
      errors++;
    }
  }

  return { promoted, errors };
}

async function fetchProgramsListSafe(
  listId: string,
  listName: string
): Promise<ClickUpTask[]> {
  try {
    return await fetchTasksFromList(listId);
  } catch (err) {
    console.error(`[Helm] Failed to fetch ${listName} list (${listId}):`, err);
    return [];
  }
}

export async function buildPayload(): Promise<CachePayload> {
  const start = Date.now();
  const userId = getUserId();

  // Discover AI OCM list IDs
  let aiOcmLists: AiOcmListMap | null = null;
  try {
    aiOcmLists = await getAiOcmLists();
  } catch (err) {
    console.error('[Helm] Failed to discover AI OCM lists:', err);
  }

  // Fetch ALL intake tasks (including accepted — they stay visible until successfully promoted)
  const [intakeRaw, statuses] = await Promise.all([
    fetchFilteredTasks(INTAKE_STATUSES),
    fetchListStatuses(),
  ]);

  // Auto-promote accepted intake tasks
  const acceptedRaw = intakeRaw.filter(
    (t) => t.status.status.toLowerCase() === 'ai intake accepted'
  );
  const promotedIds = new Set<string>();

  if (aiOcmLists && acceptedRaw.length > 0) {
    try {
      const result = await promoteAcceptedTasks(acceptedRaw, aiOcmLists);
      if (result.promoted > 0) {
        console.log(`[Helm] Promoted ${result.promoted} tasks (${result.errors} errors)`);
      }
    } catch (err) {
      console.error('[Helm] Promotion step failed:', err);
    }
  }

  // Fetch Programs tasks (each list independently, so one failure doesn't break others)
  let programsTasks = [] as ReturnType<typeof transformTasks>;
  if (aiOcmLists) {
    const [roadshowsRaw, widgetRaw, ucopRaw] = await Promise.all([
      fetchProgramsListSafe(aiOcmLists.roadshows, 'Roadshows'),
      fetchProgramsListSafe(aiOcmLists.widget, 'Widget'),
      fetchProgramsListSafe(aiOcmLists.ucopAiCouncil, 'UCOP AI Council'),
    ]);

    // Track promoted task IDs — if a task appears in Programs, remove from intake
    for (const raw of [...roadshowsRaw, ...widgetRaw, ...ucopRaw]) {
      promotedIds.add(raw.id);
    }

    programsTasks = [
      ...transformTasks(roadshowsRaw, 'programs', 'Roadshows'),
      ...transformTasks(widgetRaw, 'programs', 'Widget'),
      ...transformTasks(ucopRaw, 'programs', 'UCOP AI Council'),
    ];
  }

  // Filter intake: exclude tasks that now live in Programs
  const filteredIntakeRaw = promotedIds.size > 0
    ? intakeRaw.filter((t) => !promotedIds.has(t.id))
    : intakeRaw;

  let intakeTasks = transformTasks(filteredIntakeRaw, 'intake');
  if (userId) {
    intakeTasks = filterByUser(intakeTasks, userId);
  }

  // Programs tasks: filter to only tasks assigned to the configured user
  if (userId && programsTasks.length > 0) {
    programsTasks = filterByAssignee(programsTasks, userId);
  }

  const allTasks = [...intakeTasks, ...programsTasks];
  const syncDuration = Date.now() - start;

  return {
    tasks: allTasks,
    statuses,
    lastSynced: Date.now(),
    syncDuration,
    taskCount: allTasks.length,
    intakeCount: intakeTasks.length,
    programsCount: programsTasks.length,
  };
}
