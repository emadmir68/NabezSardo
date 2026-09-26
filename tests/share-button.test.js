const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('article share-with-image keeps Android-safe direct sharing',()=>{
  const js=fs.readFileSync('public/site.js','utf8');
  assert.match(js,/data-article-share-image/);
  assert.match(js,/const fileWithText=\{files:\[preparedShareImageFile\],text:payload\}/);
  assert.match(js,/navigator\.canShare\(fileWithText\)/);
  assert.match(js,/navigator\.canShare\(fileOnly\)/);
  assert.match(js,/navigator\.share\(sharePayload\)/);
  assert.match(js,/navigator\.share\(\{text:payload\}\)/);
  assert.doesNotMatch(js,/navigator\.share\(\{files:\[preparedShareImageFile\],title,text:payload\}\)/);
});

test('approved share-card rules stay locked',()=>{
  const js=fs.readFileSync('public/site.js','utf8');
  const view=fs.readFileSync('lib/view-public.js','utf8');
  assert.match(view,/data-article-image-kind=/);
  assert.match(view,/data-article-category-id=/);
  assert.match(js,/if\(bitmap&&shareImageKind==='real'\)/);
  assert.match(js,/wrap\(title,920,2\)/);
  assert.match(js,/wrap\(shortLead,920,1\)/);
  assert.match(js,/articleCategoryId==='opinion'/);
  assert.match(js,/خلاصه مطالبه/);
  assert.match(js,/متن کامل مطالبه در نبض ساردو/);
});


test('demand Story sharing stays Instagram-compatible',()=>{
  const js=fs.readFileSync('public/site.js','utf8');
  const view=fs.readFileSync('lib/view-common.js','utf8');
  assert.match(view,/data-story-category-id=/);
  assert.match(js,/storyCategoryId/);
  assert.match(js,/nabez-sardo-demand-story\.png/);
  assert.match(js,/isOpinion/);
  assert.match(js,/await navigator\.share\(\{files:\[preparedStoryFile\]\}\)/);
  assert.match(js,/badge\.addEventListener\('click'/);
  assert.match(js,/img\.crossOrigin='anonymous'/);
});


test('demand/category Story cards use the same Instagram pipeline',()=>{
  const js=fs.readFileSync('public/site.js','utf8');
  assert.match(js,/document\.querySelectorAll\('\[data-story-card\]'\)/);
  assert.match(js,/card\.querySelector\('\.card-story-badge'\)/);
  assert.match(js,/openNewsStory\(card\)/);
  assert.match(js,/makeNewsStory\(card\)/);
  assert.match(js,/navigator\.share\(\{files:\[preparedStoryFile\],title,text:/);
  assert.doesNotMatch(js,/\.latest-grid \[data-story-card\], \.archive-grid \[data-story-card\]/);
});


test('article share-with-video sends the uploaded file unchanged',()=>{
  const js=fs.readFileSync('public/site.js','utf8');
  const view=fs.readFileSync('lib/view-public.js','utf8');
  assert.match(view,/data-article-video=/);
  assert.match(view,/data-article-video-type=/);
  assert.match(view,/a\.videoUrl\?\`<button class="article-action article-share-video"/);
  assert.match(js,/data-article-share-video/);
  assert.match(js,/fetchShareVideoFile/);
  assert.match(js,/ensureShareVideoFile/);
  assert.match(js,/preparedShareVideoFile/);
  assert.match(js,/const fileWithText=\{files:\[preparedShareVideoFile\],text:payload\}/);
  assert.match(js,/navigator\.share\(sharePayload\)/);
  assert.match(js,/downloadOriginalVideo/);
  assert.match(js,/فیلم دانلود شد · متن کپی شد/);
  assert.match(js,/آماده شد — دوباره بزن برای اشتراک/);
  assert.doesNotMatch(js,/canvas\.toBlob\([^\n]*video/i);
});
