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
function section(html,className){
  const start=html.search(new RegExp(`<section[^>]*class="${className}`));
  assert.notEqual(start,-1,`${className} should exist`);
  return html.slice(start,html.indexOf('</section>',start));
}
function storySlugs(html){return new Set([...html.matchAll(/href="\/news\/(regular-\d+|short-\d+)"/g)].map(m=>m[1]));}

test('home shows compact news groups and a chronological latest feed while keeping the full archive available',()=>{
  const html=home(fixture(20,8));
  const important=storySlugs(section(html,'wrap frontpage-desk'));
  const latest=storySlugs(section(html,'wrap section latest-section'));
  const short=storySlugs(section(html,'wrap home-short-news-section'));
  const popular=storySlugs(section(html,'wrap section popular-section'));
  assert.equal(important.size,5);
  assert.equal(latest.size,6);
  assert.equal(short.size,5);
  assert.equal(popular.size,3);
  assert.deepEqual([...latest],['regular-19','regular-18','regular-17','regular-16','regular-15','regular-14']);
  assert.ok(html.indexOf('id="latest"')<html.indexOf('class="wrap home-short-news-section"'));
  assert.ok(html.indexOf('id="latest"')<html.indexOf('class="wrap promo-slot promo-citizen"'));
  assert.doesNotMatch(html,/aria-label="نبض امروز"/);
  assert.match(html,/href="\/all-news"/);
});

test('latest news remains useful in a small newsroom',()=>{
  const html=home(fixture(3));
  const important=storySlugs(section(html,'wrap frontpage-desk'));
  const latest=storySlugs(section(html,'wrap section latest-section'));
  assert.equal(important.size,3);
  assert.equal(latest.size,3);
  assert.match(section(html,'wrap section latest-section'),/آرشیو کامل/);
});

test('latest includes recent short and featured stories regardless of top-story selection',()=>{
 const data=fixture(10,2);
 data.articles.find(a=>a.id==='regular-0').featured=true;
 data.articles.find(a=>a.id==='short-0').publishedAt='2026-09-30T12:00:00Z';
 const slugs=storySlugs(section(home(data),'wrap section latest-section'));
 assert.deepEqual([...slugs],['short-0','regular-9','regular-8','regular-7','regular-6','regular-5']);
});
