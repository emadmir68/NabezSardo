const {published}=require('./store');
const {e,shell,displayImage,shortArticleCode}=require('./view-common');

const HUES={
  incidents:345,weather:222,agriculture:112,sports:165,tourism:192,social:205,culture:272,
  politics:28,economy:40,education:250,sardouiyeh:38,kerman:18,video:12,'short-news':205,opinion:330
};
const NAME_HUES={'حوادث':345,'آب‌وهوا':222,'کشاورزی':112,'ورزش':165,'گردشگری':192,'اجتماعی':205,'فرهنگ':272,'سیاسی':28,'اقتصادی':40,'آموزش':250,'ساردوئیه':38,'خبر کوتاه':205};

function compact(v='',max=160){
  const s=String(v||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return s.length>max?s.slice(0,max-1).trim()+'…':s;
}
function ageFa(iso=''){
  const t=new Date(iso).getTime();
  if(!Number.isFinite(t))return 'تازه منتشر شده';
  const d=Math.max(0,Date.now()-t),m=Math.floor(d/60000),h=Math.floor(d/3600000),day=Math.floor(d/86400000);
  if(m<1)return 'همین حالا';
  if(m<60)return `${m.toLocaleString('fa-IR')} دقیقه پیش`;
  if(h<24)return `${h.toLocaleString('fa-IR')} ساعت پیش`;
  if(day===1)return 'دیروز';
  if(day<7)return `${day.toLocaleString('fa-IR')} روز پیش`;
  try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'short',day:'numeric',timeZone:'Asia/Tehran'}).format(new Date(t));}catch{return ''}
}
function categoryOf(db,a){return db.categories.find(c=>c.id===a?.categoryId)||{id:a?.categoryId||'',name:'خبر'};}
function hueOf(c){return HUES[c?.id]||NAME_HUES[c?.name]||40;}
function newsUrl(a){return '/news/'+encodeURIComponent(a.slug);}
function compactNewsUrl(a){return '/news/'+shortArticleCode(a.id);}
function imageOf(a){return displayImage(a);}
function articleLocation(a){return a.location||'ساردوئیه';}
function sortNewest(list){return [...list].sort((a,b)=>new Date(b.publishedAt||b.createdAt||0)-new Date(a.publishedAt||a.createdAt||0));}
function geoTier(a={}){
  const txt=[a.location,a.title,a.lead,a.body].filter(Boolean).join(' ');
  if(/جنوب کرمان|ساردوئیه|ساردو|جیرفت|کهنوج|عنبرآباد|رودبار جنوب|قلعه[‌ ]?گنج|منوجان|فاریاب|جازموریان|دلفارد|بحرآسمان|هلیل/.test(txt))return 0;
  if(/کرمان/.test(txt))return 1;
  return 2;
}
function prioritized(list){
  return [...list].sort((a,b)=>{
    const ga=geoTier(a),gb=geoTier(b);if(ga!==gb)return ga-gb;
    if(Boolean(a.featured)!==Boolean(b.featured))return b.featured?1:-1;
    return new Date(b.publishedAt||b.createdAt||0)-new Date(a.publishedAt||a.createdAt||0);
  });
}
function pulseLogo(){return '<svg viewBox="0 0 60 30"><defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" stop-color="var(--g1)"/><stop offset=".5" stop-color="var(--g3)"/><stop offset="1" stop-color="var(--g2)"/></linearGradient></defs><path d="M2 16h13l5-7 7 15 8-22 8 22 7-13 7 5h1" fill="none" stroke="url(#lg)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function pinSvg(){return '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>';}
function cardMarkup(db,a,k){
  const c=categoryOf(db,a),h=hueOf(c),img=imageOf(a),url=newsUrl(a),time=ageFa(a.publishedAt||a.createdAt),views=Number(a.views||0).toLocaleString('fa-IR');
  return `<article class="card glass" style="--h:${h}" data-slide data-index="${k}" data-cat="${e(c.name)}" data-time="${e(time)}" data-url="${e(url)}" data-story-title-fa="${e(a.title)}" data-story-url="${e(compactNewsUrl(a))}" tabindex="0">
    <div class="art"><img class="sc" src="${e(img)}" alt="${e(a.title)}" ${k===0?'fetchpriority="high"':'loading="lazy"'} decoding="async"><span class="art-wash" aria-hidden="true"></span></div>
    <div class="shade"></div>
    <div class="top"><span class="pill glass">${e(time)}</span><span class="more glass" aria-hidden="true">⋯</span></div>
    <div class="info"><div class="pn glass"><span class="tag"><i></i>${e(c.name)}</span><h2>${e(a.title)}</h2><p>${e(compact(a.lead||a.body||'',150))}</p><div class="meta"><span>${pinSvg()}${e(articleLocation(a))}</span><span>◉ ${views}</span></div><a class="rd" href="${e(url)}">مطالعه خبر</a></div></div>
  </article>`;
}
function newsCard(db,a){
  const c=categoryOf(db,a),h=hueOf(c),img=imageOf(a),url=newsUrl(a),time=ageFa(a.publishedAt||a.createdAt),views=Number(a.views||0).toLocaleString('fa-IR');
  return `<a class="nc glass" style="--h:${h}" href="${e(url)}"><div class="c"><img class="nc-img" src="${e(img)}" alt="${e(a.title)}" loading="lazy" decoding="async"><span class="nc-shade"></span></div><div class="nb"><span class="tag">${e(c.name)}</span><h4>${e(a.title)}</h4><small>${e(time)} · ◉ ${views}</small></div></a>`;
}
function home(db){
  const all=sortNewest(published(db));
  const regular=prioritized(all.filter(a=>a.categoryId!=='short-news'));
  const hero=regular.slice(0,6);
  const latest=regular.slice(0,9);
  const shorts=all.filter(a=>a.categoryId==='short-news').slice(0,4);
  const shortList=shorts.length?shorts:regular.slice(0,4);
  const popular=[...regular].sort((a,b)=>Number(b.views||0)-Number(a.views||0)).slice(0,4);
  const categories=[...db.categories].filter(c=>c.id!=='short-news');
  const stage=hero.length?hero.map((a,k)=>cardMarkup(db,a,k)).join(''):'<div class="empty-home glass">هنوز خبری منتشر نشده است.</div>';
  const dots=hero.map((_,k)=>`<i class="${k===0?'on':''}"></i>`).join('');
  const first=hero[0];
  const playerCat=first?categoryOf(db,first).name:'نبض ساردو';
  const playerTime=first?ageFa(first.publishedAt||first.createdAt):'خبرهای محلی';
  const hubData=[
    ['ساردوئیه','/local/sardouiyeh'],['جیرفت','/local/jiroft'],['عنبرآباد','/search?q='+encodeURIComponent('عنبرآباد')],['کهنوج','/search?q='+encodeURIComponent('کهنوج')],['جنوب کرمان','/local/south-kerman']
  ];
  const hubs=hubData.map((x,k)=>`<a class="chip glass${k?'':' hub'}" href="${x[1]}">${x[0]}</a>`).join('');
  const cats=`<a class="chip glass" style="--h:205" href="/category/short-news"><i></i>خبر کوتاه</a>`+categories.map(c=>`<a class="chip glass" style="--h:${hueOf(c)}" href="/category/${encodeURIComponent(c.id)}"><i></i>${e(c.name)}</a>`).join('');
  const shortMarkup=shortList.map(a=>{const c=categoryOf(db,a);return `<a class="sn" style="--h:${hueOf(c)}" href="${e(newsUrl(a))}"><b></b><div><span>${e(ageFa(a.publishedAt||a.createdAt))} · ${e(c.name)}</span><p>${e(a.title)}</p></div></a>`}).join('');
  const popularMarkup=popular.map((a,r)=>`<a class="mv" href="${e(newsUrl(a))}"><em>${(r+1).toLocaleString('fa-IR')}</em><div><p>${e(a.title)}</p><span>◉ ${Number(a.views||0).toLocaleString('fa-IR')}</span></div></a>`).join('');
  const latestMarkup=latest.map(a=>newsCard(db,a)).join('')||'<div class="empty-home glass">خبری برای نمایش وجود ندارد.</div>';
  const schema={"@context":"https://schema.org","@type":"WebSite",name:"نبض ساردو",alternateName:"Nabez Sardo",url:"https://nabzesardo.ir/",inLanguage:"fa-IR"};
  const body=`
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;800&family=Noto+Kufi+Arabic:wght@500;700;800&display=swap">
<link rel="stylesheet" href="/assets/claude-home.css?v=20261021-claude-1">
<script>document.body.classList.add('claude-home-body');document.documentElement.dataset.accent=localStorage.getItem('nabez-claude-accent')||'gold';</script>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter><linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#ffe9c9" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs></svg>
${first?`<div class="room-photo" aria-hidden="true"><img src="${e(imageOf(first))}" alt=""></div>`:''}`\n<div class="sky" aria-hidden="true"><svg id="mt" viewBox="0 0 1200 440" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="rim" x1="0" x2="1"><stop offset="0" stop-color="#ffd9a3" stop-opacity="0"/><stop offset=".5" stop-color="#ffe2b0"/><stop offset="1" stop-color="#ffd9a3" stop-opacity="0"/></linearGradient></defs><path d="M0 250L110 190 200 235 330 120 450 220 560 160 700 240 820 140 960 230 1080 180 1200 240V440H0Z" fill="#4a2a22" opacity=".85"/><path d="M0 250L110 190 200 235 330 120 450 220 560 160 700 240 820 140 960 230 1080 180 1200 240" fill="none" stroke="url(#rim)" stroke-width="2"/><path d="M0 300L140 250 260 295 400 215 540 285 680 235 840 300 980 245 1100 290 1200 260V440H0Z" fill="#2a1713"/><path d="M880 322V288h86v34z M890 288a33 30 0 0 1 66 0z M923 258v-10 M990 322V250h8v72z M988 250a6 6 0 0 1 12 0z" fill="#150a08"/><path d="M0 350C180 315 300 355 470 330S800 300 1200 345V440H0Z" fill="#0e0706"/></svg></div>
<header class="hd glass"><a class="brand" href="/"><span>نبض ساردو</span>${pulseLogo()}</a><nav class="home-nav" aria-label="دسته‌های خبر"><a href="/">همه</a>${categories.slice(0,5).map(c=>`<a href="/category/${encodeURIComponent(c.id)}">${e(c.name)}</a>`).join('')}</nav><span class="sp"></span><a class="search-round" href="/search" aria-label="جستجو">⌕</a><a class="btn send-mini" href="/send-news">ارسال خبر</a></header>
<div id="home"><main class="w">
<section class="hero"><h1>نبض ساردوئیه؛<br>صدای خبرهای محلی</h1><p>خبرهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و قابل اعتماد.</p><svg class="pulse" viewBox="0 0 512 120" aria-hidden="true"><defs><linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="var(--g1)"/><stop offset=".5" stop-color="var(--g3)"/><stop offset="1" stop-color="var(--g2)"/></linearGradient></defs><path d="M0 70h92l38-58 46 108 52-120 58 90 42-20h184" fill="none" stroke="url(#pg)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></section>
<form class="tb glass" action="/search" method="get" role="search"><button class="ib" id="sh" type="button" aria-label="اشتراک‌گذاری"><svg viewBox="0 0 24 24"><path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6"/></svg></button><input name="q" type="search" placeholder="جستجو در خبرهای نبض ساردو…" aria-label="جستجو در خبرها"><button class="ib" type="submit" aria-label="جستجو"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg></button></form>
<div class="stage" id="stage" aria-roledescription="carousel">${stage}</div>
${hero.length?`<div class="pl glass"><div class="av">${pulseLogo()}</div><div class="pt"><b id="pt">${e(playerCat)}</b><span id="ps">${e(playerTime)} · نبض ساردو</span></div><button class="ib heart" id="hv" type="button" aria-label="پسندیدن"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button><button class="ib" id="nx" type="button" aria-label="خبر بعدی"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><button class="ib" id="pv" type="button" aria-label="خبر قبلی"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div><div class="dots" id="dots">${dots}</div>`:''}
<section class="sec"><h3>خبرهای شهرها</h3><div class="row">${hubs}</div></section>
<section class="sec"><h3>آخرین اخبار</h3><div class="ng">${latestMarkup}</div></section>
<section class="sec"><h3>موضوع‌ها</h3><div class="row">${cats}</div></section>
<div class="two sec"><section><h3>خبر کوتاه</h3><div class="box glass">${shortMarkup}</div></section><section><h3>پربازدیدترین‌ها</h3><div class="box glass">${popularMarkup}</div></section></div>
<section class="cta glass"><h3>شما هم خبرنگار ساردوئیه‌اید</h3><p>چیزی دیده‌اید که مردم باید بدانند؟ خبر، عکس یا ویدئو را برای ما بفرستید.</p><a class="btn" href="/send-news">ارسال خبر مردمی</a></section>
</main></div>
<footer><div class="w"><div class="ft"><div><b>نبض ساردو</b>خبر دقیق، روایت انسانی و هویت منطقه.</div><div><b>رسانه</b><a href="/about">درباره ما</a><a href="/contact">تماس</a><a href="/about#editorial">سیاست تحریریه و اصلاحات</a><a href="/all-news">آرشیو</a></div><div><b>اخبار محلی</b><a href="/local/sardouiyeh">ساردوئیه</a><a href="/local/jiroft">جیرفت</a><a href="/search?q=${encodeURIComponent('عنبرآباد')}">عنبرآباد</a><a href="/search?q=${encodeURIComponent('کهنوج')}">کهنوج</a><a href="/local/south-kerman">جنوب کرمان</a></div></div><div class="cp">© نبض ساردو — تمامی حقوق محفوظ است.</div></div></footer>
<script src="/assets/claude-home.js?v=20261021-claude-1" defer></script>`;
  return shell('اخبار ساردوئیه، جیرفت و جنوب کرمان | نبض ساردو',body,'خبرهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و قابل اعتماد.',{canonical:'/',schema});
}
module.exports=home;
