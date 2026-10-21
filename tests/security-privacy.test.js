const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('citizen newsroom never collects or renders a bank card number',()=>{
  const publicView=read('lib/view-public.js');
  const adminView=read('lib/view-admin.js');
  const app=read('app.js');
  assert.doesNotMatch(publicView,/rewardCard|شماره کارت/);
  assert.doesNotMatch(adminView,/rewardCard|شماره کارت جهت هدیه/);
  assert.doesNotMatch(app,/rewardCard/);
  assert.match(publicView,/شماره کارت در سایت دریافت یا ذخیره نمی‌شود/);
});

test('public abuse controls and admin hardening remain enabled',()=>{
  const worker=read('src/worker.js');
  const app=read('app.js');
  assert.match(worker,/request_rate_limits/);
  assert.match(worker,/\/send-news":3/);
  assert.match(worker,/\/contact":8/);
  assert.match(worker,/\/admin\/login":12/);
  assert.match(worker,/strict-transport-security/);
  assert.match(worker,/content-security-policy/);
  assert.match(app,/43200000/);
  assert.match(app,/crossSiteMutation/);
  assert.match(app,/verifyTurnstile/);
});

test('production worker is not exposed on workers.dev or preview URLs',()=>{
  const config=JSON.parse(read('wrangler.jsonc'));
  assert.equal(config.workers_dev,false);
  assert.equal(config.preview_urls,false);
  assert.equal(config.vars.PREVIEW_READONLY,'1');
});

test('homepage autoplay is recurrent, pausable and accessible',()=>{
  const js=read('public/claude-home.js');
  const view=read('lib/view-home-claude.js');
  assert.match(js,/autoTimer=setTimeout\(\(\)=>\{go\(index\+1\)\},6000\)/);
  assert.match(js,/autoPaused/);
  assert.match(js,/aria-current/);
  assert.match(view,/id="ap"/);
  assert.match(view,/data-dot=/);
  assert.match(view,/aria-roledescription="slide"/);
});

test('public UI no longer depends on Google Fonts and visual audit exists',()=>{
  const common=read('lib/view-common.js');
  const home=read('lib/view-home-claude.js');
  const homeCss=read('public/claude-home.css');
  assert.doesNotMatch(common,/fonts\.googleapis\.com/);
  assert.doesNotMatch(home,/fonts\.googleapis\.com/);
  assert.match(homeCss,/NabezLocal/);
  assert.ok(fs.existsSync(path.join(root,'scripts','mobile-visual-audit.mjs')));
  assert.ok(fs.existsSync(path.join(root,'.github','workflows','mobile-visual-audit.yml')));
});

test('monitor contract supports two local stories and rejects promotional debris',()=>{
  const monitor=require('../lib/news-monitor')._test;
  assert.deepEqual(monitor.desiredMix(2),{local:2,country:0,world:0});
  assert.equal(monitor.candidateQualityReason({
    title:'یه فرصت طلایی برای ثبت نام',
    lead:'عضویت در کانال و ثبت نام از لینک زیر',
    body:'برای ثبت نام و عضویت در کانال از لینک زیر استفاده کنید و این فرصت طلایی را از دست ندهید.'
  }),'cta-or-promotional');
});
