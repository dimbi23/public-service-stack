import type { RawRow, NormalizeResult } from './types.js';
import { mapRow } from './procedure.mapper.js';

export interface CatalogNormalizeResult {
  results: NormalizeResult[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

/**
 * Normalizes a single raw CSV/Excel row into a spec-conformant service document.
 */
export function normalizeRow(row: RawRow, rowNumber = 1): NormalizeResult {
  const { service, errors, warnings } = mapRow(row, rowNumber);
  return { service, errors, warnings, rowNumber };
}

/**
 * Normalizes an array of raw rows (e.g. from a CSV parse result).
 * A row is considered "valid" when it has zero errors (warnings are non-fatal).
 */
export function normalizeCatalog(rows: RawRow[]): CatalogNormalizeResult {
  const results: NormalizeResult[] = rows.map((row, i) => normalizeRow(row, i + 2));

  const validRows = results.filter((r) => r.errors.length === 0).length;
  const invalidRows = results.length - validRows;

  return {
    results,
    totalRows: results.length,
    validRows,
    invalidRows,
  };
}
