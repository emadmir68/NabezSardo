// Presentation-only corrections: never edit stored articles or replay publication jobs.
const DESIGNATION_TITLES=new Set(['مدیرکل مدیریت بحران استان کرمان','معاون قضایی دادگستری کرمان']);
function presentArticle(article){
 const title=String(article?.title||'').trim().replace(/[：:]$/,'').trim();
 const lead=String(article?.lead||'').trim();
 if(!DESIGNATION_TITLES.has(title)||!lead||lead.length>200)return article;
 return {...article,title:lead,lead:'',kicker:article.title};
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
module.exports={presentArticle,deskPresentation};
