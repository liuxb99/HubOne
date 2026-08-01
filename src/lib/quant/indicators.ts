/**
 * 技術指標計算函式庫
 * 所有函數均為純函數（Pure Function），無副作用（side effect）。
 * 回傳陣列長度與輸入 data 一致，開頭不足計算的項目為 null。
 */

/**
 * 簡單移動平均線 (MA / SMA)
 * @param data 價格序列（通常為收盤價）
 * @param period 週期（如 20）
 * @returns 長度與 data 相同，前 period-1 項為 null
 */
export function calcMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j];
    }
    result[i] = sum / period;
  }

  return result;
}

/**
 * 指數移動平均線 (EMA)
 * @param data 價格序列
 * @param period 週期
 * @returns 長度與 data 相同，前 period-1 項為 null
 */
export function calcEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  const multiplier = 2 / (period + 1);

  // 第一個 EMA 值 = SMA
  if (data.length >= period) {
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }
    result[period - 1] = sum / period;

    // 後續 EMA = (收盤價 - 前一日 EMA) × 乘數 + 前一日 EMA
    for (let i = period; i < data.length; i++) {
      result[i] = (data[i] - result[i - 1]!) * multiplier + result[i - 1]!;
    }
  }

  return result;
}

/**
 * 相對強弱指標 (RSI)
 * @param data 價格序列
 * @param period 週期（常用 14）
 * @returns 長度與 data 相同，前 period 項為 null
 */
export function calcRSI(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period + 1) return result;

  let gains = 0;
  let losses = 0;

  // 初始平均漲跌幅 (SMA)
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // 第一個 RSI
  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = 100 - 100 / (1 + rs);
  }

  // 平滑計算後續 RSI
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

/**
 * MACD 指標（指數平滑異同移動平均線）
 * @param data 價格序列
 * @returns { macd, signal, histogram } 三個陣列，長度與 data 相同
 *   - macd: 快線 (12 EMA - 26 EMA)
 *   - signal: 慢線 (MACD 的 9 EMA)
 *   - histogram: 柱狀圖 (MACD - Signal)
 */
export function calcMACD(data: number[]): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const ema12 = calcEMA(data, 12);
  const ema26 = calcEMA(data, 26);

  const macd: (number | null)[] = new Array(data.length).fill(null);
  for (let i = 0; i < data.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macd[i] = ema12[i]! - ema26[i]!;
    }
  }

  // Signal = MACD 的 9 EMA
  const signalValues: number[] = [];
  const macdValues: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (macd[i] !== null) {
      macdValues.push(macd[i]!);
    }
  }

  const signalRaw = calcEMA(macdValues, 9);

  const signal: (number | null)[] = new Array(data.length).fill(null);
  // 前 26 + 9 - 1 = 34 項為 null (ema26 需要 26, signal 再需要 9)
  let macdIdx = 0;
  for (let i = 0; i < data.length; i++) {
    if (macd[i] !== null) {
      signal[i] = signalRaw[macdIdx];
      macdIdx++;
    }
  }

  const histogram: (number | null)[] = new Array(data.length).fill(null);
  for (let i = 0; i < data.length; i++) {
    if (macd[i] !== null && signal[i] !== null) {
      histogram[i] = macd[i]! - signal[i]!;
    }
  }

  return { macd, signal, histogram };
}

/**
 * 布林通道 (Bollinger Bands)
 * @param data 價格序列
 * @param period 週期（常用 20）
 * @param stdDev 標準差倍數（常用 2）
 * @returns { upper, middle, lower }
 */
export function calcBollinger(
  data: number[],
  period: number,
  stdDev: number
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calcMA(data, period); // 中軌 = MA
  const upper: (number | null)[] = new Array(data.length).fill(null);
  const lower: (number | null)[] = new Array(data.length).fill(null);

  for (let i = period - 1; i < data.length; i++) {
    // 計算標準差
    let sumSqDiff = 0;
    const mean = middle[i]!;
    for (let j = i - period + 1; j <= i; j++) {
      sumSqDiff += (data[j] - mean) ** 2;
    }
    const std = Math.sqrt(sumSqDiff / period);

    upper[i] = mean + stdDev * std;
    lower[i] = mean - stdDev * std;
  }

  return { upper, middle, lower };
}
