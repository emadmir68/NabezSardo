import {chromium} from 'playwright';
const base='http://127.0.0.1:38001';
const browser=await chromium.launch({headless:true});
let issues=0;
function rep(ok,msg){console.log((ok?'PASS ':'FAIL ')+msg);if(!ok)issues++;}
for(const [route,w] of [['/',1440],['/',390],['/news/lead-story',1440],['/all-news',1440],['/category/weather',390]]){
  const page=await browser.newPage({viewport:{width:w,height:900},locale:'fa-IR',reducedMotion:'reduce'});
  await page.goto(base+route,{waitUntil:'networkidle',timeout:45000});
  const x=await page.evaluate(()=>{
    const q=s=>document.querySelector(s);
    return {
      scrollW:document.documentElement.scrollWidth,
      vw:innerWidth,
      bodyBg:getComputedStyle(document.body).backgroundColor,
      headerH:Math.round(q('[data-ns4-header]')?.getBoundingClientRect().height||0),
      paper:getComputedStyle(document.body).backgroundColor.includes('246, 241, 230'),
      fontsReady:document.fonts.status,
    };
  });
  const tag=route+' '+w;
  rep(x.scrollW<=x.vw+2,tag+' no overflow ('+x.scrollW+'/'+x.vw+')');
  rep(x.paper,tag+' paper canvas');
  rep(x.headerH<=90,tag+' header '+x.headerH+'px');
  await page.screenshot({path:'/tmp/broadsheet-shots/e2e'+route.replace(/\//g,'-')+'-'+w+'.png'});
  await page.close();
}
await browser.close();
console.log(issues===0?'E2E BROWSER CHECKS ALL PASSED':'ISSUES: '+issues);
process.exit(0);
