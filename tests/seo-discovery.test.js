const test=require('node:test');
const assert=require('node:assert/strict');
const views=require('../lib/view-public');
const {footer}=require('../lib/view-common');
const db={settings:{},categories:[{id:'short-news',name:'خبر کوتاه'},{id:'social',name:'اجتماعی'}],articles:[
 {id:'short',slug:'short',title:'خبر کوتاه کهنوج',categoryId:'short-news',status:'published',createdAt:'2026-09-29T06:00:00Z'},
 {id:'local',slug:'local',title:'خبر عنبر آباد',categoryId:'social',status:'published',createdAt:'2026-09-29T06:00:00Z'},
 {id:'national',slug:'national',title:'خبر ملی',location:'ساردوئیه',categoryId:'social',status:'published',createdAt:'2026-09-29T06:00:00Z'}
]};
test('short-news archive renders published article links',()=>{
 assert.match(views.category(db,db.categories[0]),/href="\/news\/short"/);
});
test('editorial policy renders an indexable page with a correction contact',()=>{
 const html=views.editorialPolicy(db);
 assert.match(html,/rel="canonical" href="https:\/\/nabzesardo.ir\/editorial-policy"/);
 assert.match(html,/href="\/contact"/);
});
test('all five local hubs render, and southern hubs include their towns',()=>{
 for(const key of ['sardouiyeh','jiroft','anbarabad','kahnuj','south-kerman'])assert.ok(views.localHub(db,key));
 assert.match(views.localHub(db,'anbarabad'),/href="\/news\/local"/);
 assert.match(views.localHub(db,'south-kerman'),/href="\/news\/short"/);
 assert.doesNotMatch(views.localHub(db,'sardouiyeh'),/href="\/news\/national"/);
});
test('local hubs and editorial policy have crawlable internal links',()=>{
 const html=footer();
 for(const key of ['sardouiyeh','jiroft','anbarabad','kahnuj','south-kerman'])assert.ok(html.includes('href="/local/'+key+'"'));
 assert.match(html,/href="\/editorial-policy"/);
});

test('publisher identity, newsroom contact and utility-page indexing stay explicit',()=>{
 assert.match(views.home(db),/\/assets\/logo\.svg/);
 assert.match(views.article(db,db.articles[0]),/\/assets\/logo\.svg/);
 assert.match(views.simple(db,'contact'),/راه ارتباط رسمی/);
 assert.match(views.simple(db,'send-news'),/name="robots" content="noindex,follow"/);
 assert.match(views.followup(db),/name="robots" content="noindex,follow"/);
});

test('every canonical page advertised by the sitemap is reachable',async t=>{
 const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'news-seo-')),port=28000+Math.floor(Math.random()*10000),base='http://127.0.0.1:'+port;
 fs.writeFileSync(path.join(dir,'db.json'),JSON.stringify(db));
 const child=spawn(process.execPath,['app.js'],{env:{...process.env,PORT:String(port),DATA_DIR:dir,CLOUDFLARE_WORKER:'1',PUBLIC_BASE_URL:base},stdio:['ignore','pipe','pipe']});
 t.after(()=>{child.kill();fs.rmSync(dir,{recursive:true,force:true})});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('server timeout')),10000);child.stdout.on('data',data=>{if(String(data).includes('running on')){clearTimeout(timer);resolve()}});child.on('error',reject)});
 const map=await (await fetch(base+'/sitemap.xml')).text();
 const urls=[...map.matchAll(/<url><loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
 assert.ok(urls.length>5);
 for(const url of urls){
   const res=await fetch(url);
   assert.equal(res.status,200,url);
   const html=await res.text();
   assert.ok(html.includes('rel="canonical" href="'+url+'"'),url);
   assert.doesNotMatch(html,/<meta name="robots" content="noindex/);
 }
});
