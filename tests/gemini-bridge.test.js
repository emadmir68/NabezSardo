const test=require('node:test');
const assert=require('node:assert/strict');
const store=require('../lib/store');
const bridge=require('../lib/gemini-bridge');

test('Gemini adapter maps a genuine published editorial article',()=>{
 const a={id:'genuine-1',slug:'real-story',title:'خبر واقعی ساردوئیه',lead:'گزارش میدانی از ساردوئیه',body:'پاراگراف اول\n\nپاراگراف دوم',categoryId:'sardouiyeh',location:'جیرفت',status:'published',publishedAt:'2026-11-21T06:00:00Z',image:'/uploads/real.jpg'};
 const v=bridge.mapArticle(a);
 assert.equal(v.id,'genuine-1');assert.equal(v.category,'sarduiyeh');assert.equal(v.region,'jiroft');
 assert.deepEqual(v.body.fa,['پاراگراف اول','پاراگراف دوم']);
 assert.equal(v.coverImage,'/uploads/real.jpg');assert.equal(v.status,'published');
});
test('Gemini never exposes adverts, funeral announcements or drafts',()=>{
 const a=[
  {id:'a',status:'published',title:'گزارش واقعی برداشت محصولات',body:'اخبار واقعی کشاورزی'},
  {id:'b',status:'published',title:'آگهی ترحیم مرحوم',body:'مراسم ختم'},
  {id:'c',status:'published',title:'ثبت سفارش فروش ویژه',body:'رزرو خدمات'},
  {id:'d',status:'draft',title:'خبر در حال نگارش',body:'متن'}
 ];
 assert.deepEqual(store.published({articles:a}).map(x=>x.id),['a']);
});
test('Gemini editor field adapter escapes rich text and refuses arbitrary categories',()=>{
 const a=bridge.articleChanges({title:{fa:'خبر جدید'},body:{fa:['سلام <script>alert(1)</script>']},category:'invalid',status:'published'});
 assert.match(a.bodyHtml,/&lt;script&gt;/);assert.equal(a.categoryId,'sardouiyeh');
});
