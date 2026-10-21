const crypto=require('crypto');
const store=require('./store');
const articleTools=require('./article-tools');
const {sourceFreeImported,cleanImportedTypography}=require('./news-presentation');
const {load,save,id,now,slug}=store;

const DEFAULT_SETTINGS={enabled:true,autoPublish:true,intervalMinutes:240,maxPerHour:2,maxQueue:160,maxAgeHours:6,socialDistribution:false,keywords:'استان کرمان,شهر کرمان,کرمان,جیرفت,ساردوئیه,جنوب کرمان,عنبرآباد,کهنوج,فاریاب,رودبار جنوب,منوجان,قلعه گنج,جازموریان,هلیل,بحرآسمان,رفسنجان,سیرجان,بم,زرند,بافت,بردسیر,ریگان,فهرج,رابر,شهربابک,شهر بابک,کوهبنان,انار,نرماشیر,ارزوئیه,راور,ماهان,شهداد,گلباف'};
const DEFAULT_SOURCES=[
{id:'mehr-kerman',name:'خبرگزاری مهر — کرمان',url:'https://www.mehrnews.com/tag/%DA%A9%D8%B1%D9%85%D8%A7%D9%86',type:'html',scope:'kerman',topic:'local',enabled:true},
{id:'yjc-kerman',name:'باشگاه خبرنگاران جوان — کرمان',url:'https://www.yjc.ir/fa/kerman',type:'html',scope:'kerman',topic:'local',enabled:true},
{id:'isna-kerman',name:'ایسنا — RSS سراسری با فیلتر استان کرمان',url:'https://www.isna.ir/rss',type:'rss',scope:'national',topic:'local',enabled:true},
{id:'mehr-politics',name:'خبرگزاری مهر — سیاست کشور',url:'https://www.mehrnews.com/service/Politic',type:'html',scope:'country',topic:'politics',enabled:true},
{id:'mehr-society',name:'خبرگزاری مهر — جامعه کشور',url:'https://www.mehrnews.com/service/Society',type:'html',scope:'country',topic:'social',enabled:true},
{id:'mehr-tech',name:'خبرگزاری مهر — فناوری',url:'https://www.mehrnews.com/service/HiTech',type:'html',scope:'country',topic:'technology',enabled:true},
{id:'mehr-world',name:'خبرگزاری مهر — بین‌الملل',url:'https://www.mehrnews.com/service/International',type:'html',scope:'world',topic:'world',enabled:true},
{id:'irna-kerman',name:'ایرنا — استان کرمان (موقتاً غیرفعال)',url:'https://www.irna.ir/service/province/kerman',type:'html',scope:'kerman',topic:'local',enabled:false},
{id:'tasnim-kerman',name:'تسنیم — استان کرمان (خطای دسترسی از Worker)',url:'https://www.tasnimnews.com/fa/service/67',type:'html',scope:'kerman',topic:'local',enabled:false},
{id:'jiroft-halil',name:'جیرفت هلیل (نیازمند adapter اختصاصی)',url:'https://jirofthalil.ir/',type:'html',scope:'jiroft',topic:'local',enabled:false},
{id:'konarsandal',name:'کنارصندل (خطای SSL از Worker)',url:'https://www.konarsandal.ir/',type:'html',scope:'jiroft',topic:'local',enabled:false},
{id:'telegram-konarsandal',name:'تلگرام — کانال خبری کنارصندل',url:'https://t.me/s/konarsandal',type:'telegram',scope:'jiroft',topic:'local',enabled:true},
{id:'irna-national',name:'ایرنا — سراسری',url:'https://www.irna.ir/',type:'html',scope:'country',topic:'general',enabled:false},
{id:'isna-national',name:'ایسنا — صفحه اصلی',url:'https://www.isna.ir/',type:'html',scope:'country',topic:'general',enabled:false}
];
let running=false;

