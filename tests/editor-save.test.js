const {test}=require('node:test');const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
test('reposting the same editor form saves one draft',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'news-test-')),port=18000+Math.floor(Math.random()*10000),base='http://127.0.0.1:'+port;
 const child=spawn(process.execPath,['app.js'],{env:{...process.env,PORT:String(port),DATA_DIR:dir,ADMIN_USER:'test',ADMIN_PASS:'test',CLOUDFLARE_WORKER:'1'},stdio:['ignore','pipe','pipe']});
 t.after(()=>{child.kill();fs.rmSync(dir,{recursive:true,force:true})});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('server timeout')),10000);child.stdout.on('data',data=>{if(String(data).includes('running on')){clearTimeout(timer);resolve()}});child.on('error',reject)});
 for(let attempt=0;attempt<30;attempt++){try{await fetch(base+'/health');break}catch(err){if(attempt===29)throw err;await new Promise(r=>setTimeout(r,100))}}
 const login=await fetch(base+'/admin/login',{method:'POST',body:new URLSearchParams({username:'test',password:'test'}),redirect:'manual'}),cookie=login.headers.get('set-cookie').split(';')[0];
 const editor=await (await fetch(base+'/admin/articles/new',{headers:{cookie}})).text();
 assert.match(editor,/name="submissionToken"/);
 for(let i=0;i<2;i++){
  const f=new FormData();for(const [k,v] of Object.entries({title:'خبر آزمون',bodyHtml:'<p>متن خبر</p>',status:'draft',submissionToken:'11111111-1111-4111-8111-111111111111'}))f.set(k,v);
  const res=await fetch(base+'/admin/articles/new',{method:'POST',body:f,headers:{cookie},redirect:'manual'});assert.equal(res.status,302);
 }
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'db.json'))).articles.length,1);
});
