import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED = ["breakingText", "adEnabled", "adTitle", "adText", "adLink", "tagline"];

/** ذخیره تنظیمات (نوار خبر فوری، تبلیغات) */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    for (const key of ALLOWED) {
      if (key in body) {
        const value = String(body[key] ?? "").slice(0, 500);
        await db.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "خطای داخلی در ذخیره تنظیمات." }, { status: 500 });
  }
}
