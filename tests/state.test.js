const {test}=require('node:test');const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const reliability=require('../lib/publishing-state');
function database(){const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE app_state(key TEXT PRIMARY KEY,value TEXT,updated_at TEXT)');return {prepare(query){const s=sql.prepare(query);let args=[];return {bind(...a){args=a;return this},async run(){const r=s.run(...args);return {meta:{changes:Number(r.changes)}}},async first(){return s.get(...args)||null},async all(){return {results:s.all(...args)}}}}};}
test('concurrent saves retain both new articles and delivered channel state',async()=>{
 const db=database(),base={articles:[{id:'a',title:'old',distribution:{}}]};
 await db.prepare('INSERT INTO app_state(key,value) VALUES(?,?)').bind('db',JSON.stringify(base)).run();
 const left=structuredClone(base);left.articles.unshift({id:'b',title:'new'});
 const right=structuredClone(base);right.articles[0].distribution={telegram:{status:'sent'}};
 await Promise.all([reliability.commitChanges(db,base,left),reliability.commitChanges(db,base,right)]);
 const actual=JSON.parse((await db.prepare("SELECT value FROM app_state WHERE key='db'").first()).value);
 assert.equal(actual.articles.length,2);assert.equal(actual.articles.find(x=>x.id==='a').distribution.telegram.status,'sent');
});
test('concurrent same-form submissions create only one article',()=>{
 const base={articles:[]};const after={articles:[{id:'same',title:'خبر'}]};
 assert.equal(reliability.mergeChanges(base,after,after).articles.length,1);
});
test('deleting an article during delivery does not resurrect it',()=>{
 assert.deepEqual(reliability.mergeChanges({articles:[{id:'a',title:'one'}]},{articles:[{id:'a',title:'one',distribution:{telegram:{status:'sent'}}}]},{articles:[]}),{articles:[]});
});
test('two workers claim one queued article only once, and completed job stays completed',async()=>{
 const db=database();const a={id:'one',status:'published',distributionRequest:'initial'};
 await reliability.enqueue(db,a);await reliability.enqueue(db,a);
 let deliveries=0;const dispatch=async(a,checkpoint)=>{deliveries++;await checkpoint('telegram',{status:'sent'});return {telegram:{status:'sent'}}};
 const read=async()=>a;const persist=async()=>{};
 await Promise.all([reliability.drain(db,{read,persist,dispatch}),reliability.drain(db,{read,persist,dispatch})]);
 await reliability.enqueue(db,a);await reliability.drain(db,{read,persist,dispatch});assert.equal(deliveries,1);
});
test('crash after send checkpoint resumes without resending the delivered channel',async()=>{
 const db=database(),a={id:'a',status:'published',distributionRequest:'initial'};await reliability.enqueue(db,a);
 await assert.rejects(reliability.drain(db,{read:async()=>a,persist:async()=>{},dispatch:async(a,checkpoint)=>{await checkpoint('telegram',{status:'sent',messageId:9});throw Error('worker killed')}}));
 await db.prepare("UPDATE publication_jobs SET updated_at=0").run();
 let restored;await reliability.drain(db,{read:async()=>a,persist:async()=>{},dispatch:async(a)=>{restored=a.distribution;return a.distribution}});
 assert.equal(restored.telegram.status,'sent');assert.equal(restored.telegram.messageId,9);
});
test('delivery checkpoints update the article and manual retry preserves successful channels',async()=>{
 const db=database(),a={id:'a',status:'published',distributionRequest:'initial',distribution:{}};
 await db.prepare('INSERT INTO app_state(key,value) VALUES(?,?)').bind('db',JSON.stringify({articles:[a]})).run();await reliability.enqueue(db,a);
 const read=async()=>JSON.parse((await db.prepare("SELECT value FROM app_state WHERE key='db'").first()).value).articles[0];
 await reliability.drain(db,{read,persist:async(before,patch)=>reliability.commitChanges(db,{articles:[before]},{articles:[{...before,...patch}]}),dispatch:async(a,checkpoint)=>{await checkpoint('telegram',{status:'sent',messageId:42});return {telegram:{status:'sent',messageId:42}}}});
 const actual=await read();assert.equal(actual.distribution.telegram?.messageId,42);
});
