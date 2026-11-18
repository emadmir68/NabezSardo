// Seed Nabz Sardo database with real articles imported from nabzesardo.ir
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const db = new PrismaClient();

const CATS = [
  ['sardouiyeh', 'ساردوئیه', 1],
  ['city-village', 'سیاسی', 2],
  ['social', 'اجتماعی', 3],
  ['culture', 'فرهنگی', 4],
  ['sports', 'ورزش', 5],
  ['agriculture', 'کشاورزی', 6],
  ['incidents', 'حوادث', 7],
  ['weather', 'آب‌وهوا', 8],
  ['opinion', 'یادداشت و مطالبه', 9],
  ['short-news', 'خبر کوتاه', 10],
];

const SETTINGS = {
  siteName: 'نبض ساردو',
  tagline: 'رسانه مستقل خبری و تحلیلی جنوب کرمان',
  breakingText:
    'مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.',
  adEnabled: '1',
  adTitle: 'جای تبلیغات شما اینجاست',
  adText: 'برای رزرو این جایگاه با نبض ساردو در ارتباط باشید',
  adLink: '/contact',
  adImage: '',
};

// ---- helper: wrap plain paragraphs into sanitized <p> html ----
function pHtml(paras) {
  return paras
    .map((t) => `<p>${t.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</p>`)
    .join('');
}

// ---- curated fixes for imported articles: category, image, body fallbacks ----
const FIX = {
  'درخشش-دانشآموزان-مدارس-سما-و-سعادت-جیرفت-با-کسب-رتبههای-اول-و-دوم-کشوری-در-سماکاپ': {
    cat: 'culture', image: '/images/news-students.png',
    titleClean: (t) => t,
  },
  'فردا-عزای-عمومی-اعلام-شد': { cat: 'social', image: '/images/news-mourning.png' },
  'توقیف-اتوبوس-حاوی-چندین-باک-اضافه-و-جاساز-غیرمجاز': { cat: 'incidents', image: '/images/news-bus.png' },
  'ساعت-فعالیت-مدارس-کرمان-در-دو-هفته-ابتدایی-مهر-اعلام-شد': { cat: 'social', image: '/images/news-school.png' },
  'عضو-هیئت-نظارت-بر-انتخابات-شوراهای-شهر-و-روستا-شعا': {
    cat: 'city-village', image: '/images/news-election.png',
    body: [
      'عضو هیئت نظارت بر انتخابات شوراهای شهر و روستا با برگزاری انتخابات شوراها موافقت کرده است.',
      'بر اساس این اعلام، تاریخ برگزاری انتخابات شوراهای شهر و روستا به‌زودی اعلام می‌شود.',
    ],
  },
  'نشست-فعالان-اقتصادی-رفسنجان-با-اعضای-کمیسیون-اقتصا': { cat: 'city-village', image: '/images/news-economy.png' },
  'تأکید-دادستان-جیرفت-بر-رفع-نواقص-و-ارتقای-کیفیت-خد': { cat: 'city-village', image: '/images/news-justice.png' },
  'هشدار-زرد؛-رگبار-و-رعدوبرق-در-مرکز-و-نیمه-جنوبی-کر': {
    cat: 'weather', image: '/images/news-storm.png', featured: true,
    body: [
      'برای مرکز و نیمه جنوبی استان کرمان هشدار زرد صادر شده است؛ بر اساس این هشدار، رگبار باران و رعدوبرق در مناطق یادشده پیش‌بینی می‌شود.',
      'شهروندان از تردد غیرضروری در ساعات وقوع رگبار پرهیز کنند و کشاورزان تمهیدات لازم را برای حفاظت از محصولات بیندیشند.',
    ],
  },
  'فرآیند-انتخاب-واحد-تکمیلی-دانشگاه-آزاد-اسلامی-از-ا': {
    cat: 'social', image: '/images/news-university.png',
    body: [
      'فرآیند انتخاب واحد تکمیلی دانشگاه آزاد اسلامی از امروز آغاز شده است.',
      'متقاضیان می‌توانند طبق برنامه اعلامی دانشگاه، از طریق سامانه آموزش نسبت به انتخاب واحد اقدام کنند.',
    ],
  },
  'فرماندار-جیرفت-روحبخش-بیگزاده-اعلام-کرد-احتمال-حمل': {
    cat: 'incidents', image: '/images/news-bear.png',
    body: [
      'فرماندار جیرفت (روح‌بخش بیگ‌زاده) اعلام کرد احتمال حمله خرس به نوجوان ۱۴ ساله در بحرآسمان همچنان در دست بررسی است.',
      'جزئیات نهایی این حادثه پس از تکمیل بررسی‌های میدانی اعلام می‌شود.',
    ],
  },
  'فرماندار-جیرفت-تابآوری-شهر-در-برابر-سیلاب-نیازمند-': {
    cat: 'city-village', image: '/images/news-flood.png',
    body: [
      'فرماندار جیرفت گفت: تاب‌آوری شهر در برابر سیلاب نیازمند تزریق اعتبارات استانی است.',
      'وی با اشاره به تجربه رگبارهای اخیر، بر ضرورت تکمیل پروژه‌های مدیریت رواناب و تقویت زیرساخت‌های مقابله با سیل تأکید کرده است.',
    ],
  },
  'speechballoonپزشکیان-نیویورک-را-به-مقصد-تهران-ترک-': null, // cleaned below
};

