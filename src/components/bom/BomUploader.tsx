'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, ClipboardPaste } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useBomStore } from '@/hooks/useBomStore';
import { parseBomCsv, validateBom } from '@/lib/bom/parser';
import { toast } from 'sonner';

export function BomUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setRows, rows } = useBomStore();

  const processContent = useCallback(
    (content: string, filename?: string) => {
      try {
        const parsed = parseBomCsv(content);

        if (parsed.length === 0) {
          toast.error('No valid BOM data found in the file');
          return;
        }

        const validation = validateBom(parsed);
        if (!validation.valid) {
          // 경고만 표시하고 계속 진행
          validation.errors.slice(0, 3).forEach((error) => {
            toast.warning(error);
          });
          if (validation.errors.length > 3) {
            toast.warning(`... and ${validation.errors.length - 3} more warnings`);
          }
        }

        setRows(parsed, filename);
        toast.success(`Loaded ${parsed.length} BOM entries`);
        setPasteContent('');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to parse BOM');
      }
    },
    [setRows]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        if (!file.name.endsWith('.csv')) {
          toast.error('Please upload a CSV file');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          processContent(content, file.name);
        };
        reader.readAsText(file);
      }
    },
    [processContent]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          processContent(content, file.name);
        };
        reader.readAsText(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processContent]
  );

  const handlePasteSubmit = useCallback(() => {
    if (!pasteContent.trim()) {
      toast.error('Please paste BOM content first');
      return;
    }
    processContent(pasteContent, 'pasted-bom.csv');
  }, [pasteContent, processContent]);

  // 데이터가 이미 있으면 간단한 버전 표시
  if (rows.length > 0) {
    return (
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Load New BOM
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <span className="text-sm text-muted-foreground">
          {rows.length} entries loaded
        </span>
      </div>
    );
  }

  return (
    <Tabs defaultValue="file" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="file" className="gap-2">
          <FileText className="h-4 w-4" />
          Upload File
        </TabsTrigger>
        <TabsTrigger value="paste" className="gap-2">
          <ClipboardPaste className="h-4 w-4" />
          Paste CSV
        </TabsTrigger>
      </TabsList>

      <TabsContent value="file" className="mt-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-12
            flex flex-col items-center justify-center gap-4
            cursor-pointer transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          `}
        >
          <Upload className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className="text-center">
            <p className="text-lg font-medium">
              {isDragging ? 'Drop the file here' : 'Drag & drop your BOM file'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse (CSV format)
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </TabsContent>

      <TabsContent value="paste" className="mt-4 space-y-4">
        <Textarea
          placeholder={`Paste your BOM CSV content here...

Example:
Comment,Designator,Footprint,LCSC,Quantity
100nF,C1,C_0402,C1525,1
10K,R1,R_0402,C25744,1`}
          value={pasteContent}
          onChange={(e) => setPasteContent(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
        />
        <Button onClick={handlePasteSubmit} disabled={!pasteContent.trim()}>
          Parse BOM
        </Button>
      </TabsContent>
    </Tabs>
  );
}
