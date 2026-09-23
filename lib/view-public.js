const {published}=require('./store');
const {e,shell,header,footer,card,oldBody,imageRatio,imageOrientation,absoluteUrl,PUBLIC_BASE,catEn,categoryTone}=require('./view-common');

function compactText(v='',max=160){
  const s=String(v||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return s.length>max?s.slice(0,max-1).trim()+'…':s;
}

function trustedArticleLocation(a){
  const raw=String(a?.location||'').trim();
  if(!raw)return '';
  if(raw==='ساردوئیه'){
    const content=[a?.title,a?.lead,a?.body].filter(Boolean).join(' ');
    if(a?.categoryId!=='sardouiyeh'&&!/ساردوئیه|ساردویه|ساردو/.test(content))return '';
  }
  return raw;
}


function followupEffectiveStatus(x){
  const raw=String(x?.status||'announced');
  if(raw==='completed'||raw==='closed')return raw;
  if(x?.deadline){
    const t=new Date(String(x.deadline)+'T23:59:59+03:30').getTime();
    if(Number.isFinite(t)&&Date.now()>t)return 'overdue';
  }
  return raw;
}
function followupStatusMeta(x){
  const s=followupEffectiveStatus(x);
  const map={announced:['اعلام شد','ANNOUNCED',1],started:['شروع شد','STARTED',2],progress:['در حال اجرا','IN PROGRESS',3],completed:['تکمیل شد','COMPLETED',4],paused:['متوقف / در انتظار','ON HOLD',2],closed:['مختومه','CLOSED',4],overdue:['موعد گذشته','PAST DUE',3]};
  const v=map[s]||map.announced;
  return {key:s,label:v[0],en:v[1],step:v[2]};
}
function followupSorted(db){
  return [...(db?.followups||[])].sort((a,b)=>{
    const af=a.featured?1:0,bf=b.featured?1:0;
    if(af!==bf)return bf-af;
    return new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0);
  });
}
function faDateOnly(v=''){
  if(!v)return '';
  try{return new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'}).format(new Date(String(v).length===10?v+'T12:00:00+03:30':v));}catch{return String(v)}
}
function followupCard(x,compact=false){
  const m=followupStatusMeta(x);
  const source=x.sourceUrl?`<a class="fu-source" href="${e(x.sourceUrl)}" ${/^https:\/\//i.test(x.sourceUrl)?'target="_blank" rel="noopener"':''}>${e(x.sourceLabel||'منبع و خبر مرتبط')} ←</a>`:'';
  return `<article class="fu-card ${compact?'is-compact':''}" data-fu-status="${e(m.key)}">
    <div class="fu-card-top"><span class="fu-status"><i></i>${e(m.label)}</span>${x.featured?'<span class="fu-featured">پیگیری ویژه</span>':''}</div>
    <h3>${e(x.title||'پرونده پیگیری')}</h3>
    <p class="fu-promise">${e(compactText(x.promise||'',compact?150:260))}</p>
    <div class="fu-meta">
      ${x.promisor?`<span><small>اعلام‌کننده</small><b>${e(x.promisor)}</b></span>`:''}
      ${x.location?`<span><small>محدوده</small><b>${e(x.location)}</b></span>`:''}
      ${x.deadline?`<span><small>موعد اعلام‌شده</small><b>${e(faDateOnly(x.deadline))}</b></span>`:''}
    </div>
    ${compact?'':`<div class="fu-progress" aria-label="وضعیت پرونده"><span class="${m.step>=1?'on':''}">اعلام</span><span class="${m.step>=2?'on':''}">شروع</span><span class="${m.step>=3?'on':''}">اجرا</span><span class="${m.step>=4?'on':''}">نتیجه</span></div>`}
    ${!compact&&x.note?`<div class="fu-note"><b>آخرین وضعیت</b><p>${e(x.note)}</p></div>`:''}
    <div class="fu-card-bottom">${x.updatedAt?`<small>آخرین بروزرسانی: ${e(faDateOnly(x.updatedAt))}</small>`:'<small>در حال پیگیری</small>'}${source}</div>
  </article>`;
}
function siteSchema(){
  return [
    {'@context':'https://schema.org','@type':'WebSite',name:'نبض ساردو',alternateName:'Nabez Sardo',url:PUBLIC_BASE+'/',inLanguage:'fa-IR',potentialAction:{'@type':'SearchAction',target:absoluteUrl('/search?q={search_term_string}'),'query-input':'required name=search_term_string'}},
    {'@context':'https://schema.org','@type':'NewsMediaOrganization',name:'نبض ساردو',alternateName:['Nabez Sardo','نبض ساردوئیه'],url:PUBLIC_BASE+'/',logo:{'@type':'ImageObject',url:absoluteUrl('/assets/favicon.png')},description:'پایگاه خبری محلی ساردو و ساردوئیه با پوشش اخبار جیرفت، عنبرآباد، کهنوج و جنوب کرمان',areaServed:[{'@type':'Place',name:'ساردو'},{'@type':'Place',name:'ساردوئیه'},{'@type':'Place',name:'جیرفت'},{'@type':'Place',name:'عنبرآباد'},{'@type':'Place',name:'کهنوج'},{'@type':'Place',name:'جنوب کرمان'}]}
  ];
}
function articleSchema(a,c){
  const url=absoluteUrl('/news/'+encodeURIComponent(a.slug));
  const authorName=a.author||'تحریریه نبض ساردو';
  const authorType=authorName.includes('تحریریه')?'Organization':'Person';
  const localLocation=trustedArticleLocation(a);
  const hay=[a.title,a.lead,a.body,localLocation,c?.name].filter(Boolean).join(' ');
  const localTerms=['ساردو','ساردوئیه','ساردویه','جیرفت','عنبرآباد','عنبر اباد','عنبر آباد','کهنوج','جنوب کرمان'];
  const matchedLocal=localTerms.filter(t=>hay.includes(t));
  const news={'@context':'https://schema.org','@type':'NewsArticle',mainEntityOfPage:{'@type':'WebPage','@id':url},headline:a.title,description:compactText(a.lead||a.body||a.title,220),datePublished:a.publishedAt||a.createdAt,dateModified:a.updatedAt||a.publishedAt||a.createdAt,inLanguage:'fa-IR',isAccessibleForFree:true,articleSection:c?.name||'خبر',keywords:[c?.name,localLocation,'نبض ساردو','جنوب کرمان',...matchedLocal].filter(Boolean).filter((v,i,arr)=>arr.indexOf(v)===i).join(', '),author:{'@type':authorType,name:authorName},publisher:{'@type':'NewsMediaOrganization',name:'نبض ساردو',url:PUBLIC_BASE+'/',logo:{'@type':'ImageObject',url:absoluteUrl('/assets/favicon.png')}},url};
  const schemaImages=[a.image,...(Array.isArray(a.gallery)?a.gallery:[]),...[...String(a.bodyHtml||'').matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>m[1])].filter(Boolean);
  if(schemaImages.length)news.image=[...new Set(schemaImages.map(absoluteUrl))].slice(0,20);
  if(a.videoUrl)news.video={
    '@type':'VideoObject',
    name:a.title,
    description:compactText(a.lead||a.body||a.title,220),
    contentUrl:absoluteUrl(a.videoUrl),
    uploadDate:a.publishedAt||a.createdAt,
    thumbnailUrl:a.image?[absoluteUrl(a.image)]:undefined
  };
  const crumb={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'صفحه اصلی',item:PUBLIC_BASE+'/'},{'@type':'ListItem',position:2,name:c?.name||'خبر',item:absoluteUrl('/category/'+encodeURIComponent(a.categoryId||''))},{'@type':'ListItem',position:3,name:a.title,item:url}]};
  return [news,crumb];
}

