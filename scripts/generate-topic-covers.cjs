const fs=require('node:fs');
const path=require('node:path');
const {COVER_PALETTES,decorateCover}=require('../lib/cover-variants');
const root=path.resolve(__dirname,'../public');
for(const [category,colors] of Object.entries(COVER_PALETTES)){
 for(const color of colors){
  const base=fs.readFileSync(path.join(root,'news-cover'+(color==='gold'?'':'-'+color)+'.svg'),'utf8');
  fs.writeFileSync(path.join(root,'news-cover-'+category+'-'+color+'.svg'),decorateCover(base,category));
 }
}
