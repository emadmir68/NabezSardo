const {coverAssetName}=require('./cover-variants');
const {presentArticle}=require('./news-presentation');
const PUBLIC_BASE=(process.env.PUBLIC_BASE_URL||'https://nabzesardo.ir').replace(/\/+$/,'');
const BUILD_VERSION=String(process.env.CLOUDFLARE_ASSET_VERSION||process.env.RAILWAY_GIT_COMMIT_SHA||process.env.RAILWAY_DEPLOYMENT_ID||process.env.RAILWAY_REPLICA_ID||'dev').slice(0,80);
const ASSET_VERSION=encodeURIComponent(BUILD_VERSION);
function absoluteUrl(v=''){const s=String(v||'');if(/^https?:\/\//i.test(s))return s;return PUBLIC_BASE+(s.startsWith('/')?s:'/'+s);}
function legacyShortArticleCode(value=''){
  const input=String(value||'').trim();
  let a=0x811c9dc5>>>0,b=0x9e3779b9>>>0;
  for(let i=0;i<input.length;i++){
    const c=input.charCodeAt(i);
    a=Math.imul((a^c)>>>0,0x01000193)>>>0;
    b=Math.imul((b^(c+((i+1)*131)))>>>0,0x85ebca6b)>>>0;
  }
  return (a.toString(36).padStart(7,'0')+b.toString(36).padStart(7,'0')).slice(0,12);
}
function previousShortArticleCode(value=''){
  const input=String(value||'').trim();
  const hex=input.replace(/-/g,'').toLowerCase();
  if(/^[0-9a-f]{32}$/.test(hex)){
    return Buffer.from(hex,'hex').toString('base64')
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  return legacyShortArticleCode(input);
}
function shortArticleCode(value=''){
  const input=String(value||'').trim();
  const hex=input.replace(/-/g,'').toLowerCase();
  if(/^[0-9a-f]{32}$/.test(hex)){
    return BigInt('0x'+hex).toString(36).padStart(25,'0');
  }
  return legacyShortArticleCode(input);
}
function schemaScript(data){if(!data)return '';const list=Array.isArray(data)?data:[data];return list.filter(Boolean).map(x=>'<script type="application/ld+json">'+JSON.stringify(x).replace(/</g,'\\u003c')+'</script>').join('');}
function e(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const CATEGORY_EN={'سیاسی':'Politics','ساردوئیه':'Sardouiyeh','اجتماعی':'Society','فرهنگ':'Culture','فرهنگ و ورزش':'Culture & Sports','ورزش':'Sports','کشاورزی':'Agriculture','گردشگری':'Tourism','اقتصادی':'Economy','حوادث':'Incidents','آب‌وهوا':'Weather','آموزش':'Education','خبر کوتاه':'Short News'};
function catEn(name=''){return CATEGORY_EN[String(name)]||String(name||'News');}
function categoryTone(category){
  const id=String(category?.id||category||'').toLowerCase();
  const name=String(category?.name||'');
  if(id==='city-village'||/سیاسی/.test(name))return 'politics';
  if(id==='sports'||/ورزش/.test(name))return 'sports';
  if(id==='agriculture'||/کشاورزی/.test(name))return 'agriculture';
  if(id==='tourism'||/گردشگری/.test(name))return 'tourism';
  if(id==='culture'||/فرهنگ/.test(name))return 'culture';
  if(id==='social'||/اجتماعی/.test(name))return 'social';
  if(id==='kerman'||/کرمان/.test(name))return 'kerman';
  if(id==='video'||/ویدئو/.test(name))return 'video';
  if(id==='short-news'||/خبر کوتاه/.test(name))return 'default';
  if(id==='incidents'||/حوادث|حادثه/.test(name))return 'incidents';
  if(id==='weather'||/آب[‌ -]?و[‌ -]?هوا|هواشناسی/.test(name))return 'default';
  if(/آموزش/.test(name))return 'education';
  if(/اقتصاد/.test(name))return 'economy';
  if(id==='sardouiyeh'||/ساردو/.test(name))return 'local';
  return 'default';
}
function bi(fa,en=''){return '<span class="lang-fa">'+e(fa)+'</span>'+(en?'<span class="lang-en">'+e(en)+'</span>':'');}
function fmt(iso){try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tehran'}).format(new Date(iso));}catch{return iso||'';}}
function imageMime(v=''){
  const p=String(v||'').split('?')[0].toLowerCase();
  if(p.endsWith('.png'))return 'image/png';
  if(p.endsWith('.webp'))return 'image/webp';
  if(p.endsWith('.gif'))return 'image/gif';
  return 'image/jpeg';
}
function shell(title,body,desc='نبض ساردو؛ رسانه محلی ساردوئیه و جنوب کرمان',opts={}){
const canonical=opts.canonical?absoluteUrl(opts.canonical):'';
const ogUrl=opts.ogUrl?absoluteUrl(opts.ogUrl):canonical;
const ogTitle=opts.ogTitle||title;
const image=opts.image?absoluteUrl(opts.image):'';
const imageAlt=opts.imageAlt||ogTitle||'نبض ساردو';
const imageWidth=Number(opts.imageWidth||0);
const imageHeight=Number(opts.imageHeight||0);
const imageType=opts.imageType||imageMime(image);
const editorAssets=opts.editorAssets===true||body.includes('class="wrap admin"')||body.includes('class="login"');
const coverflowAssets=opts.coverflowAssets===true;
const robots=opts.robots||(editorAssets?'noindex,nofollow':'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
const ogType=opts.ogType||'website';
const preloadImage=opts.preloadImage?absoluteUrl(opts.preloadImage):'';
const preconnect=opts.preconnect||'';
const verify=process.env.GOOGLE_SITE_VERIFICATION?'<meta name="google-site-verification" content="'+e(process.env.GOOGLE_SITE_VERIFICATION)+'">':'';
const articleMeta=ogType==='article'?[
  opts.publishedTime?'<meta property="article:published_time" content="'+e(opts.publishedTime)+'">':'',
  opts.modifiedTime?'<meta property="article:modified_time" content="'+e(opts.modifiedTime)+'">':'',
  opts.section?'<meta property="article:section" content="'+e(opts.section)+'">':''
].join(''):'';
const imageMeta=image?[
  '<meta property="og:image" content="'+e(image)+'">',
  '<meta property="og:image:url" content="'+e(image)+'">',
  '<meta property="og:image:secure_url" content="'+e(image)+'">',
  '<meta property="og:image:type" content="'+e(imageType)+'">',
  imageWidth>0?'<meta property="og:image:width" content="'+imageWidth+'">':'',
  imageHeight>0?'<meta property="og:image:height" content="'+imageHeight+'">':'',
  '<meta property="og:image:alt" content="'+e(imageAlt)+'">',
  '<link rel="image_src" href="'+e(image)+'">',
  '<meta name="thumbnail" content="'+e(image)+'">',
  '<meta itemprop="image" content="'+e(image)+'">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<meta name="twitter:image" content="'+e(image)+'">',
  '<meta name="twitter:image:alt" content="'+e(imageAlt)+'">'
].join(''):'<meta name="twitter:card" content="summary">';
return `<!doctype html><html lang="fa-IR" dir="rtl" data-lang="fa"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content"><meta name="nabez-build" content="${e(BUILD_VERSION)}"><meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"><meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0"><title>${e(title)}</title><link rel="icon" type="image/png" sizes="96x96" href="/assets/favicon.png"><meta name="description" content="${e(desc)}"><meta itemprop="name" content="${e(ogTitle)}"><meta itemprop="description" content="${e(desc)}"><meta name="robots" content="${e(robots)}"><meta name="googlebot" content="${e(robots)}">${verify}${preconnect?'<link rel="preconnect" href="'+e(preconnect)+'">':''}${preloadImage?'<link rel="preload" as="image" href="'+e(preloadImage)+'" fetchpriority="high">':''}${canonical?'<link rel="canonical" href="'+e(canonical)+'">':''}<link rel="sitemap" type="application/xml" href="${e(absoluteUrl('/sitemap.xml'))}"><link rel="alternate" type="application/rss+xml" title="نبض ساردو" href="${e(absoluteUrl('/feed.xml'))}"><meta name="theme-color" content="#1f1712"><meta property="og:locale" content="fa_IR"><meta property="og:site_name" content="نبض ساردو"><meta property="og:type" content="${e(ogType)}"><meta property="og:title" content="${e(ogTitle)}"><meta property="og:description" content="${e(desc)}"><meta property="og:url" content="${e(ogUrl)}">${articleMeta}${imageMeta}<meta name="twitter:title" content="${e(ogTitle)}"><meta name="twitter:description" content="${e(desc)}"><meta name="twitter:url" content="${e(ogUrl)}"><link rel="stylesheet" href="/assets/site.css?v=${ASSET_VERSION}"><link rel="stylesheet" href="/assets/header-fix.css?v=${ASSET_VERSION}"><link rel="stylesheet" href="/assets/editor.css?v=${ASSET_VERSION}"><link rel="stylesheet" href="/assets/article-lock.css?v=${ASSET_VERSION}"><link rel="stylesheet" href="/assets/claude-system.css?v=${ASSET_VERSION}">${coverflowAssets?'<link rel="stylesheet" href="/assets/hero-3d.css?v='+ASSET_VERSION+'">':''}${!editorAssets?'<link rel="stylesheet" href="/assets/news-refinements.css?v='+ASSET_VERSION+'">':''}${body.includes('data-article-text-story')?'<link rel="stylesheet" href="/assets/text-story.css?v='+ASSET_VERSION+'"><script src="/assets/text-story.js?v='+ASSET_VERSION+'" defer></script>':''}${schemaScript(opts.schema)}</head><body class="${editorAssets?'editor-shell':'public-shell'}">${editorAssets?'':'<aside class="spatial-rail" aria-label="دسترسی سریع"><a href="/" aria-label="خانه" title="خانه">⌂</a><a href="/all-news" aria-label="آرشیو" title="آرشیو">▤</a><a href="/about" aria-label="درباره ما" title="درباره ما">ⓘ</a><a href="/admin" aria-label="مدیریت" title="مدیریت">⌘</a></aside>'}${body}<script src="/assets/mp4-muxer.min.js?v=${ASSET_VERSION}" defer></script><script src="/assets/site.js?v=${ASSET_VERSION}&reels=auto-premium-20260925-7" defer></script>${coverflowAssets?'<script src="/assets/hero-3d.js?v='+ASSET_VERSION+'" defer></script>':''}${editorAssets?'<script src="/assets/editor.js?v='+ASSET_VERSION+'" defer></script>':''}</body></html>`;}
function logo(){return `<a class="brand" href="/"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 64 64" role="img"><defs><linearGradient id="brandPulseGold" x1="5" y1="17" x2="59" y2="46" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9b6a2b"/><stop offset=".28" stop-color="#f0ce84"/><stop offset=".58" stop-color="#fff1bc"/><stop offset="1" stop-color="#9a6a2d"/></linearGradient></defs><path d="M5 34h13l5-8 6 18 7-27 8 22 6-7h9" fill="none" stroke="#6e491e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".48"/><path d="M5 34h13l5-8 6 18 7-27 8 22 6-7h9" fill="none" stroke="url(#brandPulseGold)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 32.7h13l5-8 6 18 7-27 8 22 6-7h9" fill="none" stroke="#fff3c8" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/></svg></span><b><span class="lang-fa">نبض ساردو</span><span class="lang-en">Nabez Sardo</span><small>NABEZ SARDO · NEWSROOM</small></b></a>`;}
function header(db){
  const cats=(db.categories||[]).filter(x=>x&&x.id!=='short-news').slice(0,5);
  return `<header class="site-capsule"><div class="wrap row main">${logo()}<nav class="site-inline-nav" aria-label="دسته‌های خبر"><a href="/">خانه</a><a href="/all-news">آخرین اخبار</a>${cats.map(x=>`<a href="/category/${encodeURIComponent(x.id)}">${e(x.name)}</a>`).join('')}</nav><span class="header-spacer"></span><a class="header-search-round" href="/search" aria-label="جستجو">⌕</a><a class="btn primary header-send" href="/send-news">ارسال خبر</a></div></header>`;
}
function footer(){return `<footer><div class="wrap foot"><div><h3><span class="lang-fa">نبض ساردو</span><span class="lang-en">Nabez Sardo</span></h3><p><span class="lang-fa">خبر دقیق، روایت انسانی و هویت منطقه.</span><span class="lang-en">Accurate news, human stories, local identity.</span></p></div><div><h4><span class="lang-fa">رسانه</span><span class="lang-en">Media</span></h4><a href="/about"><span class="lang-fa">درباره ما</span><span class="lang-en">About</span></a><a href="/contact"><span class="lang-fa">تماس</span><span class="lang-en">Contact</span></a><a href="/editorial-policy">سیاست تحریریه و اصلاحات</a><a href="/send-news"><span class="lang-fa">ارسال خبر</span><span class="lang-en">Send a Story</span></a></div><div><h4><span class="lang-fa">دسترسی</span><span class="lang-en">Quick Links</span></h4><a href="/"><span class="lang-fa">خانه</span><span class="lang-en">Home</span></a><a href="/all-news"><span class="lang-fa">آرشیو</span><span class="lang-en">Archive</span></a><a href="/category/short-news"><span class="lang-fa">خبر کوتاه</span><span class="lang-en">Short News</span></a></div><div><h4>NABEZ SARDO</h4><p>Independent Local Newsroom</p><a href="/local/sardouiyeh">اخبار ساردوئیه</a><a href="/local/jiroft">اخبار جیرفت</a><a href="/local/anbarabad">اخبار عنبرآباد</a><a href="/local/kahnuj">اخبار کهنوج</a><a href="/local/south-kerman">اخبار جنوب کرمان</a></div></div><div class="copy"><span class="lang-fa">© نبض ساردو — تمامی حقوق محفوظ است.</span><span class="lang-en">© Nabez Sardo — All rights reserved.</span></div></footer>`;}
function imageRatio(a){const r=Number(a?.imageRatio);return Number.isFinite(r)&&r>0?r:16/9;}
function imageOrientation(a){const o=String(a?.imageOrientation||'');if(['portrait','square','landscape'].includes(o))return o;const r=imageRatio(a);return r<.92?'portrait':r>1.08?'landscape':'square';}
function displayImage(a){
  const src=String(a.image||'');
  if(src&&!a.imageAuto&&!/(?:^|\/)(?:auto-cover-[^/]+|placeholder)\.svg(?:\?|$)/.test(src))return src;
  const asset=coverAssetName(a);
  return asset?'/assets/'+asset+'?v=topics-20260930':'/assets/news-cover.svg?v=premium-20260929';
}
function isBrandedCover(src=''){
  return /(?:^|\/)(?:news-cover[^/]*|auto-cover-[^/]+|placeholder)\.(?:svg|png|jpe?g|webp)(?:\?|$)/i.test(src);
}
function listingImage(a){
  const safePhoto=src=>typeof src==='string'&&/^(?:\/(?!\/)|https?:\/\/)/i.test(src)&&!isBrandedCover(src);
  if(!a.imageAuto&&safePhoto(a.image))return a.image;
  const gallery=Array.isArray(a.gallery)?a.gallery:[];
  const inline=[...String(a.bodyHtml||'').matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>m[1].replace(/&amp;/g,'&'));
  return [...gallery,...inline].find(safePhoto)||displayImage(a);
}
function listingExcerpt(a,lang='fa',max=160){
  const clean=v=>String(v||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const title=clean(lang==='en'?a.titleEn:a.title);
  const candidates=lang==='en'?[a.leadEn,a.bodyEn,a.bodyHtmlEn]:[a.lead,a.body,a.bodyHtml];
  let text='';
  for(const candidate of candidates){
    text=clean(candidate);
    if(title&&text.startsWith(title))text=text.slice(title.length).replace(/^[\s:؛،.\-–—]+/,'');
    if(text)break;
  }
  if(text.length<=max)return text;
  const cut=text.slice(0,max-1),space=cut.lastIndexOf(' ');
  return (space>max*.6?cut.slice(0,space):cut).trim()+'…';
}
function card(a,db){
  a=presentArticle(a);
  const c=db.categories.find(x=>x.id===a.categoryId),ratio=imageRatio(a),orient=imageOrientation(a);
  const titleEn=String(a.titleEn||'').trim(),leadEn=String(a.leadEn||'').trim(),image=listingImage(a);
  const url='/news/'+encodeURIComponent(a.slug),shareUrl='/news/'+shortArticleCode(a.id),catFa=c?.name||'خبر',catEnglish=catEn(c?.name||'News');
  const rawBodyFa=String(a.body||a.bodyHtml||a.lead||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const rawBodyEn=String(a.bodyEn||a.bodyHtmlEn||a.leadEn||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const storyBodyFa=rawBodyFa.length>280?rawBodyFa.slice(0,277).trim()+'…':rawBodyFa;
  const storyBodyEn=rawBodyEn.length>280?rawBodyEn.slice(0,277).trim()+'…':rawBodyEn;
  const media=a.videoUrl
    ? `<a class="card-media ${orient} card-media-video" data-adaptive-media style="--image-ratio:${ratio}" href="${url}"><video muted autoplay loop playsinline preload="metadata" ${a.image?`poster="${e(a.image)}"`:''}><source src="${e(a.videoUrl)}" type="${e(a.videoType||'video/mp4')}"></video><span class="card-video-badge">▶ <span class="lang-fa">ویدئو</span><span class="lang-en">Video</span></span><span class="card-story-badge"><span class="card-story-dot" aria-hidden="true"></span><span class="lang-fa">استوری</span><span class="lang-en">Story</span></span></a>`
    : `<a class="card-media ${orient}" data-adaptive-media style="--image-ratio:${ratio}" href="${url}"><img src="${e(image)}" alt="${e(a.title)}" loading="lazy" decoding="async" fetchpriority="low"><span class="card-story-badge"><span class="card-story-dot" aria-hidden="true"></span><span class="lang-fa">استوری</span><span class="lang-en">Story</span></span></a>`;
  return `<article class="card tilt" data-image-kind="${a.videoUrl?'video':isBrandedCover(image)?'fallback':'photo'}" data-cat-tone="${e(categoryTone(c))}" data-story-card data-story-title-fa="${e(a.title)}" data-story-title-en="${e(titleEn)}" data-story-lead-fa="${e(a.lead||'')}" data-story-lead-en="${e(leadEn)}" data-story-body-fa="${e(storyBodyFa)}" data-story-body-en="${e(storyBodyEn)}" data-story-image="${e(image)}" data-story-category-fa="${e(catFa)}" data-story-category-en="${e(catEnglish)}" data-story-category-id="${e(a.categoryId||'')}" data-story-url="${e(shareUrl)}">${media}<div class="pad"><div class="card-kicker"><span class="eyebrow"><span class="lang-fa">${e(catFa)}</span><span class="lang-en">${e(catEnglish)}</span></span><span class="view-badge">◉ ${Number(a.views||0).toLocaleString('fa-IR')}</span></div><time class="news-date" data-news-date="${e(a.publishedAt||a.createdAt||'')}"></time>${a.kicker?`<div class="story-kicker">${e(a.kicker)}</div>`:''}<h3><a href="${url}"><span class="lang-fa">${e(a.title)}</span>${titleEn?`<span class="lang-en">${e(titleEn)}</span>`:''}</a></h3><p class="listing-excerpt"><span class="lang-fa">${e(listingExcerpt(a))}</span>${leadEn?`<span class="lang-en">${e(listingExcerpt(a,'en'))}</span>`:''}</p><a class="more" href="${url}"><span class="lang-fa">مطالعه خبر ←</span><span class="lang-en">Read story →</span></a></div></article>`;
}

function oldBody(a){return e(a.body||'').split('\n').filter(Boolean).map(p=>`<p>${p}</p>`).join('');}
module.exports={listingImage,isBrandedCover,listingExcerpt,e,fmt,shell,logo,header,footer,card,oldBody,imageRatio,imageOrientation,displayImage,absoluteUrl,shortArticleCode,previousShortArticleCode,legacyShortArticleCode,PUBLIC_BASE,ASSET_VERSION,bi,catEn,categoryTone};
