'use strict';
/* ============================================================
   NABEZ SARDO — PREMIUM GLASS HOMEPAGE (2026)
   New markup + premium.css/premium.js, with the approved editorial rules:
   recency-first lead, local stories with real photos in the newest news
   cycle, linked ticker, story-sharing data, WebSite + NewsMediaOrganization.
   ============================================================ */
const {published}=require('./store');
const {e,shell,listingImage,listingExcerpt,shortArticleCode,isBrandedCover,ASSET_VERSION}=require('./view-common');
const {presentArticle}=require('./news-presentation');

const HUES={
  incidents:345,weather:222,agriculture:112,sports:165,tourism:192,social:205,culture:272,
  politics:28,economy:40,education:250,sardouiyeh:38,kerman:18,video:12,'short-news':205,opinion:330
};
const NAME_HUES={'حوادث':345,'آب‌وهوا':222,'کشاورزی':112,'ورزش':165,'گردشگری':192,'اجتماعی':205,'فرهنگ':272,'سیاسی':28,'اقتصادی':40,'آموزش':250,'ساردوئیه':38,'خبر کوتاه':205};

function faNum(v){return Number(v||0).toLocaleString('fa-IR');}
function clean(x='',max=180){
  const v=String(x||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  return v.length>max?v.slice(0,max-1).trim()+'…':v;
}
function ageFa(iso=''){
  const t=new Date(iso).getTime();
  if(!Number.isFinite(t))return 'تازه منتشر شده';
  const d=Math.max(0,Date.now()-t),m=Math.floor(d/60000),h=Math.floor(d/3600000),day=Math.floor(d/86400000);
  if(m<1)return 'همین حالا';
  if(m<60)return `${faNum(m)} دقیقه پیش`;
  if(h<24)return `${faNum(h)} ساعت پیش`;
  if(day===1)return 'دیروز';
  if(day<7)return `${faNum(day)} روز پیش`;
  try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'short',day:'numeric',timeZone:'Asia/Tehran'}).format(new Date(t));}catch{return ''}
}
function categoryOf(db,a){return db.categories.find(c=>c.id===a?.categoryId)||{id:a?.categoryId||'',name:'خبر'};}
function hueOf(c){return HUES[c?.id]||NAME_HUES[c?.name]||40;}
function newsUrl(a){return '/news/'+encodeURIComponent(a.slug);}
function imageOf(a){return listingImage(a);}
function articleLocation(a){return a.location||'ساردوئیه';}
function sortNewest(list){return [...list].sort((a,b)=>new Date(b.publishedAt||b.createdAt||0)-new Date(a.publishedAt||a.createdAt||0));}
function stamp(a){const ms=Date.parse(a.publishedAt||a.createdAt||'');return Number.isFinite(ms)?ms:0;}

const LOCAL_RE=/ساردو|جیرفت|جنوب کرمان|کهنوج|عنبرآباد|دلفارد|جازموریان|رودبار جنوب|منوجان|قلعه[‌ ]گنج|فاریاب/;
const photoReady=a=>!isBrandedCover(imageOf(a));
const isLocal=a=>LOCAL_RE.test([a.location,a.title,a.lead].join(' '));

/* Approved editorial rule: recency leads. A striking but old photo never
   displaces a newer report; within the newest 3-hour cycle a local story with
   a genuine photograph is preferred. */
function pickLead(regular){
  const ranked=[...regular].sort((a,b)=>stamp(b)-stamp(a));
  const newest=ranked[0];
  const now=Date.now();
  const recentEnough=!!newest&&stamp(newest)>now-48*3600000&&stamp(newest)<=now+3600000;
  const cycle=recentEnough?ranked.filter(a=>stamp(a)>=stamp(newest)-3*3600000):[];
  return cycle.find(a=>isLocal(a)&&photoReady(a))||cycle.find(photoReady)||newest||null;
}

