import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isD1, prodOrigin } from "@/lib/mode";

export async function POST(req: Request) {
  if (isD1()) {
    return NextResponse.json(
      { ok: false, error: "ثبت پیام از طریق سایت اصلی انجام می‌شود.", redirect: `${prodOrigin()}/contact` },
      { status: 307 }
    );
  }
  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 80);
    const message = String(body.message || "").trim().slice(0, 5000);
    if (!name || !message) {
      return NextResponse.json({ ok: false, error: "نام و متن پیام الزامی است." }, { status: 400 });
    }
    await db.contactMessage.create({
      data: {
        name,
        contact: String(body.contact || "").trim().slice(0, 120),
        subject: String(body.subject || "").trim().slice(0, 160),
        message,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "خطای داخلی در ثبت پیام." }, { status: 500 });
  }
}