function clone(v){return JSON.parse(JSON.stringify(v));}
function trimQueuePreservingPending(m,max){
  const cap=boundedInt(max,30,300,120);
  const pending=(m.queue||[]).filter(x=>x&&x.status==='pending');
  const terminal=(m.queue||[]).filter(x=>!x||x.status!=='pending');
  const room=Math.max(0,cap-pending.length);
  m.queue=[...pending,...terminal.slice(0,room)];
}
function ensure(db){
  db.newsMonitor=db.newsMonitor||{};
  const m=db.newsMonitor;
  m.settings={...DEFAULT_SETTINGS,...(m.settings||{})};
  m.sources=Array.isArray(m.sources)&&m.sources.length?m.sources:clone(DEFAULT_SOURCES);
  m.queue=Array.isArray(m.queue)?m.queue:[];
  m.logs=Array.isArray(m.logs)?m.logs:[];
  m.seenUrls=Array.isArray(m.seenUrls)?m.seenUrls:[];
  if(Number(m.sourceConfigVersion||0)<5){
    for(const d of DEFAULT_SOURCES){
      const s=m.sources.find(x=>x&&x.id===d.id);
      if(s)Object.assign(s,{name:d.name,url:d.url,type:d.type,scope:d.scope,enabled:d.enabled});
      else m.sources.push(clone(d));
    }
    m.sourceConfigVersion=5;
  }
  if(Number(m.logicVersion||0)<4){
    m.seenUrls=[];
    m.lastRunAt=null;
    m.lastRunResult=null;
    for(const s of m.sources){
      s.initializedAt=null;
      s.lastError='';
      s.lastDiscovered=0;
      s.lastCheckedAt=null;
      s.lastSuccessAt=null;
    }
    m.logicVersion=4;
  }
  if(Number(m.logicVersion||0)<5){
    const invalidArticleIds=new Set();
    for(const a of db.articles||[]){
      if(!a||!a.imported||!a.sourceId)continue;
      const source=m.sources.find(s=>s.id===a.sourceId);
      if(source?.scope==='kerman'&&!relevant(m,source,{title:a.title||'',lead:a.lead||'',body:''})){
        invalidArticleIds.add(a.id);
      }
    }
    if(invalidArticleIds.size){
      db.articles=(db.articles||[]).filter(a=>!invalidArticleIds.has(a.id));
    }
    for(const q of m.queue){
      const source=m.sources.find(s=>s.id===q.sourceId);
      if(source?.scope==='kerman'&&!relevant(m,source,q)){
        q.status='rejected';
        q.rejectionReason='out-of-region';
        q.updatedAt=now();
        if(q.articleId&&invalidArticleIds.has(q.articleId))q.articleId=null;
      }
    }
    m.lastRunAt=null;
    m.lastRunResult=null;
    m.logicVersion=5;
  }
  if(Number(m.logicVersion||0)<6){
    const monitorSourceIds=new Set(m.sources.map(s=>s.id));
    const importedIds=new Set((db.articles||[])
      .filter(a=>a&&a.imported&&monitorSourceIds.has(a.sourceId))
      .map(a=>a.id));
    if(importedIds.size){
      db.articles=(db.articles||[]).filter(a=>!importedIds.has(a.id));
    }
    for(const q of m.queue){
      const source=m.sources.find(s=>s.id===q.sourceId);
      const outOfRegion=source?.scope==='kerman'&&!relevant(m,source,q);
      if(outOfRegion){
        q.status='rejected';
        q.rejectionReason='out-of-region';
        q.articleId=null;
        q.publishedByMonitorAt=null;
        q.updatedAt=now();
        continue;
      }
      if(q.articleId&&importedIds.has(q.articleId)){
        q.status='pending';
        q.articleId=null;
        q.publishedByMonitorAt=null;
        q.updatedAt=now();
      }
    }
    m.lastRunAt=null;
    m.lastRunResult=null;
    m.logicVersion=6;
  }
  if(Number(m.semanticDedupeVersion||0)<1){
    const imported=(db.articles||[]).filter(a=>a&&a.imported===true);
    const removeIds=new Set();
    for(let i=0;i<imported.length;i++){
      const a=imported[i];if(removeIds.has(a.id))continue;
      for(let j=i+1;j<imported.length;j++){
        const b=imported[j];if(removeIds.has(b.id)||!sameEventDuplicate(a,b))continue;
        const lenA=candidateText(a).length,lenB=candidateText(b).length;
        const drop=lenA>=lenB?b:a;
        const keep=drop===b?a:b;
        removeIds.add(drop.id);
        for(const q of m.queue||[]){
          if(q.articleId===drop.id){
            q.status='duplicate';
            q.duplicateReason='semantic-existing-duplicate';
            q.articleId=keep.id;
            q.updatedAt=now();
          }
        }
        if(drop===a)break;
      }
    }
    if(removeIds.size)db.articles=(db.articles||[]).filter(a=>!removeIds.has(a.id));
    m.semanticDedupeVersion=1;
    m.lastRunAt=null;
    m.lastRunResult=null;
  }
  if(Number(m.textCleanupVersion||0)<1){
    const monitorSourceIds=new Set((m.sources||[]).map(s=>s.id));
    for(const a of db.articles||[]){
      if(!a||a.imported!==true||!monitorSourceIds.has(a.sourceId))continue;
      const clean=sourceFreeImported(a);
      Object.assign(a,{
        title:clean.title,
        lead:clean.lead,
        body:clean.body,
        bodyHtml:clean.bodyHtml,
        author:clean.author,
        updatedAt:now()
      });
    }
    for(const q of m.queue||[]){
      if(!q||!monitorSourceIds.has(q.sourceId))continue;
      const clean=sourceFreeImported({...q,imported:true});
      Object.assign(q,{
        title:clean.title,
        lead:clean.lead,
        body:clean.body,
        bodyHtml:clean.bodyHtml,
        author:clean.author
      });
    }
    m.textCleanupVersion=1;
  }
  if(Number(m.textCleanupVersion||0)<2){
    const monitorSourceIds=new Set((m.sources||[]).map(s=>s.id));
    const removeIds=new Set();
    for(const a of db.articles||[]){
      if(!a||a.imported!==true||!monitorSourceIds.has(a.sourceId))continue;
      const clean=sourceFreeImported(a);
      const quality=candidateQualityReason(clean);
      const blocked=blockedMonitoredContentReason(clean)||(['cta-or-promotional','channel-debris'].includes(quality)?quality:'');
      if(blocked){
        removeIds.add(a.id);
        continue;
      }
      Object.assign(a,{
        title:clean.title,
        lead:clean.lead,
        body:clean.body,
        bodyHtml:clean.bodyHtml,
        author:clean.author,
        updatedAt:now()
      });
    }
    if(removeIds.size)db.articles=(db.articles||[]).filter(a=>!removeIds.has(a.id));
    for(const q of m.queue||[]){
      if(!q||!monitorSourceIds.has(q.sourceId))continue;
      const clean=sourceFreeImported({...q,imported:true});
      Object.assign(q,{title:clean.title,lead:clean.lead,body:clean.body,bodyHtml:clean.bodyHtml,author:clean.author});
      const blocked=blockedMonitoredContentReason(q)||candidateQualityReason(q);
      if(blocked&&q.status==='pending'){
        q.status='rejected';
        q.rejectionReason=blocked;
        q.updatedAt=now();
      }
    }
    m.textCleanupVersion=2;
    m.lastRunAt=null;
    m.lastRunResult=null;
  }
  if(Number(m.mixConfigVersion||0)<1){
    m.settings.maxPerHour=Math.max(4,boundedInt(m.settings.maxPerHour,1,30,4));
    m.settings.maxQueue=Math.max(160,boundedInt(m.settings.maxQueue,30,300,160));
    m.mixCursor=boundedInt(m.mixCursor,0,2,0);
    m.mixConfigVersion=1;
  }
  if(Number(m.fourHourCadenceVersion||0)<1){
    // Owner policy: run the news monitor every four hours and auto-publish at most two items per cycle.
    // The Worker cron may continue running more frequently for unrelated maintenance; tick() gates the monitor itself.
    m.settings.intervalMinutes=240;
    m.settings.maxPerHour=2;
    m.lastRunAt=null;
    m.lastRunResult=null;
    m.fourHourCadenceVersion=1;
  }
  if(Number(m.subrequestConfigVersion||0)<1){
    m.sourceCycleCursor=boundedInt(m.sourceCycleCursor,0,20,0);
    for(const s of m.sources){
      if(s.scope==='country'||s.scope==='world')s.lastError='';
    }
    m.lastRunAt=null;
    m.subrequestConfigVersion=1;
  }
  if(Number(m.categoryClassifierVersion||0)<2){
    for(const a of db.articles||[]){
      if(!a?.imported||!a.sourceId)continue;
      const source=m.sources.find(s=>s.id===a.sourceId);
      if(!source||topicForSource(source)!=='local')continue;
      const next=guessCategory({title:a.title||'',lead:a.lead||'',body:a.body||stripTags(a.bodyHtml||'')});
      if(next&&next!==a.categoryId)a.categoryId=next;
    }
    for(const q of m.queue||[]){
      const source=m.sources.find(s=>s.id===q.sourceId);
      if(!source||topicForSource(source)!=='local')continue;
      const next=guessCategory(q);
      if(next)q.categoryId=next;
    }
    m.categoryClassifierVersion=2;
  }
  if(Number(m.telegramAutoPublishVersion||0)<1){
    const telegramSourceIds=new Set((m.sources||[]).filter(s=>s&&s.type==='telegram').map(s=>s.id));
    for(const q of m.queue||[]){
      if(!q||q.status!=='pending'||!telegramSourceIds.has(q.sourceId))continue;
      q.manualReviewRequired=false;
      q.telegramAutoApproved=true;
      q.forceCleanAutoCover=true;
      q.updatedAt=now();
    }
    m.telegramAutoPublishVersion=1;
    m.lastRunAt=null;
    m.lastRunResult=null;
  }
  if(Number(m.telegramCurrentBatchReleaseVersion||0)<1){
    const batch=(m.queue||[]).filter(q=>q&&q.status==='pending'&&q.sourceId==='telegram-konarsandal'&&q.manualReviewRequired);
    if(batch.length){
      for(const q of batch){
        q.manualReviewRequired=false;
        q.telegramBatchApproved=true;
        q.forceCleanAutoCover=true;
        q.reviewApprovedAt=now();
        q.updatedAt=now();
      }
      m.telegramCurrentBatchReleaseVersion=1;
      m.lastRunAt=null;
      m.lastRunResult=null;
    }
  }
  if(Number(m.latestOnlyPolicyVersion||0)<1){
    m.settings.maxAgeHours=6;
    const baselineAt=m.lastRunAt||now();
    for(const s of m.sources||[]){
      s.latestSeenPublishedAt=s.lastCheckedAt||baselineAt;
    }
    for(const q of m.queue||[]){
      if(q.status!=='pending')continue;
      q.status='rejected';
      q.rejectionReason='pre-latest-only-backlog';
      q.updatedAt=now();
    }
    m.lastRunAt=null;
    m.lastRunResult=null;
    m.latestOnlyPolicyVersion=1;
  }
  if(Number(m.nonNewsPolicyVersion||0)<2){
    const badArticleIds=new Set((db.articles||[])
      .filter(a=>a&&a.imported===true&&blockedMonitoredContentReason(a))
      .map(a=>a.id));
    if(badArticleIds.size){
      db.articles=(db.articles||[]).filter(a=>!badArticleIds.has(a.id));
    }
    for(const q of m.queue||[]){
      if(!q)continue;
      const reason=blockedMonitoredContentReason(q);
      if(!reason)continue;
      q.status='rejected';
      q.rejectionReason=reason;
      q.articleId=null;
      q.publishedByMonitorAt=null;
      q.updatedAt=now();
    }
    m.nonNewsPolicyVersion=2;
    m.lastRunAt=null;
    m.lastRunResult=null;
  }
  m.lastRunAt=m.lastRunAt||null;m.lastRunResult=m.lastRunResult||null;
  return m;
}
function log(m,type,message,meta={}){m.logs.unshift({id:id(),at:now(),type,message,...meta});m.logs=m.logs.slice(0,100);}
function boundedInt(v,min,max,fallback){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):fallback;}
function markSeen(m,url){
  if(!url)return;
  m.seenUrls=[url,...m.seenUrls.filter(x=>x!==url)].slice(0,600);
}
function freshness(publishedAt,maxAgeHours=6){
  if(!publishedAt)return null;
  const t=Date.parse(String(publishedAt));
  if(!Number.isFinite(t))return null;
  const age=Date.now()-t;
  if(age < -2*60*60*1000)return false;
  return age <= boundedInt(maxAgeHours,1,336,6)*60*60*1000;
}
function normalizeText(v=''){return String(v||'').replace(/[\u200c\u200f\u200e\ufeff]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();}
function hasKeyword(text,keyword){
  const hay=normalizeText(text),needle=normalizeText(keyword);
  if(!hay||!needle)return false;
  const isWordChar=ch=>Boolean(ch)&&/[\u0600-\u06ffa-z0-9]/i.test(ch);
  let index=hay.indexOf(needle);
  while(index>=0){
    const before=index>0?hay[index-1]:'';
    const after=hay[index+needle.length]||'';
    if(!isWordChar(before)&&!isWordChar(after))return true;
    index=hay.indexOf(needle,index+1);
  }
  return false;
}
function htmlDecode(v=''){
  const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
  return String(v||'').replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(parseInt(n,10))).replace(/&([a-z]+);/gi,(m,n)=>Object.prototype.hasOwnProperty.call(named,n.toLowerCase())?named[n.toLowerCase()]:m);
}
function stripTags(v=''){return htmlDecode(String(v||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
function canonicalUrl(raw,base){
  try{
    const u=new URL(raw,base);if(!/^https?:$/.test(u.protocol))return '';
    u.hash='';['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','source'].forEach(k=>u.searchParams.delete(k));
    [...u.searchParams.keys()].forEach(k=>{if(/^utm_/i.test(k))u.searchParams.delete(k);});
    u.pathname=u.pathname.replace(/\/{2,}/g,'/').replace(/\/$/,'')||'/';return u.toString();
  }catch{return '';}
}
function absUrl(raw,base){try{const u=new URL(htmlDecode(raw),base);return /^https?:$/.test(u.protocol)?u.toString():'';}catch{return '';}}
function meta(html,key){
  const escaped=String(key).replace(/[.*+?^$()|[\]\\{}]/g,'\\$&');
  const p1=new RegExp('<meta[^>]+(?:property|name)=["\\\']'+escaped+'["\\\'][^>]+content=["\\\']([^"\\\']+)["\\\'][^>]*>','i');
  const p2=new RegExp('<meta[^>]+content=["\\\']([^"\\\']+)["\\\'][^>]+(?:property|name)=["\\\']'+escaped+'["\\\'][^>]*>','i');
  const m=html.match(p1)||html.match(p2);return m?htmlDecode(m[1]):'';
}
function firstTag(html,tag){const m=String(html||'').match(new RegExp('<'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/'+tag+'>','i'));return m?stripTags(m[1]):'';}
function xmlValue(block,tag){const m=String(block||'').match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'));return m?htmlDecode(m[1].replace(/^<!\[CDATA\[|\]\]>$/g,'').trim()):'';}
function parseFeed(xml,base){
  const rows=[],blocks=String(xml||'').match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi)||[];
  for(const block of blocks.slice(0,40)){
    const title=stripTags(xmlValue(block,'title'));let link=xmlValue(block,'link');
    if(!link){const lm=block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);if(lm)link=lm[1];}
    const url=canonicalUrl(link,base);if(!title||!url)continue;
    rows.push({title,url,description:stripTags(xmlValue(block,'description')||xmlValue(block,'summary')||xmlValue(block,'content')),publishedAt:xmlValue(block,'pubDate')||xmlValue(block,'published')||xmlValue(block,'updated')||''});
  }
  return rows;
}
function articleish(url){
  try{
    const p=new URL(url).pathname.toLowerCase();
    if(/\/(tag|tags|category|categories|service|archive|search|photo)\/?/.test(p))return false;
    return /\/news\//.test(p)||/\/fa\/news\//.test(p)||/\/(?:\d{5,})(?:\/|$)/.test(p)||p.split('/').filter(Boolean).length>=2;
  }catch{return false;}
}
function parseListHtml(html,base){
  const out=[],seen=new Set(),re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
  while((m=re.exec(String(html||'')))&&out.length<80){
    const title=stripTags(m[2]);if(title.length<18||title.length>280)continue;
    if(/^(خانه|صفحه اصلی|بیشتر|ادامه|ورود|ثبت نام|آرشیو|جستجو|rss)$/i.test(title))continue;
    const url=canonicalUrl(m[1],base);if(!url||seen.has(url)||!articleish(url))continue;
    seen.add(url);out.push({title,url,description:'',publishedAt:''});
  }
  return out;
}
function telegramPlainText(fragment=''){
  return htmlDecode(String(fragment||'')
    .replace(/<br\s*\/?\s*>/gi,'\n')
    .replace(/<[^>]+>/g,' '))
    .replace(/[ \t]+/g,' ')
    .replace(/\n\s+/g,'\n')
    .replace(/\s+\n/g,'\n')
    .trim();
}
function blockedMonitoredContentReason(c={}){
  const title=normalizeText(c.title||'');
  const body=normalizeText([c.lead,c.body].filter(Boolean).join(' ')).slice(0,5000);
  const text=(title+' '+body).trim();

  const devotionalLead=/^(?:بسم\s*الله(?:\s+الرحمن\s+الرحیم)?|اللهم\s+عجل\s+لولیک\s+الفرج|یا\s+(?:الله|حسین|علی|زهرا))(?:$|[\s،,:؛.!؟])/u;
  const greetingLead=/^(?:وقت\s+بخیر|صبح\s+بخیر|ظهر\s+بخیر|عصر\s+بخیر|شب\s+بخیر|درود(?:\s+بر\s+شما)?)(?:$|[\s،,:؛.!؟])|^سلام(?:$|[،,:؛.!؟]|\s+(?:علیکم|وقت|صبح|ظهر|عصر|شب|عرض|خسته|دوستان|لطفا|لطفاً|این|من|ما|آقا|خانم)(?:$|[\s،,:؛.!؟]))/u;
  const directRequest=/(?:لطفا|لطفاً|خواهشا|خواهشاً|خواهشمندم|زحمت\s+بکشید|ممنون\s+میشم|ممنون\s+می\s*شم).{0,80}(?:بررسی|پیگیری|رسیدگی|منتشر|اطلاع\s*رسانی|اعلام|خبر|اقدام)/u;
  const firstPersonChat=/^(?:من|ما)\s+(?:می\s*خواستم|می\s*خوام|می\s*خواهم|گفتم|می\s*گم|فرستادم|خواستم|هستم|بودم)(?:$|\s)/u;
  const messageLabel=/^(?:پیام\s+(?:مردمی|شهروندی|شهروند|کاربر)|پیام\s+ارسالی|دلنوشته|متن\s+ارسالی)(?:$|[\s:：،-])/u;
  if(devotionalLead.test(title)||greetingLead.test(title)||directRequest.test(title)||firstPersonChat.test(title)||messageLabel.test(title))return 'non-news-message';

  const editorialLead=/^(?:یادداشت|واکاوی|تحلیل|دیدگاه|سرمقاله|دلنوشته|به\s+قلم|روایت\s+شخصی)(?:$|[\s:：،\/-])/u;
  const ceremonialLead=/^به\s+نام(?:$|\s)/u;
  const promotionalLead=/^(?:🎯\s*)?(?:یه|یک)\s+فرصت(?:ِ|\s)*طلایی/u;
  const questionFeature=/(?:ویزیت|سلامت|پزشک|بیمار|تغذیه|سبک\s+زندگی)/u.test(title)&&/[؟?]$/u.test(title);
  if(editorialLead.test(title)||ceremonialLead.test(title)||promotionalLead.test(title)||questionFeature)return 'opinion-or-non-news';

  const genericAdvice=/^(?:چگونه|چطور|راهکار(?:های)?|نکات?|توصیه(?:‌?های)?|فواید|خواص|آیا\s+می\s*دانید|دانستنی)/u;
  const eventSignal=/(?:اعلام\s+کرد|گفت|خبر\s+داد|برگزار\s+شد|آغاز\s+شد|افتتاح\s+شد|تصویب\s+شد|رخ\s+داد|وقوع|کشف|بازداشت|هشدار|گزارش\s+داد|به\s+تصویب\s+رسید|منتشر\s+شد)/u;
  if(genericAdvice.test(title)&&!eventSignal.test(text))return 'non-news-advice';

  const obituaryTitle=/(?:آگهی|اطلاعیه)\s*(?:ترحیم|فوت)|(?:مجلس|مراسم)\s*(?:ترحیم|ختم)|پیام\s+تسلیت|تسلیت\s+(?:به|در\s+پی)|یادبود\s+(?:مرحوم|مرحومه|شادروان)/u;
  const obituaryContext=/(?:مرحوم|مرحومه|مغفور|مغفوره|شادروان|خانواده\s+داغدار|بازماندگان|روحش\s+شاد)/u;
  if(obituaryTitle.test(title)||((/(?:ترحیم|ختم|تسلیت|سالگرد|چهلم|هفتم)/u.test(title))&&obituaryContext.test(text)))return 'obituary';

  const explicitAd=/(?:رپورتاژ(?:\s+آگهی)?|آگهی\s*(?:تبلیغاتی|فروش|استخدام|مناقصه|مزایده)|تبلیغات|فروش\s+ویژه|تخفیف\s+ویژه|ثبت\s+سفارش|دعوت\s+به\s+همکاری|مناقصه\s+عمومی|مزایده\s+عمومی)/u;
  const callToAction=/(?:برای\s+(?:خرید|سفارش|رزرو)|خرید\s+کنید|سفارش\s+دهید|تماس\s+بگیرید|شماره\s+تماس|واتساپ|دایرکت|ارسال\s+رایگان|پرداخت\s+اقساطی)/u;
  const offer=/(?:تخفیف|فروش\s+ویژه|قیمت\s+ویژه|محصول|خدمات|پکیج|رزرو|ثبت\s+نام)/u;
  if(explicitAd.test(title)||(callToAction.test(text)&&offer.test(text)))return 'advertisement';
  return '';
}
function candidateQualityReason(c={}){
  const title=cleanImportedTypography(c.title||'');
  const body=cleanImportedTypography([c.lead,c.body].filter(Boolean).join(' '));
  if(title.length<12)return 'weak-title';
  if(title.length>160)return 'overlong-title';
  if(body.length<70)return 'weak-body';
  const cta=/(?:مشاهده|کلیک|عضویت|وارد\s+شوید|بزنید|بپیوندید|ثبت\s*نام|پخش\s+زنده|لینک\s+(?:زیر|بیو)|دایرکت|فرصت\s+طلایی)/u;
  const channel=/(?:👇|👉|عضویت\s+در\s+کانال|کانال\s+ما|پیج\s+ما|صفحه\s+ما|لینک\s+کانال)/u;
  if(cta.test(title+' '+body)&&channel.test(title+' '+body))return 'cta-or-promotional';
  if(/^[#@]/u.test(title)||/https?:\/\//i.test(title))return 'channel-debris';
  return '';
}
function telegramLooksLikeAd(text=''){
  const t=normalizeText(text);
  if(!t)return true;
  if(/#(?:اجاره|استخدام|تبلیغ|فروش)/.test(t))return true;
  const commercial=/فروشگاه|تخفیف|نمایندگی|استخدام|دعوت به همکاری|اجاره|کلینیک|درمانگاه|ثبت نام|افتتاحیه فروشگاه|شماره تماس|تماس:|آدرس:/.test(t);
  const phone=/(?:^|\D)(?:0?9\d{9}|0\d{9,10})(?:\D|$)/.test(t.replace(/[۰-۹]/g,ch=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)));
  return commercial&&phone;
}
function telegramTitle(text=''){
  const lines=String(text||'').split(/\n+/).map(x=>x.replace(/^[@#][^ ]+\s*/,'').trim()).filter(Boolean);
  let first=lines.find(x=>x.length>=18)||lines[0]||'';
  first=first.replace(/^[@\w.]+\s*$/,'').replace(/^[⭕️🔻🔺♦️▪️◾️🔹️]+\s*/u,'').trim();
  const sentence=first.split(/(?<=[؟.!])\s+/)[0]||first;
  return sentence.slice(0,220).trim();
}
function parseTelegramPage(html,base){
  const out=[],seen=new Set(),src=String(html||'');
  const re=/<div\b[^>]*class=["'][^"']*tgme_widget_message[^"']*["'][^>]*data-post=["']([^"']+)["'][^>]*>([\s\S]*?)(?=<div\b[^>]*class=["'][^"']*tgme_widget_message[^"']*["'][^>]*data-post=|$)/gi;
  let m;
  while((m=re.exec(src))&&out.length<40){
    const post=String(m[1]||'').trim(),block=m[2]||'';
    if(!post||seen.has(post))continue;
    const textMatch=block.match(/<div\b[^>]*class=["'][^"']*tgme_widget_message_text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    let body=telegramPlainText(textMatch&&textMatch[1]||'')
      .replace(/(^|\s)@konarsandal\b/gi,' ')
      .replace(/[ \t]{2,}/g,' ')
      .replace(/\n[ \t]+/g,'\n')
      .replace(/[ \t]+\n/g,'\n')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
    const title=telegramTitle(telegramPlainText(textMatch&&textMatch[1]||''));
    if(body.length<35||telegramLooksLikeAd(body)||blockedMonitoredContentReason({title,body}))continue;
    if(!title||title.length<12)continue;
    const tm=block.match(/<time\b[^>]*datetime=["']([^"']+)["']/i);
    const pm=block.match(/background-image\s*:\s*url\((?:&quot;|['"])?([^)'"]+)(?:&quot;|['"])?\)/i);
    const vm=block.match(/<video\b[^>]*src=["']([^"']+)["']/i)||block.match(/<source\b[^>]*src=["']([^"']+)["'][^>]*type=["']video\//i);
    const link='https://t.me/'+post.replace(/^\/+|\/+$/g,'');
    const url=canonicalUrl(link,base)||link;
    seen.add(post);
    out.push({title,url,description:body,body,publishedAt:tm?htmlDecode(tm[1]):'',imageUrl:pm?htmlDecode(pm[1]):'',videoUrl:vm?htmlDecode(vm[1]):'',telegram:true});
  }
  return out;
}
function jsonLdArticle(html){
  const scripts=String(html||'').match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi)||[],stack=[];
  for(const s of scripts){
    const raw=s.replace(/^[\s\S]*?>/,'').replace(/<\/script>[\s\S]*$/i,'').trim();
    try{const parsed=JSON.parse(raw);stack.push(...(Array.isArray(parsed)?parsed:[parsed]));}catch{}
  }
  while(stack.length){
    const x=stack.shift();if(!x||typeof x!=='object')continue;if(Array.isArray(x['@graph']))stack.push(...x['@graph']);
    const type=Array.isArray(x['@type'])?x['@type'].join(' '):String(x['@type']||'');
    if(/NewsArticle|Article|ReportageNewsArticle/i.test(type))return x;
  }
  return {};
}
function paragraphsFromHtml(fragment){
  const paras=[],re=/<(?:p|li|blockquote)\b[^>]*>([\s\S]*?)<\/(?:p|li|blockquote)>/gi;let m;
  while((m=re.exec(String(fragment||'')))&&paras.length<120){const t=stripTags(m[1]);if(t.length>=20&&!/^(تبلیغات|انتهای پیام|لینک کوتاه)/.test(t))paras.push(t);}
  return [...new Set(paras)];
}
function escHtml(v=''){return String(v).replace(/[&<>"']/g,ch=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));}
function toBodyHtml(paras){return paras.filter(Boolean).map(p=>'<p>'+escHtml(p)+'</p>').join('');}
function imageFromLd(ld,base){const x=ld&&ld.image,raw=typeof x==='string'?x:Array.isArray(x)?(typeof x[0]==='string'?x[0]:x[0]&&x[0].url):x&&x.url;return absUrl(raw||'',base);}
function extractArticle(html,url,seed={}){
  const ld=jsonLdArticle(html);
  const cm=String(html).match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  const canonical=canonicalUrl((cm&&cm[1])||url,url);
  const title=stripTags(ld.headline||meta(html,'og:title')||firstTag(html,'h1')||seed.title||'').slice(0,260);
  const lead=stripTags(ld.description||meta(html,'description')||meta(html,'og:description')||seed.description||'').slice(0,1600);
  let paras=[];
  if(ld.articleBody)paras=String(ld.articleBody).split(/\n{1,}|(?<=[.!؟])\s+(?=[\u0600-\u06FF])/).map(x=>String(x).trim()).filter(x=>x.length>=20);
  if(paras.join(' ').length<250){
    const am=String(html).match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
    const bm=String(html).match(/<(?:div|section)\b[^>]*(?:class|id)=["'][^"']*(?:article-body|articleBody|news-body|story-body|content-body|item-text|news-text)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/i);
    const p=paragraphsFromHtml((am&&am[1])||(bm&&bm[1])||html);if(p.join(' ').length>paras.join(' ').length)paras=p;
  }
  paras=[...new Set(paras.map(x=>String(x).replace(/\s+/g,' ').trim()).filter(Boolean))];
  if(paras.join(' ').length<100&&seed.description)paras=[seed.description];
  const vm=String(html).match(/<video\b[^>]*src=["']([^"']+)["']/i),sm=String(html).match(/<source\b[^>]*src=["']([^"']+)["'][^>]*type=["']video\//i);
  const image=absUrl(meta(html,'og:image')||meta(html,'twitter:image')||imageFromLd(ld,url),url);
  const video=absUrl(meta(html,'og:video:secure_url')||meta(html,'og:video')||meta(html,'twitter:player:stream')||(vm&&vm[1])||(sm&&sm[1])||'',url);
  const publishedAt=ld.datePublished||meta(html,'article:published_time')||seed.publishedAt||'';
  const author=typeof ld.author==='string'?ld.author:Array.isArray(ld.author)?(ld.author[0]&&ld.author[0].name||''):(ld.author&&ld.author.name)||'';
  return {title,lead,bodyHtml:toBodyHtml(paras),body:paras.join('\n\n'),imageUrl:image,videoUrl:video,publishedAt,author:stripTags(author),url:canonical};
}
function tokens(v=''){return new Set(normalizeText(v).replace(/[^\u0600-\u06ffa-z0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>2));}
function titleSimilarity(a,b){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;return n/(A.size+B.size-n);}
function comparisonText(v=''){
  return normalizeText(stripTags(String(v||'')))
    .replace(/[يى]/g,'ی')
    .replace(/ك/g,'ک')
    .replace(/[^\u0600-\u06ffa-z0-9 ]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function candidateText(c={}){
  const body=String(c.body||stripTags(c.bodyHtml||'')||'');
  return comparisonText((c.lead||'')+' '+body.slice(0,2200));
}
function textContainmentSimilarity(a,b){
  const A=candidateText(a),B=candidateText(b);
  if(!A||!B)return 0;
  const short=A.length<=B.length?A:B,long=A.length<=B.length?B:A;
  if(short.length>=100&&long.includes(short))return 1;
  const SA=tokens(A),SB=tokens(B);
  if(!SA.size||!SB.size)return 0;
  const small=SA.size<=SB.size?SA:SB,big=SA.size<=SB.size?SB:SA;
  let shared=0;for(const x of small)if(big.has(x))shared++;
  return shared/Math.max(1,small.size);
}
function closeInTime(a,b,maxHours=72){
  const ta=Date.parse(a.sourcePublishedAt||a.publishedAt||a.createdAt||'')||0;
  const tb=Date.parse(b.sourcePublishedAt||b.publishedAt||b.createdAt||'')||0;
  if(!ta||!tb)return true;
  return Math.abs(ta-tb)<=maxHours*60*60*1000;
}
function sameEventDuplicate(a,b){
  if(!a||!b)return false;
  if(titleSimilarity(a.title,b.title)>=0.9)return true;
  if(!closeInTime(a,b))return false;
  const locA=String(a.location||''),locB=String(b.location||'');
  if(locA&&locB&&locA!==locB)return false;
  const catA=String(a.categoryId||''),catB=String(b.categoryId||'');
  if(catA&&catB&&catA!==catB)return false;
  const containment=textContainmentSimilarity(a,b);
  if(containment>=0.94)return true;
  return titleSimilarity(a.title,b.title)>=0.48&&containment>=0.78;
}
function fingerprint(title,body){return crypto.createHash('sha256').update(normalizeText(title)+'|'+normalizeText(body).slice(0,7000)).digest('hex');}
function keywords(m){return String(m.settings.keywords||'').split(/[,،\n]+/).map(x=>normalizeText(x)).filter(Boolean);}
function relevant(m,source,c){
  if(source.scope==='jiroft'||source.scope==='local'||source.scope==='country'||source.scope==='world')return true;
  const text=source.scope==='kerman'
    ? normalizeText((c.title||'')+' '+(c.lead||''))
    : normalizeText((c.title||'')+' '+(c.lead||'')+' '+(c.body||''));
  return keywords(m).some(k=>hasKeyword(text,k));
}
function tierForSource(source={}){
  if(source.scope==='world')return 'world';
  if(source.scope==='country')return 'country';
  return 'local';
}
function topicForSource(source={}){
  if(source.topic)return source.topic;
  if(source.scope==='world')return 'world';
  if(source.scope==='country')return 'general';
  return 'local';
}
function desiredMix(limit){
  const total=boundedInt(limit,1,30,4);
  if(total===1)return {local:1,country:0,world:0};
  if(total===2)return {local:2,country:0,world:0};
  if(total===3)return {local:2,country:1,world:0};
  return {local:Math.max(2,total-2),country:1,world:1};
}
function sourcesForRun(m){
  const enabled=(m.sources||[]).filter(x=>x&&x.enabled);
  const local=enabled.filter(x=>x.scope!=='country'&&x.scope!=='world');
  const countries=enabled.filter(x=>x.scope==='country').sort((a,b)=>{
    const order={politics:0,social:1,technology:2,general:3};
    return (order[a.topic]??9)-(order[b.topic]??9);
  });
  const worlds=enabled.filter(x=>x.scope==='world');
  const out=[...local];
  if(countries.length){
    const idx=boundedInt(m.sourceCycleCursor,0,100,0)%countries.length;
    out.push(countries[idx]);
    m.sourceCycleCursor=(idx+1)%countries.length;
  }
  if(worlds.length)out.push(worlds[0]);
  return out;
}
function publishedMixLastHour(db){
  const cutoff=Date.now()-60*60*1000,out={local:0,country:0,world:0,total:0};
  for(const a of db.articles||[]){
    if(!a?.imported)continue;
    if(new Date(a.publishedAt||a.createdAt||0).getTime()<cutoff)continue;
    const tier=['local','country','world'].includes(a.monitorTier)?a.monitorTier:'local';
    out[tier]++;out.total++;
  }
  return out;
}
function candidateTier(m,c){
  const source=sourceById(m,c.sourceId)||{};
  return c.monitorTier||tierForSource(source);
}
function candidateTopic(m,c){
  const source=sourceById(m,c.sourceId)||{};
  return c.monitorTopic||topicForSource(source);
}
function pickCountryBalanced(m,pending,used){
  const topics=['politics','social','technology'];
  for(let offset=0;offset<topics.length;offset++){
    const topic=topics[(boundedInt(m.mixCursor,0,2,0)+offset)%topics.length];
    const item=pending.find(x=>!used.has(x.id)&&candidateTier(m,x)==='country'&&candidateTopic(m,x)===topic);
    if(item){
      m.mixCursor=(topics.indexOf(topic)+1)%topics.length;
      return item;
    }
  }
  return pending.find(x=>!used.has(x.id)&&candidateTier(m,x)==='country')||null;
}
function isTelegramCandidate(m,c){
  const source=sourceById(m,c?.sourceId)||{};
  return source.type==='telegram';
}
function telegramPublishedRecently(db,m,minutes=15){
  const cutoff=Date.now()-Math.max(1,Number(minutes||15))*60*1000;
  const telegramIds=new Set((m.sources||[]).filter(s=>s&&s.type==='telegram').map(s=>s.id));
  return (db.articles||[]).some(a=>a&&a.imported&&telegramIds.has(a.sourceId)&&(Date.parse(a.publishedAt||a.createdAt||'')||0)>=cutoff);
}
function selectPublishIds(db,m,limit){
  const max=Math.min(2,boundedInt(limit,0,30,0));
  if(!max)return [];
  const pending=m.queue.filter(x=>x.status==='pending'&&!x.manualReviewRequired).slice().sort((a,b)=>{
    const ta=Date.parse(a.publishedAt||a.createdAt||0)||0,tb=Date.parse(b.publishedAt||b.createdAt||0)||0;
    return tb-ta;
  });
  const telegram=pending.find(x=>isTelegramCandidate(m,x));
  if(telegram&&!telegramPublishedRecently(db,m,15))return [telegram.id];
  const nonTelegram=pending.filter(x=>!isTelegramCandidate(m,x));
  const counts=publishedMixLastHour(db),target=desiredMix(boundedInt(m.settings.maxPerHour,1,30,4));
  const used=new Set(),picked=[];
  const take=item=>{if(item&&!used.has(item.id)&&picked.length<max){used.add(item.id);picked.push(item.id);return true;}return false;};
  const localNeed=Math.max(0,target.local-counts.local);
  const countryNeed=Math.max(0,target.country-counts.country);
  const worldNeed=Math.max(0,target.world-counts.world);
  for(let i=0;i<localNeed&&picked.length<max;i++)take(nonTelegram.find(x=>!used.has(x.id)&&candidateTier(m,x)==='local'));
  for(let i=0;i<countryNeed&&picked.length<max;i++)take(pickCountryBalanced(m,nonTelegram,used));
  for(let i=0;i<worldNeed&&picked.length<max;i++)take(nonTelegram.find(x=>!used.has(x.id)&&candidateTier(m,x)==='world'));
  while(picked.length<max){
    const item=nonTelegram.find(x=>!used.has(x.id)&&candidateTier(m,x)==='local')
      ||pickCountryBalanced(m,nonTelegram,used)
      ||nonTelegram.find(x=>!used.has(x.id)&&candidateTier(m,x)==='world');
    if(!take(item))break;
  }
  return picked;
}
function categoryFromText(text){
  const t=normalizeText(text);
  if(!t)return '';
  if(/هواشناسی|بارش|باران|سیلاب|هشدار زرد|هشدار نارنجی|دما|طوفان/.test(t))return 'weather';
  if(/تصادف|حادثه|قتل|سرقت|آتش|پلیس|انتظامی|دادستان|بازداشت|کشف/.test(t))return 'incidents';
  if(/راهداری|راه روستایی|راه‌های روستایی|راه های روستایی|آسفالت|راهسازی|راه‌سازی|جاده|حمل‌ونقل|حمل و نقل|زیرساخت/.test(t))return 'city-village';
  if(/فوتبال|والیبال|کشتی|ورزش|تیم|مسابقه|لیگ/.test(t))return 'sports';
  if(/فرهنگ|فرهنگی|هنر|نمایشگاه|کتاب|موسیقی|ارشاد|جشنواره|دانش‌آموز|دانش آموز|آموزشی|علمی/.test(t))return 'culture';
  if(/استاندار|فرماندار|مجلس|انتخابات|دولت|وزیر|سیاسی|وزارت خارجه|دیپلماسی/.test(t))return 'city-village';
  if(/کشاورز|کشاورزی|محصول کشاورزی|خرما|مرکبات|باغداری|دامداری|آب کشاورزی/.test(t))return 'agriculture';
  if(/ساردوئیه|بحرآسمان|دلفارد/.test(t))return 'sardouiyeh';
  return '';
}
function guessCategory(c){
  const headline=String(c?.title||'')+' '+String(c?.lead||'');
  const headlineCategory=categoryFromText(headline);
  if(headlineCategory)return headlineCategory;
  const body=stripTags(String(c?.body||c?.bodyHtml||'')).slice(0,1800);
  return categoryFromText(body)||'social';
}
function guessLocation(c){
  const t=normalizeText((c.title||'')+' '+(c.lead||'')+' '+String(c.body||'').slice(0,1000));
  const names=['ساردوئیه','جیرفت','عنبرآباد','کهنوج','فاریاب','رودبار جنوب','منوجان','قلعه گنج','جازموریان','رفسنجان','سیرجان','بم','زرند','بافت','بردسیر','ریگان','فهرج','رابر','شهربابک','شهر بابک','کوهبنان','انار','نرماشیر','ارزوئیه','راور','ماهان','شهداد','گلباف','کرمان'];
  return names.find(x=>hasKeyword(t,x))||'استان کرمان';
}
function isDuplicate(db,m,c){
  const u=canonicalUrl(c.url,c.url),fp=c.fingerprint||fingerprint(c.title,c.body);
  for(const a of db.articles||[]){
    if(u&&canonicalUrl(a.sourceUrl||'',a.sourceUrl||'')===u)return {yes:true,reason:'same-url',articleId:a.id};
    if(fp&&a.sourceFingerprint===fp)return {yes:true,reason:'same-fingerprint',articleId:a.id};
    if(sameEventDuplicate(a,c))return {yes:true,reason:'same-event',articleId:a.id};
  }
  for(const q of m.queue||[]){
    if(q.id===c.id)continue;
    if(u&&canonicalUrl(q.url||'',q.url||'')===u)return {yes:true,reason:'queue-url',queueId:q.id};
    if(fp&&q.fingerprint===fp)return {yes:true,reason:'queue-fingerprint',queueId:q.id};
    if(['pending','published'].includes(q.status)&&sameEventDuplicate(q,c))return {yes:true,reason:'queue-event',queueId:q.id};
  }
  return {yes:false};
}
async function fetchBuffer(url,limit,typePrefix){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),16000);
  try{
    const res=await fetch(url,{redirect:'follow',headers:{...BROWSER_HEADERS,'accept':'*/*'},signal:controller.signal});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const type=String(res.headers.get('content-type')||'').split(';')[0].trim().toLowerCase(),len=Number(res.headers.get('content-length')||0);
    if(typePrefix&&!type.startsWith(typePrefix))throw new Error('unexpected-content-type');if(len&&len>limit)throw new Error('media-too-large');
    const buf=Buffer.from(await res.arrayBuffer());if(buf.length>limit)throw new Error('media-too-large');return {data:buf,type};
  }finally{clearTimeout(timer);}
}
const BROWSER_HEADERS={
  'user-agent':'Mozilla/5.0 (Linux; Android 16; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  'accept-language':'fa-IR,fa;q=0.9,en-US;q=0.6,en;q=0.4',
  'cache-control':'no-cache',
  'pragma':'no-cache'
};
async function fetchText(url,limit=3*1024*1024){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),16000);
  try{
    const res=await fetch(url,{redirect:'follow',headers:{...BROWSER_HEADERS,'accept':'text/html,application/xhtml+xml,application/rss+xml,application/atom+xml,text/xml;q=0.9,*/*;q=0.5'},signal:controller.signal});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const len=Number(res.headers.get('content-length')||0);if(len&&len>limit)throw new Error('document-too-large');
    const buf=Buffer.from(await res.arrayBuffer());if(buf.length>limit)throw new Error('document-too-large');
    return buf.toString('utf8');
  }finally{clearTimeout(timer);}
}
async function discover(source){
  const text=await fetchText(source.url);
  let rows=[];
  if(source.type==='telegram'){
    rows=parseTelegramPage(text,source.url);
  }else if(source.type==='rss'||/^\s*<\?xml|<rss\b|<feed\b/i.test(text)){
    rows=parseFeed(text,source.url);
    if(!rows.length)rows=parseListHtml(text,source.url);
  }else{
    rows=parseListHtml(text,source.url);
  }
  rows=rows.slice(0,40);
  if(!rows.length)throw new Error('no-article-links');
  return rows;
}
async function mediaMeta(c,source={}){
  let imageMeta={image:'',imageWidth:null,imageHeight:null,imageRatio:null,imageOrientation:'landscape',imageAuto:false,autoCoverTheme:null},video={videoUrl:'',videoType:''};
  if(c.imageUrl){
    try{
      const f=await fetchBuffer(c.imageUrl,10*1024*1024,'image/');
      const clean=typeof articleTools.cleanMonitoredImage==='function'
        ? await articleTools.cleanMonitoredImage({file:{data:f.data,type:f.type},sourceUrl:c.imageUrl,sourceId:source.id||c.sourceId})
        : {action:'fallback',method:'smart-cover',reason:'media-cleaner-unavailable',logoDetected:null};
      c.mediaLogoDetected=clean.logoDetected===true?true:clean.logoDetected===false?false:null;
      c.mediaCleanMethod=clean.method||'smart-cover';
      c.mediaCleanVerified=clean.verified===true;
      c.mediaCleanReason=clean.reason||'';
      if(clean.action==='use'&&clean.file?.data?.length){
        imageMeta={...(await articleTools.saveFeaturedImage(clean.file)),imageAuto:false,autoCoverTheme:null};
      }
    }catch(err){
      c.mediaImageError=String(err.message||err);
      c.mediaCleanMethod='smart-cover';
      c.mediaCleanReason='image-clean-failed';
    }
  }
  if(c.videoUrl){
    try{
      const f=await fetchBuffer(c.videoUrl,50*1024*1024,'video/');
      const clean=typeof articleTools.cleanMonitoredVideo==='function'
        ? await articleTools.cleanMonitoredVideo({file:{data:f.data,type:f.type},sourceUrl:c.videoUrl,sourceId:source.id||c.sourceId})
        : {action:'fallback',method:'smart-cover',reason:'video-cleaner-unavailable',logoDetected:null};
      c.videoCleanMethod=clean.method||'smart-cover';
      c.videoCleanReason=clean.reason||'';
      if(clean.action==='use'&&clean.file?.data?.length){
        const saved=articleTools.saveVideo(clean.file);
        video={videoUrl:saved.url,videoType:saved.type};
      }
    }catch(err){
      c.mediaVideoError=String(err.message||err);
      c.videoCleanMethod='smart-cover';
      c.videoCleanReason='video-clean-failed';
    }
  }
  return {...imageMeta,...video};
}
function uniqueSlug(db,raw,currentId){let s=slug(raw),i=2;while((db.articles||[]).some(a=>a.slug===s&&a.id!==currentId))s=slug(raw)+'-'+i++;return s;}
function sourceById(m,sourceId){return m.sources.find(x=>x.id===sourceId);}
function pendingCount(m){return m.queue.filter(x=>x.status==='pending').length;}
function importedLastHour(db){const cutoff=Date.now()-60*60*1000;return (db.articles||[]).filter(a=>a.imported&&new Date(a.publishedAt||a.createdAt||0).getTime()>=cutoff).length;}
async function publishCandidate(candidateId){
  const db=load(),m=ensure(db),c=m.queue.find(x=>x.id===candidateId);
  if(!c||c.status!=='pending')return {ok:false,reason:'not-pending'};
  const blocked=blockedMonitoredContentReason(c)||candidateQualityReason(c);
  if(blocked){
    c.status='rejected';c.rejectionReason=blocked;c.updatedAt=now();
    log(m,'filtered','محتوای غیرخبری پیش از انتشار مسدود شد',{candidateId:c.id,sourceId:c.sourceId,blockedReason:blocked});
    save(db);
    return {ok:false,reason:'blocked-'+blocked};
  }
  const dup=isDuplicate(db,m,{...c,id:c.id});
  if(dup.yes&&!dup.queueId){c.status='duplicate';c.duplicateReason=dup.reason;c.updatedAt=now();save(db);return {ok:false,reason:'duplicate'};}
  const source=sourceById(m,c.sourceId)||{};
  const current=await mediaMeta(c,source);
  const publicCandidate=sourceFreeImported({...c,imported:true});
  const payload=await articleTools.articlePayload(db,{title:publicCandidate.title,slug:publicCandidate.title,categoryId:publicCandidate.categoryId,lead:publicCandidate.lead,bodyHtml:publicCandidate.bodyHtml,author:'تحریریه نبض ساردو',location:publicCandidate.location,status:'published',featured:'0',autoCover:'1',socialTelegram:m.settings.socialDistribution?'1':'0',socialRubika:m.settings.socialDistribution?'1':'0',socialWhatsApp:'0'}, {}, current, uniqueSlug);
  const article={id:id(),createdAt:now(),...payload,publishedAt:now(),imported:true,sourceId:c.sourceId,sourceName:c.sourceName,sourceUrl:c.url,sourceFingerprint:c.fingerprint,sourcePublishedAt:c.publishedAt||null,ingestedAt:now(),monitorTier:c.monitorTier||tierForSource(source),monitorTopic:c.monitorTopic||topicForSource(source),mediaLogoDetected:c.mediaLogoDetected??null,mediaCleanMethod:c.mediaCleanMethod||'',mediaCleanVerified:c.mediaCleanVerified===true,mediaCleanReason:c.mediaCleanReason||'',videoCleanMethod:c.videoCleanMethod||'',videoCleanReason:c.videoCleanReason||''};
  db.articles.unshift(article);c.status='published';c.articleId=article.id;c.publishedByMonitorAt=now();c.updatedAt=now();
  log(m,'published','خبر رصدشده منتشر شد',{candidateId:c.id,articleId:article.id,sourceId:c.sourceId});save(db);
  if(m.settings.socialDistribution)articleTools.dispatchAndPersist(article.id).catch(err=>console.error('monitor social distribution',err));
  return {ok:true,articleId:article.id};
}
async function run(){
  if(running)return {ok:false,reason:'already-running'};running=true;const started=Date.now();
  try{
    const db=load(),m=ensure(db);if(!m.settings.enabled)return {ok:false,reason:'disabled'};
    let discovered=0,queued=0,duplicates=0,errors=0,filtered=0,stale=0,baseline=0,budgetSkipped=0,detailFetches=0;
    const detailBudget=24;
    const runSources=sourcesForRun(m);
    for(const source of runSources){
      const firstScan=!source.initializedAt;
      const sourceWatermarkMs=Date.parse(source.latestSeenPublishedAt||source.lastCheckedAt||'')||0;
      let newestSeenPublishedMs=sourceWatermarkMs;
      source.lastCheckedAt=now();source.lastError='';source.lastDiscovered=0;
      try{
        const seeds=await discover(source);discovered+=seeds.length;
        source.lastDiscovered=seeds.length;
        const scanLimit=source.scope==='national'?18:(source.scope==='country'||source.scope==='world'?10:8);
        for(const seed of seeds.slice(0,scanLimit)){
          const url=canonicalUrl(seed.url,source.url);if(!url||m.seenUrls.includes(url))continue;
          if(source.scope==='national'&&!relevant(m,source,{title:seed.title||'',lead:seed.description||'',body:''})){
            markSeen(m,url);filtered++;continue;
          }
          if(detailFetches>=detailBudget){budgetSkipped++;break;}
          try{
            const isTelegram=source.type==='telegram';
            let detail;
            if(isTelegram){
              detail={url,title:seed.title||'',lead:seed.description||'',bodyHtml:toBodyHtml([seed.body||seed.description||'']),body:seed.body||seed.description||'',imageUrl:seed.imageUrl||'',videoUrl:seed.videoUrl||'',publishedAt:seed.publishedAt||'',author:''};
            }else{
              detailFetches++;
              detail=extractArticle(await fetchText(url),url,seed);
            }
            const tier=tierForSource(source),topic=topicForSource(source);
            const c={id:id(),createdAt:now(),updatedAt:now(),status:'pending',sourceId:source.id,sourceName:source.name,url:detail.url||url,title:detail.title||seed.title,lead:detail.lead||seed.description||'',bodyHtml:detail.bodyHtml,body:detail.body||seed.description||'',imageUrl:detail.imageUrl||'',videoUrl:detail.videoUrl||'',publishedAt:detail.publishedAt||seed.publishedAt||'',author:detail.author||'',categoryId:'social',location:tier==='world'?'بین‌الملل':tier==='country'?'ایران':'استان کرمان',monitorTier:tier,monitorTopic:topic,manualReviewRequired:false,telegramAutoApproved:isTelegram,forceCleanAutoCover:isTelegram};
            if(!c.title||c.body.length<70){markSeen(m,url);filtered++;continue;}
            const blocked=blockedMonitoredContentReason(c)||candidateQualityReason(c);
            if(blocked){
              markSeen(m,url);filtered++;
              log(m,'filtered','محتوای غیرخبری از رصد حذف شد',{sourceId:source.id,url,blockedReason:blocked});
              continue;
            }
            if(!relevant(m,source,c)){markSeen(m,url);filtered++;continue;}
            const publishedMs=Date.parse(String(c.publishedAt||''))||0;
            if(publishedMs>newestSeenPublishedMs)newestSeenPublishedMs=publishedMs;
            const fresh=freshness(c.publishedAt,m.settings.maxAgeHours);
            if(fresh===false){markSeen(m,url);stale++;continue;}
            if(publishedMs&&sourceWatermarkMs&&publishedMs<=sourceWatermarkMs){
              markSeen(m,url);stale++;continue;
            }
            if(firstScan&&fresh===null){markSeen(m,url);baseline++;continue;}
            c.categoryId=source.topic==='politics'?'city-village':source.topic==='social'?'social':source.topic==='technology'&&((db.categories||[]).some(x=>x.id==='technology'))?'technology':guessCategory(c);
            if(!(db.categories||[]).some(x=>x.id===c.categoryId))c.categoryId='social';
            if(c.monitorTier==='local')c.location=guessLocation(c);
            const cleanedCandidate=sourceFreeImported({...c,imported:true});
            c.title=cleanedCandidate.title;
            c.lead=cleanedCandidate.lead;
            c.body=cleanedCandidate.body;
            c.bodyHtml=cleanedCandidate.bodyHtml;
            c.author=cleanedCandidate.author;
            c.fingerprint=fingerprint(c.title,c.body);
            const dup=isDuplicate(db,m,c);
            if(dup.yes){
              c.status='duplicate';c.duplicateReason=dup.reason;duplicates++;
            }else{
              const maxQueue=boundedInt(m.settings.maxQueue,30,300,120);
              if(pendingCount(m)>=maxQueue){
                budgetSkipped++;
                markSeen(m,url);
                log(m,'queue-full','صف بررسی پر است؛ خبر جدید بدون حذف آیتم‌های در انتظار وارد صف نشد',{sourceId:source.id,url,maxQueue});
                continue;
              }
              queued++;
            }
            m.queue.unshift(c);
            trimQueuePreservingPending(m,m.settings.maxQueue);
            markSeen(m,url);
          }catch(err){
            errors++;
            source.lastError=String(err.message||err).slice(0,240);
            log(m,'error','خطا در دریافت جزئیات خبر',{sourceId:source.id,url,error:source.lastError});
          }
        }
        if(newestSeenPublishedMs>sourceWatermarkMs)source.latestSeenPublishedAt=new Date(newestSeenPublishedMs).toISOString();
        else if(!source.latestSeenPublishedAt)source.latestSeenPublishedAt=source.lastCheckedAt;
        source.initializedAt=source.initializedAt||now();
        source.lastSuccessAt=now();
      }catch(err){errors++;source.lastError=String(err.message||err).slice(0,240);log(m,'error','خطا در رصد منبع',{sourceId:source.id,error:source.lastError});}
    }
    m.lastRunAt=now();m.lastRunResult={discovered,queued,duplicates,filtered,stale,baseline,errors,budgetSkipped,detailFetches,activeSources:runSources.map(s=>s.id),durationMs:Date.now()-started};log(m,'run','چرخه رصد کامل شد',m.lastRunResult);save(db);
    if(m.settings.autoPublish){
      let capacity=Math.max(0,boundedInt(m.settings.maxPerHour,1,30,4)-importedLastHour(db));
      const ids=selectPublishIds(db,m,capacity);
      save(db);
      for(const qid of ids){if(capacity<=0)break;const result=await publishCandidate(qid);if(result.ok)capacity--;}
    }
    return {ok:true,...m.lastRunResult,pending:pendingCount(m)};
  }finally{running=false;}
}
async function tick(){
  const db=load(),m=ensure(db);if(!m.settings.enabled)return {ok:false,reason:'disabled'};
  const interval=boundedInt(m.settings.intervalMinutes,5,1440,240)*60*1000,last=m.lastRunAt?new Date(m.lastRunAt).getTime():0;
  if(last&&Date.now()-last<interval)return {ok:false,reason:'not-due'};return run();
}
function saveSettings(f){const db=load(),m=ensure(db);m.settings.enabled=f.enabled==='1';m.settings.autoPublish=f.autoPublish==='1';m.settings.socialDistribution=f.socialDistribution==='1';m.settings.intervalMinutes=boundedInt(f.intervalMinutes,5,1440,240);m.settings.maxPerHour=boundedInt(f.maxPerHour,1,30,2);m.settings.maxQueue=boundedInt(f.maxQueue,30,300,120);m.settings.maxAgeHours=boundedInt(f.maxAgeHours,1,336,6);m.settings.keywords=String(f.keywords||DEFAULT_SETTINGS.keywords).trim().slice(0,1500);save(db);return clone(m.settings);}
function addSource(f){
  const db=load(),m=ensure(db),url=canonicalUrl(String(f.url||''),String(f.url||''));if(!url)throw new Error('invalid-source-url');
  const name=String(f.name||'منبع جدید').trim().slice(0,120)||'منبع جدید',sid='src-'+crypto.createHash('sha1').update(url).digest('hex').slice(0,10),existing=m.sources.find(x=>x.id===sid||canonicalUrl(x.url,x.url)===url);
  if(existing){existing.name=name;existing.enabled=true;existing.url=url;save(db);return existing;}
  const scope=['national','kerman','jiroft','local','country','world'].includes(f.scope)?f.scope:'local';
  const topic=['local','politics','social','technology','world','general'].includes(f.topic)?f.topic:(scope==='world'?'world':scope==='country'?'general':'local');
  const sourceType=['rss','telegram'].includes(f.type)?f.type:'html';
  const source={id:sid,name,url,type:sourceType,scope,topic,enabled:true,lastCheckedAt:null,lastSuccessAt:null,lastError:''};m.sources.push(source);save(db);return source;
}
function toggleSource(sourceId){const db=load(),m=ensure(db),s=sourceById(m,sourceId);if(!s)return false;s.enabled=!s.enabled;save(db);return s.enabled;}
function deleteSource(sourceId){const db=load(),m=ensure(db);m.sources=m.sources.filter(x=>x.id!==sourceId);save(db);return true;}
function rejectCandidate(candidateId){const db=load(),m=ensure(db),c=m.queue.find(x=>x.id===candidateId);if(!c)return false;c.status='rejected';c.updatedAt=now();save(db);return true;}
function snapshot(db){
  const m=ensure(db);
  return {settings:clone(m.settings),sources:clone(m.sources),queue:clone(m.queue.slice(0,40)),logs:clone(m.logs.slice(0,20)),lastRunAt:m.lastRunAt,lastRunResult:clone(m.lastRunResult),counts:{pending:m.queue.filter(x=>x.status==='pending').length,published:m.queue.filter(x=>x.status==='published').length,duplicate:m.queue.filter(x=>x.status==='duplicate').length,rejected:m.queue.filter(x=>x.status==='rejected').length,sourcesOn:m.sources.filter(x=>x.enabled).length,sources:m.sources.length}};
}
module.exports={ensure,snapshot,run,tick,saveSettings,addSource,toggleSource,deleteSource,rejectCandidate,publishCandidate,_test:{canonicalUrl,parseFeed,parseListHtml,parseTelegramPage,telegramLooksLikeAd,blockedMonitoredContentReason,candidateQualityReason,extractArticle,titleSimilarity,textContainmentSimilarity,sameEventDuplicate,isTelegramCandidate,telegramPublishedRecently,fingerprint,categoryFromText,guessCategory,guessLocation,freshness,hasKeyword,relevant,tierForSource,topicForSource,desiredMix,sourcesForRun,selectPublishIds}};
