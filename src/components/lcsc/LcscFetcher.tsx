'use client';

import { Play, Square, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useBomStore } from '@/hooks/useBomStore';
import { useLcscFetch } from '@/hooks/useLcscFetch';

export function LcscFetcher() {
  const { fetchProgress } = useBomStore();
  const {
    isRunning,
    startFetch,
    stopFetch,
    retryErrors,
    pendingCount,
    errorCount,
    successCount,
  } = useLcscFetch();

  const progressPercent = fetchProgress
    ? (fetchProgress.current / fetchProgress.total) * 100
    : 0;

  return (
    <div className="flex items-center gap-4">
      {/* Fetch 버튼 */}
      {isRunning ? (
        <Button variant="destructive" onClick={stopFetch} className="gap-2">
          <Square className="h-4 w-4" />
          Stop
        </Button>
      ) : (
        <Button
          onClick={startFetch}
          disabled={pendingCount === 0}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          Fetch LCSC Data
          {pendingCount > 0 && (
            <span className="ml-1 text-xs opacity-75">({pendingCount})</span>
          )}
        </Button>
      )}

      {/* 에러 재시도 버튼 */}
      {errorCount > 0 && !isRunning && (
        <Button variant="outline" onClick={retryErrors} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry Errors ({errorCount})
        </Button>
      )}

      {/* 진행률 표시 */}
      {isRunning && fetchProgress && (
        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <Progress value={progressPercent} className="flex-1" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {fetchProgress.current} / {fetchProgress.total}
          </span>
        </div>
      )}

      {/* 완료 통계 */}
      {!isRunning && successCount > 0 && (
        <span className="text-sm text-muted-foreground">
          {successCount} fetched
          {errorCount > 0 && `, ${errorCount} errors`}
        </span>
      )}
    </div>
  );
}
