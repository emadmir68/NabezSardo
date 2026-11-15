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

test('homepage lead story keeps a full-bleed media panel and readable headline',()=>{
  const html=views.home(sample);
  const css=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.css'),'utf8');
  assert.match(html,/class="rb-hero-story"/);
  assert.match(html,/class="rb-hero-visual"/);
  assert.match(html,/class="rb-hero-media"/);
  const fix=css.slice(css.lastIndexOf('2026-11-15: restore balance'));
  assert.match(fix,/\.rb-hero-visual\{[\s\S]*?min-height:470px;[\s\S]*?height:100%/);
  assert.match(fix,/\.rb-hero-media\{[\s\S]*?position:absolute;[\s\S]*?inset:0;[\s\S]*?height:100%;[\s\S]*?object-fit:cover/);
  assert.match(fix,/font-size:clamp\(31px,3\.25vw,46px\)/);
  assert.match(fix,/line-height:1\.45/);
});

test('homepage hero rearranges before the news index becomes cramped',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../public/assets/rebirth.css'),'utf8');
  const fix=css.slice(css.lastIndexOf('2026-11-15: restore balance'));
  assert.match(fix,/@media\(max-width:1100px\)[\s\S]*?\.rb-hero-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(fix,/@media\(max-width:1100px\)[\s\S]*?\.rb-hero-sidebar\{[\s\S]*?grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(fix,/@media\(max-width:820px\)[\s\S]*?\.rb-hero-story\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(fix,/@media\(max-width:520px\)[\s\S]*?\.rb-hero-visual\{height:240px/);
});
