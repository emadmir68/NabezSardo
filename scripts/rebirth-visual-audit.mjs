import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base=String(process.env.SITE_URL||'https://nabzesardo.ir').replace(/\\/+$/,'');
const viewports=[
  {name:'360x800',width:360,height:800},
  {name:'390x844',width:390,height:844},
  {name:'412x915',width:412,height:915},
  {name:'1440x900',width:1440,height:900}
];
const out='/tmp/nabz-rebirth-visual';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
let failures=0;
function check(ok,label){
  if(ok)console.log('PASS '+label);
  else{failures++;console.error('FAIL '+label);}
}
async function open(page,path,label){
  const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});
  check(Boolean(response&&response.status()===200),label+' returns HTTP 200');
  await page.waitForSelector('body',{timeout:10000});
  await page.waitForTimeout(180);
  const metrics=await page.evaluate(()=>{
    const el=s=>document.querySelector(s);
    const header=el('.rb-header-main');
    const logo=el('.rb-brand-mark');
    return {
      viewport:innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      bodyBackground:getComputedStyle(document.body).backgroundColor,
      header:header?header.getBoundingClientRect().toJSON():null,
      logo:logo?logo.getBoundingClientRect().toJSON():null,
      legacyStyles:[...document.querySelectorAll('link[rel="stylesheet"]')].some(x=>/premium\\.css|\\/assets\\/site\\.css/.test(x.href)),
      oldWaveform:!!document.querySelector('.rb-brand-mark path[d^="M2 18h16l7-9"]')
    };
  });
  check(metrics.scrollWidth<=metrics.viewport+2,label+' has no horizontal overflow ('+metrics.scrollWidth+'/'+metrics.viewport+')');
  check(metrics.bodyBackground==='rgb(11, 13, 20)',label+' loads the new dark editorial canvas');
  check(Boolean(metrics.header&&metrics.header.width<=metrics.viewport+2),label+' header fits viewport');
  check(Boolean(metrics.logo&&metrics.logo.width>=25&&metrics.logo.height>=25),label+' original monogram is visible');
  check(!metrics.legacyStyles,label+' does not load legacy stylesheets');
  check(!metrics.oldWaveform,label+' does not reuse the old pulse-wave logo');
  return metrics;
}

for(const v of viewports){
  const page=await browser.newPage({viewport:{width:v.width,height:v.height},locale:'fa-IR',reducedMotion:'reduce',deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  const home=await open(page,'/',v.name+' homepage');
  const articleHref=await page.locator('a[href^="/news/"]').first().getAttribute('href').catch(()=>null);
  check(Boolean(articleHref),v.name+' homepage exposes a lead article link');
  if(v.width<=760){
    const menu=page.locator('[data-menu-toggle]');
    check(await menu.isVisible(),v.name+' mobile menu control is visible');
    await menu.click();
    check(await menu.getAttribute('aria-expanded')==='true',v.name+' mobile menu exposes expanded state');
    check(await page.locator('[data-main-nav]').evaluate(el=>getComputedStyle(el).display!=='none'),v.name+' mobile navigation opens');
    await menu.click();
    check(await menu.getAttribute('aria-expanded')==='false',v.name+' mobile navigation closes');
  }
  await page.screenshot({path:out+'/home-'+v.name+'.png',fullPage:true});
  if(articleHref){
    await open(page,articleHref,v.name+' article');
    const articleSize=await page.locator('.rb-article-body').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)).catch(()=>0);
    check(articleSize>=15,v.name+' article body text is at least 15px ('+articleSize+'px)');
    await page.screenshot({path:out+'/article-'+v.name+'.png',fullPage:true});
  }
  await open(page,'/__preview/admin',v.name+' newsroom dashboard');
  check(await page.locator('#followups').count()===1,v.name+' dashboard includes follow-up desk');
  check(await page.locator('a[href="/admin/followups/new"]').count()===1,v.name+' dashboard exposes follow-up creation');
  await page.screenshot({path:out+'/admin-'+v.name+'.png',fullPage:true});
  await open(page,'/__preview/admin/editor',v.name+' article editor');
  check(await page.locator('[data-rebirth-editor]').count()===1,v.name+' article editor is rendered');
  if(v.width===390||v.width===1440){
    for(const route of ['/all-news','/about','/contact','/send-news','/editorial-policy','/follow-up']){
      await open(page,route,v.name+' '+route);
    }
    if(v.width===390){
      check(await page.locator('/contact').count()===0,'contact locator sanity');
      await page.goto(base+'/contact',{waitUntil:'domcontentloaded'});
      check(await page.locator('form[action="/contact"] input[name="website"]').count()===1,'contact form includes honeypot');
      await page.goto(base+'/send-news',{waitUntil:'domcontentloaded'});
      check(await page.locator('form[action="/send-news"] input[name="website"]').count()===1,'citizen form includes honeypot');
    }
  }
  check(errors.length===0,v.name+' has no uncaught browser errors'+(errors.length?': '+errors.join(' | '):''));
  await page.close();
}
await browser.close();
if(failures){console.error('Responsive browser audit failed: '+failures+' checks');process.exit(1);}
console.log('Responsive browser audit passed across all four viewport sizes.');
