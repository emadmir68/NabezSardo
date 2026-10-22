const test=require('node:test');
const assert=require('node:assert/strict');
const {listingImage,listingExcerpt,card,e}=require('../lib/view-common');

test('listing images prefer the primary photo, then gallery or body media, then branded fallback',()=>{
  const a={id:'media-order',categoryId:'incidents',image:'/uploads/primary.jpg',gallery:['/uploads/gallery.jpg'],bodyHtml:'<p>خبر</p><img src="/uploads/inline.jpg?a=1&amp;b=2">'};
  assert.equal(listingImage(a),'/uploads/primary.jpg');
  assert.equal(listingImage({...a,imageAuto:true}),'/uploads/gallery.jpg');
  assert.equal(listingImage({...a,image:'',gallery:['/assets/news-cover.svg','javascript:bad']}),'/uploads/inline.jpg?a=1&b=2');
  assert.match(listingImage({id:a.id,categoryId:a.categoryId}),/^\/assets\/news-cover-incidents-/);
});

test('listing excerpts stay bounded while full stored and shared leads remain intact',()=>{
  const a={id:'long',slug:'long',title:'خبر منطقه',lead:'خبر منطقه '+('جزئیات تازه از یک خبر محلی. '.repeat(30)),body:'متن کامل خبر',categoryId:'incidents'};
  const before=JSON.stringify(a),summary=listingExcerpt(a);
  assert.ok(summary.length<=160);
  assert.ok(summary.endsWith('…'));
  assert.ok(summary.startsWith('جزئیات'));
  const html=card(a,{categories:[{id:'incidents',name:'حوادث'}]});
  assert.ok(html.includes('data-story-lead-fa="'+e(a.lead)+'"'));
  assert.ok(html.includes('<p class="listing-excerpt"><span class="lang-fa">'+e(summary)+'</span></p>'));
  assert.equal(JSON.stringify(a),before);
  assert.equal(listingExcerpt({title:'تیتر',lead:'تیتر',bodyHtml:'<p>متن کوتاه خبر</p>'}),'متن کوتاه خبر');
  assert.equal(listingExcerpt({titleEn:'Title',leadEn:'Title',bodyEn:'English body'},'en'),'English body');
});
