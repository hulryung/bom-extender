import Papa from 'papaparse';
import { BomRowOriginal, BomRowExtended } from './types';

interface CsvRow {
  comment?: string;
  designator?: string;
  footprint?: string;
  lcsc?: string;
  quantity?: string;
}

export function parseBomCsv(csvContent: string): BomRowOriginal[] {
  const result = Papa.parse<CsvRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.toLowerCase().trim(),
  });

  if (result.errors.length > 0) {
    const error = result.errors[0];
    throw new Error(`CSV parsing error at row ${error.row}: ${error.message}`);
  }

  return result.data
    .map((row) => ({
      comment: row.comment || '',
      designator: row.designator || '',
      footprint: row.footprint || '',
      lcsc: row.lcsc || '',
      quantity: parseInt(row.quantity || '0', 10) || 0,
    }))
    .filter((row) => row.designator || row.comment); // 빈 행 제거
}

export function convertToExtended(rows: BomRowOriginal[]): BomRowExtended[] {
  return rows.map((row, index) => ({
    ...row,
    id: `bom-${index}-${Date.now()}`,
    fetchStatus: row.lcsc && row.lcsc.startsWith('C') ? 'pending' : 'skipped',
  }));
}

export function validateBomRow(row: BomRowOriginal): string[] {
  const errors: string[] = [];

  if (!row.designator) {
    errors.push('Designator is required');
  }
  if (row.quantity <= 0) {
    errors.push('Quantity must be positive');
  }
  if (row.lcsc && !row.lcsc.match(/^C\d+$/)) {
    errors.push('Invalid LCSC part number format (should be C followed by numbers)');
  }

  return errors;
}

export function validateBom(rows: BomRowOriginal[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowErrors = validateBomRow(row);
    rowErrors.forEach((error) => {
      errors.push(`Row ${index + 1}: ${error}`);
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
