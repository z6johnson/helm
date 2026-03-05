import type {
  ClickUpTask,
  ClickUpComment,
  ClickUpStatus,
} from './types';

const BASE_URL = 'https://api.clickup.com/api/v2';

function getToken(): string {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) throw new Error('CLICKUP_API_TOKEN is not set');
  return token;
}

function getListId(): string {
  return process.env.CLICKUP_LIST_ID || '901414062168';
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

export async function fetchListStatuses(): Promise<ClickUpStatus[]> {
  const listId = getListId();
  const data = await clickupFetch<{ statuses: ClickUpStatus[] }>(
    `/list/${listId}`
  );
  return data.statuses;
}
