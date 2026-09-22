const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const sharp=require('sharp');
const store=require('./store');
const social=require('./social');
const {generateAutoCover}=require('./auto-cover');
const {load,save,now,UPLOAD_DIR}=store;

function validateImage(file){
  if(!file||!file.data||!file.data.length)throw new Error('invalid-image');
  if(file.data.length>10*1024*1024)throw new Error('image-too-large');
  const ok=new Set(['image/jpeg','image/png','image/webp','image/gif']);
  if(!ok.has(file.type))throw new Error('invalid-image');
}
function orientation(width,height){
  if(!width||!height)return 'landscape';
  const r=width/height;
  if(r>1.08)return 'landscape';
  if(r<0.92)return 'portrait';
  return 'square';
}
function imageMeta(url,width,height){
  const w=Number(width)||0,h=Number(height)||0;
  return {
    image:url||'',
    imageWidth:w||null,
    imageHeight:h||null,
    imageRatio:w&&h?Number((w/h).toFixed(5)):null,
    imageOrientation:orientation(w,h)
  };
}
function saveImage(file){
  validateImage(file);
  const extByType={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'};
  const ext=extByType[file.type];
  const name=Date.now().toString(36)+'-'+crypto.randomBytes(6).toString('hex')+ext;
  fs.mkdirSync(UPLOAD_DIR,{recursive:true});
  fs.writeFileSync(path.join(UPLOAD_DIR,name),file.data);
  return '/uploads/'+name;
}
function saveVideo(file){
  if(!file||!file.data||!file.data.length)throw new Error('invalid-video');
  if(file.data.length>50*1024*1024)throw new Error('video-too-large');
  const extByType={'video/mp4':'.mp4','video/webm':'.webm','video/quicktime':'.mov'};
  const ext=extByType[file.type];
  if(!ext)throw new Error('invalid-video');
  const name='video-'+Date.now().toString(36)+'-'+crypto.randomBytes(6).toString('hex')+ext;
  fs.mkdirSync(UPLOAD_DIR,{recursive:true});
  fs.writeFileSync(path.join(UPLOAD_DIR,name),file.data);
  return {url:'/uploads/'+name,type:file.type};
}
async function saveFeaturedImage(file){
  validateImage(file);
  fs.mkdirSync(UPLOAD_DIR,{recursive:true});
  const name='featured-'+Date.now().toString(36)+'-'+crypto.randomBytes(6).toString('hex')+'.webp';
  const target=path.join(UPLOAD_DIR,name);
  const {data,info}=await sharp(file.data,{animated:false})
    .rotate()
    .resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true})
    .webp({quality:88,smartSubsample:true})
    .toBuffer({resolveWithObject:true});
  fs.writeFileSync(target,data);
  return imageMeta('/uploads/'+name,info.width,info.height);
}
function deleteUpload(url){
  if(!String(url||'').startsWith('/uploads/'))return;
  const f=path.join(UPLOAD_DIR,path.basename(url));
  try{if(fs.existsSync(f))fs.unlinkSync(f)}catch{}
}
async function backfillFeaturedMetadata(){
  const db=load();
  let changed=false;
  for(const a of db.articles){
    if(!a.image||!String(a.image).startsWith('/uploads/'))continue;
    const src=path.join(UPLOAD_DIR,path.basename(a.image));
    if(!fs.existsSync(src))continue;
    try{
      const meta=await sharp(src,{animated:false}).metadata();
      if(meta.width&&meta.height){
        const m=imageMeta(a.image,meta.width,meta.height);
        if(a.imageWidth!==m.imageWidth||a.imageHeight!==m.imageHeight||a.imageRatio!==m.imageRatio||a.imageOrientation!==m.imageOrientation){
          Object.assign(a,m);
          a.updatedAt=now();
          changed=true;
        }
      }
    }catch(err){console.error('featured metadata sync failed',a.id,err.message);}
  }
  if(changed)save(db);
  return changed;
}
function normalizeSingleLine(input='',max=2000){
  return String(input||'')
    .replace(/\u00a0/g,' ')
    .replace(/[\t\r\n]+/g,' ')
    .replace(/ {2,}/g,' ')
    .trim()
    .slice(0,max);
}
function normalizeRich(input=''){
  let h=sanitizeRich(input);
  h=h.replace(/&nbsp;/gi,' ').replace(/\u00a0/g,' ');
  h=h.replace(/<(p|div)([^>]*)>(?:\s|<br\s*\/?\s*>)*<\/\1>/gi,'');
  h=h.replace(/(?:<br\s*\/?\s*>\s*){2,}/gi,'<br>');
  const parts=h.split(/(<[^>]+>)/g);
  h=parts.map(part=>{
    if(!part||part.startsWith('<'))return part;
    return part.replace(/[\t\r\n]+/g,' ').replace(/ {2,}/g,' ');
  }).join('');
  h=h.replace(/<(p|div|h2|h3|li|blockquote)([^>]*)>\s+/gi,'<$1$2>')
     .replace(/\s+<\/(p|div|h2|h3|li|blockquote)>/gi,'</$1>')
     .replace(/^\s+|\s+$/g,'');
  return h;
}
function sanitizeRich(input=''){
  let h=String(input).slice(0,700000);
  h=h.replace(/<!--[^]*?-->/g,'').replace(/<(script|style|iframe|object|embed|form|input|button|svg|math)[^>]*>[^]*?<\/\1>/gi,'');
  const allowed=new Set(['p','br','strong','b','em','i','u','ul','ol','li','blockquote','h2','h3','span','div','img']);
  h=h.replace(/<\/?([a-z0-9]+)([^>]*)>/gi,(m,tag,attrs)=>{
    tag=tag.toLowerCase();if(!allowed.has(tag))return '';
    if(m.startsWith('</'))return tag==='img'?'':'</'+tag+'>';
    if(tag==='img'){
      const srcM=attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
      if(!srcM||!/^\/uploads\/[a-z0-9._-]+$/i.test(srcM[1]))return '';
      const altM=attrs.match(/\balt\s*=\s*["']([^"']*)["']/i);
      const alt=altM?String(altM[1]).replace(/[<>"']/g,'').slice(0,180):'';
      return '<img src="'+srcM[1]+'" alt="'+alt+'">';
    }
    const out=[];
    const dir=attrs.match(/\bdir\s*=\s*["']?(rtl|ltr)["']?/i);if(dir)out.push('dir="'+dir[1].toLowerCase()+'"');
    const styles=[];
    const align=attrs.match(/text-align\s*:\s*(right|left|center|justify)/i);if(align)styles.push('text-align:'+align[1].toLowerCase());
    const weight=attrs.match(/font-weight\s*:\s*(300|400|500|600|700|bold|normal)/i);if(weight)styles.push('font-weight:'+weight[1].toLowerCase());
    if(styles.length)out.push('style="'+styles.join(';')+'"');
    return '<'+tag+(out.length?' '+out.join(' '):'')+'>';
  });
  return h.replace(/\son[a-z]+\s*=\s*["'][^"']*["']/gi,'').replace(/javascript:/gi,'');
}
function plainFromRich(h=''){return String(h).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();}
function parseGallery(v,current=[]){
  try{
    const arr=JSON.parse(v||'[]');
    if(!Array.isArray(arr))return current||[];
    return [...new Set(arr.filter(x=>typeof x==='string'&&/^\/uploads\/[a-z0-9._-]+$/i.test(x)))].slice(0,20);
  }catch{return current||[];}
}
function parseTehranDate(v){
  if(!v)return null;
  const raw=String(v).trim();
  const d=new Date(/[zZ]|[+-]\d\d:\d\d$/.test(raw)?raw:raw+':00+03:30');
  return Number.isNaN(d.getTime())?null:d.toISOString();
}
async function articlePayload(db,f,files,current={},uniqueSlug){
  let videoUrl=current.videoUrl||'';
  let videoType=current.videoType||'';
  if(f.removeVideo==='1'){
    deleteUpload(videoUrl);
    videoUrl='';videoType='';
  }
  if(files.videoFile&&files.videoFile.data&&files.videoFile.data.length){
    const old=videoUrl;
    const saved=saveVideo(files.videoFile);
    videoUrl=saved.url;videoType=saved.type;
    if(old&&old!==videoUrl)deleteUpload(old);
  }
  let meta={
    image:current.image||'',
    imageWidth:current.imageWidth||null,
    imageHeight:current.imageHeight||null,
    imageRatio:current.imageRatio||null,
    imageOrientation:current.imageOrientation||orientation(current.imageWidth,current.imageHeight),
    imageAuto:current.imageAuto===true,
    autoCoverTheme:current.autoCoverTheme||null
  };
  if(f.removeImage==='1'){
    deleteUpload(meta.image);
    meta=imageMeta('',0,0);
  }
  if(files.imageFile&&files.imageFile.data.length){
    const old=meta.image;
    meta=await saveFeaturedImage(files.imageFile);
    meta.imageAuto=false;
    meta.autoCoverTheme=null;
    if(old&&old!==meta.image)deleteUpload(old);
  }
  const title=normalizeSingleLine(f.title||'',260);
  const lead=normalizeSingleLine(f.lead||'',1600);
  const autoCoverEnabled=f.autoCover==='1';
  const category=db.categories.find(c=>c.id===f.categoryId)||{};
  if(!meta.image&&autoCoverEnabled){
    meta=await generateAutoCover({title,lead,categoryId:f.categoryId},category);
  }else if(meta.image&&meta.imageAuto&&autoCoverEnabled){
    const old=meta.image;
    meta=await generateAutoCover({title,lead,categoryId:f.categoryId},category);
    if(old&&old!==meta.image)deleteUpload(old);
  }
  if(!autoCoverEnabled&&meta.imageAuto){
    deleteUpload(meta.image);
    meta=imageMeta('',0,0);
  }
  const bodyHtml=normalizeRich(f.bodyHtml||'');
  const requested=f.status==='published'?'published':f.status==='scheduled'?'scheduled':'draft';
  const scheduledAt=requested==='scheduled'?parseTehranDate(f.scheduledAt):null;
  const status=requested==='scheduled'&&!scheduledAt?'draft':requested;
  return {
    title,slug:uniqueSlug(db,f.slug||title||current.slug||'news',current.id),categoryId:f.categoryId||'',
    lead,bodyHtml,body:plainFromRich(bodyHtml),author:normalizeSingleLine(f.author||'تحریریه نبض ساردو',120),location:normalizeSingleLine(f.location||'ساردوئیه',120),
    status,scheduledAt,featured:f.featured==='1',autoCoverEnabled,...meta,videoUrl,videoType,gallery:parseGallery(f.galleryJson,current.gallery||[]),
    socialTelegram:f.socialTelegram==='1',socialRubika:f.socialRubika==='1',socialWhatsApp:f.socialWhatsApp==='1',
    updatedAt:now()
  };
}
async function backfillTypography(){
  const db=load();
  let changed=false;
  for(const a of db.articles){
    let articleChanged=false;
    const title=normalizeSingleLine(a.title||'',260);
    const lead=normalizeSingleLine(a.lead||'',1600);
    const author=normalizeSingleLine(a.author||'تحریریه نبض ساردو',120);
    const location=normalizeSingleLine(a.location||'ساردوئیه',120);
    const bodyHtml=a.bodyHtml?normalizeRich(a.bodyHtml):a.bodyHtml;
    if(a.title!==title){a.title=title;articleChanged=true;}
    if((a.lead||'')!==lead){a.lead=lead;articleChanged=true;}
    if((a.author||'')!==author){a.author=author;articleChanged=true;}
    if((a.location||'')!==location){a.location=location;articleChanged=true;}
    if(a.bodyHtml&&a.bodyHtml!==bodyHtml){
      a.bodyHtml=bodyHtml;
      a.body=plainFromRich(bodyHtml);
      articleChanged=true;
    }
    if(articleChanged){a.updatedAt=now();changed=true;}
  }
  if(changed)save(db);
  return changed;
}
async function dispatchAndPersist(articleId){
  const db=load(),a=db.articles.find(x=>x.id===articleId);
  if(!a||a.status!=='published')return;
  a.distribution=await social.dispatch(a);
  a.socialDispatchedAt=now();
  save(db);
}
async function schedulerTick(){
  const db=load(),due=db.articles.filter(a=>a.status==='scheduled'&&a.scheduledAt&&new Date(a.scheduledAt)<=new Date());
  if(!due.length)return;
  for(const a of due){a.status='published';a.publishedAt=now();a.updatedAt=now();}
  save(db);
  for(const a of due){try{await dispatchAndPersist(a.id)}catch(err){console.error('scheduled distribution',a.id,err);}}
}
module.exports={saveImage,saveVideo,saveFeaturedImage,deleteUpload,backfillFeaturedMetadata,backfillTypography,sanitizeRich,normalizeRich,normalizeSingleLine,plainFromRich,parseGallery,parseTehranDate,articlePayload,dispatchAndPersist,schedulerTick,socialStatus:social.status};