/* ---------- inline icons ---------- */
const ICON={
  pulse:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2 17h6l3-6 4 12 4-16 4 12 3-4h4"/></svg>',
  pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>',
  eye:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>',
  clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6"/><path d="M12 7.6V12l3 2"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>',
  search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.6"/><path d="m16 16 4.2 4.2"/></svg>',
  send:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-8.4 18-2.4-7.2L3 11.4 21 3z"/></svg>',
  spark:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.2 6.2l2.6 2.6M15.2 15.2l2.6 2.6M17.8 6.2l-2.6 2.6M8.8 15.2l-2.6 2.6"/></svg>',
  shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5.4c0 4.3 3 7.6 7 9.6 4-2 7-5.3 7-9.6V6l-7-3z"/><path d="m9 12 2 2 4-4"/></svg>'
};
function defs(){return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="prGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5a22"/><stop offset=".42" stop-color="#e4c68d"/><stop offset=".62" stop-color="#fff7e0"/><stop offset="1" stop-color="#8a6626"/></linearGradient></defs></svg>`;}
function brand(){return `<a class="pr-brand" href="/" aria-label="نبض ساردو، صفحه اصلی"><span class="pr-brand__mark">${ICON.pulse}</span><b>نبض ساردو<small>NABEZ SARDO</small></b></a>`;}

function header(db,categories){
  const nav=[
    {href:'/',label:'خانه',cur:true},
    {href:'/all-news',label:'آخرین اخبار'},
    {href:'/category/short-news',label:'خبر کوتاه'},
    ...categories.slice(0,5).map(c=>({href:'/category/'+encodeURIComponent(c.id),label:c.name})),
    {href:'/contact',label:'تماس'}
  ];
  return `<header class="pr-head">
  <div class="pr-wrap pr-head__bar">
    ${brand()}
    <nav class="pr-nav" aria-label="دسته‌های خبری">
      ${nav.map(x=>`<a href="${e(x.href)}"${x.cur?' aria-current="page"':''}>${e(x.label)}</a>`).join('')}
    </nav>
    <div class="pr-tools">
      <form class="pr-search" action="/search" method="get" role="search">
        ${ICON.search}
        <input name="q" type="search" placeholder="جستجو در خبرها…" aria-label="جستجو در خبرهای نبض ساردو">
      </form>
      <div class="pr-accents" role="group" aria-label="رنگ قالب">
        <button type="button" data-accent-option="gold" aria-label="طلایی" aria-pressed="true"></button>
        <button type="button" data-accent-option="emerald" aria-label="زمردی" aria-pressed="false"></button>
        <button type="button" data-accent-option="sapphire" aria-label="یاقوتی آبی" aria-pressed="false"></button>
        <button type="button" data-accent-option="rose" aria-label="گلبهی" aria-pressed="false"></button>
      </div>
      <a class="pr-btn pr-btn--gold" data-magnet href="/send-news">${ICON.send}<span>ارسال خبر</span></a>
    </div>
  </div>
  <div class="pr-wrap pr-mobile-nav">${nav.map(x=>`<a href="${e(x.href)}"${x.cur?' aria-current="page"':''}>${e(x.label)}</a>`).join('')}</div>
</header>`;
}

function coverArt(c,a){
  return `<span class="pr-cover" style="--h:${hueOf(c)}" aria-hidden="true">
      <span class="pr-cover__rings"></span>
      <span class="pr-cover__glyph">${e(c.name)}</span>
      <span class="pr-cover__mono">Nabez Sardo · Local Newsroom</span>
      <span class="pr-cover__inner">
        <span class="pr-cover__line"></span>
        <b class="pr-cover__cat">${e(c.name)}</b>
        <span class="pr-cover__loc">${ICON.pin}${e(articleLocation(a))}</span>
      </span>
    </span>`;
}
const ART={incidents:'road',weather:'mountains',agriculture:'palms',sports:'pulse',tourism:'mountains',social:'dome',culture:'dome',politics:'bazaar',economy:'bazaar',education:'dome',sardouiyeh:'palms',kerman:'bazaar',video:'pulse',opinion:'dome','short-news':'pulse'};
function artOf(c){return '/assets/art/'+(ART[c&&c.id]||'mountains')+'.svg?v='+ASSET_VERSION;}
function mediaFor(db,a,eager,label){
  const c=categoryOf(db,a);
  const engraved=isBrandedCover(imageOf(a));
  const src=engraved?artOf(c):imageOf(a);
  const alt=engraved?c.name:a.title;
  const img=`<img src="${e(src)}" alt="${e(alt)}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
  return `<div class="pr-frame"><span class="pr-frame__matte" aria-hidden="true"><span class="pr-frame__label">${e(label||c.name)}</span></span><div class="pr-frame__art">${img}</div></div>`;
}

