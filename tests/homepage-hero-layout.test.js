'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const views=require('../lib/views-v2');

const sample={
  settings:{liveDeskEnabled:true,breakingText:'خبرهای تازه جنوب کرمان'},
  categories:[{id:'social',name:'اجتماعی'},{id:'culture',name:'فرهنگی'},{id:'short-news',name:'خبر کوتاه'}],
  articles:[
    {id:'lead',slug:'lead-story',title:'امام جمعه‌ای که خود پیش‌قدم دیدار با مردم می‌شود',lead:'روایتی از دیدار نزدیک مسئولان با مردم منطقه',status:'published',categoryId:'social',featured:true,publishedAt:'2026-11-15T10:00:00Z',image:'/uploads/lead.webp'},
    ...Array.from({length:4},(_,i)=>({id:'side-'+i,slug:'side-'+i,title:'خبر محلی شماره '+i,lead:'خلاصه خبر',status:'published',categoryId:i%2?'culture':'social',publishedAt:'2026-11-14T10:00:00Z',image:'/uploads/side-'+i+'.webp'}))
  ]
};

test('homepage keeps the approved compact lead-card proportions',()=>{
  const html=views.home(sample);
  const css=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.css'),'utf8');
  assert.match(html,/class="rb-hero-story"/);
  assert.match(html,/class="rb-hero-visual"/);
  assert.match(html,/class="rb-hero-media"/);
  assert.match(css,/\.rb-hero-grid\{display:grid;grid-template-columns:minmax\(0,1fr\) 320px;gap:22px;align-items:stretch\}/);
  assert.match(css,/\.rb-hero-story\{display:grid;grid-template-columns:1\.08fr \.92fr;min-height:435px/);
  assert.match(css,/\.rb-hero-visual\{position:relative;display:block;min-height:435px/);
  assert.match(css,/\.rb-hero-media\{display:block;width:100%;height:100%;min-height:435px;object-fit:cover/);
  assert.doesNotMatch(css,/2026-11-15: restore balance/);
  assert.doesNotMatch(css,/\.rb-hero-story\{[^}]*min-height:470px/);
});

test('homepage retains the original tablet and mobile hero breakpoints',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.css'),'utf8');
  assert.match(css,/@media\(max-width:1100px\)[\s\S]*?\.rb-hero-grid\{grid-template-columns:minmax\(0,1fr\) 275px\}/);
  assert.match(css,/@media\(max-width:1100px\)[\s\S]*?\.rb-hero-story\{grid-template-columns:1fr\}/);
  assert.match(css,/@media\(max-width:820px\)[\s\S]*?\.rb-hero-grid\{grid-template-columns:1fr;gap:12px\}/);
  assert.match(css,/@media\(max-width:420px\)[\s\S]*?\.rb-hero-visual,\.rb-hero-media\{min-height:195px;max-height:240px\}/);
});
