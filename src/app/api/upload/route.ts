import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { saveMedia, mediaError } from "@/app/api/citizen/route";

export const runtime = "nodejs";

/** آپلود تصویر شاخص از پنل مدیریت */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const url = await saveMedia(form.get("image") as File | null);
    if (!url) return NextResponse.json({ ok: false, error: "فایلی انتخاب نشده است." }, { status: 400 });
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    const msg = mediaError(err);
    return NextResponse.json({ ok: false, error: msg || "خطا در آپلود تصویر." }, { status: 500 });
  }
}
