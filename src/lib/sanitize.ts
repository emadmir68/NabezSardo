/** تبدیل متن ساده به HTML امن (پاراگراف، h2 برای «## »، نقل‌قول برای «> ») */
export function textToRich(input = ""): { html: string; plain: string } {
  const esc = (s: string) =>
    s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c));
  const lines = String(input).replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) {
      blocks.push(`<p>${esc(buf.join(" "))}</p>`);
      buf = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push(`<h2>${esc(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("> ")) {
      flush();
      blocks.push(`<blockquote>${esc(line.slice(2))}</blockquote>`);
      continue;
    }
    buf.push(line);
  }
  flush();
  const html = blocks.join("\n") || `<p>${esc(String(input).trim())}</p>`;
  const plain = String(input).trim();
  return { html, plain };
}

/** پاک‌سازی HTML ذخیره‌شده (تگ‌های مجاز محدود) */
export function sanitizeRich(input = ""): string {
  let h = String(input).slice(0, 400000);
  h = h.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|iframe|object|embed|form|input|button|svg|math)[^>]*>[\s\S]*?<\/\1>/gi, "");
  const allowed = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "blockquote", "h2", "h3", "span", "div"]);
  h = h.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (m, tag: string, attrs: string) => {
    const t = tag.toLowerCase();
    if (!allowed.has(t)) return "";
    if (m.startsWith("</")) return `</${t}>`;
    const out: string[] = [];
    const dir = attrs.match(/\bdir\s*=\s*["']?(rtl|ltr)["']?/i);
    if (dir) out.push(`dir="${dir[1].toLowerCase()}"`);
    return `<${t}${out.length ? " " + out.join(" ") : ""}>`;
  });
  return h.replace(/\son[a-z]+\s*=\s*["'][^"']*["']/gi, "").replace(/javascript:/gi, "");
}

export function plainFromRich(h = ""): string {
  return String(h)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/** اسلاگ فارسی (هماهنگ با سایت فعلی) */
export function slugify(v = ""): string {
  const s = String(v)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || Date.now().toString(36);
}
