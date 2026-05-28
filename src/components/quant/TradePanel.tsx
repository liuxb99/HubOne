"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPositions,
  addPosition,
  closePosition,
  reducePosition,
  getBalance,
  deductBalance,
  addBalance,
  type Position,
} from "@/lib/quant/store";

interface TradePanelProps {
  /** 當前選中交易對（symbol） */
  symbol: string;
  /** 當前最新價格 */
  currentPrice: number;
}

/**
 * 交易面板
 * 顯示當前價格、買入/賣出、持倉列表、帳戶餘額
 */
export default function TradePanel({ symbol, currentPrice }: TradePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [positions, setPositions] = useState<Position[]>([]);
  const [balance, setBalanceState] = useState(getBalance);
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 重新整理持倉與餘額
  const refresh = useCallback(() => {
    setPositions(getPositions());
    setBalanceState(getBalance());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 當前交易對的持倉
  const currentPosition = positions.find((p) => p.symbol === symbol);

  // 持倉盈虧計算
  const getPnL = (pos: Position): { pnl: number; pnlPercent: number } => {
    const marketPrice =
      pos.symbol === symbol ? currentPrice : pos.avgPrice; // 非當前交易對用均價近似
    const pnl = (marketPrice - pos.avgPrice) * pos.quantity;
    const pnlPercent = ((marketPrice - pos.avgPrice) / pos.avgPrice) * 100;
    return { pnl, pnlPercent };
  };

  // 執行交易
  const executeOrder = () => {
    const qty = Math.max(1, Math.floor(quantity));
    const cost = qty * currentPrice;

    if (orderType === "buy") {
      if (deductBalance(cost)) {
        addPosition({ symbol, quantity: qty, avgPrice: currentPrice });
        setMessage({ type: "success", text: `買入 ${qty} ${symbol}` });
      } else {
        setMessage({ type: "error", text: "餘額不足" });
      }
    } else {
      // 賣出
      if (!currentPosition || currentPosition.quantity < qty) {
        setMessage({ type: "error", text: "持倉不足" });
      } else {
        const reduced = reducePosition(symbol, qty);
        addBalance(reduced * currentPrice);
        setMessage({ type: "success", text: `賣出 ${reduced} ${symbol}` });
      }
    }

    refresh();
    // 3 秒後清除訊息
    setTimeout(() => setMessage(null), 3000);
  };

  // 快速下單：買入 / 賣出全部
  const buyMax = () => {
    const qty = Math.max(1, Math.floor(balance / currentPrice));
    setQuantity(qty);
  };

  const sellAll = () => {
    if (currentPosition) {
      setQuantity(currentPosition.quantity);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 價格顯示 */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">{symbol}</span>
          <span className="text-lg font-mono font-bold text-white tabular-nums">
            {currentPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-zinc-500">可用餘額</span>
          <span className="text-sm font-mono text-emerald-400 font-semibold tabular-nums">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* 交易表單 */}
      <div className="px-4 py-3 border-b border-zinc-800 space-y-3">
        {/* 買/賣切換 */}
        <div className="flex rounded-lg overflow-hidden border border-zinc-700">
          <button
            onClick={() => setOrderType("buy")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              orderType === "buy"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            買入
          </button>
          <button
            onClick={() => setOrderType("sell")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              orderType === "sell"
                ? "bg-red-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            賣出
          </button>
        </div>

        {/* 數量輸入 */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-600 transition-colors"
          />
          <button
            onClick={orderType === "buy" ? buyMax : sellAll}
            className="px-2.5 py-2 rounded-lg text-[10px] font-medium bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            {orderType === "buy" ? "最大" : "全部"}
          </button>
        </div>

        {/* 下單按鈕 */}
        <button
          onClick={executeOrder}
          className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-150 ${
            orderType === "buy"
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25"
              : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25"
          }`}
        >
          {orderType === "buy" ? "📈 買入" : "📉 賣出"}{" "}
          {quantity} {symbol}
        </button>

        {/* 交易回饋訊息 */}
        {message && (
          <div
            className={`text-xs px-3 py-2 rounded-lg animate-slide-up ${
              message.type === "success"
                ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50"
                : "bg-red-900/40 text-red-400 border border-red-800/50"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* 持倉列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 border-b border-zinc-800">
          <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
            持倉 ({positions.length})
          </h4>
        </div>

        {positions.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs text-zinc-600">
            暫無持倉
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {positions.map((pos) => {
              const { pnl, pnlPercent } = getPnL(pos);
              const isCurrent = pos.symbol === symbol;

              return (
                <div
                  key={pos.symbol}
                  className={`px-4 py-2.5 ${
                    isCurrent ? "bg-zinc-800/30" : "hover:bg-zinc-800/20"
                  } transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">
                      {pos.symbol}
                    </span>
                    <span className="text-xs font-mono text-zinc-400 tabular-nums">
                      {pos.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-zinc-500">
                      均價 ${pos.avgPrice.toFixed(2)}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold tabular-nums ${
                        pnl >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPercent >= 0 ? "+" : ""}
                      {pnlPercent.toFixed(2)}%)
                    </span>
                  </div>
                  {isCurrent && (
                    <button
                      onClick={() => {
                        closePosition(symbol);
                        refresh();
                      }}
                      className="mt-1.5 text-[10px] text-red-500 hover:text-red-400 transition-colors"
                    >
                      平倉
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
