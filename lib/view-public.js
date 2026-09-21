const {published}=require('./store');
const {e,shell,header,footer,card,oldBody,imageRatio,imageOrientation,absoluteUrl,PUBLIC_BASE,catEn}=require('./view-common');

function compactText(v='',max=160){
  const s=String(v||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return s.length>max?s.slice(0,max-1).trim()+'…':s;
}
function siteSchema(){
  return [
    {'@context':'https://schema.org','@type':'WebSite',name:'نبض ساردو',alternateName:'Nabez Sardo',url:PUBLIC_BASE+'/',inLanguage:'fa-IR',potentialAction:{'@type':'SearchAction',target:absoluteUrl('/search?q={search_term_string}'),'query-input':'required name=search_term_string'}},
    {'@context':'https://schema.org','@type':'NewsMediaOrganization',name:'نبض ساردو',alternateName:'Nabez Sardo',url:PUBLIC_BASE+'/',description:'رسانه محلی ساردوئیه، جیرفت و جنوب کرمان',areaServed:[{'@type':'Place',name:'ساردوئیه'},{'@type':'Place',name:'جیرفت'},{'@type':'Place',name:'جنوب کرمان'}]}
  ];
}
function articleSchema(a,c){
  const url=absoluteUrl('/news/'+encodeURIComponent(a.slug));
  const authorName=a.author||'تحریریه نبض ساردو';
  const authorType=authorName.includes('تحریریه')?'Organization':'Person';
  const news={'@context':'https://schema.org','@type':'NewsArticle',mainEntityOfPage:{'@type':'WebPage','@id':url},headline:a.title,description:compactText(a.lead||a.body||a.title,220),datePublished:a.publishedAt||a.createdAt,dateModified:a.updatedAt||a.publishedAt||a.createdAt,inLanguage:'fa-IR',isAccessibleForFree:true,articleSection:c?.name||'خبر',keywords:[c?.name,a.location,'ساردوئیه','جیرفت','جنوب کرمان'].filter(Boolean).join(', '),author:{'@type':authorType,name:authorName},publisher:{'@type':'NewsMediaOrganization',name:'نبض ساردو',url:PUBLIC_BASE+'/'},url};
  if(a.image)news.image=[absoluteUrl(a.image)];
  const crumb={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'صفحه اصلی',item:PUBLIC_BASE+'/'},{'@type':'ListItem',position:2,name:c?.name||'خبر',item:absoluteUrl('/category/'+encodeURIComponent(a.categoryId||''))},{'@type':'ListItem',position:3,name:a.title,item:url}]};
  return [news,crumb];
}

