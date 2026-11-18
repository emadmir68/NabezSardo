"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Users,
  Mail,
  Settings2,
  Eye,
  Trash2,
  CheckCircle2,
  Archive,
  Loader2,
  Pencil,
  Megaphone,
  Save,
  Inbox,
} from "lucide-react";

type ArticleRow = {
  id: string; title: string; slug: string; categoryId: string; categoryName: string;
  status: string; featured: boolean; views: number; image: string; updatedAt: string;
};
type CitizenRow = {
  id: string; name: string; phone: string; location: string; headline: string;
  details: string; mediaUrl: string; status: string; createdAt: string;
};
type ContactRow = {
  id: string; name: string; contact: string; subject: string; message: string;
  read: boolean; createdAt: string;
};
type Props = {
  articles: ArticleRow[];
  cats: { id: string; name: string }[];
  stats: { total: number; today: number; newCitizens: number; unreadContacts: number; views: number };
  settings: { breakingText: string; adEnabled: string; adTitle: string; adText: string; adLink: string };
  citizens: CitizenRow[];
  contacts: ContactRow[];
};

const fa = (v: number | string) => Number(v || 0).toLocaleString("fa-IR");
const faDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return "";
  }
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[18px] border p-5 ${className}`} style={{ borderColor: "var(--nz-line)", background: "var(--nz-ink-2)" }}>
      {children}
    </div>
  );
}

export function DashboardTabs({ articles, cats, stats, settings, citizens, contacts }: Props) {
  const [tab, setTab] = useState<"articles" | "citizens" | "contacts" | "settings">("articles");
  const [q, setQ] = useState("");
  const tabs = [
    { key: "articles" as const, label: "خبرها", icon: FileText, badge: articles.length },
    { key: "citizens" as const, label: "خبرهای مردمی", icon: Users, badge: stats.newCitizens },
    { key: "contacts" as const, label: "پیام‌ها", icon: Mail, badge: stats.unreadContacts },
    { key: "settings" as const, label: "تنظیمات", icon: Settings2, badge: 0 },
  ];

  return (
    <div>
      {/* آمار */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: FileText, v: fa(stats.total), s: "خبر منتشرشده", sub: `${fa(stats.today)} در ۲۴ ساعت اخیر` },
          { icon: Eye, v: fa(stats.views), s: "مجموع بازدید", sub: "همه گزارش‌ها" },
          { icon: Users, v: fa(stats.newCitizens), s: "خبر مردمی جدید", sub: "در انتظار بررسی" },
          { icon: Mail, v: fa(stats.unreadContacts), s: "پیام خوانده‌نشده", sub: "از فرم تماس" },
        ].map((r) => (
          <Card key={r.s}>
            <div className="flex items-center gap-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border" style={{ borderColor: "var(--nz-line)", background: "rgba(232,198,117,0.06)" }}>
                <r.icon className="h-[18px] w-[18px] text-[color:var(--nz-gold)]" aria-hidden />
              </span>
              <span>
                <span className="nz-display block text-[1.25rem] font-black text-[color:var(--nz-cream)]">{r.v}</span>
                <span className="block text-[0.72rem] text-[color:var(--nz-muted)]">{r.s} · {r.sub}</span>
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* تب‌ها */}
      <div className="nz-scrollx mt-7 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-5 text-[0.82rem] transition-colors ${
              tab === t.key
                ? "bg-[color:var(--nz-gold)] font-bold text-[#12100a]"
                : "border text-[color:var(--nz-muted)] hover:text-[color:var(--nz-cream)]"
            }`}
            style={tab === t.key ? {} : { borderColor: "var(--nz-line)" }}
          >
            <t.icon className="h-4 w-4" aria-hidden />
            {t.label}
            {t.badge > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[0.68rem] ${tab === t.key ? "bg-black/20" : "bg-[color:var(--nz-red)]/90 text-white"}`}>
                {fa(t.badge)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "articles" && <ArticlesTab articles={articles} cats={cats} q={q} setQ={setQ} />}
        {tab === "citizens" && <CitizensTab rows={citizens} />}
        {tab === "contacts" && <ContactsTab rows={contacts} />}
        {tab === "settings" && <SettingsTab settings={settings} />}
      </div>
    </div>
  );
}

/* ——— تب خبرها ——— */
function ArticlesTab({ articles, cats, q, setQ }: { articles: ArticleRow[]; cats: { id: string; name: string }[]; q: string; setQ: (v: string) => void }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const rows = useMemo(
    () => articles.filter((a) => !q.trim() || a.title.includes(q.trim()) || a.categoryName.includes(q.trim())),
    [articles, q]
  );

  async function toggle(a: ArticleRow) {
    setBusyId(a.id);
    await fetch(`/api/admin/articles/${a.id}`, { method: "PATCH" });
    setBusyId("");
    router.refresh();
  }
  async function del(a: ArticleRow) {
    if (!confirm(`حذف «${a.title}»؟ این عمل بازگشت‌پذیر نیست.`)) return;
    setBusyId(a.id);
    await fetch(`/api/admin/articles/${a.id}`, { method: "DELETE" });
    setBusyId("");
    router.refresh();
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: "var(--nz-line-soft)" }}>
        <h2 className="nz-display text-[0.95rem] font-bold text-[color:var(--nz-cream)]">مدیریت خبرها</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجو در عنوان‌ها…"
          className="h-10 w-full max-w-xs rounded-full border bg-[rgba(232,198,117,0.04)] px-4 text-[0.82rem] text-[color:var(--nz-cream)] outline-none placeholder:text-[color:var(--nz-muted)] focus:border-[color:var(--nz-gold-deep)] sm:w-auto"
          style={{ borderColor: "var(--nz-line)" }}
        />
      </div>
      <div className="max-h-[560px] overflow-y-auto">
        <table className="w-full text-start text-[0.82rem]">
          <thead className="sticky top-0" style={{ background: "var(--nz-ink-3)" }}>
            <tr className="text-[color:var(--nz-muted)]">
              <th className="px-4 py-3 text-start font-semibold">عنوان</th>
              <th className="hidden px-3 py-3 text-start font-semibold md:table-cell">دسته</th>
              <th className="hidden px-3 py-3 text-start font-semibold sm:table-cell">بازدید</th>
              <th className="px-3 py-3 text-start font-semibold">وضعیت</th>
              <th className="px-4 py-3 text-start font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t transition-colors hover:bg-[rgba(232,198,117,0.03)]" style={{ borderColor: "var(--nz-line-soft)" }}>
                <td className="max-w-[280px] px-4 py-3">
                  <Link href={`/admin/articles/${a.id}`} className="line-clamp-2 font-semibold leading-6 text-[color:var(--nz-cream)] hover:text-[color:var(--nz-gold)]">
                    {a.title}
                  </Link>
                  <span className="mt-1 block text-[0.7rem] text-[color:var(--nz-muted)]">{faDate(a.updatedAt)}</span>
                </td>
                <td className="hidden px-3 py-3 text-[color:var(--nz-muted)] md:table-cell">{a.categoryName}</td>
                <td className="hidden px-3 py-3 tabular-nums text-[color:var(--nz-muted)] sm:table-cell">{fa(a.views)}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(a)}
                    disabled={busyId === a.id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.72rem] font-semibold ${
                      a.status === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                    }`}
                    title={a.status === "published" ? "تبدیل به پیش‌نویس" : "انتشار"}
                  >
                    {busyId === a.id ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <span className={`h-1.5 w-1.5 rounded-full ${a.status === "published" ? "bg-emerald-400" : "bg-amber-400"}`} aria-hidden />}
                    {a.status === "published" ? "منتشرشده" : "پیش‌نویس"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="grid h-8 w-8 place-items-center rounded-lg border text-[color:var(--nz-muted)] transition-colors hover:text-[color:var(--nz-gold)]"
                      style={{ borderColor: "var(--nz-line)" }}
                      title="ویرایش"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                    <button
                      type="button"
                      onClick={() => del(a)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-red-500/25 text-red-300/80 transition-colors hover:bg-red-500/10"
                      title="حذف"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[color:var(--nz-muted)]">خبری یافت نشد.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ——— تب خبرهای مردمی ——— */
function CitizensTab({ rows }: { rows: CitizenRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    await fetch(`/api/admin/citizens/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId("");
    router.refresh();
  }
  async function del(id: string) {
    if (!confirm("حذف این گزارش مردمی؟")) return;
    setBusyId(id);
    await fetch(`/api/admin/citizens/${id}`, { method: "DELETE" });
    setBusyId("");
    router.refresh();
  }

  const badge = (s: string) =>
    s === "new"
      ? { t: "جدید", c: "bg-[color:var(--nz-red)]/90 text-white" }
      : s === "reviewed"
        ? { t: "بررسی‌شده", c: "bg-emerald-500/15 text-emerald-300" }
        : { t: "بایگانی", c: "bg-white/10 text-[color:var(--nz-muted)]" };

  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <Card className="text-center">
          <Inbox className="mx-auto h-9 w-9 text-[color:var(--nz-gold-deep)]" aria-hidden />
          <p className="mt-3 text-[0.85rem] text-[color:var(--nz-muted)]">هنوز گزارش مردمی ثبت نشده است.</p>
        </Card>
      )}
      {rows.map((c) => {
        const b = badge(c.status);
        return (
          <Card key={c.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold ${b.c}`}>{b.t}</span>
                  <h3 className="nz-display text-[0.92rem] font-bold leading-7 text-[color:var(--nz-cream)]">{c.headline}</h3>
                </div>
                {c.details && <p className="mt-2 line-clamp-3 text-[0.8rem] leading-7 text-[color:var(--nz-muted)]">{c.details}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.72rem] text-[color:var(--nz-muted)]">
                  <span>از: {c.name}</span>
                  {c.phone && <span dir="ltr">{c.phone}</span>}
                  {c.location && <span>مکان: {c.location}</span>}
                  <span>{faDate(c.createdAt)}</span>
                </div>
                {c.mediaUrl && (
                  <a href={c.mediaUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-[0.75rem] text-[color:var(--nz-gold)] hover:underline">
                    مشاهده رسانه پیوست — {c.mediaUrl.startsWith("/uploads") ? "فایل" : ""}
                  </a>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {c.status === "new" && (
                  <button type="button" onClick={() => setStatus(c.id, "reviewed")} disabled={busyId === c.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 text-[0.75rem] font-semibold text-emerald-300" title="علامت‌گذاری بررسی‌شده">
                    {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
                    بررسی شد
                  </button>
                )}
                <button type="button" onClick={() => setStatus(c.id, "archived")} disabled={busyId === c.id}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[0.75rem] text-[color:var(--nz-muted)]" style={{ borderColor: "var(--nz-line)" }} title="بایگانی">
                  <Archive className="h-3.5 w-3.5" aria-hidden />
                  بایگانی
                </button>
                <button type="button" onClick={() => del(c.id)} disabled={busyId === c.id}
                  className="grid h-9 w-9 place-items-center rounded-full border border-red-500/25 text-red-300/80 hover:bg-red-500/10" title="حذف">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ——— تب پیام‌ها ——— */
function ContactsTab({ rows }: { rows: ContactRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");

  async function toggleRead(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/contacts/${id}`, { method: "PATCH" });
    setBusyId("");
    router.refresh();
  }
  async function del(id: string) {
    if (!confirm("حذف این پیام؟")) return;
    setBusyId(id);
    await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
    setBusyId("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <Card className="text-center">
          <Inbox className="mx-auto h-9 w-9 text-[color:var(--nz-gold-deep)]" aria-hidden />
          <p className="mt-3 text-[0.85rem] text-[color:var(--nz-muted)]">پیامی ثبت نشده است.</p>
        </Card>
      )}
      {rows.map((c) => (
        <Card key={c.id} className={c.read ? "opacity-75" : ""}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                {!c.read && <span className="h-2 w-2 rounded-full bg-[color:var(--nz-red)]" aria-hidden />}
                <h3 className="nz-display text-[0.9rem] font-bold text-[color:var(--nz-cream)]">{c.subject || "بدون موضوع"}</h3>
              </div>
              <p className="mt-2 whitespace-pre-line text-[0.8rem] leading-7 text-[color:var(--nz-muted)]">{c.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.72rem] text-[color:var(--nz-muted)]">
                <span>از: {c.name}</span>
                <span dir="ltr">{c.contact}</span>
                <span>{faDate(c.createdAt)}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" onClick={() => toggleRead(c.id)} disabled={busyId === c.id}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[0.75rem] text-[color:var(--nz-muted)]" style={{ borderColor: "var(--nz-line)" }}>
                {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
                {c.read ? "خوانده‌نشده" : "خوانده شد"}
              </button>
              <button type="button" onClick={() => del(c.id)} disabled={busyId === c.id}
                className="grid h-9 w-9 place-items-center rounded-full border border-red-500/25 text-red-300/80 hover:bg-red-500/10" title="حذف">
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ——— تب تنظیمات ——— */
function SettingsTab({ settings }: { settings: Props["settings"] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [form, setForm] = useState(settings);

  async function save() {
    setBusy(true);
    setSaved("");
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setSaved("تنظیمات ذخیره شد ✓");
    router.refresh();
    setTimeout(() => setSaved(""), 2500);
  }

  const inputCls =
    "h-12 w-full rounded-xl border bg-[rgba(232,198,117,0.04)] px-4 text-[0.9rem] text-[color:var(--nz-cream)] outline-none transition-colors focus:border-[color:var(--nz-gold-deep)]";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <Megaphone className="h-5 w-5 text-[color:var(--nz-gold)]" aria-hidden />
          <h2 className="nz-display text-[0.95rem] font-bold text-[color:var(--nz-cream)]">نوار خبر فوری</h2>
        </div>
        <label className="block">
          <span className="mb-2 block text-[0.78rem] font-semibold text-[color:var(--nz-cream)]">متن نوار فوری (صفحه اصلی)</span>
          <textarea
            value={form.breakingText}
            onChange={(e) => setForm({ ...form, breakingText: e.target.value })}
            rows={3}
            className="w-full rounded-xl border bg-[rgba(232,198,117,0.04)] px-4 py-3 text-[0.88rem] leading-8 text-[color:var(--nz-cream)] outline-none focus:border-[color:var(--nz-gold-deep)]"
            style={{ borderColor: "var(--nz-line)" }}
          />
        </label>
        <p className="mt-3 text-[0.72rem] leading-6 text-[color:var(--nz-muted)]">
          علاوه بر این متن، ۵ تیتر آخر به‌صورت خودکار در نوار فوری می‌چرخد.
        </p>
      </Card>

      <Card>
        <div className="mb-5 flex items-center gap-3">
          <Megaphone className="h-5 w-5 text-[color:var(--nz-gold)]" aria-hidden />
          <h2 className="nz-display text-[0.95rem] font-bold text-[color:var(--nz-cream)]">جایگاه تبلیغات</h2>
        </div>
        <label className="mb-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.adEnabled === "1"}
            onChange={(e) => setForm({ ...form, adEnabled: e.target.checked ? "1" : "" })}
            className="h-5 w-5 accent-[color:var(--nz-gold)]"
          />
          <span className="text-[0.82rem] text-[color:var(--nz-cream)]">نمایش جایگاه تبلیغات در صفحه اصلی</span>
        </label>
        <label className="mb-4 block">
          <span className="mb-2 block text-[0.78rem] font-semibold text-[color:var(--nz-cream)]">عنوان</span>
          <input value={form.adTitle} onChange={(e) => setForm({ ...form, adTitle: e.target.value })} className={inputCls} />
        </label>
        <label className="mb-4 block">
          <span className="mb-2 block text-[0.78rem] font-semibold text-[color:var(--nz-cream)]">متن</span>
          <input value={form.adText} onChange={(e) => setForm({ ...form, adText: e.target.value })} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-2 block text-[0.78rem] font-semibold text-[color:var(--nz-cream)]">لینک</span>
          <input value={form.adLink} onChange={(e) => setForm({ ...form, adLink: e.target.value })} dir="ltr" className={`${inputCls} text-end`} />
        </label>
      </Card>

      <div className="flex items-center gap-4 lg:col-span-2">
        <button type="button" onClick={save} disabled={busy} className="nz-btn-gold inline-flex h-12 items-center gap-2.5 rounded-full px-8 text-[0.9rem] disabled:opacity-60">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {busy ? "در حال ذخیره…" : "ذخیره تنظیمات"}
        </button>
        {saved && <span className="text-[0.82rem] text-emerald-300">{saved}</span>}
      </div>
    </div>
  );
}