const NEW = {
  slugFix: { 'speechballoonپزشکیان-نیویورک-را-به-مقصد-تهران-ترک-': 'پزشکیان-نیویورک-را-به-مقصد-تهران-ترک-کرد' },
  articles: [
    {
      slug: 'صادق-نیک‌نفس،-شاعر-حمایت-مسئولان-از-هنرمندان-جنوب-کرمان-نیازمند-تقویت-است',
      title: 'صادق نیک‌نفس، شاعر: حمایت مسئولان از هنرمندان جنوب کرمان نیازمند تقویت است',
      cat: 'culture', image: '/images/news-poet.png',
      lead: 'صادق نیک‌نفس، شاعر، در نشست آسیب‌شناسی فرهنگ و هنر جنوب کرمان گفت: حمایت مسئولان از هنرمندان این منطقه نیازمند تقویت است.',
      body: [
        'صادق نیک‌نفس، شاعر، در نشست آسیب‌شناسی فرهنگ و هنر جنوب کرمان گفت: حمایت مسئولان از هنرمندان این منطقه نیازمند تقویت است.',
        'به گزارش رسانه‌های محلی، در این نشست وضعیت فرهنگ و هنر جنوب کرمان بررسی و بر ضرورت توجه بیشتر به استعدادهای منطقه تأکید شد.',
      ],
      location: 'جنوب کرمان', daysAgo: 0,
    },
    {
      slug: 'امام-جمعه‌ای-که-خود-پیش‌قدم-دیدار-با-مردم-می‌شود',
      title: 'امام جمعه‌ای که خود پیش‌قدم دیدار با مردم می‌شود',
      cat: 'social', image: '/images/news-mosque.png', featured: false,
      lead: 'مردمی‌بودن را باید نه در سخن، بلکه در رفتار دید؛ آنجا که مسئولیت، مانع هم‌نشینی با مردم نمی‌شود.',
      body: [
        'مردمی‌بودن را باید نه در سخن، بلکه در رفتار دید؛ آنجا که مسئولیت، مانع هم‌نشینی با مردم نمی‌شود.',
        'امام جمعه‌ای که خود پیش‌قدم دیدار با مردم می‌شود، نشان می‌دهد نزدیکی به مردم یک شعار نیست؛ یک انتخاب است.',
      ],
      location: 'جنوب کرمان', daysAgo: 0,
    },
    {
      slug: 'اقبال-واحدی-برای-دومین-بار-مردم-ایران-را-به-جشنواره-ملی-خرمای-کلوته-عنبرآباد-دعوت-کرد',
      title: 'اقبال واحدی برای دومین بار مردم ایران را به جشنواره ملی خرمای کلوته عنبرآباد دعوت کرد',
      cat: 'culture', image: '/images/news-dates.png',
      lead: 'اقبال واحدی مجری شناخته‌شده تلویزیون برای دومین بار مردم ایران را به جشنواره ملی خرمای کلوته عنبرآباد دعوت کرد.',
      body: [
        'اقبال واحدی مجری شناخته‌شده تلویزیون برای دومین بار مردم ایران را به جشنواره ملی خرمای کلوته عنبرآباد دعوت کرد.',
        'این دعوت با هدف معرفی هرچه بیشتر ظرفیت‌های کشاورزی جنوب کرمان و جذب گردشگر به این رویداد انجام شده است.',
      ],
      location: 'عنبرآباد', daysAgo: 0,
    },
    {
      slug: 'پیشرفت-۹۵-درصدی-سنجش-سلامت-کارگران-در-واحدهای-اقتصادی-استان-کرمان',
      title: 'پیشرفت ۹۵ درصدی سنجش سلامت کارگران در واحدهای اقتصادی استان کرمان',
      cat: 'social', image: '/images/news-health.png',
      lead: 'مدیر کل تعاون، کار و رفاه اجتماعی استان کرمان، از اجرای ۹۵ درصدی پیمایش ملی سنجش سلامت نیروی کار در بنگاه‌های اقتصادی استان خبر داد.',
      body: [
        'مدیر کل تعاون، کار و رفاه اجتماعی استان کرمان، از اجرای ۹۵ درصدی پیمایش ملی سنجش سلامت نیروی کار در بنگاه‌های اقتصادی استان خبر داد.',
        'این پیمایش ملی با هدف جمع‌آوری داده‌های بهداشتی نیروی کار و برنامه‌ریزی برای ارتقای سلامت شغلی در حال اجراست.',
      ],
      location: 'کرمان', daysAgo: 0,
    },
    {
      slug: 'امام-جمعه-کرمان-دشمنی-آمریکا-با-ایران-با-تغییر-دولت‌ها-پایان-نمی‌یابد',
      title: 'امام جمعه کرمان: دشمنی آمریکا با ایران با تغییر دولت‌ها پایان نمی‌یابد',
      cat: 'city-village', image: '/images/news-flag.png',
      lead: 'امام جمعه کرمان گفت: دشمنی آمریکا و جبهه استکبار با جمهوری اسلامی ایران با تغییر دولت‌ها و نتایج انتخابات این کشور پایان نمی‌یابد.',
      body: [
        'امام جمعه کرمان گفت: دشمنی آمریکا و جبهه استکبار با جمهوری اسلامی ایران با تغییر دولت‌ها و نتایج انتخابات این کشور پایان نمی‌یابد.',
      ],
      location: 'کرمان', daysAgo: 0,
    },
    {
      slug: 'سپاه-پاسداران-رادار-هشدار-اولیه-ارتش-متجاوز-آمریکا-در-جزیره-بحرین-منهدم-شد',
      title: 'سپاه پاسداران: رادار هشدار اولیه ارتش متجاوز آمریکا در جزیره بحرین منهدم شد',
      cat: 'city-village', image: '/images/news-radar.png',
      lead: 'روابط عمومی سپاه پاسداران انقلاب اسلامی اعلام کرد رادار هشدار اولیه ارتش متجاوز آمریکا در جزیره بحرین منهدم شد.',
      body: [
        'روابط عمومی سپاه پاسداران انقلاب اسلامی اعلام کرد رادار هشدار اولیه ارتش متجاوز آمریکا در جزیره بحرین منهدم شد.',
      ],
      location: 'جنوب کرمان', daysAgo: 0,
    },
    {
      slug: 'انهدام-باند-سه-نفره-سرقت-در-فاریاب',
      title: 'انهدام باند سه نفره سرقت در فاریاب',
      cat: 'incidents', image: '/images/news-police.png',
      lead: 'باند سه‌نفره سرقت در شهرستان فاریاب منهدم شد.',
      body: [
        'باند سه‌نفره سرقت در شهرستان فاریاب منهدم شد.',
        'جزئیات بیشتر این خبر متعاقباً منتشر می‌شود.',
      ],
      location: 'فاریاب', daysAgo: 0,
    },
  ],
};

