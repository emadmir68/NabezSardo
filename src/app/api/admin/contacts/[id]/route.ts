import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const c = await db.contactMessage.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ ok: false, error: "پیام یافت نشد." }, { status: 404 });
  await db.contactMessage.update({ where: { id }, data: { read: !c.read } });
  return NextResponse.json({ ok: true, read: !c.read });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await db.contactMessage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
