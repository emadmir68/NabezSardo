'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {card}=require('../lib/view-common');

test('production archive smoke selector matches the published article-card markup',()=>{
  const db={categories:[{id:'social',name:'اجتماعی'}]};
  const article={
    id:'test-archive-1',slug:'test-story',categoryId:'social',
    title:'خبر آزمایشی ساردوئیه',lead:'خلاصه خبر',body:'متن خبر',
    status:'published',createdAt:'2026-11-10T01:00:00Z',views:1
  };
  const html=card(article,db);
  const selector=/<article\b[^>]*data-story-card[^>]*data-story-title-fa="([^"]*)"[^>]*data-story-url="(\/news\/[A-Za-z0-9_-]+)"[^>]*>/g;
  const matches=[...html.matchAll(selector)];
  assert.equal(matches.length,1);
  assert.equal(matches[0][1],article.title);
  assert.ok(matches[0][2].startsWith('/news/'));
  const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/cloudflare-deploy.yml'),'utf8');
  assert.ok(workflow.includes('const cards=[...html.matchAll(/<article\\b'));
});
