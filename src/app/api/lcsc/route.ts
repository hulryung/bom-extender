import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface JlcpcbComponent {
  componentCode: string;
  componentBrandEn: string;
  componentModelEn: string;
  describe: string;
  componentSpecificationEn: string;
  stockCount: number;
  componentPrices: Array<{
    startNumber: number;
    endNumber: number;
    productPrice: number;
  }>;
  dataManualUrl: string;
  minImageAccessId: string;
  lcscGoodsUrl: string;
}

interface JlcpcbSearchResponse {
  code: number;
  data: {
    componentPageInfo: {
      list: JlcpcbComponent[];
    };
  };
}

function parsePrices(priceList: JlcpcbComponent['componentPrices']) {
  if (!priceList || priceList.length === 0) return [];

  return priceList
    .sort((a, b) => a.startNumber - b.startNumber)
    .map((p) => ({
      minQty: p.startNumber,
      maxQty: p.endNumber === -1 ? null : p.endNumber,
      price: p.productPrice,
    }));
}

export async function GET(request: NextRequest) {
  const partNumber = request.nextUrl.searchParams.get('part');

  if (!partNumber) {
    return NextResponse.json(
      { error: 'Part number is required' },
      { status: 400 }
    );
  }

  if (!partNumber.match(/^C\d+$/)) {
    return NextResponse.json(
      { error: 'Invalid LCSC part number format' },
      { status: 400 }
    );
  }

  try {
    // JLCPCB API 호출
    const response = await fetch(
      'https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ keyword: partNumber }),
      }
    );

    if (!response.ok) {
      throw new Error(`JLCPCB API error: ${response.status}`);
    }

    const data: JlcpcbSearchResponse = await response.json();

    if (data.code !== 200 || !data.data?.componentPageInfo?.list?.length) {
      return NextResponse.json(
        { error: 'Part not found' },
        { status: 404 }
      );
    }

    // 정확히 일치하는 부품 찾기
    const component = data.data.componentPageInfo.list.find(
      (c) => c.componentCode === partNumber
    );

    if (!component) {
      return NextResponse.json(
        { error: 'Part not found' },
        { status: 404 }
      );
    }

    // 정규화된 응답 반환
    return NextResponse.json({
      partNumber: component.componentCode,
      manufacturer: component.componentBrandEn || 'Unknown',
      mpn: component.componentModelEn || '',
      description: component.describe || '',
      package: component.componentSpecificationEn || '',
      stock: component.stockCount || 0,
      prices: parsePrices(component.componentPrices),
      datasheet: component.dataManualUrl || '',
      imageUrl: component.minImageAccessId
        ? `https://assets.jlcpcb.com/attachments/${component.minImageAccessId}`
        : '',
      url: component.lcscGoodsUrl || `https://www.lcsc.com/product-detail/${component.componentCode}.html`,
    });
  } catch (error) {
    console.error('JLCPCB fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch part info' },
      { status: 500 }
    );
  }
}
