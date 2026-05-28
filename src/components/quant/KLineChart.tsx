"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  CandlestickSeriesPartialOptions,
  HistogramSeriesPartialOptions,
  LineStyle,
  CrosshairMode,
} from "lightweight-charts";
import type { KLine } from "@/lib/quant/market";
import {
  calcMA,
  calcEMA,
  calcRSI,
  calcMACD,
  calcBollinger,
} from "@/lib/quant/indicators";

type IndicatorMode = "none" | "ma" | "ema" | "rsi" | "macd" | "bollinger";

interface KLineChartProps {
  data: KLine[];
  /** 預設啟用的指標 */
  defaultIndicators?: IndicatorMode[];
}

/**
 * K 線圖元件
 * 使用 lightweight-charts 繪製，支援多種技術指標疊加
 */
export default function KLineChart({
  data,
  defaultIndicators = ["ma"],
}: KLineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [activeIndicators, setActiveIndicators] =
    useState<IndicatorMode[]>(defaultIndicators);

  // 指標切換
  const toggleIndicator = useCallback((mode: IndicatorMode) => {
    setActiveIndicators((prev) =>
      prev.includes(mode)
        ? prev.filter((m) => m !== mode)
        : [...prev, mode]
    );
  }, []);

  // 建構 lightweight-charts 所須的資料格式
  const candleData = data.map((k) => ({
    time: k.time,
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
  }));

  const volumeData = data.map((k) => ({
    time: k.time,
    value: k.volume,
    color:
      k.close >= k.open
        ? "rgba(0, 200, 83, 0.3)"
        : "rgba(255, 23, 68, 0.3)",
  }));

  const closes = data.map((k) => k.close);

  // 計算各指標
  const ma20 = calcMA(closes, 20);
  const ma60 = calcMA(closes, 60);
  const ema12 = calcEMA(closes, 12);
  const rsi = calcRSI(closes, 14);
  const macdResult = calcMACD(closes);
  const bollingerResult = calcBollinger(closes, 20, 2);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 清除舊圖表
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0D1117" },
        textColor: "#8B949E",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'Inter', monospace",
      },
      grid: {
        vertLines: { color: "rgba(139, 148, 158, 0.08)" },
        horzLines: { color: "rgba(139, 148, 158, 0.08)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(139, 148, 158, 0.4)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1C2128",
        },
        horzLine: {
          color: "rgba(139, 148, 158, 0.4)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1C2128",
        },
      },
      timeScale: {
        borderColor: "#30363D",
        timeVisible: false,
        secondsVisible: false,
        tickMarkFormatter: (time: number) => {
          const date = new Date((time as number) * 1000);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
      },
      rightPriceScale: {
        borderColor: "#30363D",
        scaleMargins: { top: 0.05, bottom: 0.25 },
      },
      width: chartContainerRef.current.clientWidth,
      height: 480,
    });

    // 主圖：蠟燭圖
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00C853",
      downColor: "#FF1744",
      borderUpColor: "#00C853",
      borderDownColor: "#FF1744",
      wickUpColor: "#00C853",
      wickDownColor: "#FF1744",
    } as CandlestickSeriesPartialOptions);
    candleSeries.setData(candleData);

    // 成交量（副圖）
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    } as HistogramSeriesPartialOptions);

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData(volumeData);

    // 存放指標線條的陣列（移除時用）
    const indicatorSeries: any[] = [];

    // ——— 疊加指標 ———

    // MA20
    if (activeIndicators.includes("ma")) {
      const ma20Data = ma20
        .map((v, i) =>
          v !== null ? { time: data[i].time, value: v } : null
        )
        .filter(Boolean);
      const line = chart.addLineSeries({
        color: "#3B82F6",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "MA20",
      });
      line.setData(ma20Data as any);
      indicatorSeries.push(line);

      // MA60
      const ma60Data = ma60
        .map((v, i) =>
          v !== null ? { time: data[i].time, value: v } : null
        )
        .filter(Boolean);
      const line60 = chart.addLineSeries({
        color: "#F59E0B",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "MA60",
      });
      line60.setData(ma60Data as any);
      indicatorSeries.push(line60);
    }

    // EMA12
    if (activeIndicators.includes("ema")) {
      const ema12Data = ema12
        .map((v, i) =>
          v !== null ? { time: data[i].time, value: v } : null
        )
        .filter(Boolean);
      const line = chart.addLineSeries({
        color: "#8B5CF6",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "EMA12",
      });
      line.setData(ema12Data as any);
      indicatorSeries.push(line);
    }

    // RSI
    if (activeIndicators.includes("rsi")) {
      const rsiData = rsi
        .map((v, i) =>
          v !== null
            ? { time: data[i].time, value: Math.round(v * 100) / 100 }
            : null
        )
        .filter(Boolean);
      const line = chart.addLineSeries({
        color: "#EC4899",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        priceScaleId: "rsi",
        title: "RSI",
      });
      chart.priceScale("rsi").applyOptions({
        scaleMargins: { top: 0.7, bottom: 0.25 },
        visible: true,
      });
      line.setData(rsiData as any);
      indicatorSeries.push(line);
    }

    // MACD
    if (activeIndicators.includes("macd")) {
      const macdData = macdResult.macd
        .map((v, i) =>
          v !== null ? { time: data[i].time, value: v } : null
        )
        .filter(Boolean);
      const signalData = macdResult.signal
        .map((v, i) =>
          v !== null ? { time: data[i].time, value: v } : null
        )
        .filter(Boolean);

      const macdLine = chart.addLineSeries({
        color: "#3B82F6",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        priceScaleId: "macd",
        title: "MACD",
      });
      chart.priceScale("macd").applyOptions({
        scaleMargins: { top: 0.7, bottom: 0.25 },
        visible: true,
      });
      macdLine.setData(macdData as any);
      indicatorSeries.push(macdLine);

      const signalLine = chart.addLineSeries({
        color: "#F59E0B",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        priceScaleId: "macd",
        title: "SIGNAL",
      });
      signalLine.setData(signalData as any);
      indicatorSeries.push(signalLine);
    }

    // 布林帶
    if (activeIndicators.includes("bollinger")) {
      const upperData = bollingerResult.upper
        .map((v, i) =>
          v !== null ? { time: data[i].time, value: v } : null
        )
        .filter(Boolean);
      const middleData = bollingerResult.middle
        .map((v, i) =>
          v !== null ? { time: data[i].time, value: v } : null
        )
        .filter(Boolean);
      const lowerData = bollingerResult.lower
        .map((v, i) =>
          v !== null ? { time: data[i].time, value: v } : null
        )
        .filter(Boolean);

      const upperLine = chart.addLineSeries({
        color: "rgba(0, 200, 83, 0.4)",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "BOLL_UPPER",
      });
      upperLine.setData(upperData as any);
      indicatorSeries.push(upperLine);

      const middleLine = chart.addLineSeries({
        color: "rgba(0, 200, 83, 0.6)",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "BOLL_MIDDLE",
      });
      middleLine.setData(middleData as any);
      indicatorSeries.push(middleLine);

      const lowerLine = chart.addLineSeries({
        color: "rgba(0, 200, 83, 0.4)",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "BOLL_LOWER",
      });
      lowerLine.setData(lowerData as any);
      indicatorSeries.push(lowerLine);
    }

    chartRef.current = chart;

    // 響應式 resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, activeIndicators]);

  // 指標按鈕定義
  const indicatorButtons: {
    key: IndicatorMode;
    label: string;
    color: string;
  }[] = [
    { key: "ma", label: "MA", color: "#3B82F6" },
    { key: "ema", label: "EMA", color: "#8B5CF6" },
    { key: "rsi", label: "RSI", color: "#EC4899" },
    { key: "macd", label: "MACD", color: "#F59E0B" },
    { key: "bollinger", label: "布林", color: "#00C853" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 指標切換按鈕列 */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto">
        <span className="text-[10px] text-zinc-500 mr-1 shrink-0">指標</span>
        {indicatorButtons.map((btn) => {
          const isActive = activeIndicators.includes(btn.key);
          return (
            <button
              key={btn.key}
              onClick={() => toggleIndicator(btn.key)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-150 shrink-0 ${
                isActive
                  ? "text-white shadow-sm"
                  : "text-zinc-500 bg-zinc-800/50 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: btn.color + "22",
                      color: btn.color,
                      borderColor: btn.color + "44",
                      border: "1px solid",
                    }
                  : {
                      border: "1px solid transparent",
                    }
              }
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* 圖表容器 */}
      <div ref={chartContainerRef} className="flex-1 min-h-0" />
    </div>
  );
}
