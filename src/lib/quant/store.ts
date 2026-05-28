/**
 * 交易持倉管理
 * 使用 localStorage 持久化持倉數據與帳戶餘額。
 */

const STORAGE_KEY_POSITIONS = "quant_positions";
const STORAGE_KEY_BALANCE = "quant_balance";
const INITIAL_BALANCE = 100000; // 初始虛擬資金 10 萬 USD

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 不可用時忽略
  }
}

/**
 * 取得當前所有持倉
 */
export function getPositions(): Position[] {
  return safeRead<Position[]>(STORAGE_KEY_POSITIONS, []);
}

/**
 * 新增或增加持倉（若已有同 symbol 則平均成本）
 */
export function addPosition(pos: Position): void {
  const positions = getPositions();
  const existing = positions.find((p) => p.symbol === pos.symbol);

  if (existing) {
    // 加倉：加權平均成本
    const totalCost = existing.avgPrice * existing.quantity + pos.avgPrice * pos.quantity;
    existing.quantity += pos.quantity;
    existing.avgPrice = totalCost / existing.quantity;
  } else {
    positions.push({ ...pos });
  }

  safeWrite(STORAGE_KEY_POSITIONS, positions);
}

/**
 * 平倉（移除指定交易對的所有持倉）
 */
export function closePosition(symbol: string): void {
  const positions = getPositions().filter((p) => p.symbol !== symbol);
  safeWrite(STORAGE_KEY_POSITIONS, positions);
}

/**
 * 部分平倉（減少指定數量）
 * @returns 實際減少的數量
 */
export function reducePosition(symbol: string, quantity: number): number {
  const positions = getPositions();
  const idx = positions.findIndex((p) => p.symbol === symbol);
  if (idx === -1) return 0;

  const pos = positions[idx];
  const reduced = Math.min(quantity, pos.quantity);
  pos.quantity -= reduced;

  if (pos.quantity <= 0) {
    positions.splice(idx, 1);
  }

  safeWrite(STORAGE_KEY_POSITIONS, positions);
  return reduced;
}

/**
 * 取得帳戶餘額
 */
export function getBalance(): number {
  return safeRead<number>(STORAGE_KEY_BALANCE, INITIAL_BALANCE);
}

/**
 * 設定帳戶餘額
 */
export function setBalance(balance: number): void {
  safeWrite(STORAGE_KEY_BALANCE, Math.max(0, balance));
}

/**
 * 扣除餘額（買入時使用）
 * @returns 是否成功扣除
 */
export function deductBalance(amount: number): boolean {
  const balance = getBalance();
  if (balance < amount) return false;
  setBalance(balance - amount);
  return true;
}

/**
 * 增加餘額（賣出時使用）
 */
export function addBalance(amount: number): void {
  setBalance(getBalance() + amount);
}

/**
 * 重置所有持倉與餘額
 */
export function resetAccount(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_POSITIONS);
    localStorage.removeItem(STORAGE_KEY_BALANCE);
  } catch {
    // ignore
  }
}
