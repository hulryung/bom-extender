'use client';

import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBomStore } from '@/hooks/useBomStore';
import { exportToExcel, exportToCsv } from '@/lib/bom/exporter';
import { toast } from 'sonner';

export function BomExporter() {
  const { rows, originalFilename } = useBomStore();

  const getExportFilename = () => {
    if (originalFilename) {
      // 확장자 제거
      return originalFilename.replace(/\.[^/.]+$/, '') + '-extended';
    }
    return `bom-extended-${new Date().toISOString().slice(0, 10)}`;
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(rows, getExportFilename());
      toast.success('Excel file downloaded');
    } catch (error) {
      toast.error('Failed to export Excel file');
    }
  };

  const handleExportCsv = () => {
    try {
      exportToCsv(rows, getExportFilename());
      toast.success('CSV file downloaded');
    } catch (error) {
      toast.error('Failed to export CSV file');
    }
  };

  if (rows.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Download Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCsv} className="gap-2">
          <FileText className="h-4 w-4" />
          Download CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
