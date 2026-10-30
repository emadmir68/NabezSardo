const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const home=require('../lib/view-home-2026');
function fixture(count=15){
  return {
    categories:[{id:'social',name:'اجتماعی'},{id:'culture',name:'فرهنگی'},{id:'short-news',name:'خبر کوتاه'}],
    settings:{},
    articles:Array.from({length:count},(_,i)=>({
      id:'news-'+i,slug:'story-'+i,title:'خبر محلی شماره '+i,
      lead:'گزارش محلی از ساردوئیه و جیرفت',
      status:'published',categoryId:i%6===0?'short-news':'social',
      createdAt:new Date(Date.UTC(2026,9,20,0,i)).toISOString(),
      image:'/assets/news-cover.svg',views:i
    }))
  };
}
test('premium homepage renders both with data and without articles',()=>{
  const html=home(fixture(15));
  assert.match(html,/class="ns26-site"/);
  assert.match(html,/cloud-dancer-2026\.css/);
  assert.match(html,/cloud-dancer-2026\.js/);
  assert.match(html,/href="\/send-news"/);
  assert.match(html,/href="\/all-news"/);
  assert.match(html,/href="\/news\/story-1"/);
  assert.match(html,/aria-label="فهرست اصلی"/);
  assert.match(home(fixture(0)),/در انتظار انتشار خبرهای تازه/);
});
test('new home links to original news, categories, and community submission',()=>{
  const html=home(fixture(15));
  assert.match(html,/href="\/local\/jiroft"/);
  assert.match(html,/href="\/category\/social"/);
  assert.match(html,/href="\/news\/story-3"/);
  assert.match(html,/action="\/search"/);
});
test('design assets are present and mobile/reduced-motion rules exist',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../public/cloud-dancer-2026.css'),'utf8');
  const js=fs.readFileSync(path.join(__dirname,'../public/cloud-dancer-2026.js'),'utf8');
  assert.match(css,/max-width:620px/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(js,/aria-expanded/);
});