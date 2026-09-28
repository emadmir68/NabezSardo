const test=require('node:test');
const assert=require('node:assert/strict');
const {home,article}=require('../lib/view-public');
const {detectTheme}=require('../lib/auto-cover');
const {displayImage}=require('../lib/view-common');

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

test('old automatic agriculture cover follows the incident category across cards and article',()=>{
  const data=db({adEnabled:false});
  data.articles[11].categoryId='incidents';
  data.articles[11].image='/uploads/auto-cover-old.svg';
  data.articles[11].socialImage='/uploads/auto-cover-old-social.png';
  data.articles[11].imageAuto=true;
  data.articles[11].autoCoverTheme='agriculture';
  const html=home(data);
  assert.match(html,/src="\/assets\/news-cover-incidents.svg"/);
  assert.doesNotMatch(html,/src="\/uploads\/auto-cover-old.svg"/);
  const detail=article(data,data.articles[11]);
  assert.match(detail,/class="cover" src="\/assets\/news-cover-incidents.svg"/);
  assert.doesNotMatch(detail,/class="cover" src="\/uploads\/auto-cover-old.svg"/);
  assert.match(detail,/property="og:image" content="https:\/\/nabzesardo.ir\/assets\/news-cover-incidents.svg"/);
});

test('automatic covers use restrained category variants while real images stay intact',()=>{
  assert.equal(displayImage({imageAuto:true,categoryId:'weather',image:'/uploads/auto-cover-a.svg'}),'/assets/news-cover-weather.svg');
  assert.equal(displayImage({imageAuto:true,categoryId:'social',image:'/uploads/auto-cover-b.svg'}),'/assets/news-cover-social.svg');
  assert.equal(displayImage({imageAuto:true,categoryId:'culture',image:'/uploads/auto-cover-c.svg'}),'/assets/news-cover-culture.svg');
  assert.equal(displayImage({image:'/uploads/real-photo.jpg',categoryId:'weather'}),'/uploads/real-photo.jpg');
});

test('incident category takes priority over a place name containing باغ',async()=>{
  const article={title:'واژگونی وانت در هفت‌باغ',lead:'دو مصدوم',categoryId:'incidents'};
  const category={id:'incidents',name:'حوادث'};
  assert.equal(detectTheme(article,category),'incidents');
  const {ensureSmartCover}=await import('../src/smart-cover.js');
  const result=await ensureSmartCover({article,category,sourceImage:'',getMedia:async()=>null,putMedia:async()=>{},sha256Hex:async()=> '0'.repeat(64)});
  assert.equal(result.autoCoverTheme,'incidents');
});

test('regional focus links to live local news instead of generic category tiles',()=>{
  const data=db();
  data.articles[11].location='ساردوئیه';
  data.articles[10].location='جیرفت';
  data.articles[9].location='جنوب کرمان';
  const html=home(data);
  for(const key of ['sardouiyeh','jiroft','south-kerman'])assert.match(html,new RegExp(`href="/local/${key}"`));
  assert.doesNotMatch(html,/خبرها و گزارش‌های منتخب این حوزه/);
});
