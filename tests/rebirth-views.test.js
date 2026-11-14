'use strict';
const assert=require('node:assert/strict');
const views=require('../lib/views-rebirth');
const {shortArticleCode}=require('../lib/rebirth-shared');

const now=new Date().toISOString();
const sample={
  settings:{siteName:'نبض ساردو',breakingText:'گزارش‌های تازه جنوب کرمان',liveDeskEnabled:true,adEnabled:false},
  categories:[{id:'agriculture',name:'کشاورزی'},{id:'social',name:'اجتماعی'},{id:'short-news',name:'خبر کوتاه'}],
  articles:[
    {id:'one',slug:'agriculture-future',title:'آینده کشاورزی جنوب کرمان',lead:'گزارشی از فرصت‌ها و چالش‌های کشاورزی منطقه',body:'متن کامل گزارش',bodyHtml:'<p>متن کامل گزارش</p>',categoryId:'agriculture',status:'published',publishedAt:now,createdAt:now,author:'تحریریه نبض ساردو',location:'جیرفت',views:25,image:'/uploads/sample.webp',featured:true},
    {id:'two',slug:'water-resources',title:'مدیریت منابع آب در جنوب کرمان',lead:'ضرورت مدیریت پایدار منابع آب',body:'گزارش آب',categoryId:'social',status:'published',publishedAt:now,createdAt:now,location:'جنوب کرمان',views:10,image:'/uploads/water.webp'}
  ],
  contacts:[{id:'c1',name:'مخاطب',subject:'پیگیری خبر',message:'لطفاً این موضوع را بررسی کنید',contact:'09120000000',createdAt:now}],
  citizens:[{id:'u1',name:'شهروند',headline:'گزارش مردمی',details:'شرح رویداد',phone:'09120000000',location:'جیرفت',createdAt:now}]
};
function fresh(html,label){
  assert.match(html,/\/assets\/rebirth\.css\?v=[^" ]+/,label+' loads versioned new design system');
  assert.match(html,/\/assets\/rebirth\.js\?v=[^" ]+/,label+' loads versioned client');
  assert.doesNotMatch(html,/\/assets\/site\.css|\/assets\/header-fix\.css|spatial-rail/,label+' does not reuse legacy visual shell');
}
const home=views.home(sample);
fresh(home,'homepage');
assert.match(home,/rb-hero-story/);
assert.match(home,/آینده کشاورزی جنوب کرمان/);
assert.match(home,/نبض فوری/);

const article=views.article(sample,sample.articles[0]);
fresh(article,'article');
assert.match(article,/NewsArticle/);
assert.match(article,/rb-article-body/);
assert.match(article,/آینده کشاورزی جنوب کرمان/);
const shortArticlePath='/news/'+shortArticleCode(sample.articles[0].id);
assert.ok(article.includes('rel="canonical" href="https://nabzesardo.ir'+shortArticlePath+'"'));
assert.ok(article.includes('property="og:url" content="https://nabzesardo.ir'+shortArticlePath+'"'));
assert.ok(article.includes('property="og:title" content="آینده کشاورزی جنوب کرمان"'));
assert.ok(article.includes('property="og:image:secure_url"'));
assert.ok(article.includes('property="og:image:alt" content="آینده کشاورزی جنوب کرمان"'));
assert.ok(article.includes('name="twitter:card" content="summary_large_image"'));
assert.ok(article.includes('data-article-url="'+shortArticlePath+'"'));
assert.ok(article.includes('data-article-canonical="'+shortArticlePath+'"'));
assert.ok(article.includes('property="article:published_time"'));
const noImageArticle=views.article(sample,{...sample.articles[0],id:'no-image',image:'',socialImage:''});
assert.ok(noImageArticle.includes('https://nabzesardo.ir/header-mosque-fixed.jpg'));
assert.ok(!noImageArticle.includes('property="og:image" content="https://nabzesardo.ir/assets/placeholder.svg"'));

const category=views.category(sample,sample.categories[0]);
fresh(category,'category');
assert.match(category,/اخبار/);

const archive=views.archive(sample);
fresh(archive,'archive');
assert.match(archive,/rb-news-grid/);

const search=views.search(sample,'کشاورزی');
fresh(search,'search');
assert.match(search,/آینده کشاورزی/);

const local=views.localHub(sample,'south-kerman');
fresh(local,'local hub');
assert.match(local,/جنوب کرمان/);

const contact=views.simple(sample,'contact',false);
fresh(contact,'contact');
assert.match(contact,/action="\/contact"/);

const citizen=views.simple(sample,'send-news',false);
fresh(citizen,'citizen news');
assert.match(citizen,/name="mediaFile"/);

const login=views.login(false);
assert.match(login,/name="username"/);
assert.match(login,/name="password"/);
assert.match(login,/\/assets\/rebirth\.css/);

const admin=views.admin(sample,[],new URLSearchParams(),{telegram:false,rubika:false,whatsapp:false,baseUrl:true},{totalPageViews:100,today:{pageViews:20}},{settings:{enabled:true,keywords:'جیرفت'},sources:[],queue:[],counts:{pending:0,sourcesOn:0,sources:0}});
assert.match(admin,/rb-admin-layout/);
assert.match(admin,/action="\/admin\/news-monitor\/settings"/);
assert.match(admin,/آگهی، محتوای تبلیغاتی و اطلاعیه‌های فوت/);
assert.doesNotMatch(admin,/\/assets\/site\.css/);

const editor=views.editor(sample,{title:'خبر آزمایشی',categoryId:'agriculture',bodyHtml:'<p>متن</p>',status:'draft'});
assert.match(editor,/data-rebirth-editor/);
assert.match(editor,/name="bodyHtml"/);
assert.match(editor,/name="imageFile"/);
assert.match(editor,/name="videoFile"/);
assert.match(editor,/name="galleryJson"/);

const previousEnv={primary:process.env.CLOUDFLARE_PRIMARY,readonly:process.env.PREVIEW_READONLY,assetVersion:process.env.CLOUDFLARE_ASSET_VERSION};
try{
  process.env.CLOUDFLARE_PRIMARY='1';
  process.env.PREVIEW_READONLY='1';
  process.env.CLOUDFLARE_ASSET_VERSION='production-test-sha';
  const productionHtml=views.home(sample);
  assert.match(productionHtml,/name="robots" content="index,follow/);
  assert.match(productionHtml,/\\/assets\\/rebirth\\.css\\?v=production-test-sha/);
  process.env.CLOUDFLARE_PRIMARY='0';
  const previewHtml=views.home(sample);
  assert.match(previewHtml,/name="robots" content="noindex,nofollow,noarchive"/);
}finally{
  if(previousEnv.primary===undefined)delete process.env.CLOUDFLARE_PRIMARY;else process.env.CLOUDFLARE_PRIMARY=previousEnv.primary;
  if(previousEnv.readonly===undefined)delete process.env.PREVIEW_READONLY;else process.env.PREVIEW_READONLY=previousEnv.readonly;
  if(previousEnv.assetVersion===undefined)delete process.env.CLOUDFLARE_ASSET_VERSION;else process.env.CLOUDFLARE_ASSET_VERSION=previousEnv.assetVersion;
}

console.log('rebirth view tests passed');
