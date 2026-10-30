'use strict';
const {published}=require('./store');
const {e,shell,listingImage,isBrandedCover,shortArticleCode,ASSET_VERSION}=require('./view-common');
const {presentArticle}=require('./news-presentation');

function clean(x='',max=180){
 const v=String(x||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 return v.length>max?v.slice(0,max-1).trim()+'…':v;
}
function ago(x){
 const n=new Date(x).getTime(); if(!Number.isFinite(n))return 'تازه';
 const m=Math.max(0,Math.floor((Date.now()-n)/60000));
 if(m<60)return m<1?'همین حالا':m.toLocaleString('fa-IR')+' دقیقه پیش';
 if(m<1440)return Math.floor(m/60).toLocaleString('fa-IR')+' ساعت پیش';
 if(m<10080)return Math.floor(m/1440).toLocaleString('fa-IR')+' روز پیش';
 try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long',timeZone:'Asia/Tehran'}).format(new Date(n));}catch{return '';}
}
function cat(db,a){return db.categories.find(c=>c.id===a.categoryId)||{name:'خبر',id:'short-news'};}
function url(a){return '/news/'+encodeURIComponent(a.slug);}
function excerpt(a,max=120){
 const raw=clean(a.lead||a.body||'',Math.max(max+60,210))
   .replace(/^[\s•🔹🔸♦️]+/gu,'').trim();
 const title=clean(a.title||'',300).replace(/[«»"'،:؛.!?؟]/g,' ').replace(/\s+/g,' ').trim();
 const lead=raw.replace(/[«»"'،:؛.!?؟]/g,' ').replace(/\s+/g,' ').trim();
 if(!raw)return '';
 // Imported leads sometimes repeat the whole headline before the news text.
 if(title.length>15&&lead.startsWith(title)){
   const remainder=raw.slice(Math.min(raw.length,clean(a.title||'',300).length)).replace(/^[\s:؛،.ـ\-–]+/,'').trim();
   if(remainder.length>25)return clean(remainder,max);
   return '';
 }
 return clean(raw,max);
}
function pic(a,priority=false){
 const image=listingImage(a);
 const branded=isBrandedCover(image)||/\/assets\/news-cover[^/]*\.(?:svg|png|webp)(?:[?#]|$)/i.test(image);
 const mode=branded?'ns26-cover-branded':'ns26-cover-photo';
 const src=e(image);
 return '<span class="ns26-photo '+mode+'">'
  +'<img class="ns26-photo-blur" src="'+src+'" alt="" aria-hidden="true" loading="lazy">'
  +'<img class="ns26-photo-main" src="'+src+'" alt="'+e(a.title)+'" decoding="async" loading="'+(priority?'eager':'lazy')+'" '+(priority?'fetchpriority="high"':'')+'>'
  +'</span>';
}
function feature(db,a,kind){
 if(!a)return '<div class="ns26-blank">در انتظار انتشار خبرهای تازه</div>';
 const c=cat(db,a);
 const main=kind==='main';
 const cls=main?'ns26-feature-main':'ns26-feature-side';
 const heading=main?'h2':'h3';
 const title=e(a.title);
 const actionLabel=e('مشاهده خبر: '+a.title);
 return '<a class="ns26-feature '+cls+'" href="'+e(url(a))+'" aria-label="'+actionLabel+'">'
  +pic(a,main)
  +'<span class="ns26-feature-scrim" aria-hidden="true"></span>'
  +'<span class="ns26-feature-details">'
  +'<span class="ns26-kicker"><span class="ns26-dot" aria-hidden="true"></span>'+e(c.name)+' <span class="ns26-time">· '+e(ago(a.publishedAt||a.createdAt))+'</span></span>'
  +'<'+heading+' class="ns26-story-title" dir="auto">'+title+'</'+heading+'>'
  +(main&&excerpt(a,125)?'<p class="ns26-feature-intro">'+e(excerpt(a,125))+'</p>':'')
  +'<span class="ns26-feature-link" aria-hidden="true">مشاهده خبر <span>↖</span></span>'
  +'</span></a>';
}
function card(db,a,i){
 const c=cat(db,a);
 const link=e(url(a));
 const title=e(a.title);
 const actionLabel=e('مطالعه خبر: '+a.title);
 return '<article class="ns26-news-card" data-story-card data-story-title-fa="'+title+'" data-story-url="/news/'+e(shortArticleCode(a.id))+'" data-story-lead-fa="'+e(clean(a.lead||a.body||'',140))+'" data-story-image="'+e(listingImage(a))+'">'
  +'<a class="ns26-thumb" href="'+link+'" aria-label="'+actionLabel+'">'
  +pic(a,false)
  +'<span class="ns26-card-number" aria-hidden="true">'+(i+1).toLocaleString('fa-IR')+'</span></a>'
  +'<div class="ns26-news-content">'
  +'<div class="ns26-news-meta"><span>'+e(c.name)+'</span><span>'+e(ago(a.publishedAt||a.createdAt))+'</span></div>'
  +'<h3 class="ns26-news-title" dir="auto"><a href="'+link+'">'+title+'</a></h3>'
  +(excerpt(a,100)?'<p class="ns26-news-summary">'+e(excerpt(a,100))+'</p>':'')
  +'<a class="ns26-text-link" href="'+link+'" aria-label="'+actionLabel+'">مطالعه خبر <span aria-hidden="true">↖</span></a>'
  +'</div></article>';
}
function home(db){
 const sorted=published(db).map(presentArticle).sort((a,b)=>new Date(b.publishedAt||b.createdAt||0)-new Date(a.publishedAt||a.createdAt||0));
 const regular=sorted.filter(a=>a.categoryId!=='short-news');
 const localRe=/ساردو|جیرفت|جنوب کرمان|کهنوج|عنبرآباد|دلفارد|جازموریان|رودبار جنوب|منوجان|قلعه[‌ ]گنج|فاریاب/;
 const stamp=a=>{
   const ms=Date.parse(a.publishedAt||a.createdAt||'');
   return Number.isFinite(ms)?ms:0;
 };
 // Recency is the primary criterion. An attractive but weeks-old photo must
 // never displace a genuinely newer report in the main news slot.
 const prioritized=[...regular].sort((a,b)=>stamp(b)-stamp(a));
 const newest=prioritized[0];
 const photoReady=a=>!isBrandedCover(listingImage(a));
 const isLocal=a=>localRe.test([a.location,a.title,a.lead].join(' '));
 const now=Date.now();
 const recentEnough=!!newest&&stamp(newest)>now-48*3600000&&stamp(newest)<=now+3600000;
 const sameNewsCycle=recentEnough
   ? prioritized.filter(a=>stamp(a)>=stamp(newest)-3*3600000)
   : [];
 const lead=sameNewsCycle.find(a=>isLocal(a)&&photoReady(a))
   ||sameNewsCycle.find(photoReady)
   ||newest;
 const remaining=prioritized.filter(a=>!lead||a.id!==lead.id);
 const side=remaining.slice(0,2),latest=remaining.slice(2,11);
 const tickerArticles=sorted.slice(0,5);
 const ticker=tickerArticles.map((a,i)=>'<a href="'+e(url(a))+'" class="ns27-ticker-link"><span class="ns27-ticker-index">'+(i+1).toLocaleString('fa-IR')+'</span>'+e(a.title)+'</a>').join('');
 const editionDate=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Tehran'}).format(new Date());
 const quickCats=db.categories.filter(c=>c.id!=='short-news').slice(0,3);
 const categoryQuick=quickCats.map(c=>'<a href="/category/'+encodeURIComponent(c.id)+'">'+e(c.name)+'</a>').join('');
 const shorts=sorted.filter(a=>a.categoryId==='short-news').slice(0,4);
 const most=[...regular].sort((a,b)=>Number(b.views||0)-Number(a.views||0)).slice(0,4);
 const categories=db.categories.filter(c=>c.id!=='short-news').slice(0,11);
 const catlinks=categories.map(c=>'<a href="/category/'+encodeURIComponent(c.id)+'">'+e(c.name)+'<span>↖</span></a>').join('');
 const locations=[['ساردوئیه','/local/sardouiyeh'],['جیرفت','/local/jiroft'],['عنبرآباد','/search?q='+encodeURIComponent('عنبرآباد')],['کهنوج','/search?q='+encodeURIComponent('کهنوج')],['جنوب کرمان','/local/south-kerman']];
 const locationLinks=locations.map((v,i)=>'<a class="ns26-location-pill" href="'+v[1]+'"><span class="ns26-location-icon">0'+(i+1)+'</span>'+v[0]+'<span>↖</span></a>').join('');
 const shortList=(shorts.length?shorts:regular.slice(0,4)).map(a=>'<a href="'+e(url(a))+'"><span class="ns26-bullet"></span><span>'+e(a.title)+'</span><small>'+e(ago(a.publishedAt||a.createdAt))+'</small></a>').join('');
 const popular=most.map((a,i)=>'<a href="'+e(url(a))+'"><em>'+String(i+1).padStart(2,'0')+'</em><span>'+e(a.title)+'</span><small>'+Number(a.views||0).toLocaleString('fa-IR')+' بازدید</small></a>').join('');
 const body=`
 <script>document.body.classList.add('ns26-page','ns27-page');</script>
 <link rel="stylesheet" href="/assets/cloud-dancer-2026.css?v=${ASSET_VERSION}">
 <link rel="stylesheet" href="/assets/newsroom-v2.css?v=${ASSET_VERSION}">
 <div class="ns26-site ns27-site">
  <div class="ns26-ambient ns26-ambient-a" aria-hidden="true"></div><div class="ns26-ambient ns26-ambient-b" aria-hidden="true"></div>
  <div class="ns26-topline"><div class="ns26-container"><span><span class="ns26-live-dot"></span> رسانه مستقل جنوب کرمان</span><span class="ns26-topline-en">NABEZ SARDO · INDEPENDENT LOCAL NEWSROOM</span><a href="/all-news">آرشیو اخبار <span>↖</span></a></div></div>
  <header class="ns26-header"><div class="ns26-container ns26-header-inner">
   <a href="/" class="ns26-brand" aria-label="نبض ساردو، صفحه اصلی"><span class="ns26-mark" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><path d="M4 33h13l6-9 8 20 8-29 8 25 6-7h7" stroke="currentColor" stroke-width="3.8" stroke-linejoin="round" stroke-linecap="round"/></svg></span><span><b>نبض ساردو</b><small>NABEZ SARDO</small></span></a>
   <nav class="ns26-nav" id="ns26-nav" aria-label="فهرست اصلی"><a class="active" href="/">صفحه نخست</a><a href="/all-news">آخرین اخبار</a><a href="/local/sardouiyeh">ساردوئیه</a><a href="/local/jiroft">جیرفت</a><a href="/category/social">اجتماعی</a><a href="/category/culture">فرهنگی</a><a href="/about">درباره ما</a></nav>
   <div class="ns26-header-actions"><button type="button" class="ns26-icon-button" id="ns26-search-button" aria-label="باز کردن جستجو" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></button><a class="ns26-header-cta" href="/send-news">ارسال خبر <span>↖</span></a><button class="ns26-menu-button" type="button" id="ns26-menu-button" aria-label="نمایش فهرست" aria-expanded="false" aria-controls="ns26-nav"><span></span><span></span><span></span></button></div>
  </div><form class="ns26-search" id="ns26-search" action="/search" method="get" role="search" hidden><label for="ns26-q">جستجو در اخبار</label><input id="ns26-q" name="q" type="search" placeholder="موضوع یا نام شهر را بنویسید…" required><button type="submit">جستجو ↖</button></form></header>
  <main>
   <section class="ns27-ticker" aria-label="آخرین تیترهای منتشرشده"><div class="ns26-container ns27-ticker-inner"><span class="ns27-ticker-label"><span class="ns27-ticker-dot"></span>تازه‌ترین خبرها</span><div class="ns27-ticker-scroll">${ticker||'<span class="ns27-no-news">هنوز خبری منتشر نشده است</span>'}</div><a class="ns27-ticker-all" href="/all-news" aria-label="مشاهده همه خبرها">همه اخبار <span aria-hidden="true">↖</span></a></div></section>
   <section class="ns27-mast ns26-container" aria-labelledby="ns27-title">
      <div class="ns27-mast-head"><div><span class="ns27-mast-kicker"><span class="ns27-mast-kicker-mark"></span>نبض ساردو / رسانه مستقل</span><h1 id="ns27-title">سرخطِ <em>خبرها</em><span class="ns27-mast-period">.</span></h1><p>پوشش تازه‌ترین خبرهای ساردوئیه، جیرفت و جنوب کرمان</p></div><div class="ns27-date"><span class="ns27-date-tag">DAILY BRIEFING</span><strong>${e(editionDate)}</strong><span>از دل جنوب کرمان، برای همه</span></div></div>
      <nav class="ns27-quick" aria-label="دسته‌بندی سریع اخبار"><span class="ns27-quick-label">دسته‌بندی‌ها</span>${categoryQuick}<a class="ns27-quick-local" href="/all-news">همه خبرها <span aria-hidden="true">↖</span></a></nav>
   </section>
   <div class="ns26-container"><div class="ns26-overline"><span><span class="ns26-live-dot"></span> مهم‌ترین خبرها</span><span>TOP STORIES · منتخب تحریریه</span></div>
   <section class="ns26-feature-grid" aria-label="خبرهای شاخص">${feature(db,lead,'main')}<div class="ns26-feature-aside">${side.map(a=>feature(db,a,'side')).join('')||'<div class="ns26-blank">خبر شاخص بعدی به‌زودی</div>'}</div></section></div>
   <section class="ns26-cities ns26-container"><div class="ns26-section-head"><div><span class="ns26-subtitle">EXPLORE OUR REGION</span><h2>نبض شهرهای ما<span class="ns26-highlight">.</span></h2></div><p>هر گوشه از جنوب کرمان، یک داستان شنیدنی دارد.</p></div><div class="ns26-locations">${locationLinks}</div></section>
   <section class="ns26-latest ns26-container"><div class="ns26-section-head"><div><span class="ns26-subtitle">THE LATEST EDITION</span><h2>تازه‌ترین روایت‌ها<span class="ns26-highlight">.</span></h2></div><a class="ns26-section-link" href="/all-news">مشاهده آرشیو کامل <span>↖</span></a></div><div class="ns26-news-grid">${latest.map((a,i)=>card(db,a,i)).join('')||'<p>در انتظار خبرهای تازه</p>'}</div></section>
   <section class="ns26-special ns26-container"><div class="ns26-special-info"><span class="ns26-subtitle">NEWS BY CATEGORY</span><h2>آنچه برایتان<br>اهمیت دارد.</h2><p>اخبار را بر اساس علاقه، موضوع یا منطقه دنبال کنید.</p><div class="ns26-category-grid">${catlinks}</div></div><div class="ns26-special-panel"><div class="ns26-panel-top"><span class="ns26-panel-dot"></span><span>نبض کوتاه</span><small>BRIEFING / 01</small></div><h3>چند خط، یک دنیا خبر.</h3><div class="ns26-briefs">${shortList}</div><a href="/category/short-news" class="ns26-panel-link">همه خبرهای کوتاه <span aria-hidden="true">↖</span></a></div></section>
   <section class="ns26-popular ns26-container"><div class="ns26-section-head"><div><span class="ns26-subtitle">MOST READ</span><h2>پرخواننده‌ها<span class="ns26-highlight">.</span></h2></div></div><div class="ns26-popular-grid">${popular}</div></section>
   <section class="ns26-share ns26-container"><div class="ns26-share-inner"><div><span class="ns26-subtitle">YOU ARE THE STORY</span><h2>شما هم بخشی<br>از این روایت هستید.</h2><p>اتفاق مهمی دیده‌اید؟ تصویر، ویدئو یا خبر محلی‌تان را با تحریریه به اشتراک بگذارید.</p><a href="/send-news" class="ns26-primary">ارسال خبر مردمی <span>↖</span></a></div><div class="ns26-share-graphic" aria-hidden="true"><span>〰</span><i>THE PULSE<br>OF OUR<br>PEOPLE.</i></div></div></section>
  </main>
  <footer class="ns26-footer"><div class="ns26-container"><div class="ns26-footer-main"><div class="ns26-footer-brand"><strong>نبض ساردو<span>.</span></strong><small>NABEZ SARDO / LOCAL NEWSROOM</small><p>صدای محلی، نگاه روشن.<br>رسانه مستقل ساردوئیه، جیرفت و جنوب کرمان.</p></div><div><b>رسانه</b><a href="/about">درباره ما</a><a href="/contact">ارتباط با ما</a><a href="/send-news">ارسال خبر مردمی</a></div><div><b>دسترسی</b><a href="/all-news">آرشیو اخبار</a><a href="/local/sardouiyeh">اخبار ساردوئیه</a><a href="/local/jiroft">اخبار جیرفت</a><a href="/local/south-kerman">اخبار جنوب کرمان</a></div></div><div class="ns26-footer-bottom"><span>© نبض ساردو — تمامی حقوق محفوظ است.</span><span>CRAFTED WITH CLARITY · 2026</span></div></div></footer>
 </div><script src="/assets/cloud-dancer-2026.js?v=${ASSET_VERSION}" defer></script>`;
 const schema=[
  {'@context':'https://schema.org','@type':'WebSite',name:'نبض ساردو',alternateName:'Nabez Sardo',url:'https://nabzesardo.ir/',inLanguage:'fa-IR',potentialAction:{'@type':'SearchAction',target:'https://nabzesardo.ir/search?q={search_term_string}','query-input':'required name=search_term_string'}},
  {'@context':'https://schema.org','@type':'NewsMediaOrganization',name:'نبض ساردو',alternateName:'Nabez Sardo',url:'https://nabzesardo.ir/',logo:'https://nabzesardo.ir/assets/logo.svg',description:'رسانه محلی ساردوئیه، جیرفت و جنوب کرمان',areaServed:[{'@type':'Place',name:'ساردوئیه'},{'@type':'Place',name:'جیرفت'},{'@type':'Place',name:'جنوب کرمان'}]}
 ];
 return shell('نبض ساردو | تازه‌ترین اخبار ساردوئیه و جنوب کرمان',body,'آخرین اخبار ساردوئیه، جیرفت و جنوب کرمان از رسانه مستقل نبض ساردو',{canonical:'/',schema});
}
module.exports=home;
