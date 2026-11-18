/* تست یکپارچهٔ resolveImage در حالت d1 — بازسازی واقعی دادهٔ production:
   اسلاگ‌های واقعی + کاورهای خودکار SVG + عکس‌های آپلودی نامرتبط */
process.env.DATA_MODE = "d1";
process.env.D1_FIXTURE = "/home/z/my-project/db/resolve-test.json";

import fs from "node:fs";

/* fixture با ساختار production: مقالات با اسلاگ و عکس واقعی سایت زنده */
const cats = [
  { id: "social", name: "اجتماعی" },
  { id: "city-village", name: "شهر و روستا" },
  { id: "culture", name: "فرهنگی" },
  { id: "incidents", name: "حوادث" },
];
const arts = [
  /* عکس آپلودی = کاور خودکار SVG → باید کارت AI بیاید (FORCE) */
  { id: "1", slug: "امام-جمعه-کرمان-دشمنی-آمریکا-با-ایران-با-تغییر-دولتها-پایان-نمییابد", title: "امام جمعه کرمان", categoryId: "city-village", status: "published", image: "/uploads/auto-cover-a09525562e90aa96.svg", publishedAt: 1794993526648, createdAt: 1794993526648 },
  /* عکس آپلودی واقعی ولی نامرتبط → FORCE کارت AI */
  { id: "2", slug: "نشست-فعالان-اقتصادی-رفسنجان-با-اعضای-کمیسیون-اقتصادی-مجلس-برگزار-شد", title: "نشست اقتصادی رفسنجان", categoryId: "city-village", status: "published", image: "/uploads/featured-mufsss41-1b70f66e9f05.png", publishedAt: 1790266664777, createdAt: 1790266664777 },
  { id: "3", slug: "فردا-عزای-عمومی-اعلام-شد", title: "فردا عزای عمومی اعلام شد", categoryId: "social", status: "published", image: "/uploads/featured-mwcfki85-708b127438ce.jpg", publishedAt: 1794945151717, createdAt: 1794945151717 },
  /* کاور خودکار → کارت AI از نقشه */
  { id: "4", slug: "صادق-نیکنفس،-شاعر-حمایت-مسئولان-از-هنرمندان-جنوب-کرمان-نیازمند-تقویت-است", title: "شاعر جنوب کرمان", categoryId: "culture", status: "published", image: "/uploads/auto-cover-5159cc110e621358.svg", publishedAt: 1794900000000, createdAt: 1794900000000 },
  { id: "5", slug: "شهید-علی-دادگستر-از-شهدای-سرافراز-جیرفت", title: "شهید دادگستر", categoryId: "social", status: "published", image: "/uploads/auto-cover-f3f5353f7fdb5566.svg", publishedAt: 1794800000000, createdAt: 1794800000000 },
  { id: "6", slug: "سعید-افروز-آکادمی-تخصصی-دوومیدانی-در-جیرفت-راهاندازی-میکنم", title: "آکادمی دوومیدانی", categoryId: "social", status: "published", image: "/uploads/auto-cover-16e7da8868691677.svg", publishedAt: 1794700000000, createdAt: 1794700000000 },
  { id: "7", slug: "اجرای-سیستم-آبیاری-قطرهای-در-بلوارهای-جیرفت", title: "آبیاری قطرهای", categoryId: "city-village", status: "published", image: "/uploads/auto-cover-4af52e684f360ec8.svg", publishedAt: 1794600000000, createdAt: 1794600000000 },
  /* عکس واقعی مرتبط → باید حفظ شود */
  { id: "8", slug: "امام-جمعهای-که-خود-پیشقدم-دیدار-با-مردم-میشود", title: "امام جمعه‌ای پیش‌قدم", categoryId: "city-village", status: "published", image: "/uploads/featured-mwguxfkm-b6d1099d69e1.jpg", publishedAt: 1794500000000, createdAt: 1794500000000 },
  /* بدون هیچ عکسی، بدون کارت AI → خالی (کاور دسته در UI) */
  { id: "9", slug: "خبر-قدیمی-بدون-عکس", title: "خبر بدون عکس", categoryId: "incidents", status: "published", image: "", publishedAt: 1794400000000, createdAt: 1794400000000 },
  /* پیش‌نویس → حذف از خروجی */
  { id: "10", slug: "پیشنویس", title: "draft", categoryId: "social", status: "draft", image: "", publishedAt: 1794300000000, createdAt: 1794300000000 },
];
fs.writeFileSync("/home/z/my-project/db/resolve-test.json", JSON.stringify({ settings: {}, categories: cats, articles: arts }));

async function main() {
  const { d1Repo } = await import("../src/lib/nabz-d1.ts");
  const list = await d1Repo.getPublished();
  const checks = [
    ["1", "/images/news-flag.png", "امام جمعه کرمان → پرچم جمهوری اسلامی"],
    ["2", "/images/news-economy.png", "نشست اقتصادی رفسنجان → نشست ایرانی"],
    ["3", "/images/news-mourning.png", "عزای عمومی → حال‌وهوای عزا"],
    ["4", "/images/news-poet.png", "شاعر → کارت AI"],
    ["5", "/images/news-martyr.png", "شهید دادگستر → کارت جدید"],
    ["6", "/images/news-athletics.png", "دوومیدانی → کارت جدید"],
    ["7", "/images/news-irrigation.png", "آبیاری قطرهای → کارت جدید"],
    ["8", "https://nabzesardo.ir/uploads/featured-mwguxfkm-b6d1099d69e1.jpg", "عکس واقعی مرتبط حفظ شود"],
    ["9", "", "بدون عکس → خالی"],
  ];
  let pass = 0;
  for (const [id, want, label] of checks) {
    const a = list.find((x) => x.id === id);
    const got = a ? a.image : "(missing)";
    const ok = got === want;
    if (ok) pass++;
    console.log(`${ok ? "PASS" : "FAIL"} | ${label} | got: ${got}`);
  }
  console.log(`\n${pass}/${checks.length} passed; total published: ${list.length} (expect 9)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
