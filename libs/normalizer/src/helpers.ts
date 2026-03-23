import type { LexicalContent } from './types.js';

/** Converts plain text to a minimal Payload Lexical rich-text structure. */
export function toRichText(text: string): LexicalContent {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: [
            {
              type: 'text',
              text,
              format: 0,
              style: '',
              mode: 'normal',
              version: 1,
            },
          ],
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  };
}

/**
 * Derives a URL-safe slug from an arbitrary string.
 * Strips accents, lowercases, replaces spaces and special chars with hyphens.
 */
export function toSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts a raw CSV ID (e.g. "MAM/CENAM/B/P1") to the canonical serviceId
 * convention (e.g. "MAM-CENAM-B-P1"). Returns the slugified input as fallback.
 */
export function toServiceId(rawId: string): string {
  return rawId.trim().replace(/\//g, '-').toUpperCase();
}

/**
 * Tries to parse an integer day-count from free-text like
 * "15 jours ouvrables", "J+30", "un mois", etc.
 * Returns undefined when no numeric value can be derived.
 */
export function extractSlaDays(rawText: string): number | undefined {
  // Direct integer — "15", "30 jours", "15 jours ouvrables"
  const direct = rawText.match(/\b(\d+)\s*(j(?:ours?)?|days?|business days?)?/i);
  if (direct) {
    const n = parseInt(direct[1], 10);
    if (!isNaN(n) && n > 0) return n;
  }

  // "J+N" pattern — "J+15"
  const jPlus = rawText.match(/J\+(\d+)/i);
  if (jPlus) {
    const n = parseInt(jPlus[1], 10);
    if (!isNaN(n)) return n;
  }

  // Approximate months
  const months = rawText.match(/(\d+)\s*mois/i);
  if (months) {
    return parseInt(months[1], 10) * 30;
  }

  return undefined;
}

/** Splits a pipe-separated field and trims whitespace. Ignores empty tokens. */
export function splitPipe(value: string): string[] {
  return value
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Infers fee model from presence of COST_MIN / COST_MAX.
 * - Both present and different → range
 * - Equal / only one → fixed
 * - Neither → unknown
 */
export function inferFeeModel(
  min: number | undefined,
  max: number | undefined,
): 'fixed' | 'range' | 'unknown' {
  if (min !== undefined && max !== undefined && min !== max) return 'range';
  if (min !== undefined || max !== undefined) return 'fixed';
  return 'unknown';
}
