const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const store=require('./lib/store');
const {load,save,id,now,slug,published,UPLOAD_DIR,createBackup,listBackups,fullBackup,restoreFullBackup}=store;
const views=require('./lib/views-v2');
const articleTools=require('./lib/article-tools');

const PORT=Number(process.env.PORT||3000);
const ADMIN_USER=process.env.ADMIN_USER||'editor';
const ADMIN_PASS=process.env.ADMIN_PASS||'change-this';
const SECRET=process.env.SESSION_SECRET||'dev-secret-change';
const ROOT=__dirname;
const PUBLIC_BASE=(process.env.PUBLIC_BASE_URL||'https://nabezsardo-prod-production.up.railway.app').replace(/\/+$/,'');

function headers(type='text/html; charset=utf-8'){
  return {'Content-Type':type,'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
}
function send(res,status,body,type,extra={}){res.writeHead(status,{...headers(type),...extra});res.end(body);}
function redirect(res,to,cookie){const h={...headers(),Location:to};if(cookie)h['Set-Cookie']=cookie;res.writeHead(302,h);res.end();}
function readRaw(req,max=14*1024*1024){return new Promise((resolve,reject)=>{const chunks=[];let size=0;req.on('data',c=>{size+=c.length;if(size>max){reject(new Error('too-large'));req.destroy();return;}chunks.push(c)});req.on('end',()=>resolve(Buffer.concat(chunks)));req.on('error',reject);});}
async function urlBody(req){const raw=await readRaw(req,2*1024*1024);return Object.fromEntries(new URLSearchParams(raw.toString('utf8')));}
async function multipart(req){
  const ct=String(req.headers['content-type']||'');
  const m=ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if(!m)throw new Error('missing-boundary');
  const boundary=m[1]||m[2];
  const raw=await readRaw(req,60*1024*1024);
  const text=raw.toString('latin1');
  const parts=text.split('--'+boundary);
  const fields={},files={};
  for(let part of parts){
    if(!part||part==='--\r\n'||part==='--')continue;
    if(part.startsWith('\r\n'))part=part.slice(2);
    if(part.endsWith('\r\n'))part=part.slice(0,-2);
    if(part.endsWith('--'))part=part.slice(0,-2);
    const cut=part.indexOf('\r\n\r\n');
    if(cut<0)continue;
    const head=part.slice(0,cut),bodyLatin=part.slice(cut+4);
    const disp=head.match(/content-disposition:\s*form-data;[^\r\n]*/i);
    if(!disp)continue;
    const nameM=disp[0].match(/name="([^"]+)"/i);
    if(!nameM)continue;
    const name=nameM[1],fileM=disp[0].match(/filename="([^"]*)"/i);
    if(fileM&&fileM[1]){
      const typeM=head.match(/content-type:\s*([^\r\n]+)/i);
      files[name]={filename:path.basename(fileM[1]),type:(typeM?typeM[1].trim():'application/octet-stream').toLowerCase(),data:Buffer.from(bodyLatin,'latin1')};
    }else fields[name]=Buffer.from(bodyLatin,'latin1').toString('utf8');
  }
  return {fields,files};
}
async function form(req){
  return String(req.headers['content-type']||'').toLowerCase().startsWith('multipart/form-data')?multipart(req).then(x=>x):urlBody(req).then(fields=>({fields,files:{}}));
}
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(x=>{const i=x.indexOf('=');return [x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1))]}));}
function sign(v){return crypto.createHmac('sha256',SECRET).update(v).digest('hex');}
function token(){const v=ADMIN_USER+':'+Date.now();return Buffer.from(v).toString('base64url')+'.'+sign(v);}
function authed(req){const t=cookies(req).nabez_admin;if(!t)return false;const [b,s]=t.split('.');if(!b||!s)return false;let v='';try{v=Buffer.from(b,'base64url').toString()}catch{return false}const [u,ts]=v.split(':');if(u!==ADMIN_USER||Date.now()-Number(ts)>604800000)return false;const a=Buffer.from(s),z=Buffer.from(sign(v));return a.length===z.length&&crypto.timingSafeEqual(a,z);}
function seenViews(req){
  try{
    const raw=cookies(req).nabez_seen;
    if(!raw)return {};
    const parsed=JSON.parse(Buffer.from(raw,'base64url').toString('utf8'));
    return parsed&&typeof parsed==='object'?parsed:{};
  }catch{return {};}
}
function trackView(req,db,article){
  const seen=seenViews(req),t=Date.now(),ttl=12*60*60*1000;
  const last=Number(seen[article.id]||0);
  if(last&&t-last<ttl)return null;
  article.views=Number(article.views||0)+1;
  seen[article.id]=t;
  const cleaned=Object.fromEntries(Object.entries(seen)
    .filter(([,ts])=>t-Number(ts)<7*24*60*60*1000)
    .sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,24));
  save(db,false);
  const value=Buffer.from(JSON.stringify(cleaned),'utf8').toString('base64url');
  const secure=process.env.NODE_ENV==='production'?'; Secure':'';
  return 'nabez_seen='+value+'; Path=/; Max-Age=604800; SameSite=Lax'+secure;
}
function xmlEsc(v=''){return String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));}
function publicUrl(p='/'){return PUBLIC_BASE+(p.startsWith('/')?p:'/'+p);}
function sitemapXml(db){
  const urls=[
    {loc:publicUrl('/'),lastmod:null},
    {loc:publicUrl('/all-news'),lastmod:null},
    {loc:publicUrl('/about'),lastmod:null},
    {loc:publicUrl('/contact'),lastmod:null},
    ...db.categories.map(x=>({loc:publicUrl('/category/'+encodeURIComponent(x.id)),lastmod:null})),
    ...published(db).map(a=>({loc:publicUrl('/news/'+encodeURIComponent(a.slug)),lastmod:a.updatedAt||a.publishedAt||a.createdAt}))
  ];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(x=>'<url><loc>'+xmlEsc(x.loc)+'</loc>'+(x.lastmod?'<lastmod>'+xmlEsc(new Date(x.lastmod).toISOString())+'</lastmod>':'')+'</url>').join('\n')+'\n</urlset>';
}
function newsSitemapXml(db){
  const cutoff=Date.now()-48*60*60*1000;
  const items=published(db).filter(a=>new Date(a.publishedAt||a.createdAt).getTime()>=cutoff);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n'+items.map(a=>'<url><loc>'+xmlEsc(publicUrl('/news/'+encodeURIComponent(a.slug)))+'</loc><news:news><news:publication><news:name>نبض ساردو</news:name><news:language>fa</news:language></news:publication><news:publication_date>'+xmlEsc(new Date(a.publishedAt||a.createdAt).toISOString())+'</news:publication_date><news:title>'+xmlEsc(a.title)+'</news:title></news:news></url>').join('\n')+'\n</urlset>';
}
function robotsTxt(){
  return ['User-agent: *','Allow: /','Disallow: /admin','Disallow: /search','Sitemap: '+publicUrl('/sitemap.xml'),'Sitemap: '+publicUrl('/news-sitemap.xml'),''].join('\n');
}
function rssXml(db){
  const items=published(db).slice(0,30);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>نبض ساردو</title><link>'+xmlEsc(publicUrl('/'))+'</link><description>اخبار ساردوئیه، جیرفت و جنوب کرمان</description><language>fa-ir</language>'+items.map(a=>'<item><title>'+xmlEsc(a.title)+'</title><link>'+xmlEsc(publicUrl('/news/'+encodeURIComponent(a.slug)))+'</link><guid isPermaLink="true">'+xmlEsc(publicUrl('/news/'+encodeURIComponent(a.slug)))+'</guid><pubDate>'+new Date(a.publishedAt||a.createdAt).toUTCString()+'</pubDate><description>'+xmlEsc(a.lead||a.body||a.title)+'</description></item>').join('')+'</channel></rss>';
}
function serveFile(res,base,pathname,prefix,cache='public,max-age=604800'){
  const rel=pathname.slice(prefix.length);
  const root=path.resolve(base),f=path.resolve(base,rel);
  if(!f.startsWith(root+path.sep)&&f!==root)return false;
  if(!fs.existsSync(f)||!fs.statSync(f).isFile())return false;
  const ext=path.extname(f).toLowerCase();
  const type={'.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime'}[ext]||'application/octet-stream';
  res.writeHead(200,{...headers(type),'Cache-Control':cache,'Content-Length':fs.statSync(f).size});
  fs.createReadStream(f).pipe(res);return true;
}
function uniqueSlug(db,raw,currentId){let s=slug(raw);let i=2;while(db.articles.some(a=>a.slug===s&&a.id!==currentId))s=slug(raw)+'-'+i++;return s;}
function saveImage(file){
  if(!file||!file.data||!file.data.length)return '';
  if(file.data.length>10*1024*1024)throw new Error('image-too-large');
  const extByType={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'};
  const ext=extByType[file.type];
  if(!ext)throw new Error('invalid-image');
  const name=Date.now().toString(36)+'-'+crypto.randomBytes(6).toString('hex')+ext;
  fs.mkdirSync(UPLOAD_DIR,{recursive:true});
  fs.writeFileSync(path.join(UPLOAD_DIR,name),file.data);
  return '/uploads/'+name;
}
function saveCitizenMedia(file){
  if(!file||!file.data||!file.data.length)return {url:'',type:'',name:''};
  if(file.data.length>50*1024*1024)throw new Error('citizen-media-too-large');
  const extByType={
    'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif',
    'video/mp4':'.mp4','video/webm':'.webm','video/quicktime':'.mov'
  };
  const ext=extByType[file.type];
  if(!ext)throw new Error('invalid-citizen-media');
  const name=Date.now().toString(36)+'-citizen-'+crypto.randomBytes(6).toString('hex')+ext;
  fs.mkdirSync(UPLOAD_DIR,{recursive:true});
  fs.writeFileSync(path.join(UPLOAD_DIR,name),file.data);
  return {url:'/uploads/'+name,type:file.type,name:file.filename||name};
}
function deleteUpload(url){
  if(!String(url||'').startsWith('/uploads/'))return;
  const name=path.basename(url),f=path.join(UPLOAD_DIR,name);
  try{if(fs.existsSync(f))fs.unlinkSync(f)}catch{}
}
function sanitizeRich(input=''){
  let h=String(input).slice(0,500000);
  h=h.replace(/<!--[^]*?-->/g,'').replace(/<(script|style|iframe|object|embed|form|input|button|svg|math)[^>]*>[^]*?<\/\1>/gi,'');
  const allowed=new Set(['p','br','strong','b','em','i','u','ul','ol','li','blockquote','h2','h3','span','div']);
  h=h.replace(/<\/?([a-z0-9]+)([^>]*)>/gi,(m,tag,attrs)=>{
    tag=tag.toLowerCase();if(!allowed.has(tag))return '';
    if(m.startsWith('</'))return '</'+tag+'>';
    const out=[];
    const dir=attrs.match(/\bdir\s*=\s*["']?(rtl|ltr)["']?/i);if(dir)out.push('dir="'+dir[1].toLowerCase()+'"');
    const styles=[];
    const align=attrs.match(/text-align\s*:\s*(right|left|center|justify)/i);if(align)styles.push('text-align:'+align[1].toLowerCase());
    const weight=attrs.match(/font-weight\s*:\s*(300|400|500|600|700|bold|normal)/i);if(weight)styles.push('font-weight:'+weight[1].toLowerCase());
    if(styles.length)out.push('style="'+styles.join(';')+'"');
    return '<'+tag+(out.length?' '+out.join(' '):'')+'>';
  });
  return h.replace(/\son[a-z]+\s*=\s*["'][^"']*["']/gi,'').replace(/javascript:/gi,'');
}
function plainFromRich(h=''){return String(h).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();}
function articlePayload(db,f,files,current={}){
  let image=current.image||'';
  if(f.removeImage==='1'){deleteUpload(image);image='';}
  if(files.imageFile&&files.imageFile.data.length){const old=image;image=saveImage(files.imageFile);if(old&&old!==image)deleteUpload(old);}
  const bodyHtml=sanitizeRich(f.bodyHtml||'');
  return {
    title:f.title||'',slug:uniqueSlug(db,f.slug||f.title||current.slug||'news',current.id),categoryId:f.categoryId||'',
    lead:f.lead||'',titleEn:f.titleEn||'',leadEn:f.leadEn||'',bodyEn:f.bodyEn||'',bodyHtml,body:plainFromRich(bodyHtml),author:f.author||'تحریریه نبض ساردو',location:f.location||'ساردوئیه',
    status:f.status==='published'?'published':'draft',featured:f.featured==='1',image,updatedAt:now()
  };
}

const HERO_MOSQUE_JPG=Buffer.from('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','base64');

const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost'),p=decodeURIComponent(u.pathname);
  if(req.method==='GET'&&p==='/hero-mosque.jpg'){res.writeHead(200,{...headers('image/jpeg'),'Cache-Control':'no-store, max-age=0','Content-Length':HERO_MOSQUE_JPG.length});res.end(HERO_MOSQUE_JPG);return;}
  if(p.startsWith('/assets/')){const cache=/\.(?:css|js)$/i.test(p)?'no-cache, max-age=0, must-revalidate':'public,max-age=604800';return serveFile(res,path.join(ROOT,'public'),p,'/assets/',cache)||send(res,404,'Not found','text/plain; charset=utf-8');}
  if(p.startsWith('/uploads/'))return serveFile(res,UPLOAD_DIR,p,'/uploads/','public,max-age=31536000,immutable')||send(res,404,'Not found','text/plain; charset=utf-8');
  if(req.method==='GET'&&p==='/health')return send(res,200,JSON.stringify({ok:true,name:'nabezsardo',time:now()}),'application/json; charset=utf-8');

  const db=load();
  if(req.method==='GET'&&p==='/robots.txt')return send(res,200,robotsTxt(),'text/plain; charset=utf-8',{'Cache-Control':'public,max-age=3600'});
  if(req.method==='GET'&&p==='/sitemap.xml')return send(res,200,sitemapXml(db),'application/xml; charset=utf-8',{'Cache-Control':'public,max-age=900'});
  if(req.method==='GET'&&p==='/news-sitemap.xml')return send(res,200,newsSitemapXml(db),'application/xml; charset=utf-8',{'Cache-Control':'public,max-age=300'});
  if(req.method==='GET'&&p==='/feed.xml')return send(res,200,rssXml(db),'application/rss+xml; charset=utf-8',{'Cache-Control':'public,max-age=300'});
  if(req.method==='GET'&&p==='/')return send(res,200,views.home(db));
  if(req.method==='GET'&&p==='/all-news')return send(res,200,views.archive(db,u.searchParams.get('q')||''));
  if(req.method==='GET'&&p==='/search')return send(res,200,views.search(db,u.searchParams.get('q')||''));
  if(req.method==='GET'&&p==='/about')return send(res,200,views.simple(db,'about'));
  if(req.method==='GET'&&p==='/contact')return send(res,200,views.simple(db,'contact',u.searchParams.get('ok')==='1'));
  if(req.method==='GET'&&p==='/send-news')return send(res,200,views.simple(db,'send-news',u.searchParams.get('ok')==='1',u.searchParams.get('uploadError')||''));
  if(req.method==='GET'&&p==='/admin/login')return send(res,200,views.login(u.searchParams.get('error')==='1'));
  if(req.method==='GET'&&p==='/admin/logout')return redirect(res,'/admin/login','nabez_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');

  let m=p.match(/^\/news\/(.+)$/);
  if(req.method==='GET'&&m){
    const a=published(db).find(x=>x.slug===m[1]);
    if(!a)return send(res,404,'خبر یافت نشد');
    const viewCookie=trackView(req,db,a);
    return send(res,200,views.article(db,a),undefined,viewCookie?{'Set-Cookie':viewCookie}:{});
  }
  m=p.match(/^\/category\/(.+)$/);
  if(req.method==='GET'&&m){const c=db.categories.find(x=>x.id===m[1]);return c?send(res,200,views.category(db,c)):send(res,404,'دسته‌بندی یافت نشد');}

  if(p.startsWith('/admin')&&p!=='/admin/login'&&!authed(req))return redirect(res,'/admin/login');
  if(req.method==='GET'&&p==='/admin')return send(res,200,views.admin(db,listBackups(),u.searchParams,articleTools.socialStatus()));
  if(req.method==='GET'&&p==='/admin/articles/new')return send(res,200,views.editor(db));
  m=p.match(/^\/admin\/articles\/([^/]+)\/edit$/);
  if(req.method==='GET'&&m){const a=db.articles.find(x=>x.id===m[1]);return a?send(res,200,views.editor(db,a,'/admin/articles/'+a.id+'/edit','ویرایش خبر')):send(res,404,'یافت نشد');}
  if(req.method==='GET'&&p==='/admin/backup/download'){
    const payload=JSON.stringify(fullBackup());
    const name='nabezsardo-backup-'+new Date().toISOString().slice(0,10)+'.json';
    return send(res,200,payload,'application/json; charset=utf-8',{'Content-Disposition':'attachment; filename="'+name+'"','Cache-Control':'no-store'});
  }

  if(req.method==='POST'){
    const parsed=await form(req),f=parsed.fields,files=parsed.files;
    if(p==='/admin/login'){
      if(f.username===ADMIN_USER&&f.password===ADMIN_PASS){
        const secure=process.env.NODE_ENV==='production'?'; Secure':'';
        return redirect(res,'/admin','nabez_admin='+token()+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800'+secure);
      }
      return redirect(res,'/admin/login?error=1');
    }
    if(p==='/contact'){db.contacts.unshift({id:id(),createdAt:now(),name:f.name||'',contact:f.contact||'',subject:f.subject||'',message:f.message||''});save(db);return redirect(res,'/contact?ok=1');}
    if(p==='/send-news'){
      try{
        const media=saveCitizenMedia(files.mediaFile);
        db.citizens.unshift({
          id:id(),createdAt:now(),name:f.name||'',phone:f.phone||'',location:f.location||'',
          headline:f.headline||'',details:f.details||'',rewardCard:(f.rewardCard||'').replace(/\D/g,'').slice(0,16),
          mediaUrl:media.url,mediaType:media.type,mediaName:media.name
        });
        save(db);
        return redirect(res,'/send-news?ok=1');
      }catch(err){
        if(err.message==='citizen-media-too-large')return redirect(res,'/send-news?uploadError=large');
        if(err.message==='invalid-citizen-media')return redirect(res,'/send-news?uploadError=type');
        throw err;
      }
    }

    if(p.startsWith('/admin')&&!authed(req))return redirect(res,'/admin/login');
    if(p==='/admin/upload/image'){
      const file=files.image||files.imageFile;
      if(!file||!file.data||!file.data.length)return send(res,400,JSON.stringify({ok:false,error:'فایلی انتخاب نشده است'}),'application/json; charset=utf-8');
      try{
        const url=articleTools.saveImage(file);
        return send(res,200,JSON.stringify({ok:true,url}),'application/json; charset=utf-8',{'Cache-Control':'no-store'});
      }catch(err){
        const msg=err.message==='image-too-large'?'حجم عکس باید کمتر از ۱۰ مگابایت باشد.':'فرمت عکس پشتیبانی نمی‌شود.';
        return send(res,400,JSON.stringify({ok:false,error:msg}),'application/json; charset=utf-8');
      }
    }
    if(p==='/admin/backup/create'){createBackup('manual');return redirect(res,'/admin?backup=1');}
    if(p==='/admin/backup/restore'){
      if(!files.backupFile||!files.backupFile.data.length)return redirect(res,'/admin?restoreError=1');
      try{restoreFullBackup(JSON.parse(files.backupFile.data.toString('utf8')));return redirect(res,'/admin?restored=1');}
      catch{return redirect(res,'/admin?restoreError=1');}
    }
    if(p==='/admin/articles/new'){
      const payload=await articleTools.articlePayload(db,f,files,{},uniqueSlug);
      const a={id:id(),createdAt:now(),...payload,publishedAt:payload.status==='published'?now():null};
      db.articles.unshift(a);save(db);
      if(a.status==='published')articleTools.dispatchAndPersist(a.id).catch(err=>console.error('social distribution',err));
      return redirect(res,'/admin');
    }
    m=p.match(/^\/admin\/articles\/([^/]+)\/edit$/);
    if(m){
      const a=db.articles.find(x=>x.id===m[1]);if(!a)return send(res,404,'یافت نشد');
      const was=a.status==='published',payload=await articleTools.articlePayload(db,f,files,a,uniqueSlug);Object.assign(a,payload);
      if(!was&&a.status==='published')a.publishedAt=now();
      save(db);
      if(!was&&a.status==='published')articleTools.dispatchAndPersist(a.id).catch(err=>console.error('social distribution',err));
      return redirect(res,'/admin');
    }
    m=p.match(/^\/admin\/articles\/([^/]+)\/delete$/);
    if(m){const a=db.articles.find(x=>x.id===m[1]);if(a)deleteUpload(a.image);db.articles=db.articles.filter(x=>x.id!==m[1]);save(db);return redirect(res,'/admin');}
  }
  return send(res,404,'صفحه پیدا نشد');
 }catch(err){
  console.error(err);
  if(!res.headersSent){
    const msg=err.message==='too-large'?'حجم فایل یا درخواست بیش از حد مجاز است.':err.message==='image-too-large'?'حجم عکس باید کمتر از ۱۰ مگابایت باشد.':err.message==='invalid-image'?'فرمت عکس پشتیبانی نمی‌شود.':'خطای داخلی سرور';
    send(res,500,msg);
  }
 }
});
server.listen(PORT,'0.0.0.0',()=>console.log('Nabez Sardo running on :'+PORT));
articleTools.backfillFeaturedMetadata().then(changed=>{if(changed)console.log('Featured image metadata backfilled');}).catch(err=>console.error('featured image metadata',err));
setTimeout(()=>articleTools.schedulerTick().catch(err=>console.error('scheduler',err)),5000);
setInterval(()=>articleTools.schedulerTick().catch(err=>console.error('scheduler',err)),30000);