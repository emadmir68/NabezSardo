'use strict';
const {published}=require('./store');
const {browseNews}=require('./news-browse');
const {e,fmt,dateOnly,excerpt,imageFor,shell,header,footer,storyCard,sectionTitle,absoluteUrl,PUBLIC_BASE,catEn,shortArticleCode}=require('./rebirth-shared');

function sortedNews(db){
  return published(db).slice().sort((a,b)=>new Date(b.publishedAt||b.createdAt||0)-new Date(a.publishedAt||a.createdAt||0));
}
function siteSchema(){
  return [
    {'@context':'https://schema.org','@type':'WebSite',name:'نبض ساردو',alternateName:'Nabz Sardo',url:absoluteUrl('/'),inLanguage:'fa-IR',potentialAction:{'@type':'SearchAction',target:absoluteUrl('/search?q={search_term_string}'),'query-input':'required name=search_term_string'}},
    {'@context':'https://schema.org','@type':'NewsMediaOrganization',name:'نبض ساردو',alternateName:'Nabz Sardo',url:absoluteUrl('/'),description:'رسانه مستقل خبری و تحلیلی ساردوئیه، جیرفت و جنوب کرمان',areaServed:[{'@type':'Place',name:'ساردوئیه'},{'@type':'Place',name:'جیرفت'},{'@type':'Place',name:'جنوب کرمان'}]}
  ];
}
function articleSchema(a,c){
  const url=absoluteUrl('/news/'+encodeURIComponent(a.slug||''));
  const schema={'@context':'https://schema.org','@type':'NewsArticle',mainEntityOfPage:{'@type':'WebPage','@id':url},headline:a.title,description:excerpt(a.lead||a.body||a.title,220),datePublished:a.publishedAt||a.createdAt,dateModified:a.updatedAt||a.publishedAt||a.createdAt,inLanguage:'fa-IR',isAccessibleForFree:true,articleSection:c?.name||'خبر',author:{'@type':String(a.author||'').includes('تحریریه')?'Organization':'Person',name:a.author||'تحریریه نبض ساردو'},publisher:{'@type':'NewsMediaOrganization',name:'نبض ساردو',url:absoluteUrl('/')},url,image:[absoluteUrl(a.socialImage||a.image||'/header-mosque-fixed.jpg')]};
  return schema;
}
function heroMarkup(a,db,index){
  const cat=(db.categories||[]).find(x=>x.id===a.categoryId);
  const image=imageFor(a),url='/news/'+encodeURIComponent(a.slug||'');
  const media=a.videoUrl?'<video class="rb-hero-media" controls playsinline preload="metadata" poster="'+e(image)+'"><source src="'+e(a.videoUrl)+'" type="'+e(a.videoType||'video/mp4')+'"></video>':'<img class="rb-hero-media" src="'+e(image)+'" alt="'+e(a.title)+'" fetchpriority="high" decoding="async">';
  return '<article class="rb-hero-story"><a class="rb-hero-visual" href="'+e(url)+'">'+media+'<span class="rb-hero-visual-shade"></span><span class="rb-hero-number">'+String(index+1).padStart(2,'0')+'</span><span class="rb-hero-photo-label">SOUTH KERMAN / FIELD REPORT</span></a><div class="rb-hero-copy"><span class="rb-kicker"><span class="rb-fa">'+e(cat?.name||'گزارش ویژه')+' / روایت اصلی</span><span class="rb-en">'+e(catEn(cat?.name||'News'))+' / LEAD STORY</span></span><h1><a href="'+e(url)+'"><span class="rb-fa">'+e(a.title||'نبض ساردو؛ روایت جنوب کرمان')+'</span><span class="rb-en">'+e(a.titleEn||a.title||'Nabz Sardo — Stories from South Kerman')+'</span></a></h1><p><span class="rb-fa">'+e(excerpt(a.lead||a.body||'خبرها و روایت‌های مستند از ساردوئیه، جیرفت و جنوب کرمان.',220))+'</span><span class="rb-en">'+e(excerpt(a.leadEn||a.lead||a.body||'Independent reporting from Sardouiyeh, Jiroft and South Kerman.',220))+'</span></p><div class="rb-hero-actions"><a class="rb-button" href="'+e(url)+'"><span class="rb-fa">خواندن گزارش</span><span class="rb-en">Read the report</span> <b>←</b></a><span>'+e(dateOnly(a.publishedAt||a.createdAt))+'　·　'+Number(a.views||0).toLocaleString('fa-IR')+' <span class="rb-fa">بازدید</span><span class="rb-en">views</span></span></div></div></article>';
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
  const side=heroSide.map((a,i)=>{const cat=(db.categories||[]).find(c=>c.id===a.categoryId);return '<a class="rb-hero-side-item" href="/news/'+e(a.slug)+'"><span class="rb-side-no">'+String(i+2).padStart(2,'0')+'</span><span><small><span class="rb-fa">'+e(cat?.name||'خبر')+'</span><span class="rb-en">'+e(catEn(cat?.name||'News'))+'</span></small><b><span class="rb-fa">'+e(a.title)+'</span><span class="rb-en">'+e(a.titleEn||a.title)+'</span></b><time>'+e(dateOnly(a.publishedAt||a.createdAt))+'</time></span></a>';}).join('');
  const categoryStrip=cats.map((c,i)=>'<a class="rb-category-tile" href="/category/'+encodeURIComponent(c.id)+'"><span>0'+(i+1)+'</span><b><span class="rb-fa">'+e(c.name)+'</span><span class="rb-en">'+e(catEn(c.name))+'</span></b><i>↙</i></a>').join('');
  const latestGrid=latest.map((a,i)=>storyCard(a,db,'standard',i)).join('');
  const popularMarkup=popular.map((a,i)=>'<a class="rb-popular-row" href="/news/'+e(a.slug)+'"><span>'+String(i+1).padStart(2,'0')+'</span><b><span class="rb-fa">'+e(a.title)+'</span><span class="rb-en">'+e(a.titleEn||a.title)+'</span></b><small>'+Number(a.views||0).toLocaleString('fa-IR')+' <span class="rb-fa">بازدید</span><span class="rb-en">views</span></small></a>').join('');
  const shortMarkup=short.map(a=>'<a class="rb-brief-row" href="/news/'+e(a.slug)+'"><span>●</span><b><span class="rb-fa">'+e(a.title)+'</span><span class="rb-en">'+e(a.titleEn||a.title)+'</span></b><time>'+e(fmt(a.publishedAt||a.createdAt))+'</time></a>').join('');
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
function archive(db,options={}){
  const result=browseNews(db.articles||[],options);
  const {items,total,pages,page,q,category:categoryId,period}=result;
  const filtered=Boolean(q||categoryId||period);
  const urlFor=number=>{
    const params=new URLSearchParams();
    if(q)params.set('q',q);
    if(categoryId)params.set('category',categoryId);
    if(period)params.set('period',period);
    if(number>1)params.set('page',String(number));
    return '/all-news'+(params.size?'?'+params.toString():'');
  };
  const selected=value=>value===categoryId?' selected':'';
  const periods=[['','همه زمان‌ها'],['today','امروز'],['week','۷ روز گذشته'],['month','۳۰ روز گذشته']];
  const visiblePages=[...new Set([1,pages,page-2,page-1,page,page+1,page+2].filter(n=>n>=1&&n<=pages))].sort((a,b)=>a-b);
  const numbers=visiblePages.map((n,i)=>{
    const gap=i&&n>visiblePages[i-1]+1?'<span class="rb-page-gap" aria-hidden="true">…</span>':'';
    return gap+(n===page?'<span class="rb-page-current" aria-current="page">'+n.toLocaleString('fa-IR')+'</span>':'<a href="'+e(urlFor(n))+'" aria-label="صفحه '+n.toLocaleString('fa-IR')+'">'+n.toLocaleString('fa-IR')+'</a>');
  }).join('');
  const pager=pages>1?'<nav class="rb-pagination" aria-label="صفحه‌های آرشیو">'+(page>1?'<a rel="prev" href="'+e(urlFor(page-1))+'">صفحه قبل</a>':'')+numbers+(page<pages?'<a rel="next" href="'+e(urlFor(page+1))+'">صفحه بعد</a>':'')+'</nav>':'';
  const range=total?((page-1)*result.pageSize+1).toLocaleString('fa-IR')+' تا '+Math.min(page*result.pageSize,total).toLocaleString('fa-IR')+' از '+total.toLocaleString('fa-IR')+' خبر':'۰ خبر';
  const form='<form class="rb-page-search rb-archive-filters" action="/all-news" method="get" role="search"><label class="rb-archive-field" for="archive-q"><span>عبارت جست‌وجو</span><input id="archive-q" type="search" name="q" value="'+e(q)+'" placeholder="تیتر یا متن خبر"></label><label class="rb-archive-field" for="archive-category"><span>دسته خبر</span><select id="archive-category" name="category"><option value="">همه دسته‌ها</option>'+(db.categories||[]).map(c=>'<option value="'+e(c.id)+'"'+selected(c.id)+'>'+e(c.name)+'</option>').join('')+'</select></label><label class="rb-archive-field" for="archive-period"><span>زمان انتشار</span><select id="archive-period" name="period">'+periods.map(([id,name])=>'<option value="'+id+'"'+(id===period?' selected':'')+'>'+name+'</option>').join('')+'</select></label><button type="submit">نمایش خبرها ←</button></form>'
  const cards=items.map((a,i)=>storyCard(a,db,'standard',i)).join('');
  const empty='<div class="rb-empty"><h2>خبری با این فیلترها پیدا نشد.</h2><p>عبارت یا بازه زمانی را تغییر بده.</p><a class="rb-button rb-button-ghost" href="/all-news">همه خبرها</a></div>';
  const body=header(db,'all')+'<main class="rb-shell rb-page"><div class="rb-page-heading"><span class="rb-kicker">THE ARCHIVE / 01</span><h1>آرشیو <em>خبرها</em></h1><p>جریان کامل خبرها و روایت‌های منتشرشده در نبض ساردو.</p>'+form+'</div><div class="rb-results-meta"><b>'+range+'</b><span>مرتب‌شده بر اساس زمان انتشار</span>'+(filtered?'<a href="/all-news">پاک کردن فیلترها</a>':'')+'</div><div class="rb-news-grid">'+(cards||empty)+'</div>'+pager+'</main>'+footer();
  return shell('آرشیو اخبار ساردوئیه و جنوب کرمان'+(page>1?' · صفحه '+page.toLocaleString('fa-IR'):'')+' | نبض ساردو',body,'آرشیو کامل اخبار نبض ساردو',{canonical:!filtered&&page>1?'/all-news?page='+page:'/all-news',robots:filtered?'noindex,follow':undefined});
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
  const related=sortedNews(db).filter(x=>x.id!==a.id&&x.slug&&((a.categoryId&&x.categoryId===a.categoryId)||(a.location&&x.location===a.location))).slice(0,3);
  const image=a.image?imageFor(a):'/header-mosque-fixed.jpg';
  const url='/news/'+encodeURIComponent(a.slug||'');
  const shareUrl='/news/'+shortArticleCode(a.id);
  const previewImage=a.socialImage||image||'/header-mosque-fixed.jpg';
  const imageKind=!a.image?'none':/auto-cover/i.test(String(a.image))?'auto':'real';
  const bodyContent=a.bodyHtml||String(a.body||a.lead||'').split(/\n+/).filter(Boolean).map(p=>'<p>'+e(p)+'</p>').join('');
  const bodyContentEn=a.bodyEn?String(a.bodyEn).split(/\n+/).filter(Boolean).map(p=>'<p>'+e(p)+'</p>').join(''):bodyContent;
  const gallery=Array.isArray(a.gallery)?a.gallery:[];
  const galleryMarkup=gallery.length?'<div class="rb-article-gallery">'+gallery.map((src,i)=>'<figure><img src="'+e(src)+'" alt="'+e(a.title)+' - تصویر '+(i+1)+'" loading="lazy"></figure>').join('')+'</div>':'';
  const mediaCaption=a.imageCaption?'<figcaption class="rb-article-cover-caption">'+e(a.imageCaption)+'</figcaption>':'';
  const media=a.videoUrl?'<figure class="rb-article-cover"><video controls playsinline preload="metadata" poster="'+e(image)+'"><source src="'+e(a.videoUrl)+'" type="'+e(a.videoType||'video/mp4')+'"></video>'+mediaCaption+'</figure>':'<figure class="rb-article-cover"><img src="'+e(image)+'" alt="'+e(a.title)+'" fetchpriority="high">'+mediaCaption+'</figure>';
  const author=a.author||'تحریریه نبض ساردو';
  const authorRole=String(author).includes('تحریریه')?'تحریریه رسانه':'نویسنده این گزارش';
  const publishedAt=String(a.publishedAt||a.createdAt||'');
  const updatedAt=String(a.updatedAt||'');
  const publishedMs=Date.parse(publishedAt),updatedMs=Date.parse(updatedAt);
  const hasMeaningfulUpdate=Boolean(updatedAt&&Number.isFinite(updatedMs)&&Number.isFinite(publishedMs)&&updatedMs-publishedMs>60000);
  const updatedMeta=hasMeaningfulUpdate?'<span class="rb-meta-item"><small>آخرین به‌روزرسانی</small><time datetime="'+e(updatedAt)+'">'+e(fmt(updatedAt))+'</time></span>':'';
  const articleText=String(a.body||a.bodyHtml||a.lead||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').trim();
  const wordCount=articleText?articleText.split(/\s+/).filter(Boolean).length:1;
  const readingMinutes=Math.max(1,Math.ceil(wordCount/220));
  const articleRoot=' data-article-root data-article-title="'+e(a.title)+'" data-article-url="'+e(shareUrl)+'" data-article-canonical="'+e(url)+'" data-article-image="'+e(previewImage)+'" data-article-image-kind="'+imageKind+'" data-article-video="'+e(a.videoUrl||'')+'" data-article-video-type="'+e(a.videoType||'video/mp4')+'" data-article-category-id="'+e(a.categoryId||'')+'" data-article-lead="'+e(a.lead||excerpt(a.body||'',190))+'"';
  const shareVideo=a.videoUrl?'<button type="button" data-article-share-video>اشتراک ویدئو ↗</button>':'';
  const shareTools='<div class="rb-article-share"><b><span class="rb-fa">این روایت را به اشتراک بگذار</span><span class="rb-en">Share this story</span></b><button type="button" data-share data-article-share><span class="rb-fa">اشتراک‌گذاری</span><span class="rb-en">Share</span> ↗</button><button type="button" data-article-share-image>اشتراک با تصویر</button><button type="button" data-article-instagram-post><span data-instagram-post-label>پست اینستاگرام</span></button><button type="button" data-article-text-story>استوری متن کامل</button>'+shareVideo+'<button type="button" data-copy-link data-article-copy><span data-copy-label>کپی پیوند کوتاه</span></button><button type="button" data-article-copy-message>کپی متن آماده</button></div>';
  const correctionHref='/contact?subject='+encodeURIComponent('درخواست اصلاح خبر: '+a.title)+'&article='+encodeURIComponent(url);
  const authorCard='<section class="rb-article-author-card" aria-label="اطلاعات نویسنده و اصلاح خبر"><div class="rb-author-card-mark">'+e(author.slice(0,1))+'</div><div class="rb-author-card-copy"><span class="rb-kicker">NEWSROOM / RESPONSIBILITY</span><strong>'+e(author)+'</strong><small>'+e(authorRole)+' · نبض ساردو</small><p>برای ارسال اطلاعات تکمیلی، گزارش خطا یا درخواست اصلاح این خبر، از مسیر ارتباط با تحریریه استفاده کنید.</p></div><a class="rb-correction-link" href="'+e(correctionHref)+'" data-article-correction>گزارش خطا یا درخواست اصلاح <span>←</span></a></section>';
  const relatedMarkup=related.length?'<section class="rb-related-section" aria-labelledby="rb-related-title"><div class="rb-related-heading"><div><span class="rb-kicker">READ NEXT / ادامه روایت</span><h2 id="rb-related-title">خبرهای مرتبط</h2></div><a href="/all-news">همه خبرها <span>←</span></a></div><div class="rb-related-grid">'+related.map((x,i)=>storyCard(x,db,'related',i)).join('')+'</div></section>':'';
  const body=header(db,'')+'<main class="rb-shell rb-article-page"'+articleRoot+'><div class="article-progress" data-article-progress aria-hidden="true"><i></i></div><nav class="rb-breadcrumb"><a href="/"><span class="rb-fa">خانه</span><span class="rb-en">Home</span></a><span>/</span><a href="/category/'+encodeURIComponent(a.categoryId||'')+'"><span class="rb-fa">'+e(cat?.name||'خبر')+'</span><span class="rb-en">'+e(catEn(cat?.name||'News'))+'</span></a><span>/</span><span>'+e(excerpt(a.title,75))+'</span></nav><header class="rb-article-head"><span class="rb-kicker rb-article-kicker"><span class="rb-fa">گزارش / '+e(cat?.name||'خبر')+'</span><span class="rb-en">FIELD REPORT / '+e(catEn(cat?.name||'NEWS'))+'</span></span><h1><span class="rb-fa lang-fa">'+e(a.title)+'</span><span class="rb-en lang-en">'+e(a.titleEn||a.title)+'</span></h1><p class="rb-article-lead"><span class="rb-fa lang-fa">'+e(a.lead||excerpt(a.body||'',260))+'</span><span class="rb-en lang-en">'+e(a.leadEn||a.lead||excerpt(a.bodyEn||a.body||'',260))+'</span></p><div class="rb-article-meta"><div class="rb-author-mark">'+e(author.slice(0,1))+'</div><div><b>'+e(author)+'</b><small>'+e(authorRole)+'</small></div><span class="rb-meta-item"><small>تاریخ انتشار</small><time datetime="'+e(publishedAt)+'">'+e(fmt(publishedAt))+'</time></span><span class="rb-meta-item"><small>بازدید</small><b>'+Number(a.views||0).toLocaleString('fa-IR')+'</b></span><span class="rb-meta-item"><small>زمان مطالعه</small><b>'+readingMinutes.toLocaleString('fa-IR')+' دقیقه</b></span>'+updatedMeta+'</div></header>'+media+'<div class="rb-article-layout"><article class="rb-article-body article-body" data-article-body><div class="rb-fa lang-fa">'+bodyContent+galleryMarkup+'</div><div class="rb-en lang-en">'+bodyContentEn+galleryMarkup+'</div>'+shareTools+'</article></div>'+authorCard+relatedMarkup+'</main>'+footer()+'<script src="/assets/instagram-post.js" defer></script><script src="/assets/text-story.js" defer></script>';
  const desc=excerpt(a.lead||a.body||a.title,220);
  return shell(a.title+' | نبض ساردو',body,desc,{canonical:url,ogUrl:shareUrl,ogTitle:a.title,image:previewImage,imageAlt:a.title,ogType:'article',publishedTime:publishedAt||a.createdAt,modifiedTime:updatedAt||publishedAt||a.createdAt,section:cat?.name,schema:articleSchema(a,cat)});
}
function category(db,c){
  const list=sortedNews(db).filter(a=>a.categoryId===c.id);
  const body=header(db,c.id)+'<main class="rb-shell rb-page"><div class="rb-page-heading"><span class="rb-kicker">NEWS DESK / '+e(String(c.id||'').toUpperCase())+'</span><h1>اخبار <em>'+e(c.name)+'</em></h1><p>آخرین خبرها، گزارش‌ها و روایت‌های مرتبط با '+e(c.name)+' در جنوب کرمان.</p></div><div class="rb-results-meta"><b>'+list.length.toLocaleString('fa-IR')+' خبر</b><span>آخرین به‌روزرسانی‌ها</span></div><div class="rb-news-grid">'+(list.map((a,i)=>storyCard(a,db,'standard',i)).join('')||'<div class="rb-empty">هنوز خبری در این دسته‌بندی منتشر نشده است.</div>')+'</div></main>'+footer();
  return shell('اخبار '+c.name+' | نبض ساردو',''+body,'آخرین اخبار '+c.name+' در نبض ساردو.',{canonical:'/category/'+encodeURIComponent(c.id)});
}
const HUBS={
  sardouiyeh:{name:'ساردوئیه',terms:['ساردوئیه','ساردو'],en:'SARDOUIYEH'},
  jiroft:{name:'جیرفت',terms:['جیرفت'],en:'JIROFT'},
  'south-kerman':{name:'جنوب کرمان',terms:['جنوب کرمان','کرمان جنوبی','جیرفت','کهنوج','عنبرآباد','رودبار جنوب','منوجان','فاریاب','قلعه گنج','جازموریان'],en:'SOUTH KERMAN'},
  anbarabad:{name:'عنبرآباد',terms:['عنبرآباد','عنبر آباد'],en:'ANBARABAD'},
  kahnuj:{name:'کهنوج',terms:['کهنوج'],en:'KAHNUJ'}
};
function localHub(db,key){
  const hub=HUBS[key];if(!hub)return null;
  const list=sortedNews(db).filter(a=>hub.terms.some(t=>[a.location,a.title,a.lead,a.body].join(' ').includes(t)));
  const body=header(db,'')+'<main class="rb-shell rb-page"><div class="rb-page-heading rb-local-heading"><span class="rb-kicker">LOCAL DESK / '+hub.en+'</span><h1>روایت <em>'+e(hub.name)+'</em></h1><p>خبرهای میدانی، رویدادها و مطالبات مردم '+e(hub.name)+'.</p></div><div class="rb-news-grid">'+(list.map((a,i)=>storyCard(a,db,'standard',i)).join('')||'<div class="rb-empty">هنوز خبری برای این منطقه منتشر نشده است.</div>')+'</div></main>'+footer();
  return shell('اخبار '+hub.name+' | نبض ساردو',''+body,'آخرین اخبار و گزارش‌های '+hub.name+'.',{canonical:'/local/'+key,schema:{'@context':'https://schema.org','@type':'CollectionPage',name:'اخبار '+hub.name+' | نبض ساردو',description:'آخرین اخبار و گزارش‌های '+hub.name+'.',url:absoluteUrl('/local/'+key),isPartOf:{'@type':'WebSite',name:'نبض ساردو',url:absoluteUrl('/')}}});
}
function simple(db,type,ok=false,uploadError='',params=new URLSearchParams()){
  let title='',content='';
  if(type==='about'){
    title='درباره نبض ساردو';
    content='<div class="rb-page-heading"><span class="rb-kicker">ABOUT THE NEWSROOM</span><h1>رسانه‌ای از دل <em>منطقه</em></h1><p>نبض ساردو رسانه‌ای مستقل برای پوشش دقیق، مسئولانه و مستند اخبار ساردوئیه، جیرفت و جنوب کرمان است.</p></div><div class="rb-simple-copy"><h2>روایت مردم، نه فقط رویدادها</h2><p>تمرکز نبض ساردو بر خبرهای محلی، مسائل اجتماعی، اقتصاد منطقه، کشاورزی، محیط زیست، فرهنگ و روایت‌های انسانی است.</p><p>ما تلاش می‌کنیم صدای مردم منطقه باشیم و خبر را با دقت، شفافیت و احترام به مخاطب منتشر کنیم.</p></div>';
  }else if(type==='contact'){
    title='تماس با تحریریه';
    const subject=String(params?.get?.('subject')||'').slice(0,180);
    const articlePath=String(params?.get?.('article')||'').slice(0,320);
    const correctionMessage=articlePath?'لینک خبر: '+absoluteUrl(articlePath)+'\n\nشرح خطا یا اصلاحیه موردنظر:\n':'';
    content='<div class="rb-page-heading"><span class="rb-kicker">CONTACT THE NEWSROOM</span><h1>با ما <em>در ارتباط باش</em></h1><p>پیشنهاد، انتقاد، اصلاح خبر یا موضوعی برای پیگیری داری؟ از راه ارتباط رسمی با تحریریه در تماس باش.</p></div>'+(ok?'<div class="rb-success">پیام شما ثبت شد. از اینکه با تحریریه در ارتباط هستید سپاسگزاریم.</div>':'')+'<form class="rb-form" method="post" action="/contact"><label>نام و نام خانوادگی<input name="name" maxlength="120" required></label><label>شماره تماس یا راه ارتباطی<input name="contact" maxlength="120" required></label><label>موضوع پیام<input name="subject" maxlength="180" value="'+e(subject)+'" required></label><label>متن پیام<textarea name="message" rows="6" maxlength="5000" required>'+e(correctionMessage)+'</textarea></label><button class="rb-button">ارسال پیام ←</button></form>';
  }else{
    title='ارسال خبر مردمی';
    const error=uploadError==='large'?'حجم فایل ارسالی بیش از حد مجاز است.':uploadError==='type'?'فرمت فایل پشتیبانی نمی‌شود.':'';
    content='<div class="rb-page-heading"><span class="rb-kicker">CITIZEN JOURNALISM</span><h1>خبر را از <em>شما می‌شنویم</em></h1><p>اگر از یک رویداد، مشکل محلی یا اتفاق مهم خبر دارید، آن را با تحریریه نبض ساردو به اشتراک بگذارید.</p></div>'+(ok?'<div class="rb-success">گزارش شما با موفقیت ثبت شد و برای بررسی به تحریریه ارسال شد.</div>':'')+(error?'<div class="rb-error">'+e(error)+'</div>':'')+'<form class="rb-form" method="post" action="/send-news" enctype="multipart/form-data"><label>عنوان خبر<input name="headline" maxlength="220" required></label><div class="rb-form-row"><label>نام شما<input name="name" maxlength="120" required></label><label>شماره تماس<input name="phone" maxlength="40" required></label></div><label>محل وقوع خبر<input name="location" maxlength="160" placeholder="مثلاً جیرفت، ساردوئیه..." required></label><label>شرح کامل گزارش<textarea name="details" rows="7" maxlength="10000" required></textarea></label><label>عکس یا ویدئوی مرتبط<input type="file" name="mediaFile" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"><small>حداکثر حجم فایل ۵۰ مگابایت است.</small></label><button class="rb-button">ارسال گزارش به تحریریه ←</button></form>';
  }
  const body=header(db,'')+'<main class="rb-shell rb-page rb-simple-page">'+content+'</main>'+footer();
  return shell(title+' | نبض ساردو',''+body,title+'؛ نبض ساردو رسانه مستقل جنوب کرمان.',{canonical:'/'+(type==='send-news'?'send-news':type),robots:type==='send-news'?'noindex,follow':undefined});
}
function editorialPolicy(db){
  const cards=[
    ['دقت و راستی‌آزمایی','خبرها پیش از انتشار بر اساس اطلاعات قابل بررسی، منابع رسمی یا گزارش میدانی تنظیم می‌شوند.'],
    ['منبع و نویسنده','نویسنده یا تحریریه، زمان انتشار و محل خبر در صفحه هر خبر روشن است.'],
    ['اصلاح خبر','خطاهای معنادار پس از بررسی اصلاح یا تکمیل می‌شوند؛ خبر قدیمی صرفاً برای تازه جلوه دادن به‌روزرسانی مصنوعی نمی‌شود.'],
    ['عکس و کاور خودکار','عکس واقعی خبر در اولویت است. کاور گرافیکی خودکار فقط تصویر معرفی خبر است و عکس واقعی رویداد محسوب نمی‌شود.'],
    ['خبر مردمی','ارسال متن، عکس یا ویدئو به معنی تأیید یا انتشار خودکار نیست و محتوای ارسالی نیازمند بررسی تحریریه است.'],
    ['ارتباط با تحریریه','برای اعلام خطا، درخواست اصلاح یا ارائه اطلاعات تکمیلی از صفحه تماس با تحریریه استفاده کنید.']
  ];
  const body=header(db,'')+'<main class="rb-shell rb-page rb-simple-page"><div class="rb-page-heading"><span class="rb-kicker">EDITORIAL STANDARDS / NABZ SARDO</span><h1>سیاست تحریریه و <em>اصلاحات</em></h1><p>اصول دقت، راستی‌آزمایی، شفافیت منابع و مسئولیت‌پذیری در انتشار خبرهای محلی.</p></div><div class="rb-news-grid">'+cards.map((x,i)=>'<article class="rb-simple-copy"><span class="rb-kicker">0'+(i+1)+' / EDITORIAL POLICY</span><h2>'+e(x[0])+'</h2><p>'+e(x[1])+'</p></article>').join('')+'</div><p class="rb-simple-copy">برای اعلام خطا یا درخواست اصلاح، <a href="/contact">با تحریریه تماس بگیرید</a>.</p></main>'+footer();
  return shell('سیاست تحریریه و اصلاحات | نبض ساردو',body,'اصول تحریریه، راستی‌آزمایی، اصلاح خبر، منابع و سیاست استفاده از تصاویر در نبض ساردو',{canonical:'/editorial-policy',schema:{'@context':'https://schema.org','@type':'WebPage',name:'سیاست تحریریه و اصلاحات نبض ساردو',url:absoluteUrl('/editorial-policy'),isPartOf:{'@type':'WebSite',name:'نبض ساردو',url:absoluteUrl('/')}}});
}
function followup(db){
  const list=[...(db.followups||[])].sort((a,b)=>new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0));
  const statusLabel={announced:'اعلام شد',started:'شروع شد',progress:'در حال اجرا',completed:'تکمیل شد',paused:'متوقف / در انتظار',closed:'مختومه'};
  const rows=list.map((x,i)=>'<article class="rb-simple-copy"><span class="rb-kicker">FOLLOW-UP / '+e(statusLabel[String(x.status||'announced')]||'پیگیری')+'</span><h2>'+e(x.title||'پرونده پیگیری')+'</h2>'+(x.promise?'<p>'+e(x.promise)+'</p>':'')+'<small>'+[x.promisor,x.location,x.deadline?'موعد: '+x.deadline:''].filter(Boolean).map(e).join(' · ')+'</small>'+(x.note?'<p><b>آخرین وضعیت:</b> '+e(x.note)+'</p>':'')+(x.sourceUrl?'<p><a href="'+e(x.sourceUrl)+'">'+e(x.sourceLabel||'مشاهده منبع')+' ←</a></p>':'')+'</article>').join('');
  const body=header(db,'')+'<main class="rb-shell rb-page rb-simple-page"><div class="rb-page-heading"><span class="rb-kicker">FOLLOW-UP DESK / NABZ SARDO</span><h1>پیگیری تا <em>نتیجه</em></h1><p>پرونده‌های عمومی که نبض ساردو وضعیت آن‌ها را از زمان اعلام تا نتیجه دنبال می‌کند.</p></div><div class="rb-news-grid">'+(rows||'<div class="rb-empty">هنوز پرونده عمومی برای پیگیری ثبت نشده است.</div>')+'</div></main>'+footer();
  return shell('پیگیری تا نتیجه | نبض ساردو',body,'پیگیری وعده‌ها، پروژه‌ها و مسائل عمومی ساردوئیه و جنوب کرمان تا رسیدن به نتیجه',{canonical:'/follow-up',robots:list.length?'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1':'noindex,follow'});
}
module.exports={home,archive,briefs,article,category,simple,search,localHub,editorialPolicy,followup};
