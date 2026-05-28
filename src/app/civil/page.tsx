"use client";

import { Suspense, useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import SubNav from "@/components/layout/SubNav";
import BeamForm from "@/components/civil/BeamForm";
import ColumnForm from "@/components/civil/ColumnForm";
import SlabForm from "@/components/civil/SlabForm";
import FoundationForm from "@/components/civil/FoundationForm";
import SteelForm from "@/components/civil/SteelForm";
import LoadComboPanel from "@/components/civil/LoadComboPanel";
import BeamDiagram from "@/components/civil/BeamDiagram";
import PnCurve from "@/components/civil/PnCurve";
import CalcReport from "@/components/civil/CalcReport";
import Button from "@/components/ui/Button";

// ── Midas 風格配色 ──
const MIDAS = {
  orange: '#FF6D00',
  dark: '#37474F',
  blue: '#1E40AF',
  red: '#DC2626',
  green: '#16A34A',
  teal: '#0D9488',
  bg: '#F5F5F0',
  card: '#FFFFFF',
  border: '#E4E4E7',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
};

// ── 工具樹狀結構 ──
interface TreeItem {
  id: string;
  icon: string;
  label: string;
  desc?: string;
}

interface TreeGroup {
  icon: string;
  label: string;
  items: TreeItem[];
}

const TREE_DATA: TreeGroup[] = [
  {
    icon: '🏗️',
    label: '梁計算',
    items: [
      { id: 'beam', icon: '📐', label: '鋼梁內力', desc: '簡支/固定/懸臂梁' },
    ],
  },
  {
    icon: '🏛️',
    label: '柱計算',
    items: [
      { id: 'column', icon: '🔩', label: '鋼柱 / RC 柱', desc: '軸壓/長細比/PM曲線' },
    ],
  },
  {
    icon: '📋',
    label: '版設計',
    items: [
      { id: 'slab', icon: '🧱', label: 'RC 版設計', desc: '單向版/雙向版' },
    ],
  },
  {
    icon: '🏠',
    label: '基礎設計',
    items: [
      { id: 'foundation', icon: '🏗️', label: '獨立基腳', desc: '承載力/厚度/配筋' },
    ],
  },
  {
    icon: '🔩',
    label: '鋼構設計',
    items: [
      { id: 'steel', icon: '🔗', label: '鋼構連接', desc: '螺栓/銲接設計' },
    ],
  },
  {
    icon: '⚖️',
    label: '載重組合',
    items: [
      { id: 'load', icon: '📊', label: '荷載組合', desc: 'DL/LL/WL/EL' },
    ],
  },
];

// ── 分頁設定 ──
const tabs = [
  { id: "civil", label: "結構計算", icon: "🏗️", href: "/civil" },
];

// ── 工具中繼資料 ──
type ToolCategory = 'beam' | 'column' | 'slab' | 'foundation' | 'steel' | 'load';

const TOOL_META: Record<ToolCategory, { title: string; desc: string }> = {
  beam: { title: '鋼梁內力計算', desc: '簡支梁、固定梁、懸臂梁之彎矩、剪力、撓度分析，含型鋼選擇與斷面驗算' },
  column: { title: '鋼柱 / RC 柱設計', desc: '鋼柱軸壓承載力、長細比檢核、RC 柱 PM 曲線與配筋設計' },
  slab: { title: 'RC 版設計', desc: '單向版與雙向版之版厚檢討、彎矩配筋、溫度鋼筋計算（ACI 318-19）' },
  foundation: { title: '獨立基腳設計', desc: '基腳尺寸設計、厚度檢討（剪力+彎矩）、配筋計算（ACI 318-19 §13）' },
  steel: { title: '鋼結構連接設計', desc: '螺栓連接（AISC §J3）與銲接設計（AISC §J2），含組合應力檢討' },
  load: { title: '荷載組合', desc: '依據台灣建築物結構設計規範之載重組合係數（LRFD / ASD）' },
};

// ═══════════════════════════════════════════
//  主內容
// ═══════════════════════════════════════════

function CivilContent() {
  const searchParams = useSearchParams();
  const [activeTool, setActiveTool] = useState<ToolCategory>('beam');
  const [expandedGroup, setExpandedGroup] = useState<string>('梁計算');
  const [result, setResult] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);

  // 從 URL 同步
  useEffect(() => {
    const tool = searchParams.get('tool') as ToolCategory | null;
    if (tool && Object.keys(TOOL_META).includes(tool)) {
      setActiveTool(tool);
    }
  }, [searchParams]);

  const handleToolChange = useCallback((tool: ToolCategory) => {
    setActiveTool(tool);
    setResult(null);
    setShowReport(false);
    // 自動展開對應群組
    for (const group of TREE_DATA) {
      if (group.items.some((item) => item.id === tool)) {
        setExpandedGroup(group.label);
        break;
      }
    }
  }, []);

  const handleResult = useCallback((newResult: any) => {
    setResult(newResult);
    setShowReport(false);
  }, []);

  const renderForm = () => {
    switch (activeTool) {
      case 'beam': return <BeamForm onResult={handleResult} />;
      case 'column': return <ColumnForm onResult={handleResult} />;
      case 'slab': return <SlabForm onResult={handleResult} />;
      case 'foundation': return <FoundationForm onResult={handleResult} />;
      case 'steel': return <SteelForm onResult={handleResult} />;
      case 'load': return <LoadComboPanel onResult={handleResult} />;
      default: return <BeamForm onResult={handleResult} />;
    }
  };

  const renderDiagram = () => {
    if (showReport && result) {
      return (
        <div className="space-y-3">
          <button
            onClick={() => setShowReport(false)}
            className="text-xs text-[var(--theme-color)] hover:underline"
          >
            ← 返回圖表
          </button>
          <div className="max-h-[600px] overflow-y-auto">
            <CalcReport
              result={result}
              type={activeTool === 'beam' ? 'beam' : 'column'}
              params={result._params ?? {}}
            />
          </div>
        </div>
      );
    }

    switch (activeTool) {
      case 'beam':
        return <BeamDiagram result={result} width={420} height={360} />;
      case 'column':
        if (result?.interactionPoints) {
          return (
            <PnCurve
              points={result.interactionPoints}
              Pu={result.axialLoad ?? 0}
              Mu={result.maxMoment ?? 0}
              sectionDesc={`RC ${result.b ?? 400}×${result.h ?? 400} mm`}
              width={420}
              height={400}
            />
          );
        }
        if (result?.section) {
          return <ColumnDiagram result={result} width={420} height={300} />;
        }
        return <DiagramPlaceholder icon="🏛️" text="柱示意圖與 PM 曲線" />;
      case 'slab':
        return result ? <SlabDiagram result={result} width={420} height={300} /> : <DiagramPlaceholder icon="🧱" text="版配筋示意圖" />;
      case 'foundation':
        return result ? <FootingDiagram result={result} width={420} height={300} /> : <DiagramPlaceholder icon="🏗️" text="基腳斷面示意圖" />;
      case 'steel':
        return result ? <SteelDiagram result={result} width={420} height={300} /> : <DiagramPlaceholder icon="🔩" text="螺栓 / 銲道示意圖" />;
      case 'load':
        return result ? <LoadDiagram result={result} width={420} height={300} /> : <DiagramPlaceholder icon="⚖️" text="載重組合長條圖" />;
      default:
        return <DiagramPlaceholder icon="📐" text="請選擇計算工具" />;
    }
  };

  const renderKeyValues = () => {
    if (!result || showReport) return null;

    const items = getKeyValues(activeTool, result);
    if (items.length === 0) return null;

    return (
      <div className="space-y-1.5">
        <h4 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          關鍵數值
        </h4>
        {items.map((item, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-between px-2.5 py-1.5 rounded text-xs',
              item.highlight
                ? 'bg-[var(--theme-color)]/5 border border-[var(--theme-color)]/20'
                : 'bg-[var(--bg-tertiary)]',
            )}
          >
            <span className="text-[var(--text-secondary)]">{item.label}</span>
            <span className={cn(
              'font-mono font-medium',
              item.danger ? 'text-error' : item.safe ? 'text-success' : 'text-[var(--text-primary)]'
            )}>
              {item.value}
              {item.unit && <span className="text-[10px] text-[var(--text-tertiary)] ml-0.5">{item.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const meta = TOOL_META[activeTool];

  return (
    <>
      <SubNav tabs={tabs} />

      {/* ═══════════ 三欄佈局 ═══════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── 左側：樹狀工具面板 ── */}
          <aside className="lg:w-52 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-1">
              {TREE_DATA.map((group) => {
                const isExpanded = expandedGroup === group.label;
                const hasActive = group.items.some((item) => item.id === activeTool);
                const isGroupActive = hasActive;

                return (
                  <div key={group.label} className="rounded-lg overflow-hidden">
                    {/* 群組標題（可點擊展開/收起） */}
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? '' : group.label)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors',
                        isGroupActive
                          ? 'text-[var(--theme-color)] bg-[var(--theme-color)]/5'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]',
                      )}
                    >
                      <span className="text-base">{group.icon}</span>
                      <span className="flex-1 text-left">{group.label}</span>
                      <svg
                        className={cn(
                          'w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform duration-200',
                          isExpanded && 'rotate-90',
                        )}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>

                    {/* 子項目 */}
                    <div className={cn(
                      'overflow-hidden transition-all duration-200',
                      isExpanded ? 'max-h-96' : 'max-h-0',
                    )}>
                      <div className="pl-3 pr-1 pb-1 space-y-0.5">
                        {group.items.map((item) => {
                          const isActive = activeTool === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleToolChange(item.id as ToolCategory)}
                              className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all',
                                isActive
                                  ? 'bg-[var(--theme-color)] text-white shadow-sm font-medium'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]',
                              )}
                            >
                              <span className="text-sm">{item.icon}</span>
                              <div className="text-left">
                                <div className={isActive ? 'text-white' : ''}>{item.label}</div>
                                {item.desc && (
                                  <div className={cn(
                                    'text-[10px]',
                                    isActive ? 'text-white/70' : 'text-[var(--text-tertiary)]',
                                  )}>
                                    {item.desc}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 底部版本資訊 */}
              <div className="pt-2 px-3">
                <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--theme-color)]" />
                  Midas Design+ 風格
                </div>
              </div>
            </div>
          </aside>

          {/* ── 中側：參數表單 ── */}
          <main className="flex-1 min-w-0">
            {/* 工具標題 */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {meta.title}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--theme-color)]/10 text-[var(--theme-color)] font-mono">
                  {activeTool}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {meta.desc}
              </p>
            </div>

            {/* 表單內容 */}
            <div className="rounded-xl border border-[var(--border)] bg-white p-4 sm:p-6 shadow-sm">
              {renderForm()}
            </div>

            {/* 計算書按鈕（有結果時顯示） */}
            {result && (
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowReport(!showReport)}
                  className="w-full"
                >
                  {showReport ? '📊 返回圖表' : '📄 檢視計算書'}
                </Button>
              </div>
            )}
          </main>

          {/* ── 右側：SVG 即時圖表 ── */}
          <aside className="lg:w-[440px] shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* 圖表區 */}
              <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {activeTool === 'beam' && '📐 內力圖'}
                    {activeTool === 'column' && '🏛️ 柱分析圖'}
                    {activeTool === 'slab' && '🧱 版配筋圖'}
                    {activeTool === 'foundation' && '🏗️ 基腳斷面'}
                    {activeTool === 'steel' && '🔩 連接詳圖'}
                    {activeTool === 'load' && '⚖️ 載重分析'}
                  </h3>
                  {result && !showReport && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-mono">
                      🟢 即時
                    </span>
                  )}
                </div>
                {renderDiagram()}
              </div>

              {/* 關鍵數值 */}
              {renderKeyValues()}
            </div>
          </aside>
        </div>

        {/* ── 底部 ── */}
        <div className="mt-10 pt-6 border-t border-[var(--border)] text-center">
          <p className="text-xs text-[var(--text-tertiary)]">
            計算結果僅供參考，實際設計請依相關法規與專業技師審核
          </p>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
//  輔助函數與子元件
// ═══════════════════════════════════════════

/** 根據工具類型與結果提取關鍵數值 */
function getKeyValues(tool: ToolCategory, result: any): { label: string; value: string; unit?: string; highlight?: boolean; safe?: boolean; danger?: boolean }[] {
  const items: any[] = [];

  try {
    switch (tool) {
      case 'beam':
        if (result.maxMoment !== undefined) {
          items.push({ label: 'Mmax', value: result.maxMoment.toFixed(1), unit: 'kN·m', highlight: true });
          items.push({ label: 'Vmax', value: result.maxShear.toFixed(1), unit: 'kN' });
          items.push({ label: 'δmax', value: result.maxDeflection.toFixed(2), unit: 'mm' });
          items.push({
            label: '狀態',
            value: result.isSafe ? '🟢 安全' : '🔴 不合格',
            safe: result.isSafe,
            danger: !result.isSafe,
          });
        }
        break;
      case 'column':
        if (result.slenderness !== undefined) {
          items.push({ label: 'λ', value: result.slenderness.toFixed(1) });
          items.push({ label: 'Pcr', value: result.criticalLoad.toFixed(1), unit: 'kN', highlight: true });
          items.push({ label: 'Pa', value: result.allowableLoad.toFixed(1), unit: 'kN' });
          items.push({
            label: '狀態',
            value: result.isSafe ? '🟢 安全' : '🔴 不合格',
            safe: result.isSafe,
            danger: !result.isSafe,
          });
        } else if (result.As_total !== undefined) {
          items.push({ label: 'Ast', value: result.As_total.toFixed(0), unit: 'mm²', highlight: true });
          items.push({ label: 'ρg', value: (result.rho_g * 100).toFixed(2), unit: '%' });
          items.push({ label: 'φPn,max', value: result.phiPn_max.toFixed(1), unit: 'kN' });
          items.push({
            label: '狀態',
            value: result.isSafe ? '🟢 安全' : '🔴 不合格',
            safe: result.isSafe,
            danger: !result.isSafe,
          });
        }
        break;
      case 'slab':
        if (result.h_provided !== undefined) {
          items.push({ label: '版厚 h', value: result.h_provided.toFixed(0), unit: 'mm', highlight: true });
          items.push({ label: 'Mu,x', value: result.Mu_x?.toFixed(1), unit: 'kN·m/m' });
          items.push({ label: 'As,main', value: result.As_main_x?.toFixed(0), unit: 'mm²/m' });
          const slabOK = result.isThicknessOK && result.isDeflectionOK;
          items.push({
            label: '狀態',
            value: slabOK ? '🟢 安全' : '🔴 不合格',
            safe: slabOK,
            danger: !slabOK,
          });
        }
        break;
      case 'foundation':
        if (result.B !== undefined) {
          items.push({ label: '尺寸 B×L', value: `${result.B}×${result.L}`, unit: 'm', highlight: true });
          items.push({ label: '厚度 H', value: result.H.toFixed(0), unit: 'mm' });
          items.push({ label: 'q實際', value: result.q_actual?.toFixed(1), unit: 'kN/m²' });
          const fok = result.isBearingOK && result.isThicknessOK && result.isShearOK;
          items.push({
            label: '狀態',
            value: fok ? '🟢 安全' : '🔴 不合格',
            safe: fok,
            danger: !fok,
          });
        }
        break;
      case 'steel':
        if (result.boltCount !== undefined) {
          items.push({ label: '螺栓數', value: result.boltCount.toString(), unit: '支', highlight: true });
          items.push({ label: 'φVn', value: result.shearCapacity?.toFixed(1), unit: 'kN' });
          items.push({ label: 'φTn', value: result.tensionCapacity?.toFixed(1), unit: 'kN' });
          const bok = result.isShearOK && result.isTensionOK;
          items.push({
            label: '狀態',
            value: bok ? '🟢 安全' : '🔴 不合格',
            safe: bok,
            danger: !bok,
          });
        } else if (result.capacity !== undefined) {
          items.push({ label: '銲道容量', value: result.capacity.toFixed(1), unit: 'kN', highlight: true });
          items.push({ label: '使用率', value: (result.ratio * 100).toFixed(1), unit: '%' });
          items.push({
            label: '狀態',
            value: result.isOK ? '🟢 安全' : '🔴 不合格',
            safe: result.isOK,
            danger: !result.isOK,
          });
        }
        break;
      case 'load':
        if (result.maxCombo) {
          items.push({ label: '最不利組合', value: result.maxCombo.name, highlight: true });
          items.push({ label: '最大值', value: result.maxCombo.value.toFixed(1), unit: 'kN' });
          items.push({ label: '總載重', value: result.totalLoad?.toFixed(1), unit: 'kN' });
        }
        break;
    }
  } catch (e) {
    // ignore
  }

  return items;
}

/** 佔位圖表 */
function DiagramPlaceholder({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-3 opacity-50">{icon}</span>
      <p className="text-xs text-[var(--text-tertiary)]">{text}</p>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-1 opacity-60">
        輸入參數後將即時顯示
      </p>
    </div>
  );
}

/** 柱示意圖 SVG（鋼柱） */
function ColumnDiagram({ result, width, height }: { result: any; width: number; height: number }) {
  const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const cx = MARGIN.left + plotW / 2;
  const topY = MARGIN.top;
  const botY = MARGIN.top + plotH;
  const colW = plotW * 0.2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto rounded-lg bg-white">
      <defs>
        <linearGradient id="colGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* 背景網格 */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`gx-${i}`} x1={MARGIN.left} y1={topY + (plotH / 5) * i} x2={MARGIN.left + plotW} y2={topY + (plotH / 5) * i} stroke="#E5E7EB" strokeWidth="0.5" />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`gy-${i}`} x1={MARGIN.left + (plotW / 5) * i} y1={topY} x2={MARGIN.left + (plotW / 5) * i} y2={topY + plotH} stroke="#E5E7EB" strokeWidth="0.5" />
      ))}

      {/* 柱體 */}
      <rect x={cx - colW / 2} y={topY} width={colW} height={plotH} rx="2" fill="url(#colGrad)" />

      {/* 頂部固定端 */}
      <rect x={cx - colW / 2 - 8} y={topY - 3} width={colW + 16} height="6" rx="1" fill="#DC2626" />
      <line x1={cx - colW / 2 - 16} y1={topY - 1} x2={cx + colW / 2 + 16} y2={topY - 1} stroke="#DC2626" strokeWidth="1.5" />

      {/* 底部基礎 */}
      <rect x={cx - colW / 2 - 12} y={botY - 2} width={colW + 24} height="8" rx="1" fill="#6B7280" />
      <line x1={cx - colW / 2 - 12} y1={botY + 6} x2={cx + colW / 2 + 12} y2={botY + 6} stroke="#6B7280" strokeWidth="1.5" />

      {/* 載重箭頭 */}
      <line x1={cx} y1={topY - 14} x2={cx} y2={topY + 4} stroke="#DC2626" strokeWidth="2" markerEnd="url(#arrowRed)" />
      <text x={cx} y={topY - 18} textAnchor="middle" fill="#DC2626" fontSize="10" fontFamily="monospace" fontWeight="600">
        P = {result.axialLoad ?? '?'} kN
      </text>

      {/* 尺寸標註 */}
      <line x1={cx - colW / 2 - 4} y1={botY + 14} x2={cx + colW / 2 + 4} y2={botY + 14} stroke="#6B7280" strokeWidth="0.8" markerStart="url(#arrowGray)" markerEnd="url(#arrowGray)" />
      <text x={cx} y={botY + 26} textAnchor="middle" fill="#6B7280" fontSize="9" fontFamily="monospace">
        L = {result.length ?? '?'} m
      </text>

      {/* 結果標籤 */}
      {result.isSafe !== undefined && (
        <g>
          <rect x={MARGIN.left + 4} y={topY + 4} width={80} height={20} rx="4" fill={result.isSafe ? '#16A34A' : '#DC2626'} opacity="0.9" />
          <text x={MARGIN.left + 44} y={topY + 16} textAnchor="middle" fill="white" fontSize="10" fontWeight="600">
            {result.isSafe ? '🟢 安全' : '🔴 不合格'}
          </text>
        </g>
      )}

      <marker id="arrowRed" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <path d="M0,0 L8,3 L0,6" fill="#DC2626" />
      </marker>
      <marker id="arrowGray" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
        <path d="M0,0 L6,2 L0,4" fill="#6B7280" />
      </marker>
    </svg>
  );
}

