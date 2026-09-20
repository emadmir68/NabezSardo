const {e,fmt,shell,logo,oldBody}=require('./view-common');

function login(error=false){return shell('ورود تحریریه | نبض ساردو',`<main class="login"><div class="loginbox">${logo()}<h1>ورود تحریریه</h1>${error?'<div class="error">اطلاعات ورود نادرست است.</div>':''}<form method="post"><label>نام کاربری<input name="username" required></label><label>رمز عبور<input type="password" name="password" required></label><button class="btn primary">ورود</button></form></div></main>`);}

function admin(db,backups=[],params=new URLSearchParams()){
 const a=[...db.articles].sort((x,y)=>new Date(y.createdAt)-new Date(x.createdAt));
 const msg=params.get('backup')==='1'?'<div class="success">نسخه پشتیبان دستی ساخته شد.</div>':params.get('restored')==='1'?'<div class="success">نسخه پشتیبان با موفقیت بازیابی شد.</div>':params.get('restoreError')==='1'?'<div class="error">فایل پشتیبان معتبر نبود و بازیابی انجام نشد.</div>':'';
 return shell('مدیریت | نبض ساردو',`<div class="adminbar">${logo()}<a href="/">مشاهده سایت</a><a href="/admin/logout">خروج</a></div><main class="wrap admin">${msg}
 <div class="sectionhead"><div><span class="eyebrow">NEWSROOM ADMIN</span><h1>داشبورد تحریریه</h1></div><a class="btn primary" href="/admin/articles/new">+ خبر جدید</a></div>
 <div class="stats"><div><b>${a.length}</b><span>کل خبرها</span></div><div><b>${a.filter(x=>x.status==='published').length}</b><span>منتشرشده</span></div><div><b>${db.citizens.length}</b><span>خبر مردمی</span></div><div><b>${backups.length}</b><span>پشتیبان‌های اخیر</span></div></div>
 <section class="panel backup-panel"><div class="panel-head"><div><h2>پشتیبان‌گیری</h2><p>قبل از تغییرات مهم، بکاپ خودکار روزانه ساخته می‌شود. نسخه کامل شامل خبرها و تصاویر را هم می‌توانی دانلود کنی.</p></div><div class="actions"><a class="btn gold" href="/admin/backup/download">دانلود پشتیبان کامل</a><form method="post" action="/admin/backup/create"><button class="btn ghost">ساخت پشتیبان دستی</button></form></div></div><div class="backup-list">${backups.slice(0,6).map(b=>`<span>${e(b.name)} <small>${fmt(b.updatedAt)}</small></span>`).join('')||'<span>هنوز پشتیبانی ساخته نشده است.</span>'}</div><form class="restore-form" method="post" action="/admin/backup/restore" enctype="multipart/form-data" data-confirm="بازیابی، داده‌های فعلی را با بکاپ جایگزین می‌کند. ادامه می‌دهید؟"><label>بازیابی نسخه کامل<input type="file" name="backupFile" accept=".json,application/json" required></label><button class="btn ghost">بازیابی پشتیبان</button></form></section>
 <section class="panel"><h2>خبرها</h2>${a.map(x=>`<div class="adminrow"><div><b>${e(x.title)}</b><small>${x.status==='published'?'منتشرشده':'پیش‌نویس'} · ${fmt(x.createdAt)}</small></div><div><a href="/admin/articles/${x.id}/edit">ویرایش</a><form method="post" action="/admin/articles/${x.id}/delete" data-confirm="این خبر حذف شود؟"><button>حذف</button></form></div></div>`).join('')||'<p>هنوز خبری ثبت نشده است.</p>'}</section>
 <div class="gridadmin"><section class="panel"><h2>خبرهای مردمی</h2>${db.citizens.slice(0,20).map(x=>`<details><summary>${e(x.headline)} — ${e(x.name)}</summary><p>${e(x.details)}</p><small>${e(x.phone)} · ${e(x.location)}</small></details>`).join('')||'<p>موردی نیست.</p>'}</section><section class="panel"><h2>پیام‌ها</h2>${db.contacts.slice(0,20).map(x=>`<details><summary>${e(x.subject)} — ${e(x.name)}</summary><p>${e(x.message)}</p><small>${e(x.contact)}</small></details>`).join('')||'<p>پیامی نیست.</p>'}</section></div></main>`);}

