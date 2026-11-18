#!/usr/bin/env python3
"""Import real articles from live nabzesardo.ir into seed JSON."""
import re, html, json, urllib.request, urllib.parse, time, sys

BASE = 'https://nabzesardo.ir'
UA = {'User-Agent': 'Mozilla/5.0 (compatible; NabzSardoImport/1.0)'}
HERE = '/home/z/my-project/scripts'

def fetch(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            return urllib.request.urlopen(req, timeout=25).read().decode('utf-8')
        except Exception as e:
            if i == tries - 1:
                print('FAIL', url[:90], e)
                return None
            time.sleep(2)

def strip(t):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', html.unescape(t or ''))).strip()

# 1) collect article URLs from home + all-news (already downloaded)
urls = []
for f in (HERE + '/live-home.html', HERE + '/live-all.html'):
    try:
        raw = open(f, encoding='utf-8').read()
        urls += re.findall(r'href="(/news/[^"]+)"', raw)
    except Exception:
        pass
urls = list(dict.fromkeys(urls))
print('unique article urls:', len(urls))

cat_names = {
    'sardouiyeh': 'ساردوئیه', 'city-village': 'سیاسی', 'social': 'اجتماعی',
    'culture': 'فرهنگی', 'sports': 'ورزش', 'incidents': 'حوادث',
    'weather': 'آب‌وهوا', 'opinion': 'یادداشت و مطالبه', 'agriculture': 'کشاورزی',
    'short-news': 'خبر کوتاه', 'kerman': 'استان کرمان', 'tourism': 'گردشگری',
}

articles = []
for u in urls:
    # already-encoded URLs contain %XX; only quote raw Persian paths
    path = u if '%' in u else urllib.parse.quote(u)
    page = fetch(BASE + path)
    if not page:
        continue
    title = re.search(r'<h1[^>]*>(.*?)</h1>', page, re.S)
    cat = re.search(r'href="(/category/[^"]+)"', page)
    t = re.search(r'<time[^>]*datetime="([^"]+)"', page)
    img = re.search(r'<img[^>]+src="(/uploads/[^"]+)"', page)
    bodypart = page.split('</h1>')[-1]
    bodypart = bodypart.split('برای ارسال اطلاعات تکمیلی')[0]
    paras, seen = [], set()
    for p in re.findall(r'<p[^>]*>(.*?)</p>', bodypart, re.S):
        text = strip(p)
        if len(text) < 40 or text[:60] in seen:
            continue
        seen.add(text[:60])
        paras.append(text)
    # their markup repeats the title+lead twice; drop the first dup block
    if len(paras) >= 2 and paras[0][:120] in paras[1]:
        paras = paras[1:]
    cat_id = cat.group(1).split('/category/')[-1] if cat else ''
    cat_id = urllib.parse.unquote(cat_id)
    rec = {
        'slug': urllib.parse.unquote(u.split('/news/')[-1]),
        'title': strip(title.group(1)) if title else '',
        'cat': cat_id if cat_id in cat_names else 'social',
        'datetime': t.group(1) if t else '',
        'image': img.group(1) if img else '',
        'paras': paras[:6],
    }
    tt = rec['title']
    if len(tt) > 20 and tt[:len(tt) // 2] == tt[len(tt) // 2:]:
        rec['title'] = tt[:len(tt) // 2].strip()
    articles.append(rec)
    print('OK', rec['cat'], (rec['datetime'] or '')[:16], rec['title'][:60])
    time.sleep(0.4)

json.dump(articles, open(HERE + '/nabz-articles.json', 'w'), ensure_ascii=False, indent=1)
print('saved', len(articles), 'articles')
