const PAGE_SIZE=12;
function normalize(value){
 return String(value||'').toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک')
 .replace(/[\u064B-\u065F\u0670]/g,'').replace(/[\s\u200c]+/g,' ').trim();
}
function dateKey(value){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
function browseNews(articles,options={},now=Date.now()){
 if(typeof options==='string')options={q:options};
 const q=String(options.q||'').trim().slice(0,300),category=String(options.category||'').trim();
 const period=['today','week','month'].includes(options.period)?options.period:'';
 const needle=normalize(q),today=period==='today'?dateKey(now):'';
 const days=period==='week'?7:period==='month'?30:0;
 const all=articles.filter(a=>{
   if(a.status!=='published'||(category&&a.categoryId!==category))return false;
   if(needle&&!normalize([a.title,a.lead,a.body,String(a.bodyHtml||'').replace(/<[^>]*>/g,' ')].filter(Boolean).join(' ')).includes(needle))return false;
   const time=new Date(a.publishedAt||a.createdAt).getTime();
   if(period&&(!Number.isFinite(time)||time>now))return false;
   if(period==='today'&&dateKey(time)!==today)return false;
   if(days&&time<now-days*86400000)return false;
   return true;
 }).sort((a,b)=>(Date.parse(b.publishedAt||b.createdAt)||0)-(Date.parse(a.publishedAt||a.createdAt)||0));
 const total=all.length,pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
 const parsed=Number(options.page),page=Number.isInteger(parsed)&&parsed>0?Math.min(parsed,pages):1;
 return {items:all.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),total,pages,page,q,category,period,pageSize:PAGE_SIZE};
}
module.exports={browseNews,normalize,PAGE_SIZE};
