import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

import { buildDigitalThreadView, parseDigitalThread } from "@/lib/engineering/digital-thread";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const path = process.env.DIGITAL_THREAD_PATH;
  if (!path) {
    return NextResponse.json(
      { status: "not_configured", error: "DIGITAL_THREAD_PATH is not configured" },
      { status: 503 },
    );
  }

  try {
    const raw = await readFile(path, "utf8");
    const snapshot = parseDigitalThread(JSON.parse(raw));
    return NextResponse.json({ status: "succeeded", data: buildDigitalThreadView(snapshot) });
  } catch (error) {
    return NextResponse.json(
      {
        status: "failed",
        error: error instanceof Error ? error.message : "Unable to read digital thread",
      },
      { status: 500 },
    );
  }
}
