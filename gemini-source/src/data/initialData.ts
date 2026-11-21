import type { Article, CategoryId, CitizenReport, LocalizedText, RegionId } from '../types/news';

export const EDITORIAL_IMAGES = {
  sarduiyehHighlands: '/src/assets/images/hero_sarduiyeh_highlands_1795255635485.jpg',
  jiroftAgriculture: '/src/assets/images/hero_jiroft_agriculture_1795255634454.jpg',
  kermanHeritage: '/src/assets/images/hero_kerman_heritage_1795255635186.jpg',
  mountainWeather: '/src/assets/images/desk_mountain_weather_1795255634692.jpg',
  communityCulture: '/src/assets/images/desk_community_culture_1795255635560.jpg',
} as const;

export const CATEGORIES: { id: CategoryId; label: LocalizedText; code: string }[] = [
  { id: 'sarduiyeh', label: { fa: 'ساردوئیه', en: 'Sarduiyeh' }, code: '01' },
  { id: 'agriculture', label: { fa: 'کشاورزی و اقتصاد', en: 'Agriculture & Economy' }, code: '02' },
  { id: 'social', label: { fa: 'اجتماعی و شهر', en: 'Society & Civic' }, code: '03' },
  { id: 'culture', label: { fa: 'فرهنگ و میراث', en: 'Culture & Heritage' }, code: '04' },
  { id: 'weather', label: { fa: 'هواشناسی و اقلیم', en: 'Climate & Weather' }, code: '05' },
  { id: 'incidents', label: { fa: 'حوادث و راه‌ها', en: 'Roads & Safety' }, code: '06' },
  { id: 'opinion', label: { fa: 'یادداشت و تحلیل', en: 'Opinion & Analysis' }, code: '07' },
];

