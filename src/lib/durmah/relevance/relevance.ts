// Deterministic relevance scoring for legal news queries
// No embeddings, no paid APIs - pure keyword-based intelligence

import { MODULE_KEYWORDS, MODULE_ALIASES, SYNONYMS, STOPWORDS, GENERIC_LEGAL_TERMS } from './moduleKeywords';
import type { LegalNewsCacheItem } from '@/types/durmahPersistence';

export interface QuerySignals {
  detectedModule: keyof typeof MODULE_KEYWORDS | null;
  keyPhrases: string[];
  tokens: string[];
  rawQuery: string;
}

export interface ScoredNewsItem extends LegalNewsCacheItem {
  score: number;
  matchedTerms: string[];
  why: string;
  recencyBoost: number;
}

/**
 * Normalize text: lowercase + remove punctuation (keep apostrophes) + collapse whitespace
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ') // Remove punctuation except apostrophes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract signals from user query: module detection + key phrases + tokens
 */
export function extractSignals(userQuery: string): QuerySignals {
  const normalized = normalize(userQuery);
  
  // Detect module from aliases
  let detectedModule: keyof typeof MODULE_KEYWORDS | null = null;
  for (const [alias, module] of Object.entries(MODULE_ALIASES)) {
    if (normalized.includes(alias.toLowerCase())) {
      detectedModule = module;
      break;
    }
  }

  // Extract quoted phrases
  const quotedPhrases: string[] = [];
  const quoteMatches = userQuery.match(/"([^"]+)"/g);
  if (quoteMatches) {
    quoteMatches.forEach((match) => {
      quotedPhrases.push(normalize(match.replace(/"/g, '')));
    });
  }

  // Detect common multi-word doctrines (even without quotes)
  const allDoctrinePhrases = [
    "promissory estoppel", "judicial review", "duty of care", "direct effect",
    "proprietary estoppel", "legitimate expectation", "state liability", "mens rea",
    "actus reus", "land law", "public law", "EU law", "breach of contract",
    "specific performance", "nuisance", "defamation", "trespass", "fraud",
    "human rights", "ECHR", "freedom of expression"
  ];

  const keyPhrases = [...quotedPhrases];
  allDoctrinePhrases.forEach((phrase) => {
    if (normalized.includes(phrase)) {
      keyPhrases.push(phrase);
    }
  });

  // Tokenize and filter stopwords
  const tokens = normalized
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));

  return {
    detectedModule,
    keyPhrases,
    tokens,
    rawQuery: userQuery
  };
}

/**
 * Expand terms based on detected module + user query + synonyms
 */
export function expandTerms(signals: QuerySignals): Map<string, number> {
  const termWeights = new Map<string, number>();

  // Add user's key phrases (highest weight)
  signals.keyPhrases.forEach((phrase) => {
    termWeights.set(phrase, 12); // Phrase match weight

    // Add synonyms for key phrases
    if (SYNONYMS[phrase]) {
      SYNONYMS[phrase].forEach((syn) => {
        termWeights.set(normalize(syn), 8);
      });
    }
  });

  // Add user tokens (high weight, but capped later)
  signals.tokens.forEach((token) => {
    if (!termWeights.has(token)) {
      termWeights.set(token, 4);
    }
  });

  // Add module-specific terms if detected
  if (signals.detectedModule) {
    const moduleData = MODULE_KEYWORDS[signals.detectedModule];

    // Doctrines (highest weight)
    const doctrines = [...((moduleData as any).doctrines || [])];
    doctrines.forEach((term) => {
      if (!termWeights.has(term)) {
        termWeights.set(normalize(term), 8);
      }
    });

    // Core keywords (medium-high)
    moduleData.core.forEach((term) => {
      if (!termWeights.has(term)) {
        termWeights.set(normalize(term), 5);
      }
    });

    // Hotspots (medium)
    const hotspots = [...((moduleData as any).hotspots || []), ...((moduleData as any).remedies || []), ...((moduleData as any).commercial || []), ...((moduleData as any).admin || []), ...((moduleData as any).rights || [])];
    hotspots.forEach((term) => {
      if (!termWeights.has(term)) {
        termWeights.set(normalize(term), 3);
      }
    });
  }

  return termWeights;
}

