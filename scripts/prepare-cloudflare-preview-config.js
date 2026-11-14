'use strict';
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');

function parseJson(text){
  const source=String(text||'').trim();
  for(let i=0;i<source.length;i++){
    if(source[i]!=='{'&&source[i]!=='[')continue;
    try{return JSON.parse(source.slice(i));}catch{}
  }
  throw new Error('Wrangler did not return valid JSON');
}
function findDatabase(value,name){
  if(Array.isArray(value)){
    for(const item of value){const found=findDatabase(item,name);if(found)return found;}
    return null;
  }
  if(value&&typeof value==='object'){
    const candidateName=String(value.name||value.database_name||'');
    const id=value.database_id||value.uuid||value.id;
    if(candidateName===name&&id)return String(id);
    for(const child of Object.values(value)){const found=findDatabase(child,name);if(found)return found;}
  }
  return null;
}
function run(args){
  return execFileSync('npx',['wrangler',...args],{encoding:'utf8',stdio:['ignore','pipe','inherit']});
}
function main(configPath='wrangler.preview.jsonc',outputPath='wrangler.preview.generated.jsonc'){
  const dbName='nabzesardo-editorial-preview';
  let list=parseJson(run(['d1','list','--json']));
  let databaseId=findDatabase(list,dbName);
  if(!databaseId){
    run(['d1','create',dbName,'--location','weur']);
    list=parseJson(run(['d1','list','--json']));
    databaseId=findDatabase(list,dbName);
  }
  if(!databaseId)throw new Error('Could not find or create isolated preview D1 database');
  let config=fs.readFileSync(configPath,'utf8');
  config=config.replaceAll('__PREVIEW_D1_DATABASE_ID__',databaseId);
  config=config.replaceAll('__PREVIEW_ASSET_VERSION__',String(process.env.GITHUB_SHA||'editorial-preview').slice(0,40));
  if(config.includes('__PREVIEW_'))throw new Error('Preview config contains unresolved placeholders');
  fs.writeFileSync(outputPath,config,'utf8');
  process.stdout.write('Isolated preview D1 database is ready; generated a non-production Wrangler config.\n');
}
if(require.main===module)main(process.argv[2],process.argv[3]);
module.exports={parseJson,findDatabase};
