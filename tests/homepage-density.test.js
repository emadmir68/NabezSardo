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

test('home shows compact, distinct news groups while keeping the full archive available',()=>{
  const html=home(fixture(20,8));
  const important=storySlugs(section(html,'wrap frontpage-desk'));
  const latest=storySlugs(section(html,'wrap section latest-section'));
  const short=storySlugs(section(html,'wrap home-short-news-section'));
  const popular=storySlugs(section(html,'wrap section popular-section'));
  assert.equal(important.size,5);
  assert.equal(latest.size,6);
  assert.equal(short.size,5);
  assert.equal(popular.size,3);
  assert.deepEqual([...latest].filter(slug=>important.has(slug)),[]);
  assert.doesNotMatch(html,/aria-label="نبض امروز"/);
  assert.match(html,/href="\/all-news"/);
});

test('a small newsroom does not repeat the leading stories in latest news',()=>{
  const html=home(fixture(3));
  const important=storySlugs(section(html,'wrap frontpage-desk'));
  const latest=storySlugs(section(html,'wrap section latest-section'));
  assert.equal(important.size,3);
  assert.equal(latest.size,0);
  assert.match(section(html,'wrap section latest-section'),/آرشیو کامل/);
});