/** 版示意圖 SVG */
function SlabDiagram({ result, width, height }: { result: any; width: number; height: number }) {
  const MARGIN = 20;
  const plotW = width - MARGIN * 2;
  const plotH = height - MARGIN * 2;
  const slabH = 30;
  const slabY = MARGIN + (plotH - slabH) / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto rounded-lg bg-white">
      <defs>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6">
          <line x1="0" y1="6" x2="6" y2="0" stroke="#BCAAA4" strokeWidth="0.5" opacity="0.4" />
        </pattern>
      </defs>

      {/* 網格背景 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={i} x1={MARGIN} y1={MARGIN + (plotH / 6) * i} x2={MARGIN + plotW} y2={MARGIN + (plotH / 6) * i} stroke="#E5E7EB" strokeWidth="0.5" />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`gy-${i}`} x1={MARGIN + (plotW / 8) * i} y1={MARGIN} x2={MARGIN + (plotW / 8) * i} y2={MARGIN + plotH} stroke="#E5E7EB" strokeWidth="0.5" />
      ))}

      {/* 版本體 */}
      <rect x={MARGIN + 20} y={slabY} width={plotW - 40} height={slabH} rx="1" fill="#BCAAA4" opacity="0.5" stroke="#78909C" strokeWidth="1.5" />
      <rect x={MARGIN + 20} y={slabY} width={plotW - 40} height={slabH} rx="1" fill="url(#hatch)" />

      {/* 鋼筋標示 */}
      {[0.2, 0.5, 0.8].map((t, i) => {
        const x = MARGIN + 20 + (plotW - 40) * t;
        return (
          <g key={i}>
            <circle cx={x} cy={slabY + slabH / 2} r="4" fill="#FF6D00" stroke="#E65100" strokeWidth="0.8" />
            <text x={x} y={slabY + slabH / 2 + 1.5} textAnchor="middle" fill="white" fontSize="6" fontWeight="700">{i + 1}</text>
          </g>
        );
      })}

      {/* 跨度標註 */}
      <line x1={MARGIN + 20} y1={slabY + slabH + 12} x2={MARGIN + plotW - 20} y2={slabY + slabH + 12} stroke="#6B7280" strokeWidth="0.8" markerStart="url(#arrowGray2)" markerEnd="url(#arrowGray2)" />
      <text x={MARGIN + plotW / 2} y={slabY + slabH + 24} textAnchor="middle" fill="#6B7280" fontSize="9" fontFamily="monospace">
        L = {(result?.spanLx ?? 4000) / 1000}m
      </text>

      {/* 配筋資訊 */}
      {result?.rebar_desc_x && (
        <text x={MARGIN + plotW / 2} y={height - 8} textAnchor="middle" fill="#FF6D00" fontSize="9" fontFamily="sans-serif" fontWeight="600">
          {result.rebar_desc_x} | 版厚 h = {result.h_provided ?? '?'}mm
        </text>
      )}

      <marker id="arrowGray2" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
        <path d="M0,0 L6,2 L0,4" fill="#6B7280" />
      </marker>
    </svg>
  );
}

