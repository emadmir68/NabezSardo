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
function brand(compact=false){
  return '<a class="rb-brand" href="/" aria-label="نبض ساردو، صفحه اصلی"><span class="rb-brand-mark" aria-hidden="true"><svg viewBox="0 0 76 34"><path d="M2 18h16l7-9 8 18 9-25 9 24 7-13 7 5h9" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="square" stroke-linejoin="miter"/></svg></span><span class="rb-brand-word">نبض<span>ساردو</span><small>NABZ SARDO / SOUTH KERMAN</small></span></a>';
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
  const imageType=/\\.png$/.test(imagePath)?'image/png':/\\.webp$/.test(imagePath)?'image/webp':/\\.gif$/.test(imagePath)?'image/gif':'image/jpeg';
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
  return '<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+e(title)+'</title><meta name="description" content="'+e(desc)+'"><meta name="robots" content="'+e(robots)+'"><meta name="theme-color" content="#0b0d14"><meta property="og:locale" content="fa_IR"><meta property="og:site_name" content="نبض ساردو"><meta property="og:type" content="'+e(ogType)+'"><meta property="og:title" content="'+e(ogTitle)+'"><meta property="og:description" content="'+e(desc)+'">'+(canonical?'<link rel="canonical" href="'+e(canonical)+'">':'')+(ogUrl?'<meta property="og:url" content="'+e(ogUrl)+'">':'')+articleMeta+imageMeta+verify+'<link rel="alternate" type="application/rss+xml" title="نبض ساردو" href="'+e(absoluteUrl('/feed.xml'))+'"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Estedad:wght@400;500;600;700;800;900&family=Vazirmatn:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/rebirth.css?v='+version+'">'+schema+'</head><body>'+body+'<script src="/assets/rebirth.js?v='+version+'" defer></script></body></html>';
}
function header(db={},active=''){
  const cats=Array.isArray(db.categories)?db.categories:[];
  const nav=[{id:'home',name:'خانه',en:'Home',url:'/'},{id:'all',name:'آخرین اخبار',en:'Latest News',url:'/all-news'}].concat(cats.slice(0,8).map(c=>({id:c.id,name:c.name,en:catEn(c.name),url:'/category/'+encodeURIComponent(c.id)})));
  return '<div class="rb-topline"><div class="rb-shell rb-topline-inner"><span><span class="rb-fa">رسانه مستقل خبری و تحلیلی جنوب کرمان</span><span class="rb-en">Independent local newsroom · South Kerman</span></span><span><span data-jalali-date></span> · <span data-live-clock></span></span><span class="rb-live-counter"><span class="rb-fa">بازدید زنده</span><span class="rb-en">Live views</span> <b data-live-views>—</b> <em>LIVE</em></span><a href="/send-news"><span class="rb-fa">ارسال خبر مردمی</span><span class="rb-en">Send a story</span> ↗</a></div></div><header class="rb-header"><div class="rb-shell rb-header-main"><button class="rb-menu-toggle" type="button" aria-label="باز کردن فهرست" aria-expanded="false" data-menu-toggle><i></i><i></i></button>'+brand()+'<div class="rb-header-side"><form class="rb-search" action="/search" method="get" role="search"><input name="q" type="search" placeholder="جست‌وجو در خبرها..." data-placeholder-fa="جست‌وجو در خبرها..." data-placeholder-en="Search the newsroom..." aria-label="جست‌وجو در خبرها"><button type="button" data-search-toggle aria-label="جست‌وجو">⌕</button></form><a class="rb-header-archive" href="/all-news"><span class="rb-fa">آرشیو اخبار</span><span class="rb-en">News archive</span> <b>↙</b></a><div class="rb-language-switch" aria-label="Language"><button type="button" data-lang-option="fa">FA</button><button type="button" data-lang-option="en">EN</button></div></div></div><nav class="rb-nav" data-main-nav><div class="rb-shell rb-nav-inner">'+nav.map(x=>'<a class="'+(active===x.id?'is-active':'')+'" href="'+e(x.url)+'"><span class="rb-fa">'+e(x.name)+'</span><span class="rb-en">'+e(x.en||catEn(x.name))+'</span></a>').join('')+'</div></nav></header>';
}
function footer(){
  return '<footer class="rb-footer"><div class="rb-shell"><div class="rb-footer-main"><div>'+brand()+'<p><span class="rb-fa">روایت دقیق از منطقه؛ خبر، تحلیل و صدای مردم جنوب کرمان.</span><span class="rb-en">Accurate reporting, analysis and the voices of South Kerman.</span></p></div><div><b><span class="rb-fa">رسانه</span><span class="rb-en">The newsroom</span></b><a href="/about"><span class="rb-fa">درباره نبض ساردو</span><span class="rb-en">About Nabz Sardo</span></a><a href="/contact"><span class="rb-fa">تماس با تحریریه</span><span class="rb-en">Contact</span></a><a href="/send-news"><span class="rb-fa">ارسال خبر مردمی</span><span class="rb-en">Send a story</span></a></div><div><b><span class="rb-fa">دسترسی سریع</span><span class="rb-en">Quick links</span></b><a href="/all-news"><span class="rb-fa">آخرین اخبار</span><span class="rb-en">Latest news</span></a><a href="/local/sardouiyeh">ساردوئیه</a><a href="/local/jiroft">جیرفت</a><a href="/local/south-kerman">جنوب کرمان</a></div><div><b>NABZ SARDO</b><span><span class="rb-fa">رسانه مستقل محلی</span><span class="rb-en">Independent local media</span></span><span><span class="rb-fa">پوشش مسئولانه و مستند</span><span class="rb-en">Responsible, evidence-led reporting</span></span></div></div><div class="rb-footer-bottom"><span>© NABZ SARDO — <span class="rb-fa">تمامی حقوق محفوظ است.</span><span class="rb-en">All rights reserved.</span></span><a href="/admin/login"><span class="rb-fa">ورود تحریریه</span><span class="rb-en">Newsroom login</span></a></div></div></footer>';
}
function storyCard(a,db={},variant='standard',index=0){
  const c=(db.categories||[]).find(x=>x.id===a.categoryId);
  const img=imageFor(a),url='/news/'+encodeURIComponent(a.slug||''),shareUrl='/news/'+shortArticleCode(a.id);
  const media=a.videoUrl?'<span class="rb-card-video">▶ ویدئو</span>':'';
  const bodyFa=excerpt(a.body||a.bodyHtml||a.lead||'',280);
  const bodyEn=excerpt(a.bodyEn||a.bodyHtmlEn||a.leadEn||'',280);
  const attrs=' data-story-card data-story-title-fa="'+e(a.title||'')+'" data-story-title-en="'+e(a.titleEn||'')+'" data-story-lead-fa="'+e(a.lead||'')+'" data-story-lead-en="'+e(a.leadEn||'')+'" data-story-body-fa="'+e(bodyFa)+'" data-story-body-en="'+e(bodyEn)+'" data-story-image="'+e(img)+'" data-story-category-fa="'+e(c?.name||'خبر')+'" data-story-category-en="'+e(catEn(c?.name||'News'))+'" data-story-category-id="'+e(a.categoryId||'')+'" data-story-url="'+e(shareUrl)+'"';
  return '<article class="rb-story rb-story-'+e(variant)+'"'+attrs+'><a class="rb-story-image" href="'+e(url)+'"><img src="'+e(img)+'" alt="'+e(a.title)+'" loading="lazy" decoding="async">'+media+'<span class="rb-image-index">'+String(index+1).padStart(2,'0')+'</span></a><div class="rb-story-copy"><div class="rb-story-meta"><a href="/category/'+encodeURIComponent(a.categoryId||'')+'"><span class="rb-fa">'+e(c?.name||'خبر')+'</span><span class="rb-en">'+e(catEn(c?.name||'News'))+'</span></a><time>'+e(dateOnly(a.publishedAt||a.createdAt))+'</time></div><h3><a href="'+e(url)+'"><span class="rb-fa">'+e(a.title||'')+'</span><span class="rb-en">'+e(a.titleEn||a.title||'')+'</span></a></h3><p><span class="rb-fa">'+e(excerpt(a.lead||a.body||'',150))+'</span><span class="rb-en">'+e(excerpt(a.leadEn||a.lead||a.body||'',150))+'</span></p><a class="rb-read-link" href="'+e(url)+'"><span class="rb-fa">ادامه روایت</span><span class="rb-en">Read story</span> <span>←</span></a></div></article>';
}
function sectionTitle(kicker,title,link='/all-news',label='همه خبرها'){
  const english={'میزهای خبری':'NEWS DESKS','تازه‌ترین روایت‌ها':'LATEST DISPATCHES','پربازدیدترین‌ها':'MOST READ','خبرهای کوتاه':'QUICK DISPATCHES','آرشیو خبرها':'NEWS ARCHIVE'};
  const labelEn=label==='همه خبرها'?'All stories':label;
  return '<div class="rb-section-title"><div><span>'+e(kicker)+'</span><h2><span class="rb-fa">'+e(title)+'</span><span class="rb-en">'+e(english[title]||title)+'</span></h2></div><a href="'+e(link)+'"><span class="rb-fa">'+e(label)+'</span><span class="rb-en">'+e(labelEn)+'</span> <b>↙</b></a></div>';
}
function adminShell(title,body){
  const version=assetVersion();
  return '<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+e(title)+'</title><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0b0d14"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Estedad:wght@400;500;600;700;800;900&family=Vazirmatn:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/rebirth.css?v='+version+'"></head><body class="rb-admin-body">'+body+'<script src="/assets/rebirth.js?v='+version+'" defer></script></body></html>';
}
module.exports={e,fmt,dateOnly,excerpt,imageFor,brand,shell,header,footer,storyCard,sectionTitle,adminShell,absoluteUrl,PUBLIC_BASE,catEn,shortArticleCode};
