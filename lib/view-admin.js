const {e,fmt,shell,logo,oldBody,imageRatio,imageOrientation}=require('./view-common');
const {analyticsPanel}=require('./admin-analytics-view');
const social=require('./social');

function login(error=false){return shell('ورود تحریریه | نبض ساردو',`<main class="login"><div class="loginbox">${logo()}<h1>ورود تحریریه</h1>${error?'<div class="error">اطلاعات ورود نادرست است.</div>':''}<form method="post"><label>نام کاربری<input name="username" required></label><label>رمز عبور<input type="password" name="password" required></label><button class="btn primary">ورود</button></form></div></main>`);}

function statusLabel(v){
  if(v==='published')return 'منتشرشده';
  if(v==='scheduled')return 'زمان‌بندی‌شده';
  return 'پیش‌نویس';
}
function followupAdminStatus(x){
  const s=String(x?.status||'announced');
  if(!['completed','closed'].includes(s)&&x?.deadline){
    const t=new Date(String(x.deadline)+'T23:59:59+03:30').getTime();
    if(Number.isFinite(t)&&Date.now()>t)return ['overdue','موعد گذشته'];
  }
  return {announced:['announced','اعلام شد'],started:['started','شروع شد'],progress:['progress','در حال اجرا'],completed:['completed','تکمیل شد'],paused:['paused','متوقف / در انتظار'],closed:['closed','مختومه']}[s]||['announced','اعلام شد'];
}
function integrationCard(name,on,note){
  return `<div class="integration-card ${on?'ready':'off'}"><b>${name}</b><span>${on?'آماده انتشار خودکار':'نیاز به تنظیم اتصال'}</span>${note?`<small>${note}</small>`:''}</div>`;
}
function admin(db,backups=[],params=new URLSearchParams(),integrations={},traffic={}){
 const a=[...db.articles].sort((x,y)=>new Date(y.createdAt)-new Date(x.createdAt));
 const followups=[...(db.followups||[])].sort((x,y)=>new Date(y.updatedAt||y.createdAt)-new Date(x.updatedAt||x.createdAt));
 const msg=params.get('followupSaved')==='1'?'<div class="success">پرونده پیگیری ذخیره شد و روی سایت اعمال شد.</div>':params.get('followupDeleted')==='1'?'<div class="success">پرونده پیگیری حذف شد.</div>':params.get('adSaved')==='1'?'<div class="success">تبلیغ ذخیره شد و روی صفحه اصلی اعمال شد.</div>':params.get('adError')==='1'?'<div class="error">ذخیره تبلیغ انجام نشد؛ فرمت یا حجم تصویر را بررسی کنید.</div>':params.get('breakingSaved')==='1'?'<div class="success">متن نبض فوری ذخیره شد و روی سایت اعمال شد.</div>':params.get('backup')==='1'?'<div class="success">نسخه پشتیبان دستی ساخته شد.</div>':params.get('restored')==='1'?'<div class="success">نسخه پشتیبان با موفقیت بازیابی شد.</div>':params.get('restoreError')==='1'?'<div class="error">فایل پشتیبان معتبر نبود و بازیابی انجام نشد.</div>':'';
 return shell('مدیریت | نبض ساردو',`<div class="adminbar">${logo()}<a href="/">مشاهده سایت</a><a href="/admin/logout">خروج</a></div><main class="wrap admin">${msg}
 <div class="admin-dashboard-shell"><aside class="admin-sidebar"><div class="admin-sidebar-head"><span class="eyebrow">NEWSROOM</span><b>مدیریت تحریریه</b><small>نبض ساردو</small></div><nav class="admin-sidebar-nav" aria-label="بخش‌های مدیریت"><a href="#overview"><span>نمای کلی</span></a><a href="#news"><span>مدیریت خبرها</span><i>${a.length}</i></a><a href="#followups"><span>پیگیری تا نتیجه</span><i>${followups.length}</i></a><a href="#live"><span>نبض فوری</span></a><a href="#ads"><span>تبلیغات</span></a><a href="#social"><span>شبکه‌های اجتماعی</span></a><a href="#citizens"><span>خبرهای مردمی</span><i>${db.citizens.length}</i></a><a href="#messages"><span>پیام‌ها</span><i>${db.contacts.length}</i></a><a href="#backup"><span>پشتیبان‌گیری</span></a></nav><details class="admin-mobile-navigation"><summary>بخش‌های مدیریت <span>باز کردن منو</span></summary><nav aria-label="بخش‌های مدیریت در موبایل"><a href="#overview">نمای کلی</a><a href="#news">مدیریت خبرها</a><a href="#followups">پیگیری تا نتیجه</a><a href="#live">نبض فوری</a><a href="#ads">تبلیغات</a><a href="#social">شبکه‌های اجتماعی</a><a href="#citizens">خبرهای مردمی</a><a href="#messages">پیام‌ها</a><a href="#backup">پشتیبان‌گیری</a></nav></details><small class="admin-nav-hint">برای دیدن بخش‌های دیگر، منو را به چپ بکشید ←</small><a class="admin-sidebar-site" href="/">مشاهده سایت</a></aside><div class="admin-dashboard-content"><div class="admin-welcome"><div><h1>داشبورد تحریریه</h1></div><a class="btn primary" href="/admin/articles/new">+ خبر جدید</a></div>
 <section id="overview" class="admin-section-block admin-overview"><div class="admin-section-title"><div><span class="admin-section-no">01</span><div><h2>نمای کلی</h2></div></div></div><div class="stats editorial-stats admin-summary-stats"><div><b>${a.length}</b><span>کل خبرها</span></div><div><b>${a.filter(x=>x.status==='published').length}</b><span>منتشرشده</span></div><div><b>${a.filter(x=>x.status==='scheduled').length}</b><span>زمان‌بندی‌شده</span></div><div><b>${db.citizens.length}</b><span>خبر مردمی</span></div></div><details class="admin-fold analytics-fold" open><summary><span><b>داشبورد هوشمند و عملکرد سایت</b><small>تحلیل زنده، پیشنهاد تحریریه، منابع ورودی و صفحات پربازدید</small></span><strong>باز و بسته کردن گزارش</strong></summary><div class="admin-fold-body">${analyticsPanel(db,a,traffic)}</div></details>
 </section>



 <section id="followups" class="panel admin-section-block followup-admin-panel">
  <div class="admin-section-title compact"><div><span class="admin-section-no">02</span><div><h2>پیگیری تا نتیجه</h2><p>ثبت و بروزرسانی وعده‌ها، پروژه‌ها و مسائل عمومی تا رسیدن به نتیجه</p></div></div><a class="btn gold" href="/admin/followups/new">+ پرونده جدید</a></div>
  <div class="followup-admin-summary">
    <span><b>${followups.length.toLocaleString('fa-IR')}</b><small>کل پرونده‌ها</small></span>
    <span><b>${followups.filter(x=>!['completed','closed'].includes(followupAdminStatus(x)[0])).length.toLocaleString('fa-IR')}</b><small>باز</small></span>
    <span><b>${followups.filter(x=>followupAdminStatus(x)[0]==='completed').length.toLocaleString('fa-IR')}</b><small>تکمیل‌شده</small></span>
  </div>
  <div class="admin-scroll-list followup-admin-list">${followups.map(x=>{const s=followupAdminStatus(x);return `<div class="adminrow followup-admin-row"><div><span class="followup-admin-state" data-status="${e(s[0])}">${e(s[1])}</span><b>${e(x.title)}</b><small>${e(x.promisor||'بدون نام اعلام‌کننده')}${x.location?' · '+e(x.location):''}${x.deadline?' · موعد: '+e(x.deadline):''}</small></div><div><a href="/admin/followups/${x.id}/edit">ویرایش</a><form method="post" action="/admin/followups/${x.id}/delete" data-confirm="این پرونده پیگیری حذف شود؟"><button>حذف</button></form></div></div>`}).join('')||'<p>هنوز پرونده‌ای ثبت نشده است.</p>'}</div>
 </section>

 <section id="live" class="panel breaking-admin-panel admin-section-block"><div class="panel-head"><div><h2>LIVE DESK / نبض فوری</h2><p>وضعیت میز خبر زنده، متن فوری و زمان آخرین به‌روزرسانی را از همین بخش کنترل کن.</p></div><div class="live-desk-admin-state ${db.settings?.liveDeskEnabled!==false?'on':'off'}"><i></i><div><b>${db.settings?.liveDeskEnabled!==false?'LIVE DESK فعال':'LIVE DESK خاموش'}</b><small>${db.settings?.breakingUpdatedAt?'آخرین تغییر: '+fmt(db.settings.breakingUpdatedAt):'هنوز زمان تغییر ثبت نشده'}</small></div></div></div>
 <form method="post" action="/admin/settings/breaking" class="form breaking-admin-form">
   <label class="live-desk-toggle"><input type="checkbox" name="liveDeskEnabled" value="1" ${db.settings?.liveDeskEnabled!==false?'checked':''}><span><b>فعال بودن LIVE DESK روی سایت</b><small>وقتی خاموش باشد، نوار خبر فوری وارد حالت آرام و خاکستری می‌شود.</small></span></label>
   <label>متن فارسی<textarea name="breakingText" maxlength="500" required>${e(db.settings?.breakingText||'مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.')}</textarea></label>
   <label>متن انگلیسی <small>اختیاری</small><textarea name="breakingTextEn" dir="ltr" maxlength="500">${e(db.settings?.breakingTextEn||'Top local developments from Sardouiyeh and South Kerman — fast, accurate and local.')}</textarea></label>
   <button class="btn gold">ذخیره وضعیت LIVE DESK</button>
 </form></section>

 <section id="ads" class="panel ad-admin-panel admin-section-block">
   <div class="panel-head"><div><h2>مدیریت تبلیغات</h2><p>عکس، عنوان، متن و لینک تبلیغ را اینجا وارد کن؛ سایت خودش آن را داخل جایگاه متحرک صفحه اصلی فیکس می‌کند.</p></div></div>
   <form method="post" action="/admin/settings/ad" enctype="multipart/form-data" class="form ad-admin-form">
     <label class="ad-enable-row"><input type="checkbox" name="adEnabled" value="1" ${db.settings?.adEnabled!==false?'checked':''}> نمایش تبلیغ در صفحه اصلی</label>
     <div class="ad-admin-grid">
       <div>
         <label>عنوان تبلیغ<input name="adTitle" maxlength="120" value="${e(db.settings?.adTitle||'جای تبلیغات شما اینجاست')}" required></label>
         <label>متن تبلیغ<textarea name="adText" maxlength="300">${e(db.settings?.adText||'برای رزرو این جایگاه با نبض ساردو در ارتباط باشید')}</textarea></label>
         <label>لینک مقصد <small>مثلاً /contact یا https://...</small><input name="adLink" dir="ltr" maxlength="500" value="${e(db.settings?.adLink||'/contact')}"></label>
       </div>
       <div>
         <label>عنوان انگلیسی <small>اختیاری</small><input name="adTitleEn" dir="ltr" maxlength="120" value="${e(db.settings?.adTitleEn||'Your ad could be here')}"></label>
         <label>متن انگلیسی <small>اختیاری</small><textarea name="adTextEn" dir="ltr" maxlength="300">${e(db.settings?.adTextEn||'Contact Nabez Sardo to reserve this placement')}</textarea></label>
         <label class="ad-upload-label">عکس تبلیغ<input type="file" name="adImage" accept="image/jpeg,image/png,image/webp,image/gif"></label>
         <small class="ad-help">هر نسبت تصویری مجاز است؛ عکس بدون کشیدگی و بدون کراپ مخرب داخل قاب تبلیغ قرار می‌گیرد.</small>
       </div>
     </div>
     ${db.settings?.adImage?`<div class="ad-current-preview"><img src="${e(db.settings.adImage)}" alt="تبلیغ فعلی"><label><input type="checkbox" name="removeAdImage" value="1"> حذف عکس فعلی و بازگشت به گرافیک متحرک پیش‌فرض</label></div>`:''}
     <button class="btn gold">ذخیره و اعمال تبلیغ</button>
   </form>
 </section>

 <section id="social" class="panel integrations-panel admin-section-block"><div class="panel-head"><div><h2>انتشار هم‌زمان شبکه‌ها</h2><p>وقتی خبر منتشر شود — فوری یا زمان‌بندی‌شده — ارسال شبکه‌ها هم اجرا می‌شود. نتیجه هر شبکه داخل خود خبر ثبت می‌شود.</p></div></div><div class="integration-grid">
 ${integrationCard('تلگرام',integrations.telegram,'Bot + Channel')}
 ${integrationCard('روبیکا',integrations.rubika,'Bot API + Chat/Channel ID')}
 ${integrationCard('WhatsApp Business',integrations.whatsapp,'Cloud API؛ برای گیرنده‌های مجاز')}
 ${integrationCard('لینک عمومی سایت',integrations.baseUrl,'برای لینک‌دادن به خبر')}
 </div><p class="integration-note">برای فعال شدن هر شبکه، توکن و شناسه مقصد فقط داخل Variables امن Railway ذخیره می‌شود، نه داخل کد یا دیتابیس سایت.</p></section>

 <section id="backup" class="panel backup-panel admin-section-block"><div class="panel-head"><div><h2>پشتیبان‌گیری</h2><p>قبل از تغییرات مهم، بکاپ خودکار روزانه ساخته می‌شود. نسخه کامل شامل خبرها و تصاویر را هم می‌توانی دانلود کنی.</p></div><div class="actions"><a class="btn gold" href="/admin/backup/download">دانلود پشتیبان کامل</a><form method="post" action="/admin/backup/create"><button class="btn ghost">ساخت پشتیبان دستی</button></form></div></div><div class="backup-list">${backups.slice(0,6).map(b=>`<span>${e(b.name)} <small>${fmt(b.updatedAt)}</small></span>`).join('')||'<span>هنوز پشتیبانی ساخته نشده است.</span>'}</div><form class="restore-form" method="post" action="/admin/backup/restore" enctype="multipart/form-data" data-confirm="بازیابی، داده‌های فعلی را با بکاپ جایگزین می‌کند. ادامه می‌دهید؟"><label>بازیابی نسخه کامل<input type="file" name="backupFile" accept=".json,application/json" required></label><button class="btn ghost">بازیابی پشتیبان</button></form></section>

 <details id="news" class="panel admin-section-block admin-news-panel admin-news-collapsible">
  <summary class="admin-news-summary">
    <div class="admin-news-summary-main">
      <span class="admin-section-no">05</span>
      <div><h2>مدیریت خبرها</h2><p>فهرست خبرها جمع شده؛ فقط در صورت نیاز بازش کن.</p></div>
    </div>
    <div class="admin-news-summary-stats">
      <span><b>${a.length.toLocaleString('fa-IR')}</b><small>کل</small></span>
      <span><b>${a.filter(x=>x.status==='published').length.toLocaleString('fa-IR')}</b><small>منتشرشده</small></span>
      <span><b>${a.filter(x=>x.status==='draft').length.toLocaleString('fa-IR')}</b><small>پیش‌نویس</small></span>
    </div>
    <span class="admin-news-toggle"><span class="admin-news-toggle-open">نمایش فهرست</span><span class="admin-news-toggle-close">بستن فهرست</span><i>⌄</i></span>
  </summary>
  <div class="admin-news-tools"><a class="btn primary" href="/admin/articles/new">+ خبر جدید</a><span>برای ویرایش یا حذف، فهرست زیر را باز نگه دار.</span></div>
  <div class="admin-scroll-list">${a.map(x=>`<div class="adminrow"><div><b>${e(x.title)}</b><small>${statusLabel(x.status)} · ${x.status==='scheduled'&&x.scheduledAt?'انتشار: '+fmt(x.scheduledAt):fmt(x.createdAt)} · ${Number(x.views||0).toLocaleString('fa-IR')} بازدید</small><small class="distribution-mini">${['telegram','rubika','whatsapp'].map(k=>{const s=x.distribution?.[k]?.status;return k+': '+(s==='sent'?'✓':s==='failed'?'خطا':s==='skipped'?'—':'…')}).join(' · ')}</small></div><div><a href="/admin/articles/${x.id}/edit">ویرایش</a>${x.status==='published'?`<a href="/admin/articles/${x.id}/share-kit">پکیج انتشار</a>`:''}<form method="post" action="/admin/articles/${x.id}/delete" data-confirm="این خبر حذف شود؟"><button>حذف</button></form></div></div>`).join('')||'<p>هنوز خبری ثبت نشده است.</p>'}</div>
 </details>
 <div class="gridadmin admin-inbox-grid"><section id="citizens" class="panel admin-section-block"><div class="admin-section-title compact"><div><span class="admin-section-no">06</span><div><h2>خبرهای مردمی</h2><p>گزارش‌ها و فایل‌های ارسال‌شده توسط مخاطبان</p></div></div></div>${db.citizens.slice(0,20).map(x=>`<details><summary>${e(x.headline)} — ${e(x.name)}</summary><p>${e(x.details)}</p><small>${e(x.phone)} · ${e(x.location)}</small>${x.rewardCard?`<div class="reward-card-admin"><b>شماره کارت جهت هدیه:</b><span>${e(String(x.rewardCard).replace(/(.{4})/g,'$1 ').trim())}</span></div>`:``}${x.mediaUrl?`<div class="citizen-media">${String(x.mediaType||'').startsWith('image/')?`<img src="${e(x.mediaUrl)}" alt="فایل خبر مردمی">`:String(x.mediaType||'').startsWith('video/')?`<video controls preload="metadata" src="${e(x.mediaUrl)}"></video>`:''}<a href="${e(x.mediaUrl)}" target="_blank" rel="noopener">باز کردن / دانلود فایل</a></div>`:x.mediaLink?`<p><a href="${e(x.mediaLink)}" target="_blank" rel="noopener">لینک قدیمی فایل</a></p>`:''}</details>`).join('')||'<p>موردی نیست.</p>'}</section><section id="messages" class="panel admin-section-block"><div class="admin-section-title compact"><div><span class="admin-section-no">07</span><div><h2>پیام‌ها</h2><p>پیام‌های دریافتی از فرم تماس</p></div></div></div>${db.contacts.slice(0,20).map(x=>`<details><summary>${e(x.subject)} — ${e(x.name)}</summary><p>${e(x.message)}</p><small>${e(x.contact)}</small></details>`).join('')||'<p>پیامی نیست.</p>'}</section></div></div></div></main>`);}

