/* ——— حالت داده: sqlite (توسعهٔ محلی) یا d1 (خواندن مستقیم از دیتابیس production روی Cloudflare) ——— */

export function isD1(): boolean {
  return process.env.DATA_MODE === "d1";
}

export function prodOrigin(): string {
  return String(process.env.PROD_ORIGIN || "https://nabzesardo.ir").replace(/\/+$/, "");
}
