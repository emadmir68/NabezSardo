import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";

/** تغییر سریع وضعیت انتشار */
export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const a = await db.article.findUnique({ where: { id } });
  if (!a) return NextResponse.json({ ok: false, error: "خبر یافت نشد." }, { status: 404 });
  const toPublish = a.status !== "published";
  await db.article.update({
    where: { id },
    data: {
      status: toPublish ? "published" : "draft",
      publishedAt: toPublish && !a.publishedAt ? new Date() : a.publishedAt,
    },
  });
  return NextResponse.json({ ok: true, status: toPublish ? "published" : "draft" });
}

/** حذف خبر */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await db.article.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
