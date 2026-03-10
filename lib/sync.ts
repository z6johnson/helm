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
import { transformTasks, filterByUser } from './transform';
import { inferAiOcmCategory } from './categorize';
import { AI_OCM_CATEGORIES } from './types';
import type { CachePayload, AiOcmListMap } from './types';

// Module-level cache for discovered list IDs (survives across requests in the same process)
let cachedListMap: AiOcmListMap | null = null;

async function getAiOcmLists(): Promise<AiOcmListMap> {
  if (cachedListMap) return cachedListMap;
  cachedListMap = await discoverAiOcmLists();
  console.log('[Helm] Discovered AI OCM lists:', cachedListMap);
  return cachedListMap;
}

async function promoteAcceptedTasks(
  aiOcmLists: AiOcmListMap
): Promise<{ promoted: number; errors: number }> {
  // Fetch tasks specifically in the "accepted" status
  const acceptedRaw = await fetchFilteredTasks(['ai intake accepted']);
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

  // Auto-promote accepted intake tasks before fetching
  if (aiOcmLists) {
    try {
      const result = await promoteAcceptedTasks(aiOcmLists);
      if (result.promoted > 0) {
        console.log(`[Helm] Promoted ${result.promoted} tasks (${result.errors} errors)`);
      }
    } catch (err) {
      console.error('[Helm] Promotion step failed:', err);
    }
  }

  // Fetch intake tasks (excluding "accepted" since those get promoted)
  const intakeStatuses = INTAKE_STATUSES.filter(
    (s) => s !== 'ai intake accepted'
  );

  // Build parallel fetch promises
  const fetchPromises: Promise<unknown>[] = [
    fetchFilteredTasks(intakeStatuses),
    fetchListStatuses(),
  ];

  if (aiOcmLists) {
    fetchPromises.push(
      fetchTasksFromList(aiOcmLists.roadshows, userId),
      fetchTasksFromList(aiOcmLists.widget, userId),
      fetchTasksFromList(aiOcmLists.ucopAiCouncil, userId),
    );
  }

  const results = await Promise.all(fetchPromises);

  const intakeRaw = results[0] as Awaited<ReturnType<typeof fetchFilteredTasks>>;
  const statuses = results[1] as Awaited<ReturnType<typeof fetchListStatuses>>;

  let intakeTasks = transformTasks(intakeRaw, 'intake');
  if (userId) {
    intakeTasks = filterByUser(intakeTasks, userId);
  }

  let programsTasks = aiOcmLists
    ? [
        ...transformTasks(
          results[2] as Awaited<ReturnType<typeof fetchTasksFromList>>,
          'programs',
          'Roadshows'
        ),
        ...transformTasks(
          results[3] as Awaited<ReturnType<typeof fetchTasksFromList>>,
          'programs',
          'Widget'
        ),
        ...transformTasks(
          results[4] as Awaited<ReturnType<typeof fetchTasksFromList>>,
          'programs',
          'UCOP AI Council'
        ),
      ]
    : [];

  // Programs tasks are already filtered by assignee at the API level,
  // but apply user filter for creator-based matching too
  if (userId && programsTasks.length > 0) {
    programsTasks = filterByUser(programsTasks, userId);
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
