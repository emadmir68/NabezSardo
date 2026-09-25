const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'nabez-site-locks-'));
process.env.DATA_DIR=temp;
const store=require('../lib/store');
const common=require('../lib/view-common');
after(()=>fs.rmSync(temp,{recursive:true,force:true}));

function baseDb(){
  return {
    settings:{tagline:'تست'},
    categories:[
      {id:'sardouiyeh',name:'ساردوئیه'},
      {id:'city-village',name:'سیاسی'},
      {id:'social',name:'اجتماعی'},
      {id:'video',name:'ویدئو'},
      {id:'short-news',name:'خبر کوتاه'},
      {id:'opinion',name:'یادداشت و مطالبه'}
    ],
    articles:[]
  };
}

test('fixed categories are restored when missing and remain visible in navigation',()=>{
  const db=store.normalizeEditorialDb(baseDb());
  const incident=db.categories.find(x=>x.id==='incidents');
  const weather=db.categories.find(x=>x.id==='weather');
  assert.equal(incident?.name,'حوادث');
  assert.equal(weather?.name,'آب‌وهوا');
  const nav=common.header(db);
  assert.match(nav,/href="\/category\/incidents"/);
  assert.match(nav,/href="\/category\/weather"/);
});

test('ordinary incident and weather stories are automatically classified',()=>{
  const db=baseDb();
  db.articles=[
    {id:'1',categoryId:'social',title:'واژگونی وانت در محور هفت باغ ۲ مصدوم داشت',lead:'نیروهای امدادی در محل حاضر شدند'},
    {id:'2',categoryId:'social',title:'هشدار هواشناسی برای جنوب کرمان',lead:'بارندگی و وزش باد شدید پیش بینی شده است'}
  ];
  store.normalizeEditorialDb(db);
  assert.equal(db.articles[0].categoryId,'incidents');
  assert.equal(db.articles[1].categoryId,'weather');
});

test('special editorial formats keep their explicit categories',()=>{
  const db=baseDb();
  db.articles=[
    {id:'1',categoryId:'short-news',title:'هشدار هواشناسی و بارندگی شدید'},
    {id:'2',categoryId:'opinion',title:'مطالبه درباره ایمنی جاده و تصادف'},
    {id:'3',categoryId:'video',title:'ویدئو واژگونی خودرو'}
  ];
  store.normalizeEditorialDb(db);
  assert.deepEqual(db.articles.map(x=>x.categoryId),['short-news','opinion','video']);
});

test('article layout lock and social preview fallback stay enabled',()=>{
  const commonSource=fs.readFileSync(path.join(__dirname,'..','lib','view-common.js'),'utf8');
  const publicSource=fs.readFileSync(path.join(__dirname,'..','lib','view-public.js'),'utf8');
  assert.match(commonSource,/\/assets\/article-lock\.css/);
  assert.match(publicSource,/a\.socialImage\|\|a\.image\|\|'\/assets\/header-mosque-final\.jpg'/);
});
