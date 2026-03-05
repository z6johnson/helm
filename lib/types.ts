// === ClickUp API Response Types ===

export interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  color: string | null;
  initials: string;
  profilePicture: string | null;
}

export interface ClickUpStatus {
  id: string;
  status: string;
  color: string;
  orderindex: number;
  type: string;
}

export interface ClickUpDropdownOption {
  id: string;
  name: string;
  color: string | null;
  orderindex: number;
}

export interface ClickUpCustomField {
  id: string;
  name: string;
  type: string;
  type_config: {
    options?: ClickUpDropdownOption[];
  };
  value?: unknown;
}

export interface ClickUpComment {
  id: string;
  comment_text: string;
  user: ClickUpUser;
  date: string;
  reply_count: number;
}

export interface ClickUpTask {
  id: string;
  name: string;
  description: string;
  text_content: string;
  status: ClickUpStatus;
  date_created: string;
  date_updated: string;
  date_closed: string | null;
  date_done: string | null;
  due_date: string | null;
  start_date: string | null;
  priority: { id: string; priority: string; color: string } | null;
  creator: ClickUpUser;
  assignees: ClickUpUser[];
  custom_fields: ClickUpCustomField[];
  url: string;
  tags: { name: string; tag_fg: string; tag_bg: string }[];
}

// === Dashboard Domain Types ===

export interface PickedUser {
  id: number;
  username: string;
  email: string;
  initials: string;
  profilePicture: string | null;
}

export interface NormalizedField {
  id: string;
  name: string;
  type: string;
  value: string | string[] | number | null;
  rawValue: unknown;
  options?: ClickUpDropdownOption[];
}

export interface DashboardTask {
  id: string;
  name: string;
  description: string;
  status: string;
  statusColor: string;
  statusOrderIndex: number;
  dateCreated: number;
  dateUpdated: number;
  dueDate: number | null;
  creator: PickedUser;
  assignees: PickedUser[];
  customFields: Record<string, NormalizedField>;
  url: string;
  staleDays: number;
  attentionScore: number;
  attentionReasons: string[];
}

// === Cache Types ===

export interface CachePayload {
  tasks: DashboardTask[];
  statuses: ClickUpStatus[];
  lastSynced: number;
  syncDuration: number;
  taskCount: number;
}

export interface SyncResult {
  success: boolean;
  taskCount: number;
  syncDuration: number;
  error?: string;
}

// Custom field IDs (from ClickUp)
export const FIELD_IDS = {
  VC_AREA_ORG: 'fa917ff3-f9d2-4991-bf67-5ce5ee8c2440',
  TYPE_OF_PROJECT: '1a484fc4-f284-4fe4-9210-5b199eafe595',
  SERVICE_LINE: '99971b15-c6a0-4a1b-a877-7f33bec4e3c8',
  PROJECT_SPONSOR: '198b8e0c-1684-4b1a-94f5-55d69aaa8818',
  REQUESTER_NAME: '1174c13f-7460-45d3-9214-cc6f4e5354c5',
  REQUESTER_EMAIL: '7cf3b66d-fc6d-472b-a60f-8fc36c75072c',
  ORG_DEPARTMENT: 'd6884fe3-ae34-4695-9d63-bb9ba3c455df',
  OBJECTIVES: '7e59509c-884f-4981-813a-fa156b009aea',
  REQUEST: '7df8097e-eeed-4885-bda0-1ad931fb8dd2',
  ADDITIONAL_INFO: 'c45c76b9-4f6f-4fb9-bdbd-629de9e296af',
  PAID_UNPAID: '87a07f1e-af5f-4843-83bd-541da7d3d856',
  PROJECT_LEAD: '2efcab55-2fd8-4464-9f64-85ae6e17c96c',
  PROJECT_SUPPORT: '18b8efef-590f-493e-91f9-57c68e047fe0',
} as const;

// Fields editable in v1 (dropdowns + text fields)
export const EDITABLE_FIELD_TYPES = ['drop_down', 'short_text', 'text', 'email'];

// Fields displayed in the metadata grid (in order)
export const DISPLAY_FIELD_IDS = [
  FIELD_IDS.VC_AREA_ORG,
  FIELD_IDS.TYPE_OF_PROJECT,
  FIELD_IDS.SERVICE_LINE,
  FIELD_IDS.PAID_UNPAID,
  FIELD_IDS.PROJECT_SPONSOR,
  FIELD_IDS.REQUESTER_NAME,
  FIELD_IDS.REQUESTER_EMAIL,
  FIELD_IDS.ORG_DEPARTMENT,
  FIELD_IDS.PROJECT_LEAD,
  FIELD_IDS.PROJECT_SUPPORT,
  FIELD_IDS.REQUEST,
  FIELD_IDS.OBJECTIVES,
  FIELD_IDS.ADDITIONAL_INFO,
];
