'use strict';
const fs=require('node:fs');
const {blockedMonitoredContentReason}=require('../lib/content-policy');

function parseJsonOutput(text){
  const source=String(text||'').trim();
  for(let i=0;i<source.length;i++){
    if(source[i]!=='{'&&source[i]!=='[')continue;
    try{return JSON.parse(source.slice(i));}catch{}
  }
  throw new Error('Could not parse Wrangler D1 JSON output');
}
function findDatabaseValue(value){
  if(Array.isArray(value)){
    for(const item of value){const found=findDatabaseValue(item);if(found)return found;}
    return null;
  }
  if(value&&typeof value==='object'){
    if(typeof value.value==='string'){
      try{
        const parsed=JSON.parse(value.value);
        if(parsed&&typeof parsed==='object'&&Array.isArray(parsed.articles))return parsed;
      }catch{}
    }
    for(const child of Object.values(value)){const found=findDatabaseValue(child);if(found)return found;}
  }
  return null;
}
function scrub(value){
  if(Array.isArray(value))return value.map(scrub);
  if(!value||typeof value!=='object')return value;
  const out={};
  for(const [key,item] of Object.entries(value)){
    if(/password|secret|token|api.?key|access.?key|private.?key|smtp|credential|session/i.test(key))continue;
    out[key]=scrub(item);
  }
  return out;
}
function sanitizeDb(input){
  const db=scrub(JSON.parse(JSON.stringify(input)));
  db.articles=(Array.isArray(db.articles)?db.articles:[]).filter(a=>a&&a.status==='published'&&(a.imported!==true||!blockedMonitoredContentReason(a)));
  for(const key of ['contacts','citizens','messages','submissions','users','sessions','admins','credentials','backups'])db[key]=[];
  if(db.settings&&typeof db.settings==='object')db.settings.socialDistribution=false;
  return db;
}
function sqlQuote(value){return "'"+String(value).replace(/'/g,"''")+"'";}
function buildSql(db,chunkSize=16000){
  const json=JSON.stringify(db);
  const chunks=[];
  for(let i=0;i<json.length;i+=chunkSize)chunks.push(json.slice(i,i+chunkSize));
  const statements=['DELETE FROM app_state;'];
  const manifest=JSON.stringify({chunks:chunks.length,length:json.length});
  statements.push("INSERT INTO app_state(key,value,updated_at) VALUES('preview:db:manifest',"+sqlQuote(manifest)+",datetime('now'));");
  chunks.forEach((chunk,index)=>{
    const key='preview:db:chunk:'+String(index).padStart(6,'0');
    statements.push("INSERT INTO app_state(key,value,updated_at) VALUES("+sqlQuote(key)+","+sqlQuote(chunk)+",datetime('now'));");
  });
  return {sql:statements.join('\n'),chunks:chunks.length,length:json.length,articleCount:db.articles.length};
}
function main(inputPath,outputPath,metaPath){
  const output=fs.readFileSync(inputPath,'utf8');
  const source=parseJsonOutput(output);
  const db=findDatabaseValue(source);
  if(!db)throw new Error('The production D1 query did not return the app_state db value');
  const safe=sanitizeDb(db);
  const built=buildSql(safe);
  fs.writeFileSync(outputPath,built.sql,'utf8');
  if(metaPath)fs.writeFileSync(metaPath,JSON.stringify({chunks:built.chunks,length:built.length,articleCount:built.articleCount,firstArticleSlug:safe.articles[0]?.slug||''},null,2),'utf8');
  process.stdout.write('Prepared sanitized Cloudflare preview snapshot: '+built.articleCount+' published articles in '+built.chunks+' chunks.\n');
}
if(require.main===module){
  const [input,output,meta]=process.argv.slice(2);
  if(!input||!output)throw new Error('Usage: node scripts/build-preview-seed.js <wrangler-json> <output-sql> [meta-json]');
  main(input,output,meta);
}
module.exports={parseJsonOutput,findDatabaseValue,sanitizeDb,buildSql};