function ticker(items){
  if(!items.length)return '';
  const row=items.map(a=>`<a href="${e(newsUrl(a))}"><em>${e(ageFa(a.publishedAt||a.createdAt))}</em>${e(clean(a.title,88))}</a>`).join('');
  return `<div class="pr-wrap"><div class="pr-ticker" aria-label="آخرین تیترهای منتشرشده">
    <span class="pr-ticker__tag"><i aria-hidden="true"></i>آخرین خبر</span>
    <div class="pr-ticker__viewport"><div class="pr-ticker__track" data-ticker>${row}<span class="pr-ticker__dup" aria-hidden="true">${row}</span></div></div>
  </div></div>`;
}

function feature(db,a){
  if(!a)return '<div class="pr-glass" style="padding:40px;text-align:center;color:#9d978e">در انتظار انتشار خبرهای تازه</div>';
  const c=categoryOf(db,a);
  return `<a class="pr-feature pr-rv pr-rv--scale" data-tilt href="${e(newsUrl(a))}" style="--h:${hueOf(c)}" aria-label="مطالعه خبر: ${e(a.title)}">
    <div class="pr-feature__media">${mediaFor(db,a,true,'گزارش برگزیده · '+c.name)}</div>
    <div class="pr-feature__top">
      <span class="pr-feature__badge"><i aria-hidden="true"></i>گزارش برگزیده · ${e(c.name)}</span>
      <span class="pr-feature__time">${e(ageFa(a.publishedAt||a.createdAt))}</span>
    </div>
    <div class="pr-feature__body">
      <h2 dir="auto">${e(a.title)}</h2>
      <p>${e(listingExcerpt(a,'fa',150))}</p>
      <div class="pr-feature__meta">
        <span>${ICON.pin}${e(articleLocation(a))}</span>
        <span>${ICON.eye}${faNum(a.views)} بازدید</span>
      </div>
    </div>
    <span class="pr-feature__go" aria-hidden="true">${ICON.arrow}</span>
  </a>`;
}

function stats(list,categories){
  const views=list.reduce((s,a)=>s+Number(a.views||0),0);
  return `<div class="pr-stats">
    <div class="pr-stat"><b data-count="${list.length}">۰</b><span>خبر منتشرشده</span></div>
    <div class="pr-stat"><b data-count="${views}">۰</b><span>بازدید کل</span></div>
    <div class="pr-stat"><b data-count="${categories.length}">۰</b><span>سرویس خبری</span></div>
  </div>`;
}

function hero(db,lead,all,categories){
  return `<section class="pr-hero">
  <div class="pr-wrap pr-hero__grid">
    <div class="pr-hero__copy">
      <span class="pr-eyebrow"><i aria-hidden="true"></i>رسانه مستقل جنوب کرمان</span>
      <h1>نبض ساردوئیه؛<br><b>روایتِ دقیقِ</b> جنوب کرمان</h1>
      <p class="pr-hero__lead">خبرهای ساردوئیه، جیرفت و جنوب کرمان را با <b>روایت انسانی، راستی‌آزمایی و نگاه محلی</b> بخوانید — سریع، شفاف و بدون هیاهو.</p>
      <div class="pr-hero__cta">
        <a class="pr-btn pr-btn--gold" data-magnet href="/all-news">${ICON.spark}<span>آخرین اخبار</span></a>
        <a class="pr-btn pr-btn--ghost" href="/send-news">${ICON.send}<span>خبر مردمی بفرستید</span></a>
      </div>
      <p class="pr-hero__note">${ICON.shield}تحریریه مستقل · انتشار با راستی‌آزمایی</p>
      ${stats(all,categories)}
    </div>
    <div class="pr-hero__stage">${feature(db,lead)}</div>
  </div>
</section>`;
}

function sectionHead(title,sub,href,moreLabel){
  return `<div class="pr-sec__head">
    <h2 class="pr-sec__title">${e(title)}<small>${e(sub)}</small></h2>
    ${href?`<a class="pr-sec__more" href="${e(href)}">${e(moreLabel||'مشاهده همه')}${ICON.arrow}</a>`:''}
  </div>`;
}