function followupEditor(db,x={},action='/admin/followups/new',title='پرونده جدید پیگیری'){
 const status=String(x.status||'announced');
 return shell(title+' | نبض ساردو',`<div class="adminbar">${logo()}<a href="/admin#followups">داشبورد</a><a href="/follow-up">صفحه عمومی</a></div><main class="wrap admin followup-editor-page">
 <div class="editor-heading"><div><span class="eyebrow">FOLLOW-UP DESK</span><h1>${e(title)}</h1><p>اطلاعات را دقیقاً مطابق منبع و اعلام رسمی ثبت کن؛ وضعیت بعداً قابل بروزرسانی است.</p></div></div>
 <form class="form followup-editor-form" method="post" action="${e(action)}">
 <label>عنوان کوتاه پرونده<input name="title" maxlength="180" value="${e(x.title||'')}" required placeholder="مثلاً: تکمیل آسفالت محور ..."></label>
 <label>اصل وعده / موضوع پیگیری<textarea name="promise" maxlength="1200" required placeholder="آنچه اعلام یا وعده شده، بدون تفسیر شخصی">${e(x.promise||'')}</textarea></label>
 <div class="twocol"><label>اعلام‌کننده / دستگاه<input name="promisor" maxlength="160" value="${e(x.promisor||'')}" placeholder="نام شخص یا دستگاه"></label><label>محدوده<input name="location" maxlength="120" value="${e(x.location||'')}" placeholder="ساردوئیه، جیرفت، ..."></label></div>
 <div class="twocol"><label>تاریخ اعلام<input type="date" name="promisedAt" value="${e(x.promisedAt||'')}"></label><label>موعد اعلام‌شده<input type="date" name="deadline" value="${e(x.deadline||'')}"><small>اگر موعد مشخصی اعلام نشده، خالی بگذار.</small></label></div>
 <label>وضعیت<select name="status"><option value="announced" ${status==='announced'?'selected':''}>اعلام شد</option><option value="started" ${status==='started'?'selected':''}>شروع شد</option><option value="progress" ${status==='progress'?'selected':''}>در حال اجرا</option><option value="completed" ${status==='completed'?'selected':''}>تکمیل شد</option><option value="paused" ${status==='paused'?'selected':''}>متوقف / در انتظار</option><option value="closed" ${status==='closed'?'selected':''}>مختومه</option></select></label>
 <label>آخرین وضعیت / توضیح بروزرسانی<textarea name="note" maxlength="1600" placeholder="آخرین اتفاق ثبت‌شده در پرونده">${e(x.note||'')}</textarea></label>
 <div class="twocol"><label>عنوان منبع<input name="sourceLabel" maxlength="160" value="${e(x.sourceLabel||'')}" placeholder="مثلاً: خبر مدیرکل راهداری"></label><label>لینک منبع<input name="sourceUrl" dir="ltr" maxlength="500" value="${e(x.sourceUrl||'')}" placeholder="/news/... یا https://..."></label></div>
 <label class="followup-featured-toggle"><input type="checkbox" name="featured" value="1" ${x.featured?'checked':''}><span><b>پیگیری ویژه</b><small>در صفحه اصلی با اولویت بالاتر نمایش داده شود.</small></span></label>
 <div class="editor-actions"><a class="btn ghost" href="/admin#followups">انصراف</a><button class="btn primary">ذخیره پرونده</button></div>
 </form></main>`);
}


