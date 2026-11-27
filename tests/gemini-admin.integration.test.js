const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');

test('Gemini routes enforce signed editorial session and persist real news and citizen reports',async(t)=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gemini-api-test-'));
  const port=44000+Math.floor(Math.random()*15000);
  const base='http://127.0.0.1:'+port;
  const child=spawn(process.execPath,['app.js'],{
    cwd:path.join(__dirname,'..'),
    env:{...process.env,PORT:String(port),DATA_DIR:temp,UPLOAD_DIR:path.join(temp,'uploads'),ADMIN_USER:'gemini-test-editor',ADMIN_PASS:'gemini-test-password',SESSION_SECRET:'test-secret-token-123',NODE_ENV:'development',CLOUDFLARE_SYNC_URL:'',TURNSTILE_SECRET_KEY:''},
    stdio:['ignore','pipe','pipe']
  });
  t.after(()=>{try{child.kill();}catch{}try{fs.rmSync(temp,{recursive:true,force:true});}catch{}});
  let ready=false;
  for(let tries=0;tries<75;tries++){
    try{const r=await fetch(base+'/health');if(r.ok){ready=true;break;}}catch{}
    await new Promise(r=>setTimeout(r,120));
  }
  assert.ok(ready,'Node newsroom started');
  const unauthorized=await fetch(base+'/api/gemini/admin/state');
  assert.equal(unauthorized.status,401);
  const publicConfig=await fetch(base+'/api/gemini/config');
  assert.equal(publicConfig.status,200);
  const citizen={title:'گزارش واقعی از وضعیت جاده روستا',description:'در این گزارش وضعیت عبور و مرور در روستا بررسی شده و جزئیات بیشتری ارائه شده است.',region:'sarduiyeh',category:'social',reporterName:'شهروندخبرنگار',contact:'',website:''};
  const report=await fetch(base+'/api/gemini/citizen',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(citizen)});
  assert.equal(report.status,200,await report.text());
  const unauthWrite=await fetch(base+'/api/gemini/admin/action',{method:'POST',headers:{Origin:base,'Content-Type':'application/json','x-nabzesardo-editorial':'1'},body:JSON.stringify({action:'delete',id:'abc'})});
  assert.equal(unauthWrite.status,401);
  const signIn=await fetch(base+'/admin/login?gemini=1',{method:'POST',redirect:'manual',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username:'gemini-test-editor',password:'gemini-test-password'}).toString()});
  assert.equal(signIn.status,302);
  assert.equal(signIn.headers.get('location'),'/?studio=1');
  const cookie=String(signIn.headers.get('set-cookie')||'').split(';')[0];
  assert.match(cookie,/^nabez_admin=/);
  const admin=await fetch(base+'/api/gemini/admin/state',{headers:{Cookie:cookie}});
  assert.equal(admin.status,200);
  const state=await admin.json();assert.equal(state.citizenReports.length,1);assert.equal(state.citizenReports[0].title,citizen.title);
  const article={id:'art-test',slug:'test-genuine-story',title:{fa:'گزارش جدید درباره آب کشاورزی',en:'New story'},deck:{fa:'گزارش واقعی درباره ظرفیت‌های آبخیزداری و توسعه روستاها',en:'Regional report'},body:{fa:['داده‌های میدانی نشان می‌دهد وضعیت منابع آب بهتر از سال‌های گذشته پایش شده است.'],en:['Regional water report.']},category:'agriculture',region:'sarduiyeh',author:{fa:'تحریریه نبض ساردو',en:'Newsroom'},coverImage:'',status:'published',featuredInHero:false};
  const saved=await fetch(base+'/api/gemini/admin/action',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json','x-nabzesardo-editorial':'1'},body:JSON.stringify({action:'save',isNew:true,article})});
  assert.equal(saved.status,200,await saved.text());
  const database=JSON.parse(fs.readFileSync(path.join(temp,'db.json'),'utf8'));
  assert.equal(database.articles.length,1);assert.equal(database.articles[0].title,article.title.fa);

  const summaryFeed=await fetch(base+'/api/gemini/articles?summary=1');
  assert.equal(summaryFeed.status,200);
  const summaryJson=await summaryFeed.json();
  assert.equal(summaryJson.articles.length,1);
  assert.deepEqual(summaryJson.articles[0].body.fa,[]);

  const singleRes=await fetch(base+'/api/gemini/article?key='+encodeURIComponent(database.articles[0].slug));
  assert.equal(singleRes.status,200);
  const singleJson=await singleRes.json();
  assert.equal(singleJson.article.title.fa,article.title.fa);
  assert.ok(singleJson.article.body.fa.length>=1);

  const contactRes=await fetch(base+'/api/gemini/contact',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({name:'مخاطب',contact:'09130000000',subject:'اصلاح خبر',message:'متن پیام آزمایشی برای تحریریه نبض ساردو',website:''})});
  assert.equal(contactRes.status,200);

  const settingsRes=await fetch(base+'/api/gemini/admin/action',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json','x-nabzesardo-editorial':'1'},body:JSON.stringify({action:'save-settings',settings:{contactEmail:'desk@nabzesardo.ir',editorialPhone:'034-43219999',liveDeskEnabled:true}})});
  assert.equal(settingsRes.status,200);

  const cfgAfter=await (await fetch(base+'/api/gemini/config')).json();
  assert.equal(cfgAfter.contactEmail,'desk@nabzesardo.ir');

  const forbidden={...article,title:{fa:'آگهی ترحیم مرحوم',en:'Funeral notice'}};
  const blocked=await fetch(base+'/api/gemini/admin/action',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json','x-nabzesardo-editorial':'1'},body:JSON.stringify({action:'save',isNew:true,article:forbidden})});
  assert.equal(blocked.status,422);
  const invalidOrigin=await fetch(base+'/api/gemini/admin/action',{method:'POST',headers:{Origin:'https://evil.example',Cookie:cookie,'Content-Type':'application/json','x-nabzesardo-editorial':'1'},body:JSON.stringify({action:'delete',id:database.articles[0].id})});
  assert.equal(invalidOrigin.status,403);
});
