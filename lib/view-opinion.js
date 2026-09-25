const {published}=require('./store');
const {e,shell,header,footer,absoluteUrl}=require('./view-common');

function compact(v='',max=220){
  const s=String(v||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return s.length>max?s.slice(0,max-1).trim()+'…':s;
}

function mediaBlock(a,featured=false){
  if(a.image){
    return `<a class="${featured?'opinion-feature-media':'opinion-card-media'}" href="/news/${encodeURIComponent(a.slug)}"><img src="${e(a.image)}" alt="${e(a.title)}" loading="${featured?'eager':'lazy'}" decoding="async"></a>`;
  }
  return `<a class="${featured?'opinion-feature-media opinion-type-cover':'opinion-card-media opinion-type-cover'}" href="/news/${encodeURIComponent(a.slug)}" aria-label="${e(a.title)}"><span>یادداشت</span><b>نبض ساردو</b></a>`;
}

function opinionPage(db,c){
  const list=published(db).filter(a=>a.categoryId===c.id);
  const lead=list[0]||null;
  const rest=list.slice(1);
  const canonical='/category/opinion';
  const description='یادداشت‌ها، دیدگاه‌ها و مطالبات عمومی در نبض ساردو؛ روایت مسائل محلی و پرسش‌های روشن از مسئولان.';
  const schema=[
    {'@context':'https://schema.org','@type':'CollectionPage',name:'یادداشت و مطالبه',url:absoluteUrl(canonical),description,inLanguage:'fa-IR',isPartOf:{'@type':'WebSite',name:'نبض ساردو',url:absoluteUrl('/')}},
    {'@context':'https://schema.org','@type':'ItemList',itemListElement:list.slice(0,30).map((a,i)=>({'@type':'ListItem',position:i+1,url:absoluteUrl('/news/'+encodeURIComponent(a.slug)),name:a.title}))}
  ];

  const leadMarkup=lead?`<article class="opinion-feature">
    ${mediaBlock(lead,true)}
    <div class="opinion-feature-copy">
      <div class="opinion-meta"><span>تازه‌ترین یادداشت</span><time class="news-date" data-news-date="${e(lead.publishedAt||lead.createdAt||'')}"></time></div>
      <h2><a href="/news/${encodeURIComponent(lead.slug)}">${e(lead.title)}</a></h2>
      <p>${e(compact(lead.lead||lead.body||'',260))}</p>
      <div class="opinion-byline"><b>${e(lead.author||'تحریریه نبض ساردو')}</b><span>${e(lead.location||'جنوب کرمان')}</span></div>
      <a class="opinion-read" href="/news/${encodeURIComponent(lead.slug)}">مطالعه کامل ←</a>
    </div>
  </article>`:`<div class="opinion-empty"><b>هنوز یادداشتی در این بخش منتشر نشده است.</b><span>پس از انتشار نخستین مطلب، این صفحه به‌صورت خودکار به‌روزرسانی می‌شود.</span></div>`;

  const cards=rest.map(a=>`<article class="opinion-card">
    ${mediaBlock(a,false)}
    <div class="opinion-card-copy">
      <div class="opinion-meta"><span>یادداشت / مطالبه</span><time class="news-date" data-news-date="${e(a.publishedAt||a.createdAt||'')}"></time></div>
      <h3><a href="/news/${encodeURIComponent(a.slug)}">${e(a.title)}</a></h3>
      <p>${e(compact(a.lead||a.body||'',150))}</p>
      <div class="opinion-byline"><b>${e(a.author||'تحریریه نبض ساردو')}</b><span>${e(a.location||'')}</span></div>
    </div>
  </article>`).join('');

  const body=`<link rel="stylesheet" href="/assets/opinion-page-v1.css">
  ${header(db)}
  <main class="wrap page opinion-page">
    <section class="opinion-mast">
      <div class="opinion-mast-copy">
        <span class="opinion-kicker">OPINION / PUBLIC ACCOUNTABILITY</span>
        <h1>یادداشت و مطالبه</h1>
        <p>روایت‌ها، نقدها و پرسش‌هایی که از دل جامعه می‌آیند و پاسخ روشن می‌خواهند.</p>
      </div>
      <aside class="opinion-mast-note">
        <span>بخش ویژه نبض ساردو</span>
        <strong>برای یادداشت‌ها، دیدگاه‌ها و مطالبات عمومی</strong>
        <small>مطالب این بخش از خبر روزمره متمایز و با نام نویسنده منتشر می‌شوند.</small>
      </aside>
    </section>

    <section class="opinion-latest" aria-label="تازه‌ترین یادداشت">
      ${leadMarkup}
    </section>

    ${rest.length?`<section class="opinion-archive">
      <div class="opinion-section-head">
        <div><span>ARCHIVE / OPINION</span><h2>دیگر یادداشت‌ها و مطالبات</h2></div>
        <b>${list.length.toLocaleString('fa-IR')} مطلب</b>
      </div>
      <div class="opinion-grid">${cards}</div>
    </section>`:''}
  </main>
  ${footer()}`;

  return shell('یادداشت و مطالبه | نبض ساردو',body,description,{canonical,schema});
}

module.exports=opinionPage;