function editorSeed(a){return a.bodyHtml||oldBody(a)||'<p><br></p>';}
function editor(db,a={},action='/admin/articles/new',title='خبر جدید'){
 return shell(title+' | نبض ساردو',`<div class="adminbar">${logo()}<a href="/admin">داشبورد</a></div><main class="wrap admin">
 <div class="editor-heading"><div><span class="eyebrow">EDITORIAL STUDIO</span><h1>${title}</h1></div><span class="editor-note">عکس را مستقیم انتخاب کن؛ حداکثر ۱۰ مگابایت · JPG / PNG / WEBP / GIF</span></div>
 <form class="form editor-form" method="post" action="${action}" enctype="multipart/form-data" data-rich-form>
 <label>عنوان<input name="title" value="${e(a.title||'')}" required></label>
 <label>اسلاگ <small>اختیاری؛ اگر خالی باشد خودکار ساخته می‌شود</small><input name="slug" value="${e(a.slug||'')}"></label>
 <label>دسته‌بندی<select name="categoryId">${db.categories.map(c=>`<option value="${c.id}" ${a.categoryId===c.id?'selected':''}>${e(c.name)}</option>`).join('')}</select></label>
 <label>لید خبر<textarea name="lead" placeholder="خلاصه کوتاه و جذاب خبر">${e(a.lead||'')}</textarea></label>
 <div class="editor-label">متن کامل خبر</div>
 <div class="rich-editor" data-editor>
   <div class="rich-toolbar" role="toolbar" aria-label="ابزار ویرایش متن">
    <button type="button" data-cmd="undo" title="بازگشت">↶</button><button type="button" data-cmd="redo" title="تکرار">↷</button><span></span>
    <button type="button" data-cmd="bold" title="بولد"><b>B</b></button><button type="button" data-weight="300" title="متن نازک">نازک</button><button type="button" data-weight="400" title="متن عادی">عادی</button>
    <button type="button" data-cmd="italic" title="ایتالیک"><i>I</i></button><button type="button" data-cmd="underline" title="زیرخط"><u>U</u></button><span></span>
    <button type="button" data-cmd="justifyRight" title="راست‌چین">⇥ راست</button><button type="button" data-cmd="justifyCenter" title="وسط‌چین">وسط</button><button type="button" data-cmd="justifyLeft" title="چپ‌چین">چپ ⇤</button>
    <button type="button" data-dir="rtl" title="جهت راست به چپ">RTL</button><button type="button" data-dir="ltr" title="جهت چپ به راست">LTR</button><span></span>
    <button type="button" data-cmd="insertUnorderedList" title="فهرست نقطه‌ای">• لیست</button><button type="button" data-cmd="insertOrderedList" title="فهرست شماره‌ای">1. لیست</button><button type="button" data-cmd="removeFormat" title="پاک کردن قالب">پاک‌کردن قالب</button>
   </div>
   <div class="rich-area" contenteditable="true" dir="rtl" data-rich-area>${editorSeed(a)}</div>
   <input type="hidden" name="bodyHtml" data-rich-input>
 </div>
 <div class="image-upload"><div><label class="upload-label">تصویر شاخص خبر<input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/gif" data-image-input></label><p>عکس از همین دستگاه آپلود می‌شود و داخل فضای دائمی سایت نگهداری می‌شود.</p>${a.image?`<label class="remove-image"><input type="checkbox" name="removeImage" value="1"> حذف تصویر فعلی</label>`:''}</div><div class="image-preview">${a.image?`<img src="${e(a.image)}" alt="تصویر فعلی" data-image-preview>`:`<div class="preview-empty" data-preview-empty>پیش‌نمایش تصویر</div><img hidden alt="پیش‌نمایش" data-image-preview>`}</div></div>
 <div class="twocol"><label>خبرنگار<input name="author" value="${e(a.author||'تحریریه نبض ساردو')}"></label><label>محل<input name="location" value="${e(a.location||'ساردوئیه')}"></label></div>
 <div class="twocol"><label>وضعیت<select name="status"><option value="draft">پیش‌نویس</option><option value="published" ${a.status==='published'?'selected':''}>منتشرشده</option></select></label><label>خبر ویژه<select name="featured"><option value="0">خیر</option><option value="1" ${a.featured?'selected':''}>بله</option></select></label></div>
 <div class="editor-actions"><a class="btn ghost" href="/admin">انصراف</a><button class="btn primary">ذخیره خبر</button></div>
 </form></main>`);}
module.exports={login,admin,editor};