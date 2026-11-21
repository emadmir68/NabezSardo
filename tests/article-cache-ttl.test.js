'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('crawler article edge cache has positive TTL and re-checks publication visibility',()=>{
  const src=fs.readFileSync('src/worker.js','utf8');
  assert.ok(src.includes('const FAST_ARTICLE_CACHE_TTL_MS=120000'));
  const put=src.slice(src.indexOf('async function fastArticleCachePut('),src.indexOf('async function invalidateFastArticleCache('));
  assert.ok(put.includes('"cache-control":"public, max-age=120"'));
  assert.equal(put.includes('"cache-control":"public, max-age=0, must-revalidate"'),false);
  const serve=src.slice(src.indexOf('async function handleFastPublic('),src.indexOf('async function handlePublicPreview('));
  assert.ok(serve.includes('const cachedArticle=idx.get(key)'));
  assert.ok(serve.includes('if(!cachedArticle)'));
  assert.ok(serve.includes('ctx.waitUntil(fastArticleCachePut(pathname,body).catch(()=>{}))'));
});
