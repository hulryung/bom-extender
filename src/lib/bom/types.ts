// BOM 행 기본 타입 (KiCad 원본)
export interface BomRowOriginal {
  comment: string;        // "0/F/1005", "100nF/16V/0603"
  designator: string;     // "R201,R202,..."
  footprint: string;      // "R_0402_1005Metric"
  lcsc: string;           // "C17168" (nullable)
  quantity: number;       // 31
}

// 가격 티어
export interface PriceTier {
  minQty: number;
  maxQty: number | null;
  price: number;          // USD
}

// LCSC에서 조회한 확장 정보
export interface LcscPartInfo {
  partNumber: string;     // LCSC 부품번호
  manufacturer: string;   // 제조사
  mpn: string;            // 제조사 부품번호 (MPN)
  description: string;    // 설명
  package: string;        // 패키지
  stock: number;          // 재고
  prices: PriceTier[];    // 가격 정보
  datasheet: string;      // 데이터시트 URL
  imageUrl: string;       // 이미지 URL
  url: string;            // LCSC 제품 페이지 URL
}

// 조회 상태
export type FetchStatus = 'pending' | 'loading' | 'success' | 'error' | 'skipped';

// 확장된 BOM 행 (원본 + LCSC 정보)
export interface BomRowExtended extends BomRowOriginal {
  id: string;             // 고유 ID
  lcscInfo?: LcscPartInfo;
  fetchStatus: FetchStatus;
  errorMessage?: string;
  unitPrice?: number;     // 계산된 단가
  totalPrice?: number;    // 수량 * 단가
}

// BOM 스토어 상태
export interface BomState {
  rows: BomRowExtended[];
  originalFilename: string | null;
  fetchProgress: { current: number; total: number } | null;
}
