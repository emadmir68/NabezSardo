#!/usr/bin/env python3
"""Nabz Sardo v2 — update article images + re-feature appropriate lead story.

- Hero/featured: the Imam-Jum'ah photo must NOT be the site hero.
  -> feature the local weather alert story instead (dramatic, locally relevant).
- Every article gets a proper AI-generated editorial image (no real-person photos).
"""
import sqlite3
import sys

DB = "/home/z/my-project/db/custom.db"

# (title prefix, new image)
IMAGES = [
    ("هشدار زرد", "/images/news-storm.png"),
    ("امام جمعه‌ای که خود پیش‌قدم", "/images/news-mosque.png"),
    ("صادق نیک‌نفس", "/images/news-poet.png"),
    ("اقبال واحدی", "/images/news-dates.png"),
    ("پیشرفت ۹۵ درصدی", "/images/news-health.png"),
    ("امام جمعه کرمان", "/images/news-flag.png"),
    ("سپاه پاسداران", "/images/news-radar.png"),
    ("انهدام باند", "/images/news-police.png"),
    ("درخشش دانش‌آموزان", "/images/news-students.png"),
    ("عزای عمومی", "/images/news-mourning.png"),
    ("توقیف اتوبوس", "/images/news-bus.png"),
    ("فرآیند انتخاب واحد", "/images/news-university.png"),
    ("احتمال حمله خرس", "/images/news-bear.png"),
    ("تاب‌آوری شهر", "/images/news-flood.png"),
    ("نشست فعالان اقتصادی", "/images/news-economy.png"),
    ("هیئت نظارت بر انتخابات", "/images/news-election.png"),
    ("تأکید دادستان", "/images/news-justice.png"),
    ("ساعت فعالیت مدارس", "/images/news-school.png"),
]

# which article becomes the site hero (featured)
FEATURED_PREFIX = "هشدار زرد"


def main() -> int:
    con = sqlite3.connect(DB)
    cur = con.cursor()

    updated = 0
    for prefix, img in IMAGES:
        cur.execute(
            "UPDATE Article SET image = ? WHERE title LIKE ? AND status = 'published'",
            (img, prefix + "%"),
        )
        updated += cur.rowcount
        if cur.rowcount == 0:
            print(f"  !! no match for prefix: {prefix}")
    print(f"images updated: {updated}/{len(IMAGES)}")

    # featured: exactly one, the weather alert story
    cur.execute("UPDATE Article SET featured = 0")
    cur.execute("UPDATE Article SET featured = 1 WHERE title LIKE ?", (FEATURED_PREFIX + "%",))
    print("featured set on rows:", cur.rowcount)

    con.commit()

    # report
    print("\n--- result ---")
    for row in cur.execute(
        "SELECT featured, substr(title,1,44), image FROM Article ORDER BY publishedAt DESC"
    ).fetchall():
        print(("[F] " if row[0] else "    ") + f"{row[1]:<46} {row[2]}")
    con.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
