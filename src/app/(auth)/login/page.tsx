"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: implement actual auth
  };

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold">登入帳戶</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            歡迎回到 OPC 平台
          </p>
        </div>

        {/* 表單 */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
                required
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

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <input
                type="checkbox"
                className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-500 focus:ring-indigo-400"
              />
              記住我
            </label>
            <Link
              href="/forgot-password"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              忘記密碼？
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20"
          >
            登入
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400">
              或使用第三方登入
            </span>
          </div>
        </div>

        {/* 第三方登入 */}
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

        {/* 註冊連結 */}
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
          還沒有帳戶？{" "}
          <Link
            href="/register"
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            立即註冊
          </Link>
        </p>
      </div>
    </div>
  );
}
