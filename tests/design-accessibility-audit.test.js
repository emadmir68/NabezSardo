'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const home=require('../lib/view-home-2026');

function fixture(){
  const date=new Date(Date.UTC(2026,9,20)).toISOString();
  return {
    categories:[{id:'social',name:'اجتماعی'},{id:'culture',name:'فرهنگ'},{id:'short-news',name:'خبر کوتاه'}],
    settings:{},
    articles:[
      {id:'news-1',slug:'news-1',title:'خبر اصلی',lead:'خبر محلی',status:'published',categoryId:'social',createdAt:date,views:1234,image:'/assets/news-cover.svg'},
      {id:'news-2',slug:'news-2',title:'خبر دوم',lead:'گزارش',status:'published',categoryId:'culture',createdAt:date,views:42,image:'/assets/news-cover.svg'}
    ]
  };
}

test('homepage offers visible, accessible mobile search and retains desktop search',()=>{
  const markup=home(fixture());
  assert.match(markup,/class="pr-search-link" href="\/search" aria-label="جستجو در خبرها"/);
  assert.match(markup,/class="pr-search" action="\/search"/);
  const css=fs.readFileSync(path.join(__dirname,'../public/premium.css'),'utf8');
  assert.match(css,/\.pr-mobile-nav a,[\s\S]*?\.pr-search-link\{min-height:44px/);
});

test('duplicate ticker links are inert and invisible to assistive technology',()=>{
  const markup=home(fixture());
  assert.match(markup,/class="pr-ticker__dup" aria-hidden="true" inert/);
  const css=fs.readFileSync(path.join(__dirname,'../public/premium.css'),'utf8');
  assert.match(css,/\.pr-ticker__track:focus-within\{animation-play-state:paused\}/);
});

test('server sends nonzero statistics without relying on animation',()=>{
  const markup=home(fixture());
  assert.match(markup,/data-count="2">۲<\/b>/);
  assert.match(markup,/data-count="1276">۱٬۲۷۶<\/b>/);
  assert.match(markup,/data-count="2">۲<\/b>/);
});

test('premium styles retain responsive and reduced-motion treatment',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../public/premium.css'),'utf8');
  assert.match(css,/#040508 0%/);
  assert.doesNotMatch(css,/#04050 8 0%/);
  assert.match(css,/@media\(max-width:370px\)/);
  assert.match(css,/\.pr-ticker__viewport\{overflow-x:auto/);
  assert.match(css,/body\.pr-body \.pr-feature__body\{padding-inline-end:/);
});