export const REGIONS: { id: RegionId; label: LocalizedText }[] = [
  { id: 'sarduiyeh', label: { fa: 'ساردوئیه', en: 'Sarduiyeh' } },
  { id: 'jiroft', label: { fa: 'جیرفت', en: 'Jiroft' } },
  { id: 'anbarabad', label: { fa: 'عنبرآباد', en: 'Anbarabad' } },
  { id: 'kahnuj', label: { fa: 'کهنوج', en: 'Kahnuj' } },
  { id: 'south-kerman', label: { fa: 'جنوب کرمان', en: 'South Kerman' } },
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-1',
    slug: 'sarduiyeh-highlands-water-orchards-future',
    title: {
      fa: 'فصل تازه در ارتفاعات ساردوئیه؛ بازآفرینی باغات گردو و آبخیزداری در دامنه‌های بحرآسمان',
      en: 'A New Season in Sarduiyeh Highlands: Restoring Ancient Walnut Orchards Along Bahr-Aseman',
    },
    deck: {
      fa: 'گزارش میدانی نبض ساردو از طرح‌های بومی حفاظت از چشمه‌سارها، نوآوری باغداران کوهستان و نقش اکوسیستم ییلاقی در اقتصاد پایدار جنوب کرمان.',
      en: 'A Nabz Sardo field report examining community-led watershed revival, highland orchard resilience, and the mountain economy of South Kerman.',
    },
    body: {
      fa: [
        'در سپیده‌دم پاییزی ارتفاعات ساردوئیه، جایی که مه رقیق از میان دره‌های سنگی بحرآسمان به سمت باغات کهن‌سال گردو سرازیر می‌شود، نسل تازه‌ای از باغداران در حال بازتعریف نسبت خود با آب و خاک هستند. دیگر تنها اتکا به شیوه‌های سنتی پاسخگوی نوسانات اقلیمی سال‌های اخیر نیست؛ بلکه پیوند دانش بومی با مدیریت مدرن منابع آب به اولویت نخست روستاهای کوهستانی تبدیل شده است.',
        'بررسی‌های میدانی خبرنگار نبض ساردو در محورهای دلفارد، گور و درب‌بهشت نشان می‌دهد که مرمت قنات‌های قدیمی و اجرای بندهای سنگی-ملاتی کوچک‌مقیاس، طی دو فصل گذشته توانسته دبی چندین چشمه فصلی را تثبیت کند. کشاورزان منطقه تأکید دارند که حفظ بافت طبیعی باغ‌ها بدون آسیب به پوشش گیاهی دامنه‌ها، تنها راه تضمین کیفیت محصول صادراتی گردو و سیب ساردوئیه است.',
        'کارشناسان توسعه روستایی در جنوب کرمان بر این باورند که ایجاد زنجیره فرآوری و بسته‌بندی استاندارد در خود بخش ساردوئیه می‌تواند ارزش افزوده تولیدات سردسیری را تا دو برابر افزایش دهد و مانع از مهاجرت جوانان متخصص به کلان‌شهرها شود.',
      ],
      en: [
        'At dawn across the alpine valleys of Sarduiyeh, where autumn mist drifts down from the Bahr-Aseman ridges into centuries-old walnut groves, a new generation of growers is quietly reimagining stewardship of mountain water and soil.',
        'Field reporting by Nabz Sardo across Delfard, Gur, and Darb-e Behesht shows that restoring historic qanats alongside small-scale stone check-dams has stabilized seasonal spring discharge over the past two harvests. Local growers stress that protecting highland flora is inseparable from preserving the reputation of Sarduiyeh walnuts and apples.',
        'Regional economists note that establishing localized sorting and cold-packaging hubs directly within Sarduiyeh could double value retention for highland families while creating skilled careers for young agronomists.',
      ],
    },
    pullQuote: {
      fa: '«آینده اقتصادی ساردوئیه نه در توسعه بی‌ضابطه، بلکه در پیوند احترام‌آمیز به اقلیم کوهستان و زنجیره ارزش محصولات بومی رقم می‌خورد.»',
      en: '"Sarduiyeh’s prosperity lies not in unchecked expansion, but in honoring its alpine watershed while capturing local agricultural value."',
    },
    category: 'sarduiyeh',
    region: 'sarduiyeh',
    author: { fa: 'تحریریه میدانی نبض ساردو', en: 'Nabz Sardo Field Desk' },
    authorRole: { fa: 'گزارش ویژه منطقه‌ای', en: 'Regional Special Report' },
    coverImage: EDITORIAL_IMAGES.sarduiyehHighlands,
    imageCaption: {
      fa: 'نگاره ۱ — چشم‌انداز پگاه در دره‌های ییلاقی و باغات کوهستانی بخش ساردوئیه، جنوب کرمان.',
      en: 'Fig. 1 — Morning mist moving across highland valleys and heritage orchards in Sarduiyeh, South Kerman.',
    },
    publishedAt: '2026-11-20T09:15:00Z',
    readTimeMin: 6,
    views: 4820,
    status: 'published',
    featuredInHero: true,
    isBreaking: true,
  },
  {
    id: 'art-2',
    slug: 'jiroft-cold-storage-sorting-agriculture-export',
    title: {
      fa: 'ساماندهی زنجیره سردخانه‌ها و سورتینگ جیرفت؛ گام کلیدی برای ثبات بازار محصولات کشاورزی جنوب',
      en: 'Modernizing Jiroft Cold-Storage and Sorting Networks to Stabilize South Kerman Exports',
    },
    deck: {
      fa: 'نشست مشترک سردخانه‌داران و صادرکنندگان شهرستان جیرفت بر استانداردسازی بسته‌بندی خرما و محصولات جالیزی و حذف واسطه‌های پرهزینه تأکید کرد.',
      en: 'Cold-storage operators and agricultural exporters in Jiroft convene to standardize date palm and winter crop grading while reducing post-harvest loss.',
    },
    body: {
      fa: [
        'دشت حاصلخیز جیرفت و عنبرآباد که به‌عنوان یکی از قطب‌های راهبردی تأمین محصولات کشاورزی خارج از فصل کشور شناخته می‌شود، در آستانه فصل برداشت زمستانی با چالش همیشگی تنظیم بازار و کاهش ضایعات روبه‌روست. در تازه‌ترین نشست صنفی سردخانه‌داران و سورتینگ‌داران شهرستان جیرفت، نقشه راه تازه‌ای برای شفاف‌سازی نرخ نگهداری و ارتقای کیفیت بسته‌بندی صادراتی تدوین شد.',
        'فعالان این بخش می‌گویند نبود هماهنگی میان زمان برداشت، ظرفیت حمل یخچالی و تقاضای بازارهای هدف، در سال‌های گذشته بخش بزرگی از سود واقعی را از دسترس کشاورز خارج کرده است. راه‌اندازی سامانه شفاف رصد موجودی سردخانه‌ها و استفاده از بسته‌بندی‌های شناسنامه‌دار با نام جغرافیایی جنوب کرمان از مهم‌ترین محورهای این توافق است.',
        'نمایندگان بخش خصوصی همچنین خواستار تسهیل روند صدور گواهی‌های قرنطینه نباتی در خود منطقه شدند تا محموله‌های تازه با کمترین توقف گمرکی به بازارهای منطقه‌ای و بین‌المللی برسند.',
      ],
      en: [
        'The fertile plains of Jiroft and Anbarabad—among Iran’s most vital winter agricultural basins—enter peak harvest season facing a decisive test in logistics coordination and post-harvest preservation.',
        'At a joint assembly of Jiroft cold-storage owners and sorting-house managers, stakeholders outlined a coordinated protocol for transparent storage tariffs, geographic-origin packaging, and temperature-monitored transport.',
        'Industry representatives emphasized that localizing phytosanitary export certifications inside South Kerman will reduce transit delays and return a fairer share of export margins directly to growers.',
      ],
    },
    pullQuote: {
      fa: '«شناخته‌شدن برند جغرافیایی محصولات جنوب کرمان در بازارهای صادراتی، از خط سورتینگ و سردخانه استاندارد آغاز می‌شود.»',
      en: '"Building international recognition for South Kerman’s harvest begins on the sorting line and inside modern cold storage."',
    },
    category: 'agriculture',
    region: 'jiroft',
    author: { fa: 'امیرحسین میرزایی', en: 'Amirhossein Mirzaei' },
    authorRole: { fa: 'دبیر میز اقتصاد و کشاورزی', en: 'Economy & Agriculture Editor' },
    coverImage: EDITORIAL_IMAGES.jiroftAgriculture,
    imageCaption: {
      fa: 'نگاره ۲ — نخلستان‌ها و اراضی زراعی دشت جیرفت در واپسین ساعات روز.',
      en: 'Fig. 2 — Date groves and cultivated winter fields across the Jiroft valley at golden hour.',
    },
    publishedAt: '2026-11-20T14:40:00Z',
    readTimeMin: 5,
    views: 3915,
    status: 'published',
    featuredInHero: true,
    isBreaking: true,
  },
  {
    id: 'art-3',
    slug: 'south-kerman-architectural-heritage-artists-support',
    title: {
      fa: 'بازگشت نور به ایوان‌های خشتی؛ مطالبه هنرمندان و پژوهشگران برای صیانت از میراث فرهنگی جنوب کرمان',
      en: 'Light Returning to Earthen Arches: Artists and Historians Call for South Kerman Heritage Renewal',
    },
    deck: {
      fa: 'از حافظه تمدنی هلیل‌رود تا شعر و هنر معاصر؛ چرا تقویت زیرساخت‌های فرهنگی و حمایت مستمر از هنرمندان بومی یک ضرورت توسعه‌ای است؟',
      en: 'From the ancient Halil Rud civilization to contemporary poets, cultural voices urge sustained investment in galleries, restoration, and regional arts.',
    },
    body: {
      fa: [
        'جنوب کرمان تنها یک قطب کشاورزی و معدنی نیست؛ این سرزمین بر لایه‌های عمیقی از تمدن هلیل‌رود، معماری خشتی هماهنگ با اقلیم و سنت زنده شعر و روایت ایستاده است. در نشست اخیر اصحاب فرهنگ و هنر منطقه، شاعران و پژوهشگران بومی خواستار گذار از حمایت‌های مقطعی به برنامه‌ریزی پایدار برای مرمت بناهای تاریخی و ایجاد خانه‌های هنر شدند.',
        'به گفته شاعران و فعالان فرهنگی، استعدادهای جوان در جیرفت، ساردوئیه و کهنوج با کمبود فضاهای استاندارد نمایشگاهی، کتابخانه‌های تخصصی و بودجه‌های نشر مواجه‌اند. با این حال، حرکت‌های خودجوش محلی برای ثبت روایت‌های شفاهی و باززنده‌سازی بناهای خشتی، امید تازه‌ای به جریان فرهنگی منطقه بخشیده است.',
        'کارشناسان گردشگری فرهنگی معتقدند پیوند مسیرهای اکوتوریسم کوهستان ساردوئیه با محوطه‌های باستانی و بافت‌های تاریخی دشت جیرفت می‌تواند الگویی منحصربه‌فرد از گردشگری مسئولانه و درآمدزا برای جوامع محلی پدید آورد.',
      ],
      en: [
        'South Kerman is far more than an agricultural basin—it rests atop the deep cultural memory of the Halil Rud civilization, climate-wise earthen architecture, and a vibrant living tradition of poetry.',
        'During a regional cultural forum, poets and historians urged municipal and provincial leaders to transition from one-off festivals toward durable restoration grants, publishing fellowships, and dedicated community cultural houses.',
        'Heritage planners point out that linking Sarduiyeh’s alpine eco-trails with Jiroft’s archaeological landmarks offers a compelling blueprint for sustainable cultural tourism.',
      ],
    },
    pullQuote: {
      fa: '«توسعه بدون حافظه فرهنگی شکننده است؛ هنر و میراث جنوب کرمان سرمایه هویتی نسل‌های آینده است.»',
      en: '"Development without cultural memory is fragile; South Kerman’s heritage and literature anchor the identity of coming generations."',
    },
    category: 'culture',
    region: 'south-kerman',
    author: { fa: 'نسترن سالاری', en: 'Nastaran Salari' },
    authorRole: { fa: 'دبیر میز فرهنگ و هنر', en: 'Culture & Heritage Editor' },
    coverImage: EDITORIAL_IMAGES.kermanHeritage,
    imageCaption: {
      fa: 'نگاره ۳ — هندسه نور و سایه در معماری خشتی سنتی منطقه کرمان در ساعات پایانی عصر.',
      en: 'Fig. 3 — Late afternoon light and shadow across traditional Persian mud-brick courtyard arches in Kerman.',
    },
    publishedAt: '2026-11-19T17:20:00Z',
    readTimeMin: 7,
    views: 3410,
    status: 'published',
    featuredInHero: true,
    isBreaking: false,
  },
  {
    id: 'art-4',
    slug: 'sarduiyeh-mountain-pass-weather-alert-autumn',
    title: {
      fa: 'ورود سامانه بارشی و کاهش محسوس دما در گردنه‌های ساردوئیه؛ هشدار ایمنی برای رانندگان محور کوهستانی',
      en: 'Autumn Storm Front Brings Sharp Drop in Temperatures Across Sarduiyeh Mountain Passes',
    },
    deck: {
      fa: 'اداره هواشناسی و راهداری جنوب کرمان از مه‌گرفتگی شدید، لغزندگی جاده ساردوئیه–جیرفت و لزوم همراه داشتن تجهیزات زمستانی در ساعات شب خبر دادند.',
      en: 'Meteorological and road safety officials warn of dense fog and slick mountain curves along the Sarduiyeh–Jiroft corridor overnight.',
    },
    body: {
      fa: [
        'با نفوذ توده هوای خنک پاییزی به ارتفاعات مرکزی و جنوبی استان کرمان، دمای هوا در مناطق کوهستانی ساردوئیه، دلفارد و رابر بین ۶ تا ۹ درجه سانتی‌گراد کاهش یافته است. گزارش‌های ایستگاه‌های سینوپتیک از شکل‌گیری ابرهای باران‌زا و احتمال رگبارهای پراکنده و مه‌گرفتگی غلیظ در گردنه‌ها حکایت دارد.',
        'راهداری منطقه اعلام کرده است که گشت‌های ثابت و سیار در محور پرپیچ‌وخم ساردوئیه به جیرفت مستقر شده‌اند و از مسافران و رانندگان ناوگان حمل محصولات کشاورزی خواسته شده پیش از حرکت، از سلامت سیستم گرمایشی، برف‌پاک‌کن و چراغ‌های مه‌شکن خودرو اطمینان حاصل کنند.',
        'کارشناسان کشاورزی نیز به گلخانه‌داران دشت‌های پایین‌دست و باغداران مناطق مرتفع توصیه کرده‌اند تمهیدات لازم برای جلوگیری از خسارت باد و نوسان دمایی شبانه را در نظر بگیرند.',
      ],
      en: [
        'As a crisp autumn frontal system sweeps over Kerman’s highlands, temperatures in Sarduiyeh and neighboring mountain valleys have dropped by 6 to 9 degrees Celsius, accompanied by dense ridge fog.',
        'Road maintenance crews stationed along the winding Sarduiyeh–Jiroft highway advise commercial agricultural trucks and evening commuters to verify fog lamps and braking systems before ascending the pass.',
        'Agronomists have also issued precautionary guidance for greenhouse operators in the lower plains to regulate overnight ventilation against sudden wind gusts.',
      ],
    },
    category: 'weather',
    region: 'sarduiyeh',
    author: { fa: 'میلاد کرمانی‌نژاد', en: 'Milad Kermaninejad' },
    authorRole: { fa: 'گزارشگر اقلیم و راه', en: 'Climate & Transit Reporter' },
    coverImage: EDITORIAL_IMAGES.mountainWeather,
    imageCaption: {
      fa: 'نگاره ۴ — انباشت ابرهای باران‌زا بر فراز جاده کوهستانی و گردنه‌های ارتفاعات ساردوئیه.',
      en: 'Fig. 4 — Storm clouds gathering above the winding mountain pass leading into Sarduiyeh at dusk.',
    },
    publishedAt: '2026-11-20T18:05:00Z',
    readTimeMin: 4,
    views: 5190,
    status: 'published',
    featuredInHero: true,
    isBreaking: true,
  },
  {
    id: 'art-5',
    slug: 'poets-literary-gatherings-jiroft-south-kerman',
    title: {
      fa: 'شب‌های شعر و روایت جنوب؛ احیای محافل ادبی مستقل در کتابخانه‌ها و کافه‌های فرهنگی جیرفت',
      en: 'Evenings of Verse in the South: Independent Literary Salons Revive Across Jiroft',
    },
    deck: {
      fa: 'شاعران و نویسندگان جوان جنوب کرمان با برگزاری نشست‌های هفتگی نقد ادبی، پیوندی تازه میان ادبیات کلاسیک فارسی و زیست معاصر منطقه ساخته‌اند.',
      en: 'Young writers and poets in Jiroft gather weekly to bridge classical Persian literary traditions with contemporary life in South Kerman.',
    },
    body: {
      fa: [
        'در سالن‌های آرام کتابخانه‌ها و محافل فرهنگی جیرفت و ساردوئیه، هر هفته جمعی از شاعران، پژوهشگران جوان و علاقه‌مندان ادبیات گرد هم می‌آیند تا در فضایی صمیمی اما جدی به خوانش و نقد آثار تازه بپردازند.',
        'صادق نیک‌نفس و جمعی از پیشکسوتان شعر منطقه بر این باورند که استمرار این محافل، علاوه بر پرورش قلم‌های تازه، نقش مهمی در مستندسازی گویش‌ها، ضرب‌المثل‌ها و حافظه شفاهی روستاهای جنوب کرمان ایفا می‌کند.',
        'برگزارکنندگان این نشست‌ها برنامه‌ریزی کرده‌اند مجموعه گزیده‌ای از شعرها و روایت‌های مستند منطقه را در قالب یک فصلنامه دیجیتال آزاد منتشر کنند.',
      ],
      en: [
        'Inside quiet libraries and cultural parlors across Jiroft and Sarduiyeh, weekly literary salons are drawing poets, essayists, and university students into lively editorial critique.',
        'Senior literary voices emphasize that sustaining these grassroots gatherings preserves local dialects, oral histories, and folk idioms that rarely appear in national archives.',
        'Organizers plan to compile the year’s finest essays and poems into an open-access regional quarterly.',
      ],
    },
    category: 'culture',
    region: 'jiroft',
    author: { fa: 'نسترن سالاری', en: 'Nastaran Salari' },
    authorRole: { fa: 'دبیر میز فرهنگ و هنر', en: 'Culture & Heritage Editor' },
    coverImage: EDITORIAL_IMAGES.communityCulture,
    imageCaption: {
      fa: 'نگاره ۵ — میز محفل ادبی و نسخه‌های شعر کلاسیک در یکی از خانه‌های فرهنگی جنوب کرمان.',
      en: 'Fig. 5 — Classical poetry manuscripts and tea arranged for an evening literary circle in Kerman.',
    },
    publishedAt: '2026-11-18T11:30:00Z',
    readTimeMin: 4,
    views: 2640,
    status: 'published',
    featuredInHero: false,
  },
  {
    id: 'art-6',
    slug: 'rural-councils-south-kerman-infrastructure-dialogue',
    title: {
      fa: 'نشست بخشداران و دهیاران جنوب کرمان؛ اولویت‌بندی زیرساخت‌های راه روستایی، اینترنت و آبرسانی پایدار',
      en: 'South Kerman Rural Councils Prioritize Feeder Roads, Broadband Access, and Drinking Water',
    },
    deck: {
      fa: 'در گردهمایی دهیاران و مسئولان امور روستایی استانداری، تکمیل پروژه‌های نیمه‌تمام روستاهای کوهستانی ساردوئیه و بخش‌های پیرامونی در دستور کار قرار گرفت.',
      en: 'Village administrators and provincial planners align funding milestones for rural roads, highland connectivity, and resilient water networks.',
    },
    body: {
      fa: [
        'در نشست تخصصی بخشداران و دهیاران شهرستان‌های جنوبی استان کرمان، مسئله توزیع متوازن اعتبارات عمرانی میان مناطق دشت و روستاهای صعب‌العبور کوهستانی به‌عنوان محور اصلی گفت‌وگوها مطرح شد.',
        'دهیاران بخش ساردوئیه با ارائه گزارش مستند از وضعیت آنتن‌دهی ارتباطی و جاده‌های بین‌روستایی، خواستار تسریع در بهره‌برداری از دکل‌های جدید ارتباطی و بهسازی نقاط حادثه‌خیز پیش از آغاز بارندگی‌های زمستانی شدند.',
        'مدیرکل امور روستایی استانداری در پایان این نشست از تشکیل کارگروه پیگیری ماهانه با مشارکت مستقیم نمایندگان روستاها برای رصد شفاف پیشرفت پروژه‌ها خبر داد.',
      ],
      en: [
        'District governors and village councils across South Kerman met with provincial development directors to review equitable capital allocation between valley municipalities and remote highland communities.',
        'Representatives from Sarduiyeh presented field audits detailing mobile coverage gaps and winter road maintenance priorities, calling for accelerated completion ahead of heavy snowfall.',
        'Officials announced a monthly public tracking dashboard co-monitored by local village delegates to improve project transparency.',
      ],
    },
    category: 'social',
    region: 'south-kerman',
    author: { fa: 'سرویس اجتماعی نبض ساردو', en: 'Nabz Sardo Civic Desk' },
    authorRole: { fa: 'گزارش شهری و روستایی', en: 'Civic & Rural Affairs' },
    coverImage: EDITORIAL_IMAGES.sarduiyehHighlands,
    imageCaption: {
      fa: 'نگاره ۶ — مسیرهای ارتباطی و آبادی‌های کوهستانی در بخش ساردوئیه.',
      en: 'Fig. 6 — Highland settlements and mountain access corridors in Sarduiyeh district.',
    },
    publishedAt: '2026-11-19T08:45:00Z',
    readTimeMin: 4,
    views: 2980,
    status: 'published',
    featuredInHero: false,
  },
  {
    id: 'art-7',
    slug: 'kerman-timber-transport-ban-environmental-protection',
    title: {
      fa: 'اجرای قاطع ممنوعیت حمل محموله‌های چوب در استان کرمان برای حفاظت از جنگل‌های بومی و باغات',
      en: 'Kerman Enforces Strict Ban on Unauthorized Timber Transport to Protect Native Woodlands',
    },
    deck: {
      fa: 'دستگاه‌های نظارتی و منابع طبیعی با هدف مقابله با قاچاق چوب و حفظ پوشش گیاهی کوهستان‌های جنوب، کنترل محورهای مواصلاتی را تشدید کردند.',
      en: 'Natural resources inspectors intensify highway checkpoints across Kerman province to curb illegal logging and safeguard fragile mountain ecosystems.',
    },
    body: {
      fa: [
        'اداره کل منابع طبیعی و آبخیزداری استان کرمان با همراهی پلیس راه، طرح تشدید نظارت و ممنوعیت حمل بدون مجوز هرگونه محموله چوب جنگلی و باغی را در محورهای جنوب و مرکز استان به اجرا گذاشت.',
        'تخریب درختان کهن‌سال بادام کوهی، بنه و درختان باغی در مناطق ییلاقی خلال سال‌های اخیر نگرانی جدی دوستداران محیط زیست و ساکنان بومی را برانگیخته بود. بر اساس دستورالعمل جدید، حمل چوب تنها با مجوز الکترونیکی قابل استعلام امکان‌پذیر است.',
        'کنشگران محیط زیست ساردوئیه ضمن استقبال از این اقدام، بر ضرورت مشارکت جوامع محلی و همیاران طبیعت در پاسداری از دامنه‌های بحرآسمان تأکید کردند.',
      ],
      en: [
        'Kerman’s Natural Resources Authority and highway patrol have activated a province-wide ban on uncertified timber transport along southern and central freight corridors.',
        'Illegal felling of mature wild almond, pistachio, and orchard trees has alarmed conservationists and rural residents alike. Under the new directive, every commercial load requires verifiable digital clearance.',
        'Local environmental volunteers in Sarduiyeh welcomed the enforcement while calling for expanded community ranger programs.',
      ],
    },
    category: 'incidents',
    region: 'anbarabad',
    author: { fa: 'میلاد کرمانی‌نژاد', en: 'Milad Kermaninejad' },
    authorRole: { fa: 'گزارشگر محیط زیست و حوادث', en: 'Environment & Safety Reporter' },
    coverImage: EDITORIAL_IMAGES.mountainWeather,
    imageCaption: {
      fa: 'نگاره ۷ — محور مواصلاتی کوهستانی جنوب کرمان در ساعات عصر.',
      en: 'Fig. 7 — Mountain transit corridor in South Kerman under evening skies.',
    },
    publishedAt: '2026-11-17T15:10:00Z',
    readTimeMin: 3,
    views: 3120,
    status: 'published',
    featuredInHero: false,
  },
  {
    id: 'art-8',
    slug: 'opinion-independent-local-journalism-south-kerman',
    title: {
      fa: 'سرمقاله | چرا روزنامه‌نگاری مستقل محلی برای آینده جنوب کرمان حیاتی است؟',
      en: 'Editorial | Why Independent Local Journalism Matters for the Future of South Kerman',
    },
    deck: {
      fa: 'در عصر خبرهای شتاب‌زده و شایعات شبکه‌های اجتماعی، رسانه محلی معتبر می‌تواند صدای دقیق مردم ساردوئیه، جیرفت و کهنوج را به تصمیم‌سازان برساند.',
      en: 'In an era of viral rumor, disciplined local reporting turns the lived realities of Sarduiyeh, Jiroft, and Kahnuj into accountable civic dialogue.',
    },
    body: {
      fa: [
        'رسانه محلی وقتی معنا پیدا می‌کند که میان هیجان لحظه‌ای و حقیقت مستند، دومی را برگزیند. تجربه سال‌های اخیر نشان داده است که بسیاری از چالش‌های واقعی مناطق غیرمرکزی—از آب کشاورزی و ایمنی جاده‌های کوهستانی گرفته تا موفقیت دانش‌آموزان و هنرمندان بومی—در جریان شلوغ رسانه‌های سراسری کمتر فرصت دیده‌شدن عمیق می‌یابند.',
        '«نبض ساردو» در دوره تازه فعالیت خود می‌کوشد با بازطراحی کامل ساختار تحریریه و تکیه بر گزارش‌های میدانی، داده دقیق و مشارکت شفاف شهروندان از طریق بخش ارسال خبر مردمی، الگویی حرفه‌ای و آبرومند از روزنامه‌نگاری منطقه‌ای بسازد.',
        'باور ما ساده و روشن است: از دل منطقه، برای آینده منطقه. هر روایت مستندی که امروز ثبت می‌شود، سندی برای فردای روشن‌تر جنوب کرمان خواهد بود.',
      ],
      en: [
        'Local journalism earns its trust the moment it chooses verified field reporting over viral haste. Far too often, the vital realities of regional communities—mountain road safety, agricultural water stewardship, and youth achievement—go underreported in national feeds.',
        'With this ground-up editorial renewal, Nabz Sardo commits to calm typographic clarity, verifiable reporting, and open citizen participation across Sarduiyeh, Jiroft, Anbarabad, and Kahnuj.',
        'Our guiding conviction remains unchanged: from the heart of the region, for the future of the region.',
      ],
    },
    pullQuote: {
      fa: '«از دل منطقه، برای آینده منطقه؛ روزنامه‌نگاری محلی زمانی اثرگذار است که دقت و انصاف را بر سرعت بی‌حاصل ترجیح دهد.»',
      en: '"From the heart of the region, for the future of the region—impactful reporting always places rigor and fairness ahead of noise."',
    },
    category: 'opinion',
    region: 'kahnuj',
    author: { fa: 'سردبیری نبض ساردو', en: 'Nabz Sardo Editorial Board' },
    authorRole: { fa: 'سرمقاله و یادداشت', en: 'Editorial & Analysis' },
    coverImage: EDITORIAL_IMAGES.kermanHeritage,
    imageCaption: {
      fa: 'نگاره ۸ — بازتاب معماری سنتی در آبگیر آرام؛ استعاره‌ای از شفافیت و تامل در رسانه.',
      en: 'Fig. 8 — Architectural reflection in a tranquil courtyard pool, symbolizing clarity and reflection.',
    },
    publishedAt: '2026-11-16T07:00:00Z',
    readTimeMin: 5,
    views: 4290,
    status: 'published',
    featuredInHero: false,
  },
];

