import type {
  ClickUpTask,
  ClickUpComment,
  ClickUpStatus,
  AiOcmListMap,
} from './types';

const BASE_URL = 'https://api.clickup.com/api/v2';

export const INTAKE_STATUSES = [
  'ai intake new requests',
  'ai intake scoping',
  'ai intake resourcing',
  'ai intake accepted',
];

function getToken(): string {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) throw new Error('CLICKUP_API_TOKEN is not set');
  return token;
}

function getListId(): string {
  return process.env.CLICKUP_LIST_ID || '901414062168';
}

export function getUserId(): number | undefined {
  const id = process.env.CLICKUP_USER_ID;
  return id ? Number(id) : undefined;
}

async function clickupFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: getToken(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `ClickUp API error ${res.status}: ${body}`
    );
  }

  return res.json();
}

export async function fetchAllTasks(): Promise<ClickUpTask[]> {
  const listId = getListId();
  const allTasks: ClickUpTask[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const data = await clickupFetch<{ tasks: ClickUpTask[] }>(
      `/list/${listId}/task?include_closed=true&subtasks=false&page=${page}`
    );
    allTasks.push(...data.tasks);
    hasMore = data.tasks.length === 100;
    page++;
  }

  return allTasks;
}

export async function fetchFilteredTasks(
  statuses: string[]
): Promise<ClickUpTask[]> {
  const listId = getListId();
  const allTasks: ClickUpTask[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams();
    params.append('subtasks', 'false');
    params.append('page', String(page));
    for (const status of statuses) {
      params.append('statuses[]', status);
    }

    const data = await clickupFetch<{ tasks: ClickUpTask[] }>(
      `/list/${listId}/task?${params.toString()}`
    );
    allTasks.push(...data.tasks);
    hasMore = data.tasks.length === 100;
    page++;
  }

  return allTasks;
}

export async function fetchTaskById(taskId: string): Promise<ClickUpTask> {
  return clickupFetch<ClickUpTask>(`/task/${taskId}`);
}

