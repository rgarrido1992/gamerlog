import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCriticByTitle } from "@/lib/opencritic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const data = await fetchOpenCriticByTitle(title);
  return NextResponse.json({ data });
}
