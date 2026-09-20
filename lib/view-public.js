const {published}=require('./store');
const {e,shell,header,footer,card,oldBody,imageRatio,imageOrientation,absoluteUrl,PUBLIC_BASE}=require('./view-common');

function compactText(v='',max=160){
  const s=String(v||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return s.length>max?s.slice(0,max-1).trim()+'…':s;
}
function siteSchema(){
  return [
    {'@context':'https://schema.org','@type':'WebSite',name:'نبض ساردو',alternateName:'Nabez Sardo',url:PUBLIC_BASE+'/',inLanguage:'fa-IR',potentialAction:{'@type':'SearchAction',target:absoluteUrl('/search?q={search_term_string}'),'query-input':'required name=search_term_string'}},
    {'@context':'https://schema.org','@type':'NewsMediaOrganization',name:'نبض ساردو',alternateName:'Nabez Sardo',url:PUBLIC_BASE+'/',description:'رسانه محلی ساردوئیه، جیرفت و جنوب کرمان',areaServed:[{'@type':'Place',name:'ساردوئیه'},{'@type':'Place',name:'جیرفت'},{'@type':'Place',name:'جنوب کرمان'}]}
  ];
}
function articleSchema(a,c){
  const url=absoluteUrl('/news/'+encodeURIComponent(a.slug));
  const authorName=a.author||'تحریریه نبض ساردو';
  const authorType=authorName.includes('تحریریه')?'Organization':'Person';
  const news={'@context':'https://schema.org','@type':'NewsArticle',mainEntityOfPage:{'@type':'WebPage','@id':url},headline:a.title,description:compactText(a.lead||a.body||a.title,220),datePublished:a.publishedAt||a.createdAt,dateModified:a.updatedAt||a.publishedAt||a.createdAt,inLanguage:'fa-IR',isAccessibleForFree:true,articleSection:c?.name||'خبر',keywords:[c?.name,a.location,'ساردوئیه','جیرفت','جنوب کرمان'].filter(Boolean).join(', '),author:{'@type':authorType,name:authorName},publisher:{'@type':'NewsMediaOrganization',name:'نبض ساردو',url:PUBLIC_BASE+'/'},url};
  if(a.image)news.image=[absoluteUrl(a.image)];
  const crumb={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'صفحه اصلی',item:PUBLIC_BASE+'/'},{'@type':'ListItem',position:2,name:c?.name||'خبر',item:absoluteUrl('/category/'+encodeURIComponent(a.categoryId||''))},{'@type':'ListItem',position:3,name:a.title,item:url}]};
  return [news,crumb];
}

function home(db){
 const latest=published(db).slice(0,6);
 return shell('اخبار ساردوئیه، جیرفت و جنوب کرمان | نبض ساردو',`${header(db)}
 <main><section class="hero"><div class="hero-bg"></div><div class="wrap hero-grid"><div class="hero-copy reveal"><span class="chip">3D EDITORIAL · SARDOUIYEH</span><h1>نبضِ ساردوئیه،<br>با یک هویت رسانه‌ای تازه</h1><p>خبر محلی، گزارش میدانی، روایت تصویری و صدای مردم؛ در یک تجربه خبری مدرن و متفاوت.</p><div class="actions"><a class="btn gold" href="#latest">تازه‌ترین خبرها</a><a class="textlink" href="/about">درباره تحریریه</a></div></div><div class="hero-art reveal"><div class="orbit o1"></div><div class="orbit o2"></div><div class="mark3d tilt" aria-hidden="true">ن</div></div></div></section>
 <section class="breaking"><div class="wrap row"><b>نبض فوری</b><span>مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.</span><i>● LIVE DESK</i></div></section>
 <section class="wrap cats">${db.categories.slice(0,7).map(c=>`<a href="/category/${c.id}"><b>✦</b><span>${e(c.name)}</span></a>`).join('')}</section>
 <section id="latest" class="wrap section"><div class="sectionhead"><div><span class="eyebrow">LATEST / NEWSROOM</span><h2>آخرین اخبار</h2></div><a class="more" href="/all-news">آرشیو کامل</a></div>${latest.length?`<div class="grid news">${latest.map(a=>card(a,db)).join('')}</div>`:`<div class="empty"><h3>هنوز خبری منتشر نشده است</h3><p>از پنل تحریریه اولین خبر را منتشر کنید.</p></div>`}</section>
 <section class="focus"><div class="wrap focusgrid"><div><span class="eyebrow">SARDOUIYEH FOCUS</span><h2>ساردوئیه در کانون</h2><p>روایت مسائل واقعی مردم، ظرفیت‌های منطقه، کشاورزی، گردشگری، آموزش، فرهنگ و ورزش.</p><a class="btn ghost" href="/all-news">ورود به آرشیو</a></div><div class="topics">${[['01','شهر و روستا'],['02','کشاورزی'],['03','فرهنگ و ورزش'],['04','گردشگری']].map(x=>`<div class="topic tilt"><small>${x[0]}</small><h3>${x[1]}</h3><p>خبرها و گزارش‌های منتخب این حوزه.</p></div>`).join('')}</div></div></section>
 <section class="wrap citizen"><div><span class="eyebrow">CITIZEN NEWSROOM</span><h2>شما هم خبرنگار نبض ساردو باشید</h2><p>خبر، عکس، ویدئو یا سوژه محلی را برای تحریریه ارسال کنید.</p></div><a class="btn primary" href="/send-news">ارسال خبر</a></section></main>${footer()}`, 'نبض ساردو؛ تازه‌ترین اخبار ساردوئیه، جیرفت و جنوب کرمان',{canonical:'/',schema:siteSchema()});}
