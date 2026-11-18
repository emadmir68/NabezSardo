#!/usr/bin/env python3
"""جدا کردن توابع داده (سرور) از توابع کمکی (مشترک) در فایل‌های صفحه."""
import re, pathlib

DATA_FNS = ["getPublished", "getHomeArticles", "getArticle", "getRelated",
            "getCategoriesWithCounts", "getSettings", "bumpViews", "getStats"]

FILES = [
    "src/app/about/page.tsx",
    "src/app/admin/(panel)/articles/[id]/page.tsx",
    "src/app/admin/(panel)/articles/new/page.tsx",
    "src/app/admin/(panel)/page.tsx",
    "src/app/all-news/page.tsx",
    "src/app/api/view/route.ts",
    "src/app/category/[id]/page.tsx",
    "src/app/contact/page.tsx",
    "src/app/news/[slug]/page.tsx",
    "src/app/page.tsx",
    "src/app/send-news/page.tsx",
]

# الگوی بلوک import از "@/lib/nabz" (چندخطی یا تک‌خطی)
IMP = re.compile(
    r'import\s+(type\s+)?\{([^}]*)\}\s+from\s+"@/lib/nabz"\s*;?', re.S)

for f in FILES:
    p = pathlib.Path(f)
    src = p.read_text(encoding="utf-8")
    m = IMP.search(src)
    if not m:
        print(f, "— no nabz import (skip)")
        continue
    is_type = bool(m.group(1))
    names = [n.strip() for n in m.group(2).split(",") if n.strip()]
    data_names, shared_names, type_names = [], [], []
    for n in names:
        clean = n.replace("type ", "").strip()
        if clean in DATA_FNS:
            data_names.append(clean)
        else:
            shared_names.append(clean)

    parts = []
    if shared_names:
        parts.append('import { %s } from "@/lib/nabz";' % ", ".join(shared_names))
    if data_names:
        parts.append('import { %s } from "@/lib/nabz-data";' % ", ".join(data_names))

    replacement = "\n".join(parts)
    src = src[:m.start()] + replacement + src[m.end():]
    p.write_text(src, encoding="utf-8")
    print(f, "— shared:", len(shared_names), "data:", len(data_names))
