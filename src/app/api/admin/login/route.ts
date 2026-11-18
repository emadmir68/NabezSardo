import { NextResponse } from "next/server";
import { checkCredentials, makeToken, ADMIN_COOKIE } from "@/lib/auth";
import { isD1, prodOrigin } from "@/lib/mode";

export async function POST(req: Request) {
  if (isD1()) {
    return NextResponse.json(
      { ok: false, error: "ورود تحریریه از طریق سایت اصلی انجام می‌شود.", redirect: `${prodOrigin()}/admin/login` },
      { status: 307 }
    );
  }
  try {
    const { username, password } = await req.json();
    if (!checkCredentials(String(username || ""), String(password || ""))) {
      return NextResponse.json({ ok: false, error: "نام کاربری یا گذرواژه نادرست است." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, makeToken(String(username)), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر است." }, { status: 400 });
  }
}