export async function updateTaskStatus(
  taskId: string,
  status: string
): Promise<void> {
  await clickupFetch(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function updateTaskCustomField(
  taskId: string,
  fieldId: string,
  value: unknown
): Promise<void> {
  await clickupFetch(`/task/${taskId}/field/${fieldId}`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
}

export async function addComment(
  taskId: string,
  commentText: string
): Promise<ClickUpComment> {
  return clickupFetch<ClickUpComment>(`/task/${taskId}/comment`, {
    method: 'POST',
    body: JSON.stringify({
      comment_text: commentText,
      notify_all: false,
    }),
  });
}

export async function fetchComments(
  taskId: string
): Promise<ClickUpComment[]> {
  const data = await clickupFetch<{ comments: ClickUpComment[] }>(
    `/task/${taskId}/comment`
  );
  return data.comments;
}

export async function createTask(
  name: string,
  status: string,
  assignees: number[],
  dueDate?: number | null,
  description?: string,
  customFields?: Array<{ id: string; value: unknown }>
): Promise<ClickUpTask> {
  const listId = getListId();
  const body: Record<string, unknown> = { name, status, assignees };
  if (dueDate != null) {
    body.due_date = dueDate;
  }
  if (description) {
    body.description = description;
  }
  if (customFields && customFields.length > 0) {
    body.custom_fields = customFields;
  }
  return clickupFetch<ClickUpTask>(`/list/${listId}/task`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateTaskName(
  taskId: string,
  name: string
): Promise<void> {
  await clickupFetch(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function updateTaskDueDate(
  taskId: string,
  dueDate: number | null
): Promise<void> {
  await clickupFetch(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ due_date: dueDate }),
  });
}

export async function updateTaskDescription(
  taskId: string,
  description: string
): Promise<void> {
  await clickupFetch(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ description }),
  });
}

export async function fetchListStatuses(): Promise<ClickUpStatus[]> {
  const listId = getListId();
  const data = await clickupFetch<{ statuses: ClickUpStatus[] }>(
    `/list/${listId}`
  );
  return data.statuses;
}

// === Programs / AI OCM Discovery ===

interface ClickUpTeam {
  id: string;
  name: string;
}

interface ClickUpSpace {
  id: string;
  name: string;
}

interface ClickUpFolder {
  id: string;
  name: string;
}

interface ClickUpList {
  id: string;
  name: string;
}

export async function fetchTeams(): Promise<ClickUpTeam[]> {
  const data = await clickupFetch<{ teams: ClickUpTeam[] }>('/team');
  return data.teams;
}

export async function fetchSpaces(teamId: string): Promise<ClickUpSpace[]> {
  const data = await clickupFetch<{ spaces: ClickUpSpace[] }>(
    `/team/${teamId}/space`
  );
  return data.spaces;
}

export async function fetchFolders(spaceId: string): Promise<ClickUpFolder[]> {
  const data = await clickupFetch<{ folders: ClickUpFolder[] }>(
    `/space/${spaceId}/folder`
  );
  return data.folders;
}

export async function fetchLists(folderId: string): Promise<ClickUpList[]> {
  const data = await clickupFetch<{ lists: ClickUpList[] }>(
    `/folder/${folderId}/list`
  );
  return data.lists;
}

export async function fetchFolderlessLists(spaceId: string): Promise<ClickUpList[]> {
  const data = await clickupFetch<{ lists: ClickUpList[] }>(
    `/space/${spaceId}/list`
  );
  return data.lists;
}

// Known AI OCM list IDs (fallback defaults)
const DEFAULT_ROADSHOWS_LIST_ID = '4002434090786504621';
const DEFAULT_WIDGET_LIST_ID = '4002410489845325279';
const DEFAULT_UCOP_LIST_ID = '4002404055709439235';

export function getAiOcmListOverrides(): Partial<AiOcmListMap> {
  return {
    roadshows: process.env.CLICKUP_ROADSHOWS_LIST_ID || DEFAULT_ROADSHOWS_LIST_ID,
    widget: process.env.CLICKUP_WIDGET_LIST_ID || DEFAULT_WIDGET_LIST_ID,
    ucopAiCouncil: process.env.CLICKUP_UCOP_LIST_ID || DEFAULT_UCOP_LIST_ID,
  };
}

export async function discoverAiOcmLists(): Promise<AiOcmListMap> {
  // Check env var overrides first
  const overrides = getAiOcmListOverrides();
  if (overrides.roadshows && overrides.widget && overrides.ucopAiCouncil) {
    return overrides as AiOcmListMap;
  }

  // Walk ClickUp hierarchy: Teams → Spaces → Folders → Lists
  const teams = await fetchTeams();
  if (teams.length === 0) throw new Error('No ClickUp teams found');

  // Search across all teams for the "Programs" space
  let programsSpace: ClickUpSpace | undefined;
  for (const team of teams) {
    const spaces = await fetchSpaces(team.id);
    programsSpace = spaces.find(
      (s) => s.name.toLowerCase() === 'programs'
    );
    if (programsSpace) break;
  }
  if (!programsSpace) throw new Error('Could not find "Programs" space in ClickUp');

  // Look for "AI OCM" folder
  const folders = await fetchFolders(programsSpace.id);
  const aiOcmFolder = folders.find(
    (f) => f.name.toLowerCase().includes('ai ocm')
  );

  let lists: ClickUpList[];
  if (aiOcmFolder) {
    lists = await fetchLists(aiOcmFolder.id);
  } else {
    // Fallback: check folderless lists in the space
    lists = await fetchFolderlessLists(programsSpace.id);
  }

  const findList = (name: string): string => {
    const list = lists.find(
      (l) => l.name.toLowerCase().includes(name.toLowerCase())
    );
    if (!list) throw new Error(`Could not find "${name}" list in AI OCM`);
    return list.id;
  };

  return {
    roadshows: overrides.roadshows || findList('Roadshows'),
    widget: overrides.widget || findList('Widget'),
    ucopAiCouncil: overrides.ucopAiCouncil || findList('UCOP AI Council'),
  };
}

export async function fetchTasksFromList(
  listId: string,
  assigneeId?: number
): Promise<ClickUpTask[]> {
  const allTasks: ClickUpTask[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams();
    params.append('subtasks', 'false');
    params.append('page', String(page));
    params.append('include_closed', 'false');
    if (assigneeId) {
      params.append('assignees[]', String(assigneeId));
    }

    const data = await clickupFetch<{ tasks: ClickUpTask[] }>(
      `/list/${listId}/task?${params.toString()}`
    );
    allTasks.push(...data.tasks);
    hasMore = data.tasks.length === 100;
    page++;
  }

  return allTasks;
}

export async function moveTaskToList(
  taskId: string,
  targetListId: string
): Promise<void> {
  // ClickUp API: move task to a different list
  await clickupFetch(`/list/${targetListId}/task/${taskId}`, {
    method: 'POST',
  });
}
