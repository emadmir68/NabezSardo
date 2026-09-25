const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const DATA_DIR=process.env.DATA_DIR||path.join(__dirname,'..','data');
const UPLOAD_DIR=process.env.UPLOAD_DIR||path.join(DATA_DIR,'uploads');
const BACKUP_DIR=path.join(DATA_DIR,'backups');
const BACKUP_MANIFEST_FILE=path.join(DATA_DIR,'backups-manifest.json');
fs.mkdirSync(DATA_DIR,{recursive:true});
fs.mkdirSync(UPLOAD_DIR,{recursive:true});
fs.mkdirSync(BACKUP_DIR,{recursive:true});
const DB_FILE=path.join(DATA_DIR,'db.json');
const CLOUDFLARE_SYNC_URL=String(process.env.CLOUDFLARE_SYNC_URL||'').trim();
const CLOUDFLARE_SYNC_TOKEN=String(process.env.CLOUDFLARE_SYNC_TOKEN||'').trim();
let syncTimer=null;
let syncInFlight=false;
let syncPending=false;

const initial={
  settings:{siteName:'نبض ساردو',tagline:'صدای ساردوئیه، روایت مردم',breakingText:'مهم‌ترین رویدادهای ساردوئیه و جنوب کرمان؛ سریع، دقیق و محلی.',breakingTextEn:'Top local developments from Sardouiyeh and South Kerman — fast, accurate and local.',liveDeskEnabled:true,breakingUpdatedAt:null,adEnabled:true,adTitle:'جای تبلیغات شما اینجاست',adTitleEn:'Your ad could be here',adText:'برای رزرو این جایگاه با نبض ساردو در ارتباط باشید',adTextEn:'Contact Nabez Sardo to reserve this placement',adLink:'/contact',adImage:''},
  categories:[
    ['sardouiyeh','ساردوئیه'],['city-village','شهر و روستا'],['social','اجتماعی'],
    ['culture','فرهنگی'],['sports','ورزش'],['agriculture','کشاورزی'],
    ['tourism','گردشگری'],['kerman','استان کرمان'],['video','ویدئو'],['short-news','خبر کوتاه']
  ].map(([id,name])=>({id,name})),
  articles:[],
  contacts:[],
  citizens:[]
};

