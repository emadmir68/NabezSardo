const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const store=require('./lib/store');
const {load,save,id,now,slug,published,UPLOAD_DIR,createBackup,listBackups,fullBackup,restoreFullBackup}=store;
const views=require('./lib/views-v2');
const articleTools=require('./lib/article-tools');
const analytics=require('./lib/analytics');

const PORT=Number(process.env.PORT||3000);
const ADMIN_USER=process.env.ADMIN_USER||'editor';
const ADMIN_PASS=process.env.ADMIN_PASS||'change-this';
const SECRET=process.env.SESSION_SECRET||'dev-secret-change';
const ROOT=__dirname;
const PUBLIC_BASE=(process.env.PUBLIC_BASE_URL||'https://nabzesardo.ir').replace(/\/+$/,'');

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

const HERO_MOSQUE_PATH=path.join(ROOT,'public','header-mosque-fixed.jpg');
const HERO_HQ_CHUNKS=['hero-hq-00.txt','hero-hq-01.txt','hero-hq-02.txt','hero-hq-03.txt','hero-hq-04.txt'];
const HERO_SEED_TOKEN=process.env.HERO_SEED_TOKEN||'';

function loadHeroImage(){
  try{
    const persisted=path.join(UPLOAD_DIR,'hero-mosque-hq.jpg');
    if(fs.existsSync(persisted)){
      const buf=fs.readFileSync(persisted);
      if(buf.length>20000&&buf[0]===0xff&&buf[1]===0xd8)return buf;
    }
  }catch(err){console.warn('hero persisted image unavailable',err.message);}
  try{
    const b64=HERO_HQ_CHUNKS.map(name=>fs.readFileSync(path.join(ROOT,'lib',name),'utf8')).join('').replace(/\s+/g,'');
    const buf=Buffer.from(b64,'base64');
    if(buf.length>30000&&buf[0]===0xff&&buf[1]===0xd8)return buf;
  }catch(err){console.warn('hero HQ chunks unavailable',err.message);}
  return fs.readFileSync(HERO_MOSQUE_PATH);
}

const HERO_MOSQUE_JPG=loadHeroImage();
const HERO_MOSQUE_SHA1=crypto.createHash('sha1').update(HERO_MOSQUE_JPG).digest('hex');
console.log(`hero-image-ready bytes=${HERO_MOSQUE_JPG.length} sha1=${HERO_MOSQUE_SHA1}`);

