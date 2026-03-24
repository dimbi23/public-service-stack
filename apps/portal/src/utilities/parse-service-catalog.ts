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

function toParseResult(rawRows: RawRow[]): ParseResult {
  const catalog = normalizeCatalog(rawRows);
  return {
    rows: catalog.results,
    totalRows: catalog.totalRows,
    validRows: catalog.validRows,
    invalidRows: catalog.invalidRows,
  };
}

function parseCSV(fileBuffer: Buffer): ParseResult {
  const result = Papa.parse<RawRow>(fileBuffer.toString('utf-8'), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return toParseResult(result.data);
}

function parseExcel(fileBuffer: Buffer): ParseResult {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { raw: false, defval: '' });
  return toParseResult(rows);
}
