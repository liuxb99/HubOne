/**
 * 行情數據產生器
 * 模擬即時行情數據，用於前端展示與測試。
 */

export interface KLine {
  time: string; // '2025-01-15'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PairInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

// 種子隨機（可重現）
let _seed = 42;
function seededRandom(): number {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
}

function resetSeed(seed?: number) {
  _seed = seed ?? 42;
}

/**
 * 各交易對的起始價格對照表
 */
const BASE_PRICE_MAP: Record<string, number> = {
  // 加密貨幣
  'BTC/USDT': 42000,
  'ETH/USDT': 2800,
  // 美股
  'TSLA': 350,
  'AAPL': 210,
  'NVDA': 880,
  // 台股
  '2330.TW': 1080,
  '2317.TW': 172,
  '2454.TW': 1285,
  '2412.TW': 122,
  '2308.TW': 380,
  // 台指期
  'TX': 22000,
};

/**
 * 根據 symbol 計算唯一種子
 */
function seedFromSymbol(symbol: string): number {
  return symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

/**
 * 產生指定數量的歷史 K 線數據
 * @param symbol 交易對代號
 * @param count K 線根數（預設 200）
 * @returns KLine 陣列（由遠到近）
 */
export function generateHistory(symbol: string, count: number = 200): KLine[] {
  const basePrice = BASE_PRICE_MAP[symbol] ?? 1000;

  // 根據 symbol 產生不同的隨機種子，確保每個交易對有獨特的價格走勢
  resetSeed(seedFromSymbol(symbol));

  const result: KLine[] = [];
  let prevClose = basePrice;

  const now = new Date();
  now.setDate(now.getDate() - count + 1);
  now.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    const drift = (seededRandom() - 0.48) * basePrice * 0.04; // 微偏正向 drift
    const open = prevClose;
    const close = Math.max(open + drift, basePrice * 0.1);
    const high = Math.max(open, close) * (1 + seededRandom() * 0.015);
    const low = Math.min(open, close) * (1 - seededRandom() * 0.015);
    const volume = Math.floor(seededRandom() * 10000 + 1000);

    result.push({
      time: date.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });

    prevClose = close;
  }

  return result;
}

/**
 * 根據前一根 K 線產生下一根（模擬即時 tick）
 * @param prev 前一根 K 線
 * @returns 新的 K 線
 */
export function generateNextKLine(prev: KLine): KLine {
  const date = new Date(prev.time);
  date.setDate(date.getDate() + 1);

  const change = (Math.random() - 0.47) * prev.close * 0.03;
  const open = prev.close;
  const close = Math.max(open + change, open * 0.1);
  const high = Math.max(open, close) * (1 + Math.random() * 0.015);
  const low = Math.min(open, close) * (1 - Math.random() * 0.015);
  const volume = Math.floor(Math.random() * 10000 + 1000);

  return {
    time: date.toISOString().split("T")[0],
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(close * 100) / 100,
    volume,
  };
}

/**
 * 交易對定義（含即時價格基底）
 */
const PAIR_DEFINITIONS: { symbol: string; name: string; basePrice: number; category: string }[] = [
  // 加密貨幣
  { symbol: "BTC/USDT", name: "比特幣", basePrice: 67500, category: "crypto" },
  { symbol: "ETH/USDT", name: "以太幣", basePrice: 3450, category: "crypto" },
  // 美股
  { symbol: "TSLA", name: "特斯拉", basePrice: 248, category: "us-stock" },
  { symbol: "AAPL", name: "蘋果", basePrice: 198, category: "us-stock" },
  { symbol: "NVDA", name: "輝達", basePrice: 880, category: "us-stock" },
  // 台股
  { symbol: "2330.TW", name: "台積電", basePrice: 1080, category: "tw-stock" },
  { symbol: "2317.TW", name: "鴻海", basePrice: 172, category: "tw-stock" },
  { symbol: "2454.TW", name: "聯發科", basePrice: 1285, category: "tw-stock" },
  { symbol: "2412.TW", name: "中華電", basePrice: 122, category: "tw-stock" },
  { symbol: "2308.TW", name: "台達電", basePrice: 380, category: "tw-stock" },
  // 台指期
  { symbol: "TX", name: "台指期", basePrice: 22000, category: "futures" },
];

/**
 * 產生多個交易對的即時價格快照
 * @param symbol 可選，若指定則只回傳該交易對
 * @returns 交易對陣列
 */
export function generatePairs(symbol?: string): PairInfo[] {
  const list = symbol
    ? PAIR_DEFINITIONS.filter((p) => p.symbol === symbol)
    : PAIR_DEFINITIONS;

  return list.map((p) => {
    const change = (Math.random() - 0.5) * 6; // -3% ~ +3%
    const price = p.basePrice * (1 + change / 100);
    return {
      symbol: p.symbol,
      name: p.name,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
    };
  });
}
