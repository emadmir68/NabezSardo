import { NextResponse } from "next/server";
import { bumpViews } from "@/lib/nabz-data";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (typeof id !== "string" || !id) return NextResponse.json({ ok: false }, { status: 400 });
    await bumpViews(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
