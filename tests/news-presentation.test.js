const test=require('node:test');
const assert=require('node:assert/strict');
const {presentArticle,deskPresentation,stripSourceAttribution,cleanImportedTypography}=require('../lib/news-presentation');
const {home,article}=require('../lib/view-public');
const {card}=require('../lib/view-common');
const designated={id:'manager',slug:'manager',status:'published',categoryId:'city-village',title:'مدیرکل مدیریت بحران استان کرمان',lead:'اختصاص ۲۰۰ میلیارد تومان اعتبار برای ساماندهی رودخانه ملنتی',body:'جزئیات کامل خبر',createdAt:'2026-09-30T10:00:00Z'};
const db={settings:{},categories:[{id:'city-village',name:'سیاسی'},{id:'agriculture',name:'کشاورزی'},{id:'culture',name:'فرهنگ'},{id:'sports',name:'ورزش'}],articles:[designated,{id:'culture',slug:'culture',status:'published',categoryId:'culture',title:'جشنواره فرهنگ منطقه',createdAt:'2026-09-29T10:00:00Z'}]};
test('a designation headline presents its news lead as the title without altering the stored article',()=>{
 const original=JSON.stringify(designated),shown=presentArticle(designated);
 assert.equal(shown.title,designated.lead);
 assert.equal(shown.kicker,designated.title);
 assert.equal(shown.lead,'');
 assert.equal(JSON.stringify(designated),original);
 assert.deepEqual(presentArticle(shown),shown);
 const ordinary={...designated,title:'افتتاح یک طرح عمرانی'};
 assert.equal(presentArticle(ordinary),ordinary);
 const second={...designated,title:'معاون قضایی دادگستری کرمان',lead:'سوخت‌برها مسیر درب‌بهشت ـ جیرفت را ناامن کرده‌اند'};
 assert.equal(presentArticle(second).title,second.lead);
 assert.equal(presentArticle({...designated,lead:''}).title,designated.title);
});
test('headline presentation stays consistent in home, cards, article and share metadata',()=>{
 for(const html of [home(db),card(designated,db),article(db,designated)]){
  assert.ok(html.includes(designated.lead));
  assert.ok(html.includes(designated.title));
 }
 const detail=article(db,designated);
 assert.match(detail,/data-article-title="اختصاص ۲۰۰ میلیارد تومان/);
 assert.match(detail,/property="og:title" content="اختصاص ۲۰۰ میلیارد تومان/);
 assert.match(detail,/article-newsroom-mark">مدیرکل مدیریت بحران استان کرمان/);
 assert.ok(detail.indexOf('<h1>')<detail.indexOf('class="article-reading-zone"'));
});
test('Claude homepage links to valid categories, searches and current stories',()=>{
 const html=home(db);
 assert.match(html,/href="\/category\/city-village"/);
 assert.match(html,/href="\/news\/culture"/);
 assert.match(html,/href="\/category\/sports"/);
 assert.match(html,/href="\/local\/anbarabad"/);
 assert.match(html,/href="\/local\/kahnuj"/);
 assert.doesNotMatch(html,/خبرها و گزارش‌های منتخب این حوزه/);
});
test('congratulations and condolences retain their editorial classification',()=>{
 const text='روز آتش‌نشان را به همه آتش‌نشانان تبریک می‌گوییم.';
 const desk=deskPresentation({breakingText:text});
 assert.equal(desk.kind,'announcement');assert.equal(desk.textFa,text);
 assert.equal(deskPresentation({breakingText:'هشدار فوری سیلاب در جنوب کرمان'}).kind,'breaking');
 assert.equal(deskPresentation({liveDeskEnabled:false,breakingText:text}).kind,'off');
 assert.equal(deskPresentation({breakingText:text,breakingKind:'news'}).kind,'breaking');
 assert.equal(deskPresentation({}).kind,'desk');
});


test('monitored Persian text is normalized and decorative Telegram bullets become paragraphs',()=>{
 const imported={
  id:'telegram-clean',
  slug:'telegram-clean',
  status:'published',
  imported:true,
  categoryId:'social',
  title:'داستان جیرفت: کشتوصنعت با سرمایه‌گذاری در مسئولیت های اجتماعی، از ورزش و اشتغال تا توسعه صنایع تبدیلی نقش آفرینی کند',
  lead:'',
  body:'⭕ داستان جیرفت: کشتوصنعت با سرمایه‌گذاری در مسئولیت های اجتماعی، از ورزش و اشتغال تا توسعه صنایع تبدیلی نقش آفرینی کند 🔷 در دیدار مهندس بینا، مدیرعامل کشتوصنعت، به همراه اعضای هیئت مدیره با حسن صابر، ظرفیت‌های همکاری بررسی شد. 🔷 حسن صابر بر به روز شدن فعالیت‌های اقتصادی و سرمایه‌گذاری در مسئولیت های اجتماعی تاکید کرد.',
  bodyHtml:'',
  sourceName:'تلگرام — کانال خبری کنارصندل',
  createdAt:'2026-10-11T12:00:00Z'
 };
 const shown=presentArticle(imported);
 assert.match(shown.title,/کشت و صنعت/);
 assert.match(shown.title,/مسئولیت‌های اجتماعی/);
 assert.match(shown.title,/نقش‌آفرینی/);
 assert.doesNotMatch(shown.body,/⭕|🔷/u);
 assert.doesNotMatch(shown.body,/^داستان جیرفت:/);
 assert.match(shown.body,/هیئت‌مدیره/);
 assert.match(shown.body,/به‌روز/);
 assert.match(shown.bodyHtml,/<p>در دیدار/);
 assert.ok((shown.bodyHtml.match(/<p>/g)||[]).length>=2);
 assert.equal(cleanImportedTypography('کشتوصنعت و مسئولیت های اجتماعی'),'کشت و صنعت و مسئولیت‌های اجتماعی');
});

test('monitored news never exposes the monitored source in public presentation',()=>{
 const imported={
  id:'imported-source-lock',
  slug:'imported-source-lock',
  status:'published',
  imported:true,
  categoryId:'city-village',
  title:'جلسه استماع برنامه‌های وزیر پیشنهادی دفاع برگزار می‌شود',
  lead:'به گزارش خبرگزاری مهر، جلسات استماع در مجلس برگزار می‌شود.',
  body:'https://mehrnews.com/x3dhxd\n\nبه گزارش خبرگزاری مهر، متن کامل خبر در این بخش قرار دارد.\n\nمنبع: خبرگزاری مهر — سیاست کشور',
  bodyHtml:'<p>https://mehrnews.com/x3dhxd</p><p>به گزارش خبرگزاری مهر، متن کامل خبر در این بخش قرار دارد.</p><p>منبع: خبرگزاری مهر — سیاست کشور</p>',
  author:'خبرگزاری مهر — سیاست کشور',
  sourceName:'خبرگزاری مهر — سیاست کشور',
  sourceUrl:'https://mehrnews.com/x3dhxd',
  createdAt:'2026-10-10T12:00:00Z',
  publishedAt:'2026-10-10T12:00:00Z'
 };
 const shown=presentArticle(imported);
 assert.equal(shown.author,'تحریریه نبض ساردو');
 assert.doesNotMatch(shown.lead,/مهر|mehrnews/i);
 assert.doesNotMatch(shown.body,/مهر|mehrnews|منبع\s*:/i);
 const testDb={settings:{},categories:[{id:'city-village',name:'سیاسی'}],articles:[imported]};
 const html=article(testDb,imported);
 assert.doesNotMatch(html,/mehrnews\.com|خبرگزاری مهر|منبع\s*:/i);
 assert.match(html,/تحریریه نبض ساردو/);
 assert.equal(stripSourceAttribution('https://mehrnews.com/x3dhxd\nمنبع: خبرگزاری مهر',imported),'');
});