/** 基腳示意圖 SVG */
function FootingDiagram({ result, width, height }: { result: any; width: number; height: number }) {
  const MARGIN = 20;
  const plotW = width - MARGIN * 2;
  const plotH = height - MARGIN * 2;
  const footingH = plotH * 0.55;
  const footingW = plotW * 0.7;
  const footingX = MARGIN + (plotW - footingW) / 2;
  const footingY = MARGIN + (plotH - footingH) / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto rounded-lg bg-white">
      {/* 網格 */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={i} x1={MARGIN} y1={MARGIN + (plotH / 5) * i} x2={MARGIN + plotW} y2={MARGIN + (plotH / 5) * i} stroke="#E5E7EB" strokeWidth="0.5" />
      ))}

      {/* 土壤 */}
      <rect x={MARGIN} y={footingY + footingH} width={plotW} height={plotH - footingH - (footingY - MARGIN)} fill="#F5F0E0" stroke="#D4C5A9" strokeWidth="0.8" rx="1" />
      <text x={MARGIN + plotW / 2} y={footingY + footingH + plotH * 0.15} textAnchor="middle" fill="#A09070" fontSize="8" fontFamily="sans-serif">
        土壤
      </text>

      {/* 基腳 */}
      <rect x={footingX} y={footingY + footingH * 0.2} width={footingW} height={footingH * 0.8} rx="1" fill="#BCAAA4" opacity="0.6" stroke="#78909C" strokeWidth="1.5" />

      {/* 柱 */}
      <rect x={MARGIN + plotW / 2 - 20} y={MARGIN + 5} width={40} height={footingY + footingH * 0.2 - MARGIN - 5} rx="1" fill="#78909C" stroke="#546E7A" strokeWidth="1.2" />

      {/* 壓力 */}
      <text x={MARGIN + plotW / 2} y={MARGIN - 2} textAnchor="middle" fill="#DC2626" fontSize="9" fontFamily="monospace" fontWeight="600">
        P = {result?.axialLoad ?? '?'} kN
      </text>

      {/* 尺寸標註 */}
      <line x1={footingX} y1={height - MARGIN + 5} x2={footingX + footingW} y2={height - MARGIN + 5} stroke="#6B7280" strokeWidth="0.8" markerStart="url(#arrowF)" markerEnd="url(#arrowF)" />
      <text x={footingX + footingW / 2} y={height - MARGIN + 17} textAnchor="middle" fill="#6B7280" fontSize="9" fontFamily="monospace">
        B = {result?.B ?? '?'}m
      </text>

      <marker id="arrowF" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
        <path d="M0,0 L6,2 L0,4" fill="#6B7280" />
      </marker>
    </svg>
  );
}

