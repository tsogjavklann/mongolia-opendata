import type { DataRow } from './transform';
import { toCSV } from './transform';

/**
 * Browser-аас файл татах helper.
 */
function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Safe filename — Mongolian + special char-уудыг арилгана. */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 60) || 'data';
}

/** CSV — UTF-8 BOM-той (Excel-д Mongolian char зөв харагдана). */
export function downloadCSV(rows: DataRow[], baseName: string): void {
  if (rows.length === 0) return;
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `${sanitizeFilename(baseName)}_${Date.now()}.csv`);
}

/** Жинхэн .xlsx файл — Excel-д шууд open хийгдэнэ, separator асуудалгүй. */
export async function downloadXLSX(rows: DataRow[], baseName: string): Promise<void> {
  if (rows.length === 0) return;
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);

  // Багана өргөн автомат тохируулах
  const headers = Object.keys(rows[0]);
  ws['!cols'] = headers.map(h => {
    const maxLen = Math.max(
      h.length,
      ...rows.slice(0, 100).map(r => String(r[h] ?? '').length),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Browser-аас shareArray->writeFileXLSX буюу memoryWrite
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `${sanitizeFilename(baseName)}_${Date.now()}.xlsx`);
}

/** TSV — Excel-д шууд open, comma зөрчилгүй. */
export function downloadTSV(rows: DataRow[], baseName: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join('\t'),
    ...rows.map(row => headers.map(h => {
      const v = String(row[h] ?? '');
      return v.replace(/\t/g, ' ').replace(/\n/g, ' ');
    }).join('\t')),
  ];
  const content = '﻿' + lines.join('\n');
  const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' });
  downloadBlob(blob, `${sanitizeFilename(baseName)}_${Date.now()}.tsv`);
}
