import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { normalizeCatalog } from '@org/normalizer';
import type { NormalizeResult, RawRow } from '@org/normalizer';

export type { NormalizeResult };

export interface ParseResult {
  rows: NormalizeResult[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export async function parseServiceCatalog(
  fileBuffer: Buffer,
  fileName: string,
): Promise<ParseResult> {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'csv') return parseCSV(fileBuffer);
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(fileBuffer);

  throw new Error(
    `Unsupported file format: ${ext}. Supported formats: CSV, XLSX, XLS`,
  );
}

/** Maps alternate column names (from various export formats) to the canonical RawRow keys. */
const COLUMN_ALIASES: Record<string, keyof RawRow> = {
  serviceId:        'ID',
  service_id:       'ID',
  id:               'ID',
  name:             'SERVICE_NAME',
  service_name:     'SERVICE_NAME',
  owner_ministry:   'TENANT',
  ministry:         'TENANT',
  tenant:           'TENANT',
  workflow_steps:   'STEPS',
  steps:            'STEPS',
  fee_model:        'COST_NOTES',
  description:      'DESCRIPTION',
  category:         'CATEGORY',
  department:       'DEPARTMENT',
  access_mode:      'ACCESS_MODE',
  processing_time:  'PROCESSING_TIME',
  documents:        'DOCUMENTS',
  audience:         'AUDIENCE',
  eligibility:      'ELIGIBILITY',
  output_name:      'OUTPUT_NAME',
  support_contact:  'SUPPORT_CONTACT',
  legal_text:       'LEGAL_TEXT',
};

function normalizeRowKeys(row: Record<string, string | undefined>): RawRow {
  const normalized: RawRow = {};
  for (const [key, value] of Object.entries(row)) {
    const canonical = COLUMN_ALIASES[key.toLowerCase()] ?? key;
    normalized[canonical] = value;
  }
  return normalized;
}

function toParseResult(rawRows: Record<string, string | undefined>[]): ParseResult {
  const catalog = normalizeCatalog(rawRows.map(normalizeRowKeys));
  return {
    rows: catalog.results,
    totalRows: catalog.totalRows,
    validRows: catalog.validRows,
    invalidRows: catalog.invalidRows,
  };
}

function parseCSV(fileBuffer: Buffer): ParseResult {
  const result = Papa.parse<Record<string, string>>(fileBuffer.toString('utf-8'), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return toParseResult(result.data);
}

function parseExcel(fileBuffer: Buffer): ParseResult {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false, defval: '' });
  return toParseResult(rows);
}
