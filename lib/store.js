const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const DATA_DIR=process.env.DATA_DIR||path.join(__dirname,'..','data');
const UPLOAD_DIR=process.env.UPLOAD_DIR||path.join(DATA_DIR,'uploads');
const BACKUP_DIR=path.join(DATA_DIR,'backups');
fs.mkdirSync(DATA_DIR,{recursive:true});
fs.mkdirSync(UPLOAD_DIR,{recursive:true});
fs.mkdirSync(BACKUP_DIR,{recursive:true});
const DB_FILE=path.join(DATA_DIR,'db.json');

const initial={
  settings:{siteName:'نبض ساردو',tagline:'صدای ساردوئیه، روایت مردم'},
  categories:[
    ['sardouiyeh','ساردوئیه'],['city-village','شهر و روستا'],['social','اجتماعی'],
    ['culture','فرهنگی'],['sports','ورزش'],['agriculture','کشاورزی'],
    ['tourism','گردشگری'],['kerman','استان کرمان'],['video','ویدئو']
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
    db.categories=db.categories||clone(initial.categories);
    const politicalCategory=db.categories.find(x=>x&&x.id==='city-village');
    if(politicalCategory)politicalCategory.name='سیاسی';
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
module.exports={load,save,id,now,slug,published,DATA_DIR,UPLOAD_DIR,BACKUP_DIR,DB_FILE,createBackup,listBackups,fullBackup,restoreFullBackup};