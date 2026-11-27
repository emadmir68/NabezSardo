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
function cleanImportedTypography(value=''){
 let s=String(value||'')
  .replace(/\r/g,'')
  .replace(/[\u200e\u200f\ufeff]/g,'')
  .replace(/[⭕🔴🔵🔹🔷🔸▪◾♦🔻🔺]+/gu,'\n\n')
  .replace(/[\uFE0E\uFE0F\u200D\u20E3]/g,'')
  .replace(/\p{Extended_Pictographic}+/gu,' ')
  .replace(/کشت[‌\s]*و[‌\s]*صنعت/g,'کشت و صنعت')
  .replace(/هیئت[‌\s-]*مدیره/g,'هیئت‌مدیره')
  .replace(/مسئولیت[‌\s-]*های/g,'مسئولیت‌های')
  .replace(/نقش[‌\s-]*آفرینی/g,'نقش‌آفرینی')
  .replace(/به[‌\s-]*ویژه/g,'به‌ویژه')
  .replace(/به[‌\s-]*روز(?=\s|[،؛:,.!?؟]|$)/g,'به‌روز')
  .replace(/[ \t]+([،؛:,.!?؟])/g,'$1')
  .replace(/([،؛:])(?=[^\s\n])/g,'$1 ')
  .replace(/[ \t]{2,}/g,' ')
  .replace(/\n[ \t]+/g,'\n')
  .replace(/[ \t]+\n/g,'\n')
  .replace(/\n{3,}/g,'\n\n')
  .trim();
 return s;
}
const EXTERNAL_MEDIA_DOMAIN_RE=/\b(?:konarsandal|kenarsandal|negahjavan|jirofthalil|mehrnews|tasnimnews|farsnews|yjc|isna|irna|t\.me|telegram\.me)\.(?:ir|com|me)\b[^\s<>"']*/gi;
const KNOWN_SOURCE_NAME_GROUP='(?:(?:خبرگزاری|پایگاه\\s+خبری(?:\\s+تحلیلی)?|کانال(?:\\s+خبری)?|سایت|وب[‌ -]?سایت|رسانه|دوربین)\\s+)?(?:کنار\\s*صندل|کنارصند|نگاه\\s*جوان|جیرفت\\s*هلیل|باشگاه\\s+خبرنگاران(?:\\s+جوان)?|مهر|تسنیم|فارس|ایسنا|ایرنا|آنا|برنا|ایلنا)';

function stripTitleSourceSuffix(value=''){
 // فقط وقتی حذف میشه که بخش آخر واقعاً اسم رسانه یا کانال باشد، نه ادامه‌ی تیتر
 let text=String(value||'')
  .replace(/\s+(?:از\s+قاب\s+دوربین|با\s+دوربین|توسط\s+پایگاه\s+خبری)\s+(?:کنار\s*صندل|کنارصند|نگاه\s*جوان|جیرفت\s*هلیل)\b/gi,'')
  .replace(/\s*(?:^|\s)@[A-Za-z0-9_]{3,}\b/g,'')
  .trim();
 const m=text.match(/^(.*?)\s+[|｜\-–—]\s+([^|｜\-–—]{3,60})$/u);
 if(!m) return text;
 return /(سایت|خبرگزاری|پایگاه|خبری|رسانه|وب|news|کنار\s*صندل|کنارصند|نگاه\s*جوان|جیرفت\s*هلیل|مهر|تسنیم|ایسنا|ایرنا|فارس)/iu.test(m[2]) ? m[1].trim() : text;
}
function stripRepeatedTitlePrefix(body='',title=''){
 let s=cleanImportedTypography(body),t=cleanImportedTypography(title).replace(/[：:]$/,'').trim();
 if(!s||!t||t.length<18)return s;
 const escaped=t.replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');
 const re=new RegExp('^'+escaped+'(?:\\s*[：:]\\s*)?(?:[.!؟]\\s*)?','i');
 if(re.test(s))s=s.replace(re,'').trim();
 return s;
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
  .replace(/https?:\/\/(?!nabzesardo\.ir\b)[^\s<>"']+/gi,' ')
  .replace(/\bwww\.(?!nabzesardo\.ir\b)[^\s<>"']+/gi,' ')
  .replace(/\b(?:https?:\/\/)?(?:t|telegram)\.me\/[^\s<>"']+/gi,' ')
  .replace(EXTERNAL_MEDIA_DOMAIN_RE,' ')
  .replace(/(^|\s)(?:🆔\s*)?@[A-Za-z0-9_]{3,}\b/g,'$1')
  .replace(/(^|\n)\s*(?:منبع|source)\s*[:：-]\s*[^\n]*(?=\n|$)/gim,'$1')
  .replace(/(^|\n)\s*[|｜]?\s*(?:(?:سایت|وب[‌ -]?سایت|پایگاه|کانال|رسانه|خبرگزاری)\s+)?خبری(?:\s+تحلیلی)?\s+[^\n|｜]{2,90}\s*(?=\n|$)/gim,'$1')
  .replace(/(^|\n)\s*[|｜]\s*(?:سایت|وب[‌ -]?سایت|پایگاه|کانال|رسانه|خبرگزاری)[^\n]{2,100}(?=\n|$)/gim,'$1');

 for(const name of sourceNameVariants(article)){
  const escaped=name.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
  const exact=new RegExp('(?:به\\s+گزارش|به\\s+نقل\\s+از|بر\\s+اساس\\s+گزارش|به\\s+روایت|از\\s+قاب\\s+دوربین)\\s+(?:(?:خبرگزاری|پایگاه\\s+خبری|سایت|وب[‌ -]?سایت|کانال(?:\\s+خبری)?|رسانه)\\s+)?'+escaped+'\\s*[،,:-]?\\s*','gi');
  s=s.replace(exact,'');
  const standalone=new RegExp('(^|\\n)\\s*'+escaped+'\\s*(?=\\n|$)','gi');
  s=s.replace(standalone,'$1');
 }

 s=s
  .replace(new RegExp('(^|[.!؟\\n]\\s*|\\s)(?:به\\s+گزارش|به\\s+نقل\\s+از|بر\\s+اساس\\s+گزارش|به\\s+روایت|از\\s+قاب\\s+دوربین)\\s+'+KNOWN_SOURCE_NAME_GROUP+'\\s*[،,:-]?\\s*','giu'),'$1')
  .replace(/(^|[.!؟]\s+)(?:به\s+گزارش|به\s+نقل\s+از|بر\s+اساس\s+گزارش)\s+(?:(?:خبرگزاری|پایگاه\s+خبری|سایت|وب[‌ -]?سایت|رسانه)\s+)?[^،\n]{1,90}[،,:]\s*/g,'$1')
  .replace(/(?:پایگاه\s+خبری(?:\s+تحلیلی)?|کانال\s+خبری|سایت)\s+(?:کنار\s*صندل|کنارصند|نگاه\s*جوان|جیرفت\s*هلیل)/gi,'')
  .replace(/(?:^|\n|\s)(?:🔗\s*)?لینک\s+(?:روبیکا|تلگرام|ایتا|سروش|بله|اینستاگرام|کانال)(?:\s*[:：].*)?(?=\n|$)/giu,'')
  .replace(/\s*[|｜]\s*(?:(?:سایت|وب[‌ -]?سایت|پایگاه|کانال|رسانه|خبرگزاری)\s+)?خبری(?:\s+تحلیلی)?\s+[^|｜\n]{2,90}\s*$/gim,'');
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
function hasExternalSourceArtifact(article={}){
 const blob=[article.title,article.lead,article.body,article.bodyHtml,article.author].filter(Boolean).join(' ');
 return Boolean(
  article.sourceId||article.sourceName||article.sourceUrl||
  /https?:\/\/(?!nabzesardo\.ir\b)|\bwww\.(?!nabzesardo\.ir\b)|(?:t|telegram)\.me\/|@[A-Za-z0-9_]{3,}\b|کنار\s*صند|negahjavan\.ir|konarsandal\.ir|لینک\s+(?:روبیکا|تلگرام|ایتا|سروش|بله|اینستاگرام)|به\s+گزارش\s+(?:پایگاه|خبرگزاری)|^منبع\s*:/im.test(blob)
 );
}
function sourceFreeImported(article){
 if(!article)return article;
 const needsStrip=article.imported===true||hasExternalSourceArtifact(article);
 if(!needsStrip)return article;
 const title=cleanImportedTypography(stripTitleSourceSuffix(article.title||''));
 const rawBody=stripSourceAttribution(article.body||plainFromHtml(article.bodyHtml||''),article);
 const body=stripRepeatedTitlePrefix(rawBody,title);
 let lead=cleanImportedTypography(stripSourceAttribution(article.lead||'',article));
 if(/^(?:[|｜\-–—]\s*)?(?:(?:سایت|وب[‌ -]?سایت|پایگاه|کانال|رسانه|خبرگزاری)\s+)?خبری(?:\s+تحلیلی)?\b/iu.test(lead)&&lead.length<120)lead='';
 const bodyEn=stripSourceAttribution(article.bodyEn||'',article);
 const leadEn=stripSourceAttribution(article.leadEn||'',article);
 return {
  ...article,
  title,
  lead,
  leadEn,
  body,
  bodyEn,
  bodyHtml:paragraphsHtml(body),
  author:article.imported===true||!String(article.author||'').trim()?'تحریریه نبض ساردو':article.author
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
module.exports={stripTitleSourceSuffix,presentArticle,deskPresentation,stripSourceAttribution,sourceFreeImported,cleanImportedTypography,stripRepeatedTitlePrefix};
