const test=require('node:test');
const assert=require('node:assert/strict');
const {sanitizeRich,normalizeRich,articlePayload}=require('../lib/article-tools');

test('article editor preserves safe headings, pull quotes, lists and captioned inline figures',()=>{
  const source='<h2>جزئیات گزارش</h2><blockquote>نقل‌قول برجسته</blockquote><ul><li>نکته نخست</li><li>نکته دوم</li></ul><figure onclick="alert(1)"><img src="/uploads/inline.webp" alt="نمای گزارش" onerror="alert(1)"><figcaption>شرح تصویر در متن خبر</figcaption></figure>';
  const html=normalizeRich(source);
  assert.match(html,/<h2>جزئیات گزارش<\/h2>/);
  assert.match(html,/<blockquote>نقل‌قول برجسته<\/blockquote>/);
  assert.match(html,/<ul><li>نکته نخست<\/li><li>نکته دوم<\/li><\/ul>/);
  assert.match(html,/<figure><img src="\/uploads\/inline\.webp" alt="نمای گزارش"><figcaption>شرح تصویر در متن خبر<\/figcaption><\/figure>/);
  assert.doesNotMatch(html,/onclick=|onerror=|alert\(1\)/);
});

test('featured-image caption is retained when an existing image is edited',async()=>{
  const db={categories:[{id:'culture',name:'فرهنگی'}],articles:[]};
  const current={id:'article-1',image:'/uploads/cover.webp',imageWidth:1200,imageHeight:675,imageRatio:16/9,imageOrientation:'landscape',imageAuto:false};
  const form={title:'گزارش فرهنگی',categoryId:'culture',lead:'خلاصه گزارش',bodyHtml:'<p>متن خبر</p>',status:'draft',autoCover:'0',imageCaption:'نمایی از محل برگزاری جشنواره',galleryJson:'[]'};
  const payload=await articlePayload(db,form,{},current,(_db,slug)=>slug);
  assert.equal(payload.image,'/uploads/cover.webp');
  assert.equal(payload.imageCaption,'نمایی از محل برگزاری جشنواره');
});
