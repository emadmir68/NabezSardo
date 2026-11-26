'use strict';
// Pure field adapter; it changes data shape, never the Gemini design.
const CATEGORY_IDS=new Set(['sarduiyeh','agriculture','social','culture','weather','incidents','opinion','politics','sports']);
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
  const body=(text(article.title)+' '+text(article.lead)).slice(0,1000).replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200f\u200e\ufeff]/g,' ');
  const politicsHeadline=/(?:مجلس|انتخابات|دولت|وزیر|سیاسی|سیاست|وزارت خارجه|دیپلماسی|رئیس جمهور|رییس جمهور|سخنگوی|ارتش|موشک|حمله|جنگ|صنعا|ریاض|یمن|اسرائیل|آمریکا|بین الملل)/u;
  const sportsHeadline=/(?:فوتبال|والیبال|کشتی|ورزش|تیم|مسابقه|لیگ|قهرمان|مدال)/u;
  const civicHeadline=/(?:فرماندار|استاندار|بسیج|نماز جمعه|امام جمعه|حجت الاسلام|آیت الله|شهرداری|شورای شهر|خدمات شهری|بیمارستان)/u;
  const roadsHeadline=/(?:راهداری|راه روستایی|آسفالت|راهسازی|راه‌سازی|جاده|حمل‌ونقل|حمل و نقل|زیرساخت)/u;
  if((s==='weather'||s==='city-village')&&politicsHeadline.test(body))return 'politics';
  if((s==='weather'||s==='city-village')&&(roadsHeadline.test(body)||civicHeadline.test(body)))return 'social';
  if(s==='weather'&&sportsHeadline.test(body))return 'sports';
  if(s==='sardouiyeh')return 'sarduiyeh';
  if(CATEGORY_IDS.has(s))return s;
  if(s==='agriculture'||s==='economy')return 'agriculture';
  if(s==='culture'||s==='tourism')return 'culture';
  if(s==='incidents'||s==='roads')return 'incidents';
  if(s==='sports')return 'sports';
  if(s==='weather')return 'weather';
  if(s==='opinion')return 'opinion';
  if(s==='city-village')return 'politics';
  if(s==='social'||s==='kerman'||s==='short-news')return 'social';
  if(politicsHeadline.test(body))return 'politics';
  if(sportsHeadline.test(body))return 'sports';
  if(/کشاورز|اقتصاد|باغ|خرما|بازار|دامدار/.test(body))return 'agriculture';
  if(/هوا|بارش|اقلیم|سرما|دما/.test(body))return 'weather';
  if(/تصادف|حادثه|آتش|امداد/.test(body))return 'incidents';
  if(civicHeadline.test(body)||roadsHeadline.test(body))return 'social';
  return 'sarduiyeh';
}
function region(value=''){
  const s=text(value).toLowerCase();
  if(REGION_IDS.has(s))return s;
  if(/جیرفت|jiroft/.test(s))return 'jiroft';
  if(/عنبرآباد|anbarabad/.test(s))return 'anbarabad';
  if(/کهنوج|kahnuj/.test(s))return 'kahnuj';
  if(/جنوب کرمان|south-kerman|کرمان/.test(s))return 'south-kerman';
  return 'sarduiyeh';
}
const REGION_FA={sarduiyeh:'ساردوئیه',jiroft:'جیرفت',anbarabad:'عنبرآباد',kahnuj:'کهنوج','south-kerman':'جنوب کرمان'};
const CATEGORY_LEGACY={sarduiyeh:'sardouiyeh',agriculture:'agriculture',social:'social',culture:'culture',weather:'weather',incidents:'incidents',opinion:'opinion',politics:'city-village',sports:'sports'};
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
function editorialLead(a,paragraphsFa){
  const title=text(a.title,500).replace(/\s+/g,' ').trim();
  let lead=text(a.lead,1800).trim();
  if(title&&lead.startsWith(title))lead=lead.slice(title.length).replace(/^[\s،,:؛.!؟—–-]+/u,'').trim();
  if(lead.replace(/\s+/g,' ')===title)lead='';
  if(!lead)lead=(paragraphsFa.find(x=>x&&!x.startsWith(title))||paragraphsFa[0]||'').trim();
  if(title&&lead.startsWith(title))lead=lead.slice(title.length).replace(/^[\s،,:؛.!؟—–-]+/u,'').trim();
  return lead.slice(0,1000);
}
function mapArticle(a={}){
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
  return {
    id:text(a.id,128),slug:text(a.slug||a.id,180),shortCode:compactStoryCode(a.id),
    title:{fa:text(a.title,500),en:text(a.titleEn||a.title,500)},
    deck:{fa:lead,en:text(a.leadEn||lead||en[0]||'',1200)},
    body:{fa:fa.length?fa:[text(a.lead||a.title,500)],en:en.length?en:[text(a.leadEn||a.lead||a.title,500)]},
    category:cat,region:reg,
    author:{fa:text(a.author||'تحریریه نبض ساردو',180),en:text(a.authorEn||'Nabz Sardo Newsroom',180)},
    authorRole:{fa:'تحریریه نبض ساردو',en:'Editorial Desk'},
    coverImage:image(a.image||a.coverImage||''),
    imageCaption:{fa:text(a.imageCaption||'',450),en:text(a.imageCaptionEn||a.imageCaption||'',450)},
    publishedAt:date,readTimeMin:Math.max(1,Math.ceil(wordCount/220)),
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
module.exports={mapArticle,mapCitizen,articleChanges,category,region,image,paragraphs,compactStoryCode,editorialLead};
