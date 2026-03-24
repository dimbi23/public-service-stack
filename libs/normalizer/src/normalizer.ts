import type { RawRow, NormalizeResult } from './types';
import { mapRow } from './procedure.mapper';
import { mapFormDefinition } from './form-definition.mapper';

export interface CatalogNormalizeResult {
  results: NormalizeResult[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

/**
 * Normalizes a single raw CSV/Excel row.
 * Returns both the spec-conformant service document and a draft form definition.
 */
export function normalizeRow(row: RawRow, rowNumber = 1): NormalizeResult {
  const { service, errors, warnings } = mapRow(row, rowNumber);
  const formDefinition = mapFormDefinition(service);
  return { service, formDefinition, errors, warnings, rowNumber };
}

/**
 * Normalizes an array of raw rows.
 * A row is "valid" when it has zero errors (warnings are non-fatal).
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
