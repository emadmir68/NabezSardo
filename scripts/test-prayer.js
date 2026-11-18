/* تست منطق اوقات شرعی: پارس بادصبا + تطبیق تاریخ شمسی + اذان بعدی */
const fs = require("fs");

const FA_DIG = "۰۱۲۳۴۵۶۷۸۹";
const toAscii = (s) => s.replace(/[۰-۹]/g, (d) => String(FA_DIG.indexOf(d)));
const toFa = (s) => String(s || "").replace(/\d/g, (d) => FA_DIG[Number(d)]);

const html = fs.readFileSync("/tmp/badesaba.html", "utf8");

function parseBadesaba(html) {
  const months = new Map();
  let any = false;
  for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) =>
      toAscii(c[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim())
    );
    if (cells.length < 9) continue;
    const dm = cells[0].match(/(\d{1,2})\s+(\S+?)(?:\s+\d{4})?$/);
    const times = cells.slice(1, 9);
    if (!dm || !times.every((t) => /^\d{1,2}:\d{2}$/.test(t))) continue;
    const month = dm[2];
    if (!months.has(month)) months.set(month, new Map());
    months.get(month).set(Number(dm[1]), times);
    any = true;
  }
  return any ? months : null;
}

const data = parseBadesaba(html);
console.log("months parsed:", [...data.keys()]);
console.log("days in month:", [...data.entries()].map(([m, d]) => `${m}: ${d.size}`).join(", "));

function persianToday() {
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", timeZone: "Asia/Tehran" }).formatToParts(new Date());
  const day = Number(toAscii(parts.find((p) => p.type === "day")?.value ?? "0"));
  const month = (parts.find((p) => p.type === "month")?.value ?? "").replace(/\u200c/g, "");
  return { day, month };
}

const today = persianToday();
console.log("today (Persian):", today.day, today.month);
const monthDays = data?.get(today.month);
const times = monthDays?.get(today.day);
console.log("badesaba today:", times);
// انتظار: پنج‌شنبه ۲۸ آبان → 04:46, 06:07, 11:26, 14:24, 16:44, 17:02, 17:48, 22:45
const expected = ["04:46", "06:07", "11:26", "14:24", "16:44", "17:02", "17:48", "22:45"];
if (times && JSON.stringify(times) === JSON.stringify(expected)) console.log("MATCH ✓ (با جدول رسمی بادصبا)");
else console.log("MISMATCH! expected", expected);

// نمایش خروجی نهایی فارسی
if (times) {
  console.log("display:", times.map(toFa).join(" | "));
}
