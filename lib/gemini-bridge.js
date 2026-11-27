'use strict';
// Editorial bridge adapter between Cloudflare D1 storage and React presentation.
const {presentArticle}=require('./news-presentation');
const CATEGORY_IDS=new Set(['sarduiyeh','agriculture','social','culture','weather','incidents','opinion','politics','sports','short-news']);
const REGION_IDS=new Set(['sarduiyeh','jiroft','anbarabad','kahnuj','south-kerman']);
function text(value,max=100000){return String(value??'').slice(0,max);}
function paragraphs(value){
  let s=text(value);
  s=s.replace(/<(?:script|style)[\s\S]*?<\/(?:script|style)>/gi,'');
  s=s.replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi,'\n\n').replace(/<br\s*\/?>/gi,'\n');
  s=s.replace(/<[^>]*>/g,'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"');
  return s.split(/\n{2,}/).map(v=>v.replace(/\s+/g,' ').trim()).filter(Boolean);
}
function category(id,article={}){
  const s=text(id).toLowerCase();
  const body=(text(article.title)+' '+text(article.lead)+' '+text(article.body)).slice(0,1200).replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200f\u200e\ufeff]/g,' ');
  const weatherHeadline=/(?:هواشناسی|آب و هوا|بارش|باران|برف|تگرگ|دما|سرما|گرما|گرد و خاک|ریزگرد|وزش باد|هشدار (?:سطح )?(?:زرد|نارنجی|قرمز|جوی))/u;
  const incidentsHeadline=/(?:تصادف|واژگونی|سانحه|آتش ?سوزی|حریق|انفجار|غرق|سقوط|مصدوم|جان ?باخت|فوتی|امداد و نجات|هلال احمر|تخلفات حادثه ?ساز|پلیس راه|قتل|دستگیری|کشف مواد)/u;
  const politicsHeadline=/(?:مجلس|انتخابات|دولت|وزیر|سیاسی|سیاست|وزارت خارجه|دیپلماسی|رئیس جمهور|رییس جمهور|سخنگوی|ارتش|موشک|حمله|جنگ|صنعا|ریاض|یمن|اسرائیل|آمریکا|بین الملل)/u;
  const sportsHeadline=/(?:فوتبال|فوتسال|والیبال|بسکتبال|کشتی|کاراته|کاتا|دوومیدانی|ورزش|تیم ملی|مسابق(?:ه|ات)|لیگ|قهرمان|مدال|بازی ?های آسیایی)/u;
  const agricultureHeadline=/(?:کشاورز|کشاورزی|خرما|مرکبات|پیاز|گندم|گلخانه|باغدار|جهاد کشاورزی|آفت|دامدار|برداشت محصول)/u;
  const civicHeadline=/(?:قطعی آب|افت فشار آب|آبفای|راهداری|راه روستایی|آسفالت|راهسازی|جاده|حمل و نقل|زیرساخت|فرماندار|استاندار|بسیج|نماز جمعه|امام جمعه|حجت الاسلام|آیت الله|شهرداری|شورای شهر|خدمات شهری|بیمارستان|بورس نخبگان|کنکور)/u;
  if((s==='weather'&&!weatherHeadline.test(body))||(s==='sports'&&!sportsHeadline.test(body))||(s==='incidents'&&!incidentsHeadline.test(body))||(s==='culture'&&agricultureHeadline.test(body))){
    if(incidentsHeadline.test(body))return 'incidents';
    if(agricultureHeadline.test(body))return 'agriculture';
    if(politicsHeadline.test(body))return 'politics';
    if(sportsHeadline.test(body))return 'sports';
    return 'social';
  }
  if(s==='city-village'){
    if(weatherHeadline.test(body))return 'weather';
    if(incidentsHeadline.test(body))return 'incidents';
    if(sportsHeadline.test(body))return 'sports';
    if(agricultureHeadline.test(body))return 'agriculture';
    if(civicHeadline.test(body)&&!politicsHeadline.test(body))return 'social';
    if(politicsHeadline.test(body))return 'politics';
    return 'social';
  }
  if(s==='sardouiyeh')return 'sarduiyeh';
  if(s==='short-news')return 'short-news';
  if(CATEGORY_IDS.has(s))return s;
  if(s==='agriculture'||s==='economy')return 'agriculture';
  if(s==='culture'||s==='tourism')return 'culture';
  if(s==='incidents'||s==='roads')return 'incidents';
  if(s==='sports')return 'sports';
  if(s==='weather')return 'weather';
  if(s==='opinion')return 'opinion';
  if(s==='social'||s==='kerman')return 'social';
  if(politicsHeadline.test(body))return 'politics';
  if(sportsHeadline.test(body))return 'sports';
  if(agricultureHeadline.test(body))return 'agriculture';
  if(weatherHeadline.test(body))return 'weather';
  if(incidentsHeadline.test(body))return 'incidents';
  if(civicHeadline.test(body))return 'social';
  return 'sarduiyeh';
}
function region(value=''){
  const s=text(value).toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک');
  if(REGION_IDS.has(s))return s;
  if(/جیرفت|jiroft/.test(s))return 'jiroft';
  if(/عنبرآباد|عنبر آباد|anbarabad/.test(s))return 'anbarabad';
  if(/کهنوج|kahnuj/.test(s))return 'kahnuj';
  if(/ساردوئیه|ساردو|دلفارد|بحرآسمان|sarduiyeh|sardouiyeh/.test(s))return 'sarduiyeh';
  return 'south-kerman';
}
const REGION_FA={sarduiyeh:'ساردوئیه',jiroft:'جیرفت',anbarabad:'عنبرآباد',kahnuj:'کهنوج','south-kerman':'جنوب کرمان'};
const CATEGORY_LEGACY={sarduiyeh:'sardouiyeh',agriculture:'agriculture',social:'social',culture:'culture',weather:'weather',incidents:'incidents',opinion:'opinion',politics:'city-village',sports:'sports','short-news':'short-news'};
function image(value=''){
  const s=text(value,12000).trim();
  return /^(\/(uploads|assets|src\/assets\/images|news-cover|header-|hero-)|https?:\/\/)/i.test(s)?s:'';
}
function compactStoryCode(value=''){
  const input=text(value,128).trim();
  const hex=input.replace(/-/g,'').toLowerCase();
  if(/^[0-9a-f]{32}$/.test(hex))return BigInt('0x'+hex).toString(36).padStart(25,'0');
  let a=0x811c9dc5>>>0,b=0x9e3779b9>>>0;
  for(let i=0;i<input.length;i++){
    const c=input.charCodeAt(i);
    a=Math.imul((a^c)>>>0,0x01000193)>>>0;
    b=Math.imul((b^(c+((i+1)*131)))>>>0,0x85ebca6b)>>>0;
  }
  return (a.toString(36).padStart(7,'0')+b.toString(36).padStart(7,'0')).slice(0,12);
}
function normCmp(v=''){
  return String(v||'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200f\u200e\ufeff]/g,' ').replace(/\s+/g,' ').trim();
}
function editorialLead(a,paragraphsFa){
  const title=normCmp(text(a.title,500));
  let lead=text(a.lead,1800).trim();
  const leadNorm=normCmp(lead);
  if(title&&leadNorm.startsWith(title)){
    const stripped=lead.slice(title.length).replace(/^[\s،,:؛.!؟—–-]+/u,'').trim();
    lead=normCmp(stripped)===title?'':stripped;
  }
  if(normCmp(lead)===title)lead='';
  if(!lead){
    const candidate=(paragraphsFa.find(x=>x&&!normCmp(x).startsWith(title))||paragraphsFa[0]||'').trim();
    lead=normCmp(candidate)===title?'':candidate;
  }
  if(title&&normCmp(lead).startsWith(title)){
    lead=lead.slice(title.length).replace(/^[\s،,:؛.!؟—–-]+/u,'').trim();
  }
  return normCmp(lead)===title?'':lead.slice(0,1000);
}
function mapArticle(raw={},opts={}){
  const a=presentArticle(raw)||raw;
  const fa=paragraphs(a.bodyHtml||a.body||a.lead);
  const en=paragraphs(a.bodyEn||a.leadEn||a.bodyHtml||a.body||a.lead);
  let cat=category(a.categoryId,a);
  // High-confidence correction for misclassified legacy reporting.
  const newsTitle=text(a.title,500);
  if(cat==='weather'&&/(?:نماز\s+جمعه|خطبه|حجت.?الاسلام|فرماندار|بسیج|آیت.?الله|استاندار)/u.test(newsTitle))cat='social';
  if(cat==='agriculture'&&/(?:تصادف|سانحه|آتش.?سوزی|حادثه\s+جاده)/u.test(newsTitle))cat='incidents';
  const reg=region(a.region||a.location||'');
  const date=text(a.publishedAt||a.createdAt||a.updatedAt||'1970-01-01T00:00:00.000Z',60);
  const wordCount=fa.join(' ').split(/\s+/).filter(Boolean).length;
  const lead=editorialLead(a,fa);
  const gallery=Array.isArray(a.gallery)?a.gallery.map(x=>image(x)).filter(Boolean).slice(0,12):[];
  const bodyFa=opts.summary?[]:(fa.length?fa:[text(a.lead||a.title,500)]);
  const bodyEn=opts.summary?[]:(en.length?en:[text(a.leadEn||a.lead||a.title,500)]);
  return {
    id:text(a.id,128),slug:text(a.slug||a.id,180),shortCode:compactStoryCode(a.id),
    title:{fa:text(a.title,500),en:text(a.titleEn||a.title,500)},
    kicker:a.kicker?text(a.kicker,160):undefined,
    deck:{fa:lead,en:text(a.leadEn||lead||en[0]||'',1200)},
    body:{fa:bodyFa,en:bodyEn},
    category:cat,region:reg,
    locationLabel:text(a.location||REGION_FA[reg]||'',120),
    author:{fa:text(a.author||'تحریریه نبض ساردو',180),en:text(a.authorEn||'Nabz Sardo Newsroom',180)},
    authorRole:{fa:'تحریریه نبض ساردو',en:'Editorial Desk'},
    coverImage:image(a.image||a.coverImage||''),
    videoUrl:image(a.videoUrl||''),
    videoType:a.videoUrl?text(a.videoType||'video/mp4',40):'',
    gallery,
    imageCaption:{fa:text(a.imageCaption||'',450),en:text(a.imageCaptionEn||a.imageCaption||'',450)},
    publishedAt:date,
    updatedAt:a.updatedAt?text(a.updatedAt,60):undefined,
    readTimeMin:Math.max(1,Math.ceil(wordCount/220)),
    views:Math.max(0,Number(a.views)||0),
    status:a.status==='published'?'published':'draft',
    featuredInHero:!!(a.featuredInHero||a.featured),
    isBreaking:!!(a.isBreaking||a.breaking),
  };
}
function mapCitizen(c={}){
  return {
    id:text(c.id,128),title:text(c.headline||c.title||'',200),
    description:text(c.details||c.description||'',8000),
    region:region(c.location||c.region||''),
    category:category(c.categoryId||c.category||'',c),
    reporterName:text(c.name||c.reporterName||'',120),
    contact:text(c.phone||c.contact||'',160),
    imageDataUrl:image(c.mediaUrl||''),
    submittedAt:text(c.createdAt||c.submittedAt||'',60),
    status:['pending','approved','archived'].includes(c.geminiStatus)?c.geminiStatus:'pending'
  };
}
function escapeHtml(v){return text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function articleChanges(g={}){
  const b=g.body||{};
  return {
    title:text(g.title?.fa||g.title?.en||'',500).trim(),
    titleEn:text(g.title?.en||'',500).trim(),
    lead:text(g.deck?.fa||'',1800).trim(),
    leadEn:text(g.deck?.en||'',1800).trim(),
    body: (Array.isArray(b.fa)?b.fa:[]).map(v=>text(v,15000)).join('\n\n').slice(0,120000),
    bodyHtml:(Array.isArray(b.fa)?b.fa:[]).map(p=>'<p>'+escapeHtml(p)+'</p>').join('').slice(0,150000),
    bodyEn:(Array.isArray(b.en)?b.en:[]).map(v=>text(v,15000)).join('\n\n').slice(0,120000),
    categoryId:CATEGORY_LEGACY[g.category]||'sardouiyeh',
    location:REGION_FA[g.region]||'ساردوئیه',
    author:text(g.author?.fa||'تحریریه نبض ساردو',180),
    imageCaption:text(g.imageCaption?.fa||'',450),
    status:g.status==='published'?'published':'draft',
    featured:!!g.featuredInHero,
    isBreaking:!!g.isBreaking
  };
}
function siteConfig(db={},turnstileSiteKey=''){
  const settings=db.settings||{};
  const nowMs=Date.now();
  const updated=Date.parse(settings.breakingUpdatedAt||'');
  const freshCustom=Boolean(String(settings.breakingText||'').trim())&&Number.isFinite(updated)&&updated<=nowMs+5*60*1000&&nowMs-updated<=24*60*60*1000;
  let breaking={
    enabled:settings.liveDeskEnabled!==false,
    kind:'desk',
    label:'نبض خبر',
    textFa:'در حال حاضر خبر فوری تازه‌ای ثبت نشده است.',
    textEn:'No recent breaking update is available right now.',
    marker:'NEWS DESK',
    updatedAt:settings.breakingUpdatedAt||''
  };
  if(settings.liveDeskEnabled===false){
    breaking={...breaking,kind:'off',label:'نبض خبر',textFa:'در حال حاضر خبر فوری فعالی ثبت نشده است.',textEn:'There is no active breaking news at the moment.',marker:'DESK OFF'};
  }else if(freshCustom){
    const {deskPresentation}=require('./news-presentation');
    const desk=deskPresentation(settings);
    breaking={...breaking,kind:desk.kind,label:desk.label,textFa:desk.textFa,textEn:desk.textEn,marker:desk.marker};
  }
  return {
    ok:true,
    turnstileSiteKey:text(turnstileSiteKey,256),
    siteName:{fa:text(settings.siteName||'نبض ساردو',120),en:text(settings.siteNameEn||'Nabz Sardo',120)},
    tagline:{fa:text(settings.tagline||'رسانه مستقل خبری و تحلیلی جنوب کرمان',200),en:text(settings.taglineEn||'Independent Newsroom of Sardouiyeh & South Kerman',200)},
    contactEmail:text(settings.contactEmail||'info@nabzesardo.ir',180),
    editorialPhone:text(settings.editorialPhone||'034-43210000',80),
    liveDeskEnabled:settings.liveDeskEnabled!==false,
    breaking,
    ad:{
      enabled:settings.adEnabled!==false&&Boolean(settings.adTitle||settings.adText||settings.adImage),
      title:text(settings.adTitle||'',120),
      titleEn:text(settings.adTitleEn||'',120),
      text:text(settings.adText||'',300),
      textEn:text(settings.adTextEn||'',300),
      link:text(settings.adLink||'/contact',500),
      image:image(settings.adImage||'')
    }
  };
}
module.exports={mapArticle,mapCitizen,articleChanges,siteConfig,category,region,image,paragraphs,compactStoryCode,editorialLead};
