"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Save, X, CheckCircle2, XCircle, Eye, Trash2 } from "lucide-react";
import Link from "next/link";

type Cat = { id: string; name: string };
type ArticleData = {
  id: string; title: string; slug: string; categoryId: string; lead: string;
  author: string; location: string; image: string; featured: boolean; status: string; body: string;
};

const inputCls =
  "h-12 w-full rounded-xl border bg-[rgba(232,198,117,0.04)] px-4 text-[0.9rem] text-[color:var(--nz-cream)] outline-none transition-colors placeholder:text-[color:var(--nz-muted)] focus:border-[color:var(--nz-gold-deep)]";
const labelCls = "mb-2 block text-[0.8rem] font-semibold text-[color:var(--nz-cream)]";

export function EditorForm({ cats, article }: { cats: Cat[]; article?: ArticleData }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [form, setForm] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    categoryId: article?.categoryId || cats[0]?.id || "",
    lead: article?.lead || "",
    author: article?.author || "تحریریه نبض ساردو",
    location: article?.location || "ساردوئیه",
    image: article?.image || "",
    featured: article?.featured || false,
    status: article?.status || "draft",
    body: article?.body || "",
  });

  async function uploadImage(file: File) {
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.ok) setForm((f) => ({ ...f, image: data.url }));
      else setResult({ ok: false, msg: data.error || "آپلود ناموفق بود." });
    } catch {
      setResult({ ok: false, msg: "خطای شبکه در آپلود." });
    } finally {
      setUploading(false);
    }
  }

  async function save(publish?: boolean) {
    setBusy(true);
    setResult(null);
    const status = publish === true ? "published" : publish === false ? "draft" : form.status;
    try {
      const payload = { ...form, status, id: article?.id };
      const res = await fetch("/api/admin/articles", {
        method: article ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ ok: true, msg: publish === undefined ? "تغییرات ذخیره شد." : status === "published" ? "خبر منتشر شد." : "به پیش‌نویس برگشت." });
        setForm((f) => ({ ...f, status }));
        if (!article && data.id) router.push(`/admin/articles/${data.id}`);
        router.refresh();
      } else {
        setResult({ ok: false, msg: data.error || "ذخیره ناموفق بود." });
      }
    } catch {
      setResult({ ok: false, msg: "خطای شبکه در ذخیره." });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!article || !confirm(`حذف «${form.title}»؟`)) return;
    setBusy(true);
    await fetch(`/api/admin/articles/${article.id}`, { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="grid grid-cols-1 gap-5 lg:grid-cols-3"
    >
      <div className="space-y-5 lg:col-span-2">
        <div className="rounded-[18px] border p-5" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
          <label className="block">
            <span className={labelCls}>عنوان خبر *</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className={inputCls}
              placeholder="عنوان کامل خبر"
            />
          </label>
          <label className="mt-4 block">
            <span className={labelCls}>لید (خلاصه ابتدای خبر)</span>
            <textarea
              value={form.lead}
              onChange={(e) => setForm({ ...form, lead: e.target.value })}
              rows={2}
              className="w-full rounded-xl border bg-[rgba(232,198,117,0.04)] px-4 py-3 text-[0.88rem] leading-8 text-[color:var(--nz-cream)] outline-none focus:border-[color:var(--nz-gold-deep)]"
              style={{ borderColor: "var(--nz-line)" }}
              placeholder="یک تا دو جمله خلاصه خبر"
            />
          </label>
          <label className="mt-4 block">
            <span className={labelCls}>متن خبر *</span>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={14}
              required={!article}
              className="w-full rounded-xl border bg-[rgba(232,198,117,0.04)] px-4 py-3.5 text-[0.92rem] leading-9 text-[color:var(--nz-cream)] outline-none focus:border-[color:var(--nz-gold-deep)]"
              style={{ borderColor: "var(--nz-line)" }}
              placeholder={"خط اول خبر…\n\n## زیرعنوان بخش دوم\n\nادامه متن…\n\n> نقل‌قول فردی که در خبر نقش دارد"}
            />
          </label>
          <p className="mt-3 text-[0.72rem] leading-6 text-[color:var(--nz-muted)]">
            راهنما: خط خالی = پاراگراف جدید · «## متن» = زیرتیتر · «{"<"} متن{" >"}» = نقل‌قول
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* وضعیت انتشار */}
        <div className="rounded-[18px] border p-5" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
          <h3 className="nz-display mb-4 text-[0.9rem] font-bold text-[color:var(--nz-cream)]">انتشار</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { v: "draft", t: "پیش‌نویس" },
              { v: "published", t: "منتشرشده" },
            ].map((s) => (
              <button
                key={s.v}
                type="button"
                onClick={() => setForm({ ...form, status: s.v })}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[0.78rem] font-semibold ${
                  form.status === s.v
                    ? s.v === "published"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                    : "border text-[color:var(--nz-muted)]"
                }`}
                style={form.status === s.v ? {} : { borderColor: "var(--nz-line)" }}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${s.v === "published" ? "bg-emerald-400" : "bg-amber-400"}`} aria-hidden />
                {s.t}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="h-5 w-5 accent-[color:var(--nz-gold)]"
            />
            <span className="text-[0.82rem] text-[color:var(--nz-cream)]">نمایش به‌عنوان خبر اصلی صفحه اول</span>
          </label>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button type="submit" disabled={busy} className="nz-btn-gold inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[0.85rem] disabled:opacity-60">
              {busy ? <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              {busy ? "…" : "ذخیره"}
            </button>
            {article && (
              <Link
                href={`/news/${encodeURIComponent(article.slug)}`}
                target="_blank"
                className="nz-btn-ghost inline-flex h-11 items-center gap-2 rounded-full px-5 text-[0.82rem]"
                title="مشاهده در سایت"
              >
                <Eye className="h-4 w-4" aria-hidden />
              </Link>
            )}
            {article && (
              <button
                type="button"
                onClick={remove}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-red-500/25 px-4 text-[0.82rem] text-red-300 hover:bg-red-500/10"
                title="حذف خبر"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => save(form.status === "published" ? false : true)}
            className="mt-2.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border text-[0.82rem] text-[color:var(--nz-cream)] disabled:opacity-60"
            style={{ borderColor: "var(--nz-line)" }}
          >
            {form.status === "published" ? "تبدیل به پیش‌نویس" : "انتشار فوری"}
          </button>
          {result && (
            <p
              role="alert"
              className={`mt-4 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[0.78rem] ${result.ok ? "text-emerald-300" : "text-red-300"}`}
              style={{ borderColor: result.ok ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)", background: result.ok ? "rgba(52,211,153,0.07)" : "rgba(248,113,113,0.07)" }}
            >
              {result.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden /> : <XCircle className="h-4 w-4 shrink-0" aria-hidden />}
              {result.msg}
            </p>
          )}
        </div>

        {/* دسته و متادیتا */}
        <div className="rounded-[18px] border p-5" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
          <h3 className="nz-display mb-4 text-[0.9rem] font-bold text-[color:var(--nz-cream)]">دسته‌بندی و مشخصات</h3>
          <label className="block">
            <span className={labelCls}>دسته *</span>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className={`${inputCls} appearance-none`}
            >
              {cats.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#12151c]">
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block">
            <span className={labelCls}>نویسنده</span>
            <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className={inputCls} />
          </label>
          <label className="mt-4 block">
            <span className={labelCls}>مکان</span>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} />
          </label>
          <label className="mt-4 block">
            <span className={labelCls}>
              اسلاگ <span className="font-normal text-[color:var(--nz-muted)]">(آدرس خبر)</span>
            </span>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              dir="ltr"
              className={`${inputCls} text-end`}
              placeholder="از عنوان ساخته می‌شود"
            />
          </label>
        </div>

        {/* تصویر شاخص */}
        <div className="rounded-[18px] border p-5" style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
          <h3 className="nz-display mb-4 text-[0.9rem] font-bold text-[color:var(--nz-cream)]">تصویر شاخص</h3>
          {form.image ? (
            <div className="relative overflow-hidden rounded-xl border" style={{ borderColor: "var(--nz-line)" }}>
              { }
              <img src={form.image} alt="تصویر شاخص" className="aspect-[16/9] w-full object-cover" />
              <button
                type="button"
                onClick={() => setForm({ ...form, image: "" })}
                className="absolute end-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-black/60 text-white backdrop-blur"
                title="حذف تصویر"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed py-9 transition-colors hover:border-[color:var(--nz-gold-deep)] disabled:opacity-60"
              style={{ borderColor: "var(--nz-gold-deep)", background: "rgba(232,198,117,0.03)" }}
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-[color:var(--nz-gold)]" aria-hidden /> : <ImagePlus className="h-6 w-6 text-[color:var(--nz-gold)]" aria-hidden />}
              <span className="text-[0.8rem] text-[color:var(--nz-muted)]">{uploading ? "در حال آپلود…" : "انتخاب تصویر (حداکثر ۱۰ مگابایت)"}</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImage(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </form>
  );
}
