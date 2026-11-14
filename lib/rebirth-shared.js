'use strict';
const {displayImage,absoluteUrl,PUBLIC_BASE}=require('./view-common');

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
function shell(title,body,desc='نبض ساردو؛ رسانه مستقل خبری و تحلیلی جنوب کرمان',opts={}){
  const canonical=opts.canonical?absoluteUrl(opts.canonical):'';
  const image=opts.image?absoluteUrl(opts.image):'';
  const robots=opts.robots||'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
  const schema=opts.schema?'<script type="application/ld+json">'+JSON.stringify(opts.schema).replace(/</g,'\\u003c')+'</script>':'';
  const ogType=opts.ogType||'website';
  const verify=process.env.GOOGLE_SITE_VERIFICATION?'<meta name="google-site-verification" content="'+e(process.env.GOOGLE_SITE_VERIFICATION)+'">':'';
  return '<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+e(title)+'</title><meta name="description" content="'+e(desc)+'"><meta name="robots" content="'+e(robots)+'"><meta name="theme-color" content="#0b0d14"><meta property="og:locale" content="fa_IR"><meta property="og:site_name" content="نبض ساردو"><meta property="og:type" content="'+e(ogType)+'"><meta property="og:title" content="'+e(title)+'"><meta property="og:description" content="'+e(desc)+'">'+(canonical?'<link rel="canonical" href="'+e(canonical)+'">':'')+(image?'<meta property="og:image" content="'+e(image)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="'+e(image)+'">':'<meta name="twitter:card" content="summary">')+verify+'<link rel="alternate" type="application/rss+xml" title="نبض ساردو" href="'+e(absoluteUrl('/feed.xml'))+'"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Estedad:wght@400;500;600;700;800;900&family=Vazirmatn:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/rebirth.css?v=1.0.0">'+schema+'</head><body>'+body+'<script src="/assets/rebirth.js?v=1.0.0" defer></script></body></html>';
}
function header(db={},active=''){
  const cats=Array.isArray(db.categories)?db.categories:[];
  const nav=[{id:'home',name:'خانه',url:'/'},{id:'all',name:'آخرین اخبار',url:'/all-news'}].concat(cats.slice(0,8).map(c=>({id:c.id,name:c.name,url:'/category/'+encodeURIComponent(c.id)})));
  return '<div class="rb-topline"><div class="rb-shell rb-topline-inner"><span>رسانه مستقل خبری و تحلیلی جنوب کرمان</span><span>ساردوئیه · جیرفت · جنوب کرمان</span><a href="/send-news">ارسال خبر مردمی ↗</a></div></div><header class="rb-header"><div class="rb-shell rb-header-main"><button class="rb-menu-toggle" type="button" aria-label="باز کردن فهرست" aria-expanded="false" data-menu-toggle><i></i><i></i></button>'+brand()+'<div class="rb-header-side"><form class="rb-search" action="/search" method="get" role="search"><input name="q" type="search" placeholder="جست‌وجو در خبرها..." aria-label="جست‌وجو در خبرها"><button aria-label="جست‌وجو">⌕</button></form><a class="rb-header-archive" href="/all-news">آرشیو اخبار <span>↙</span></a></div></div><nav class="rb-nav" data-main-nav><div class="rb-shell rb-nav-inner">'+nav.map(x=>'<a class="'+(active===x.id?'is-active':'')+'" href="'+e(x.url)+'">'+e(x.name)+'</a>').join('')+'</div></nav></header>';
}
function footer(){
  return '<footer class="rb-footer"><div class="rb-shell"><div class="rb-footer-main"><div>'+brand()+'<p>روایت دقیق از منطقه؛ خبر، تحلیل و صدای مردم جنوب کرمان.</p></div><div><b>رسانه</b><a href="/about">درباره نبض ساردو</a><a href="/contact">تماس با تحریریه</a><a href="/send-news">ارسال خبر مردمی</a></div><div><b>دسترسی سریع</b><a href="/all-news">آخرین اخبار</a><a href="/local/sardouiyeh">ساردوئیه</a><a href="/local/jiroft">جیرفت</a><a href="/local/south-kerman">جنوب کرمان</a></div><div><b>نبض ساردو</b><span>رسانه مستقل محلی</span><span>پوشش مسئولانه و مستند</span></div></div><div class="rb-footer-bottom"><span>© نبض ساردو — تمامی حقوق محفوظ است.</span><a href="/admin/login">ورود تحریریه</a></div></div></footer>';
}
function storyCard(a,db={},variant='standard',index=0){
  const c=(db.categories||[]).find(x=>x.id===a.categoryId);
  const img=imageFor(a),url='/news/'+encodeURIComponent(a.slug||'');
  const media=a.videoUrl?'<span class="rb-card-video">▶ ویدئو</span>':'';
  return '<article class="rb-story rb-story-'+e(variant)+'"><a class="rb-story-image" href="'+e(url)+'"><img src="'+e(img)+'" alt="'+e(a.title)+'" loading="lazy" decoding="async">'+media+'<span class="rb-image-index">'+String(index+1).padStart(2,'0')+'</span></a><div class="rb-story-copy"><div class="rb-story-meta"><a href="/category/'+encodeURIComponent(a.categoryId||'')+'">'+e(c?.name||'خبر')+'</a><time>'+e(dateOnly(a.publishedAt||a.createdAt))+'</time></div><h3><a href="'+e(url)+'">'+e(a.title||'')+'</a></h3><p>'+e(excerpt(a.lead||a.body||'',150))+'</p><a class="rb-read-link" href="'+e(url)+'">ادامه روایت <span>←</span></a></div></article>';
}
function sectionTitle(kicker,title,link='/all-news',label='همه خبرها'){
  return '<div class="rb-section-title"><div><span>'+e(kicker)+'</span><h2>'+e(title)+'</h2></div><a href="'+e(link)+'">'+e(label)+' <b>↙</b></a></div>';
}
function adminShell(title,body){
  return '<!doctype html><html lang="fa-IR" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+e(title)+'</title><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0b0d14"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Estedad:wght@400;500;600;700;800;900&family=Vazirmatn:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/rebirth.css?v=1.0.0"></head><body class="rb-admin-body">'+body+'<script src="/assets/rebirth.js?v=1.0.0" defer></script></body></html>';
}
module.exports={e,fmt,dateOnly,excerpt,imageFor,brand,shell,header,footer,storyCard,sectionTitle,adminShell,absoluteUrl,PUBLIC_BASE};
