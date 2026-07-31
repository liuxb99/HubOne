"use client";

import { useEffect, useState } from "react";

import type { DigitalThreadView } from "@/lib/engineering/digital-thread";

type APIResponse =
  | { status: "succeeded"; data: DigitalThreadView }
  | { status: string; error: string };

export default function DigitalThreadPage() {
  const [response, setResponse] = useState<APIResponse | null>(null);

  useEffect(() => {
    fetch("/api/civil/digital-thread", { cache: "no-store" })
      .then(async (result) => ({ ok: result.ok, body: (await result.json()) as APIResponse }))
      .then(({ body }) => setResponse(body))
      .catch((error: unknown) =>
        setResponse({ status: "failed", error: error instanceof Error ? error.message : "讀取失敗" }),
      );
  }, []);

  if (!response) {
    return <main className="mx-auto max-w-6xl p-8">正在載入工程 Digital Thread…</main>;
  }
  if (response.status !== "succeeded" || !("data" in response)) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <h1 className="text-2xl font-bold">工程 Digital Thread</h1>
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          {"error" in response ? response.error : "尚無可用資料"}
        </p>
      </main>
    );
  }

  const thread = response.data;
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 sm:p-10">
      <header>
        <p className="text-sm font-medium text-indigo-600">AI 工程顧問公司</p>
        <h1 className="mt-2 text-3xl font-bold">工程 Digital Thread</h1>
        <p className="mt-2 text-zinc-500">从 ESM、IFC、计算到工程图的完整可追溯链。</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="工程主题" value={thread.subject} />
        <SummaryCard label="ESM ID" value={thread.esmId ?? "—"} />
        <SummaryCard label="IFC GUID" value={thread.ifcGuid ?? "—"} />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">工具执行链</h2>
        <div className="mt-5 space-y-3">
          {thread.tools.map((tool, index) => (
            <div key={`${tool.requestId}-${tool.toolId}`} className="flex gap-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold">{tool.toolId}</p>
                <p className="text-sm text-zinc-500">Request：{tool.requestId}</p>
                <p className="text-sm text-emerald-600">{tool.status}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">工程成果</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {thread.artifacts.map((artifact) => (
            <article key={artifact.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{artifact.type}</p>
              <h3 className="mt-1 font-semibold">{artifact.id}</h3>
              <p className="mt-2 break-all text-sm text-zinc-500">{artifact.path}</p>
              <p className="mt-2 break-all font-mono text-xs text-zinc-400">SHA-256 {artifact.sha256}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">关系摘要</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from(new Set(thread.relations.map((relation) => relation.kind))).map((kind) => (
            <span key={kind} className="rounded-full bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800">{kind}</span>
          ))}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 break-all text-lg font-semibold">{value}</p>
    </div>
  );
}
