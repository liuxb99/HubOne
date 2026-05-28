import SubNav from "@/components/layout/SubNav";

const tabs = [
  { id: "chat", label: "對話", icon: "💬", href: "/ai-tools" },
  { id: "code", label: "程式碼", icon: "🤖", href: "/ai-tools/code" },
  { id: "summary", label: "文件摘要", icon: "📄", href: "/ai-tools/summary" },
  { id: "prompts", label: "提示詞庫", icon: "📝", href: "/ai-tools/prompts" },
  { id: "image", label: "圖片生成", icon: "🖼️", href: "/ai-tools/image" },
  { id: "search", label: "語意搜尋", icon: "🔍", href: "/ai-tools/search" },
];

const tools = [
  { icon: "💬", label: "文字生成", desc: "GPT 驅動的文字生成與對話" },
  { icon: "🤖", label: "程式碼助手", desc: "程式碼生成、審查、重構" },
  { icon: "📄", label: "文件摘要", desc: "自動摘要長文件內容" },
  { icon: "📝", label: "提示詞庫", desc: "管理與分享提示詞模板" },
  { icon: "🖼️", label: "圖片生成", desc: "AI 圖片生成與編輯" },
  { icon: "🔍", label: "語意搜尋", desc: "文件與知識庫語意檢索" },
];

const sidebarItems = [
  { icon: "💬", label: "新對話" },
  { icon: "📁", label: "歷史記錄" },
  { icon: "📝", label: "提示詞庫" },
  { icon: "⚙️", label: "設定" },
];

export default function AiToolsPage() {
  return (
    <div className="min-h-full flex">
      {/* 左側側邊欄 */}
      <aside className="w-16 lg:w-56 shrink-0 border-r border-violet-900/30 bg-zinc-900/50 flex flex-col">
        {/* Logo 區 */}
        <div className="h-14 flex items-center justify-center lg:justify-start lg:px-4 border-b border-violet-900/30">
          <span className="text-xl">🤖</span>
          <span className="hidden lg:inline ml-2 text-sm font-medium text-zinc-300">
            AI 工具
          </span>
        </div>

        {/* 導航 */}
        <nav className="flex-1 p-2 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center justify-center lg:justify-start gap-2 px-2 lg:px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-violet-900/20 transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* 底部用戶 */}
        <div className="p-2 border-t border-violet-900/30">
          <button className="w-full flex items-center justify-center lg:justify-start gap-2 px-2 lg:px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <span className="w-6 h-6 rounded-full bg-violet-800 flex items-center justify-center text-xs text-white">
              U
            </span>
            <span className="hidden lg:inline">用戶名稱</span>
          </button>
        </div>
      </aside>

      {/* 主要工作區 */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-violet-900/30 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">新對話</h1>
            <span className="text-xs text-zinc-500 px-2 py-0.5 rounded bg-zinc-800">
              GPT-4o
            </span>
          </div>
        </div>

        {/* 次導航 */}
        <SubNav tabs={tabs} />

        {/* 對話區 */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              有什麼我可以協助你的嗎？
            </h2>
            <p className="text-sm text-zinc-500">
              文字生成、程式碼撰寫、文件摘要 — 隨心所欲
            </p>
          </div>

          {/* 快速功能卡片 */}
          <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {tools.map((t) => (
              <div
                key={t.label}
                className="rounded-xl border border-violet-900/30 bg-zinc-900/30 p-4 hover:border-violet-700/50 hover:bg-zinc-900/60 transition-all duration-200 cursor-pointer group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {t.icon}
                </div>
                <h4 className="text-sm font-medium text-white mb-0.5">
                  {t.label}
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 底部輸入框 */}
        <div className="border-t border-violet-900/30 px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="輸入訊息，輸入 / 使用提示詞..."
                className="w-full px-4 py-3 rounded-xl border border-violet-900/30 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                readOnly
              />
            </div>
            <button className="px-4 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="max-w-3xl mx-auto mt-2 text-[10px] text-zinc-600 text-center">
            AI 可能產生不準確的資訊 · 請審慎判斷
          </p>
        </div>
      </div>
    </div>
  );
}
