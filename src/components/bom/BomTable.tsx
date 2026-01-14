'use client';

import { ExternalLink, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useBomStore } from '@/hooks/useBomStore';
import { cn } from '@/lib/utils';
import { FetchStatus } from '@/lib/bom/types';

const statusConfig: Record<FetchStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  loading: { label: 'Loading', variant: 'default' },
  success: { label: 'OK', variant: 'default' },
  error: { label: 'Error', variant: 'destructive' },
  skipped: { label: 'Skipped', variant: 'outline' },
};

export function BomTable() {
  const { rows } = useBomStore();

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border overflow-auto max-h-[600px]">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="min-w-[150px]">Comment</TableHead>
            <TableHead className="min-w-[200px]">Designator</TableHead>
            <TableHead>Footprint</TableHead>
            <TableHead className="w-[100px]">LCSC</TableHead>
            <TableHead className="text-right w-[60px]">Qty</TableHead>
            <TableHead className="min-w-[120px]">Manufacturer</TableHead>
            <TableHead className="min-w-[150px]">MPN</TableHead>
            <TableHead className="min-w-[200px]">Description</TableHead>
            <TableHead className="text-right w-[80px]">Stock</TableHead>
            <TableHead className="text-right w-[100px]">Unit ($)</TableHead>
            <TableHead className="text-right w-[100px]">Total ($)</TableHead>
            <TableHead className="w-[80px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={row.id}
              className={cn(
                row.fetchStatus === 'error' && 'bg-destructive/5',
                row.fetchStatus === 'loading' && 'bg-primary/5'
              )}
            >
              <TableCell className="text-muted-foreground text-sm">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium">{row.comment}</TableCell>
              <TableCell
                className="max-w-[200px] truncate text-sm"
                title={row.designator}
              >
                {row.designator}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {row.footprint}
              </TableCell>
              <TableCell>
                {row.lcsc ? (
                  <a
                    href={`https://www.lcsc.com/product-detail/${row.lcsc}.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {row.lcsc}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono">
                {row.quantity}
              </TableCell>
              <TableCell>
                {row.lcscInfo?.manufacturer || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {row.lcscInfo?.mpn || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell
                className="max-w-[200px] truncate text-sm"
                title={row.lcscInfo?.description}
              >
                {row.lcscInfo?.description || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {row.lcscInfo?.stock !== undefined ? (
                  <span
                    className={cn(
                      row.lcscInfo.stock === 0 && 'text-destructive',
                      row.lcscInfo.stock > 0 && row.lcscInfo.stock < row.quantity && 'text-yellow-600'
                    )}
                  >
                    {row.lcscInfo.stock.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {row.unitPrice !== undefined ? (
                  `$${row.unitPrice.toFixed(4)}`
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono">
                {row.totalPrice !== undefined ? (
                  `$${row.totalPrice.toFixed(2)}`
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {row.fetchStatus === 'loading' && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  <Badge
                    variant={statusConfig[row.fetchStatus].variant}
                    className="text-xs"
                    title={row.errorMessage}
                  >
                    {statusConfig[row.fetchStatus].label}
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