function clone(x){return JSON.parse(JSON.stringify(x));}
function load(){
  if(!fs.existsSync(DB_FILE)) save(clone(initial),false);
  try{
    const db=JSON.parse(fs.readFileSync(DB_FILE,'utf8'));
    db.settings=db.settings||clone(initial.settings);
    if(!db.settings.breakingText)db.settings.breakingText=initial.settings.breakingText;
    if(!db.settings.breakingTextEn)db.settings.breakingTextEn=initial.settings.breakingTextEn;
    if(db.settings.liveDeskEnabled===undefined)db.settings.liveDeskEnabled=true;
    if(db.settings.breakingUpdatedAt===undefined)db.settings.breakingUpdatedAt=null;
    if(db.settings.adEnabled===undefined)db.settings.adEnabled=initial.settings.adEnabled;
    if(!db.settings.adTitle)db.settings.adTitle=initial.settings.adTitle;
    if(!db.settings.adTitleEn)db.settings.adTitleEn=initial.settings.adTitleEn;
    if(!db.settings.adText)db.settings.adText=initial.settings.adText;
    if(!db.settings.adTextEn)db.settings.adTextEn=initial.settings.adTextEn;
    if(!db.settings.adLink)db.settings.adLink=initial.settings.adLink;
    if(db.settings.adImage===undefined)db.settings.adImage=initial.settings.adImage;
    db.categories=db.categories||clone(initial.categories);
    const politicalCategory=db.categories.find(x=>x&&x.id==='city-village');
    if(politicalCategory)politicalCategory.name='سیاسی';
    if(!db.categories.some(x=>x&&x.id==='short-news'))db.categories.push({id:'short-news',name:'خبر کوتاه'});
    db.articles=db.articles||[];
    db.contacts=db.contacts||[];
    db.citizens=db.citizens||[];
    return db;
  }catch{return clone(initial);}
}
function pruneBackups(limit=30){
  const files=fs.readdirSync(BACKUP_DIR).filter(x=>x.endsWith('.json')).map(name=>({name,time:fs.statSync(path.join(BACKUP_DIR,name)).mtimeMs})).sort((a,b)=>b.time-a.time);
  files.slice(limit).forEach(x=>{try{fs.unlinkSync(path.join(BACKUP_DIR,x.name));}catch{}});
}
function autoBackup(){
  if(!fs.existsSync(DB_FILE))return null;
  const day=new Date().toISOString().slice(0,10);
  const target=path.join(BACKUP_DIR,'auto-'+day+'.json');
  if(!fs.existsSync(target))fs.copyFileSync(DB_FILE,target);
  pruneBackups();
  return target;
}
function save(db,backup=true){
  if(backup)autoBackup();
  const tmp=DB_FILE+'.tmp';
  fs.writeFileSync(tmp,JSON.stringify(db,null,2),'utf8');
  fs.renameSync(tmp,DB_FILE);
  queueCloudflareSync();
}
function createBackup(label='manual'){
  if(!fs.existsSync(DB_FILE))save(clone(initial),false);
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const safe=String(label).replace(/[^a-z0-9_-]/gi,'').slice(0,24)||'manual';
  const target=path.join(BACKUP_DIR,safe+'-'+stamp+'.json');
  fs.copyFileSync(DB_FILE,target);
  pruneBackups();
  return target;
}
function listBackups(limit=12){
  try{
    if(fs.existsSync(BACKUP_MANIFEST_FILE)){
      const rows=JSON.parse(fs.readFileSync(BACKUP_MANIFEST_FILE,'utf8'));
      if(Array.isArray(rows))return rows
        .filter(x=>x&&x.name)
        .sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0))
        .slice(0,limit);
    }
  }catch{}
  return fs.readdirSync(BACKUP_DIR).filter(x=>x.endsWith('.json')).map(name=>{
    const st=fs.statSync(path.join(BACKUP_DIR,name));
    return {name,size:st.size,updatedAt:st.mtime.toISOString()};
  }).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,limit);
}
function fullBackup(){
  const db=load();
  const uploads=[];
  for(const name of fs.readdirSync(UPLOAD_DIR)){
    const p=path.join(UPLOAD_DIR,name);
    if(!fs.statSync(p).isFile())continue;
    const size=fs.statSync(p).size;
    if(size>12*1024*1024)continue;
    uploads.push({name,data:fs.readFileSync(p).toString('base64')});
  }
  return {format:'nabezsardo-full-backup',version:1,createdAt:new Date().toISOString(),db,uploads};
}
function syncEnabled(){
  return Boolean(CLOUDFLARE_SYNC_URL&&CLOUDFLARE_SYNC_TOKEN&&/^https:\/\//i.test(CLOUDFLARE_SYNC_URL));
}
function runtimeAuthEnvelope(){
  const user=String(process.env.ADMIN_USER||'editor');
  const pass=String(process.env.ADMIN_PASS||'');
  if(!pass||pass==='change-this')return null;
  const iterations=210000;
  const salt=crypto.createHash('sha256').update('nabzesardo-cloudflare-admin-v1|'+user).digest('hex').slice(0,32);
  const verifier=crypto.pbkdf2Sync(pass,salt,iterations,32,'sha256').toString('hex');
  return {version:1,user,salt,iterations,verifier};
}


function runtimeSecretsEnvelope(){
  try{
    const publicKeyPath=path.join(__dirname,'..','cloudflare','runtime-public-key.pem');
    if(!fs.existsSync(publicKeyPath))return null;
    const values={
      ADMIN_USER:process.env.ADMIN_USER||'editor',
      ADMIN_PASS:process.env.ADMIN_PASS||'',
      SESSION_SECRET:process.env.SESSION_SECRET||'',
      GOOGLE_SITE_VERIFICATION:process.env.GOOGLE_SITE_VERIFICATION||'',
      TELEGRAM_BOT_TOKEN:process.env.TELEGRAM_BOT_TOKEN||'',
      TELEGRAM_CHAT_ID:process.env.TELEGRAM_CHAT_ID||'',
      RUBIKA_BOT_TOKEN:process.env.RUBIKA_BOT_TOKEN||'',
      RUBIKA_CHAT_ID:process.env.RUBIKA_CHAT_ID||'',
      RUBIKA_TEST_ON_START:process.env.RUBIKA_TEST_ON_START||'',
      WHATSAPP_ACCESS_TOKEN:process.env.WHATSAPP_ACCESS_TOKEN||'',
      WHATSAPP_PHONE_NUMBER_ID:process.env.WHATSAPP_PHONE_NUMBER_ID||'',
      WHATSAPP_TO:process.env.WHATSAPP_TO||'',
      WHATSAPP_GRAPH_VERSION:process.env.WHATSAPP_GRAPH_VERSION||''
    };
    const payload=JSON.stringify(Object.fromEntries(Object.entries(values).filter(([,v])=>String(v).length)));
    const aesKey=crypto.randomBytes(32),iv=crypto.randomBytes(12);
    const cipher=crypto.createCipheriv('aes-256-gcm',aesKey,iv);
    const data=Buffer.concat([cipher.update(payload,'utf8'),cipher.final()]);
    const tag=cipher.getAuthTag();
    const wrappedKey=crypto.publicEncrypt({
      key:fs.readFileSync(publicKeyPath,'utf8'),
      padding:crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash:'sha256'
    },aesKey);
    return {
      version:1,
      alg:'RSA-OAEP-256+A256GCM',
      wrappedKey:wrappedKey.toString('base64'),
      iv:iv.toString('base64'),
      tag:tag.toString('base64'),
      data:data.toString('base64')
    };
  }catch(err){
    console.error('cloudflare-runtime-secrets-envelope-failed',String(err&&err.message||err));
    return null;
  }
}

function analyticsSyncText(){
  try{
    const file=path.join(DATA_DIR,'analytics.json');
    if(!fs.existsSync(file))return '';
    return fs.readFileSync(file,'utf8');
  }catch{return '';}
}

async function pushCloudflareSync(){
  if(!syncEnabled())return {ok:false,skipped:true};
  if(syncInFlight){syncPending=true;return {ok:false,pending:true};}
  syncInFlight=true;
  try{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),30000);
    let res;
    try{
      res=await fetch(CLOUDFLARE_SYNC_URL,{
        method:'POST',
        headers:{
          'content-type':'application/json',
          'x-nabzesardo-sync':CLOUDFLARE_SYNC_TOKEN
        },
        body:JSON.stringify({...fullBackup(),analytics:analyticsSyncText(),runtimeAuth:runtimeAuthEnvelope(),runtimeSecrets:runtimeSecretsEnvelope()}),
        signal:controller.signal
      });
    }finally{
      clearTimeout(timeout);
    }
    const text=await res.text();
    if(!res.ok)throw new Error('HTTP '+res.status+' '+text.slice(0,180));
    let data={};try{data=JSON.parse(text)}catch{}
    console.log('cloudflare-sync-ok',data.syncedAt||new Date().toISOString(),'articles='+String(data.articles??'?'),'uploads='+String(data.uploads??'?'));
    return {ok:true,data};
  }catch(err){
    console.error('cloudflare-sync-failed',String(err&&err.message||err));
    return {ok:false,error:String(err&&err.message||err)};
  }finally{
    syncInFlight=false;
    if(syncPending){
      syncPending=false;
      queueCloudflareSync(1200);
    }
  }
}
function queueCloudflareSync(delay=2500){
  if(!syncEnabled())return;
  if(syncTimer)clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>{
    syncTimer=null;
    pushCloudflareSync().catch(err=>console.error('cloudflare-sync-unhandled',String(err&&err.message||err)));
  },delay);
  if(syncTimer&&typeof syncTimer.unref==='function')syncTimer.unref();
}
function restoreFullBackup(payload){
  if(!payload||payload.format!=='nabezsardo-full-backup'||payload.version!==1||!payload.db)throw new Error('invalid-backup');
  createBackup('before-restore');
  for(const name of fs.readdirSync(UPLOAD_DIR)){
    try{fs.unlinkSync(path.join(UPLOAD_DIR,name));}catch{}
  }
  for(const item of Array.isArray(payload.uploads)?payload.uploads:[]){
    const safe=path.basename(String(item.name||''));
    if(!safe||safe!==item.name||!item.data)continue;
    fs.writeFileSync(path.join(UPLOAD_DIR,safe),Buffer.from(item.data,'base64'));
  }
  save(payload.db,false);
}
function id(){return crypto.randomUUID();}
function now(){return new Date().toISOString();}
function slug(v=''){
  return String(v).trim().toLowerCase().replace(/\s+/g,'-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/g,'').replace(/-+/g,'-')
    .replace(/^-|-$/g,'')||Date.now().toString(36);
}
function published(db){
  return [...db.articles].filter(a=>a.status==='published')
    .sort((a,b)=>new Date(b.publishedAt||b.createdAt)-new Date(a.publishedAt||a.createdAt));
}
if(syncEnabled())queueCloudflareSync(10000);
module.exports={load,save,id,now,slug,published,DATA_DIR,UPLOAD_DIR,BACKUP_DIR,DB_FILE,createBackup,listBackups,fullBackup,restoreFullBackup,queueCloudflareSync,pushCloudflareSync};