/** 鋼構示意圖 SVG */
function SteelDiagram({ result, width, height }: { result: any; width: number; height: number }) {
  const MARGIN = 20;
  const cx = width / 2;
  const cy = height / 2;
  const isBolt = result?.boltCount !== undefined;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto rounded-lg bg-white">
      {/* 網格 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={i} x1={MARGIN} y1={MARGIN + ((height - MARGIN * 2) / 6) * i} x2={width - MARGIN} y2={MARGIN + ((height - MARGIN * 2) / 6) * i} stroke="#E5E7EB" strokeWidth="0.5" />
      ))}

      {isBolt ? (
        <>
          {/* 鋼板 */}
          <rect x={cx - 80} y={cy - 35} width={160} height={70} rx="2" fill="#78909C" opacity="0.4" stroke="#546E7A" strokeWidth="1.5" />
          <rect x={cx - 60} y={cy - 15} width={120} height={30} rx="2" fill="#546E7A" opacity="0.6" stroke="#37474F" strokeWidth="1" />

          {/* 螺栓 */}
          {[-40, 0, 40].map((x, i) => (
            <g key={i}>
              <circle cx={cx + x} cy={cy - 5} r="6" fill="none" stroke="#FF6D00" strokeWidth="2" />
              <circle cx={cx + x} cy={cy - 5} r="2" fill="#FF6D00" />
              <line x1={cx + x} y1={cy - 12} x2={cx + x} y2={cy + 2} stroke="#FF6D00" strokeWidth="1.5" />
            </g>
          ))}

          <text x={cx} y={cy + 45} textAnchor="middle" fill="#FF6D00" fontSize="10" fontFamily="sans-serif" fontWeight="600">
            {result.boltCount} 支 M{result.diameter ?? 22} 螺栓
          </text>
        </>
      ) : (
        <>
          {/* 銲道 */}
          <rect x={cx - 80} y={cy - 30} width={160} height={60} rx="2" fill="#78909C" opacity="0.4" stroke="#546E7A" strokeWidth="1.5" />
          <path d={`M${cx - 70},${cy + 30} L${cx - 70},${cy + 15} L${cx + 70},${cy + 15} L${cx + 70},${cy + 30}`} fill="none" stroke="#FF6D00" strokeWidth="3" />

          {/* 銲道填充 */}
          <path d={`M${cx - 70},${cy + 15} L${cx + 70},${cy + 15} L${cx + 65},${cy + 5} L${cx - 65},${cy + 5} Z`} fill="#FF6D00" opacity="0.3" stroke="#FF6D00" strokeWidth="1" strokeDasharray="3,2" />

          <text x={cx} y={cy + 50} textAnchor="middle" fill="#FF6D00" fontSize="10" fontFamily="sans-serif" fontWeight="600">
            銲道 w={result.weldSize ?? '?'}mm, L={result.weldLength ?? '?'}mm, {result.electrode ?? 'E70'}
          </text>
        </>
      )}

      {/* 安全標籤 */}
      {result && (
        <g>
          <rect x={MARGIN + 4} y={MARGIN + 4} width={70} height={18} rx="4" fill={(result.isOK ?? result.isShearOK) ? '#16A34A' : '#DC2626'} opacity="0.9" />
          <text x={MARGIN + 39} y={MARGIN + 15} textAnchor="middle" fill="white" fontSize="9" fontWeight="600">
            {(result.isOK ?? result.isShearOK) ? '🟢 安全' : '🔴 不合格'}
          </text>
        </g>
      )}
    </svg>
  );
}

