import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base=process.env.SITE_URL||'https://nabzesardo.ir';
const viewports=[
  {name:'360x800',width:360,height:800},
  {name:'390x844',width:390,height:844},
  {name:'412x915',width:412,height:915}
];
const browser=await chromium.launch({headless:true});
let failed=false;

function assert(ok,msg){if(!ok){failed=true;console.error('FAIL',msg)}else console.log('PASS',msg)}

for(let idx=0;idx<viewports.length;idx++){
  const v=viewports[idx];
  const page=await browser.newPage({viewport:{width:v.width,height:v.height},deviceScaleFactor:1});
  await page.goto(base+'/?visual-audit='+Date.now(),{waitUntil:'networkidle',timeout:60000});
  const metrics=await page.evaluate(()=>{
    const active=document.querySelector('[data-slide].on');
    const hd=document.querySelector('.hd');
    const rail=document.querySelector('.spatial-rail');
    const hiddenFocus=[...document.querySelectorAll('[aria-hidden="true"] a,[aria-hidden="true"] button,[aria-hidden="true"] [tabindex]')]
      .filter(el=>el.tabIndex>=0).length;
    return {
      viewport:innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      header:hd?hd.getBoundingClientRect().toJSON():null,
      active:active?active.getBoundingClientRect().toJSON():null,
      activeIndex:active?.dataset.index||null,
      railDisplay:rail?getComputedStyle(rail).display:'missing',
      hiddenFocus
    };
  });
  assert(metrics.scrollWidth<=metrics.viewport+2,v.name+': no horizontal overflow');
  assert(metrics.header&&metrics.header.height<=90,v.name+': capsule header height');
  assert(metrics.header&&metrics.header.width<=v.width-8,v.name+': header fits viewport');
  assert(metrics.active&&metrics.active.width<=v.width,v.name+': active card fits viewport');
  assert(metrics.railDisplay==='none'||metrics.railDisplay==='missing',v.name+': mobile floating rail hidden');
  assert(metrics.hiddenFocus===0,v.name+': aria-hidden slides are not keyboard focusable');

  if(idx===0){
    const before=metrics.activeIndex;
    await page.waitForTimeout(6500);
    const after=await page.locator('[data-slide].on').getAttribute('data-index');
    assert(after!==before,v.name+': autoplay advances after 6 seconds');
    const pause=page.locator('#ap');
    if(await pause.count()){
      await pause.click();
      const pausedAt=await page.locator('[data-slide].on').getAttribute('data-index');
      await page.waitForTimeout(6500);
      const still=await page.locator('[data-slide].on').getAttribute('data-index');
      assert(still===pausedAt,v.name+': pause control stops autoplay');
    }
  }

  await fs.mkdir('/tmp/nabez-visual',{recursive:true});
  await page.screenshot({path:'/tmp/nabez-visual/home-'+v.name+'.png',fullPage:true});

  for(const route of ['/all-news','/about']){
    await page.goto(base+route+'?visual-audit='+Date.now(),{waitUntil:'networkidle',timeout:60000});
    const inner=await page.evaluate(()=>({
      viewport:innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      headerHeight:document.querySelector('.site-capsule')?.getBoundingClientRect().height||0
    }));
    assert(inner.scrollWidth<=inner.viewport+2,v.name+' '+route+': no horizontal overflow');
    assert(inner.headerHeight>0&&inner.headerHeight<=90,v.name+' '+route+': unified capsule header');
  }
  await page.close();
}
await browser.close();
if(failed)process.exit(1);
