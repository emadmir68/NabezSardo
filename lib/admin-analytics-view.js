const {e,fmt}=require('./view-common');

function dayLabel(v){
  try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'short',day:'numeric',timeZone:'Asia/Tehran'}).format(new Date(v+'T12:00:00Z'))}
  catch{return v||''}
}
function tehranDay(iso){
  if(!iso)return '';
  try{
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(iso));
    const p=Object.fromEntries(parts.filter(function(x){return x.type!=='literal'}).map(function(x){return [x.type,x.value]}));
    return p.year+'-'+p.month+'-'+p.day;
  }catch{return String(iso).slice(0,10)}
}
function pathLabel(pathname,db){
  pathname=String(pathname||'');
  if(pathname==='/')return 'صفحه اصلی';
  if(pathname==='/all-news')return 'آرشیو اخبار';
  if(pathname==='/search')return 'جستجو';
  if(pathname==='/about')return 'درباره ما';
  if(pathname==='/contact')return 'تماس با ما';
  if(pathname==='/send-news')return 'ارسال خبر مردمی';
  if(pathname.indexOf('/local/')===0){const k=pathname.slice('/local/'.length);return k==='jiroft'?'اخبار جیرفت':k==='sardouiyeh'?'اخبار ساردوئیه':k==='south-kerman'?'اخبار جنوب کرمان':'اخبار محلی';}
  if(pathname.indexOf('/category/')===0){
    const id=decodeURIComponent(pathname.slice('/category/'.length));
    const c=db.categories.find(function(x){return x.id===id});
    return c?'دسته: '+c.name:'صفحه دسته‌بندی';
  }
  if(pathname.indexOf('/news/')===0){
    const slug=decodeURIComponent(pathname.slice('/news/'.length));
    const a=db.articles.find(function(x){return x.slug===slug});
    return a?a.title:'صفحه خبر';
  }
  return pathname;
}
function num(v){return Number(v||0).toLocaleString('fa-IR')}
function analyticsPanel(db,articles,traffic){
  traffic=traffic||{};
  const published=articles.filter(function(x){return x.status==='published'});
  const today=traffic.today||{pageViews:0,visitors:0,googleEntrances:0,externalEntrances:0,directEntrances:0};
  const seven=traffic.sevenDays||{pageViews:0,visitors:0,googleEntrances:0};
  const trend=Array.isArray(traffic.days)?traffic.days:[];
  const maxTrend=Math.max.apply(null,[1].concat(trend.map(function(x){return Number(x.pageViews||0)})));
  const todayPublished=published.filter(function(x){return tehranDay(x.publishedAt||x.createdAt)===traffic.todayKey}).length;
  const topArticles=published.slice().sort(function(x,y){return Number(y.views||0)-Number(x.views||0)}).slice(0,5);
  const topPaths=Array.isArray(traffic.topPaths)?traffic.topPaths.slice(0,5):[];
  const googleShare=today.pageViews?Math.round(Number(today.googleEntrances||0)*100/Number(today.pageViews||1)):0;
  const sources=today.sources||{};
  const telegram=Number(sources.telegram||0),rubika=Number(sources.rubika||0),whatsapp=Number(sources.whatsapp||0);
  const socialEntrances=telegram+rubika+whatsapp;
  const otherExternal=Math.max(0,Number(today.externalEntrances||0)-Number(today.googleEntrances||0)-socialEntrances);

  const yesterday=trend.length>1?trend[trend.length-2]:{pageViews:0,visitors:0,googleEntrances:0};
  let tehranHour=12;
  let tehranMinute=0;
  try{
    const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).filter(function(x){return x.type!=='literal'}).map(function(x){return [x.type,x.value]}));
    tehranHour=Number(p.hour||12);tehranMinute=Number(p.minute||0);
  }catch{}
  const elapsedHours=Math.max(1,tehranHour+tehranMinute/60);
  const todayHourly=Number(today.pageViews||0)/elapsedHours;
  const yesterdayHourly=Number(yesterday.pageViews||0)/24;
  const paceDelta=yesterdayHourly>0?Math.round((todayHourly-yesterdayHourly)*100/yesterdayHourly):null;
  const pacePositive=paceDelta!==null&&paceDelta>=0;
  const articlePaths=topPaths.filter(function(x){return String(x.path||'').indexOf('/news/')===0});
  const hotPath=articlePaths[0]||null;
  const hotArticle=hotPath?db.articles.find(function(x){return '/news/'+encodeURIComponent(x.slug)===hotPath.path||'/news/'+x.slug===hotPath.path}):null;
  const hotShare=today.pageViews&&hotPath?Math.round(Number(hotPath.views||0)*100/Number(today.pageViews||1)):0;

  const insights=[];
  if(todayPublished===0)insights.push({tone:'warn',icon:'✎',title:'امروز هنوز خبر تازه‌ای منتشر نشده',text:'برای حفظ ریتم صفحه اصلی، یک خبر مهم یا گزارش کوتاه امروز را منتشر کن.'});
  if(paceDelta!==null&&paceDelta<=-25)insights.push({tone:'warn',icon:'↘',title:'ریتم بازدید امروز پایین‌تر است',text:'سرعت بازدید ساعتی حدود '+num(Math.abs(paceDelta))+'٪ از میانگین دیروز کمتر است؛ خبر داغ را دوباره در شبکه‌ها توزیع کن.'});
  else if(paceDelta!==null&&paceDelta>=25)insights.push({tone:'good',icon:'↗',title:'شتاب بازدید امروز خوب است',text:'ریتم بازدید ساعتی حدود '+num(paceDelta)+'٪ بالاتر از میانگین دیروز است؛ روی موضوعات پربازدید امروز خبر تکمیلی بساز.'});
  if(Number(today.pageViews||0)>=10&&googleShare<10)insights.push({tone:'info',icon:'G',title:'سهم گوگل هنوز پایین است',text:'تیتر و لید خبرهای امروز را با کلیدواژه‌های دقیق محلی و نام شهر/موضوع واضح‌تر کن.'});
  else if(googleShare>=25)insights.push({tone:'good',icon:'G',title:'ورودی گوگل قابل‌توجه است',text:'موضوعاتی که امروز از گوگل ورودی گرفته‌اند ارزش پوشش تکمیلی و لینک داخلی بیشتر دارند.'});
  if(Number(today.pageViews||0)>=10&&socialEntrances===0)insights.push({tone:'info',icon:'↗',title:'ورودی شبکه‌های اجتماعی ثبت نشده',text:'خبر برتر امروز را یک‌بار با لینک مستقیم در تلگرام و روبیکا بازنشر کن.'});
  if(hotPath&&hotShare>=40)insights.push({tone:'hot',icon:'●',title:'یک خبر موتور اصلی بازدید امروز است',text:(hotArticle?hotArticle.title:'خبر اول امروز')+' حدود '+num(hotShare)+'٪ از بازدید امروز را گرفته؛ خبر مرتبط یا ادامه‌دار برایش منتشر کن.'});
  if(!insights.length)insights.push({tone:'good',icon:'✓',title:'وضعیت امروز متعادل است',text:'نشانه غیرعادی مهمی در داده‌های امروز دیده نمی‌شود؛ انتشار منظم را ادامه بده.'});
  const smartInsights=insights.slice(0,4).map(function(x){return '<div class="smart-insight '+x.tone+'"><span>'+e(x.icon)+'</span><div><b>'+e(x.title)+'</b><small>'+e(x.text)+'</small></div></div>';}).join('');

  const bars=trend.map(function(d){
    const height=Math.max(3,Math.round(Number(d.pageViews||0)*100/maxTrend));
    return '<div class="analytics-bar-col" title="'+e(d.date)+' · '+num(d.pageViews)+' بازدید"><b>'+num(d.pageViews)+'</b><div class="analytics-bar-track"><i style="height:'+height+'%"></i></div><small>'+e(dayLabel(d.date))+'</small></div>';
  }).join('')||'<div class="analytics-empty">داده روزانه هنوز ثبت نشده است.</div>';

  const topArticleRows=topArticles.map(function(x,i){
    const cat=db.categories.find(function(c){return c.id===x.categoryId});
    return '<a href="/news/'+encodeURIComponent(x.slug)+'" target="_blank" rel="noopener"><span class="rank-no">'+String(i+1).padStart(2,'0')+'</span><div><b>'+e(x.title)+'</b><small>'+e(cat?cat.name:'خبر')+'</small></div><strong>◉ '+num(x.views)+'</strong></a>';
  }).join('')||'<div class="analytics-empty">هنوز خبر منتشرشده‌ای وجود ندارد.</div>';

  const topPathRows=topPaths.map(function(x,i){
    return '<a href="'+e(x.path)+'" target="_blank" rel="noopener"><span class="rank-no">'+String(i+1).padStart(2,'0')+'</span><div><b>'+e(pathLabel(x.path,db))+'</b><small dir="ltr">'+e(x.path)+'</small></div><strong>'+num(x.views)+'</strong></a>';
  }).join('')||'<div class="analytics-empty">اولین بازدیدهای واقعی از این لحظه در این بخش ثبت می‌شوند.</div>';

  return '<section class="analytics-dashboard">'+
    '<div class="analytics-head"><div><span class="eyebrow">REAL-TIME / FIRST-PARTY ANALYTICS</span><h2>آمار واقعی نبض ساردو</h2><p>آمار مستقیم از بازدیدهای سایت؛ ربات‌ها و خزنده‌ها در این اعداد محاسبه نمی‌شوند.</p></div><div class="analytics-live"><span></span><b>LIVE</b><small>آخرین ثبت: '+(traffic.updatedAt?e(fmt(traffic.updatedAt)):'هنوز بازدیدی ثبت نشده')+'</small></div></div>'+
    '<div class="smart-desk">'+
      '<div class="smart-desk-head"><div><span class="eyebrow">SMART NEWSROOM DESK</span><h3>دستیار هوشمند تحریریه</h3><p>تحلیل خودکار بر پایه آمار واقعی امروز؛ بدون عددسازی و بدون تغییر در سایت عمومی.</p></div><span class="smart-status"><i></i> تحلیل زنده</span></div>'+
      '<div class="smart-signals">'+
        '<div class="smart-signal '+(paceDelta===null?'neutral':pacePositive?'good':'warn')+'"><small>شتاب بازدید امروز</small><strong>'+(paceDelta===null?'—':(paceDelta>0?'+':'')+num(paceDelta)+'٪')+'</strong><em>نسبت به میانگین ساعتی دیروز</em></div>'+
        '<div class="smart-signal"><small>سهم گوگل</small><strong>'+num(googleShare)+'٪</strong><em>'+num(today.googleEntrances)+' ورودی امروز</em></div>'+
        '<div class="smart-signal"><small>ورودی شبکه‌ها</small><strong>'+num(socialEntrances)+'</strong><em>تلگرام، روبیکا و واتس‌اپ</em></div>'+
        '<div class="smart-signal hot"><small>خبر داغ امروز</small><strong>'+(hotPath?num(hotPath.views):'—')+'</strong><em>'+(hotArticle?e(hotArticle.title):'هنوز داده کافی نیست')+'</em></div>'+
      '</div>'+
      '<div class="smart-insights"><div class="smart-insights-title"><b>اقدام‌های پیشنهادی همین الآن</b><small>بر اساس الگوی ترافیک و انتشار امروز</small></div>'+smartInsights+'</div>'+
    '</div>'+
    '<div class="analytics-kpis">'+
      '<div class="analytics-kpi primary"><span class="analytics-kpi-icon">◉</span><small>بازدید امروز</small><strong>'+num(today.pageViews)+'</strong><em>'+num(today.visitors)+' بازدیدکننده تقریبی یکتا</em></div>'+
      '<div class="analytics-kpi google"><span class="analytics-kpi-icon">G</span><small>ورودی گوگل امروز</small><strong>'+num(today.googleEntrances)+'</strong><em>'+num(googleShare)+'٪ از بازدیدهای امروز</em></div>'+
      '<div class="analytics-kpi"><span class="analytics-kpi-icon">7D</span><small>بازدید ۷ روز اخیر</small><strong>'+num(seven.pageViews)+'</strong><em>'+num(seven.googleEntrances)+' ورودی گوگل</em></div>'+
      '<div class="analytics-kpi published"><span class="analytics-kpi-icon">✓</span><small>خبرهای منتشرشده</small><strong>'+num(published.length)+'</strong><em>'+num(todayPublished)+' خبر منتشرشده امروز</em></div>'+
    '</div>'+
    '<div class="analytics-grid">'+
      '<div class="analytics-card analytics-trend"><div class="analytics-card-head"><div><b>روند بازدید ۷ روزه</b><small>Page views</small></div><span>'+num(seven.pageViews)+' بازدید</span></div><div class="analytics-bars">'+bars+'</div></div>'+
      '<div class="analytics-card analytics-sources"><div class="analytics-card-head"><div><b>منابع ورودی امروز</b><small>Traffic sources</small></div></div>'+
        '<div class="source-row"><span><i class="source-dot google"></i>Google</span><b>'+num(today.googleEntrances)+'</b></div>'+
        '<div class="source-row"><span><i class="source-dot external"></i>Telegram</span><b>'+num(telegram)+'</b></div>'+
        (rubika?'<div class="source-row"><span><i class="source-dot external"></i>Rubika</span><b>'+num(rubika)+'</b></div>':'')+
        (whatsapp?'<div class="source-row"><span><i class="source-dot external"></i>WhatsApp</span><b>'+num(whatsapp)+'</b></div>':'')+
        '<div class="source-row"><span><i class="source-dot external"></i>سایر سایت‌ها و شبکه‌ها</span><b>'+num(otherExternal)+'</b></div>'+
        '<div class="source-row"><span><i class="source-dot direct"></i>ورودی مستقیم</span><b>'+num(today.directEntrances)+'</b></div>'+
        '<p class="analytics-note">ورودی گوگل بر اساس Referrer واقعی مرورگر ثبت می‌شود؛ Search Console عددهای خودش را جداگانه گزارش می‌کند.</p></div>'+
    '</div>'+
    '<div class="analytics-grid lower">'+
      '<div class="analytics-card"><div class="analytics-card-head"><div><b>پربازدیدترین خبرها</b><small>All-time article views</small></div></div><div class="analytics-rank-list">'+topArticleRows+'</div></div>'+
      '<div class="analytics-card"><div class="analytics-card-head"><div><b>صفحات پربازدید امروز</b><small>Today</small></div></div><div class="analytics-rank-list compact">'+topPathRows+'</div></div>'+
    '</div>'+
    '<div class="analytics-foot"><span>شروع ثبت Analytics: '+(traffic.startedAt?e(fmt(traffic.startedAt)):'اکنون')+'</span><span>ذخیره‌سازی داخلی روی سرور · بدون عددسازی</span></div>'+
  '</section>';
}
module.exports={analyticsPanel};
