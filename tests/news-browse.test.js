const test=require('node:test');
const assert=require('node:assert/strict');
const {browseNews}=require('../lib/news-browse');
const {archive}=require('../lib/view-public');
const now=Date.parse('2026-09-30T21:00:00Z'); // 00:30 Thursday in Tehran
const articles=Array.from({length:29},(_,i)=>({
 id:'a'+i,slug:'story-'+i,title:'خبر کشاورزی '+i,lead:'گزارش محلی',status:'published',
 categoryId:i%2?'social':'agriculture',createdAt:new Date(now-i*3600000).toISOString()
}));
const db={settings:{},categories:[{id:'agriculture',name:'کشاورزی'},{id:'social',name:'اجتماعی'}],articles};

test('archive paginates in date order without hiding or duplicating published stories',()=>{
 const pages=[1,2,3].map(page=>browseNews(articles,{page},now));
 assert.deepEqual(pages.map(x=>x.items.length),[12,12,5]);
 assert.equal(new Set(pages.flatMap(x=>x.items).map(x=>x.id)).size,29);
 assert.deepEqual(pages.flatMap(x=>x.items).map(x=>x.id),articles.map(x=>x.id));
 assert.equal(browseNews(articles,{page:'999'},now).page,3);
 assert.equal(browseNews(articles,{page:'wrong'},now).page,1);
 assert.equal(browseNews([],{},now).pages,1);
});
test('search, category and date filters work together, including Persian spelling variants',()=>{
 const extra={id:'extra',slug:'extra',title:'كشاورزي جديد',lead:'',categoryId:'agriculture',status:'published',createdAt:new Date(now).toISOString()};
 const result=browseNews([...articles,extra],{q:'کشاورزی',category:'agriculture',period:'today'},now);
 assert.deepEqual(result.items.map(x=>x.id),['a0','extra']);
 assert.equal(browseNews(articles,{category:'unknown'},now).total,0);
 assert.equal(browseNews([...articles,{...extra,status:'draft'}],{},now).total,29);
});
test('today follows Tehran midnight and the last week is a rolling seven-day interval',()=>{
 const entries=[
  {...articles[0],id:'today',createdAt:'2026-09-30T20:45:00Z'},
  {...articles[0],id:'yesterday',createdAt:'2026-09-30T20:20:00Z'},
  {...articles[0],id:'week-edge',createdAt:new Date(now-7*86400000).toISOString()},
  {...articles[0],id:'old',createdAt:new Date(now-7*86400000-1).toISOString()}
 ];
 assert.deepEqual(browseNews(entries,{period:'today'},now).items.map(x=>x.id),['today']);
 assert.equal(browseNews(entries,{period:'week'},now).total,3);
});
test('archive controls are labeled and pagination preserves active filters',()=>{
 const html=archive(db,{q:'کشاورزی',category:'agriculture',period:'month',page:1});
 assert.match(html,/id="archive-category"/);
 assert.match(html,/id="archive-period"/);
 assert.match(html,/aria-label="صفحه‌های آرشیو"/);
 assert.match(html,/category=agriculture(?:&amp;|&)period=month(?:&amp;|&)page=2/);
 assert.match(html,/name="robots" content="noindex,follow"/);
 const page2=archive(db,{page:2});
 assert.match(page2,/rel="canonical" href="https:\/\/nabzesardo.ir\/all-news\?page=2"/);
 const empty=archive(db,{q:'مورد پیدا نشد'});
 assert.match(empty,/خبری با این فیلترها پیدا نشد/);
 assert.doesNotMatch(empty,/data-story-card/);
});
