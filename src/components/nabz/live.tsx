"use client";

import { useSyncExternalStore } from "react";

const BUCKET_MS = 30_000;

function subscribe(onChange: () => void) {
  const t = setInterval(onChange, BUCKET_MS);
  return () => clearInterval(t);
}

function getSnapshot() {
  return Math.floor(Date.now() / BUCKET_MS);
}

function getServerSnapshot() {
  return 0;
}

export function LiveClock() {
  const bucket = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (bucket === 0) {
    return <span className="tabular-nums">—</span>;
  }

  const now = new Date(bucket * BUCKET_MS);
  const date = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Tehran",
  }).format(now);
  const time = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tehran",
  }).format(now);

  return (
    <span className="inline-flex items-center gap-2 text-[0.82rem] text-[color:var(--nz-muted)]">
      {date}
      <span aria-hidden className="h-1 w-1 rounded-full bg-[color:var(--nz-gold-deep)]" />
      <span className="tabular-nums">{time}</span>
    </span>
  );
}

/* ——— شمارش معکوس تا اذان بعدی (هر ۳۰ ثانیه به‌روز می‌شود) ——— */
function faDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const fa = (v: number) => v.toLocaleString("fa-IR");
  if (h >= 1) return `${fa(h)} ساعت و ${fa(m)} دقیقه مانده`;
  if (m >= 1) return `${fa(m)} دقیقه مانده`;
  return "لحظاتی دیگر";
}

export function PrayerCountdown({ at }: { at: string }) {
  const bucket = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (bucket === 0) {
    return <span className="tabular-nums">—</span>;
  }

  const remaining = new Date(at).getTime() - bucket * BUCKET_MS;
  return <span className="tabular-nums">{faDuration(remaining)}</span>;
}
