import type { DashboardTask } from './types';
import { FIELD_IDS } from './types';

const CRITICAL_FIELDS = [
  FIELD_IDS.REQUESTER_NAME,
  FIELD_IDS.REQUEST,
  FIELD_IDS.VC_AREA_ORG,
  FIELD_IDS.TYPE_OF_PROJECT,
];

export function computeAttentionScore(task: DashboardTask): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // Staleness: 0-40 pts (2 pts per day since update, cap at 40)
  const stalenessScore = Math.min(40, task.staleDays * 2);
  if (stalenessScore > 0) {
    score += stalenessScore;
    if (task.staleDays >= 14) {
      reasons.push(`No activity in ${task.staleDays}d`);
    }
  }

  // Due date proximity: 0-30 pts
  if (task.dueDate) {
    const daysUntilDue = Math.floor(
      (task.dueDate - Date.now()) / 86400000
    );
    if (daysUntilDue < 0) {
      const overduWeeks = Math.floor(Math.abs(daysUntilDue) / 7);
      score += Math.min(50, 30 + overduWeeks * 5);
      reasons.push(`Overdue by ${Math.abs(daysUntilDue)}d`);
    } else if (daysUntilDue <= 7) {
      score += 30;
      reasons.push(`Due in ${daysUntilDue}d`);
    } else if (daysUntilDue <= 14) {
      score += 20;
    } else if (daysUntilDue <= 30) {
      score += 10;
    }
  }

  // Missing key fields: 0-20 pts (5 per missing critical field)
  let missingCount = 0;
  for (const fieldId of CRITICAL_FIELDS) {
    const field = task.customFields[fieldId];
    if (!field || field.value === null) {
      missingCount++;
    }
  }
  if (missingCount > 0) {
    score += missingCount * 5;
    reasons.push(`${missingCount} key field${missingCount > 1 ? 's' : ''} missing`);
  }

  // New/unprocessed: 0-10 pts
  const hoursOld = (Date.now() - task.dateCreated) / 3600000;
  if (task.statusOrderIndex === 0 && hoursOld <= 48) {
    score += 10;
    reasons.push('New request');
  }

  return { score, reasons };
}

export function sortByAttentionScore(tasks: DashboardTask[]): DashboardTask[] {
  return [...tasks].sort((a, b) => b.attentionScore - a.attentionScore);
}
