'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync(require.resolve('../public/assets/rebirth.js'),'utf8');
assert.doesNotMatch(source,/(?<!\$)\$\('\[data-[^']+\]'.*\)\.forEach/,'multi-element selectors must use the query-all helper');

function element(dataset={}){
  const handlers={};
  return {
    dataset,handlers,placeholder:'',textContent:'',hidden:false,
    classList:{toggle(){}},
    addEventListener(type,fn){handlers[type]=fn;}
  };
}
const fa=element({langOption:'fa'}),en=element({langOption:'en'});
const search=element({placeholderFa:'جست‌وجو در خبرها...',placeholderEn:'Search the newsroom...'});
const date=element(),clock=element();
const document={
  documentElement:{dataset:{},lang:'',dir:'',classList:{toggle(){}}},
  body:{classList:{toggle(){}}},
  visibilityState:'visible',
  querySelector(){return null;},
  querySelectorAll(selector){
    if(selector==='[data-lang-option]')return [fa,en];
    if(selector==='[data-placeholder-fa]')return [search];
    if(selector==='[data-jalali-date]')return [date];
    if(selector==='[data-live-clock]')return [clock];
    return [];
  }
};
const storage=new Map([['nabez-lang','en']]);
const sandbox={
  document,
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
  setInterval(){return 1;},
  window:{matchMedia:()=>({matches:false})}
};
vm.runInNewContext(source,sandbox,{timeout:1000});
assert.equal(document.documentElement.lang,'en');
assert.equal(document.documentElement.dir,'ltr');
assert.equal(search.placeholder,'Search the newsroom...');
assert.ok(date.textContent.length>0,'Jalali date should be rendered');
assert.ok(clock.textContent.length>0,'local clock should be rendered');
assert.equal(typeof en.handlers.click,'function','English language button should be interactive');
fa.handlers.click();
assert.equal(document.documentElement.lang,'fa-IR');
assert.equal(document.documentElement.dir,'rtl');
assert.equal(search.placeholder,'جست‌وجو در خبرها...');
assert.equal(storage.get('nabez-lang'),'fa');
console.log('rebirth client tests passed');