function home(db){
 const allNews=published(db);
 const leadStory=allNews.find(a=>a.featured)||allNews[0]||null;
 const highlightNews=allNews.filter(a=>!leadStory||a.id!==leadStory.id).slice(0,4);
 const usedIds=new Set([leadStory?.id,...highlightNews.map(a=>a.id)].filter(Boolean));
 const freshNews=allNews.filter(a=>!usedIds.has(a.id)).slice(0,8);
 const latest=freshNews.length?freshNews:allNews.slice(0,8);
 const popular=[...allNews].sort((a,b)=>Number(b.views||0)-Number(a.views||0)).slice(0,5);
 const categoryOf=a=>db.categories.find(c=>c.id===a?.categoryId);
 const storyUrl=a=>'/news/'+encodeURIComponent(a.slug);
 const leadMarkup=leadStory?(()=>{
   const c=categoryOf(leadStory),url=storyUrl(leadStory),image=leadStory.image||'/assets/placeholder.svg';
   return `<article class="front-lead">
     <a class="front-lead-media" href="${url}"><img src="${e(image)}" alt="${e(leadStory.title)}" loading="lazy" decoding="async"><span class="front-lead-shade"></span></a>
     <div class="front-lead-copy">
       <div class="front-story-meta"><span class="eyebrow"><span class="lang-fa">${e(c?.name||'خبر')}</span><span class="lang-en">${e(catEn(c?.name||'News'))}</span></span><span class="view-badge">◉ ${Number(leadStory.views||0).toLocaleString('fa-IR')}</span></div>
       <h2><a href="${url}"><span class="lang-fa">${e(leadStory.title)}</span><span class="lang-en">${e(leadStory.titleEn||leadStory.title)}</span></a></h2>
       <p><span class="lang-fa">${e(compactText(leadStory.lead||leadStory.body||'',185))}</span><span class="lang-en">${e(compactText(leadStory.leadEn||leadStory.lead||leadStory.body||'',185))}</span></p>
       <div class="front-lead-bottom"><time class="news-date" data-news-date="${e(leadStory.publishedAt||leadStory.createdAt||'')}"></time><a class="more" href="${url}"><span class="lang-fa">ادامه خبر ←</span><span class="lang-en">Read story →</span></a></div>
     </div>
   </article>`;
 })():'<div class="empty">هنوز خبری برای نمایش وجود ندارد.</div>';
 const highlightsMarkup=highlightNews.map((a,i)=>{
   const c=categoryOf(a),url=storyUrl(a),image=a.image||'/assets/placeholder.svg';
   return `<article class="front-brief">
     <a class="front-brief-media" href="${url}"><img src="${e(image)}" alt="${e(a.title)}" loading="lazy" decoding="async" fetchpriority="low"></a>
     <div class="front-brief-copy">
       <div class="front-story-meta"><span class="front-rank">${String(i+1).padStart(2,'0')}</span><span class="eyebrow"><span class="lang-fa">${e(c?.name||'خبر')}</span><span class="lang-en">${e(catEn(c?.name||'News'))}</span></span></div>
       <h3><a href="${url}"><span class="lang-fa">${e(a.title)}</span><span class="lang-en">${e(a.titleEn||a.title)}</span></a></h3>
       <time class="news-date" data-news-date="${e(a.publishedAt||a.createdAt||'')}"></time>
     </div>
   </article>`;
 }).join('');
 const popularMarkup=popular.map((a,i)=>{
   const c=categoryOf(a),url=storyUrl(a);
   return `<article class="popular-row">
     <span class="popular-rank">${String(i+1).padStart(2,'0')}</span>
     <div><span class="eyebrow"><span class="lang-fa">${e(c?.name||'خبر')}</span><span class="lang-en">${e(catEn(c?.name||'News'))}</span></span><h3><a href="${url}"><span class="lang-fa">${e(a.title)}</span><span class="lang-en">${e(a.titleEn||a.title)}</span></a></h3><div class="popular-meta"><span>◉ ${Number(a.views||0).toLocaleString('fa-IR')}</span><time class="news-date" data-news-date="${e(a.publishedAt||a.createdAt||'')}"></time></div></div>
   </article>`;
 }).join('');
 return shell('اخبار ساردوئیه، جیرفت و جنوب کرمان | نبض ساردو',`${header(db)}
 <main><section class="ns-hero-final">
  <div class="ns-hero-final__media">
    <img src="https://d2ol7oe51mr4n9.cloudfront.net/user_32MkkZvMhQKFjHMKrhiL97UtBqA/03895380-5279-4699-9bf8-671489cf2a89.jpg?v=four-seasons-final-1" alt="مسجد ساردوئیه" fetchpriority="high" decoding="async" loading="eager" referrerpolicy="no-referrer">
  </div>
  <div class="ns-hero-final__overlay"></div>
  <div class="wrap ns-hero-final__content">
    <span class="ns-hero-final__badge"><span class="lang-fa">نبض ساردوئیه</span><span class="lang-en">NABEZ SARDOUIYEH</span></span>
    <div class="ns-hero-final__copy">
      <h1><span class="lang-fa">نبض ساردوئیه؛ صدای خبرهای محلی</span><span class="lang-en">Nabez Sardouiyeh — The Voice of Local News</span></h1>
      <p><span class="lang-fa">خبرهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و قابل اعتماد.</span><span class="lang-en">News from Sardouiyeh and South Kerman — fast, accurate and reliable.</span></p>
      <div class="ns-hero-final__actions">
        <a class="btn gold" href="#latest"><span class="lang-fa">تازه‌ترین خبرها</span><span class="lang-en">Latest News</span></a>
        <a class="ns-hero-final__link" href="/about"><span class="lang-fa">درباره تحریریه</span><span class="lang-en">About the Newsroom</span></a>
      </div>
    </div>
    <div class="ns-hero-final__pulse" aria-hidden="true">
      <svg viewBox="0 0 420 110" focusable="false">
        <path class="ns-pulse-path" d="M18 61H112L140 43L164 81L203 20L240 84L273 45L305 61H402"/>
      </svg>
      <small>LIVE / SARDOUIYEH</small>
    </div>
  </div>
</section>
 <section class="breaking"><div class="wrap breaking-row">
   <b class="breaking-label">نبض فوری</b>
   <div class="breaking-marquee" aria-label="نوار خبر فوری">
     <div class="breaking-track">
       <div class="breaking-loop-set"><span class="breaking-item lang-fa">${e(db.settings?.breakingText||'مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.')}</span><span class="breaking-item lang-en">${e(db.settings?.breakingTextEn||'Top local developments from Sardouiyeh and South Kerman — fast, accurate and local.')}</span><span class="breaking-sep">◆</span></div>
       <div class="breaking-loop-set" aria-hidden="true"><span class="breaking-item lang-fa">${e(db.settings?.breakingText||'مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.')}</span><span class="breaking-item lang-en">${e(db.settings?.breakingTextEn||'Top local developments from Sardouiyeh and South Kerman — fast, accurate and local.')}</span><span class="breaking-sep">◆</span></div>
     </div>
   </div>
   <i class="breaking-live">● LIVE DESK</i>
 </div></section>
 <section class="wrap frontpage-desk" aria-label="مهم‌ترین خبرها">
   <div class="sectionhead frontpage-head"><div><span class="eyebrow">TOP STORIES / NEWS DESK</span><h2><span class="lang-fa">تیترهای مهم</span><span class="lang-en">Top Stories</span></h2></div><a class="more" href="/all-news"><span class="lang-fa">همه خبرها</span><span class="lang-en">All News</span></a></div>
   <div class="frontpage-grid">
     ${leadMarkup}
     <aside class="front-briefs" aria-label="خبرهای مهم">${highlightsMarkup||'<div class="empty">خبر دیگری منتشر نشده است.</div>'}</aside>
   </div>
 </section>
 <section class="wrap promo-slot promo-mehr" data-home-banner data-story-title-fa="اول مهر، آغاز مهر" data-story-title-en="A New School Year Begins" data-story-text-fa="بازگشایی مدارس و آغاز سال تحصیلی جدید را به دانش‌آموزان، معلمان و خانواده‌های عزیز تبریک می‌گوییم." data-story-text-en="Wishing students, teachers and families a bright and successful new school year.">
   <div class="promo-glow" aria-hidden="true"></div>
   <div class="promo-copy">
     <span class="promo-kicker"><span class="lang-fa">پیام ویژه نبض ساردو</span><span class="lang-en">NABEZ SARDO SPECIAL</span></span>
     <h2><span class="lang-fa">اول مهر، آغازِ مهر</span><span class="lang-en">A New School Year Begins</span></h2>
     <p><span class="lang-fa">بازگشایی مدارس و آغاز سال تحصیلی جدید را به دانش‌آموزان، معلمان و خانواده‌های عزیز تبریک می‌گوییم.</span><span class="lang-en">Wishing students, teachers and families a bright and successful new school year.</span></p>
     <div class="promo-tags">
       <span><b>۰۱</b><span class="lang-fa">دانش</span><span class="lang-en">Knowledge</span></span>
       <span><b>۰۲</b><span class="lang-fa">امید</span><span class="lang-en">Hope</span></span>
       <span><b>۰۳</b><span class="lang-fa">آینده</span><span class="lang-en">Future</span></span>
     </div>
   </div>
   <div class="promo-visual" aria-hidden="true">
     <div class="school-card">
       <div class="school-sun"></div>
       <svg viewBox="0 0 440 300" role="img">
         <path d="M68 244h304" stroke="currentColor" stroke-width="8" stroke-linecap="round" opacity=".28"/>
         <path d="M106 236V118l114-68 114 68v118" fill="none" stroke="currentColor" stroke-width="12" stroke-linejoin="round"/>
         <path d="M146 236v-68h52v68m44 0v-68h52v68" fill="none" stroke="currentColor" stroke-width="10"/>
         <path d="M202 122h36v36h-36z" fill="none" stroke="currentColor" stroke-width="9"/>
         <path d="M220 50V18m0 0 68 18-68 18" fill="none" stroke="currentColor" stroke-width="9" stroke-linejoin="round"/>
         <path d="M74 214c30-28 54-34 88-36M366 214c-30-28-54-34-88-36" fill="none" stroke="currentColor" stroke-width="6" opacity=".38"/>
       </svg>
       <div class="promo-book pbook-1">A</div>
       <div class="promo-book pbook-2">B</div>
       <div class="promo-pencil"></div>
       <div class="promo-leaf leaf-a">✦</div>
       <div class="promo-leaf leaf-b">✦</div>
     </div>
   </div>
   <button class="promo-story-btn" type="button" data-story-share aria-label="اشتراک در استوری">
     <span class="story-share-icon">↗</span><span class="lang-fa">استوری</span><span class="lang-en">Story</span>
   </button>
   <div class="story-longpress-hint"><span class="lang-fa">برای اشتراک‌گذاری، روی بنر نگه دارید</span><span class="lang-en">Press and hold to share</span></div>
   <div class="story-share-sheet" data-story-sheet hidden>
     <button class="story-sheet-backdrop" type="button" data-story-close aria-label="بستن"></button>
     <div class="story-sheet-card" role="dialog" aria-modal="true" aria-label="اشتراک‌گذاری بنر">
       <span class="story-sheet-handle"></span>
       <h3><span class="lang-fa">اشتراک بنر</span><span class="lang-en">Share banner</span></h3>
       <p><span class="lang-fa">نسخه عمودی ۱۰۸۰×۱۹۲۰ برای استوری آماده می‌شود.</span><span class="lang-en">A 1080×1920 story image will be prepared.</span></p>
       <button class="btn primary story-native-share" type="button" data-story-native><span class="lang-fa">اشتراک در استوری / اینستاگرام</span><span class="lang-en">Share to Story / Instagram</span></button>
       <button class="btn ghost story-download" type="button" data-story-download><span class="lang-fa">ذخیره تصویر استوری</span><span class="lang-en">Save story image</span></button>
       <button class="story-sheet-cancel" type="button" data-story-close><span class="lang-fa">انصراف</span><span class="lang-en">Cancel</span></button>
     </div>
   </div>
 </section>
 <section class="wrap cats">${db.categories.slice(0,7).map(c=>`<a href="/category/${c.id}"><b>✦</b><span>${e(c.name)}</span></a>`).join('')}</section>
 ${db.settings?.adEnabled!==false?`<section class="wrap home-ad-slot" aria-label="جایگاه تبلیغات">
   <a class="home-ad-card" href="${e(db.settings?.adLink||'/contact')}" ${String(db.settings?.adLink||'').startsWith('http')?'target="_blank" rel="noopener sponsored"':''}>
     <div class="home-ad-copy">
       <span class="home-ad-kicker"><span class="lang-fa">تبلیغات</span><span class="lang-en">ADVERTISEMENT</span></span>
       <strong><span class="lang-fa">${e(db.settings?.adTitle||'جای تبلیغات شما اینجاست')}</span><span class="lang-en">${e(db.settings?.adTitleEn||'Your ad could be here')}</span></strong>
       <small><span class="lang-fa">${e(db.settings?.adText||'برای رزرو این جایگاه با نبض ساردو در ارتباط باشید')}</span><span class="lang-en">${e(db.settings?.adTextEn||'Contact Nabez Sardo to reserve this placement')}</span></small>
     </div>
     <div class="home-ad-visual" aria-hidden="true">
       <div class="home-ad-orbit orbit-one"></div>
       <div class="home-ad-orbit orbit-two"></div>
       ${db.settings?.adImage?`<div class="home-ad-device home-ad-uploaded"><img src="${e(db.settings.adImage)}" alt="" loading="lazy" decoding="async" fetchpriority="low"></div>`:`<div class="home-ad-device">
         <svg viewBox="0 0 280 160" role="presentation">
           <defs><linearGradient id="adGlow" x1="0" x2="1"><stop offset="0" stop-color="#7d1839"/><stop offset=".5" stop-color="#d2a85e"/><stop offset="1" stop-color="#7d1839"/></linearGradient></defs>
           <rect x="20" y="24" width="240" height="112" rx="18" fill="#0f141c" stroke="url(#adGlow)" stroke-width="3"/>
           <rect x="38" y="43" width="92" height="74" rx="12" fill="url(#adGlow)" opacity=".18"/>
           <path d="M51 98 72 74l18 17 26-31" fill="none" stroke="#d8b36d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
           <rect x="150" y="50" width="78" height="8" rx="4" fill="#e6d7ba" opacity=".92"/>
           <rect x="150" y="70" width="62" height="7" rx="3.5" fill="#8e98a8" opacity=".65"/>
           <rect x="150" y="89" width="72" height="7" rx="3.5" fill="#8e98a8" opacity=".5"/>
           <rect x="150" y="108" width="42" height="9" rx="4.5" fill="#8f1e42"/>
         </svg>
         <span>AD</span>
       </div>`}
       <div class="home-ad-spark spark-a">✦</div>
       <div class="home-ad-spark spark-b">✦</div>
       <div class="home-ad-spark spark-c">✦</div>
       <div class="home-ad-shine"></div>
     </div>
     <span class="home-ad-cta"><span class="lang-fa">مشاهده / تماس ←</span><span class="lang-en">View / Contact →</span></span>
   </a>
 </section>`:''}
 <section id="latest" class="wrap section latest-section"><div class="sectionhead"><div><span class="eyebrow">LATEST / NEWSROOM</span><h2>آخرین اخبار</h2></div><a class="more" href="/all-news">آرشیو کامل</a></div>${latest.length?`<div class="grid news latest-grid">${latest.map(a=>card(a,db)).join('')}</div>`:`<div class="empty"><h3>هنوز خبری منتشر نشده است</h3><p>از پنل تحریریه اولین خبر را منتشر کنید.</p></div>`}</section>
 ${popular.length?`<section class="wrap section popular-section"><div class="sectionhead"><div><span class="eyebrow">MOST READ / NABEZ SARDO</span><h2><span class="lang-fa">پربازدیدترین خبرها</span><span class="lang-en">Most Read</span></h2></div><a class="more" href="/all-news"><span class="lang-fa">آرشیو کامل</span><span class="lang-en">Full Archive</span></a></div><div class="popular-list">${popularMarkup}</div></section>`:''}
 <section class="focus"><div class="wrap focusgrid"><div><span class="eyebrow">SARDOUIYEH FOCUS</span><h2>ساردوئیه در کانون</h2><p>روایت مسائل واقعی مردم، ظرفیت‌های منطقه، کشاورزی، گردشگری، آموزش، فرهنگ و ورزش.</p><a class="btn ghost" href="/all-news">ورود به آرشیو</a></div><div class="topics">${[['01','سیاسی'],['02','کشاورزی'],['03','فرهنگ و ورزش'],['04','گردشگری']].map(x=>`<div class="topic tilt"><small>${x[0]}</small><h3>${x[1]}</h3><p>خبرها و گزارش‌های منتخب این حوزه.</p></div>`).join('')}</div></div></section>
 <section class="wrap citizen"><div class="citizen-copy"><span class="eyebrow">CITIZEN NEWSROOM</span><h2>شما هم خبرنگار نبض ساردو باشید</h2><p>خبر، عکس، ویدئو یا سوژه محلی را برای تحریریه ارسال کنید.</p></div><a class="btn primary" href="/send-news">ارسال خبر</a></section></main>${footer()}`, 'نبض ساردو؛ تازه‌ترین اخبار ساردوئیه، جیرفت و جنوب کرمان',{canonical:'/',schema:siteSchema(),preloadImage:'https://d2ol7oe51mr4n9.cloudfront.net/user_32MkkZvMhQKFjHMKrhiL97UtBqA/03895380-5279-4699-9bf8-671489cf2a89.jpg?v=four-seasons-final-1',preconnect:'https://d2ol7oe51mr4n9.cloudfront.net'});}
