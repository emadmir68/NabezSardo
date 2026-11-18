import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isD1, prodOrigin } from "@/lib/mode";

export const ADMIN_COOKIE = "nabez_admin";
const USER = process.env.ADMIN_USER || "editor";
const PASS = process.env.ADMIN_PASS || "change-this";
const SECRET = process.env.SESSION_SECRET || "nabez-dev-secret-change";

function sign(v: string): string {
  return createHmac("sha256", SECRET).update(v).digest("hex");
}

export function makeToken(user: string): string {
  const v = `${user}:${Date.now()}`;
  return Buffer.from(v).toString("base64url") + "." + sign(v);
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [b, s] = token.split(".");
  if (!b || !s) return false;
  let v = "";
  try {
    v = Buffer.from(b, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const [user, ts] = v.split(":");
  if (user !== USER || !ts) return false;
  if (Date.now() - Number(ts) > 7 * 24 * 3600 * 1000) return false;
  const a = Buffer.from(s);
  const z = Buffer.from(sign(v));
  return a.length === z.length && timingSafeEqual(a, z);
}

export function checkCredentials(user: string, pass: string): boolean {
  const u = Buffer.from(String(user || ""));
  const p = Buffer.from(String(pass || ""));
  const eu = Buffer.from(USER);
  const ep = Buffer.from(PASS);
  const okU = u.length === eu.length && timingSafeEqual(u, eu);
  const okP = p.length === ep.length && timingSafeEqual(p, ep);
  return okU && okP;
}

/** server component guard */
export async function requireAdmin() {
  /* در حالت d1، مدیریت فقط از طریق سایت اصلی انجام می‌شود (تک‌منبعی داده) */
  if (isD1()) redirect(`${prodOrigin()}/admin/login`);
  const jar = await cookies();
  if (!verifyToken(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");
}

/** route handler guard */
export async function isAdminRequest(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(ADMIN_COOKIE)?.value);
}
