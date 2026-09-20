const {e,fmt,shell,logo,oldBody,imageRatio,imageOrientation}=require('./view-common');

function login(error=false){return shell('ورود تحریریه | نبض ساردو',`<main class="login"><div class="loginbox">${logo()}<h1>ورود تحریریه</h1>${error?'<div class="error">اطلاعات ورود نادرست است.</div>':''}<form method="post"><label>نام کاربری<input name="username" required></label><label>رمز عبور<input type="password" name="password" required></label><button class="btn primary">ورود</button></form></div></main>`);}

function statusLabel(v){
  if(v==='published')return 'منتشرشده';
  if(v==='scheduled')return 'زمان‌بندی‌شده';
  return 'پیش‌نویس';
}
function integrationCard(name,on,note){
  return `<div class="integration-card ${on?'ready':'off'}"><b>${name}</b><span>${on?'آماده انتشار خودکار':'نیاز به تنظیم اتصال'}</span>${note?`<small>${note}</small>`:''}</div>`;
}
function admin(db,backups=[],params=new URLSearchParams(),integrations={}){
 const a=[...db.articles].sort((x,y)=>new Date(y.createdAt)-new Date(x.createdAt));
 const msg=params.get('backup')==='1'?'<div class="success">نسخه پشتیبان دستی ساخته شد.</div>':params.get('restored')==='1'?'<div class="success">نسخه پشتیبان با موفقیت بازیابی شد.</div>':params.get('restoreError')==='1'?'<div class="error">فایل پشتیبان معتبر نبود و بازیابی انجام نشد.</div>':'';
 return shell('مدیریت | نبض ساردو',`<div class="adminbar">${logo()}<a href="/">مشاهده سایت</a><a href="/admin/logout">خروج</a></div><main class="wrap admin">${msg}
 <div class="sectionhead"><div><span class="eyebrow">NEWSROOM ADMIN</span><h1>داشبورد تحریریه</h1></div><a class="btn primary" href="/admin/articles/new">+ خبر جدید</a></div>
 <div class="stats"><div><b>${a.length}</b><span>کل خبرها</span></div><div><b>${a.filter(x=>x.status==='published').length}</b><span>منتشرشده</span></div><div><b>${a.filter(x=>x.status==='scheduled').length}</b><span>زمان‌بندی‌شده</span></div><div><b>${db.citizens.length}</b><span>خبر مردمی</span></div></div>

 <section class="panel integrations-panel"><div class="panel-head"><div><h2>انتشار هم‌زمان شبکه‌ها</h2><p>وقتی خبر منتشر شود — فوری یا زمان‌بندی‌شده — ارسال شبکه‌ها هم اجرا می‌شود. نتیجه هر شبکه داخل خود خبر ثبت می‌شود.</p></div></div><div class="integration-grid">
 ${integrationCard('تلگرام',integrations.telegram,'Bot + Channel')}
 ${integrationCard('روبیکا',integrations.rubika,'Bot API + Chat/Channel ID')}
 ${integrationCard('WhatsApp Business',integrations.whatsapp,'Cloud API؛ برای گیرنده‌های مجاز')}
 ${integrationCard('لینک عمومی سایت',integrations.baseUrl,'برای لینک‌دادن به خبر')}
 </div><p class="integration-note">برای فعال شدن هر شبکه، توکن و شناسه مقصد فقط داخل Variables امن Railway ذخیره می‌شود، نه داخل کد یا دیتابیس سایت.</p></section>

 <section class="panel backup-panel"><div class="panel-head"><div><h2>پشتیبان‌گیری</h2><p>قبل از تغییرات مهم، بکاپ خودکار روزانه ساخته می‌شود. نسخه کامل شامل خبرها و تصاویر را هم می‌توانی دانلود کنی.</p></div><div class="actions"><a class="btn gold" href="/admin/backup/download">دانلود پشتیبان کامل</a><form method="post" action="/admin/backup/create"><button class="btn ghost">ساخت پشتیبان دستی</button></form></div></div><div class="backup-list">${backups.slice(0,6).map(b=>`<span>${e(b.name)} <small>${fmt(b.updatedAt)}</small></span>`).join('')||'<span>هنوز پشتیبانی ساخته نشده است.</span>'}</div><form class="restore-form" method="post" action="/admin/backup/restore" enctype="multipart/form-data" data-confirm="بازیابی، داده‌های فعلی را با بکاپ جایگزین می‌کند. ادامه می‌دهید؟"><label>بازیابی نسخه کامل<input type="file" name="backupFile" accept=".json,application/json" required></label><button class="btn ghost">بازیابی پشتیبان</button></form></section>

 <section class="panel"><h2>خبرها</h2>${a.map(x=>`<div class="adminrow"><div><b>${e(x.title)}</b><small>${statusLabel(x.status)} · ${x.status==='scheduled'&&x.scheduledAt?'انتشار: '+fmt(x.scheduledAt):fmt(x.createdAt)} · ${Number(x.views||0).toLocaleString('fa-IR')} بازدید</small><small class="distribution-mini">${['telegram','rubika','whatsapp'].map(k=>{const s=x.distribution?.[k]?.status;return k+': '+(s==='sent'?'✓':s==='failed'?'خطا':s==='skipped'?'—':'…')}).join(' · ')}</small></div><div><a href="/admin/articles/${x.id}/edit">ویرایش</a><form method="post" action="/admin/articles/${x.id}/delete" data-confirm="این خبر حذف شود؟"><button>حذف</button></form></div></div>`).join('')||'<p>هنوز خبری ثبت نشده است.</p>'}</section>
 <div class="gridadmin"><section class="panel"><h2>خبرهای مردمی</h2>${db.citizens.slice(0,20).map(x=>`<details><summary>${e(x.headline)} — ${e(x.name)}</summary><p>${e(x.details)}</p><small>${e(x.phone)} · ${e(x.location)}</small>${x.rewardCard?`<div class="reward-card-admin"><b>شماره کارت جهت هدیه:</b><span>${e(String(x.rewardCard).replace(/(.{4})/g,'$1 ').trim())}</span></div>`:``}${x.mediaUrl?`<div class="citizen-media">${String(x.mediaType||'').startsWith('image/')?`<img src="${e(x.mediaUrl)}" alt="فایل خبر مردمی">`:String(x.mediaType||'').startsWith('video/')?`<video controls preload="metadata" src="${e(x.mediaUrl)}"></video>`:''}<a href="${e(x.mediaUrl)}" target="_blank" rel="noopener">باز کردن / دانلود فایل</a></div>`:x.mediaLink?`<p><a href="${e(x.mediaLink)}" target="_blank" rel="noopener">لینک قدیمی فایل</a></p>`:''}</details>`).join('')||'<p>موردی نیست.</p>'}</section><section class="panel"><h2>پیام‌ها</h2>${db.contacts.slice(0,20).map(x=>`<details><summary>${e(x.subject)} — ${e(x.name)}</summary><p>${e(x.message)}</p><small>${e(x.contact)}</small></details>`).join('')||'<p>پیامی نیست.</p>'}</section></div></main>`);}

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
 <div class="editor-heading"><div><span class="eyebrow">EDITORIAL STUDIO</span><h1>${title}</h1></div><span class="editor-note">تصویر شاخص، عکس داخل متن و گالری همگی مستقیم از دستگاه آپلود می‌شوند.</span></div>
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

 <div class="image-upload"><div><label class="upload-label">تصویر شاخص خبر<input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/gif" data-image-input></label><p>قالب تصویر به‌صورت هوشمند با نسبت واقعی عکس تنظیم می‌شود؛ افقی، عمودی یا مربعی.</p>${a.image?`<label class="remove-image"><input type="checkbox" name="removeImage" value="1"> حذف تصویر فعلی</label>`:''}</div><div class="image-preview ${a.image?imageOrientation(a):''}" style="--preview-ratio:${a.image?imageRatio(a):16/9}" data-image-preview-frame>${a.image?`<img src="${e(a.image)}" alt="تصویر فعلی" data-image-preview>`:`<div class="preview-empty" data-preview-empty>پیش‌نمایش تصویر</div><img hidden alt="پیش‌نمایش" data-image-preview>`}</div></div>

 <div class="gallery-editor" data-gallery>
   <div class="gallery-head"><div><b>گالری خبر</b><p>چند عکس را هم‌زمان انتخاب کن؛ بعد از آپلود می‌توانی هر عکس را حذف کنی.</p></div><label class="btn ghost gallery-add">+ افزودن عکس<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden data-gallery-input></label></div>
   <div class="gallery-list" data-gallery-list>${gallery.map(url=>`<div class="gallery-item" data-url="${e(url)}"><img src="${e(url)}" alt=""><button type="button" data-gallery-remove>×</button></div>`).join('')}</div>
   <input type="hidden" name="galleryJson" value="${e(JSON.stringify(gallery))}" data-gallery-json>
   <div class="upload-progress" hidden data-gallery-status></div>
 </div>

 <div class="twocol"><label>خبرنگار<input name="author" value="${e(a.author||'تحریریه نبض ساردو')}"></label><label>محل<input name="location" value="${e(a.location||'ساردوئیه')}"></label></div>
 <div class="twocol"><label>وضعیت<select name="status" data-status-select><option value="draft">پیش‌نویس</option><option value="scheduled" ${a.status==='scheduled'?'selected':''}>زمان‌بندی انتشار</option><option value="published" ${a.status==='published'?'selected':''}>انتشار فوری</option></select></label><label data-schedule-wrap>زمان انتشار (ساعت ایران)<input type="datetime-local" name="scheduledAt" value="${e(localDateTime(a.scheduledAt))}"></label></div>
 <div class="twocol"><label>خبر ویژه<select name="featured"><option value="0">خیر</option><option value="1" ${a.featured?'selected':''}>بله</option></select></label><div></div></div>

 <div class="social-options"><b>انتشار هم‌زمان</b><label><input type="checkbox" name="socialTelegram" value="1" ${checked(a.socialTelegram,true)}> تلگرام</label><label><input type="checkbox" name="socialRubika" value="1" ${checked(a.socialRubika,true)}> روبیکا</label><label><input type="checkbox" name="socialWhatsApp" value="1" ${checked(a.socialWhatsApp,false)}> WhatsApp Business</label><small>شبکه‌ای که هنوز تنظیم نشده باشد، خبر سایت را متوقف نمی‌کند و فقط نتیجه «تنظیم نشده» ثبت می‌شود.</small></div>

 <div class="editor-actions"><a class="btn ghost" href="/admin">انصراف</a><button class="btn primary">ذخیره خبر</button></div>
 </form></main>`);}
module.exports={login,admin,editor};