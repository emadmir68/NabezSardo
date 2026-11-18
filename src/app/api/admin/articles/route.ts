import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { slugify, textToRich, sanitizeRich, plainFromRich } from "@/lib/sanitize";

export const runtime = "nodejs";

async function uniqueSlug(raw: string, currentId?: string): Promise<string> {
  let s = slugify(raw);
  let i = 2;
  for (;;) {
    const found = await db.article.findFirst({ where: { slug: s } });
    if (!found || found.id === currentId) return s;
    s = slugify(raw) + "-" + i++;
  }
}

function buildPayload(f: Record<string, string>) {
  const bodyText = String(f.body || "").slice(0, 300000);
  const rich = textToRich(bodyText);
  return {
    title: String(f.title || "").trim().slice(0, 300),
    categoryId: String(f.categoryId || ""),
    lead: String(f.lead || "").trim().slice(0, 600),
    author: String(f.author || "تحریریه نبض ساردو").trim().slice(0, 80) || "تحریریه نبض ساردو",
    location: String(f.location || "ساردوئیه").trim().slice(0, 80) || "ساردوئیه",
    status: f.status === "published" ? "published" : "draft",
    featured: f.featured === "1",
    image: String(f.image || "").slice(0, 500),
    bodyHtml: rich.html,
    body: rich.plain,
  };
}

/** ساخت خبر جدید */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const f = await req.json();
    const payload = buildPayload(f);
    if (!payload.title) return NextResponse.json({ ok: false, error: "عنوان الزامی است." }, { status: 400 });
    if (!payload.categoryId) return NextResponse.json({ ok: false, error: "دسته‌بندی الزامی است." }, { status: 400 });
    const cat = await db.category.findUnique({ where: { id: payload.categoryId } });
    if (!cat) return NextResponse.json({ ok: false, error: "دسته‌بندی یافت نشد." }, { status: 400 });

    const slug = await uniqueSlug(String(f.slug || payload.title));
    const a = await db.article.create({
      data: {
        ...payload,
        slug,
        publishedAt: payload.status === "published" ? new Date() : null,
      },
    });
    return NextResponse.json({ ok: true, id: a.id });
  } catch {
    return NextResponse.json({ ok: false, error: "خطای داخلی در ذخیره خبر." }, { status: 500 });
  }
}

/** به‌روزرسانی خبر موجود */
export async function PUT(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const id = String(body.id || "");
    const existing = await db.article.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ ok: false, error: "خبر یافت نشد." }, { status: 404 });

    const payload = buildPayload(body);
    if (!payload.title) return NextResponse.json({ ok: false, error: "عنوان الزامی است." }, { status: 400 });

    // اگر بدنه HTML ارسال‌شده قبلاً رندر شده (حالت ویرایش دستی) از sanitize عبور کن
    if (body.bodyHtmlDirect) {
      payload.bodyHtml = sanitizeRich(String(body.bodyHtmlDirect).slice(0, 400000));
      payload.body = plainFromRich(payload.bodyHtml);
    }

    const wasPublished = existing.status === "published";
    const nowPublished = payload.status === "published";
    const slug =
      body.slug && String(body.slug).trim() && slugify(String(body.slug)) !== existing.slug
        ? await uniqueSlug(String(body.slug), existing.id)
        : await uniqueSlug(existing.slug, existing.id);

    await db.article.update({
      where: { id },
      data: {
        ...payload,
        slug,
        publishedAt: !wasPublished && nowPublished ? new Date() : existing.publishedAt,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "خطای داخلی در ذخیره تغییرات." }, { status: 500 });
  }
}
