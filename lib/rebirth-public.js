'use strict';
const {published}=require('./store');
const {e,fmt,dateOnly,excerpt,imageFor,shell,header,footer,storyCard,sectionTitle,absoluteUrl,PUBLIC_BASE}=require('./rebirth-shared');

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
  return '<article class="rb-hero-story"><a class="rb-hero-visual" href="'+e(url)+'">'+media+'<span class="rb-hero-visual-shade"></span><span class="rb-hero-number">'+String(index+1).padStart(2,'0')+'</span><span class="rb-hero-photo-label">SOUTH KERMAN / FIELD REPORT</span></a><div class="rb-hero-copy"><span class="rb-kicker">'+e(cat?.name||'گزارش ویژه')+' / روایت اصلی</span><h1><a href="'+e(url)+'">'+e(a.title||'نبض ساردو؛ روایت جنوب کرمان')+'</a></h1><p>'+e(excerpt(a.lead||a.body||'خبرها و روایت‌های مستند از ساردوئیه، جیرفت و جنوب کرمان.',220))+'</p><div class="rb-hero-actions"><a class="rb-button" href="'+e(url)+'">خواندن گزارش <b>←</b></a><span>'+e(dateOnly(a.publishedAt||a.createdAt))+'　·　'+Number(a.views||0).toLocaleString('fa-IR')+' بازدید</span></div></div></article>';
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
  const hero=lead?heroMarkup(lead,db,0):'<div class="rb-hero-empty"><span class="rb-kicker">THE LOCAL NEWSROOM</span><h1>نبض ساردو؛<br>روایت جنوب کرمان</h1><p>خبر دقیق، روایت انسانی و صدای مردم منطقه.</p><a class="rb-button" href="/send-news">ارسال خبر مردمی ←</a></div>';
  const side=heroSide.map((a,i)=>'<a class="rb-hero-side-item" href="/news/'+e(a.slug)+'"><span class="rb-side-no">'+String(i+2).padStart(2,'0')+'</span><span><small>'+e((db.categories||[]).find(c=>c.id===a.categoryId)?.name||'خبر')+'</small><b>'+e(a.title)+'</b><time>'+e(dateOnly(a.publishedAt||a.createdAt))+'</time></span></a>').join('');
  const categoryStrip=cats.map((c,i)=>'<a class="rb-category-tile" href="/category/'+encodeURIComponent(c.id)+'"><span>0'+(i+1)+'</span><b>'+e(c.name)+'</b><i>↙</i></a>').join('');
  const latestGrid=latest.map((a,i)=>storyCard(a,db,'standard',i)).join('');
  const popularMarkup=popular.map((a,i)=>'<a class="rb-popular-row" href="/news/'+e(a.slug)+'"><span>'+String(i+1).padStart(2,'0')+'</span><b>'+e(a.title)+'</b><small>'+Number(a.views||0).toLocaleString('fa-IR')+' بازدید</small></a>').join('');
  const shortMarkup=short.map(a=>'<a class="rb-brief-row" href="/news/'+e(a.slug)+'"><span>●</span><b>'+e(a.title)+'</b><time>'+e(fmt(a.publishedAt||a.createdAt))+'</time></a>').join('');
  const regional='<section class="rb-region-band"><div class="rb-region-intro"><span class="rb-kicker">A PLACE. MANY STORIES.</span><h2>از دل منطقه،<br><em>برای آینده منطقه.</em></h2><p>روایت ساردوئیه، جیرفت و جنوب کرمان از نزدیک؛ با تمرکز بر مردم، اقتصاد، فرهنگ و سرزمین.</p></div><div class="rb-region-map" aria-label="پوشش خبری جنوب کرمان"><div class="rb-map-lines"></div><span class="rb-map-label rb-map-label-one">ساردوئیه</span><span class="rb-map-label rb-map-label-two">جیرفت</span><span class="rb-map-label rb-map-label-three">جنوب کرمان</span><span class="rb-map-pulse"></span><span class="rb-map-coord">28° 40′ N / 57° 44′ E</span></div></section>';
  const body=header(db,'home')+
    '<main class="rb-main"><div class="rb-breaking"><div class="rb-shell rb-breaking-inner"><strong><i></i> نبض فوری</strong><p>'+e(breaking)+'</p><a href="/all-news">همه خبرها ↙</a></div></div>'+
    '<section class="rb-shell rb-home-hero"><div class="rb-hero-index"><span>01</span><small>THE LEAD STORY</small><i></i></div><div class="rb-hero-grid">'+hero+'<aside class="rb-hero-sidebar"><div class="rb-side-head"><span>THE NEWS INDEX</span><b>روایت‌های بعدی</b></div>'+(side||'<p class="rb-empty">خبرهای بعدی پس از انتشار اینجا نمایش داده می‌شوند.</p>')+'</aside></div><div class="rb-hero-bottomline"><span>INDEPENDENT LOCAL JOURNALISM</span><span>ساردوئیه　/　جیرفت　/　جنوب کرمان</span></div></section>'+
    '<section class="rb-shell rb-category-section">'+sectionTitle('THE REGIONAL DESK','میزهای خبری','/all-news','آرشیو کامل')+'<div class="rb-category-grid">'+categoryStrip+'</div></section>'+
    '<section class="rb-shell rb-latest-section">'+sectionTitle('LATEST DISPATCHES','تازه‌ترین روایت‌ها')+'<div class="rb-news-grid">'+(latestGrid||'<div class="rb-empty">هنوز خبری منتشر نشده است.</div>')+'</div></section>'+
    regional+
    '<section class="rb-shell rb-bottom-news"><div class="rb-popular"><div class="rb-mini-heading"><span>01 / MOST READ</span><h2>پربازدیدترین‌ها</h2></div>'+(popularMarkup||'<p class="rb-empty">هنوز آماری ثبت نشده است.</p>')+'</div><div class="rb-briefs"><div class="rb-mini-heading"><span>02 / QUICK DISPATCH</span><h2>خبرهای کوتاه</h2></div>'+(shortMarkup||'<p class="rb-empty">خبر کوتاهی ثبت نشده است.</p>')+'</div></section></main>'+footer();
  return shell('نبض ساردو | رسانه مستقل خبری و تحلیلی جنوب کرمان',''+body,'خبرهای ساردوئیه، جیرفت و جنوب کرمان؛ گزارش‌های میدانی، اقتصاد، جامعه، کشاورزی و فرهنگ.',{canonical:'/',schema:siteSchema(),image:lead?imageFor(lead):''});
}
function archive(db,q=''){
  const query=String(q||'').trim();
  const list=sortedNews(db).filter(a=>!query||[a.title,a.lead,a.body,a.location,a.author].join(' ').includes(query));
  const cards=list.map((a,i)=>storyCard(a,db,'standard',i)).join('');
  const body=header(db,'all')+'<main class="rb-shell rb-page"><div class="rb-page-heading"><span class="rb-kicker">THE ARCHIVE / 01</span><h1>آرشیو <em>خبرها</em></h1><p>جریان کامل خبرها و روایت‌های منتشرشده در نبض ساردو.</p><form class="rb-page-search" action="/search" method="get"><input name="q" value="'+e(query)+'" placeholder="عنوان، موضوع یا منطقه را جست‌وجو کن"><button>جست‌وجو ←</button></form></div><div class="rb-results-meta"><b>'+list.length.toLocaleString('fa-IR')+' خبر</b><span>مرتب‌شده بر اساس زمان انتشار</span></div><div class="rb-news-grid">'+(cards||'<div class="rb-empty">خبری با این مشخصات پیدا نشد.</div>')+'</div></main>'+footer();
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
  const gallery=Array.isArray(a.gallery)?a.gallery:[];
  const galleryMarkup=gallery.length?'<div class="rb-article-gallery">'+gallery.map((src,i)=>'<figure><img src="'+e(src)+'" alt="'+e(a.title)+' - تصویر '+(i+1)+'" loading="lazy"></figure>').join('')+'</div>':'';
  const media=a.videoUrl?'<div class="rb-article-cover"><video controls playsinline preload="metadata" poster="'+e(image)+'"><source src="'+e(a.videoUrl)+'" type="'+e(a.videoType||'video/mp4')+'"></video></div>':'<figure class="rb-article-cover"><img src="'+e(image)+'" alt="'+e(a.title)+'" fetchpriority="high"></figure>';
  const author=a.author||'تحریریه نبض ساردو';
  const body=header(db,'')+'<main class="rb-shell rb-article-page"><nav class="rb-breadcrumb"><a href="/">خانه</a><span>/</span><a href="/category/'+encodeURIComponent(a.categoryId||'')+'">'+e(cat?.name||'خبر')+'</a><span>/</span><span>'+e(excerpt(a.title,75))+'</span></nav><header class="rb-article-head"><span class="rb-kicker">FIELD REPORT / '+e(cat?.name||'NEWS')+'</span><h1>'+e(a.title)+'</h1><p class="rb-article-lead">'+e(a.lead||excerpt(a.body||'',260))+'</p><div class="rb-article-meta"><div class="rb-author-mark">'+e(author.slice(0,1))+'</div><div><b>'+e(author)+'</b><small>تحریریه نبض ساردو</small></div><span>'+e(fmt(a.publishedAt||a.createdAt))+'</span><span>'+Number(a.views||0).toLocaleString('fa-IR')+' بازدید</span><span>زمان مطالعه: '+Math.max(1,Math.ceil((String(a.body||'').split(/\s+/).length||500)/220)).toLocaleString('fa-IR')+' دقیقه</span></div></header>'+media+'<div class="rb-article-layout"><article class="rb-article-body" data-article-body>'+bodyContent+galleryMarkup+'<div class="rb-article-share"><b>این روایت را به اشتراک بگذار</b><button type="button" data-share>اشتراک‌گذاری ↗</button><button type="button" data-copy-link>کپی پیوند</button></div></article><aside class="rb-article-aside"><div class="rb-aside-sticky"><span class="rb-kicker">READ NEXT</span><h3>روایت‌های مرتبط</h3>'+(related.map((x,i)=>'<a href="/news/'+e(x.slug)+'"><small>0'+(i+1)+' / '+e((db.categories||[]).find(c=>c.id===x.categoryId)?.name||'خبر')+'</small><b>'+e(x.title)+'</b></a>').join('')||'<p>روایت مرتبط دیگری ثبت نشده است.</p>')+'</div></aside></div></main>'+footer();
  const desc=excerpt(a.lead||a.body||a.title,220);
  return shell(a.title+' | نبض ساردو',''+body,desc,{canonical:url,image,ogType:'article',schema:articleSchema(a,cat)});
}
function category(db,c){
  const list=sortedNews(db).filter(a=>a.categoryId===c.id);
  const body=header(db,c.id)+'<main class="rb-shell rb-page"><div class="rb-page-heading"><span class="rb-kicker">NEWS DESK / '+e(String(c.id||'').toUpperCase())+'</span><h1>اخبار <em>'+e(c.name)+'</em></h1><p>آخرین خبرها، گزارش‌ها و روایت‌های مرتبط با '+e(c.name)+' در جنوب کرمان.</p></div><div class="rb-results-meta"><b>'+list.length.toLocaleString('fa-IR')+' خبر</b><span>آخرین به‌روزرسانی‌ها</span></div><div class="rb-news-grid">'+(list.map((a,i)=>storyCard(a,db,'standard',i)).join('')||'<div class="rb-empty">هنوز خبری در این دسته‌بندی منتشر نشده است.</div>')+'</div></main>'+footer();
  return shell('اخبار '+c.name+' | نبض ساردو',''+body,'آخرین اخبار '+c.name+' در نبض ساردو.',{canonical:'/category/'+encodeURIComponent(c.id)});
}
const HUBS={
  sardouiyeh:{name:'ساردوئیه',terms:['ساردوئیه','ساردو'],en:'SARDOUIYEH'},
  jiroft:{name:'جیرفت',terms:['جیرفت'],en:'JIROFT'},
  'south-kerman':{name:'جنوب کرمان',terms:['جنوب کرمان','کرمان جنوبی','جیرفت','کهنوج','عنبرآباد','رودبار جنوب','منوجان','فاریاب','قلعه گنج','جازموریان'],en:'SOUTH KERMAN'}
};
function localHub(db,key){
  const hub=HUBS[key];if(!hub)return null;
  const list=sortedNews(db).filter(a=>hub.terms.some(t=>[a.location,a.title,a.lead,a.body].join(' ').includes(t)));
  const body=header(db,'')+'<main class="rb-shell rb-page"><div class="rb-page-heading rb-local-heading"><span class="rb-kicker">LOCAL DESK / '+hub.en+'</span><h1>روایت <em>'+e(hub.name)+'</em></h1><p>خبرهای میدانی، رویدادها و مطالبات مردم '+e(hub.name)+'.</p></div><div class="rb-news-grid">'+(list.map((a,i)=>storyCard(a,db,'standard',i)).join('')||'<div class="rb-empty">هنوز خبری برای این منطقه منتشر نشده است.</div>')+'</div></main>'+footer();
  return shell('اخبار '+hub.name+' | نبض ساردو',''+body,'آخرین اخبار و گزارش‌های '+hub.name+'.',{canonical:'/local/'+key});
}
function simple(db,type,ok=false,uploadError=''){
  let title='',content='';
  if(type==='about'){
    title='درباره نبض ساردو';
    content='<div class="rb-page-heading"><span class="rb-kicker">ABOUT THE NEWSROOM</span><h1>رسانه‌ای از دل <em>منطقه</em></h1><p>نبض ساردو رسانه‌ای مستقل برای پوشش دقیق، مسئولانه و مستند اخبار ساردوئیه، جیرفت و جنوب کرمان است.</p></div><div class="rb-simple-copy"><h2>روایت مردم، نه فقط رویدادها</h2><p>تمرکز نبض ساردو بر خبرهای محلی، مسائل اجتماعی، اقتصاد منطقه، کشاورزی، محیط زیست، فرهنگ و روایت‌های انسانی است.</p><p>ما تلاش می‌کنیم صدای مردم منطقه باشیم و خبر را با دقت، شفافیت و احترام به مخاطب منتشر کنیم.</p></div>';
  }else if(type==='contact'){
    title='تماس با تحریریه';
    content='<div class="rb-page-heading"><span class="rb-kicker">CONTACT THE NEWSROOM</span><h1>با ما <em>در ارتباط باش</em></h1><p>پیشنهاد، انتقاد، اصلاح خبر یا موضوعی برای پیگیری داری؟ برای تحریریه بنویس.</p></div>'+(ok?'<div class="rb-success">پیام شما ثبت شد. از اینکه با تحریریه در ارتباط هستید سپاسگزاریم.</div>':'')+'<form class="rb-form" method="post" action="/contact"><label>نام و نام خانوادگی<input name="name" maxlength="120" required></label><label>شماره تماس یا راه ارتباطی<input name="contact" maxlength="120" required></label><label>موضوع پیام<input name="subject" maxlength="180" required></label><label>متن پیام<textarea name="message" rows="6" maxlength="5000" required></textarea></label><button class="rb-button">ارسال پیام ←</button></form>';
  }else{
    title='ارسال خبر مردمی';
    const error=uploadError==='large'?'حجم فایل ارسالی بیش از حد مجاز است.':uploadError==='type'?'فرمت فایل پشتیبانی نمی‌شود.':'';
    content='<div class="rb-page-heading"><span class="rb-kicker">CITIZEN JOURNALISM</span><h1>خبر را از <em>شما می‌شنویم</em></h1><p>اگر از یک رویداد، مشکل محلی یا اتفاق مهم خبر دارید، آن را با تحریریه نبض ساردو به اشتراک بگذارید.</p></div>'+(ok?'<div class="rb-success">گزارش شما با موفقیت ثبت شد و برای بررسی به تحریریه ارسال شد.</div>':'')+(error?'<div class="rb-error">'+e(error)+'</div>':'')+'<form class="rb-form" method="post" action="/send-news" enctype="multipart/form-data"><label>عنوان خبر<input name="headline" maxlength="220" required></label><div class="rb-form-row"><label>نام شما<input name="name" maxlength="120" required></label><label>شماره تماس<input name="phone" maxlength="40" required></label></div><label>محل وقوع خبر<input name="location" maxlength="160" placeholder="مثلاً جیرفت، ساردوئیه..." required></label><label>شرح کامل گزارش<textarea name="details" rows="7" maxlength="10000" required></textarea></label><label>عکس یا ویدئوی مرتبط<input type="file" name="mediaFile" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"><small>حداکثر حجم فایل ۵۰ مگابایت است.</small></label><button class="rb-button">ارسال گزارش به تحریریه ←</button></form>';
  }
  const body=header(db,'')+'<main class="rb-shell rb-page rb-simple-page">'+content+'</main>'+footer();
  return shell(title+' | نبض ساردو',''+body,title+'؛ نبض ساردو رسانه مستقل جنوب کرمان.',{canonical:'/'+(type==='send-news'?'send-news':type)});
}
module.exports={home,archive,briefs,article,category,simple,search,localHub};
