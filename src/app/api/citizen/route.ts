import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";
import { isD1, prodOrigin } from "@/lib/mode";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

export function mediaError(err: unknown): string | null {
  const m = String((err as Error)?.message || "");
  if (m === "media-too-large") return "حجم فایل بیش از حد مجاز است (عکس ۱۰ مگابایت، ویدئو ۵۰ مگابایت).";
  if (m === "invalid-media") return "فرمت فایل پشتیبانی نمی‌شود.";
  return null;
}

/** ذخیره فایل آپلودی؛ خروجی: مسیر عمومی یا "" */
export async function saveMedia(file: File | null): Promise<string> {
  if (!file || !file.size) return "";
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) throw new Error("invalid-media");
  const isVideo = file.type.startsWith("video/");
  if (file.size > (isVideo ? MAX_VIDEO : MAX_IMAGE)) throw new Error("media-too-large");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = Date.now().toString(36) + "-" + crypto.randomBytes(6).toString("hex") + ext;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return "/uploads/" + name;
}

/** فرم خبر مردمی (عمومی) */
export async function POST(req: Request) {
  if (isD1()) {
    return NextResponse.json(
      { ok: false, error: "ارسال خبر مردمی از طریق سایت اصلی انجام می‌شود.", redirect: `${prodOrigin()}/send-news` },
      { status: 307 }
    );
  }
  try {
    const form = await req.formData();
    const get = (k: string) => String(form.get(k) || "").trim();
    const name = get("name");
    const headline = get("headline");
    if (!name || !headline) {
      return NextResponse.json({ ok: false, error: "نام و تیتر خبر الزامی است." }, { status: 400 });
    }
    const phone = get("phone").replace(/\D/g, "").slice(0, 15);
    const mediaUrl = await saveMedia(form.get("mediaFile") as File | null);

    await db.citizenReport.create({
      data: {
        name: name.slice(0, 80),
        phone,
        location: get("location").slice(0, 120),
        headline: headline.slice(0, 200),
        details: get("details").slice(0, 5000),
        rewardCard: get("rewardCard").replace(/\D/g, "").slice(0, 16),
        mediaUrl,
        mediaType: (form.get("mediaFile") as File)?.type || "",
        mediaName: (form.get("mediaFile") as File)?.name || "",
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = mediaError(err);
    return NextResponse.json({ ok: false, error: msg || "خطای داخلی در ثبت گزارش." }, { status: 500 });
  }
}
