// D1 compare-and-swap prevents an older request overwriting another editor or sender.
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
function mergeChanges(before,after,current){
  if(same(before,after))return current;
  if(Array.isArray(before)&&Array.isArray(after)&&Array.isArray(current)&&[...before,...after,...current].every(x=>object(x)&&x.id)){
    const old=new Map(before.map(x=>[x.id,x])),next=new Map(after.map(x=>[x.id,x]));
    const result=current.filter(x=>!old.has(x.id)||next.has(x.id)).map(x=>next.has(x.id)?mergeChanges(old.get(x.id)||{},next.get(x.id),x):x);
    for(const x of after)if(!old.has(x.id)&&!result.some(v=>v.id===x.id))result.unshift(x);
    return result;
  }
  if(object(before)&&object(after)&&object(current)){
    const result={...current};
    for(const key of new Set([...Object.keys(before),...Object.keys(after)])){
      if(same(before[key],after[key]))continue;
      if(!(key in after))delete result[key];
      else result[key]=mergeChanges(before[key],after[key],current[key]);
    }
    return result;
  }
  return after;
}
async function commitChanges(db,before,after){
  for(let attempt=0;attempt<12;attempt++){
    const row=await db.prepare("SELECT value FROM app_state WHERE key='db'").first();
    const raw=row?.value||'{}';const current=JSON.parse(raw);
    const merged=mergeChanges(before,after,current),value=JSON.stringify(merged);
    const result=row
      ?await db.prepare("UPDATE app_state SET value=?,updated_at=datetime('now') WHERE key='db' AND value=?").bind(value,raw).run()
      :await db.prepare("INSERT OR IGNORE INTO app_state(key,value,updated_at) VALUES('db',?,datetime('now'))").bind(value).run();
    if(result.meta.changes)return merged;
  }
  throw Error('ذخیره به‌دلیل تغییر هم‌زمان کامل نشد؛ همین فرم را دوباره ارسال کنید.');
}
async function schema(db){await db.prepare("CREATE TABLE IF NOT EXISTS publication_jobs(article_id TEXT PRIMARY KEY,request TEXT NOT NULL,status TEXT NOT NULL,distribution TEXT NOT NULL,updated_at INTEGER NOT NULL)").run();}
async function enqueue(db,a){
  if(a.status!=='published'||!a.distributionRequest)return;
  await schema(db);
  await db.prepare("INSERT INTO publication_jobs(article_id,request,status,distribution,updated_at) VALUES(?,?,'pending',?,?) ON CONFLICT(article_id) DO UPDATE SET request=excluded.request,status='pending',distribution=excluded.distribution,updated_at=excluded.updated_at WHERE publication_jobs.status='done' AND publication_jobs.request<>excluded.request")
    .bind(a.id,a.distributionRequest,JSON.stringify(a.distribution||{}),Date.now()).run();
}
async function drain(db,{read,persist,dispatch,prepare=async a=>a,limit=3}){
  await schema(db);
  const stale=Date.now()-10*60*1000;
  const rows=await db.prepare("SELECT * FROM publication_jobs WHERE status='pending' OR (status='running' AND updated_at<?) ORDER BY updated_at LIMIT ?").bind(stale,limit).all();
  for(const row of rows.results||[]){
    const claim=await db.prepare("UPDATE publication_jobs SET status='running',updated_at=? WHERE article_id=? AND request=? AND (status='pending' OR (status='running' AND updated_at<?))").bind(Date.now(),row.article_id,row.request,stale).run();
    if(!claim.meta.changes)continue;
    let a=await read(row.article_id);
    if(a?.status==='published'){
      const persistedArticle=structuredClone(a);
      const distribution={...(a.distribution||{}),...JSON.parse(row.distribution)};
      // A worker may have died after the provider accepted the message.
      for(const [name,state] of Object.entries(distribution))if(state.status==='sending')distribution[name]={...state,status:'unknown'};
      a=await prepare({...a,distribution:structuredClone(distribution)});
      const result=await dispatch(a,async(name,state)=>{
        distribution[name]=state;
        await db.prepare("UPDATE publication_jobs SET distribution=?,updated_at=? WHERE article_id=? AND request=? AND status='running'").bind(JSON.stringify(distribution),Date.now(),row.article_id,row.request).run();
        await persist(persistedArticle,{distribution:{...distribution}},row.request);
      });
      await persist(persistedArticle,{distribution:result,socialDispatchedAt:new Date().toISOString(),distributionCompletedRequest:row.request},row.request);
    }
    await db.prepare("UPDATE publication_jobs SET status='done',updated_at=? WHERE article_id=? AND request=?").bind(Date.now(),row.article_id,row.request).run();
  }
}
module.exports={mergeChanges,commitChanges,enqueue,drain};
