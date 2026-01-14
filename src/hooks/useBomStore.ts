import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { BomRowOriginal, BomRowExtended, LcscPartInfo, PriceTier } from '@/lib/bom/types';
import { convertToExtended } from '@/lib/bom/parser';

interface BomStore {
  // 상태
  rows: BomRowExtended[];
  originalFilename: string | null;
  fetchProgress: { current: number; total: number } | null;

  // 액션
  setRows: (rows: BomRowOriginal[], filename?: string) => void;
  updateRow: (id: string, updates: Partial<BomRowExtended>) => void;
  deleteRow: (id: string) => void;
  setLcscInfo: (lcsc: string, info: LcscPartInfo) => void;
  setFetchStatus: (lcsc: string, status: BomRowExtended['fetchStatus'], errorMessage?: string) => void;
  setFetchProgress: (progress: { current: number; total: number } | null) => void;
  clearAll: () => void;

  // 계산된 값
  getUniquePartNumbers: () => string[];
  getPendingPartNumbers: () => string[];
  getTotalCost: () => number;
}

function findApplicablePrice(prices: PriceTier[], quantity: number): number | undefined {
  if (!prices || prices.length === 0) return undefined;

  // 수량에 해당하는 가격 티어 찾기
  const tier = prices.find(
    (p) => quantity >= p.minQty && (p.maxQty === null || quantity <= p.maxQty)
  );

  return tier?.price || prices[0]?.price;
}

export const useBomStore = create<BomStore>()(
  immer((set, get) => ({
    rows: [],
    originalFilename: null,
    fetchProgress: null,

    setRows: (originalRows, filename) => {
      set((state) => {
        state.rows = convertToExtended(originalRows);
        state.originalFilename = filename || null;
        state.fetchProgress = null;
      });
    },

    updateRow: (id, updates) => {
      set((state) => {
        const index = state.rows.findIndex((r) => r.id === id);
        if (index !== -1) {
          Object.assign(state.rows[index], updates);
          // LCSC 번호 변경 시 상태 리셋
          if ('lcsc' in updates) {
            const newLcsc = updates.lcsc;
            state.rows[index].fetchStatus = newLcsc && newLcsc.startsWith('C') ? 'pending' : 'skipped';
            state.rows[index].lcscInfo = undefined;
            state.rows[index].unitPrice = undefined;
            state.rows[index].totalPrice = undefined;
            state.rows[index].errorMessage = undefined;
          }
        }
      });
    },

    deleteRow: (id) => {
      set((state) => {
        const index = state.rows.findIndex((r) => r.id === id);
        if (index !== -1) {
          state.rows.splice(index, 1);
        }
      });
    },

    setLcscInfo: (lcsc, info) => {
      set((state) => {
        state.rows.forEach((row) => {
          if (row.lcsc === lcsc) {
            row.lcscInfo = info;
            row.fetchStatus = 'success';
            row.errorMessage = undefined;
            // 가격 계산 (수량 기반)
            const applicablePrice = findApplicablePrice(info.prices, row.quantity);
            row.unitPrice = applicablePrice;
            row.totalPrice = applicablePrice ? applicablePrice * row.quantity : undefined;
          }
        });
      });
    },

    setFetchStatus: (lcsc, status, errorMessage) => {
      set((state) => {
        state.rows.forEach((row) => {
          if (row.lcsc === lcsc) {
            row.fetchStatus = status;
            if (errorMessage) {
              row.errorMessage = errorMessage;
            }
          }
        });
      });
    },

    setFetchProgress: (progress) => {
      set((state) => {
        state.fetchProgress = progress;
      });
    },

    clearAll: () => {
      set((state) => {
        state.rows = [];
        state.originalFilename = null;
        state.fetchProgress = null;
      });
    },

    getUniquePartNumbers: () => {
      const lcscNumbers = get()
        .rows.map((r) => r.lcsc)
        .filter((lcsc) => lcsc && lcsc.startsWith('C'));
      return [...new Set(lcscNumbers)];
    },

    getPendingPartNumbers: () => {
      const lcscNumbers = get()
        .rows.filter((r) => r.fetchStatus === 'pending')
        .map((r) => r.lcsc)
        .filter((lcsc) => lcsc && lcsc.startsWith('C'));
      return [...new Set(lcscNumbers)];
    },

    getTotalCost: () => {
      return get().rows.reduce((sum, row) => sum + (row.totalPrice || 0), 0);
    },
  }))
);
