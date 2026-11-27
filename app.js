const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const store=require('./lib/store');
const geminiBridge=require('./lib/gemini-bridge');
const {load,save,id,now,slug,published,UPLOAD_DIR,createBackup,listBackups,fullBackup,restoreFullBackup}=store;
const views=require('./lib/views-v2');
const articleTools=require('./lib/article-tools');
const analytics=require('./lib/analytics');
const newsMonitor=require('./lib/news-monitor');
const {shortArticleCode,previousShortArticleCode,legacyShortArticleCode}=require('./lib/view-common');
const {LOCAL_HUBS,localMatchesArticle}=require('./lib/local-news');
const {presentArticle}=require('./lib/news-presentation');

const PORT=Number(process.env.PORT||3000);
const IS_CLOUDFLARE=process.env.CLOUDFLARE_WORKER==='1';
const ADMIN_USER=process.env.ADMIN_USER||'editor';
const ADMIN_PASS=process.env.ADMIN_PASS||'change-this';
const SECRET=process.env.SESSION_SECRET||'dev-secret-change';
const ROOT=(typeof __dirname!=='undefined'?__dirname:process.cwd());
const PUBLIC_BASE=(process.env.PUBLIC_BASE_URL||'https://nabzesardo.ir').replace(/\/+$/,'');
const APP_VERSION=String(process.env.RAILWAY_GIT_COMMIT_SHA||process.env.RAILWAY_DEPLOYMENT_ID||process.env.RAILWAY_REPLICA_ID||'dev').slice(0,80);

