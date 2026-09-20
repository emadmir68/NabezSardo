const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {load,save,id,now,slug,published}=require('./lib/store');
const views=require('./lib/views');

const PORT=Number(process.env.PORT||3000);
const ADMIN_USER=process.env.ADMIN_USER||'editor';
const ADMIN_PASS=process.env.ADMIN_PASS||'change-this';
const SECRET=process.env.SESSION_SECRET||'dev-secret-change';
const ROOT=__dirname;

function headers(type='text/html; charset=utf-8'){
  return {'Content-Type':type,'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
}
function send(res,status,body,type){res.writeHead(status,headers(type));res.end(body);}
function redirect(res,to,cookie){const h={...headers(),Location:to};if(cookie)h['Set-Cookie']=cookie;res.writeHead(302,h);res.end();}
function body(req){return new Promise((resolve,reject)=>{let data='';req.on('data',c=>{data+=c;if(data.length>2e6){reject(new Error('too-large'));req.destroy();}});req.on('end',()=>resolve(Object.fromEntries(new URLSearchParams(data))));req.on('error',reject);});}
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(x=>{const i=x.indexOf('=');return [x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1))]}));}
function sign(v){return crypto.createHmac('sha256',SECRET).update(v).digest('hex');}
function token(){const v=ADMIN_USER+':'+Date.now();return Buffer.from(v).toString('base64url')+'.'+sign(v);}
function authed(req){const t=cookies(req).nabez_admin;if(!t)return false;const [b,s]=t.split('.');if(!b||!s)return false;let v='';try{v=Buffer.from(b,'base64url').toString()}catch{return false}const [u,ts]=v.split(':');if(u!==ADMIN_USER||Date.now()-Number(ts)>604800000)return false;const a=Buffer.from(s),z=Buffer.from(sign(v));return a.length===z.length&&crypto.timingSafeEqual(a,z);}
function staticFile(res,pathname){
  const rel=pathname.replace(/^\/assets\//,'');
  const f=path.resolve(ROOT,'public',rel),root=path.resolve(ROOT,'public');
  if(!f.startsWith(root)||!fs.existsSync(f)||!fs.statSync(f).isFile())return false;
  const ext=path.extname(f).toLowerCase();
  const type={'.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}[ext]||'application/octet-stream';
  res.writeHead(200,{...headers(type),'Cache-Control':'public,max-age=604800'});
  fs.createReadStream(f).pipe(res);return true;
}
function uniqueSlug(db,raw,currentId){
  let s=slug(raw);let i=2;
  while(db.articles.some(a=>a.slug===s&&a.id!==currentId))s=slug(raw)+'-'+i++;
  return s;
}
const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost'),p=decodeURIComponent(u.pathname);
  if(p.startsWith('/assets/'))return staticFile(res,p)||send(res,404,'Not found','text/plain; charset=utf-8');
  if(req.method==='GET'&&p==='/health')return send(res,200,JSON.stringify({ok:true,name:'nabezsardo',time:now()}),'application/json; charset=utf-8');

  const db=load();
  if(req.method==='GET'&&p==='/')return send(res,200,views.home(db));
  if(req.method==='GET'&&p==='/all-news')return send(res,200,views.archive(db,u.searchParams.get('q')||''));
  if(req.method==='GET'&&p==='/about')return send(res,200,views.simple(db,'about'));
  if(req.method==='GET'&&p==='/contact')return send(res,200,views.simple(db,'contact',u.searchParams.get('ok')==='1'));
  if(req.method==='GET'&&p==='/send-news')return send(res,200,views.simple(db,'send-news',u.searchParams.get('ok')==='1'));
  if(req.method==='GET'&&p==='/admin/login')return send(res,200,views.login(u.searchParams.get('error')==='1'));
  if(req.method==='GET'&&p==='/admin/logout')return redirect(res,'/admin/login','nabez_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');

  let m=p.match(/^\/news\/(.+)$/);
  if(req.method==='GET'&&m){const a=published(db).find(x=>x.slug===m[1]);return a?send(res,200,views.article(db,a)):send(res,404,'خبر یافت نشد');}
  m=p.match(/^\/category\/(.+)$/);
  if(req.method==='GET'&&m){const c=db.categories.find(x=>x.id===m[1]);return c?send(res,200,views.category(db,c)):send(res,404,'دسته‌بندی یافت نشد');}

  if(p.startsWith('/admin')&&p!=='/admin/login'&&!authed(req))return redirect(res,'/admin/login');
  if(req.method==='GET'&&p==='/admin')return send(res,200,views.admin(db));
  if(req.method==='GET'&&p==='/admin/articles/new')return send(res,200,views.editor(db));
  m=p.match(/^\/admin\/articles\/([^/]+)\/edit$/);
  if(req.method==='GET'&&m){const a=db.articles.find(x=>x.id===m[1]);return a?send(res,200,views.editor(db,a,'/admin/articles/'+a.id+'/edit','ویرایش خبر')):send(res,404,'یافت نشد');}

  if(req.method==='POST'){
    const f=await body(req);
    if(p==='/admin/login'){
      if(f.username===ADMIN_USER&&f.password===ADMIN_PASS){
        const secure=process.env.NODE_ENV==='production'?'; Secure':'';
        return redirect(res,'/admin','nabez_admin='+token()+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800'+secure);
      }
      return redirect(res,'/admin/login?error=1');
    }
    if(p==='/contact'){db.contacts.unshift({id:id(),createdAt:now(),name:f.name||'',contact:f.contact||'',subject:f.subject||'',message:f.message||''});save(db);return redirect(res,'/contact?ok=1');}
    if(p==='/send-news'){db.citizens.unshift({id:id(),createdAt:now(),name:f.name||'',phone:f.phone||'',location:f.location||'',headline:f.headline||'',details:f.details||'',mediaLink:f.mediaLink||''});save(db);return redirect(res,'/send-news?ok=1');}

    if(p.startsWith('/admin')&&!authed(req))return redirect(res,'/admin/login');
    if(p==='/admin/articles/new'){
      const a={id:id(),createdAt:now(),updatedAt:now(),title:f.title||'',slug:uniqueSlug(db,f.slug||f.title||'news'),categoryId:f.categoryId||'',lead:f.lead||'',body:f.body||'',author:f.author||'تحریریه نبض ساردو',location:f.location||'ساردوئیه',status:f.status==='published'?'published':'draft',featured:f.featured==='1',image:f.image||'',publishedAt:f.status==='published'?now():null};
      db.articles.unshift(a);save(db);return redirect(res,'/admin');
    }
    m=p.match(/^\/admin\/articles\/([^/]+)\/edit$/);
    if(m){const a=db.articles.find(x=>x.id===m[1]);if(!a)return send(res,404,'یافت نشد');const was=a.status==='published';Object.assign(a,{title:f.title||'',slug:uniqueSlug(db,f.slug||f.title||a.slug,a.id),categoryId:f.categoryId||'',lead:f.lead||'',body:f.body||'',author:f.author||'',location:f.location||'',status:f.status==='published'?'published':'draft',featured:f.featured==='1',image:f.image||'',updatedAt:now()});if(!was&&a.status==='published')a.publishedAt=now();save(db);return redirect(res,'/admin');}
    m=p.match(/^\/admin\/articles\/([^/]+)\/delete$/);
    if(m){db.articles=db.articles.filter(x=>x.id!==m[1]);save(db);return redirect(res,'/admin');}
  }
  return send(res,404,'صفحه پیدا نشد');
 }catch(err){console.error(err);if(!res.headersSent)send(res,500,'خطای داخلی سرور');}
});
server.listen(PORT,'0.0.0.0',()=>console.log('Nabez Sardo running on :'+PORT));