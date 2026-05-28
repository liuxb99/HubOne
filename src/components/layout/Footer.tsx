export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              O
            </span>
            <span>One Person Company © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span>六大業務・一人運營</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">由 AI 輔助建構</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
