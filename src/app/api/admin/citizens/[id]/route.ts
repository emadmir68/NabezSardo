import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";

/** تغییر وضعیت گزارش مردمی (بررسی‌شده/بایگانی) */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "");
  if (!["new", "reviewed", "archived"].includes(status)) {
    return NextResponse.json({ ok: false, error: "وضعیت نامعتبر است." }, { status: 400 });
  }
  await db.citizenReport.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}

/** حذف گزارش مردمی */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await db.citizenReport.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