/** 載重組合示意圖 SVG */
function LoadDiagram({ result, width, height }: { result: any; width: number; height: number }) {
  const MARGIN = { top: 25, right: 20, bottom: 30, left: 20 };
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const combos = result?.comboResults ?? [];
  if (combos.length === 0) return <DiagramPlaceholder icon="⚖️" text="請添加荷載並計算組合" />;

  const maxVal = Math.max(...combos.map((c: any) => c.value), 1);
  const barW = Math.min(40, (plotW - (combos.length - 1) * 8) / combos.length);
  const colors = ['#FF6D00', '#2563EB', '#16A34A', '#DC2626', '#7C3AED', '#0891B2'];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto rounded-lg bg-white">
      <text x={MARGIN.left + plotW / 2} y={14} textAnchor="middle" fill="#37474F" fontSize="10" fontWeight="600">
        載重組合比較
      </text>

      {combos.map((combo: any, i: number) => {
        const barH = (combo.value / maxVal) * plotH * 0.85;
        const x = MARGIN.left + i * (barW + 8);
        const y = MARGIN.top + plotH - barH;
        const color = colors[i % colors.length];
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="2" fill={color} opacity="0.8" />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace" fontWeight="600">
              {combo.value.toFixed(0)}
            </text>
            <text x={x + barW / 2} y={MARGIN.top + plotH + 12} textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="monospace">
              {combo.name}
            </text>
          </g>
        );
      })}

      {result.maxCombo && (
        <text x={MARGIN.left + plotW / 2} y={height - 5} textAnchor="middle" fill="#FF6D00" fontSize="8" fontFamily="sans-serif">
          最不利: {result.maxCombo.name} = {result.maxCombo.value.toFixed(1)} kN
        </text>
      )}
    </svg>
  );
}

/** 載入中 */
function CivilFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center text-sm text-[var(--text-tertiary)]">
      <div className="animate-pulse">載入中…</div>
    </div>
  );
}

export default function CivilPage() {
  return (
    <div className="min-h-full" style={{ backgroundColor: '#F5F5F0' }}>
      {/* Header */}
      <div className="border-b border-[var(--border)]" style={{ background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏗️</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                土木結構設計
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Midas Design+ 風格 · 梁柱版基礎 · 鋼構連接 · 荷載組合
              </p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<CivilFallback />}>
        <CivilContent />
      </Suspense>
    </div>
  );
}