const LOCAL_HUBS={
  sardouiyeh:{name:'ساردو و ساردوئیه',en:'Sardo / Sardouiyeh',terms:['ساردوئیه','ساردویه','ساردو'],description:'آخرین اخبار ساردو و ساردوئیه؛ رویدادهای محلی، اجتماعی، کشاورزی، گردشگری، راه‌ها و مطالبات مردم منطقه.'},
  jiroft:{name:'جیرفت',en:'Jiroft',terms:['جیرفت'],description:'آخرین اخبار جیرفت؛ تازه‌ترین رویدادهای شهرستان جیرفت، شهر و روستاهای اطراف و جنوب کرمان.'},
  anbarabad:{name:'عنبرآباد',en:'Anbarabad',terms:['عنبرآباد','عنبر اباد','عنبر آباد'],description:'آخرین اخبار عنبرآباد؛ رویدادهای محلی، اجتماعی، اقتصادی، کشاورزی و مطالبات مردم شهرستان عنبرآباد در جنوب کرمان.'},
  kahnuj:{name:'کهنوج',en:'Kahnuj',terms:['کهنوج'],description:'آخرین اخبار کهنوج؛ تازه‌ترین رویدادهای محلی، اجتماعی، راه‌ها، اقتصاد و مطالبات مردم شهرستان کهنوج در جنوب کرمان.'},
  'south-kerman':{name:'جنوب کرمان',en:'South Kerman',terms:['جنوب کرمان','کرمان جنوبی','جیرفت','عنبرآباد','عنبر اباد','عنبر آباد','کهنوج','ساردوئیه','ساردویه','ساردو'],description:'آخرین اخبار جنوب کرمان؛ پوشش خبری ساردو و ساردوئیه، جیرفت، عنبرآباد، کهنوج و دیگر شهرستان‌های جنوب استان کرمان.'}
};
function localHub(db,key){
  const hub=LOCAL_HUBS[key];if(!hub)return null;
  const list=published(db).filter(a=>{const hay=[trustedArticleLocation(a),a.title,a.lead,a.body].filter(Boolean).join(' ');return hub.terms.some(t=>hay.includes(t));});
  const canonical='/local/'+encodeURIComponent(key);
  const schema=[
    {'@context':'https://schema.org','@type':'CollectionPage',name:'اخبار '+hub.name,url:absoluteUrl(canonical),description:hub.description,inLanguage:'fa-IR',isPartOf:{'@type':'WebSite',name:'نبض ساردو',url:PUBLIC_BASE+'/'}},
    {'@context':'https://schema.org','@type':'ItemList',itemListElement:list.slice(0,20).map((a,i)=>({'@type':'ListItem',position:i+1,url:absoluteUrl('/news/'+encodeURIComponent(a.slug)),name:a.title}))}
  ];
  const body=header(db)+'<main class="wrap page category-page local-hub-page"><span class="eyebrow">LOCAL NEWS / '+e(hub.en)+'</span><h1>آخرین اخبار '+e(hub.name)+'</h1><p class="lead">'+e(hub.description)+'</p><nav class="local-hub-links" aria-label="پوشش خبری منطقه"><a href="/local/sardouiyeh">ساردو و ساردوئیه</a><a href="/local/jiroft">جیرفت</a><a href="/local/anbarabad">عنبرآباد</a><a href="/local/kahnuj">کهنوج</a><a href="/local/south-kerman">جنوب کرمان</a></nav><div class="grid news">'+(list.map(a=>card(a,db)).join('')||'<div class="empty">هنوز خبری برای این منطقه منتشر نشده است.</div>')+'</div></main>'+footer();
  return shell('اخبار '+hub.name+' امروز | آخرین خبرهای جنوب کرمان | نبض ساردو',body,hub.description+' | نبض ساردو؛ پوشش خبری محلی جنوب کرمان.',{canonical,schema});
}
function home(db){
 const allNews=published(db);
 const regularNews=allNews.filter(a=>a.categoryId!=='short-news');
 const followups=followupSorted(db);
 const followupOpen=followups.filter(x=>!['completed','closed'].includes(followupEffectiveStatus(x))).length;
 const followupDone=followups.filter(x=>followupEffectiveStatus(x)==='completed').length;
 const leadStory=regularNews.find(a=>a.featured)||regularNews[0]||null;
 const highlightNews=regularNews.filter(a=>!leadStory||a.id!==leadStory.id).slice(0,4);
 const usedIds=new Set([leadStory?.id,...highlightNews.map(a=>a.id)].filter(Boolean));
 const freshNews=regularNews.filter(a=>!usedIds.has(a.id)).slice(0,8);
 const latest=freshNews.length?freshNews:regularNews.slice(0,8);
 const popular=[...regularNews].sort((a,b)=>Number(b.views||0)-Number(a.views||0)).slice(0,5);
 const todayPulse=regularNews.slice(0,5);
 const shortNews=allNews
   .filter(a=>a.categoryId==='short-news')
   .sort((a,b)=>new Date(b.publishedAt||b.createdAt)-new Date(a.publishedAt||a.createdAt))
   .slice(0,10);
 const categoryOf=a=>db.categories.find(c=>c.id===a?.categoryId);
 const storyUrl=a=>'/news/'+encodeURIComponent(a.slug);
 const liveDeskOn=db.settings?.liveDeskEnabled!==false;
 const breakingFa=liveDeskOn?(db.settings?.breakingText||'مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.'):'در حال حاضر خبر فوری فعالی ثبت نشده است.';
 const breakingEn=liveDeskOn?(db.settings?.breakingTextEn||'Top local developments from Sardouiyeh and South Kerman — fast, accurate and local.'):'There is no active breaking news at the moment.';


 const leadMarkup=leadStory?(()=>{
   const c=categoryOf(leadStory),url=storyUrl(leadStory),image=leadStory.image||'/assets/placeholder.svg';
   const media=leadStory.videoUrl
     ? `<div class="front-lead-media front-lead-video-media" style="position:relative;aspect-ratio:16/9;overflow:hidden;background:#05070a">
          <video controls autoplay muted loop playsinline preload="metadata" ${leadStory.image?`poster="${e(leadStory.image)}"`:''} style="display:block;width:100%;height:100%;object-fit:contain;background:#05070a">
            <source src="${e(leadStory.videoUrl)}" type="${e(leadStory.videoType||'video/mp4')}">
          </video>
          <a href="${url}" style="position:absolute;top:12px;right:12px;z-index:4;padding:7px 11px;border-radius:999px;background:rgba(8,12,18,.82);border:1px solid rgba(232,190,109,.34);color:#f0c97f;text-decoration:none;font-size:10px;font-weight:900;backdrop-filter:blur(8px)">▶ ویدئوی خبر</a>
        </div>`
     : `<a class="front-lead-media" href="${url}"><img src="${e(image)}" alt="${e(leadStory.title)}" loading="lazy" decoding="async"><span class="front-lead-shade"></span></a>`;
   return `<article class="front-lead" data-cat-tone="${e(categoryTone(c))}">
     ${media}
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
   const media=a.videoUrl
     ? `<a class="front-brief-media front-brief-video" href="${url}" style="position:relative"><video muted autoplay loop playsinline preload="metadata" ${a.image?`poster="${e(a.image)}"`:''}><source src="${e(a.videoUrl)}" type="${e(a.videoType||'video/mp4')}"></video><span class="front-video-badge">▶ ویدئو</span></a>`
     : `<a class="front-brief-media" href="${url}"><img src="${e(image)}" alt="${e(a.title)}" loading="lazy" decoding="async" fetchpriority="low"></a>`;
   return `<article class="front-brief" data-cat-tone="${e(categoryTone(c))}">
     ${media}
     <div class="front-brief-copy">
       <div class="front-story-meta"><span class="front-rank">${String(i+1).padStart(2,'0')}</span><span class="eyebrow"><span class="lang-fa">${e(c?.name||'خبر')}</span><span class="lang-en">${e(catEn(c?.name||'News'))}</span></span></div>
       <h3><a href="${url}"><span class="lang-fa">${e(a.title)}</span><span class="lang-en">${e(a.titleEn||a.title)}</span></a></h3>
       <time class="news-date" data-news-date="${e(a.publishedAt||a.createdAt||'')}"></time>
     </div>
   </article>`;
 }).join('');
 const popularMarkup=popular.map((a,i)=>{
   const c=categoryOf(a),url=storyUrl(a);
   return `<article class="popular-row" data-cat-tone="${e(categoryTone(c))}">
     <span class="popular-rank">${String(i+1).padStart(2,'0')}</span>
     <div><span class="eyebrow"><span class="lang-fa">${e(c?.name||'خبر')}</span><span class="lang-en">${e(catEn(c?.name||'News'))}</span></span><h3><a href="${url}"><span class="lang-fa">${e(a.title)}</span><span class="lang-en">${e(a.titleEn||a.title)}</span></a></h3><div class="popular-meta"><span>◉ ${Number(a.views||0).toLocaleString('fa-IR')}</span><time class="news-date" data-news-date="${e(a.publishedAt||a.createdAt||'')}"></time></div></div>
   </article>`;
 }).join('');
 const todayPulseMarkup=todayPulse.map((a,i)=>{
   const c=categoryOf(a),url=storyUrl(a);
   return `<article class="today-pulse-item" data-cat-tone="${e(categoryTone(c))}">
     <span class="today-pulse-node" aria-hidden="true"><b>${String(i+1).padStart(2,'0')}</b></span>
     <div class="today-pulse-content">
       <div class="today-pulse-meta"><span class="eyebrow"><span class="lang-fa">${e(c?.name||'خبر')}</span><span class="lang-en">${e(catEn(c?.name||'News'))}</span></span><span class="today-pulse-views">◉ ${Number(a.views||0).toLocaleString('fa-IR')}</span></div>
       <h3><a href="${url}"><span class="lang-fa">${e(a.title)}</span><span class="lang-en">${e(a.titleEn||a.title)}</span></a></h3>
       <div class="today-pulse-bottom"><time class="news-date" data-news-date="${e(a.publishedAt||a.createdAt||'')}"></time><a href="${url}" class="today-pulse-link"><span class="lang-fa">مشاهده خبر ←</span><span class="lang-en">Read →</span></a></div>
     </div>
   </article>`;
 }).join('');
 const shortNewsMarkup=shortNews.map((a,i)=>{
   const url=storyUrl(a);
   const date=a.publishedAt||a.createdAt||'';
   const lead=compactText(a.lead||a.body||'',125);
   return `<article class="home-short-news-row">
     <div class="home-short-news-time">
       <span class="home-short-news-dot" aria-hidden="true"></span>
       <time class="news-date" data-news-date="${e(date)}"></time>
     </div>
     <div class="home-short-news-copy">
       <span class="home-short-news-index">${String(i+1).padStart(2,'0')}</span>
       <div>
         <h3><a href="${url}"><span class="lang-fa">${e(a.title)}</span><span class="lang-en">${e(a.titleEn||a.title)}</span></a></h3>
         ${lead?`<p><span class="lang-fa">${e(lead)}</span><span class="lang-en">${e(compactText(a.leadEn||lead,125))}</span></p>`:''}
       </div>
     </div>
     <a class="home-short-news-open" href="${url}" aria-label="باز کردن خبر">←</a>
   </article>`;
 }).join('');
 const categoryTerminalMarkup=db.categories.slice(0,7).map((c,i)=>{
   const items=allNews.filter(a=>a.categoryId===c.id);
   const latestCat=items[0]||null;
   const url='/category/'+encodeURIComponent(c.id);
   return `<a class="topic-terminal-row" data-cat-tone="${e(categoryTone(c))}" href="${url}">
     <span class="topic-terminal-index">${String(i+1).padStart(2,'0')}</span>
     <span class="topic-terminal-status" aria-hidden="true"><i></i></span>
     <span class="topic-terminal-main">
       <b>${e(c.name)}</b>
       <small>${latestCat?e(latestCat.title):'هنوز خبری در این دسته منتشر نشده است.'}</small>
     </span>
     <span class="topic-terminal-count"><strong>${Number(items.length).toLocaleString('fa-IR')}</strong><small>خبر</small></span>
     <span class="topic-terminal-arrow" aria-hidden="true">←</span>
   </a>`;
 }).join('');
 const magazineCard=(a,i)=>card(a,db).replace('class="card tilt"','class="card tilt magazine-card magazine-card-'+(i+1)+'"');
 const followupHomeMarkup=`<section class="wrap fu-home" aria-label="پیگیری تا نتیجه">
   <div class="fu-home-head">
     <div><span class="eyebrow">FOLLOW-UP / NABEZ SARDO</span><h2>قول دادند؛ چی شد؟</h2><p>وعده‌ها، پروژه‌ها و مسائل عمومی را از زمان اعلام تا نتیجه، مرحله‌به‌مرحله دنبال می‌کنیم.</p></div>
     <div class="fu-home-stats"><span><b>${followupOpen.toLocaleString('fa-IR')}</b><small>در حال پیگیری</small></span><span><b>${followupDone.toLocaleString('fa-IR')}</b><small>به نتیجه رسیده</small></span></div>
   </div>
   ${followups.length?`<div class="fu-home-grid">${followups.slice(0,3).map(x=>followupCard(x,true)).join('')}</div>`:`<div class="fu-empty-home"><div><b>پیگیری تا نتیجه آماده است</b><p>هنوز پرونده‌ای ثبت نشده؛ نخستین موضوع پس از ثبت در تحریریه اینجا نمایش داده می‌شود.</p></div></div>`}
   <div class="fu-home-action"><a class="btn ghost" href="/follow-up">مشاهده همه پرونده‌ها ←</a></div>
 </section>`;
 return shell('اخبار ساردو، ساردوئیه، جیرفت، عنبرآباد، کهنوج و جنوب کرمان | نبض ساردو',`${header(db)}
 <main class="home-glass"><section class="ns-hero-final">
  <div class="ns-hero-final__media">
    <img class="ns-hero-final__image" src="https://d2ol7oe51mr4n9.cloudfront.net/user_32MkkZvMhQKFjHMKrhiL97UtBqA/03895380-5279-4699-9bf8-671489cf2a89.jpg?v=four-seasons-final-1" alt="مسجد ساردوئیه" fetchpriority="high" decoding="async" loading="eager" referrerpolicy="no-referrer">
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
 <section class="breaking ${liveDeskOn?'live-desk-on':'live-desk-off'}" data-live-desk="${liveDeskOn?'on':'off'}"><div class="wrap breaking-row">
   <b class="breaking-label"><span class="breaking-label-dot" aria-hidden="true"></span><span>نبض فوری</span><svg class="breaking-label-pulse" viewBox="0 0 54 20" aria-hidden="true"><path d="M2 11h12l4-5 5 10 6-15 6 15 5-8 5 3h7" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg></b>
   <div class="breaking-marquee" aria-label="نوار خبر فوری">
     <div class="breaking-track">
       <div class="breaking-loop-set"><span class="breaking-item lang-fa">${e(breakingFa)}</span><span class="breaking-item lang-en">${e(breakingEn)}</span><span class="breaking-sep">◆</span></div>
       <div class="breaking-loop-set" aria-hidden="true"><span class="breaking-item lang-fa">${e(breakingFa)}</span><span class="breaking-item lang-en">${e(breakingEn)}</span><span class="breaking-sep">◆</span></div>
     </div>
   </div>
   <i class="breaking-live ${liveDeskOn?'':'breaking-live-off'}"><span class="breaking-live-dot" aria-hidden="true"></span><span>${liveDeskOn?'LIVE DESK':'DESK OFF'}</span></i>
 </div></section>
 <a class="n60-launch" href="/nabez60" aria-label="باز کردن نبض ۶۰"><span class="n60-launch-dot"></span><b>نبض ۶۰</b><small>۵ خبر در یک دقیقه</small></a>

 <section class="wrap frontpage-desk" aria-label="مهم‌ترین خبرها">
   <div class="sectionhead frontpage-head"><div><span class="eyebrow">TOP STORIES / NEWS DESK</span><h2><span class="lang-fa">تیترهای مهم</span><span class="lang-en">Top Stories</span></h2></div><a class="more" href="/all-news"><span class="lang-fa">همه خبرها</span><span class="lang-en">All News</span></a></div>
   <div class="frontpage-grid">
     ${leadMarkup}
     <aside class="front-briefs" aria-label="خبرهای مهم">${highlightsMarkup||'<div class="empty">خبر دیگری منتشر نشده است.</div>'}</aside>
   </div>
 </section>
 ${shortNews.length?`<section class="wrap home-short-news-section" aria-label="خبر کوتاه">
   <div class="home-short-news-shell">
     <div class="home-short-news-head">
       <div>
         <span class="eyebrow">SHORT NEWS / LIVE FEED</span>
         <h2><span class="lang-fa">خبر کوتاه</span><span class="lang-en">Short News</span></h2>
         <p><span class="lang-fa">خبرهای کوتاه، مرتب‌شده بر اساس تازه‌ترین تاریخ و ساعت انتشار.</span><span class="lang-en">Short updates ordered by latest publication date and time.</span></p>
       </div>
       <a class="more" href="/category/short-news"><span class="lang-fa">مشاهده همه خبرهای کوتاه</span><span class="lang-en">View all short news</span></a>
     </div>
     <div class="home-short-news-list">${shortNewsMarkup}</div>
   </div>
 </section>`:''}
 <section class="wrap promo-slot promo-citizen" data-home-banner data-story-title-fa="خبر داری؟ بفرست، هدیه بگیر!" data-story-title-en="Got news? Send it and get a reward!" data-story-text-fa="از اتفاقات منطقه خبر داری؟ عکس یا فیلمی گرفتی؟ خبرت را برای نبض ساردو ثبت کن؛ اگر تأیید و منتشر شود، هدیه نقدی دریافت می‌کنی." data-story-text-en="Seen something newsworthy? Send your photo or video to Nabez Sardo. Approved and published reports can receive a cash reward.">
   <div class="promo-glow" aria-hidden="true"></div>
   <div class="promo-copy">
     <span class="promo-kicker"><span class="lang-fa">خبرنگار مردمی نبض ساردو</span><span class="lang-en">CITIZEN NEWSROOM</span></span>
     <h2><span class="lang-fa">خبر داری؟ بفرست، هدیه بگیر! 🎁</span><span class="lang-en">Got news? Send it and get a reward!</span></h2>
     <p class="citizen-promo-lead"><span class="lang-fa">از اتفاقات منطقه خبر داری؟ عکس یا فیلمی گرفتی؟</span><span class="lang-en">Seen something newsworthy in the area? Got a photo or video?</span></p>
     <p class="citizen-promo-text"><span class="lang-fa">خبرت را در چند ثانیه برای نبض ساردو ثبت کن، عکس یا ویدئو را آپلود کن و شماره کارتت را هم وارد کن.</span><span class="lang-en">Submit your report to Nabez Sardo in seconds, upload a photo or video, and enter your card number.</span></p>
     <p class="citizen-promo-text"><span class="lang-fa">اگر خبرت تأیید و منتشر شود، به پاس همراهی‌ات یک هدیه نقدی از طرف نبض ساردو دریافت می‌کنی.</span><span class="lang-en">If your report is approved and published, you can receive a cash gift from Nabez Sardo.</span></p>
     <div class="citizen-promo-foot">
       <span class="citizen-promo-note"><span class="lang-fa">تو می‌تونی خبرنگار شهر خودت باشی؛ ببین، ثبت کن، بفرست و هدیه بگیر.</span><span class="lang-en">Be the reporter in your city: see it, record it, send it, get rewarded.</span></span>
       <a class="citizen-promo-cta" href="/send-news">
         <span class="citizen-promo-cta-icon" aria-hidden="true">↗</span>
         <span class="lang-fa">خبرتو بفرست و هدیه بگیر</span><span class="lang-en">Send your news & get rewarded</span>
       </a>
     </div>
   </div>
   <div class="promo-visual citizen-promo-visual" aria-hidden="true">
     <div class="citizen-orbit citizen-orbit-a"></div>
     <div class="citizen-orbit citizen-orbit-b"></div>
     <div class="citizen-device">
       <div class="citizen-device-top"><i></i><span>NABEZ SARDO</span></div>
       <div class="citizen-device-screen">
         <div class="citizen-upload-cloud">
           <svg viewBox="0 0 64 64" aria-hidden="true">
             <path d="M20 45h27a10 10 0 0 0 1-20 17 17 0 0 0-32-3A12 12 0 0 0 20 45Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
             <path d="M32 39V24m0 0-6 6m6-6 6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
         </div>
         <div class="citizen-media-row"><span>PHOTO</span><span>VIDEO</span></div>
       </div>
     </div>
     <div class="citizen-gift">
       <span class="gift-lid"></span><span class="gift-box"></span><span class="gift-ribbon"></span><i></i>
     </div>
     <div class="citizen-cash-chip"><b>هدیه نقدی</b><span>پس از تأیید و انتشار</span></div>
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
  <section class="wrap topic-terminal-section" aria-label="دسته‌بندی‌های خبری">
   <div class="topic-terminal-shell">
     <div class="topic-terminal-head">
       <div>
         <span class="topic-terminal-kicker"><i></i> TOPIC TERMINAL</span>
         <h2><span class="lang-fa">دسته‌بندی‌های زنده</span><span class="lang-en">Live Topics</span></h2>
         <p><span class="lang-fa">آخرین تیتر هر حوزه را یک‌جا ببینید.</span><span class="lang-en">See the latest headline from each desk.</span></p>
       </div>
       <div class="topic-terminal-live"><span></span><b>LIVE</b><small>${allNews.length.toLocaleString('fa-IR')} خبر منتشرشده</small></div>
     </div>
     <div class="topic-terminal-screen">
       <div class="topic-terminal-chrome"><span></span><span></span><span></span><b>NABEZ-SARDO / TOPICS</b></div>
       <div class="topic-terminal-list">${categoryTerminalMarkup}</div>
       <div class="topic-terminal-prompt"><span>nabez@newsroom:~$</span><b>scan topics</b><i></i></div>
     </div>
   </div>
 </section>
 ${todayPulse.length?`<section class="wrap today-pulse-section" aria-label="نبض امروز">
   <div class="today-pulse-shell">
     <div class="today-pulse-intro">
       <span class="today-pulse-kicker"><i aria-hidden="true"></i><span class="lang-fa">LIVE NEWSROOM</span><span class="lang-en">LIVE NEWSROOM</span></span>
       <h2><span class="lang-fa">نبض امروز</span><span class="lang-en">Today's Pulse</span></h2>
       <p><span class="lang-fa">پنج خبر تازه‌ای که امروز باید در جریانشان باشید.</span><span class="lang-en">Five fresh stories to keep on your radar today.</span></p>
       <div class="today-pulse-clock"><span class="today-pulse-clock-dot" aria-hidden="true"></span><span class="lang-fa">به‌روزرسانی زنده</span><span class="lang-en">Live update</span><b data-live-clock></b></div>
       <svg class="today-pulse-signature" viewBox="0 0 260 54" aria-hidden="true"><path d="M4 29h54l12-10 13 25 17-41 18 42 17-28 16 12h105" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
     </div>
     <div class="today-pulse-timeline">${todayPulseMarkup}</div>
   </div>
 </section>`:''}
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
 ${followupHomeMarkup}
 <section id="latest" class="wrap section latest-section"><div class="sectionhead"><div><span class="eyebrow">LATEST / NEWSROOM</span><h2>آخرین اخبار</h2></div><a class="more" href="/all-news">آرشیو کامل</a></div>${latest.length?`<div class="grid news latest-grid">${latest.map((a,i)=>magazineCard(a,i)).join('')}</div>`:`<div class="empty"><h3>هنوز خبری منتشر نشده است</h3><p>از پنل تحریریه اولین خبر را منتشر کنید.</p></div>`}</section>
 ${popular.length?`<section class="wrap section popular-section"><div class="sectionhead"><div><span class="eyebrow">MOST READ / NABEZ SARDO</span><h2><span class="lang-fa">پربازدیدترین خبرها</span><span class="lang-en">Most Read</span></h2></div><a class="more" href="/all-news"><span class="lang-fa">آرشیو کامل</span><span class="lang-en">Full Archive</span></a></div><div class="popular-list">${popularMarkup}</div></section>`:''}
 <section class="focus"><div class="wrap focusgrid"><div><span class="eyebrow">SARDOUIYEH FOCUS</span><h2>ساردوئیه در کانون</h2><p>روایت مسائل واقعی مردم، ظرفیت‌های منطقه، کشاورزی، گردشگری، آموزش، فرهنگ و ورزش.</p><a class="btn ghost" href="/all-news">ورود به آرشیو</a></div><div class="topics">${[['01','سیاسی'],['02','کشاورزی'],['03','فرهنگ و ورزش'],['04','گردشگری']].map(x=>`<div class="topic tilt"><small>${x[0]}</small><h3>${x[1]}</h3><p>خبرها و گزارش‌های منتخب این حوزه.</p></div>`).join('')}</div></div></section>
 <section class="wrap citizen"><div class="citizen-copy"><span class="eyebrow">CITIZEN NEWSROOM</span><h2>شما هم خبرنگار نبض ساردو باشید</h2><p>خبر، عکس، ویدئو یا سوژه محلی را برای تحریریه ارسال کنید.</p></div><a class="btn primary" href="/send-news">خبرتو بفرست و هدیه بگیر</a></section></main>${footer()}`, 'نبض ساردو؛ تازه‌ترین اخبار ساردو و ساردوئیه، جیرفت، عنبرآباد، کهنوج و جنوب کرمان',{canonical:'/',schema:siteSchema(),preloadImage:'https://d2ol7oe51mr4n9.cloudfront.net/user_32MkkZvMhQKFjHMKrhiL97UtBqA/03895380-5279-4699-9bf8-671489cf2a89.jpg?v=four-seasons-final-1',preconnect:'https://d2ol7oe51mr4n9.cloudfront.net'});}

function nabez60(db){
  const list=published(db).filter(a=>a.categoryId!=='short-news').slice(0,5);
  const slides=list.map((a,i)=>{
    const c=db.categories.find(x=>x.id===a.categoryId);
    const url='/news/'+encodeURIComponent(a.slug);
    const image=a.image||'/assets/placeholder.svg';
    const lead=compactText(a.lead||a.body||'',155);
    return `<section class="n60-slide ${i===0?'is-active':''}" data-n60-slide data-index="${i}" aria-hidden="${i===0?'false':'true'}">
      <img class="n60-bg" src="${e(image)}" alt="" aria-hidden="true">
      <div class="n60-vignette" aria-hidden="true"></div>
      <article class="n60-glass-card" data-cat-tone="${e(categoryTone(c))}">
        <div class="n60-media"><img src="${e(image)}" alt="${e(a.title)}" loading="${i===0?'eager':'lazy'}" decoding="async"></div>
        <div class="n60-copy">
          <div class="n60-meta"><span>${String(i+1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}</span><b>${e(c?.name||'خبر')}</b><time class="news-date" data-news-date="${e(a.publishedAt||a.createdAt||'')}"></time></div>
          <h2>${e(a.title)}</h2>
          <p>${e(lead)}</p>
          <div class="n60-actions"><a href="${url}" class="n60-read">خبر کامل ←</a><span>◉ ${Number(a.views||0).toLocaleString('fa-IR')}</span></div>
        </div>
      </article>
    </section>`;
  }).join('');
  const progress=list.map((_,i)=>`<span class="n60-progress-seg ${i===0?'is-current':''}" data-n60-progress><i></i></span>`).join('');
  const body=`<main class="n60-page" data-n60-root>
    <div class="n60-top">
      <a class="n60-back" href="/" aria-label="بازگشت به صفحه اصلی">×</a>
      <div class="n60-brand"><b>نبض ۶۰</b><small>۵ خبر مهم در کمتر از یک دقیقه</small></div>
      <button class="n60-pause" type="button" data-n60-pause aria-label="توقف پخش">Ⅱ</button>
    </div>
    <div class="n60-progress" aria-hidden="true">${progress}</div>
    <div class="n60-hold-state" aria-hidden="true"><span>Ⅱ</span><b>توقف</b></div>
    <div class="n60-stage">
      ${slides||'<div class="n60-empty">هنوز خبری برای نبض ۶۰ وجود ندارد.</div>'}
    </div>
    ${list.length?'<button class="n60-nav n60-prev" type="button" data-n60-prev aria-label="خبر قبلی">↑</button><button class="n60-nav n60-next" type="button" data-n60-next aria-label="خبر بعدی">↓</button>':''}
    <div class="n60-hint">بالا یا پایین بکشید · پخش خودکار</div>
  </main>`;
  return shell('نبض ۶۰ | نبض ساردو',body,'پنج خبر مهم نبض ساردو در یک تجربه سریع و تمام‌صفحه',{canonical:'/nabez60'});
}

function followup(db){
  const list=followupSorted(db);
  const open=list.filter(x=>!['completed','closed'].includes(followupEffectiveStatus(x))).length;
  const completed=list.filter(x=>followupEffectiveStatus(x)==='completed').length;
  const overdue=list.filter(x=>followupEffectiveStatus(x)==='overdue').length;
  const body=`${header(db)}<main class="wrap page fu-page">
    <section class="fu-page-hero">
      <span class="eyebrow">FOLLOW-UP DESK / NABEZ SARDO</span>
      <h1>پیگیری تا نتیجه</h1>
      <p>وعده‌ها، پروژه‌ها و مسائل عمومی را بر اساس اطلاعات منتشرشده، بدون قضاوت و با ثبت آخرین وضعیت دنبال می‌کنیم.</p>
      <div class="fu-page-stats">
        <span><b>${list.length.toLocaleString('fa-IR')}</b><small>کل پرونده‌ها</small></span>
        <span><b>${open.toLocaleString('fa-IR')}</b><small>در حال پیگیری</small></span>
        <span><b>${completed.toLocaleString('fa-IR')}</b><small>تکمیل‌شده</small></span>
        <span><b>${overdue.toLocaleString('fa-IR')}</b><small>موعد گذشته</small></span>
      </div>
    </section>
    <div class="fu-method"><b>شیوه نمایش وضعیت</b><p>این صفحه فقط تاریخ، وعده و بروزرسانی‌های ثبت‌شده در تحریریه را نمایش می‌دهد. «موعد گذشته» یعنی تاریخ اعلام‌شده سپری شده و هنوز وضعیت «تکمیل شد» ثبت نشده است.</p></div>
    <section class="fu-list">${list.length?list.map(x=>followupCard(x,false)).join(''):'<div class="empty"><h3>هنوز پرونده‌ای ثبت نشده است</h3><p>با ثبت اولین موضوع در داشبورد تحریریه، پیگیری آن در این صفحه آغاز می‌شود.</p></div>'}</section>
  </main>${footer()}`;
  const schema={'@context':'https://schema.org','@type':'CollectionPage',name:'پیگیری تا نتیجه | نبض ساردو',url:absoluteUrl('/follow-up'),description:'پیگیری مستند وعده‌ها، پروژه‌ها و مسائل عمومی تا نتیجه',inLanguage:'fa-IR'};
  return shell('پیگیری تا نتیجه | نبض ساردو',body,'پیگیری مستند وعده‌ها، پروژه‌ها و مسائل عمومی در نبض ساردو',{canonical:'/follow-up',schema});
}

function briefs(db){
  const c=db.categories.find(x=>x.id==='short-news');
  return c?category(db,c):archive(db);
}
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
  const articleUrl='/news/'+encodeURIComponent(a.slug);
  const shareUrl='/n/'+encodeURIComponent(a.id);
  const shareLead=compactText(a.lead||a.body||a.title,190);
  const desc=compactText(a.lead||a.body||a.title,160);
  const plainBody=String(a.body||a.bodyHtml||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const readMinutes=Math.max(1,Math.ceil((plainBody.split(/\s+/).filter(Boolean).length||1)/180));
  const author=e(a.author||'تحریریه نبض ساردو');
  const locationRaw=trustedArticleLocation(a);
  const location=e(locationRaw);
  const localHay=[locationRaw,a.title,a.lead,a.body].filter(Boolean).join(' ');
  const localTarget=
    /عنبرآباد|عنبر اباد|عنبر آباد/.test(localHay)?{href:'/local/anbarabad',label:'عنبرآباد'}:
    /کهنوج/.test(localHay)?{href:'/local/kahnuj',label:'کهنوج'}:
    /جیرفت/.test(localHay)?{href:'/local/jiroft',label:'جیرفت'}:
    /ساردوئیه|ساردویه|ساردو/.test(localHay)?{href:'/local/sardouiyeh',label:'ساردو و ساردوئیه'}:
    /جنوب کرمان|کرمان جنوبی/.test(localHay)?{href:'/local/south-kerman',label:'جنوب کرمان'}:null;
  const tone=e(categoryTone(c));
  return shell(a.title+' | نبض ساردو',`${header(db)}
  <div class="article-progress" data-cat-tone="${tone}" data-article-progress aria-hidden="true"><i></i></div>
  <main class="wrap article article-premium" data-cat-tone="${tone}">
    <nav class="breadcrumbs article-breadcrumbs" aria-label="مسیر صفحه"><a href="/">خانه</a><span>›</span><a href="${catUrl}"><span class="lang-fa">${e(c?.name||'خبر')}</span><span class="lang-en">${e(catEn(c?.name||'News'))}</span></a></nav>
    <article class="article-shell" data-article-root data-article-title="${e(a.title)}" data-article-url="${e(shareUrl)}" data-article-canonical="${e(articleUrl)}" data-article-image="${e(a.image||'')}" data-article-lead="${e(shareLead)}">
      <header class="article-head">
        <div class="article-topline">
          <a class="article-category-pill" href="${catUrl}"><span class="article-category-dot" aria-hidden="true"></span><span class="lang-fa">${e(c?.name||'خبر')}</span><span class="lang-en">${e(catEn(c?.name||'News'))}</span></a>
          <span class="article-newsroom-mark">NABEZ SARDO / NEWS REPORT</span>
        </div>
        <h1><span class="lang-fa">${e(a.title)}</span><span class="lang-en">${e(a.titleEn||a.title)}</span></h1>
        <p class="lead article-deck"><span class="lang-fa">${e(a.lead||'')}</span><span class="lang-en">${e(a.leadEn||a.lead||'')}</span></p>
        <div class="article-actions">
          <button class="article-action article-share" type="button" data-article-share><span class="article-action-icon" aria-hidden="true">↗</span><span class="lang-fa">اشتراک‌گذاری خبر</span><span class="lang-en">Share story</span></button>
          <button class="article-action article-copy" type="button" data-article-copy><span class="article-action-icon" aria-hidden="true">⧉</span><span data-copy-label><span class="lang-fa">کپی لینک</span><span class="lang-en">Copy link</span></span></button>
          <a class="article-action" href="${catUrl}"><span class="article-action-icon" aria-hidden="true">#</span><span class="lang-fa">خبرهای ${e(c?.name||'این بخش')}</span><span class="lang-en">${e(catEn(c?.name||'News'))} news</span></a>
          ${localTarget?`<a class="article-action article-local-link" href="${localTarget.href}"><span class="article-action-icon" aria-hidden="true">⌖</span><span class="lang-fa">خبرهای بیشتر از ${e(localTarget.label)}</span><span class="lang-en">More local news</span></a>`:''}
        </div>
      </header>
      ${a.image?`<figure class="article-cover-wrap"><div class="cover-frame ${imageOrientation(a)}" data-adaptive-media style="--image-ratio:${imageRatio(a)}"><img class="cover" src="${e(a.image)}" alt="${e(a.title+(locationRaw?' - '+locationRaw:'')+' - نبض ساردو')}" loading="eager" decoding="async" fetchpriority="high"></div><figcaption><span class="lang-fa">تصویر خبر · نبض ساردو</span><span class="lang-en">News image · Nabez Sardo</span></figcaption></figure>`:''}
      ${a.videoUrl?`<figure class="article-video-wrap"><video class="article-video" style="display:block;width:100%;max-height:720px;aspect-ratio:16/9;object-fit:contain;background:#05070a;border:1px solid #2c333e;border-radius:20px;box-shadow:0 18px 45px rgba(0,0,0,.34)" controls playsinline preload="metadata" ${a.image?`poster="${e(a.image)}"`:''}><source src="${e(a.videoUrl)}" type="${e(a.videoType||'video/mp4')}">مرورگر شما امکان پخش این ویدئو را ندارد.</video><figcaption><span class="lang-fa">ویدئوی خبر · نبض ساردو</span><span class="lang-en">News video · Nabez Sardo</span></figcaption></figure>`:''}
      <div class="article-reading-zone">
        <div class="article-reading-label"><span class="article-reading-line" aria-hidden="true"></span><span><span class="lang-fa">متن خبر</span><span class="lang-en">Story</span></span></div>
        <div class="body rich-content article-body"><div class="lang-fa">${body}</div><div class="lang-en">${bodyEn}</div></div>
      </div>
      ${gallery.length?`<section class="article-gallery premium-gallery"><div class="article-gallery-head"><span class="eyebrow">GALLERY</span><h3><span class="lang-fa">گالری تصاویر</span><span class="lang-en">Photo Gallery</span></h3></div><div class="article-gallery-grid">${gallery.map((url,i)=>`<img src="${e(url)}" alt="${e(a.title+(a.location?' - '+a.location:''))} - تصویر ${i+1} - نبض ساردو" loading="lazy" decoding="async" fetchpriority="low">`).join('')}</div></section>`:''}
      <div class="article-endnote"><svg viewBox="0 0 230 42" aria-hidden="true"><path d="M3 23h48l10-8 11 20 14-32 15 33 14-22 13 9h99" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg><div><b><span class="lang-fa">پایان خبر</span><span class="lang-en">End of story</span></b><small>NABEZ SARDO · LOCAL NEWSROOM</small></div></div>
        <div class="article-meta-grid">
          <div class="article-meta-item"><span class="article-meta-icon" aria-hidden="true">✎</span><small><span class="lang-fa">نویسنده</span><span class="lang-en">Author</span></small><b>${author}</b></div>
          ${locationRaw?`<div class="article-meta-item"><span class="article-meta-icon" aria-hidden="true">⌖</span><small><span class="lang-fa">محل خبر</span><span class="lang-en">Location</span></small><b>${location}</b></div>`:''}
          <div class="article-meta-item"><span class="article-meta-icon" aria-hidden="true">◷</span><small><span class="lang-fa">انتشار</span><span class="lang-en">Published</span></small><time class="news-date" data-news-date="${e(a.publishedAt||a.createdAt||'')}"></time></div>
          <div class="article-meta-item"><span class="article-meta-icon" aria-hidden="true">⌛</span><small><span class="lang-fa">زمان مطالعه</span><span class="lang-en">Read time</span></small><b><span class="lang-fa">حدود ${readMinutes.toLocaleString('fa-IR')} دقیقه</span><span class="lang-en">About ${readMinutes} min</span></b></div>
          <div class="article-meta-item"><span class="article-meta-icon" aria-hidden="true">◉</span><small><span class="lang-fa">بازدید</span><span class="lang-en">Views</span></small><b class="article-views">${Number(a.views||0).toLocaleString('fa-IR')}</b></div>
        </div>
    </article>
    ${related.length?`<section class="related-news premium-related"><div class="sectionhead"><div><span class="eyebrow">RELATED / NEWSROOM</span><h2><span class="lang-fa">خبرهای مرتبط</span><span class="lang-en">Related Stories</span></h2></div><a class="more" href="${catUrl}"><span class="lang-fa">همه خبرهای این بخش</span><span class="lang-en">More from this section</span></a></div><div class="grid news">${related.map(x=>card(x,db)).join('')}</div></section>`:''}
  </main>${footer()}`,desc,{canonical:articleUrl,image:a.image||'',preloadImage:a.image||'',ogType:'article',schema:articleSchema(a,c)});
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
function category(db,c){
  const list=published(db).filter(a=>a.categoryId===c.id);
  const canonical='/category/'+encodeURIComponent(c.id);
  const schema=[
    {'@context':'https://schema.org','@type':'CollectionPage',name:'اخبار '+c.name+' | نبض ساردو',url:absoluteUrl(canonical),description:'آخرین اخبار '+c.name+' از ساردو، ساردوئیه، جیرفت، عنبرآباد، کهنوج و جنوب کرمان',inLanguage:'fa-IR',isPartOf:{'@type':'WebSite',name:'نبض ساردو',url:PUBLIC_BASE+'/'}},
    {'@context':'https://schema.org','@type':'ItemList',itemListElement:list.slice(0,30).map((a,i)=>({'@type':'ListItem',position:i+1,url:absoluteUrl('/news/'+encodeURIComponent(a.slug)),name:a.title}))}
  ];
  return shell('اخبار '+c.name+' جنوب کرمان | نبض ساردو',`${header(db)}<main class="wrap page category-page" data-cat-tone="${e(categoryTone(c))}"><span class="eyebrow">CATEGORY</span><h1>${e(c.name)}</h1><div class="grid news">${list.map(a=>card(a,db)).join('')||'<div class="empty">هنوز خبری در این دسته منتشر نشده است.</div>'}</div></main>${footer()}`,'آخرین اخبار '+c.name+' از ساردو، ساردوئیه، جیرفت، عنبرآباد، کهنوج و جنوب کرمان',{canonical,schema});
}
function simple(db,type,ok=false,uploadError=''){let title='',content='';if(type==='about'){title='درباره نبض ساردو';content=`<p class="lead">نبض ساردو رسانه‌ای محلی برای پوشش دقیق، سریع و مسئولانه اخبار ساردو و ساردوئیه، جیرفت، عنبرآباد، کهنوج و جنوب کرمان است.</p><div class="grid info"><div class="panel"><h3>ماموریت</h3><p>خبر محلی قابل اتکا و روایت مسائل واقعی مردم.</p></div><div class="panel"><h3>اصول تحریریه</h3><p>دقت، راستی‌آزمایی، احترام و استقلال.</p></div><div class="panel"><h3>تمرکز منطقه‌ای</h3><p>ساردو و ساردوئیه، جیرفت، عنبرآباد، کهنوج و جنوب کرمان.</p></div></div><nav class="local-hub-links" aria-label="پوشش خبری نبض ساردو"><a href="/local/sardouiyeh">ساردو و ساردوئیه</a><a href="/local/jiroft">جیرفت</a><a href="/local/anbarabad">عنبرآباد</a><a href="/local/kahnuj">کهنوج</a><a href="/local/south-kerman">جنوب کرمان</a></nav>`;}else if(type==='contact'){title='تماس با ما';content=`${ok?'<div class="success">پیام شما ثبت شد.</div>':''}<form class="form" method="post"><label>نام<input name="name" required></label><label>راه ارتباطی<input name="contact" required></label><label>موضوع<input name="subject" required></label><label>پیام<textarea name="message" required></textarea></label><button class="btn primary">ارسال پیام</button></form>`;}else{title='ارسال خبر مردمی';content=`<div class="send-news-gift-box gift-card-box"><span>هدیه خبر مردمی</span><b>در صورت تمایل، شماره کارت خود را وارد کنید تا اگر خبر شما مشمول هدیه شد، مبلغ برایتان واریز شود.</b></div>${ok?'<div class="success">خبر شما همراه فایل برای تحریریه ثبت شد.</div>':''}${uploadError==='large'?'<div class="error">حجم فایل بیشتر از ۵۰ مگابایت است.</div>':uploadError==='type'?'<div class="error">فرمت فایل پشتیبانی نمی‌شود. عکس یا ویدئوی MP4/WebM/MOV انتخاب کنید.</div>':''}<form class="form citizen-form" method="post" enctype="multipart/form-data"><label>نام<input name="name" required></label><label>شماره تماس<input name="phone" required></label><label>محل رویداد<input name="location" required></label><label>عنوان خبر<input name="headline" required></label><label>شرح خبر<textarea name="details" required></textarea></label><label class="citizen-upload">عکس یا ویدئوی خبر<input type="file" name="mediaFile" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" required><small>فایل را مستقیم از گوشی انتخاب و آپلود کنید؛ حداکثر حجم ۵۰ مگابایت.</small></label><label class="reward-card-input">شماره کارت برای دریافت هدیه <small>اختیاری — فقط برای واریز هدیه احتمالی استفاده می‌شود.</small><input name="rewardCard" inputmode="numeric" autocomplete="off" maxlength="24" placeholder="مثلاً 6037 99xx xxxx xxxx"></label><button class="btn primary">ارسال برای تحریریه</button></form>`;}const canonical=type==='about'?'/about':type==='contact'?'/contact':'/send-news';return shell(title+' | نبض ساردو',`${header(db)}<main class="wrap page"><span class="eyebrow">NABEZ SARDO</span><h1>${title}</h1>${content}</main>${footer()}`,title+' | نبض ساردو',{canonical});}
module.exports={home,archive,briefs,article,category,simple,search,localHub,nabez60,followup};