function locFromTitle(t) {
  if (/جیرفت/.test(t)) return 'جیرفت';
  if (/کرمان/.test(t)) return 'کرمان';
  if (/فاریاب/.test(t)) return 'فاریاب';
  if (/عنبرآباد/.test(t)) return 'عنبرآباد';
  if (/رفسنجان/.test(t)) return 'رفسنجان';
  if (/بحرآسمان/.test(t)) return 'بحرآسمان';
  return 'ساردوئیه';
}

async function main() {
  console.log('seeding categories...');
  for (const [id, name, order] of CATS) {
    await db.category.upsert({ where: { id }, update: { name, order }, create: { id, name, order } });
  }

  console.log('seeding settings...');
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  const existing = await db.article.count();
  if (existing > 0 && !process.env.RESET) {
    console.log('articles already seeded (' + existing + '), skipping articles');
    await db.$disconnect();
    return;
  }
  if (existing > 0) await db.article.deleteMany({});

  const imported = JSON.parse(readFileSync('/home/z/my-project/scripts/nabz-articles.json', 'utf8'));
  console.log('imported from live site:', imported.length);

  let views = 12;
  let order = 0;

  // newest first: homepage-imported articles (daysAgo 0) then live-imported by datetime
  for (const a of NEW.articles) {
    views += 7 + ((order * 13) % 41);
    const publishedAt = new Date(Date.now() - (a.daysAgo || 0) * 86400000 - order * 3600000);
    await db.article.create({
      data: {
        title: a.title,
        slug: a.slug,
        categoryId: a.cat,
        lead: a.lead || '',
        bodyHtml: pHtml(a.body || []),
        body: (a.body || []).join('\n'),
        status: 'published',
        featured: Boolean(a.featured),
        image: a.image || '',
        location: a.location || 'ساردوئیه',
        views,
        publishedAt,
        createdAt: publishedAt,
      },
    });
    console.log('  +', a.title.slice(0, 50));
    order++;
  }

  for (const a of imported.sort((x, y) => (y.datetime || '').localeCompare(x.datetime || ''))) {
    let slug = a.slug;
    if (FIX[slug] === null) slug = NEW.slugFix[slug] || slug;
    // resolve fix by exact match first, then by 30-char prefix (JSON slugs vary in length)
    let fix = FIX[slug] && typeof FIX[slug] === 'object' ? { ...FIX[slug] } : {};
    if (!fix.cat) {
      const key = Object.keys(FIX).find((k) => slug && k && slug.slice(0, 30) === k.slice(0, 30));
      if (key && typeof FIX[key] === 'object') fix = { ...FIX[key] };
    }
    if (slug === 'پزشکیان-نیویورک-را-به-مقصد-تهران-ترک-کرد') {
      fix = { cat: 'city-village', image: '/images/news-valley.png', body: ['محمدرضا پزشکیان، رئیس‌جمهور، نیویورک را به مقصد تهران ترک کرد.'] };
    }
    if (!a.title || (!a.paras?.length && !fix.body)) continue;
    const paras = fix.body || a.paras || [];
    // drop duplicated title+lead prefix block (their markup repeats it)
    const clean = paras.filter((p, i) => !(i === 0 && paras[1] && p.startsWith(a.title) && paras[1].startsWith(paras[0].slice(0, 80) === paras[0] ? paras[0].slice(0, 40) : '###')));
    let use = clean.length ? clean : paras;
    if (use.length >= 2 && use[0].startsWith(a.title.slice(0, 30)) && use[1].includes(use[0].slice(0, 60))) use = use.slice(1);
    // remove embedded title prefix from first paragraph
    use = use.map((p, i) => (i === 0 && a.title && p.startsWith(a.title.slice(0, 25)) ? p.replace(a.title, '').trim() : p)).filter(Boolean);
    if (!use.length) use = [a.title];
    views += 5 + ((order * 17) % 37);
    const dt = a.datetime ? new Date(a.datetime) : null;
    await db.article.create({
      data: {
        title: a.title,
        slug,
        categoryId: fix.cat || 'social',
        lead: use[0].slice(0, 300),
        bodyHtml: pHtml(use.slice(0, 5)),
        body: use.slice(0, 5).join('\n'),
        status: 'published',
        featured: Boolean(fix.featured),
        image: fix.image || '',
        location: locFromTitle(a.title),
        views,
        publishedAt: dt && !isNaN(dt) ? dt : new Date(Date.now() - order * 3600000 - 7200000),
        createdAt: dt && !isNaN(dt) ? dt : new Date(Date.now() - order * 3600000 - 7200000),
      },
    });
    console.log('  +', a.title.slice(0, 50));
    order++;
  }

  console.log('seed complete:', await db.article.count(), 'articles');
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