/**
 * Score a single news item against query signals
 */
export function scoreNewsItem(
  item: LegalNewsCacheItem,
  signals: QuerySignals,
  termWeights: Map<string, number>,
  debug = false
): { score: number; matchedTerms: string[]; recencyBoost: number } {
  const searchText = normalize(`${item.title} ${item.tags?.join(' ') || ''}`);
  const matchedTerms: string[] = [];
  let score = 0;

  // Check each term
  termWeights.forEach((weight, term) => {
    if (searchText.includes(term)) {
      matchedTerms.push(term);
      score += weight;
    }
  });

  // Cap user token matches to +20 total to avoid spam
  const tokenMatches = matchedTerms.filter((t) => signals.tokens.includes(t));
  if (tokenMatches.length > 0) {
    const tokenScore = Math.min(tokenMatches.length * 4, 20);
    score = score - (tokenMatches.length * 4) + tokenScore;
  }

  // Recency boost
  let recencyBoost = 0;
  try {
    const publishedDate = new Date(item.published_at);
    const now = new Date();
    const daysDiff = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff <= 3) recencyBoost = 8;
    else if (daysDiff <= 7) recencyBoost = 5;
    else if (daysDiff <= 14) recencyBoost = 3;

    score += recencyBoost;
  } catch (err) {
    // Invalid date, no boost
  }

  // Penalty for generic-only matches
  const hasOnlyGeneric = matchedTerms.every((t) => GENERIC_LEGAL_TERMS.has(t));
  if (hasOnlyGeneric && matchedTerms.length < 3) {
    score = 0; // Kill generic noise
  }

  return { score, matchedTerms, recencyBoost };
}

/**
 * Generate "why it matters" text
 */
export function generateWhy(
  matchedTerms: string[],
  detectedModule: keyof typeof MODULE_KEYWORDS | null
): string {
  const topMatches = matchedTerms.slice(0, 2).join(', ');

  let moduleTip = '';
  if (detectedModule) {
    const tips: Record<string, string> = {
      contract: "Helps you discuss enforceability/remedies and apply doctrine in problem questions.",
      tort: "Useful for analyzing duty, breach, causation in tutorials and essays.",
      public_law: "Useful for tutorials on JR grounds, institutional balance, rights analysis.",
      criminal: "Relevant for mens rea/actus reus analysis and sentencing discussions.",
      eu_law: "Helpful for understanding supremacy, direct effect, and enforcement in EU context.",
      land: "Relevant for property rights, interests, and remedies discussions.",
      equity_trusts: "Useful for fiduciary duties, remedies, and equitable doctrines."
    };
    moduleTip = tips[detectedModule] || "Relevant to your legal studies.";
  } else {
    moduleTip = "Helpful for staying current with UK legal developments.";
  }

  return topMatches
    ? `Matches: ${topMatches} — ${moduleTip}`
    : moduleTip;
}

/**
 * Rank news items by relevance to query
 */
export function rankNewsRelevance(
  items: LegalNewsCacheItem[],
  userQuery: string,
  debug = false
): ScoredNewsItem[] {
  const signals = extractSignals(userQuery);
  const termWeights = expandTerms(signals);

  const scored = items.map((item) => {
    const { score, matchedTerms, recencyBoost } = scoreNewsItem(item, signals, termWeights, debug);
    const why = generateWhy(matchedTerms, signals.detectedModule);

    return {
      ...item,
      score,
      matchedTerms,
      why,
      recencyBoost
    };
  });

  // Sort by score desc
  scored.sort((a, b) => b.score - a.score);

  const SCORE_THRESHOLD = 10;
  const filtered = scored.filter((item) => item.score >= SCORE_THRESHOLD);

  // If nothing good, return top 5 most recent with disclaimer
  if (filtered.length === 0) {
    const mostRecent = scored
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, 5)
      .map((item) => ({
        ...item,
        why: "Broad legal news (no strong matches to your topic)."
      }));
    return mostRecent;
  }

  return filtered.slice(0, 7); // Top 7
}
