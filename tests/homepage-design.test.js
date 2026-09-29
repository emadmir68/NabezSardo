const test=require('node:test');
const assert=require('node:assert/strict');
const {home,article}=require('../lib/view-public');
const {detectTheme}=require('../lib/auto-cover');

function db(settings={}){
  const categories=['incidents','weather','opinion','sardouiyeh','city-village','social','culture','sports','agriculture'].map((id,i)=>({id,name:['حوادث','آب‌وهوا','یادداشت و مطالبه','ساردوئیه','سیاسی','اجتماعی','فرهنگی','ورزش','کشاورزی'][i]}));
  const articles=Array.from({length:12},(_,i)=>({id:`story-${i}`,slug:`story-${i}`,title:`خبر ${i}`,lead:'متن خبر',status:'published',categoryId:categories[i%categories.length].id,createdAt:new Date(Date.UTC(2026,8,28,12,i)).toISOString()}));
  return {categories,articles,settings:{adEnabled:true,adTitle:'جای تبلیغات شما اینجاست',adText:'برای رزرو این جایگاه با نبض ساردو در ارتباط باشید',adLink:'/contact',...settings}};
}

test('home has one citizen callout and a compact six-category navigation',()=>{
  const html=home(db());
  assert.equal((html.match(/class="wrap promo-slot promo-citizen"/g)||[]).length,1);
  assert.doesNotMatch(html,/class="wrap citizen"/);
  assert.equal((html.match(/class="home-topic-card"/g)||[]).length,6);
  assert.doesNotMatch(html,/TOPIC TERMINAL|nabez@newsroom/);
  assert.match(html,/href="\/all-news"/);
});

test('placeholder advertising stays out of the reading flow, but a configured ad appears',()=>{
  assert.doesNotMatch(home(db()),/class="wrap home-ad-slot"/);
  assert.match(home(db({adTitle:'تبلیغ کافه دارما'})),/class="wrap home-ad-slot"/);
});

test('old automatic agriculture cover is replaced by the neutral branded cover in home cards',()=>{
  const data=db({adEnabled:false});
  data.articles[11].categoryId='incidents';
  data.articles[11].image='/uploads/auto-cover-old.svg';
  data.articles[11].imageAuto=true;
  data.articles[11].autoCoverTheme='agriculture';
  const html=home(data);
  assert.match(html,/src="\/assets\/news-cover-(?:crimson|burgundy)\.svg\?v=colors-20260929"/);
  assert.doesNotMatch(html,/src="\/uploads\/auto-cover-old.svg"/);
  const detail=article(data,data.articles[11]);
  assert.match(detail,/class="cover" src="\/assets\/news-cover-(?:crimson|burgundy)\.svg\?v=colors-20260929"/);
  assert.doesNotMatch(detail,/class="cover" src="\/uploads\/auto-cover-old.svg"/);
});

test('stories without media or with a legacy placeholder share the premium cover while real photos remain',()=>{
  const {displayImage}=require('../lib/view-common');
  const premium='/assets/news-cover.svg?v=premium-20260929';
  assert.equal(displayImage({}),premium);
  assert.equal(displayImage({image:'/assets/placeholder.svg'}),premium);
  assert.equal(displayImage({image:'/uploads/placeholder.svg?old=1'}),premium);
  assert.equal(displayImage({image:'/uploads/real-photo.jpg'}),'/uploads/real-photo.jpg');
  const html=home(db());
  assert.doesNotMatch(html,/src="\/assets\/placeholder\.svg"/);
});

test('category palettes separate cover colors, including repeated political stories',()=>{
  const {displayImage}=require('../lib/view-common');
  assert.match(displayImage({id:'incident-1',categoryId:'incidents'}),/news-cover-(?:crimson|burgundy)\.svg\?v=colors-20260929$/);
  assert.match(displayImage({id:'weather-1',categoryId:'weather'}),/news-cover-(?:blue|indigo)\.svg\?v=colors-20260929$/);
  assert.match(displayImage({id:'farm-1',categoryId:'agriculture'}),/news-cover-(?:olive|green)\.svg\?v=colors-20260929$/);
  const political=['politics-1','politics-2','politics-3','politics-4'].map(id=>displayImage({id,categoryId:'city-village'}));
  assert.ok(new Set(political).size>=2);
  assert.equal(displayImage({id:'photo',categoryId:'incidents',image:'/uploads/real-photo.jpg'}),'/uploads/real-photo.jpg');
});

test('every category cover URL has a deployable SVG asset',()=>{
  const fs=require('node:fs');
  const path=require('node:path');
  const {displayImage}=require('../lib/view-common');
  for(const categoryId of ['incidents','weather','agriculture','sports','tourism','social','culture','city-village','opinion','short-news','video','kerman','sardouiyeh']){
    for(let i=0;i<12;i++){
      const pathname=displayImage({id:`${categoryId}-${i}`,categoryId}).split('?')[0].replace('/assets/','');
      const svg=fs.readFileSync(path.join(__dirname,'../public',pathname),'utf8');
      assert.match(svg,/<svg\b/);
    }
  }
});

test('incident category takes priority over a place name containing باغ',async()=>{
  const article={title:'واژگونی وانت در هفت‌باغ',lead:'دو مصدوم',categoryId:'incidents'};
  const category={id:'incidents',name:'حوادث'};
  assert.equal(detectTheme(article,category),'incidents');
  const {ensureSmartCover}=await import('../src/smart-cover.js');
  const result=await ensureSmartCover({article,category,sourceImage:'',getMedia:async()=>null,putMedia:async()=>{},sha256Hex:async()=> '0'.repeat(64)});
  assert.equal(result.autoCoverTheme,'incidents');
});

test('new automatic cover carries a safe Persian headline and keeps real photography',async()=>{
  const {ensureSmartCover}=await import('../src/smart-cover.js');
  let stored='';
  const args={article:{title:'خبر مهم ساردو <امروز> و تازه‌های جنوب کرمان',lead:'گزارش محلی',categoryId:'social'},category:{id:'social',name:'اجتماعی'},getMedia:async()=>null,putMedia:async(_name,data)=>{stored=data.toString('utf8')},sha256Hex:async()=> '1'.repeat(64)};
  const generated=await ensureSmartCover({...args,sourceImage:''});
  assert.equal(generated.imageAuto,true);
  assert.match(stored,/خبر مهم ساردو &lt;امروز&gt;/);
  assert.doesNotMatch(stored,/<امروز>/);
  assert.match(stored,/نبض ساردو/);
  const original=await ensureSmartCover({...args,sourceImage:'/uploads/real-photo.jpg'});
  assert.equal(original.image,'/uploads/real-photo.jpg');
  assert.equal(original.imageAuto,false);
});