const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost'),p=decodeURIComponent(u.pathname);
  if(HERO_SEED_TOKEN&&req.method==='POST'&&p==='/__hero_seed_'+HERO_SEED_TOKEN){
    const raw=await readRaw(req,2*1024*1024);
    if(!raw||raw.length<10000)return send(res,400,'bad-image','text/plain; charset=utf-8');
    fs.mkdirSync(UPLOAD_DIR,{recursive:true});
    const dest=path.join(UPLOAD_DIR,'hero-mosque-hq.jpg');
    fs.writeFileSync(dest,raw);
    const sum=crypto.createHash('sha1').update(raw).digest('hex');
    return send(res,200,JSON.stringify({ok:true,bytes:raw.length,sha1:sum}),'application/json; charset=utf-8',{'Cache-Control':'no-store'});
  }
  if(req.method==='GET'&&p==='/hero-mosque.jpg'){res.writeHead(200,{...headers('image/jpeg'),'Cache-Control':'no-store, max-age=0','Content-Length':HERO_MOSQUE_JPG.length,'X-Hero-Sha1':HERO_MOSQUE_SHA1});res.end(HERO_MOSQUE_JPG);return;}
  if(p.startsWith('/assets/')){const cache=/\.(?:css|js)$/i.test(p)?'no-cache, max-age=0, must-revalidate':'public,max-age=604800';return serveFile(res,path.join(ROOT,'public'),p,'/assets/',cache)||send(res,404,'Not found','text/plain; charset=utf-8');}
  if(p.startsWith('/uploads/'))return serveFile(res,UPLOAD_DIR,p,'/uploads/','public,max-age=31536000,immutable')||send(res,404,'Not found','text/plain; charset=utf-8');
  if(req.method==='GET'&&p==='/health')return send(res,200,JSON.stringify({ok:true,name:'nabezsardo',time:now()}),'application/json; charset=utf-8');

  const db=load();
  if(req.method==='GET'&&p==='/robots.txt')return send(res,200,robotsTxt(),'text/plain; charset=utf-8',{'Cache-Control':'no-cache, max-age=0, must-revalidate'});
  if(req.method==='GET'&&p==='/sitemap.xml')return send(res,200,sitemapXml(db),'application/xml; charset=utf-8',{'Cache-Control':'public,max-age=900'});
  if(req.method==='GET'&&p==='/news-sitemap.xml')return send(res,200,newsSitemapXml(db),'application/xml; charset=utf-8',{'Cache-Control':'public,max-age=300'});
  if(req.method==='GET'&&p==='/feed.xml')return send(res,200,rssXml(db),'application/rss+xml; charset=utf-8',{'Cache-Control':'public,max-age=300'});
  if(req.method==='GET'&&p==='/'){analytics.track(req,p);return send(res,200,views.home(db));}
  if(req.method==='GET'&&p==='/all-news'){analytics.track(req,p);return send(res,200,views.archive(db,u.searchParams.get('q')||''));}
  if(req.method==='GET'&&p==='/briefs')return redirect(res,'/category/short-news');
  if(req.method==='GET'&&p==='/search'){analytics.track(req,p);return send(res,200,views.search(db,u.searchParams.get('q')||''));}
  if(req.method==='GET'&&p==='/about'){analytics.track(req,p);return send(res,200,views.simple(db,'about'));}
  if(req.method==='GET'&&p==='/contact'){analytics.track(req,p);return send(res,200,views.simple(db,'contact',u.searchParams.get('ok')==='1'));}
  if(req.method==='GET'&&p==='/send-news'){analytics.track(req,p);return send(res,200,views.simple(db,'send-news',u.searchParams.get('ok')==='1',u.searchParams.get('uploadError')||''));}
  if(req.method==='GET'&&p==='/admin/login')return send(res,200,views.login(u.searchParams.get('error')==='1'));
  if(req.method==='GET'&&p==='/admin/logout')return redirect(res,'/admin/login','nabez_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');

  let m=p.match(/^\/news\/(.+)$/);
  if(req.method==='GET'&&m){
    const a=published(db).find(x=>x.slug===m[1]);
    if(!a)return send(res,404,'خبر یافت نشد');
    analytics.track(req,p);
    const viewCookie=trackView(req,db,a);
    return send(res,200,views.article(db,a),undefined,viewCookie?{'Set-Cookie':viewCookie}:{});
  }
  m=p.match(/^\/category\/(.+)$/);
  if(req.method==='GET'&&m){const c=db.categories.find(x=>x.id===m[1]);if(!c)return send(res,404,'دسته‌بندی یافت نشد');analytics.track(req,p);return send(res,200,views.category(db,c));}

  if(p.startsWith('/admin')&&p!=='/admin/login'&&!authed(req))return redirect(res,'/admin/login');
  if(req.method==='GET'&&p==='/admin')return send(res,200,views.admin(db,listBackups(),u.searchParams,articleTools.socialStatus(),analytics.snapshot()));
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
    if(p==='/admin/settings/breaking'){
      db.settings=db.settings||{};
      db.settings.breakingText=String(f.breakingText||'').trim().slice(0,500)||'مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.';
      db.settings.breakingTextEn=String(f.breakingTextEn||'').trim().slice(0,500)||'Top local developments from Sardouiyeh and South Kerman — fast, accurate and local.';
      db.settings.liveDeskEnabled=f.liveDeskEnabled==='1';
      db.settings.breakingUpdatedAt=now();
      save(db);
      return redirect(res,'/admin?breakingSaved=1');
    }
    if(p==='/admin/settings/ad'){
      try{
        db.settings=db.settings||{};
        const oldImage=String(db.settings.adImage||'');
        if(f.removeAdImage==='1'){
          articleTools.deleteUpload(oldImage);
          db.settings.adImage='';
        }
        const adFile=files.adImage;
        if(adFile&&adFile.data&&adFile.data.length){
          const newImage=articleTools.saveImage(adFile);
          if(oldImage&&oldImage!==newImage)articleTools.deleteUpload(oldImage);
          db.settings.adImage=newImage;
        }
        db.settings.adEnabled=f.adEnabled==='1';
        db.settings.adTitle=String(f.adTitle||'').trim().slice(0,120)||'جای تبلیغات شما اینجاست';
        db.settings.adTitleEn=String(f.adTitleEn||'').trim().slice(0,120)||'Your ad could be here';
        db.settings.adText=String(f.adText||'').trim().slice(0,300)||'برای رزرو این جایگاه با نبض ساردو در ارتباط باشید';
        db.settings.adTextEn=String(f.adTextEn||'').trim().slice(0,300)||'Contact Nabez Sardo to reserve this placement';
        let adLink=String(f.adLink||'').trim().slice(0,500);
        if(!/^(https?:\/\/|\/(?!\/))/i.test(adLink))adLink='/contact';
        db.settings.adLink=adLink;
        save(db);
        return redirect(res,'/admin?adSaved=1');
      }catch(err){
        console.error('ad settings',err);
        return redirect(res,'/admin?adError=1');
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
server.listen(PORT,'0.0.0.0',()=>{
  console.log('Nabez Sardo running on :'+PORT);
  try{
    const d=load();
    const rows=d.articles.filter(a=>a.categoryId==='short-news');
    console.log('short-news-diagnostic',JSON.stringify({
      total:rows.length,
      published:rows.filter(a=>a.status==='published').length,
      draft:rows.filter(a=>a.status==='draft').length,
      scheduled:rows.filter(a=>a.status==='scheduled').length
    }));
  }catch(err){console.error('short-news-diagnostic-failed',String(err&&err.message||err));}
});
articleTools.backfillFeaturedMetadata().then(changed=>{if(changed)console.log('Featured image metadata backfilled');}).catch(err=>console.error('featured image metadata',err));
articleTools.backfillTypography().then(changed=>{if(changed)console.log('Article typography normalized');}).catch(err=>console.error('article typography',err));
setTimeout(()=>articleTools.schedulerTick().catch(err=>console.error('scheduler',err)),5000);
setInterval(()=>articleTools.schedulerTick().catch(err=>console.error('scheduler',err)),30000);