function archive(db,q=''){const all=published(db).filter(a=>!q||a.title.includes(q)||a.lead.includes(q));return shell('آخرین اخبار ساردوئیه و جنوب کرمان | نبض ساردو',`${header(db)}<main class="wrap page archive-page"><div class="pagehead"><span class="eyebrow">ARCHIVE</span><h1>آرشیو اخبار</h1></div><form class="search archive-search" action="/all-news"><input name="q" value="${e(q)}" placeholder="جستجو در خبرها"><button class="btn primary">جستجو</button></form><div class="grid news archive-grid">${all.map(a=>card(a,db)).join('')||'<div class="empty">خبری پیدا نشد.</div>'}</div></main>${footer()}`,'آرشیو کامل اخبار نبض ساردو',{canonical:'/all-news'});}
function article(db,a){
  const c=db.categories.find(x=>x.id===a.categoryId);
  const body=a.bodyHtml||oldBody(a);
  const bodyEn=a.bodyEn?String(a.bodyEn).split('\n').filter(Boolean).map(p=>`<p>${e(p)}</p>`).join(''):body;
  const gallery=Array.isArray(a.gallery)?a.gallery:[];
  const pub=published(db);
  const same=pub.filter(x=>x.id!==a.id&&x.categoryId===a.categoryId);
  const fallback=pub.filter(x=>x.id!==a.id&&x.categoryId!==a.categoryId);
  const related=[...same,...fallback].slice(0,3);
  const catUrl='/category/'+encodeURIComponent(a.categoryId||'');
  const desc=compactText(a.lead||a.body||a.title,160);
  return shell(a.title+' | نبض ساردو',`${header(db)}<main class="wrap article"><nav class="breadcrumbs" aria-label="مسیر صفحه"><a href="/">خانه</a><span>›</span><a href="${catUrl}"><span class="lang-fa">${e(c?.name||'خبر')}</span><span class="lang-en">${e(catEn(c?.name||'News'))}</span></a></nav><article><span class="eyebrow"><span class="lang-fa">${e(c?.name||'خبر')}</span><span class="lang-en">${e(catEn(c?.name||'News'))}</span></span><h1><span class="lang-fa">${e(a.title)}</span><span class="lang-en">${e(a.titleEn||a.title)}</span></h1><p class="lead"><span class="lang-fa">${e(a.lead||'')}</span><span class="lang-en">${e(a.leadEn||a.lead||'')}</span></p><div class="meta"><span>${e(a.author||'تحریریه نبض ساردو')}</span><span>${e(a.location||'ساردوئیه')}</span><time class="news-date" data-news-date="${e(a.publishedAt||a.createdAt||'')}"></time><span class="article-views">◉ ${Number(a.views||0).toLocaleString('fa-IR')} <span class="lang-fa">بازدید</span><span class="lang-en">views</span></span></div>${a.image?`<div class="cover-frame ${imageOrientation(a)}" data-adaptive-media style="--image-ratio:${imageRatio(a)}"><img class="cover" src="${e(a.image)}" alt="${e(a.title)}" loading="eager" decoding="async" fetchpriority="high"></div>`:''}<div class="body rich-content"><div class="lang-fa">${body}</div><div class="lang-en">${bodyEn}</div></div>${gallery.length?`<section class="article-gallery"><h3>گالری تصاویر</h3><div class="article-gallery-grid">${gallery.map((url,i)=>`<img src="${e(url)}" alt="${e(a.title)} - تصویر ${i+1}" loading="lazy" decoding="async" fetchpriority="low">`).join('')}</div></section>`:''}</article>${related.length?`<section class="related-news"><div class="sectionhead"><div><span class="eyebrow">RELATED</span><h2>خبرهای مرتبط</h2></div><a class="more" href="${catUrl}">همه خبرهای این بخش</a></div><div class="grid news">${related.map(x=>card(x,db)).join('')}</div></section>`:''}</main>${footer()}`,desc,{canonical:'/news/'+encodeURIComponent(a.slug),image:a.image||'',ogType:'article',schema:articleSchema(a,c)});
}

