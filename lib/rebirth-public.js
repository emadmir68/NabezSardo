'use strict';
const {published}=require('./store');
const {e,fmt,dateOnly,excerpt,imageFor,shell,header,footer,storyCard,sectionTitle,absoluteUrl,PUBLIC_BASE,catEn}=require('./rebirth-shared');

function sortedNews(db){
  return published(db).slice().sort((a,b)=>new Date(b.publishedAt||b.createdAt||0)-new Date(a.publishedAt||a.createdAt||0));
}
function siteSchema(){
  return [
    {'@context':'https://schema.org','@type':'WebSite',name:'نبض ساردو',alternateName:'Nabz Sardo',url:PUBLIC_BASE+'/',inLanguage:'fa-IR',potentialAction:{'@type':'SearchAction',target:absoluteUrl('/search?q={search_term_string}'),'query-input':'required name=search_term_string'}},
    {'@context':'https://schema.org','@type':'NewsMediaOrganization',name:'نبض ساردو',alternateName:'Nabz Sardo',url:PUBLIC_BASE+'/',description:'رسانه مستقل خبری و تحلیلی ساردوئیه، جیرفت و جنوب کرمان',areaServed:[{'@type':'Place',name:'ساردوئیه'},{'@type':'Place',name:'جیرفت'},{'@type':'Place',name:'جنوب کرمان'}]}
  ];
}
function articleSchema(a,c){
  const url=absoluteUrl('/news/'+encodeURIComponent(a.slug||''));
  const schema={'@context':'https://schema.org','@type':'NewsArticle',mainEntityOfPage:{'@type':'WebPage','@id':url},headline:a.title,description:excerpt(a.lead||a.body||a.title,220),datePublished:a.publishedAt||a.createdAt,dateModified:a.updatedAt||a.publishedAt||a.createdAt,inLanguage:'fa-IR',isAccessibleForFree:true,articleSection:c?.name||'خبر',author:{'@type':String(a.author||'').includes('تحریریه')?'Organization':'Person',name:a.author||'تحریریه نبض ساردو'},publisher:{'@type':'NewsMediaOrganization',name:'نبض ساردو',url:PUBLIC_BASE+'/'},url};
  if(a.image)schema.image=[absoluteUrl(a.image)];
  return schema;
}
function heroMarkup(a,db,index){
  const cat=(db.categories||[]).find(x=>x.id===a.categoryId);
  const image=imageFor(a),url='/news/'+encodeURIComponent(a.slug||'');
  const media=a.videoUrl?'<video class="rb-hero-media" controls playsinline preload="metadata" poster="'+e(image)+'"><source src="'+e(a.videoUrl)+'" type="'+e(a.videoType||'video/mp4')+'"></video>':'<img class="rb-hero-media" src="'+e(image)+'" alt="'+e(a.title)+'" fetchpriority="high" decoding="async">';
  const storyAttrs='data-story-title-fa="'+e(a.title||'')+'" data-story-lead-fa="'+e(excerpt(a.lead||a.body||'',150))+'" data-story-url="'+e(url)+'"';
  return '<article class="rb-hero-story" data-story-card '+storyAttrs+'><a class="rb-hero-visual" href="'+e(url)+'" '+storyAttrs+'>'+media+'<span class="rb-hero-visual-shade"></span><span class="rb-hero-number">'+String(index+1).padStart(2,'0')+'</span><span class="rb-hero-photo-label">SOUTH KERMAN / FIELD REPORT</span></a><div class="rb-hero-copy"><span class="rb-kicker"><span class="rb-fa">'+e(cat?.name||'گزارش ویژه')+' / روایت اصلی</span><span class="rb-en">'+e(catEn(cat?.name||'News'))+' / LEAD STORY</span></span><h1><a href="'+e(url)+'"><span class="rb-fa">'+e(a.title||'نبض ساردو؛ روایت جنوب کرمان')+'</span><span class="rb-en">'+e(a.titleEn||a.title||'Nabz Sardo — Stories from South Kerman')+'</span></a></h1><p><span class="rb-fa">'+e(excerpt(a.lead||a.body||'خبرها و روایت‌های مستند از ساردوئیه، جیرفت و جنوب کرمان.',220))+'</span><span class="rb-en">'+e(excerpt(a.leadEn||a.lead||a.body||'Independent reporting from Sardouiyeh, Jiroft and South Kerman.',220))+'</span></p><div class="rb-hero-actions"><a class="rb-button" href="'+e(url)+'"><span class="rb-fa">خواندن گزارش</span><span class="rb-en">Read the report</span> <b>←</b></a><span>'+e(dateOnly(a.publishedAt||a.createdAt))+'　·　'+Number(a.views||0).toLocaleString('fa-IR')+' <span class="rb-fa">بازدید</span><span class="rb-en">views</span></span></div></div></article>';
}
function home(db){
  const all=sortedNews(db);
  const regular=all.filter(a=>a.categoryId!=='short-news');
  const lead=regular.find(a=>a.featured)||regular[0]||null;
  const rest=regular.filter(a=>!lead||a.id!==lead.id);
  const heroSide=rest.slice(0,3);
  const latest=rest.slice(3,9);
  const popular=regular.slice().sort((a,b)=>Number(b.views||0)-Number(a.views||0)).slice(0,4);
  const short=all.filter(a=>a.categoryId==='short-news').slice(0,6);
  const cats=(db.categories||[]).filter(c=>c.id!=='short-news').slice(0,8);
  const live=db.settings?.liveDeskEnabled!==false;
  const breaking=live?(db.settings?.breakingText||'مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.'):'در حال حاضر خبر فوری فعالی ثبت نشده است.';
  const breakingEn=live?(db.settings?.breakingTextEn||'Top local developments from Sardouiyeh and South Kerman — fast, accurate and local.'):'There is no active breaking news at the moment.';
  const hero=lead?heroMarkup(lead,db,0):'<div class="rb-hero-empty"><span class="rb-kicker">THE LOCAL NEWSROOM</span><h1>نبض ساردو؛<br>روایت جنوب کرمان</h1><p>خبر دقیق، روایت انسانی و صدای مردم منطقه.</p><a class="rb-button" href="/send-news">ارسال خبر مردمی ←</a></div>';
  const side=heroSide.map((a,i)=>{const cat=(db.categories||[]).find(c=>c.id===a.categoryId);return '<a class="rb-hero-side-item" href="/news/'+e(a.slug)+'" data-story-title-fa="'+e(a.title||'')+'" data-story-lead-fa="'+e(excerpt(a.lead||a.body||'',150))+'" data-story-url="/news/'+e(a.slug)+'"><span class="rb-side-no">'+String(i+2).padStart(2,'0')+'</span><span><small><span class="rb-fa">'+e(cat?.name||'خبر')+'</span><span class="rb-en">'+e(catEn(cat?.name||'News'))+'</span></small><b><span class="rb-fa">'+e(a.title)+'</span><span class="rb-en">'+e(a.titleEn||a.title)+'</span></b><time>'+e(dateOnly(a.publishedAt||a.createdAt))+'</time></span></a>';}).join('');
  const categoryStrip=cats.map((c,i)=>'<a class="rb-category-tile" href="/category/'+encodeURIComponent(c.id)+'"><span>0'+(i+1)+'</span><b><span class="rb-fa">'+e(c.name)+'</span><span class="rb-en">'+e(catEn(c.name))+'</span></b><i>↙</i></a>').join('');
  const latestGrid=latest.map((a,i)=>storyCard(a,db,'standard',i)).join('');
  const popularMarkup=popular.map((a,i)=>'<a class="rb-popular-row" href="/news/'+e(a.slug)+'" data-story-title-fa="'+e(a.title||'')+'" data-story-lead-fa="'+e(excerpt(a.lead||a.body||'',150))+'" data-story-url="/news/'+e(a.slug)+'"><span>'+String(i+1).padStart(2,'0')+'</span><b><span class="rb-fa">'+e(a.title)+'</span><span class="rb-en">'+e(a.titleEn||a.title)+'</span></b><small>'+Number(a.views||0).toLocaleString('fa-IR')+' <span class="rb-fa">بازدید</span><span class="rb-en">views</span></small></a>').join('');
  const shortMarkup=short.map(a=>'<a class="rb-brief-row" href="/news/'+e(a.slug)+'" data-story-title-fa="'+e(a.title||'')+'" data-story-lead-fa="'+e(excerpt(a.lead||a.body||'',150))+'" data-story-url="/news/'+e(a.slug)+'"><span>●</span><b><span class="rb-fa">'+e(a.title)+'</span><span class="rb-en">'+e(a.titleEn||a.title)+'</span></b><time>'+e(fmt(a.publishedAt||a.createdAt))+'</time></a>').join('');
  const regional='<section class="rb-region-band"><div class="rb-region-intro"><span class="rb-kicker">A PLACE. MANY STORIES.</span><h2>از دل منطقه،<br><em>برای آینده منطقه.</em></h2><p>روایت ساردوئیه، جیرفت و جنوب کرمان از نزدیک؛ با تمرکز بر مردم، اقتصاد، فرهنگ و سرزمین.</p></div><div class="rb-region-map" aria-label="پوشش خبری جنوب کرمان"><div class="rb-map-lines"></div><span class="rb-map-label rb-map-label-one">ساردوئیه</span><span class="rb-map-label rb-map-label-two">جیرفت</span><span class="rb-map-label rb-map-label-three">جنوب کرمان</span><span class="rb-map-pulse"></span><span class="rb-map-coord">28° 40′ N / 57° 44′ E</span></div></section>';
  const body=header(db,'home')+
    '<main class="rb-main"><div class="rb-breaking"><div class="rb-shell rb-breaking-inner"><strong><i></i> نبض فوری</strong><p>'+e(breaking)+'</p><a href="/all-news">همه خبرها ↙</a></div></div>'+
    '<section class="rb-shell rb-home-hero"><div class="rb-hero-index"><span>01</span><small>THE LEAD STORY</small><i></i></div><div class="rb-hero-grid">'+hero+'<aside class="rb-hero-sidebar"><div class="rb-side-head"><span>THE NEWS INDEX</span><b><span class="rb-fa">روایت‌های بعدی</span><span class="rb-en">UP NEXT</span></b></div>'+(side||'<p class="rb-empty">خبرهای بعدی پس از انتشار اینجا نمایش داده می‌شوند.</p>')+'</aside></div><div class="rb-hero-bottomline"><span>INDEPENDENT LOCAL JOURNALISM</span><span>ساردوئیه　/　جیرفت　/　جنوب کرمان</span></div></section>'+
    '<section class="rb-shell rb-category-section">'+sectionTitle('THE REGIONAL DESK','میزهای خبری','/all-news','آرشیو کامل')+'<div class="rb-category-grid">'+categoryStrip+'</div></section>'+
    '<section class="rb-shell rb-latest-section">'+sectionTitle('LATEST DISPATCHES','تازه‌ترین روایت‌ها')+'<div class="rb-news-grid">'+(latestGrid||'<div class="rb-empty">هنوز خبری منتشر نشده است.</div>')+'</div></section>'+
    regional+
    '<section class="rb-shell rb-bottom-news"><div class="rb-popular"><div class="rb-mini-heading"><span>01 / MOST READ</span><h2><span class="rb-fa">پربازدیدترین‌ها</span><span class="rb-en">Most read</span></h2></div>'+(popularMarkup||'<p class="rb-empty">هنوز آماری ثبت نشده است.</p>')+'</div><div class="rb-briefs"><div class="rb-mini-heading"><span>02 / QUICK DISPATCH</span><h2><span class="rb-fa">خبرهای کوتاه</span><span class="rb-en">Quick news</span></h2></div>'+(shortMarkup||'<p class="rb-empty">خبر کوتاهی ثبت نشده است.</p>')+'</div></section></main>'+footer();
  return shell('نبض ساردو | رسانه مستقل خبری و تحلیلی جنوب کرمان',''+body,'خبرهای ساردوئیه، جیرفت و جنوب کرمان؛ گزارش‌های میدانی، اقتصاد، جامعه، کشاورزی و فرهنگ.',{canonical:'/',schema:siteSchema(),image:lead?imageFor(lead):''});
}
function archive(db,q=''){
  const params=q&&typeof q==='object'?q:null;
  const rawQuery=params
    ?(typeof params.get==='function'?params.get('q'):(params.q||''))
    :q;
  const query=String(rawQuery||'').trim();
  const list=sortedNews(db).filter(a=>!query||[a.title,a.lead,a.body,a.location,a.author].join(' ').includes(query));
  const cards=list.map((a,i)=>storyCard(a,db,'standard',i)).join('');
  const body=header(db,'all')+'<main class="rb-shell rb-page" id="archive-category"><div class="rb-page-heading"><span class="rb-kicker">THE ARCHIVE / 01</span><h1>آرشیو <em>خبرها</em></h1><p>جریان کامل خبرها و روایت‌های منتشرشده در نبض ساردو.</p><form class="rb-page-search" action="/search" method="get"><input name="q" value="'+e(query)+'" placeholder="عنوان، موضوع یا منطقه را جست‌وجو کن"><button>جست‌وجو ←</button></form></div><div class="rb-results-meta"><b>'+list.length.toLocaleString('fa-IR')+' خبر</b><span>مرتب‌شده بر اساس زمان انتشار</span></div><div class="rb-news-grid">'+(cards||'<div class="rb-empty">خبری با این مشخصات پیدا نشد.</div>')+'</div></main>'+footer();
  return shell((query?'جست‌وجوی '+query+' | ':'')+'آرشیو اخبار | نبض ساردو',''+body,'آرشیو آخرین اخبار ساردوئیه، جیرفت و جنوب کرمان.',{canonical:'/all-news'});
}
function briefs(db){return archive(db,'');}
function search(db,q=''){
  const query=String(q||'').trim();
  const list=sortedNews(db).filter(a=>!query||[a.title,a.lead,a.body,a.location,a.author].join(' ').toLowerCase().includes(query.toLowerCase()));
  const body=header(db,'all')+'<main class="rb-shell rb-page"><div class="rb-page-heading"><span class="rb-kicker">SEARCH THE NEWSROOM</span><h1>جست‌وجو در <em>نبض ساردو</em></h1><form class="rb-page-search" action="/search" method="get"><input name="q" value="'+e(query)+'" autofocus placeholder="چه چیزی را دنبال می‌کنی؟"><button>جست‌وجو ←</button></form></div><div class="rb-results-meta"><b>نتایج جست‌وجو: '+list.length.toLocaleString('fa-IR')+'</b><span>'+(query?'عبارت: «'+e(query)+'»':'عبارتی وارد نشده است')+'</span></div><div class="rb-news-grid">'+(list.map((a,i)=>storyCard(a,db,'standard',i)).join('')||'<div class="rb-empty">نتیجه‌ای پیدا نشد. عبارت دیگری را امتحان کن.</div>')+'</div></main>'+footer();
  return shell('جست‌وجو | نبض ساردو',''+body,'جست‌وجو در اخبار و گزارش‌های نبض ساردو.',{canonical:'/search',robots:'noindex,follow'});
}
function article(db,a){
  const cat=(db.categories||[]).find(c=>c.id===a.categoryId);
  const related=sortedNews(db).filter(x=>x.id!==a.id&&(x.categoryId===a.categoryId||x.location===a.location)).slice(0,3);
  const image=imageFor(a),url='/news/'+encodeURIComponent(a.slug||'');
  const bodyContent=a.bodyHtml||String(a.body||a.lead||'').split(/\n+/).filter(Boolean).map(p=>'<p>'+e(p)+'</p>').join('');
  const bodyContentEn=a.bodyEn?String(a.bodyEn).split(/\n+/).filter(Boolean).map(p=>'<p>'+e(p)+'</p>').join(''):bodyContent;
  const gallery=Array.isArray(a.gallery)?a.gallery:[];
  const galleryMarkup=gallery.length?'<div class="rb-article-gallery">'+gallery.map((src,i)=>'<figure><img src="'+e(src)+'" alt="'+e(a.title)+' - تصویر '+(i+1)+'" loading="lazy"></figure>').join('')+'</div>':'';
  const media=a.videoUrl?'<div class="rb-article-cover"><video controls playsinline preload="metadata" poster="'+e(image)+'"><source src="'+e(a.videoUrl)+'" type="'+e(a.videoType||'video/mp4')+'"></video></div>':'<figure class="rb-article-cover"><img src="'+e(image)+'" alt="'+e(a.title)+'" fetchpriority="high"></figure>';
  const author=a.author||'تحریریه نبض ساردو';
  const articleLead=excerpt(a.lead||a.body||'',190);
  const previewImage=a.socialImage||(a.image?image:'');
  const articleAttrs='data-article-root data-article-title="'+e(a.title||'')+'" data-article-url="'+e(url)+'" data-article-canonical="'+e(url)+'" data-article-image="'+e(previewImage)+'" data-article-image-kind="'+e(!a.image?'none':/auto-cover/i.test(String(a.image))?'auto':'real')+'" data-article-video="'+e(a.videoUrl||'')+'" data-article-video-type="'+e(a.videoType||'video/mp4')+'" data-article-category-id="'+e(a.categoryId||'')+'" data-article-lead="'+e(articleLead)+'"';
  const body=header(db,'')+'<main class="rb-shell rb-article-page" '+articleAttrs+'><nav class="rb-breadcrumb"><a href="/"><span class="rb-fa">خانه</span><span class="rb-en">Home</span></a><span>/</span><a href="/category/'+encodeURIComponent(a.categoryId||'')+'"><span class="rb-fa">'+e(cat?.name||'خبر')+'</span><span class="rb-en">'+e(catEn(cat?.name||'News'))+'</span></a><span>/</span><span>'+e(excerpt(a.title,75))+'</span></nav><header class="rb-article-head"><span class="rb-kicker">FIELD REPORT / '+e(catEn(cat?.name||'NEWS'))+'</span><span class="article-category-pill"><span class="lang-fa rb-fa">'+e(cat?.name||'خبر')+'</span></span><h1><span class="rb-fa lang-fa">'+e(a.title)+'</span><span class="rb-en lang-en">'+e(a.titleEn||a.title)+'</span></h1><p class="rb-article-lead article-deck"><span class="rb-fa lang-fa">'+e(a.lead||excerpt(a.body||'',260))+'</span><span class="rb-en lang-en">'+e(a.leadEn||a.lead||excerpt(a.bodyEn||a.body||'',260))+'</span></p><div class="rb-article-meta"><div class="rb-author-mark">'+e(author.slice(0,1))+'</div><div><b>'+e(author)+'</b><small>تحریریه نبض ساردو</small></div><span>'+e(fmt(a.publishedAt||a.createdAt))+'</span><span>'+Number(a.views||0).toLocaleString('fa-IR')+' بازدید</span><span>زمان مطالعه: '+Math.max(1,Math.ceil((String(a.body||'').split(/\s+/).length||500)/220)).toLocaleString('fa-IR')+' دقیقه</span></div></header>'+media+'<div class="rb-article-layout"><article class="rb-article-body article-body" data-article-body><div class="rb-fa lang-fa">'+bodyContent+galleryMarkup+'</div><div class="rb-en lang-en">'+bodyContentEn+galleryMarkup+'</div><div class="rb-article-share"><b><span class="rb-fa">این روایت را به اشتراک بگذار</span><span class="rb-en">Share this story</span></b><button type="button" data-share><span class="rb-fa">اشتراک‌گذاری</span><span class="rb-en">Share</span> ↗</button><button type="button" data-article-text-story><span class="rb-fa">استوری متن کامل</span><span class="rb-en">Full text story</span></button><button type="button" data-copy-link><span class="rb-fa">کپی پیوند</span><span class="rb-en">Copy link</span></button></div></article><aside class="rb-article-aside"><div class="rb-aside-sticky"><span class="rb-kicker">READ NEXT</span><h3>روایت‌های مرتبط</h3>'+(related.map((x,i)=>'<a href="/news/'+e(x.slug)+'"><small>0'+(i+1)+' / '+e((db.categories||[]).find(c=>c.id===x.categoryId)?.name||'خبر')+'</small><b>'+e(x.title)+'</b></a>').join('')||'<p>روایت مرتبط دیگری ثبت نشده است.</p>')+'</div></aside></div></main>'+footer();
  const desc=excerpt(a.lead||a.body||a.title,220);
  return shell(a.title+' | نبض ساردو',''+body,desc,{canonical:url,image,ogType:'article',schema:articleSchema(a,cat)})
    .replace('</head>','<link rel="stylesheet" href="/assets/text-story.css?v=1.0.0"></head>')
    .replace('</body>','<script src="/assets/text-story.js?v=1.0.0" defer></script></body>');
}
function category(db,c){
  const list=sortedNews(db).filter(a=>a.categoryId===c.id);
  const body=header(db,c.id)+'<main class="rb-shell rb-page"><div class="rb-page-heading"><span class="rb-kicker">NEWS DESK / '+e(String(c.id||'').toUpperCase())+'</span><h1>اخبار <em>'+e(c.name)+'</em></h1><p>آخرین خبرها، گزارش‌ها و روایت‌های مرتبط با '+e(c.name)+' در جنوب کرمان.</p></div><div class="rb-results-meta"><b>'+list.length.toLocaleString('fa-IR')+' خبر</b><span>آخرین به‌روزرسانی‌ها</span></div><div class="rb-news-grid">'+(list.map((a,i)=>storyCard(a,db,'standard',i)).join('')||'<div class="rb-empty">هنوز خبری در این دسته‌بندی منتشر نشده است.</div>')+'</div></main>'+footer();
  return shell('اخبار '+c.name+' | نبض ساردو',''+body,'آخرین اخبار '+c.name+' در نبض ساردو.',{canonical:'/category/'+encodeURIComponent(c.id)});
}
const HUBS={
  sardouiyeh:{name:'ساردوئیه',terms:['ساردوئیه','ساردو'],en:'SARDOUIYEH'},
  jiroft:{name:'جیرفت',terms:['جیرفت'],en:'JIROFT'},
  anbarabad:{name:'عنبرآباد',terms:['عنبرآباد','عنبر آباد'],en:'ANBARABAD'},
  kahnuj:{name:'کهنوج',terms:['کهنوج'],en:'KAHNUJ'},
  'south-kerman':{name:'جنوب کرمان',terms:['جنوب کرمان','کرمان جنوبی','جیرفت','کهنوج','عنبرآباد','رودبار جنوب','منوجان','فاریاب','قلعه گنج','جازموریان'],en:'SOUTH KERMAN'}
};
function localHub(db,key){
  const hub=HUBS[key];if(!hub)return null;
  const list=sortedNews(db).filter(a=>hub.terms.some(t=>[a.location,a.title,a.lead,a.body].join(' ').includes(t)));
  const body=header(db,'')+'<main class="rb-shell rb-page"><div class="rb-page-heading rb-local-heading"><span class="rb-kicker">LOCAL DESK / '+hub.en+'</span><h1>روایت <em>'+e(hub.name)+'</em></h1><p>خبرهای میدانی، رویدادها و مطالبات مردم '+e(hub.name)+'.</p></div><div class="rb-news-grid">'+(list.map((a,i)=>storyCard(a,db,'standard',i)).join('')||'<div class="rb-empty">هنوز خبری برای این منطقه منتشر نشده است.</div>')+'</div></main>'+footer();
  return shell('اخبار '+hub.name+' | نبض ساردو',''+body,'آخرین اخبار و گزارش‌های '+hub.name+'.',{canonical:'/local/'+key});
}
function antiSpamFields(){
  const siteKey=String(typeof process!=='undefined'&&process.env?process.env.TURNSTILE_SITE_KEY||'':'').trim();
  const widget=siteKey?'<div class="cf-turnstile" data-sitekey="'+e(siteKey)+'"></div><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>':'';
  return '<div aria-hidden="true" style="position:absolute!important;clip:rect(0,0,0,0)!important;clip-path:inset(50%)!important;width:1px!important;height:1px!important;overflow:hidden!important;white-space:nowrap!important"><label>این فیلد را خالی بگذارید<input name="website" tabindex="-1" autocomplete="off"></label></div>'+widget;
}
function simple(db,type,ok=false,uploadError=''){
  let title='',content='';
  if(type==='about'){
    title='درباره نبض ساردو';
    content='<div class="rb-page-heading"><span class="rb-kicker">ABOUT THE NEWSROOM</span><h1>رسانه‌ای از دل <em>منطقه</em></h1><p>نبض ساردو رسانه‌ای مستقل برای پوشش دقیق، مسئولانه و مستند اخبار ساردوئیه، جیرفت و جنوب کرمان است.</p></div><div class="rb-simple-copy"><h2>روایت مردم، نه فقط رویدادها</h2><p>تمرکز نبض ساردو بر خبرهای محلی، مسائل اجتماعی، اقتصاد منطقه، کشاورزی، محیط زیست، فرهنگ و روایت‌های انسانی است.</p><p>ما تلاش می‌کنیم صدای مردم منطقه باشیم و خبر را با دقت، شفافیت و احترام به مخاطب منتشر کنیم.</p></div>';
  }else if(type==='contact'){
    title='تماس با تحریریه';
    content='<div class="rb-page-heading"><span class="rb-kicker">CONTACT THE NEWSROOM</span><h1>با ما <em>در ارتباط باش</em></h1><p>پیشنهاد، انتقاد، اصلاح خبر یا موضوعی برای پیگیری داری؟ برای تحریریه بنویس.</p></div>'+(ok?'<div class="rb-success">پیام شما ثبت شد. از اینکه با تحریریه در ارتباط هستید سپاسگزاریم.</div>':'')+'<form class="rb-form" method="post" action="/contact"><label>نام و نام خانوادگی<input name="name" maxlength="120" required></label><label>شماره تماس یا راه ارتباطی<input name="contact" maxlength="120" required></label><label>موضوع پیام<input name="subject" maxlength="180" required></label><label>متن پیام<textarea name="message" rows="6" maxlength="5000" required></textarea></label>'+antiSpamFields()+'<button class="rb-button">ارسال پیام ←</button></form>';
  }else{
    title='ارسال خبر مردمی';
    const error=uploadError==='large'?'حجم فایل ارسالی بیش از حد مجاز است.':uploadError==='type'?'فرمت فایل پشتیبانی نمی‌شود.':'';
    content='<div class="rb-page-heading"><span class="rb-kicker">CITIZEN JOURNALISM</span><h1>خبر را از <em>شما می‌شنویم</em></h1><p>اگر از یک رویداد، مشکل محلی یا اتفاق مهم خبر دارید، آن را با تحریریه نبض ساردو به اشتراک بگذارید.</p></div>'+(ok?'<div class="rb-success">گزارش شما با موفقیت ثبت شد و برای بررسی به تحریریه ارسال شد.</div>':'')+(error?'<div class="rb-error">'+e(error)+'</div>':'')+'<form class="rb-form" method="post" action="/send-news" enctype="multipart/form-data"><label>عنوان خبر<input name="headline" maxlength="220" required></label><div class="rb-form-row"><label>نام شما<input name="name" maxlength="120" required></label><label>شماره تماس<input name="phone" maxlength="40" required></label></div><label>محل وقوع خبر<input name="location" maxlength="160" placeholder="مثلاً جیرفت، ساردوئیه..." required></label><label>شرح کامل گزارش<textarea name="details" rows="7" maxlength="10000" required></textarea></label><label>عکس یا ویدئوی مرتبط<input type="file" name="mediaFile" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"><small>حداکثر حجم فایل ۵۰ مگابایت است.</small></label>'+antiSpamFields()+'<button class="rb-button">ارسال گزارش به تحریریه ←</button></form>';
  }
  const body=header(db,'')+'<main class="rb-shell rb-page rb-simple-page">'+content+'</main>'+footer();
  return shell(title+' | نبض ساردو',''+body,title+'؛ نبض ساردو رسانه مستقل جنوب کرمان.',{canonical:'/'+(type==='send-news'?'send-news':type)});
}