export const INITIAL_CITIZEN_REPORTS: CitizenReport[] = [
  {
    id: 'cit-1',
    title: 'نیاز فوری به نصب تابلوهای شبرنگ و گاردریل در پیچ ورودی روستای گور ساردوئیه',
    description:
      'با شروع فصل مه و بارندگی در ارتفاعات ساردوئیه، دید رانندگان در پیچ ورودی روستای گور به‌شدت کاهش می‌یابد. اهالی روستا درخواست نصب علائم هشداردهنده و خط‌کشی جدید پیش از زمستان را دارند.',
    region: 'sarduiyeh',
    category: 'incidents',
    reporterName: 'حسین رضایی (شهروند ساردوئیه)',
    contact: '۰۹۱۳-۰۰۰-۰۰۰۰',
    submittedAt: '2026-11-20T16:20:00Z',
    status: 'pending',
  },
  {
    id: 'cit-2',
    title: 'درخشش دانش‌آموزان مدارس جیرفت و کسب رتبه‌های برتر کشوری در المپیاد مهارتی',
    description:
      'تیم دانش‌آموزی مدارس جیرفت با ارائه طرح هوشمند آبیاری قطره‌ای ویژه باغات جنوب کرمان موفق به کسب رتبه اول کشوری شد و مورد تقدیر داوران قرار گرفت.',
    region: 'jiroft',
    category: 'social',
    reporterName: 'زهرا محمدی',
    submittedAt: '2026-11-20T12:10:00Z',
    status: 'pending',
  },
];