function card(db,a,i){
  const c=categoryOf(db,a);
  return `<a class="pr-card pr-rv" style="--h:${hueOf(c)};--i:${i}" href="${e(newsUrl(a))}"
    aria-label="مطالعه خبر: ${e(a.title)}"
    data-story-card data-story-title-fa="${e(a.title)}" data-story-image="${e(imageOf(a))}"
    data-story-lead-fa="${e(clean(a.lead||a.body||'',140))}" data-story-url="/news/${e(shortArticleCode(a.id))}">
    <div class="pr-card__media">
      ${mediaFor(db,a,false,c.name)}
      <span class="pr-card__chip"><i aria-hidden="true"></i>${e(c.name)}</span>
    </div>
    <div class="pr-card__body">
      <h3 dir="auto">${e(a.title)}</h3>
      <p>${e(listingExcerpt(a,'fa',105))}</p>
      <div class="pr-card__foot">
        <em>${ICON.clock}${e(ageFa(a.publishedAt||a.createdAt))}</em>
        <em>${ICON.eye}${faNum(a.views)}</em>
      </div>
    </div>
  </a>`;
}

function shortList(db,items){
  if(!items.length)return '<p class="pr-list__empty">خبر کوتاهی ثبت نشده است.</p>';
  return items.map(a=>{
    const c=categoryOf(db,a);
    return `<a class="pr-list__item" style="--h:${hueOf(c)}" href="${e(newsUrl(a))}">
      <span class="pr-list__bar" aria-hidden="true"></span>
      <div><b>${e(a.title)}</b><span><time>${e(ageFa(a.publishedAt||a.createdAt))}</time> · ${e(c.name)}</span></div>
    </a>`;
  }).join('');
}

function mostRead(items){
  return items.map((a,i)=>`<a class="pr-rank" href="${e(newsUrl(a))}">
    <em>${faNum(i+1)}</em>
    <div><b>${e(a.title)}</b><span>${ICON.eye.replace('<svg','<svg class="pr-inline-ico"')} ${faNum(a.views)} بازدید</span></div>
  </a>`).join('');
}

function categoryTiles(categories){
  return categories.map(c=>`<a class="pr-cat pr-rv" style="--h:${hueOf(c)}" href="/category/${encodeURIComponent(c.id)}">
    <div><b>${e(c.name)}</b><small>سرویس خبری</small></div>
    <span aria-hidden="true">${ICON.arrow}</span>
  </a>`).join('');
}

function footer(){
  return `<footer class="pr-foot">
  <div class="pr-wrap">
    <div class="pr-foot__grid">
      <div>
        <div class="pr-foot__brand"><span class="pr-brand__mark">${ICON.pulse}</span><b>نبض ساردو</b></div>
        <p>رسانه محلی مستقل ساردوئیه و جنوب کرمان؛ خبر دقیق، روایت انسانی و هویت منطقه.</p>
      </div>
      <div>
        <h4>رسانه</h4>
        <a href="/about">درباره ما</a>
        <a href="/contact">تماس با تحریریه</a>
        <a href="/about#editorial">سیاست تحریریه</a>
      </div>
      <div>
        <h4>دسترسی</h4>
        <a href="/all-news">آرشیو خبرها</a>
        <a href="/category/short-news">خبر کوتاه</a>
        <a href="/send-news">ارسال خبر مردمی</a>
        <a href="/admin">ورود تحریریه</a>
      </div>
      <div>
        <h4>پوشش محلی</h4>
        <a href="/local/sardouiyeh">ساردوئیه</a>
        <a href="/local/jiroft">جیرفت</a>
        <a href="/local/south-kerman">جنوب کرمان</a>
      </div>
    </div>
    <div class="pr-foot__bar">
      <span>© ${new Date().toLocaleDateString('fa-IR-u-ca-persian',{year:'numeric'})} نبض ساردو — تمامی حقوق محفوظ است.</span>
      <span>${ICON.spark}طراحی پریمیوم · نسخه ۲۰۲۶</span>
    </div>
  </div>
</footer>`;
}