function normalizeSearch(v=''){
  return String(v).toLowerCase()
    .replace(/[يى]/g,'ی').replace(/ك/g,'ک')
    .replace(/[ًٌٍَُِّْـ]/g,' ')
    .replace(/\s+/g,' ').trim();
}
function search(db,q=''){
  const query=normalizeSearch(q);
  const all=published(db);
  const list=!query?[]:all.filter(a=>{
    const category=db.categories.find(x=>x.id===a.categoryId)?.name||'';
    const hay=normalizeSearch([a.title,a.lead,a.body,a.author,a.location,category].filter(Boolean).join(' '));
    return query.split(' ').every(part=>hay.includes(part));
  });
  return shell((q?'جستجو: '+q:'جستجو')+' | نبض ساردو',`${header(db)}<main class="wrap page search-page"><div class="pagehead"><span class="eyebrow">SEARCH / NABEZ SARDO</span><h1>جستجو در اخبار</h1><p>${q?`نتایج برای «${e(q)}» — ${list.length.toLocaleString('fa-IR')} خبر`:'عبارت موردنظر را وارد کنید.'}</p></div><form class="search search-large" action="/search" method="get"><input name="q" type="search" value="${e(q)}" placeholder="عنوان، متن، خبرنگار، محل یا موضوع..." autofocus><button class="btn primary">جستجو</button></form>${q?`<div class="grid news">${list.map(a=>card(a,db)).join('')||'<div class="empty">نتیجه‌ای پیدا نشد. عبارت دیگری را امتحان کنید.</div>'}</div>`:''}</main>${footer()}`,'جستجو در آرشیو اخبار نبض ساردو',{canonical:'/search',robots:'noindex,follow'});
}
function category(db,c){const list=published(db).filter(a=>a.categoryId===c.id);return shell('اخبار '+c.name+' | ساردوئیه و جنوب کرمان | نبض ساردو',`${header(db)}<main class="wrap page"><span class="eyebrow">CATEGORY</span><h1>${e(c.name)}</h1><div class="grid news">${list.map(a=>card(a,db)).join('')||'<div class="empty">هنوز خبری در این دسته منتشر نشده است.</div>'}</div></main>${footer()}`,'اخبار '+c.name+' در نبض ساردو',{canonical:'/category/'+encodeURIComponent(c.id)});}
function simple(db,type,ok=false,uploadError=''){let title='',content='';if(type==='about'){title='درباره نبض ساردو';content=`<p class="lead">نبض ساردو رسانه‌ای محلی برای پوشش دقیق، سریع و مسئولانه اخبار ساردوئیه و جنوب کرمان است.</p><div class="grid info"><div class="panel"><h3>ماموریت</h3><p>خبر محلی قابل اتکا و روایت مسائل واقعی مردم.</p></div><div class="panel"><h3>اصول تحریریه</h3><p>دقت، راستی‌آزمایی، احترام و استقلال.</p></div><div class="panel"><h3>تمرکز منطقه‌ای</h3><p>ساردوئیه، جیرفت و جنوب کرمان.</p></div></div>`;}else if(type==='contact'){title='تماس با ما';content=`${ok?'<div class="success">پیام شما ثبت شد.</div>':''}<form class="form" method="post"><label>نام<input name="name" required></label><label>راه ارتباطی<input name="contact" required></label><label>موضوع<input name="subject" required></label><label>پیام<textarea name="message" required></textarea></label><button class="btn primary">ارسال پیام</button></form>`;}else{title='ارسال خبر مردمی';content=`<div class="send-news-gift-box gift-card-box"><span>هدیه خبر مردمی</span><b>در صورت تمایل، شماره کارت خود را وارد کنید تا اگر خبر شما مشمول هدیه شد، مبلغ برایتان واریز شود.</b></div>${ok?'<div class="success">خبر شما همراه فایل برای تحریریه ثبت شد.</div>':''}${uploadError==='large'?'<div class="error">حجم فایل بیشتر از ۵۰ مگابایت است.</div>':uploadError==='type'?'<div class="error">فرمت فایل پشتیبانی نمی‌شود. عکس یا ویدئوی MP4/WebM/MOV انتخاب کنید.</div>':''}<form class="form citizen-form" method="post" enctype="multipart/form-data"><label>نام<input name="name" required></label><label>شماره تماس<input name="phone" required></label><label>محل رویداد<input name="location" required></label><label>عنوان خبر<input name="headline" required></label><label>شرح خبر<textarea name="details" required></textarea></label><label class="citizen-upload">عکس یا ویدئوی خبر<input type="file" name="mediaFile" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" required><small>فایل را مستقیم از گوشی انتخاب و آپلود کنید؛ حداکثر حجم ۵۰ مگابایت.</small></label><label class="reward-card-input">شماره کارت برای دریافت هدیه <small>اختیاری — فقط برای واریز هدیه احتمالی استفاده می‌شود.</small><input name="rewardCard" inputmode="numeric" autocomplete="off" maxlength="24" placeholder="مثلاً 6037 99xx xxxx xxxx"></label><button class="btn primary">ارسال برای تحریریه</button></form>`;}const canonical=type==='about'?'/about':type==='contact'?'/contact':'/send-news';return shell(title+' | نبض ساردو',`${header(db)}<main class="wrap page"><span class="eyebrow">NABEZ SARDO</span><h1>${title}</h1>${content}</main>${footer()}`,title+' | نبض ساردو',{canonical});}
module.exports={home,archive,article,category,simple,search};