function followup(db){
  const list=[...(db.followups||[])].sort((a,b)=>new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0));
  const labels={announced:'اعلام شد',started:'شروع شد',progress:'در حال اجرا',completed:'تکمیل شد',paused:'متوقف / در انتظار',closed:'مختومه'};
  const cards=list.map((x,i)=>'<article class="rb-followup-card"><div class="rb-followup-card-top"><span class="rb-kicker">CASE / '+String(i+1).padStart(2,'0')+'</span><span class="rb-followup-status">'+e(labels[x.status]||'در حال پیگیری')+'</span></div><h2>'+e(x.title||'پرونده پیگیری')+'</h2>'+(x.promise?'<p>'+e(x.promise)+'</p>':'')+'<div class="rb-followup-meta">'+[x.promisor,x.location,x.deadline?'موعد: '+x.deadline:''].filter(Boolean).map(e).join(' · ')+'</div>'+(x.note?'<div class="rb-followup-note"><b>آخرین وضعیت</b><p>'+e(x.note)+'</p></div>':'')+(x.sourceUrl?'<a class="rb-read-link" href="'+e(x.sourceUrl)+'" target="_blank" rel="noopener">'+e(x.sourceLabel||'مشاهده منبع')+' ↗</a>':'')+'</article>').join('');
  const body=header(db,'follow-up')+'<main class="rb-shell rb-page"><div class="rb-page-heading"><span class="rb-kicker">PUBLIC ACCOUNTABILITY / SOUTH KERMAN</span><h1>پیگیری تا <em>نتیجه</em></h1><p>پرونده‌های عمومی که نبض ساردو وضعیت آن‌ها را از زمان اعلام تا رسیدن به نتیجه دنبال می‌کند.</p></div><div class="rb-followup-grid">'+(cards||'<div class="rb-empty">هنوز پرونده‌ای برای پیگیری عمومی ثبت نشده است.</div>')+'</div></main>'+footer();
  return shell('پیگیری تا نتیجه | نبض ساردو',body,'پیگیری وعده‌ها، پروژه‌ها و مسائل عمومی ساردوئیه و جنوب کرمان',{canonical:'/follow-up',robots:list.length?'index,follow,max-image-preview:large':'noindex,follow'});
}
function editorialPolicy(db){
  const items=[
    ['01 / ACCURACY','دقت و راستی‌آزمایی','خبرها پیش از انتشار بر اساس اطلاعات قابل بررسی، منابع رسمی، گزارش میدانی یا اسناد معتبر تنظیم می‌شوند.'],
    ['02 / SOURCES','منبع و نویسنده','منبع خبر، نام نویسنده یا تحریریه، محل و زمان انتشار تا حد امکان برای مخاطب روشن است.'],
    ['03 / CORRECTIONS','اصلاح و شفافیت','خطاهای معنادار پس از بررسی اصلاح یا تکمیل می‌شوند؛ خبر قدیمی صرفاً برای تازه جلوه‌دادن، به‌روزرسانی مصنوعی نمی‌شود.'],
    ['04 / VISUALS','عکس و تصویر','عکس واقعی رویداد در اولویت است. کاور گرافیکی یا تصویر تولیدشده، جایگزین مستندات تصویری رویداد معرفی نمی‌شود.'],
    ['05 / CITIZEN REPORTS','خبرهای مردمی','ارسال متن، عکس یا ویدئو به معنی تأیید یا انتشار خودکار نیست؛ همه گزارش‌ها پیش از انتشار بررسی می‌شوند.'],
    ['06 / INDEPENDENCE','استقلال تحریریه','محتوای تبلیغاتی از خبر تفکیک می‌شود و آگهی یا اطلاعیه‌های غیرخبری به‌عنوان گزارش خبری منتشر نمی‌شوند.']
  ];
  const cards=items.map(x=>'<article class="rb-policy-card"><span class="rb-kicker">'+e(x[0])+'</span><h2>'+e(x[1])+'</h2><p>'+e(x[2])+'</p></article>').join('');
  const body=header(db,'editorial-policy')+'<main class="rb-shell rb-page"><div class="rb-page-heading"><span class="rb-kicker">EDITORIAL STANDARDS / NABZ SARDO</span><h1>اصول <em>تحریریه</em></h1><p>اعتماد مخاطب با دقت، شفافیت و مسئولیت‌پذیری ساخته می‌شود. این اصول مبنای کار تحریریه نبض ساردو هستند.</p></div><div class="rb-policy-grid">'+cards+'</div><section class="rb-policy-contact"><span class="rb-kicker">CORRECTIONS & CONTACT</span><h2>اگر خطایی دیدید، به ما اطلاع دهید.</h2><p>برای اعلام خطا، درخواست اصلاح یا ارائه اطلاعات تکمیلی با تحریریه در ارتباط باشید.</p><a class="rb-button" href="/contact">ارتباط با تحریریه ←</a></section></main>'+footer();
  return shell('سیاست تحریریه و اصلاحات | نبض ساردو',body,'اصول دقت، راستی‌آزمایی، اصلاح خبر، منابع و استقلال تحریریه نبض ساردو',{canonical:'/editorial-policy',schema:{'@context':'https://schema.org','@type':'WebPage',name:'سیاست تحریریه نبض ساردو',url:absoluteUrl('/editorial-policy'),isPartOf:{'@type':'WebSite',name:'نبض ساردو',url:PUBLIC_BASE+'/'}}});
}

module.exports={home,archive,briefs,article,category,simple,search,localHub,followup,editorialPolicy};
