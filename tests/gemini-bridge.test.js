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
  {id:'d',status:'draft',title:'خبر در حال نگارش',body:'متن'},
  {id:'e',status:'published',title:'با سلام و احترام، خدمت یکایک اعضای محترم سردخانه داران',body:'درود دوستان و همراهان'},
  {id:'f',status:'published',title:'آیت الله وحید خراسانی به خاک سپرده شد',body:'اطلاعیه خاکسپاری'}
 ];
 assert.deepEqual(store.published({articles:a}).map(x=>x.id),['a']);
});
test('Gemini editor field adapter escapes rich text and refuses arbitrary categories',()=>{
 const a=bridge.articleChanges({title:{fa:'خبر جدید'},body:{fa:['سلام <script>alert(1)</script>']},category:'invalid',status:'published'});
 assert.match(a.bodyHtml,/&lt;script&gt;/);assert.equal(a.categoryId,'sardouiyeh');
});

test('Gemini deduplicates live headline and deck without rewriting the story',()=>{
 const title='حجت‌الاسلام در خطبه‌های نماز جمعه سخن گفت';
 const a={id:'550e8400-e29b-41d4-a716-446655440000',slug:'test',title,lead:title+'؛ جزئیات این خبر از سوی تحریریه پیگیری شد.',body:'گزارش تکمیلی',categoryId:'weather',status:'published'};
 const v=bridge.mapArticle(a);
 assert.equal(v.category,'social');
 assert.equal(v.deck.fa,'جزئیات این خبر از سوی تحریریه پیگیری شد.');
 assert.equal(v.shortCode,BigInt('0x550e8400e29b41d4a716446655440000').toString(36).padStart(25,'0'));
});
test('Source photos remain untouched and regional images keep trusted paths',()=>{
 const a={id:'v2',title:'خبر کشاورزی جیرفت',lead:'توضیح خبر',image:'/uploads/real-original.jpg',status:'published'};
 assert.equal(bridge.mapArticle(a).coverImage,'/uploads/real-original.jpg');
});

test('monitor quarantine v5 removes old forbidden articles and queue items without deleting records',()=>{
  const monitor=require('../lib/news-monitor');
  const db={
    articles:[
      {id:'g',status:'published',title:'گزارش جدید از توسعه کشاورزی',lead:'آخرین خبر واقعی در جنوب کرمان'},
      {id:'bad1',status:'published',title:'با سلام و احترام، خدمت یکایک اعضای محترم',lead:'از همه شما تقاضا داریم'},
      {id:'bad2',status:'published',title:'آیت الله وحید خراسانی به خاک سپرده شد',lead:'آیین خاکسپاری'}
    ],
    newsMonitor:{
      nonNewsPolicyVersion:3,sourceConfigVersion:5,logicVersion:4,
      queue:[{id:'q1',title:'آگهی ترحیم مرحوم',status:'pending',articleId:'bad2'}],
      sources:[{id:'custom',name:'local source',url:'https://example.com',enabled:false}],
      settings:{enabled:false}
    }
  };
  monitor.ensure(db);
  assert.equal(db.articles[0].status,'published');
  assert.equal(db.articles[1].status,'draft');
  assert.equal(db.articles[2].status,'draft');
  assert.equal(db.newsMonitor.queue.find(q=>q.id==='q1').status,'rejected');
  assert.equal(db.newsMonitor.nonNewsPolicyVersion,5);
});
