import type { AiOcmCategory } from './types';
import { AI_OCM_KEYWORDS } from './types';

/**
 * Infer which AI OCM sub-list a task belongs to based on its description
 * and optional comments text. Returns the category key or null if no match.
 */
export function inferAiOcmCategory(
  description: string,
  commentsText?: string
): AiOcmCategory | null {
  const text = `${description} ${commentsText || ''}`.toLowerCase();

  const scores: Record<string, number> = {};
  let bestCategory: AiOcmCategory | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(AI_OCM_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      // Count occurrences of each keyword
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    scores[category] = score;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as AiOcmCategory;
    }
  }

  return bestScore > 0 ? bestCategory : null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
