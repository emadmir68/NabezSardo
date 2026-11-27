'use strict';
const {displayImage,PUBLIC_BASE:DEFAULT_PUBLIC_BASE,catEn,shortArticleCode}=require('./view-common');
function currentPublicBase(){
  const configured=typeof process!=='undefined'&&process.env?process.env.PUBLIC_BASE_URL:'';
  return String(configured||DEFAULT_PUBLIC_BASE||'https://nabzesardo.ir').replace(/\/+$/,'');
}
function absoluteUrl(v=''){
  const value=String(v||'');
  if(/^https?:\/\//i.test(value))return value;
  const base=currentPublicBase();
  return base+(value.startsWith('/')?value:'/'+value);
}
const PUBLIC_BASE=currentPublicBase();

function e(v=''){
  return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fmt(v){
  if(!v)return '';
  try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tehran'}).format(new Date(v));}
  catch{return String(v);}
}
function dateOnly(v){
  if(!v)return '';
  try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'}).format(new Date(v));}
  catch{return String(v);}
}
function excerpt(v='',max=180){
  const s=String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
  return s.length>max?s.slice(0,max-1).trim()+'…':s;
}
function imageFor(a){
  try{return displayImage(a||{});}catch{return a&&a.image?a.image:'/assets/placeholder.svg';}
}
function brand(){
  return '<a class="rb-brand" href="/" aria-label="نبض ساردو، صفحه اصلی"><span class="rb-brand-mark" aria-hidden="true"><svg viewBox="0 0 76 34"><path d="M2 18h16l7-9 8 18 9-25 9 24 7-13 7 5h9" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="square" stroke-linejoin="miter"/></svg></span><span class="rb-brand-word">نبض<span>ساردو</span><small>ساردوئیه · جنوب کرمان</small></span></a>';
}
function assetVersion(){
  const value=typeof process!=='undefined'&&process.env?process.env.CLOUDFLARE_ASSET_VERSION||'rebirth-20261114':'rebirth-20261114';
  return encodeURIComponent(String(value).slice(0,80));
}
function shell(title,body,desc='نبض ساردو؛ رسانه مستقل خبری و تحلیلی جنوب کرمان',opts={}){
  const canonical=opts.canonical?absoluteUrl(opts.canonical):'';
  const ogUrl=opts.ogUrl?absoluteUrl(opts.ogUrl):canonical;
  const ogTitle=opts.ogTitle||title;
  const image=opts.image?absoluteUrl(opts.image):'';
  const imageAlt=opts.imageAlt||ogTitle||'نبض ساردو';
  const imagePath=image.split('?')[0].toLowerCase();
  const imageType=/\.png$/.test(imagePath)?'image/png':/\.webp$/.test(imagePath)?'image/webp':/\.gif$/.test(imagePath)?'image/gif':'image/jpeg';
  const primary=String(typeof process!=='undefined'&&process.env?process.env.CLOUDFLARE_PRIMARY||'':'')==='1';
  const previewReadonly=String(typeof process!=='undefined'&&process.env?process.env.PREVIEW_READONLY||'':'')==='1'&&!primary;
  const robots=opts.robots||(previewReadonly?'noindex,nofollow,noarchive':'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  const schema=opts.schema?'<script type="application/ld+json">'+JSON.stringify(opts.schema).replace(/</g,'\\u003c')+'</script>':'';
  const ogType=opts.ogType||'website';
  const verification=typeof process!=='undefined'&&process.env?process.env.GOOGLE_SITE_VERIFICATION:'';
  const verify=verification?'<meta name="google-site-verification" content="'+e(verification)+'">':'';
  const articleMeta=ogType==='article'?[
    opts.publishedTime?'<meta property="article:published_time" content="'+e(opts.publishedTime)+'">':'',
    opts.modifiedTime?'<meta property="article:modified_time" content="'+e(opts.modifiedTime)+'">':'',
    opts.section?'<meta property="article:section" content="'+e(opts.section)+'">':''
  ].join(''):'';
  const imageMeta=image?'<meta property="og:image" content="'+e(image)+'"><meta property="og:image:secure_url" content="'+e(image)+'"><meta property="og:image:type" content="'+imageType+'"><meta property="og:image:alt" content="'+e(imageAlt)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="'+e(image)+'"><meta name="twitter:image:alt" content="'+e(imageAlt)+'">':'<meta name="twitter:card" content="summary">';
  const version=assetVersion();
  return '<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+e(title)+'</title><meta name="description" content="'+e(desc)+'"><meta name="robots" content="'+e(robots)+'"><meta name="nabez-build" content="'+e(version)+'"><meta name="theme-color" content="#0b0d14"><meta property="og:locale" content="fa_IR"><meta property="og:site_name" content="نبض ساردو"><meta property="og:type" content="'+e(ogType)+'"><meta property="og:title" content="'+e(ogTitle)+'"><meta property="og:description" content="'+e(desc)+'">'+(canonical?'<link rel="canonical" href="'+e(canonical)+'">':'')+(ogUrl?'<meta property="og:url" content="'+e(ogUrl)+'">':'')+articleMeta+imageMeta+verify+'<link rel="alternate" type="application/rss+xml" title="نبض ساردو" href="'+e(absoluteUrl('/feed.xml'))+'"><link rel="stylesheet" href="/assets/rebirth.css?v='+version+'">'+schema+'</head><body>'+body+'<script src="/assets/rebirth.js?v='+version+'" defer></script></body></html>';
}
function header(db={},active=''){
  const cats=(Array.isArray(db.categories)?db.categories:[]).filter(c=>c&&c.id!=='short-news');
  const nav=[{id:'home',name:'خانه',url:'/'},{id:'all',name:'آخرین اخبار',url:'/all-news'}].concat(cats.slice(0,8).map(c=>({id:c.id,name:c.name,url:'/category/'+encodeURIComponent(c.id)})));
  return '<div class="rb-topline"><div class="rb-shell rb-topline-inner"><span>رسانه مستقل خبری و تحلیلی جنوب کرمان</span><span><span data-jalali-date></span> · <span data-live-clock></span></span><span class="rb-live-counter">بازدید زنده <b data-live-views>—</b> <em>زنده</em></span><a href="/send-news">ارسال خبر مردمی ↗</a></div></div><header class="rb-header"><div class="rb-shell rb-header-main"><button class="rb-menu-toggle" type="button" aria-label="باز کردن فهرست" aria-expanded="false" data-menu-toggle><i></i><i></i></button>'+brand()+'<div class="rb-header-side"><form class="rb-search" action="/search" method="get" role="search"><input name="q" type="search" placeholder="جست‌وجو در خبرها..." aria-label="جست‌وجو در خبرها"><button type="button" data-search-toggle aria-label="جست‌وجو">⌕</button></form><a class="rb-header-archive" href="/all-news">آرشیو اخبار <b>↙</b></a><button type="button" class="rb-theme-toggle" data-theme-toggle aria-label="تغییر پوسته"><span class="rb-theme-icon-dark">🌙</span><span class="rb-theme-icon-light">☀️</span></button></div></div><nav class="rb-nav" data-main-nav><div class="rb-shell rb-nav-inner">'+nav.map(x=>'<a class="'+(active===x.id?'is-active':'')+'" href="'+e(x.url)+'">'+e(x.name)+'</a>').join('')+'</div></nav></header>';
}
function footer(){
  return '<footer class="rb-footer"><div class="rb-shell"><div class="rb-footer-main"><div>'+brand()+'<p>روایت دقیق از منطقه؛ خبر، تحلیل و صدای مردم ساردوئیه، جیرفت و جنوب کرمان.</p></div><div><b>رسانه</b><a href="/about">درباره نبض ساردو</a><a href="/editorial-policy">سیاست تحریریه</a><a href="/contact">تماس با تحریریه</a><a href="/send-news">ارسال خبر مردمی</a></div><div><b>دسترسی سریع</b><a href="/all-news">آخرین اخبار</a><a href="/follow-up">پیگیری تا نتیجه</a><a href="/local/sardouiyeh">ساردوئیه</a><a href="/local/jiroft">جیرفت</a><a href="/local/south-kerman">جنوب کرمان</a></div><div><b>منشور تحریریه</b><span>رسانه مستقل محلی</span><span>پوشش مسئولانه و مستند</span></div></div><div class="rb-footer-bottom"><span>© نبض ساردو — تمامی حقوق محفوظ است.</span><a href="/admin/login">ورود تحریریه</a></div></div></footer>';
}
function dedupSummary(a,max=150){
  const norm=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\s]+/g,' ').trim();
  const titleN=norm(a.title);
  let text=excerpt(a.lead||'',max+40);
  if(!text||norm(text)===titleN||norm(text).startsWith(titleN)){
    const bodyText=String(a.body||a.bodyHtml||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim();
    if(bodyText){
      let stripped=bodyText;
      if(titleN&&norm(bodyText).startsWith(titleN)){
        stripped=bodyText.slice(titleN.length).replace(/^[\s،,:؛.!؟—–-]+/u,'').trim();
      }
      text=norm(stripped)&&norm(stripped)!==titleN?excerpt(stripped,max):'';
    }else text='';
  }
  return text.length>max?text.slice(0,max-1).trim()+'…':text;
}
function storyCard(a,db={},variant='standard',_index=0){
  const c=(db.categories||[]).find(x=>x.id===a.categoryId);
  const img=imageFor(a),url='/news/'+encodeURIComponent(a.slug||''),shareUrl='/news/'+shortArticleCode(a.id);
  const media=a.videoUrl?'<span class="rb-card-video">▶ ویدئو</span>':'';
  const bodyFa=excerpt(a.body||a.bodyHtml||a.lead||'',280);
  const bodyEn=excerpt(a.bodyEn||a.bodyHtmlEn||a.leadEn||'',280);
  const summaryFa=dedupSummary(a,150);
  const attrs=' data-story-card data-story-title-fa="'+e(a.title||'')+'" data-story-title-en="'+e(a.titleEn||'')+'" data-story-lead-fa="'+e(a.lead||'')+'" data-story-lead-en="'+e(a.leadEn||'')+'" data-story-body-fa="'+e(bodyFa)+'" data-story-body-en="'+e(bodyEn)+'" data-story-image="'+e(img)+'" data-story-category-fa="'+e(c?.name||'خبر')+'" data-story-category-en="'+e(catEn(c?.name||'News'))+'" data-story-category-id="'+e(a.categoryId||'')+'" data-story-url="'+e(shareUrl)+'"';
  return '<article class="rb-story rb-story-'+e(variant)+'"'+attrs+'><a class="rb-story-image" href="'+e(url)+'"><img src="'+e(img)+'" alt="'+e(a.title)+'" loading="lazy" decoding="async">'+media+'</a><div class="rb-story-copy"><div class="rb-story-meta"><a href="/category/'+encodeURIComponent(a.categoryId||'')+'">'+e(c?.name||'خبر')+'</a><time>'+e(dateOnly(a.publishedAt||a.createdAt))+'</time></div><h3><a href="'+e(url)+'">'+e(a.title||'')+'</a></h3>'+(summaryFa?'<p>'+e(summaryFa)+'</p>':'')+'<a class="rb-read-link" href="'+e(url)+'">ادامه روایت <span>←</span></a></div></article>';
}
function sectionTitle(kicker,title,link='/all-news',label='همه خبرها'){
  return '<div class="rb-section-title"><div><span>'+e(kicker)+'</span><h2>'+e(title)+'</h2></div><a href="'+e(link)+'">'+e(label)+' <b>↙</b></a></div>';
}
function adminShell(title,body){
  const version=assetVersion();
  return '<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+e(title)+'</title><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0b0d14"><link rel="stylesheet" href="/assets/rebirth.css?v='+version+'"></head><body class="rb-admin-body">'+body+'<script src="/assets/rebirth.js?v='+version+'" defer></script></body></html>';
}
module.exports={e,fmt,dateOnly,excerpt,dedupSummary,imageFor,brand,shell,header,footer,storyCard,sectionTitle,adminShell,absoluteUrl,PUBLIC_BASE,catEn,shortArticleCode};

