import { LcscPartInfo } from '@/lib/bom/types';
import { lcscRateLimiter } from './rate-limiter';

export class LcscApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'LcscApiError';
  }
}

export async function fetchLcscPart(partNumber: string): Promise<LcscPartInfo> {
  return lcscRateLimiter.add(async () => {
    const response = await fetch(`/api/lcsc?part=${encodeURIComponent(partNumber)}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new LcscApiError(
        error.error || `HTTP ${response.status}`,
        response.status
      );
    }

    return response.json();
  });
}

export interface FetchProgress {
  current: number;
  total: number;
  partNumber: string;
}

export interface FetchResult {
  partNumber: string;
  info: LcscPartInfo | null;
  error?: string;
}

export async function fetchMultipleParts(
  partNumbers: string[],
  options: {
    onProgress?: (progress: FetchProgress) => void;
    onPartFetched?: (result: FetchResult) => void;
    signal?: AbortSignal;
  } = {}
): Promise<Map<string, LcscPartInfo>> {
  const { onProgress, onPartFetched, signal } = options;
  const results = new Map<string, LcscPartInfo>();
  const uniqueParts = [...new Set(partNumbers.filter((p) => p && p.startsWith('C')))];

  for (let i = 0; i < uniqueParts.length; i++) {
    if (signal?.aborted) {
      break;
    }

    const partNumber = uniqueParts[i];

    onProgress?.({
      current: i + 1,
      total: uniqueParts.length,
      partNumber,
    });

    try {
      const info = await fetchLcscPart(partNumber);
      results.set(partNumber, info);
      onPartFetched?.({ partNumber, info });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onPartFetched?.({ partNumber, info: null, error: errorMessage });
    }
  }

  return results;
}