function shareKit(db,a,params=new URLSearchParams()){
 const category=db.categories.find(x=>x.id===a.categoryId)||{};
 const pkg=a.shareKit||social.sharePackage({...a,categoryName:category.name||''});
 const dist=a.distribution||{};
 const state=(key,label)=>{
   const v=dist[key]||{},s=String(v.status||'pending');
   const text=s==='sent'?'ارسال شد':s==='failed'?'خطا':s==='skipped'?'تنظیم نشده':s==='disabled'?'غیرفعال':'در انتظار';
   return `<span class="share-kit-state" data-state="${e(s)}"><b>${e(label)}</b><small>${e(text)}</small></span>`;
 };
 const notice=params.get('resent')==='1'?'<div class="success">ارسال مجدد انجام شد و وضعیت شبکه‌ها بروزرسانی شد.</div>':'';
 return shell('پکیج انتشار | '+a.title+' | نبض ساردو',`<div class="adminbar">${logo()}<a href="/admin#news">داشبورد</a><a href="/admin/articles/${e(a.id)}/edit">ویرایش خبر</a></div><main class="wrap admin share-kit-page">${notice}
 <div class="share-kit-head"><div><span class="eyebrow">AUTO DISTRIBUTION KIT</span><h1>پکیج انتشار خبر</h1><p>${e(a.title)}</p></div><div class="share-kit-head-actions"><a class="btn ghost" href="/news/${encodeURIComponent(a.slug)}" target="_blank" rel="noopener">مشاهده خبر</a><form method="post" action="/admin/articles/${e(a.id)}/redistribute"><button class="btn gold">ارسال مجدد شبکه‌ها</button></form></div></div>
 <section class="share-kit-status panel"><div><h2>وضعیت انتشار خودکار</h2><p>پس از انتشار خبر، نتیجه هر شبکه اینجا ثبت می‌شود.</p></div><div class="share-kit-states">${state('telegram','تلگرام')}${state('rubika','روبیکا')}${state('whatsapp','واتس‌اپ')}</div></section>
 <div class="share-kit-grid">
   <section class="panel share-kit-story-panel">
     <div class="panel-head"><div><h2>استوری 9:16</h2><p>تصویر 1080×1920 با عکس، تیتر، دسته‌بندی و لینک کوتاه به‌صورت خودکار ساخته می‌شود.</p></div></div>
     <div class="share-kit-story"
       data-share-kit-story
       data-story-title="${e(pkg.story?.title||a.title||'')}"
       data-story-lead="${e(pkg.story?.lead||a.lead||'')}"
       data-story-category="${e(pkg.story?.category||category.name||'خبر')}"
       data-story-location="${e(pkg.story?.location||a.location||'')}"
       data-story-image="${e(pkg.story?.image||a.image||'')}"
       data-story-url="${e(pkg.story?.url||pkg.shortUrl||'')}">
       <div class="share-kit-story-preview" data-share-kit-story-preview><span>در حال ساخت استوری…</span></div>
       <div class="share-kit-story-actions"><button class="btn primary" type="button" data-share-kit-story-share disabled>اشتراک استوری</button><button class="btn ghost" type="button" data-share-kit-story-download disabled>ذخیره PNG</button></div>
     </div>
   </section>
   <section class="panel share-kit-copy-panel">
     <div class="share-kit-copy"><div><b>تلگرام</b><small>متن برندشده + لینک کوتاه</small></div><textarea readonly data-share-copy-text>${e(pkg.telegram||'')}</textarea><button type="button" data-share-copy>کپی متن تلگرام</button></div>
     <div class="share-kit-copy"><div><b>روبیکا</b><small>کپشن آماده تصویر</small></div><textarea readonly data-share-copy-text>${e(pkg.rubika||'')}</textarea><button type="button" data-share-copy>کپی متن روبیکا</button></div>
     <div class="share-kit-copy"><div><b>واتس‌اپ</b><small>تصویر/ویدئو + کپشن در صورت اتصال API</small></div><textarea readonly data-share-copy-text>${e(pkg.whatsapp||'')}</textarea><button type="button" data-share-copy>کپی متن واتس‌اپ</button></div>
     <div class="share-kit-short"><span>لینک کوتاه خبر</span><code>${e(pkg.shortUrl||'')}</code><button type="button" data-copy-value="${e(pkg.shortUrl||'')}">کپی لینک</button></div>
   </section>
 </div>
 </main>`,'پکیج انتشار خودکار خبر',{editorAssets:true,robots:'noindex,nofollow'});
}
function editorSeed(a){return a.bodyHtml||oldBody(a)||'<p><br></p>';}
function localDateTime(iso){
  if(!iso)return '';
  try{
    const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    return p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute;
  }catch{return ''}
}
function checked(v,def=false){return v===undefined?(def?'checked':''):(v?'checked':'');}
function editor(db,a={},action='/admin/articles/new',title='خبر جدید'){
 const gallery=Array.isArray(a.gallery)?a.gallery:[];
 return shell(title+' | نبض ساردو',`<div class="adminbar">${logo()}<a href="/admin">داشبورد</a></div><main class="wrap admin">
 <div class="editor-heading"><div><span class="eyebrow">EDITORIAL STUDIO</span><h1>${title}</h1></div><span class="editor-note">تصویر، ویدئو، عکس داخل متن و گالری همگی مستقیم از دستگاه آپلود می‌شوند.</span></div>
 <form class="form editor-form" method="post" action="${action}" enctype="multipart/form-data" data-rich-form>
 <label>عنوان<input name="title" value="${e(a.title||'')}" required></label>
 <label>اسلاگ <small>اختیاری؛ اگر خالی باشد خودکار ساخته می‌شود</small><input name="slug" value="${e(a.slug||'')}"></label>
 <label>دسته‌بندی<select name="categoryId">${db.categories.map(c=>`<option value="${c.id}" ${a.categoryId===c.id?'selected':''}>${e(c.name)}</option>`).join('')}</select></label>
 <label>لید خبر<textarea name="lead" placeholder="خلاصه کوتاه و جذاب خبر">${e(a.lead||'')}</textarea></label>

 <div class="editor-label">متن کامل خبر</div>
 <div class="rich-editor" data-editor>
   <div class="rich-toolbar" role="toolbar" aria-label="ابزار ویرایش متن">
    <button type="button" data-cmd="undo">↶</button><button type="button" data-cmd="redo">↷</button><span></span>
    <button type="button" data-cmd="bold"><b>B</b></button><button type="button" data-weight="300">نازک</button><button type="button" data-weight="400">عادی</button>
    <label class="rich-font-picker" title="انتخاب فونت فارسی"><span>فونت</span><select data-font-family>
      <option value="Vazirmatn">وزیرمتن</option>
      <option value="B Nazanin">B Nazanin</option>
      <option value="B Lotus">B Lotus</option>
      <option value="B Titr">B Titr</option>
      <option value="IranNastaliq">IranNastaliq</option>
    </select></label><span></span>
    <button type="button" data-cmd="italic"><i>I</i></button><button type="button" data-cmd="underline"><u>U</u></button><span></span>
    <button type="button" data-cmd="justifyRight">⇥ راست</button><button type="button" data-cmd="justifyCenter">وسط</button><button type="button" data-cmd="justifyLeft">چپ ⇤</button>
    <button type="button" data-dir="rtl">RTL</button><button type="button" data-dir="ltr">LTR</button><span></span>
    <button type="button" data-cmd="insertUnorderedList">• لیست</button><button type="button" data-cmd="insertOrderedList">1. لیست</button>
    <button type="button" data-insert-image>🖼 عکس داخل متن</button><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden data-inline-file>
    <button type="button" data-cmd="removeFormat">پاک‌کردن قالب</button>
   </div>
   <div class="upload-progress" hidden data-inline-status></div>
   <div class="rich-area" contenteditable="true" dir="rtl" data-rich-area>${editorSeed(a)}</div>
   <input type="hidden" name="bodyHtml" data-rich-input>
 </div>

 <div class="image-upload"><div><label class="upload-label">تصویر شاخص خبر<input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/gif" data-image-input></label><p>قالب تصویر به‌صورت هوشمند با نسبت واقعی عکس تنظیم می‌شود؛ افقی، عمودی یا مربعی.</p>
 <label class="auto-cover-toggle"><input type="checkbox" name="autoCover" value="1" ${a.autoCoverEnabled===false?'':'checked'}><span><b>اگر عکس نداشتم، کاور خودکار بساز</b><small>سیستم از روی تیتر، لید و دسته‌بندی یک کاور خبری ۱۲۰۰×۶۷۵ می‌سازد. عکس دستی همیشه اولویت دارد.</small></span></label>
 ${a.imageAuto?`<div class="auto-cover-current"><span>تصویر فعلی به‌صورت خودکار ساخته شده</span><small>${e(a.autoCoverTheme||'auto')}</small></div>`:''}
 ${a.image?`<label class="remove-image"><input type="checkbox" name="removeImage" value="1"> حذف تصویر فعلی</label>`:''}</div><div class="image-preview ${a.image?imageOrientation(a):''}" style="--preview-ratio:${a.image?imageRatio(a):16/9}" data-image-preview-frame>${a.image?`<img src="${e(a.image)}" alt="تصویر فعلی" data-image-preview>`:`<div class="preview-empty" data-preview-empty>اگر عکس انتخاب نکنی، بعد از ذخیره کاور خودکار اینجا قرار می‌گیرد.</div><img hidden alt="پیش‌نمایش" data-image-preview>`}</div></div>

 <div class="video-upload-panel">
   <div>
     <label class="upload-label">ویدئوی خبر
       <input type="file" name="videoFile" accept="video/mp4,video/webm,video/quicktime" data-video-input>
     </label>
     <p>فرمت‌های MP4، WebM و MOV پشتیبانی می‌شوند؛ حداکثر حجم فایل ۵۰ مگابایت.</p>
     ${a.videoUrl?`<label class="remove-image"><input type="checkbox" name="removeVideo" value="1"> حذف ویدئوی فعلی</label>`:''}
   </div>
   <div class="video-preview" data-video-preview-frame>
     ${a.videoUrl?`<video controls preload="metadata" src="${e(a.videoUrl)}" data-video-preview></video>`:`<div class="preview-empty" data-video-empty>اگر خبر فیلم دارد، فایل ویدئو را از اینجا انتخاب کن.</div><video hidden controls preload="metadata" data-video-preview></video>`}
   </div>
 </div>

 <div class="gallery-editor" data-gallery>
   <div class="gallery-head"><div><b>گالری خبر</b><p>چند عکس را هم‌زمان انتخاب کن؛ بعد از آپلود می‌توانی هر عکس را حذف کنی.</p></div><label class="btn ghost gallery-add">+ افزودن عکس<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden data-gallery-input></label></div>
   <div class="gallery-list" data-gallery-list>${gallery.map(url=>`<div class="gallery-item" data-url="${e(url)}"><img src="${e(url)}" alt=""><button type="button" data-gallery-remove>×</button></div>`).join('')}</div>
   <input type="hidden" name="galleryJson" value="${e(JSON.stringify(gallery))}" data-gallery-json>
   <div class="upload-progress" hidden data-gallery-status></div>
 </div>

 <div class="twocol"><label>خبرنگار<input name="author" value="${e(a.author||'تحریریه نبض ساردو')}"></label><label>محل<input name="location" value="${e(a.location||'')}" placeholder="مثلاً ساردوئیه، جیرفت، عنبرآباد، کهنوج"></label></div>
 <div class="twocol"><label>وضعیت<select name="status" data-status-select><option value="draft">پیش‌نویس</option><option value="scheduled" ${a.status==='scheduled'?'selected':''}>زمان‌بندی انتشار</option><option value="published" ${a.status==='published'?'selected':''}>انتشار فوری</option></select></label><label data-schedule-wrap ${a.status==='scheduled'?'':'hidden'}>زمان انتشار (ساعت ایران)<input type="datetime-local" name="scheduledAt" value="${e(localDateTime(a.scheduledAt))}"></label></div>
 <div class="twocol"><label>خبر ویژه<select name="featured"><option value="0">خیر</option><option value="1" ${a.featured?'selected':''}>بله</option></select></label><div></div></div>

 <div class="social-options"><b>انتشار هم‌زمان</b><label><input type="checkbox" name="socialTelegram" value="1" ${checked(a.socialTelegram,true)}> تلگرام</label><label><input type="checkbox" name="socialRubika" value="1" ${checked(a.socialRubika,true)}> روبیکا</label><label><input type="checkbox" name="socialWhatsApp" value="1" ${checked(a.socialWhatsApp,true)}> WhatsApp Business</label><small>با انتشار خبر، پکیج برندشده شبکه‌ها + لینک کوتاه ساخته می‌شود؛ شبکه‌ای که هنوز تنظیم نشده باشد فقط «تنظیم نشده» ثبت می‌شود.</small>${a.id&&a.status==='published'?`<a class="share-kit-inline-link" href="/admin/articles/${a.id}/share-kit">مشاهده پکیج انتشار این خبر ←</a>`:''} </div>

 <div class="editor-save-status" data-save-status aria-live="polite"></div><div class="editor-actions"><a class="btn ghost" href="/admin">انصراف</a><button class="btn primary" type="submit" data-save-news>ذخیره خبر</button></div>
 </form></main>`);}
module.exports={login,admin,editor,followupEditor,shareKit};
