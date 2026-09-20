const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const DATA_DIR=process.env.DATA_DIR||path.join(__dirname,'..','data');
fs.mkdirSync(DATA_DIR,{recursive:true});
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
  if(!fs.existsSync(DB_FILE)) save(clone(initial));
  try{
    const db=JSON.parse(fs.readFileSync(DB_FILE,'utf8'));
    db.settings=db.settings||clone(initial.settings);
    db.categories=db.categories||clone(initial.categories);
    db.articles=db.articles||[];
    db.contacts=db.contacts||[];
    db.citizens=db.citizens||[];
    return db;
  }catch{return clone(initial);}
}
function save(db){
  const tmp=DB_FILE+'.tmp';
  fs.writeFileSync(tmp,JSON.stringify(db,null,2),'utf8');
  fs.renameSync(tmp,DB_FILE);
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
module.exports={load,save,id,now,slug,published};