function archive(db,q=''){const all=published(db).filter(a=>!q||a.title.includes(q)||a.lead.includes(q));return shell('آخرین اخبار ساردوئیه و جنوب کرمان | نبض ساردو',`${header(db)}<main class="wrap page"><div class="pagehead"><span class="eyebrow">ARCHIVE</span><h1>آرشیو اخبار</h1></div><form class="search" action="/all-news"><input name="q" value="${e(q)}" placeholder="جستجو در خبرها"><button class="btn primary">جستجو</button></form><div class="grid news">${all.map(a=>card(a,db)).join('')||'<div class="empty">خبری پیدا نشد.</div>'}</div></main>${footer()}`,'آرشیو کامل اخبار نبض ساردو',{canonical:'/all-news'});}
function article(db,a){
  const c=db.categories.find(x=>x.id===a.categoryId);
  const body=a.bodyHtml||oldBody(a);
  const gallery=Array.isArray(a.gallery)?a.gallery:[];
  const pub=published(db);
  const same=pub.filter(x=>x.id!==a.id&&x.categoryId===a.categoryId);
  const fallback=pub.filter(x=>x.id!==a.id&&x.categoryId!==a.categoryId);
  const related=[...same,...fallback].slice(0,3);
  const catUrl='/category/'+encodeURIComponent(a.categoryId||'');
  const desc=compactText(a.lead||a.body||a.title,160);
  return shell(a.title+' | نبض ساردو',`${header(db)}<main class="wrap article"><nav class="breadcrumbs" aria-label="مسیر صفحه"><a href="/">خانه</a><span>›</span><a href="${catUrl}">${e(c?.name||'خبر')}</a></nav><article><span class="eyebrow">${e(c?.name||'خبر')}</span><h1>${e(a.title)}</h1><p class="lead">${e(a.lead||'')}</p><div class="meta"><span>${e(a.author||'تحریریه نبض ساردو')}</span><span>${e(a.location||'ساردوئیه')}</span><span>${new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tehran'}).format(new Date(a.publishedAt||a.createdAt))}</span><span class="article-views">◉ ${Number(a.views||0).toLocaleString('fa-IR')} بازدید</span></div>${a.image?`<div class="cover-frame ${imageOrientation(a)}" data-adaptive-media style="--image-ratio:${imageRatio(a)}"><img class="cover" src="${e(a.image)}" alt="${e(a.title)}"></div>`:''}<div class="body rich-content">${body}</div>${gallery.length?`<section class="article-gallery"><h3>گالری تصاویر</h3><div class="article-gallery-grid">${gallery.map((url,i)=>`<img src="${e(url)}" alt="${e(a.title)} - تصویر ${i+1}">`).join('')}</div></section>`:''}</article>${related.length?`<section class="related-news"><div class="sectionhead"><div><span class="eyebrow">RELATED</span><h2>خبرهای مرتبط</h2></div><a class="more" href="${catUrl}">همه خبرهای این بخش</a></div><div class="grid news">${related.map(x=>card(x,db)).join('')}</div></section>`:''}</main>${footer()}`,desc,{canonical:'/news/'+encodeURIComponent(a.slug),image:a.image||'',ogType:'article',schema:articleSchema(a,c)});
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
function category(db,c){const list=published(db).filter(a=>a.categoryId===c.id);return shell('اخبار '+c.name+' | ساردوئیه و جنوب کرمان | نبض ساردو',`${header(db)}<main class="wrap page"><span class="eyebrow">CATEGORY</span><h1>${e(c.name)}</h1><div class="grid news">${list.map(a=>card(a,db)).join('')||'<div class="empty">هنوز خبری در این دسته منتشر نشده است.</div>'}</div></main>${footer()}`,'اخبار '+c.name+' در نبض ساردو',{canonical:'/category/'+encodeURIComponent(c.id)});}
function simple(db,type,ok=false){let title='',content='';if(type==='about'){title='درباره نبض ساردو';content=`<p class="lead">نبض ساردو رسانه‌ای محلی برای پوشش دقیق، سریع و مسئولانه اخبار ساردوئیه و جنوب کرمان است.</p><div class="grid info"><div class="panel"><h3>ماموریت</h3><p>خبر محلی قابل اتکا و روایت مسائل واقعی مردم.</p></div><div class="panel"><h3>اصول تحریریه</h3><p>دقت، راستی‌آزمایی، احترام و استقلال.</p></div><div class="panel"><h3>تمرکز منطقه‌ای</h3><p>ساردوئیه، جیرفت و جنوب کرمان.</p></div></div>`;}else if(type==='contact'){title='تماس با ما';content=`${ok?'<div class="success">پیام شما ثبت شد.</div>':''}<form class="form" method="post"><label>نام<input name="name" required></label><label>راه ارتباطی<input name="contact" required></label><label>موضوع<input name="subject" required></label><label>پیام<textarea name="message" required></textarea></label><button class="btn primary">ارسال پیام</button></form>`;}else{title='ارسال خبر مردمی';content=`${ok?'<div class="success">خبر شما برای تحریریه ثبت شد.</div>':''}<form class="form" method="post"><label>نام<input name="name" required></label><label>شماره تماس<input name="phone" required></label><label>محل رویداد<input name="location" required></label><label>عنوان خبر<input name="headline" required></label><label>شرح خبر<textarea name="details" required></textarea></label><label>لینک عکس یا ویدئو<input name="mediaLink"></label><button class="btn primary">ارسال برای تحریریه</button></form>`;}const canonical=type==='about'?'/about':type==='contact'?'/contact':'/send-news';return shell(title+' | نبض ساردو',`${header(db)}<main class="wrap page"><span class="eyebrow">NABEZ SARDO</span><h1>${title}</h1>${content}</main>${footer()}`,title+' | نبض ساردو',{canonical});}
module.exports={home,archive,article,category,simple,search};