const test=require('node:test');
const assert=require('node:assert/strict');
const {home}=require('../lib/view-public');

function fixture(regularCount,shortCount=0){
  const articles=[
    ...Array.from({length:regularCount},(_,i)=>({id:`regular-${i}`,slug:`regular-${i}`,title:`خبر معمولی ${i}`,lead:'خلاصه خبر',status:'published',categoryId:'social',createdAt:new Date(Date.UTC(2026,8,28,12,i)).toISOString(),views:regularCount-i})),
    ...Array.from({length:shortCount},(_,i)=>({id:`short-${i}`,slug:`short-${i}`,title:`خبر کوتاه ${i}`,lead:'خلاصه خبر',status:'published',categoryId:'short-news',createdAt:new Date(Date.UTC(2026,8,28,10,i)).toISOString(),views:i}))
  ];
  return {articles,categories:[{id:'social',name:'اجتماعی'},{id:'short-news',name:'خبر کوتاه'}],settings:{adEnabled:false}};
}
function hrefs(html,className){
  const re=new RegExp('<a class="'+className+'[^"]*"[^>]*href="\\/news\\/(regular-\\d+|short-\\d+)"','g');
  return [...html.matchAll(re)].map(m=>m[1]);
}
function slides(html){
  return [...html.matchAll(/<article class="card glass"[^>]*data-slide[^>]*data-story-title-fa="([^"]*)"[^>]*data-story-url="(\/news\/[A-Za-z0-9_-]+)"/g)];
}

test('Claude home keeps a compact hero, latest grid, short news and popular groups',()=>{
  const html=home(fixture(20,8));
  assert.equal(slides(html).length,6);
  assert.equal(hrefs(html,'nc glass').length,9);
  assert.equal(hrefs(html,'sn').length,4);
  assert.equal(hrefs(html,'mv').length,4);
  assert.deepEqual(hrefs(html,'nc glass'),['regular-19','regular-18','regular-17','regular-16','regular-15','regular-14','regular-13','regular-12','regular-11']);
  assert.ok(html.indexOf('آخرین اخبار')<html.indexOf('خبر کوتاه'));
  assert.match(html,/href="\/all-news"/);
  assert.match(html,/data-story-url="\/news\/[A-Za-z0-9_-]+"/);
});

test('Claude latest grid remains useful in a small newsroom',()=>{
  const html=home(fixture(3));
  assert.equal(slides(html).length,3);
  assert.equal(hrefs(html,'nc glass').length,3);
  assert.match(html,/آخرین اخبار/);
});

test('short news stays in its dedicated strip while featured stories can lead the regular feed',()=>{
 const data=fixture(10,2);
 data.articles.find(a=>a.id==='regular-0').featured=true;
 data.articles.find(a=>a.id==='short-0').publishedAt='2026-09-30T12:00:00Z';
 const html=home(data);
 const latest=hrefs(html,'nc glass');
 const short=hrefs(html,'sn');
 assert.equal(latest[0],'regular-0');
 assert.ok(!latest.includes('short-0'));
 assert.ok(short.includes('short-0'));
});
