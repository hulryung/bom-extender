'use client';

import { useState, useCallback, useRef } from 'react';
import { useBomStore } from './useBomStore';
import { fetchLcscPart } from '@/lib/lcsc/api';
import { lcscRateLimiter } from '@/lib/lcsc/rate-limiter';

export function useLcscFetch() {
  const {
    rows,
    setLcscInfo,
    setFetchStatus,
    setFetchProgress,
    getPendingPartNumbers,
  } = useBomStore();

  const [isRunning, setIsRunning] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startFetch = useCallback(async () => {
    const pendingParts = getPendingPartNumbers();

    if (pendingParts.length === 0) {
      return;
    }

    setIsRunning(true);
    abortControllerRef.current = new AbortController();

    // 모든 pending 상태를 loading으로 변경
    pendingParts.forEach((lcsc) => {
      setFetchStatus(lcsc, 'loading');
    });

    for (let i = 0; i < pendingParts.length; i++) {
      if (abortControllerRef.current.signal.aborted) {
        // 중단된 경우 남은 항목을 다시 pending으로
        pendingParts.slice(i).forEach((lcsc) => {
          setFetchStatus(lcsc, 'pending');
        });
        break;
      }

      const lcsc = pendingParts[i];
      setFetchProgress({ current: i + 1, total: pendingParts.length });

      try {
        const info = await fetchLcscPart(lcsc);
        setLcscInfo(lcsc, info);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch';
        setFetchStatus(lcsc, 'error', errorMessage);
      }
    }

    setIsRunning(false);
    setFetchProgress(null);
  }, [getPendingPartNumbers, setLcscInfo, setFetchStatus, setFetchProgress]);

  const stopFetch = useCallback(() => {
    abortControllerRef.current?.abort();
    lcscRateLimiter.clear();
    setIsRunning(false);
  }, []);

  const retryErrors = useCallback(() => {
    // 에러 상태인 항목을 pending으로 변경
    rows
      .filter((r) => r.fetchStatus === 'error')
      .forEach((r) => {
        setFetchStatus(r.lcsc, 'pending');
      });
  }, [rows, setFetchStatus]);

  const pendingCount = rows.filter((r) => r.fetchStatus === 'pending').length;
  const errorCount = rows.filter((r) => r.fetchStatus === 'error').length;
  const successCount = rows.filter((r) => r.fetchStatus === 'success').length;

  return {
    isRunning,
    startFetch,
    stopFetch,
    retryErrors,
    pendingCount,
    errorCount,
    successCount,
  };
}
