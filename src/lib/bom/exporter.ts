import * as XLSX from 'xlsx';
import { BomRowExtended } from './types';

interface ExportRow {
  Comment: string;
  Designator: string;
  Footprint: string;
  LCSC: string;
  Quantity: number;
  Manufacturer: string;
  MPN: string;
  Description: string;
  Package: string;
  Stock: number | string;
  'Unit Price (USD)': number | string;
  'Total Price (USD)': number | string;
  Datasheet: string;
}

function transformRows(rows: BomRowExtended[]): ExportRow[] {
  return rows.map((row) => ({
    Comment: row.comment,
    Designator: row.designator,
    Footprint: row.footprint,
    LCSC: row.lcsc,
    Quantity: row.quantity,
    Manufacturer: row.lcscInfo?.manufacturer || '',
    MPN: row.lcscInfo?.mpn || '',
    Description: row.lcscInfo?.description || '',
    Package: row.lcscInfo?.package || '',
    Stock: row.lcscInfo?.stock ?? '',
    'Unit Price (USD)': row.unitPrice ?? '',
    'Total Price (USD)': row.totalPrice ?? '',
    Datasheet: row.lcscInfo?.datasheet || '',
  }));
}

export function exportToExcel(rows: BomRowExtended[], filename: string): void {
  const data = transformRows(rows);

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BOM');

  // 열 너비 설정
  ws['!cols'] = [
    { wch: 20 }, // Comment
    { wch: 30 }, // Designator
    { wch: 20 }, // Footprint
    { wch: 10 }, // LCSC
    { wch: 8 },  // Quantity
    { wch: 15 }, // Manufacturer
    { wch: 20 }, // MPN
    { wch: 40 }, // Description
    { wch: 12 }, // Package
    { wch: 10 }, // Stock
    { wch: 15 }, // Unit Price
    { wch: 15 }, // Total Price
    { wch: 50 }, // Datasheet
  ];

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function escapeCsvField(field: string | number): string {
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(rows: BomRowExtended[], filename: string): void {
  const data = transformRows(rows);

  const headers = Object.keys(data[0] || {}) as (keyof ExportRow)[];

  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => escapeCsvField(row[header])).join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  downloadBlob(blob, `${filename}.csv`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
