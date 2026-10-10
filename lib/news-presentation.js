// Presentation-only corrections: never edit stored articles or replay publication jobs.
const DESIGNATION_TITLES=new Set(['مدیرکل مدیریت بحران استان کرمان','معاون قضایی دادگستری کرمان']);

function escapeHtml(v=''){
 return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function plainFromHtml(v=''){
 return String(v||'')
  .replace(/<br\s*\/?\s*>/gi,'\n')
  .replace(/<\/p>/gi,'\n\n')
  .replace(/<[^>]+>/g,' ')
  .replace(/&nbsp;/gi,' ')
  .replace(/&amp;/gi,'&')
  .replace(/&lt;/gi,'<')
  .replace(/&gt;/gi,'>')
  .replace(/&#39;/gi,"'")
  .replace(/&quot;/gi,'"');
}
function sourceNameVariants(article={}){
 const raw=String(article.sourceName||'').trim();
 if(!raw)return [];
 const variants=new Set([raw]);
 raw.split(/[—–|]/).map(x=>x.trim()).filter(Boolean).forEach(x=>variants.add(x));
 return [...variants].filter(x=>x.length>=2&&x.length<=120);
}
function stripSourceAttribution(value='',article={}){
 let s=String(value||'');
 s=s
  .replace(/https?:\/\/[^\s<>"']+/gi,' ')
  .replace(/\bwww\.[^\s<>"']+/gi,' ')
  .replace(/(^|\n)\s*(?:منبع|source)\s*[:：-]\s*[^\n]*(?=\n|$)/gim,'$1');

 for(const name of sourceNameVariants(article)){
  const escaped=name.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
  const exact=new RegExp('(?:به\\s+گزارش|به\\s+نقل\\s+از|بر\\s+اساس\\s+گزارش)\\s+(?:(?:خبرگزاری|پایگاه\\s+خبری|سایت|وب[‌ -]?سایت|رسانه)\\s+)?'+escaped+'\\s*[،,:-]?\\s*','gi');
  s=s.replace(exact,'');
  const standalone=new RegExp('(^|\\n)\\s*'+escaped+'\\s*(?=\\n|$)','gi');
  s=s.replace(standalone,'$1');
 }

 s=s.replace(/(^|[.!؟]\s+)(?:به\s+گزارش|به\s+نقل\s+از|بر\s+اساس\s+گزارش)\s+(?:(?:خبرگزاری|پایگاه\s+خبری|سایت|وب[‌ -]?سایت|رسانه)\s+)?[^،\n]{1,90}[،,:]\s*/g,'$1');
 return s
  .replace(/[ \t]+([،,.؛:])/g,'$1')
  .replace(/[ \t]{2,}/g,' ')
  .replace(/\n[ \t]+/g,'\n')
  .replace(/\n{3,}/g,'\n\n')
  .trim();
}
function paragraphsHtml(v=''){
 const text=String(v||'').trim();
 if(!text)return '';
 const parts=text.split(/\n{2,}/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
 return parts.map(p=>'<p>'+escapeHtml(p)+'</p>').join('');
}
function sourceFreeImported(article){
 if(!article||article.imported!==true)return article;
 const body=stripSourceAttribution(article.body||plainFromHtml(article.bodyHtml||''),article);
 const lead=stripSourceAttribution(article.lead||'',article);
 const bodyEn=stripSourceAttribution(article.bodyEn||'',article);
 const leadEn=stripSourceAttribution(article.leadEn||'',article);
 return {
  ...article,
  lead,
  leadEn,
  body,
  bodyEn,
  bodyHtml:paragraphsHtml(body),
  author:'تحریریه نبض ساردو'
 };
}
function presentArticle(article){
 let shown=sourceFreeImported(article);
 const title=String(shown?.title||'').trim().replace(/[：:]$/,'').trim();
 const lead=String(shown?.lead||'').trim();
 if(!DESIGNATION_TITLES.has(title)||!lead||lead.length>200)return shown;
 return {...shown,title:lead,lead:'',kicker:shown.title};
}
function deskPresentation(settings={}){
 if(settings.liveDeskEnabled===false)return {kind:'off',label:'نبض خبر',textFa:'در حال حاضر خبر فوری فعالی ثبت نشده است.',textEn:'There is no active breaking news at the moment.',marker:'DESK OFF'};
 const stored=String(settings.breakingText||'').trim();
 const notice=/تبریک|تسلیت|گرامیداشت|گرامی[‌ ]?باد|بزرگداشت|مبارک/.test(stored);
 const kind=settings.breakingKind==='announcement'||(settings.breakingKind!=='news'&&notice)?'announcement':stored?'breaking':'desk';
 return {kind,label:kind==='announcement'?'اطلاعیه':kind==='breaking'?'نبض فوری':'نبض خبر',
 textFa:stored||'مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.',
 textEn:settings.breakingTextEn||'Top local developments from Sardouiyeh and South Kerman — fast, accurate and local.',
 marker:kind==='announcement'?'NOTICE':kind==='breaking'?'LIVE DESK':'NEWS DESK'};
}
module.exports={presentArticle,deskPresentation,stripSourceAttribution,sourceFreeImported};
