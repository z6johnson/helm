import type {
  ClickUpTask,
  ClickUpCustomField,
  ClickUpUser,
  DashboardTask,
  NormalizedField,
  PickedUser,
} from './types';
import { computeAttentionScore } from './scoring';

export function transformTasks(raw: ClickUpTask[]): DashboardTask[] {
  return raw.map(transformTask);
}

export function filterByUser(
  tasks: DashboardTask[],
  userId: number
): DashboardTask[] {
  return tasks.filter(
    (t) =>
      t.creator.id === userId ||
      t.assignees.some((a) => a.id === userId)
  );
}

export function transformTask(raw: ClickUpTask): DashboardTask {
  const dateUpdated = Number(raw.date_updated);
  const staleDays = Math.floor((Date.now() - dateUpdated) / 86400000);

  const task: DashboardTask = {
    id: raw.id,
    name: raw.name,
    description: raw.text_content || raw.description || '',
    status: raw.status.status,
    statusColor: raw.status.color,
    statusOrderIndex: raw.status.orderindex,
    dateCreated: Number(raw.date_created),
    dateUpdated,
    dueDate: raw.due_date ? Number(raw.due_date) : null,
    creator: pickUser(raw.creator),
    assignees: raw.assignees.map(pickUser),
    customFields: normalizeFields(raw.custom_fields),
    url: raw.url,
    staleDays,
    attentionScore: 0,
    attentionReasons: [],
  };

  const { score, reasons } = computeAttentionScore(task);
  task.attentionScore = score;
  task.attentionReasons = reasons;

  return task;
}

function pickUser(user: ClickUpUser): PickedUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    initials: user.initials || getInitials(user.username),
    profilePicture: user.profilePicture,
  };
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function normalizeFields(
  fields: ClickUpCustomField[]
): Record<string, NormalizedField> {
  const result: Record<string, NormalizedField> = {};

  for (const field of fields) {
    const normalized = normalizeField(field);
    if (normalized) {
      result[field.id] = normalized;
    }
  }

  return result;
}

function normalizeField(field: ClickUpCustomField): NormalizedField | null {
  const base = {
    id: field.id,
    name: field.name,
    type: field.type,
    rawValue: field.value,
    options: field.type_config?.options,
  };

  if (field.value === null || field.value === undefined) {
    return { ...base, value: null };
  }

  switch (field.type) {
    case 'drop_down': {
      const options = field.type_config?.options;
      if (!options || typeof field.value !== 'number') {
        return { ...base, value: null };
      }
      const selected = options.find(
        (o) => o.orderindex === field.value
      );
      return { ...base, value: selected?.name ?? null };
    }

    case 'labels': {
      const options = field.type_config?.options;
      if (!options || !Array.isArray(field.value)) {
        return { ...base, value: null };
      }
      const labels = (field.value as string[])
        .map((id) => {
          const opt = options.find((o) => o.id === id);
          return opt?.name ?? null;
        })
        .filter(Boolean) as string[];
      return { ...base, value: labels.length > 0 ? labels : null };
    }

    case 'users': {
      if (!Array.isArray(field.value)) {
        return { ...base, value: null };
      }
      const users = field.value as ClickUpUser[];
      const names = users.map((u) => u.username);
      return { ...base, value: names.length > 0 ? names : null };
    }

    case 'short_text':
    case 'text':
    case 'email':
    case 'url': {
      const val = typeof field.value === 'string' ? field.value : null;
      return { ...base, value: val || null };
    }

    case 'currency': {
      const val = typeof field.value === 'number' ? field.value : null;
      return { ...base, value: val };
    }

    case 'date': {
      const val = typeof field.value === 'string' ? field.value : null;
      return { ...base, value: val };
    }

    default:
      return { ...base, value: String(field.value) };
  }
}