function home(db){
  const sorted=sortNewest(published(db).map(presentArticle));
  const regular=sorted.filter(a=>a.categoryId!=='short-news');
  const lead=pickLead(regular)||sorted[0]||null;
  const remaining=regular.filter(a=>!lead||a.id!==lead.id);
  const latest=remaining.slice(0,6);
  const categories=[...db.categories].filter(c=>c.id!=='short-news');
  const shortsRaw=sorted.filter(a=>a.categoryId==='short-news');
  const shorts=(shortsRaw.length?shortsRaw:regular.slice(0,5)).slice(0,5);
  const popular=[...regular].sort((a,b)=>Number(b.views||0)-Number(a.views||0)).slice(0,6);
  const tickerItems=sorted.slice(0,5);

  const schema=[
    {'@context':'https://schema.org','@type':'WebSite',name:'نبض ساردو',alternateName:'Nabez Sardo',url:'https://nabzesardo.ir/',inLanguage:'fa-IR',potentialAction:{'@type':'SearchAction',target:'https://nabzesardo.ir/search?q={search_term_string}','query-input':'required name=search_term_string'}},
    {'@context':'https://schema.org','@type':'NewsMediaOrganization',name:'نبض ساردو',alternateName:'Nabez Sardo',url:'https://nabzesardo.ir/',logo:'https://nabzesardo.ir/assets/logo.svg',description:'رسانه محلی ساردوئیه، جیرفت و جنوب کرمان',areaServed:[{'@type':'Place',name:'ساردوئیه'},{'@type':'Place',name:'جیرفت'},{'@type':'Place',name:'جنوب کرمان'}]}
  ];

  const headExtra=[
    `<link rel="stylesheet" href="/assets/fonts.css?v=${ASSET_VERSION}">`,
    `<link rel="stylesheet" href="/assets/premium.css?v=${ASSET_VERSION}">`
  ].join('');

  const body=`
${defs()}
<div class="pr-sky" aria-hidden="true"><i class="pr-orb pr-orb--a"></i><i class="pr-orb pr-orb--b"></i><i class="pr-orb pr-orb--c"></i></div>
<div class="pr-grain" aria-hidden="true"></div>
${header(db,categories)}
${ticker(tickerItems)}
<main class="pr-main">
  ${hero(db,lead,sorted,categories)}
  <section class="pr-sec">
    <div class="pr-wrap">
      ${sectionHead('آخرین اخبار','Latest stories','/all-news','آرشیو کامل')}
      <div class="pr-grid">${latest.map((a,i)=>card(db,a,i)).join('')||'<div class="pr-glass" style="padding:34px;text-align:center;color:#9d978e">در انتظار انتشار خبرهای تازه</div>'}</div>
    </div>
  </section>
  <section class="pr-sec">
    <div class="pr-wrap pr-split">
      <div class="pr-glass pr-panel">
        ${sectionHead('خبر کوتاه','Short briefs','/category/short-news','همه خبرهای کوتاه')}
        ${shortList(db,shorts)}
      </div>
      <div class="pr-glass pr-panel">
        ${sectionHead('پربازدیدترین‌ها','Most read',null)}
        ${mostRead(popular)}
      </div>
    </div>
  </section>
  <section class="pr-sec">
    <div class="pr-wrap">
      ${sectionHead('موضوع‌ها','Topics',null)}
      <div class="pr-cats">${categoryTiles(categories.slice(0,8))}</div>
    </div>
  </section>
  <section class="pr-wrap">
    <div class="pr-cta pr-rv">
      <h2>شما هم خبرنگار ساردوئیه‌اید</h2>
      <p>چیزی دیده‌اید که مردم باید بدانند؟ خبر، عکس یا ویدئو را برای تحریریه بفرستید؛ با نام شما منتشر می‌شود.</p>
      <div class="pr-cta__row">
        <a class="pr-btn pr-btn--gold" data-magnet href="/send-news">${ICON.send}<span>ارسال خبر مردمی</span></a>
        <a class="pr-btn pr-btn--ghost" href="/about">${ICON.shield}<span>درباره تحریریه</span></a>
      </div>
    </div>
  </section>
</main>
${footer()}
<script src="/assets/premium.js?v=${ASSET_VERSION}" defer></script>`;

  return shell('نبض ساردو | تازه‌ترین اخبار ساردوئیه و جنوب کرمان',body,'آخرین اخبار ساردوئیه، جیرفت و جنوب کرمان از رسانه مستقل نبض ساردو',{canonical:'/',schema,bodyClass:'pr-body',localFonts:true,headExtra});
}
module.exports=home;
