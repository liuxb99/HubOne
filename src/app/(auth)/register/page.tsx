"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: implement actual auth
  };

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🚀</div>
          <h1 className="text-2xl font-bold">建立帳戶</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            加入 OPC，開啟一人公司之旅
          </p>
        </div>

        {/* 表單 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              使用者名稱
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="您的名稱"
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              電子郵件
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              密碼
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 個字元"
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              確認密碼
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次輸入密碼"
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
              required
              minLength={8}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">密碼不一致</p>
            )}
          </div>

          {/* 密碼強度提示 */}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <p className="font-medium">密碼需求：</p>
            <div className="flex items-center gap-1.5">
              <span className={password.length >= 8 ? "text-green-500" : "text-zinc-400"}>
                {password.length >= 8 ? "✅" : "⬜"}
              </span>
              至少 8 個字元
            </div>
            <div className="flex items-center gap-1.5">
              <span className={/[A-Z]/.test(password) ? "text-green-500" : "text-zinc-400"}>
                {/[A-Z]/.test(password) ? "✅" : "⬜"}
              </span>
              至少一個大寫字母
            </div>
            <div className="flex items-center gap-1.5">
              <span className={/\d/.test(password) ? "text-green-500" : "text-zinc-400"}>
                {/\d/.test(password) ? "✅" : "⬜"}
              </span>
              至少一個數字
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 rounded border-zinc-300 dark:border-zinc-600 text-indigo-500 focus:ring-indigo-400"
              required
            />
            <span>
              我已閱讀並同意{" "}
              <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                服務條款
              </Link>
              {" "}與{" "}
              <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                隱私政策
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={!agree}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            建立帳戶
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400">
              或使用第三方註冊
            </span>
          </div>
        </div>

        {/* 第三方註冊 */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "Google", icon: "🔴" },
            { name: "GitHub", icon: "⚫" },
          ].map((provider) => (
            <button
              key={provider.name}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              <span>{provider.icon}</span>
              <span>{provider.name}</span>
            </button>
          ))}
        </div>

        {/* 登入連結 */}
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
          已經有帳戶？{" "}
          <Link
            href="/login"
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            立即登入
          </Link>
        </p>
      </div>
    </div>
  );
}