function headers(type='text/html; charset=utf-8'){
  return {
    'Content-Type':type,
    'X-Content-Type-Options':'nosniff',
    'X-Frame-Options':'SAMEORIGIN',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security':'max-age=31536000; includeSubDomains',
    'Content-Security-Policy':"default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
  };
}
function isPreviewReadonly(){return String(process.env.PREVIEW_READONLY||'')==='1'&&String(process.env.CLOUDFLARE_PRIMARY||'')!=='1';}
function send(res,status,body,type,extra={}){const h={...headers(type),...extra};if(isPreviewReadonly())h['X-Robots-Tag']='noindex, nofollow, noarchive';const ct=String(h['Content-Type']||'').toLowerCase();if(ct.startsWith('text/html')){h['Cache-Control']='no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';h['Pragma']='no-cache';h['Expires']='0';}res.writeHead(status,h);res.end(body);}
function redirect(res,to,cookie){const h={...headers(),Location:to,'Cache-Control':'no-store, no-cache, must-revalidate, max-age=0','Pragma':'no-cache','Expires':'0'};if(cookie)h['Set-Cookie']=cookie;res.writeHead(302,h);res.end();}
function sendArticleHead(res,a){
  const canonical=PUBLIC_BASE+'/news/'+encodeURIComponent(a.slug||'');
  res.writeHead(200,{
    ...headers(),
    'Cache-Control':'public,max-age=300,stale-while-revalidate=900',
    'Link':'<'+canonical+'>; rel="canonical"',
    'X-Robots-Tag':isPreviewReadonly()?'noindex, nofollow, noarchive':'index, follow, max-image-preview:large'
  });
  res.end();
}
function permanentRedirect(res,to){res.writeHead(301,{...headers(),Location:to,'Cache-Control':'public,max-age=86400'});res.end();}
function readRaw(req,max=14*1024*1024){return new Promise((resolve,reject)=>{const chunks=[];let size=0;req.on('data',c=>{size+=c.length;if(size>max){reject(new Error('too-large'));req.destroy();return;}chunks.push(c)});req.on('end',()=>resolve(Buffer.concat(chunks)));req.on('error',reject);});}
async function urlBody(req){const raw=await readRaw(req,2*1024*1024);return Object.fromEntries(new URLSearchParams(raw.toString('utf8')));}
async function multipart(req){
  const ct=String(req.headers['content-type']||'');
  const m=ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if(!m)throw new Error('missing-boundary');
  const boundary=m[1]||m[2];
  const raw=await readRaw(req,16*1024*1024);
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
function authed(req){const t=cookies(req).nabez_admin;if(!t)return false;const [b,s]=t.split('.');if(!b||!s)return false;let v='';try{v=Buffer.from(b,'base64url').toString()}catch{return false}const [u,ts]=v.split(':');if(u!==ADMIN_USER||Date.now()-Number(ts)>43200000)return false;const a=Buffer.from(s),z=Buffer.from(sign(v));return a.length===z.length&&crypto.timingSafeEqual(a,z);}
function crossSiteMutation(req){
  const site=String(req.headers['sec-fetch-site']||'').toLowerCase();
  return Boolean(site&&!['same-origin','same-site','none'].includes(site));
}
async function verifyTurnstile(token,remoteIp=''){
  const secret=String(process.env.TURNSTILE_SECRET_KEY||'').trim();
  if(!secret)return true;
  if(!String(token||'').trim())return false;
  try{
    const body=new URLSearchParams({secret,response:String(token)});
    if(remoteIp)body.set('remoteip',String(remoteIp));
    const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
    const json=await res.json();
    return json&&json.success===true;
  }catch{return false;}
}
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
function publicUrl(p='/'){const s=String(p||'');if(/^https?:\/\//i.test(s))return s;return PUBLIC_BASE+(s.startsWith('/')?s:'/'+s);}
function sitemapXml(db){
  const articles=published(db);
  const stamp=a=>a&&(a.updatedAt||a.publishedAt||a.createdAt)||null;
  const latestOf=list=>list.reduce((best,a)=>{
    const t=new Date(stamp(a)||0).getTime();
    return t>new Date(stamp(best)||0).getTime()?a:best;
  },null);
  const localLastmod=key=>stamp(latestOf(articles.filter(a=>localMatchesArticle(a,LOCAL_HUBS[key]))));
  const latestArticle=latestOf(articles);
  const latestFollowup=(db.followups||[]).reduce((best,x)=>new Date(x.updatedAt||x.createdAt||0)>new Date(best?.updatedAt||best?.createdAt||0)?x:best,null);
  const articleImages=a=>{
    const bodyImages=[...String(a.bodyHtml||'').matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>m[1]);
    return [...new Set([a.image,...(Array.isArray(a.gallery)?a.gallery:[]),...bodyImages].filter(Boolean).map(publicUrl))].slice(0,1000);
  };
  const urls=[
    {loc:publicUrl('/'),lastmod:stamp(latestArticle),images:[]},
    {loc:publicUrl('/all-news'),lastmod:stamp(latestArticle),images:[]},
    {loc:publicUrl('/about'),lastmod:null,images:[]},
    {loc:publicUrl('/contact'),lastmod:null,images:[]},
    {loc:publicUrl('/editorial-policy'),lastmod:null,images:[]},
    ...(latestFollowup?[{loc:publicUrl('/follow-up'),lastmod:latestFollowup.updatedAt||latestFollowup.createdAt,images:[]}]:[]),
    ...['sardouiyeh','jiroft','anbarabad','kahnuj','south-kerman']
      .map(key=>({loc:publicUrl('/local/'+key),lastmod:localLastmod(key),images:[]}))
      .filter(x=>x.lastmod),
    ...db.categories.map(x=>({loc:publicUrl('/category/'+encodeURIComponent(x.id)),lastmod:stamp(latestOf(articles.filter(a=>a.categoryId===x.id))),images:[]})).filter(x=>x.lastmod),
    ...articles.map(a=>({loc:publicUrl('/news/'+encodeURIComponent(a.slug)),lastmod:stamp(a),images:articleImages(a)}))
  ];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'+urls.map(x=>'<url><loc>'+xmlEsc(x.loc)+'</loc>'+(x.lastmod?'<lastmod>'+xmlEsc(new Date(x.lastmod).toISOString())+'</lastmod>':'')+(x.images||[]).map(src=>'<image:image><image:loc>'+xmlEsc(src)+'</image:loc></image:image>').join('')+'</url>').join('\n')+'\n</urlset>';
}
function newsSitemapXml(db){
  const current=Date.now(),cutoff=current-48*60*60*1000;
  const items=published(db).map(presentArticle).filter(a=>{const t=new Date(a.publishedAt||a.createdAt).getTime();return t>=cutoff&&t<=current;}).slice(0,1000);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n'+items.map(a=>'<url><loc>'+xmlEsc(publicUrl('/news/'+encodeURIComponent(a.slug)))+'</loc><news:news><news:publication><news:name>نبض ساردو</news:name><news:language>fa</news:language></news:publication><news:publication_date>'+xmlEsc(new Date(a.publishedAt||a.createdAt).toISOString())+'</news:publication_date><news:title>'+xmlEsc(a.title)+'</news:title></news:news></url>').join('\n')+'\n</urlset>';
}
function robotsTxt(){
  if(isPreviewReadonly())return ['User-agent: *','Disallow: /',''].join('\n');
  return ['User-agent: *','Allow: /','Disallow: /admin','Sitemap: '+publicUrl('/sitemap.xml'),'Sitemap: '+publicUrl('/news-sitemap.xml'),''].join('\n');
}
function rssXml(db){
  const items=published(db).map(presentArticle).slice(0,30);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>نبض ساردو</title><link>'+xmlEsc(publicUrl('/'))+'</link><description>اخبار ساردو، ساردوئیه، جیرفت، عنبرآباد، کهنوج و جنوب کرمان</description><language>fa-ir</language>'+items.map(a=>'<item><title>'+xmlEsc(a.title)+'</title><link>'+xmlEsc(publicUrl('/news/'+encodeURIComponent(a.slug)))+'</link><guid isPermaLink="true">'+xmlEsc(publicUrl('/news/'+encodeURIComponent(a.slug)))+'</guid><pubDate>'+new Date(a.publishedAt||a.createdAt).toUTCString()+'</pubDate><description>'+xmlEsc(a.lead||a.body||a.title)+'</description></item>').join('')+'</channel></rss>';
}
function serveFile(res,base,pathname,prefix,cache='public,max-age=604800'){
  const rel=pathname.slice(prefix.length);
  const root=path.resolve(base),f=path.resolve(base,rel);
  if(!f.startsWith(root+path.sep)&&f!==root)return false;
  if(!fs.existsSync(f)||!fs.statSync(f).isFile())return false;
  const ext=path.extname(f).toLowerCase();
  const type={'.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime'}[ext]||'application/octet-stream';
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
  if(file.data.length>12*1024*1024)throw new Error('citizen-media-too-large');
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

function safeTrackerLink(v=''){
  const s=String(v||'').trim().slice(0,500);
  if(!s)return '';
  if(/^https:\/\//i.test(s)||/^\/(?!\/)/.test(s))return s;
  return '';
}
function followupPayload(f,current={}){
  const allowed=new Set(['announced','started','progress','completed','paused','closed']);
  const status=allowed.has(String(f.status||''))?String(f.status):'announced';
  return {
    title:String(f.title||'').trim().slice(0,180),
    promise:String(f.promise||'').trim().slice(0,1200),
    promisor:String(f.promisor||'').trim().slice(0,160),
    location:String(f.location||'').trim().slice(0,120),
    promisedAt:String(f.promisedAt||'').trim().slice(0,10),
    deadline:String(f.deadline||'').trim().slice(0,10),
    status,
    note:String(f.note||'').trim().slice(0,1600),
    sourceLabel:String(f.sourceLabel||'').trim().slice(0,160),
    sourceUrl:safeTrackerLink(f.sourceUrl),
    featured:f.featured==='1',
    updatedAt:now(),
    completedAt:status==='completed'?(current.completedAt||now()):null
  };
}
const HERO_MOSQUE_PATH=path.join(ROOT,'public','header-mosque-fixed.jpg');
const HERO_HQ_CHUNKS=['hero-hq-00.txt','hero-hq-01.txt','hero-hq-02.txt','hero-hq-03.txt','hero-hq-04.txt'];
const HERO_SEED_TOKEN=process.env.HERO_SEED_TOKEN||'';

function loadHeroImage(){
  if(IS_CLOUDFLARE)return Buffer.from([0xff,0xd8,0xff,0xd9]);
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
  if((req.method==='GET'||req.method==='HEAD')&&p.length>1&&p.endsWith('/'))return permanentRedirect(res,p.replace(/\/+$/,'')+u.search);
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
  if(p.startsWith('/assets/')){const cache=/\.(?:css|js)$/i.test(p)?'public,max-age=604800,stale-while-revalidate=86400':'public,max-age=604800';return serveFile(res,path.join(ROOT,'public','assets'),p,'/assets/',cache)||serveFile(res,path.join(ROOT,'public'),p,'/assets/',cache)||send(res,404,'Not found','text/plain; charset=utf-8');}
  if(p.startsWith('/uploads/'))return serveFile(res,UPLOAD_DIR,p,'/uploads/','public,max-age=31536000,immutable')||send(res,404,'Not found','text/plain; charset=utf-8');
  if(req.method==='GET'&&p==='/health')return send(res,200,JSON.stringify({ok:true,name:'nabezsardo',version:APP_VERSION,time:now()}),'application/json; charset=utf-8',{'Cache-Control':'no-store'});
  if(req.method==='GET'&&p==='/__version')return send(res,200,JSON.stringify({version:APP_VERSION,time:Date.now()}),'application/json; charset=utf-8',{'Cache-Control':'no-store, no-cache, must-revalidate, max-age=0','Pragma':'no-cache','Expires':'0'});
  if(req.method==='GET'&&p==='/api/live-stats'){
    const stats=analytics.snapshot();
    return send(res,200,JSON.stringify({totalPageViews:stats.totalPageViews,todayPageViews:stats.today.pageViews,updatedAt:stats.updatedAt}),'application/json; charset=utf-8',{'Cache-Control':'no-store, no-cache, must-revalidate, max-age=0','Pragma':'no-cache','Expires':'0'});
  }

  const db=load();

  if(req.method==='GET'&&p==='/api/gemini/config')
    return send(res,200,JSON.stringify(geminiBridge.siteConfig(db,process.env.TURNSTILE_SITE_KEY||'')),'application/json; charset=utf-8',{'Cache-Control':'no-store'});
  if(req.method==='GET'&&p==='/api/gemini/articles'){
    const summary=u.searchParams.get('summary')==='1';
    return send(res,200,JSON.stringify({ok:true,articles:store.published(db).map(a=>geminiBridge.mapArticle(a,{summary})),source:'node-store'}),'application/json; charset=utf-8',{'Cache-Control':'private,no-store'});
  }
  if(req.method==='GET'&&p==='/api/gemini/article'){
    const key=String(u.searchParams.get('slug')||u.searchParams.get('key')||u.searchParams.get('id')||'').trim().slice(0,200);
    const found=store.published(db).find(a=>a.slug===key||a.id===key||geminiBridge.compactStoryCode(a.id)===key);
    if(!found)return send(res,404,JSON.stringify({ok:false,error:'not-found'}),'application/json; charset=utf-8');
    return send(res,200,JSON.stringify({ok:true,article:geminiBridge.mapArticle(found)}),'application/json; charset=utf-8',{'Cache-Control':'private,no-store'});
  }
  if(req.method==='GET'&&p==='/api/gemini/followups'){
    const followups=[...(db.followups||[])].sort((a,b)=>new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0));
    return send(res,200,JSON.stringify({ok:true,followups}),'application/json; charset=utf-8',{'Cache-Control':'private,no-store'});
  }
  // Authenticated Gemini studio uses the SAME signed HttpOnly session and editorial D1 store.
  if(req.method==='GET'&&p==='/api/gemini/admin/state'){
    if(!authed(req))return send(res,401,JSON.stringify({ok:false,error:'auth-required'}),'application/json; charset=utf-8');
    return send(res,200,JSON.stringify({
      ok:true,
      articles:(db.articles||[]).map(geminiBridge.mapArticle),
      citizenReports:(db.citizens||[]).map(geminiBridge.mapCitizen),
      contacts:(db.contacts||[]).map(x=>({id:String(x.id||''),name:String(x.name||''),email:String(x.contact||''),subject:String(x.subject||''),message:String(x.message||''),createdAt:String(x.createdAt||'')})),
      followups:[...(db.followups||[])],
      settings:geminiBridge.siteConfig(db,process.env.TURNSTILE_SITE_KEY||''),
      monitor:newsMonitor.snapshot(db)
    }),'application/json; charset=utf-8',{'Cache-Control':'private,no-store'});
  }
  if(req.method==='POST'&&(p==='/api/gemini/admin/action'||p==='/api/gemini/citizen'||p==='/api/gemini/contact')){
    const isAdmin=p==='/api/gemini/admin/action';
    if(isAdmin&&!authed(req))return send(res,401,JSON.stringify({ok:false,error:'auth-required'}),'application/json; charset=utf-8');
    if(crossSiteMutation(req))return send(res,403,JSON.stringify({ok:false,error:'cross-site-request'}),'application/json; charset=utf-8');
    const origin=String(req.headers.origin||'');
    let validOrigin=false;
    try{validOrigin=origin&&new URL(origin).host===String(req.headers.host||'');}catch{}
    if(!validOrigin)return send(res,403,JSON.stringify({ok:false,error:'origin-required'}),'application/json; charset=utf-8');
    if(isAdmin&&req.headers['x-nabzesardo-editorial']!=='1')
      return send(res,403,JSON.stringify({ok:false,error:'editorial-header-required'}),'application/json; charset=utf-8');
    let input;
    try{input=JSON.parse((await readRaw(req,7*1024*1024)).toString('utf8'));}
    catch{return send(res,400,JSON.stringify({ok:false,error:'invalid-payload'}),'application/json; charset=utf-8');}
    if(!input||typeof input!=='object'||Array.isArray(input))return send(res,400,JSON.stringify({ok:false,error:'invalid-payload'}),'application/json; charset=utf-8');
    const done=(status,data)=>send(res,status,JSON.stringify(data),'application/json; charset=utf-8',{'Cache-Control':'no-store'});
    const dataImage=(value,filename='gemini-cover')=>{
      const m=String(value||'').match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
      if(!m)return null;
      const data=Buffer.from(m[2],'base64');
      if(!data.length||data.length>4*1024*1024)throw Error('image-size');
      return {filename,type:m[1],data};
    };
    if(p==='/api/gemini/contact'){
      if(String(input.website||'').trim())return done(200,{ok:true});
      const name=String(input.name||'').trim().slice(0,120);
      const contact=String(input.contact||'').trim().slice(0,160);
      const subject=String(input.subject||'').trim().slice(0,180);
      const message=String(input.message||'').trim().slice(0,5000);
      if(name.length<2||contact.length<3||subject.length<3||message.length<10)return done(422,{ok:false,error:'message-too-short'});
      const ip=String(req.headers['cf-connecting-ip']||'');
      if(!(await verifyTurnstile(input.turnstileToken||'',ip)))return done(403,{ok:false,error:'turnstile-required'});
      db.contacts=db.contacts||[];
      db.contacts.unshift({id:id(),createdAt:now(),name,contact,subject,message});
      save(db);
      return done(200,{ok:true});
    }
    if(!isAdmin){
      const name=String(input.reporterName||'').trim().slice(0,120);
      const title=String(input.title||'').trim().slice(0,160);
      const description=String(input.description||'').trim().slice(0,8000);
      const contact=String(input.contact||'').trim().slice(0,160);
      if(title.length<8||description.length<24)return done(422,{ok:false,error:'report-too-short'});
      if(String(input.website||'').trim())return done(422,{ok:false,error:'invalid-submission'});
      const ip=String(req.headers['cf-connecting-ip']||'');
      if(!(await verifyTurnstile(input.turnstileToken||'',ip)))return done(403,{ok:false,error:'turnstile-required'});
      let media={url:'',type:'',name:''};
      try{const file=dataImage(input.imageDataUrl,'citizen-image');if(file)media=saveCitizenMedia(file);}
      catch{return done(413,{ok:false,error:'image-too-large'});}
      db.citizens=db.citizens||[];
      db.citizens.unshift({
        id:id(),createdAt:now(),name:name||'شهروندخبرنگار',
        phone:contact,location:String(input.region||'sarduiyeh').slice(0,64),
        categoryId:String(input.category||'social').slice(0,32),
        headline:title,details:description,mediaUrl:media.url,
        mediaType:media.type,mediaName:media.name,geminiStatus:'pending'
      });
      save(db);
      return done(200,{ok:true});
    }
    const action=String(input.action||'');
    if(action==='save'){
      const article=input.article;
      if(!article||typeof article!=='object'||Array.isArray(article))return done(400,{ok:false,error:'missing-article'});
      const isNew=input.isNew===true;
      const existing=isNew?null:(db.articles||[]).find(a=>a.id===String(article.id));
      if(!isNew&&!existing)return done(404,{ok:false,error:'article-not-found'});
      const changes=geminiBridge.articleChanges(article);
      if(changes.title.length<5||(!changes.body&&changes.lead.length<12))return done(422,{ok:false,error:'incomplete-article'});
      let cover=String(article.coverImage||'').trim();
      try{
        const file=dataImage(cover,'gemini-cover');
        if(file)cover=saveImage(file);
        else if(!/^(\/(uploads\/|src\/assets\/images\/|news-cover|header-|hero-|assets\/)|https:\/\/)/i.test(cover))cover='';
      }catch{return done(413,{ok:false,error:'invalid-cover'});}
      if(cover&&cover.length>2100)return done(422,{ok:false,error:'cover-url-too-long'});
      const updated={
        ...(existing||{}),...changes,
        id:existing?existing.id:id(),
        slug:existing?existing.slug:uniqueSlug(db,article.slug||changes.title,undefined),
        image:cover||existing?.image||'',
        createdAt:existing?.createdAt||now(),
        updatedAt:now(),
        publishedAt:existing?.publishedAt||null
      };
      if(updated.status==='published'&&!store.publiclyVisibleArticle(updated))
        return done(422,{ok:false,error:'blocked-obituary-or-advertisement'});
      const becamePublished=updated.status==='published'&&existing?.status!=='published';
      if(becamePublished)updated.publishedAt=now();
      if(isNew)db.articles.unshift(updated);
      else Object.assign(existing,updated);
      save(db);
      if(becamePublished){
        try{await articleTools.dispatchAndPersist(updated.id);}catch(e){console.error('gemini-publish-distribution',e);}
      }
      return done(200,{ok:true,id:updated.id});
    }
    if(action==='delete'){
      const key=String(input.id||'');
      const existing=(db.articles||[]).find(a=>a.id===key);
      if(!existing)return done(404,{ok:false,error:'article-not-found'});
      if(existing.image)deleteUpload(existing.image);
      db.articles=db.articles.filter(a=>a.id!==key);
      save(db);return done(200,{ok:true});
    }
    if(action==='delete-citizen'){
      const key=String(input.id||'');
      const item=(db.citizens||[]).find(x=>x.id===key);
      if(!item)return done(404,{ok:false,error:'report-not-found'});
      if(item.mediaUrl)deleteUpload(item.mediaUrl);
      db.citizens=(db.citizens||[]).filter(x=>x.id!==key);
      save(db);return done(200,{ok:true});
    }
    if(action==='delete-contact'){
      const key=String(input.id||'');
      const before=(db.contacts||[]).length;
      db.contacts=(db.contacts||[]).filter(x=>x.id!==key);
      if(db.contacts.length===before)return done(404,{ok:false,error:'contact-not-found'});
      save(db);return done(200,{ok:true});
    }
    if(action==='archive-citizen'){
      const c=(db.citizens||[]).find(x=>x.id===String(input.id||''));
      if(!c)return done(404,{ok:false,error:'report-not-found'});
      if(c.geminiStatus==='approved')return done(409,{ok:false,error:'already-published'});
      c.geminiStatus='archived';save(db);return done(200,{ok:true});
    }
    if(action==='approve-citizen'){
      const c=(db.citizens||[]).find(x=>x.id===String(input.id||''));
      if(!c)return done(404,{ok:false,error:'report-not-found'});
      if(c.geminiStatus==='approved'||c.geminiPublishedArticleId)return done(409,{ok:false,error:'already-published'});
      const rawTitle=String(c.headline||'').trim().slice(0,160);
      const rawBody=String(c.details||'').trim().slice(0,8000);
      const rawLead=rawBody.slice(0,350);
      const a={id:id(),title:rawTitle,lead:rawLead,
        body:rawBody,bodyHtml:rawBody.split(/\n+/).filter(Boolean).map(x=>'<p>'+geminiBridge.articleChanges({body:{fa:[x]}}).bodyHtml.slice(3,-4)+'</p>').join(''),
        categoryId:'social',location:String(c.location||'ساردوئیه').slice(0,160),
        author:String(c.name||'شهروندخبرنگار').slice(0,120),
        image:String(c.mediaUrl||''),createdAt:now(),publishedAt:now(),
        status:'published',featured:false,sourceCitizenId:c.id};
      a.slug=uniqueSlug(db,rawTitle,a.id);
      if(!store.publiclyVisibleArticle(a))return done(422,{ok:false,error:'blocked-obituary-or-advertisement'});
      db.articles.unshift(a);
      c.geminiStatus='approved';c.geminiPublishedArticleId=a.id;
      save(db);
      try{await articleTools.dispatchAndPersist(a.id);}catch(e){console.error('gemini-citizen-distribution',e);}
      return done(200,{ok:true,id:a.id});
    }
    if(action==='upload-image'){
      try{
        const file=dataImage(input.imageDataUrl,'studio-media');
        if(!file)return done(400,{ok:false,error:'invalid-image'});
        const url=saveImage(file);
        return done(200,{ok:true,url});
      }catch{return done(413,{ok:false,error:'image-too-large'});}
    }
    if(action==='save-settings'){
      const s=input.settings;
      if(!s||typeof s!=='object')return done(400,{ok:false,error:'missing-settings'});
      db.settings=db.settings||{};
      if(s.siteName?.fa!==undefined)db.settings.siteName=String(s.siteName.fa).trim().slice(0,120)||'نبض ساردو';
      if(s.siteName?.en!==undefined)db.settings.siteNameEn=String(s.siteName.en).trim().slice(0,120)||'Nabz Sardo';
      if(s.tagline?.fa!==undefined)db.settings.tagline=String(s.tagline.fa).trim().slice(0,200);
      if(s.tagline?.en!==undefined)db.settings.taglineEn=String(s.tagline.en).trim().slice(0,200);
      if(s.contactEmail!==undefined)db.settings.contactEmail=String(s.contactEmail).trim().slice(0,180);
      if(s.editorialPhone!==undefined)db.settings.editorialPhone=String(s.editorialPhone).trim().slice(0,80);
      if(s.breakingText!==undefined||s.breakingTextEn!==undefined||s.liveDeskEnabled!==undefined){
        if(s.breakingText!==undefined)db.settings.breakingText=String(s.breakingText).trim().slice(0,500);
        if(s.breakingTextEn!==undefined)db.settings.breakingTextEn=String(s.breakingTextEn).trim().slice(0,500);
        if(s.liveDeskEnabled!==undefined)db.settings.liveDeskEnabled=Boolean(s.liveDeskEnabled);
        db.settings.breakingUpdatedAt=now();
      }
      if(s.monitoringEnabled!==undefined){
        newsMonitor.ensure(db);
        db.newsMonitor.settings.enabled=Boolean(s.monitoringEnabled);
      }
      save(db);
      return done(200,{ok:true,settings:geminiBridge.siteConfig(db,process.env.TURNSTILE_SITE_KEY||''),monitor:newsMonitor.snapshot(db)});
    }
    if(action==='monitor-run'){
      try{
        const result=await newsMonitor.run();
        const latestDb=load();
        return done(200,{ok:true,result,monitor:newsMonitor.snapshot(latestDb)});
      }catch(err){
        return done(500,{ok:false,error:String(err?.message||'monitor-run-failed')});
      }
    }
    if(action==='monitor-toggle'){
      const enabled=newsMonitor.toggleMonitorEnabled(typeof input.enabled==='boolean'?input.enabled:undefined);
      return done(200,{ok:true,enabled,monitor:newsMonitor.snapshot(load())});
    }
    if(action==='monitor-publish-candidate'){
      const result=await newsMonitor.publishCandidate(String(input.id||''));
      return done(result.ok?200:422,{ok:result.ok,reason:result.reason||'',articleId:result.articleId||'',monitor:newsMonitor.snapshot(load())});
    }
    if(action==='monitor-reject-candidate'){
      const ok=newsMonitor.rejectCandidate(String(input.id||''),'rejected-by-editor');
      return done(ok?200:404,{ok,monitor:newsMonitor.snapshot(load())});
    }
    if(action==='monitor-toggle-source'){
      const ok=newsMonitor.toggleSource(String(input.id||''));
      return done(200,{ok:true,enabled:ok,monitor:newsMonitor.snapshot(load())});
    }
    return done(400,{ok:false,error:'unsupported-action'});
  }

  if(req.method==='GET'&&p==='/robots.txt')return send(res,200,robotsTxt(),'text/plain; charset=utf-8',{'Cache-Control':'no-cache, max-age=0, must-revalidate'});
  if(req.method==='GET'&&p==='/sitemap.xml')return send(res,200,sitemapXml(db),'application/xml; charset=utf-8',{'Cache-Control':'public,max-age=900'});
  if(req.method==='GET'&&p==='/news-sitemap.xml')return send(res,200,newsSitemapXml(db),'application/xml; charset=utf-8',{'Cache-Control':'public,max-age=300'});
  if(req.method==='GET'&&p==='/feed.xml')return send(res,200,rssXml(db),'application/rss+xml; charset=utf-8',{'Cache-Control':'public,max-age=300'});
  if(req.method==='GET'&&p==='/'){analytics.track(req,p);return send(res,200,views.home(db));}
  if(req.method==='GET'&&p==='/nabez60')return permanentRedirect(res,'/all-news');
  if(req.method==='GET'&&p==='/all-news'){analytics.track(req,p);return send(res,200,views.archive(db,Object.fromEntries(u.searchParams)));}
  if(req.method==='GET'&&p==='/briefs')return permanentRedirect(res,'/category/short-news');
  if(req.method==='GET'&&p==='/search'){analytics.track(req,p);return send(res,200,views.search(db,u.searchParams.get('q')||''));}
  if(req.method==='GET'&&p==='/about'){analytics.track(req,p);return send(res,200,views.simple(db,'about'));}
  if(req.method==='GET'&&p==='/contact'){analytics.track(req,p);return send(res,200,views.simple(db,'contact',u.searchParams.get('ok')==='1','',u.searchParams));}
  if(req.method==='GET'&&p==='/editorial-policy'){analytics.track(req,p);return send(res,200,views.editorialPolicy(db));}
  if(req.method==='GET'&&p==='/send-news'){analytics.track(req,p);return send(res,200,views.simple(db,'send-news',u.searchParams.get('ok')==='1',u.searchParams.get('uploadError')||''));}
  if(req.method==='GET'&&p==='/follow-up'){analytics.track(req,p);return send(res,200,views.followup(db));}
  if(req.method==='GET'&&p==='/admin/login'){
    const loginHtml=views.login(u.searchParams.get('error')==='1');
    return send(res,200,u.searchParams.get('gemini')==='1'?loginHtml.replace('action="/admin/login"','action="/admin/login?gemini=1"'):loginHtml);
  }
  if(req.method==='GET'&&p==='/admin/logout')return redirect(res,'/admin/login','nabez_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');

  let m=p.match(/^\/local\/(sardouiyeh|jiroft|anbarabad|kahnuj|south-kerman)$/);
  if(req.method==='GET'&&m){const page=views.localHub(db,m[1]);if(!page)return send(res,404,'صفحه پیدا نشد');analytics.track(req,p);return send(res,200,page);}

  m=p.match(/^\/n\/([^/]+)$/);
  if((req.method==='GET'||req.method==='HEAD')&&m){
    const key=String(m[1]||'');
    const a=published(db).find(x=>String(x.id)===key||shortArticleCode(x.id)===key||previousShortArticleCode(x.id)===key||legacyShortArticleCode(x.id)===key);
    if(!a)return send(res,404,'خبر یافت نشد');
    if(req.method==='HEAD')return sendArticleHead(res,a);
    analytics.track(req,p);
    const viewCookie=trackView(req,db,a);
    return send(res,200,views.article(db,a),undefined,viewCookie?{'Set-Cookie':viewCookie}:{});
  }

  m=p.match(/^\/news\/(.+)$/);
  if((req.method==='GET'||req.method==='HEAD')&&m){
    const key=String(m[1]||'');
    const a=published(db).find(x=>x.slug===key||shortArticleCode(x.id)===key||previousShortArticleCode(x.id)===key||legacyShortArticleCode(x.id)===key);
    if(!a)return send(res,404,'خبر یافت نشد');
    if(req.method==='HEAD')return sendArticleHead(res,a);
    analytics.track(req,p);
    const viewCookie=trackView(req,db,a);
    return send(res,200,views.article(db,a),undefined,viewCookie?{'Set-Cookie':viewCookie}:{});
  }
  m=p.match(/^\/category\/(.+)$/);
  if(req.method==='GET'&&m){const c=db.categories.find(x=>x.id===m[1]);if(!c)return send(res,404,'دسته‌بندی یافت نشد');analytics.track(req,p);return send(res,200,views.category(db,c));}

  if(p.startsWith('/admin')&&p!=='/admin/login'&&!authed(req))return redirect(res,'/admin/login');
  if(req.method==='GET'&&p==='/admin')return send(res,200,views.admin(db,listBackups(),u.searchParams,articleTools.socialStatus(),analytics.snapshot(),newsMonitor.snapshot(db)));
  if(req.method==='GET'&&p==='/admin/articles/new')return send(res,200,views.editor(db));
  if(req.method==='GET'&&p==='/admin/followups/new')return send(res,200,views.followupEditor(db));
  m=p.match(/^\/admin\/articles\/([^/]+)\/share-kit$/);
  if(req.method==='GET'&&m){const a=db.articles.find(x=>x.id===m[1]);return a?send(res,200,views.shareKit(db,a,u.searchParams)):send(res,404,'یافت نشد');}
  m=p.match(/^\/admin\/articles\/([^/]+)\/edit$/);
  if(req.method==='GET'&&m){const a=db.articles.find(x=>x.id===m[1]);return a?send(res,200,views.editor(db,a,'/admin/articles/'+a.id+'/edit','ویرایش خبر')):send(res,404,'یافت نشد');}
  m=p.match(/^\/admin\/followups\/([^/]+)\/edit$/);
  if(req.method==='GET'&&m){const x=(db.followups||[]).find(v=>v.id===m[1]);return x?send(res,200,views.followupEditor(db,x,'/admin/followups/'+x.id+'/edit','ویرایش پرونده پیگیری')):send(res,404,'یافت نشد');}
  if(req.method==='GET'&&p==='/admin/backup/download'){
    const payload=JSON.stringify(fullBackup());
    const name='nabezsardo-backup-'+new Date().toISOString().slice(0,10)+'.json';
    return send(res,200,payload,'application/json; charset=utf-8',{'Content-Disposition':'attachment; filename="'+name+'"','Cache-Control':'no-store'});
  }

  if(req.method==='POST'){
    if(p.startsWith('/admin')&&p!=='/admin/login'&&crossSiteMutation(req))return send(res,403,'درخواست بین‌سایتی مجاز نیست.','text/plain; charset=utf-8');
    const parsed=await form(req),f=parsed.fields,files=parsed.files;
    if(p==='/admin/login'){
      if(f.username===ADMIN_USER&&f.password===ADMIN_PASS){
        const secure=process.env.NODE_ENV==='production'?'; Secure':'';
        return redirect(res,(u.searchParams.get('gemini')==='1'?'/?studio=1':'/admin'),'nabez_admin='+token()+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200'+secure);
      }
      return redirect(res,u.searchParams.get('gemini')==='1'?'/admin/login?gemini=1&error=1':'/admin/login?error=1');
    }
    if(p==='/contact'){
      if(String(f.website||'').trim())return redirect(res,'/contact?ok=1');
      if(!(await verifyTurnstile(f['cf-turnstile-response'],req.headers['cf-connecting-ip']||'')))return send(res,403,'اعتبارسنجی امنیتی ناموفق بود؛ صفحه را تازه کنید و دوباره تلاش کنید.','text/plain; charset=utf-8');
      db.contacts.unshift({
        id:id(),createdAt:now(),
        name:String(f.name||'').trim().slice(0,120),
        contact:String(f.contact||'').trim().slice(0,160),
        subject:String(f.subject||'').trim().slice(0,180),
        message:String(f.message||'').trim().slice(0,5000)
      });
      save(db);return redirect(res,'/contact?ok=1');
    }
    if(p==='/send-news'){
      try{
        if(String(f.website||'').trim())return redirect(res,'/send-news?ok=1');
        if(!(await verifyTurnstile(f['cf-turnstile-response'],req.headers['cf-connecting-ip']||'')))return send(res,403,'اعتبارسنجی امنیتی ناموفق بود؛ صفحه را تازه کنید و دوباره تلاش کنید.','text/plain; charset=utf-8');
        const media=saveCitizenMedia(files.mediaFile);
        db.citizens.unshift({
          id:id(),createdAt:now(),
          name:String(f.name||'').trim().slice(0,120),
          phone:String(f.phone||'').trim().slice(0,40),
          location:String(f.location||'').trim().slice(0,160),
          headline:String(f.headline||'').trim().slice(0,160),
          details:String(f.details||'').trim().slice(0,8000),
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
    m=p.match(/^\/admin\/citizens\/([^/]+)\/delete$/);
    if(m){
      const item=(db.citizens||[]).find(x=>x.id===m[1]);
      if(item?.mediaUrl)deleteUpload(item.mediaUrl);
      db.citizens=(db.citizens||[]).filter(x=>x.id!==m[1]);
      save(db);return redirect(res,'/admin#citizens');
    }
    m=p.match(/^\/admin\/contacts\/([^/]+)\/delete$/);
    if(m){
      db.contacts=(db.contacts||[]).filter(x=>x.id!==m[1]);
      save(db);return redirect(res,'/admin#messages');
    }
    if(p==='/admin/news-monitor/settings'){
      newsMonitor.saveSettings(f);
      return redirect(res,'/admin?monitorSaved=1#monitor');
    }
    if(p==='/admin/news-monitor/source/add'){
      try{newsMonitor.addSource(f);return redirect(res,'/admin?monitorSaved=1#monitor');}
      catch(err){console.error('news monitor source add',err);return redirect(res,'/admin?monitorError=1#monitor');}
    }
    if(p==='/admin/news-monitor/run'){
      try{
        const result=await newsMonitor.run();
        if(!result||!result.ok){
          const qs=result?.reason==='disabled'?'monitorPaused=1':'monitorBusy=1';
          return redirect(res,'/admin?'+qs+'#monitor');
        }
        if(Number(result.errors||0)>0){
          return redirect(res,'/admin?monitorPartial=1&errors='+Number(result.errors||0)+'&discovered='+Number(result.discovered||0)+'&queued='+Number(result.queued||0)+'#monitor');
        }
        return redirect(res,'/admin?monitorRun=1&discovered='+Number(result.discovered||0)+'&queued='+Number(result.queued||0)+'&filtered='+Number(result.filtered||0)+'#monitor');
      }catch(err){console.error('news monitor run',err);return redirect(res,'/admin?monitorError=1#monitor');}
    }
    if(p==='/admin/news-monitor/toggle'){
      newsMonitor.toggleMonitorEnabled();
      return redirect(res,'/admin?monitorSaved=1#monitor');
    }
    m=p.match(/^\/admin\/news-monitor\/source\/([^/]+)\/toggle$/);
    if(m){newsMonitor.toggleSource(m[1]);return redirect(res,'/admin#monitor');}
    m=p.match(/^\/admin\/news-monitor\/source\/([^/]+)\/delete$/);
    if(m){newsMonitor.deleteSource(m[1]);return redirect(res,'/admin#monitor');}
    m=p.match(/^\/admin\/news-monitor\/candidate\/([^/]+)\/publish$/);
    if(m){
      try{await newsMonitor.publishCandidate(m[1]);return redirect(res,'/admin?monitorPublished=1#monitor');}
      catch(err){console.error('news monitor publish',err);return redirect(res,'/admin?monitorError=1#monitor');}
    }
    m=p.match(/^\/admin\/news-monitor\/candidate\/([^/]+)\/reject$/);
    if(m){newsMonitor.rejectCandidate(m[1]);return redirect(res,'/admin#monitor');}
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
    if(p==='/admin/followups/new'){
      const payload=followupPayload(f,{});
      if(!payload.title||!payload.promise)return redirect(res,'/admin/followups/new?error=1');
      db.followups=db.followups||[];
      db.followups.unshift({id:id(),createdAt:now(),...payload});
      save(db);
      return redirect(res,'/admin?followupSaved=1#followups');
    }
    m=p.match(/^\/admin\/followups\/([^/]+)\/edit$/);
    if(m){
      db.followups=db.followups||[];
      const x=db.followups.find(v=>v.id===m[1]);if(!x)return send(res,404,'یافت نشد');
      const payload=followupPayload(f,x);
      if(!payload.title||!payload.promise)return redirect(res,'/admin/followups/'+x.id+'/edit?error=1');
      Object.assign(x,payload);save(db);
      return redirect(res,'/admin?followupSaved=1#followups');
    }
    m=p.match(/^\/admin\/followups\/([^/]+)\/delete$/);
    if(m){
      db.followups=(db.followups||[]).filter(v=>v.id!==m[1]);save(db);
      return redirect(res,'/admin?followupDeleted=1#followups');
    }
    m=p.match(/^\/admin\/articles\/([^/]+)\/redistribute$/);
    if(m){
      const a=db.articles.find(x=>x.id===m[1]);if(!a)return send(res,404,'یافت نشد');
      if(a.status!=='published')return send(res,400,'فقط خبر منتشرشده قابل ارسال است.');
      if(!store.publiclyVisibleArticle(a))return send(res,422,'این محتوا با سیاست تحریریه نبض ساردو مغایرت دارد و قابل ارسال نیست.');
      try{await articleTools.dispatchAndPersist(a.id,{retry:true,manual:true});}
      catch(err){console.error('social redistribution',err);}
      return redirect(res,'/admin/articles/'+a.id+'/share-kit?resent=1');
    }
    if(p==='/admin/articles/new'){
      const submissionToken=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(String(f.submissionToken||''))?f.submissionToken:'';
      if(submissionToken&&db.articles.some(a=>a.id===submissionToken))return redirect(res,'/admin?saved=1');
      const payload=await articleTools.articlePayload(db,f,files,{},uniqueSlug);
      const a={id:submissionToken||id(),createdAt:now(),...payload,publishedAt:payload.status==='published'?now():null};
      if((a.status==='published'||a.status==='scheduled')&&!store.publiclyVisibleArticle({...a,status:'published'}))return send(res,422,'این محتوا با سیاست تحریریه نبض ساردو مغایرت دارد و قابل انتشار یا زمان‌بندی نیست.');
      db.articles.unshift(a);save(db);
      if(a.status==='published'){
        let distSummary='skipped';
        try{
          const resDist=await articleTools.dispatchAndPersist(a.id);
          const dist=resDist?.distribution||{};
          const statuses=['telegram','rubika','whatsapp'].map(k=>dist[k]?.status).filter(Boolean);
          if(statuses.some(s=>s==='sent'))distSummary=statuses.some(s=>s==='failed')?'partial':'sent';
          else if(statuses.some(s=>s==='failed'))distSummary='failed';
        }catch(err){console.error('social distribution',err);distSummary='failed';}
        return redirect(res,'/admin?saved=1&social='+distSummary);
      }
      return redirect(res,a.status==='scheduled'?'/admin?savedScheduled=1':'/admin?savedDraft=1');
    }
    m=p.match(/^\/admin\/articles\/([^/]+)\/edit$/);
    if(m){
      const a=db.articles.find(x=>x.id===m[1]);if(!a)return send(res,404,'یافت نشد');
      const was=a.status==='published',payload=await articleTools.articlePayload(db,f,files,a,uniqueSlug),updated={...a,...payload};
      if((updated.status==='published'||updated.status==='scheduled')&&!store.publiclyVisibleArticle({...updated,status:'published'}))return send(res,422,'این محتوا با سیاست تحریریه نبض ساردو مغایرت دارد و قابل انتشار یا زمان‌بندی نیست.');
      Object.assign(a,payload);
      if(!was&&a.status==='published')a.publishedAt=now();
      save(db);
      if(!was&&a.status==='published'){
        let distSummary='skipped';
        try{
          const resDist=await articleTools.dispatchAndPersist(a.id,{retry:true});
          const dist=resDist?.distribution||{};
          const statuses=['telegram','rubika','whatsapp'].map(k=>dist[k]?.status).filter(Boolean);
          if(statuses.some(s=>s==='sent'))distSummary=statuses.some(s=>s==='failed')?'partial':'sent';
          else if(statuses.some(s=>s==='failed'))distSummary='failed';
        }catch(err){console.error('social distribution',err);distSummary='failed';}
        return redirect(res,'/admin?saved=1&social='+distSummary);
      }
      return redirect(res,a.status==='scheduled'?'/admin?savedScheduled=1':a.status==='published'?'/admin?updated=1':'/admin?savedDraft=1');
    }
    m=p.match(/^\/admin\/articles\/([^/]+)\/delete$/);
    if(m){const a=db.articles.find(x=>x.id===m[1]);if(a){deleteUpload(a.image);deleteUpload(a.videoUrl);}db.articles=db.articles.filter(x=>x.id!==m[1]);save(db);return redirect(res,'/admin');}
  }
  return send(res,404,'صفحه پیدا نشد');
 }catch(err){
  console.error(err);
  if(!res.headersSent){
    const msg=err.message==='too-large'?'حجم فایل یا درخواست بیش از حد مجاز است.':err.message==='image-too-large'?'حجم عکس باید کمتر از ۱۰ مگابایت باشد.':err.message==='invalid-image'?'فرمت عکس پشتیبانی نمی‌شود.':err.message==='video-too-large'?'حجم ویدئو باید کمتر از ۵۰ مگابایت باشد.':err.message==='invalid-video'?'فرمت ویدئو باید MP4، WebM یا MOV باشد.':'خطای داخلی سرور';
    send(res,500,msg);
  }
 }
});
server.listen(PORT,'0.0.0.0',()=>console.log('Nabez Sardo running on :'+PORT));
if(!IS_CLOUDFLARE){
  articleTools.backfillFeaturedMetadata().then(changed=>{if(changed)console.log('Featured image metadata backfilled');}).catch(err=>console.error('featured image metadata',err));
  articleTools.backfillTypography().then(changed=>{if(changed)console.log('Article typography normalized');}).catch(err=>console.error('article typography',err));
  setTimeout(()=>articleTools.schedulerTick().catch(err=>console.error('scheduler',err)),5000);
  setInterval(()=>articleTools.schedulerTick().catch(err=>console.error('scheduler',err)),30000);
}