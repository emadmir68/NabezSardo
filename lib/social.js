const BASE=String(process.env.PUBLIC_BASE_URL||'').replace(/\/$/,'');
const {shortArticleCode}=require('./view-common');
const fs=require('fs');
const path=require('path');
const CATEGORY_TAGS={
  'sardouiyeh':'ساردوئیه','city-village':'سیاسی','social':'اجتماعی','culture':'فرهنگی',
  'sports':'ورزش','agriculture':'کشاورزی','tourism':'گردشگری','kerman':'استان_کرمان',
  'video':'ویدئو','short-news':'خبر_کوتاه'
};

function clean(v=''){return String(v).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function clip(v='',max=340){
  const s=clean(v);
  if(s.length<=max)return s;
  const cut=s.slice(0,max-1);
  const at=cut.lastIndexOf(' ');
  return (at>max*0.65?cut.slice(0,at):cut).trim()+'…';
}
function slugTag(v=''){
  return clean(v).replace(/[\s\-–—/]+/g,'_').replace(/[^\p{L}\p{N}_]/gu,'').replace(/^_+|_+$/g,'').slice(0,40);
}
function escHtml(v=''){
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function articleUrl(a,source='site'){
  if(!BASE)return '';
  const key=String(a.id||'').trim();
  const target=key?('/news/'+shortArticleCode(key)):('/news/'+encodeURIComponent(a.slug||''));
  return new URL(BASE+target).toString();
}
function summary(a){return clip(a.lead||a.body||'',360);}
function effectiveLocation(a){
  const raw=clean(a&&a.location||'');
  if(!raw)return '';
  if(raw==='ساردوئیه'){
    const content=clean([a&&a.title,a&&a.lead,a&&a.body].filter(Boolean).join(' '));
    if(a&&a.categoryId!=='sardouiyeh'&&!/ساردوئیه|ساردویه|ساردو/.test(content))return '';
  }
  return raw;
}
function hashtags(a){
  const category=CATEGORY_TAGS[a.categoryId]||a.categoryName||'';
  const location=effectiveLocation(a);
  const hay=clean([a.title,a.lead,a.body,location,category].filter(Boolean).join(' '));
  const tags=['نبض_ساردو','جنوب_کرمان'];
  if(/ساردوئیه|ساردویه|ساردو/.test(hay))tags.push('ساردو','ساردوئیه');
  if(/جیرفت/.test(hay))tags.push('جیرفت');
  if(/عنبرآباد|عنبر اباد|عنبر آباد/.test(hay))tags.push('عنبرآباد');
  if(/کهنوج/.test(hay))tags.push('کهنوج');
  const loc=slugTag(location);
  if(loc)tags.push(loc);
  const cat=slugTag(category);
  if(cat)tags.push(cat);
  return [...new Set(tags)].slice(0,6).map(x=>'#'+x).join(' ');
}
function telegramText(a,source='telegram'){
  const url=articleUrl(a,source);
  const title=clip(a.title||'',260);
  const lead=summary(a);
  const location=effectiveLocation(a);
  const tags=hashtags(a);
  const lines=[
    '🟠 <b>نبض ساردو</b>',
    '📰 <b>'+escHtml(title)+'</b>',
    lead?'🔹 <b>خلاصه خبر</b>\n'+escHtml(lead):'',
    location?'📍 '+escHtml(location):'',
    url?'📌 <b>ادامه خبر در نبض ساردو</b>\n'+escHtml(url):'',
    tags
  ].filter(Boolean);
  return lines.join('\n\n');
}
function plainText(a,source='site'){
  const title=clip(a.title||'',260);
  const lead=summary(a);
  const location=effectiveLocation(a);
  const url=articleUrl(a,source);
  const tags=hashtags(a);
  return [
    '🟠 نبض ساردو',
    '📰 '+title,
    lead?'🔹 خلاصه خبر\n'+lead:'',
    location?'📍 '+location:'',
    url?'📌 ادامه خبر در نبض ساردو\n'+url:'',
    tags
  ].filter(Boolean).join('\n\n').slice(0,3500);
}
function utf16Len(s=''){
  let n=0;
  for(const ch of String(s))n+=ch.codePointAt(0)>0xFFFF?2:1;
  return n;
}
function rubikaDisplayUrl(a){
  return articleUrl(a,'rubika');
}
function rubikaCaption(a){
  const title=clip(a.title||'',260);
  const lead=summary(a);
  const location=effectiveLocation(a);
  const url=rubikaDisplayUrl(a);
  const tags=hashtags(a);
  return [
    '🟠 نبض ساردو',
    '📰 '+title,
    lead?'🔹 خلاصه خبر\n'+lead:'',
    location?'📍 '+location:'',
    url?'📌 ادامه خبر در نبض ساردو\n'+url:'',
    tags
  ].filter(Boolean).join('\n\n').slice(0,3500);
}
function rubikaText(a){
  let text='';
  const parts=[];
  const add=(value,meta)=>{
    const start=utf16Len(text);
    text+=String(value);
    if(meta){
      const length=utf16Len(value);
      const part={type:meta.type,from_index:start,length};
      if(meta.type==='Link'){
        part.link_url=meta.url;
        part.link={type:'hyperlink',hyperlink_data:{url:meta.url}};
      }
      parts.push(part);
    }
  };
  const url=articleUrl(a,'rubika');
  const title=clip(a.title||'',260);
  const lead=summary(a);
  const location=effectiveLocation(a);
  const tags=hashtags(a);

  add('🟠 ');
  add('نبض ساردو',{type:'Bold'});
  add('\n\n📰 ');
  add(title,{type:'Bold'});
  if(lead){
    add('\n\n🔹 ');
    add('خلاصه خبر',{type:'Bold'});
    add('\n'+lead);
  }
  if(location)add('\n\n📍 '+location);
  if(url){
    add('\n\n📌 ');
    add('ادامه خبر در نبض ساردو',{type:'Bold'});
    add('\n');
    add(url,{type:'Link',url});
  }
  if(tags)add('\n\n'+tags);
  return {text:text.slice(0,3500),metadata:parts.length?{meta_data_parts:parts}:undefined};
}
function status(){
  return {
    telegram:Boolean(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_CHAT_ID),
    rubika:Boolean(process.env.RUBIKA_BOT_TOKEN&&process.env.RUBIKA_CHAT_ID),
    whatsapp:Boolean(process.env.WHATSAPP_ACCESS_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID&&process.env.WHATSAPP_TO),
    baseUrl:Boolean(BASE)
  };
}
function uncertain(err){
  if(err&&err.deliveryUnknown)return err;
  const out=new Error('پاسخ قطعی دریافت نشد؛ پیش از ارسال دوباره، کانال را بررسی کنید.');
  out.deliveryUnknown=true;
  return out;
}
async function jsonPost(url,payload,headers={}){
  let res,data;
  try{
    res=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
    data=await res.json();
  }catch(err){throw uncertain(err);}
  if(res.status>=500)throw uncertain();
  if(!res.ok||data?.ok===false){
    throw new Error(data?.description||data?.error?.message||('HTTP '+res.status));
  }
  return data;
}
function sentResult(data,mode){
  return {status:'sent',at:new Date().toISOString(),mode,messageId:data?.result?.message_id||data?.data?.message_id||data?.message_id||null};
}
async function telegram(a){
  const token=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chat)return {status:'skipped',reason:'not-configured'};
  const text=telegramText(a,'telegram');
  const base='https://api.telegram.org/bot'+token;
  const common={chat_id:chat,caption:text.slice(0,1000),parse_mode:'HTML'};
  if(a.videoUrl&&BASE){
    try{
      const video=a.videoUrl.startsWith('http')?a.videoUrl:BASE+a.videoUrl;
      const data=await jsonPost(base+'/sendVideo',{...common,video,supports_streaming:true});
      return sentResult(data,'video');
    }catch(err){
      if(err.deliveryUnknown)throw err;
      console.warn('telegram video fallback',String(err.message||err));
    }
  }
  const image=a.socialImage||a.image;
  if(image&&BASE&&!/\.svg(?:\?|$)/i.test(image)){
    try{
      const photo=image.startsWith('http')?image:BASE+image;
      const data=await jsonPost(base+'/sendPhoto',{...common,photo});
      return sentResult(data,'photo');
    }catch(err){
      if(err.deliveryUnknown)throw err;
      console.warn('telegram photo fallback',String(err.message||err));
    }
  }
  const data=await jsonPost(base+'/sendMessage',{chat_id:chat,text,parse_mode:'HTML',disable_web_page_preview:false});
  return sentResult(data,'text');
}
function rubikaApiData(payload){
  return payload&&payload.data&&typeof payload.data==='object'?payload.data:payload;
}
function assertRubikaOk(payload){
  const status=payload&&typeof payload==='object'&&payload.status?String(payload.status).toUpperCase():'OK';
  if(status&&status!=='OK')throw new Error('Rubika API: '+status);
  return payload;
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function retry(fn,attempts=3){
  let last;
  for(let i=0;i<attempts;i++){
    try{return await fn(i);}catch(err){
      last=err;
      if(i<attempts-1)await sleep(450*(i+1));
    }
  }
  throw last;
}
async function rubikaCall(token,method,payload,{retries=1}={}){
  if(method==='sendMessage'||method==='sendFile')retries=1;
  return retry(async()=>{
    const out=await jsonPost('https://botapi.rubika.ir/v3/'+encodeURIComponent(token)+'/'+method,payload);
    return assertRubikaOk(out);
  },retries);
}
function mediaMime(filename='',declared='',type='File'){
  const cleanMime=String(declared||'').split(';')[0].trim().toLowerCase();
  if(type==='Image'&&cleanMime.startsWith('image/'))return cleanMime;
  if(type==='Video'&&cleanMime.startsWith('video/'))return cleanMime;
  const ext=String(filename).toLowerCase().split('.').pop();
  const map={
    jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',
    mp4:'video/mp4',mov:'video/quicktime',webm:'video/webm'
  };
  return map[ext]||(type==='Image'?'image/jpeg':type==='Video'?'video/mp4':'application/octet-stream');
}
async function rubikaUpload(token,mediaUrl,type='Image'){
  const pathname=new URL(mediaUrl).pathname;
  const name=path.basename(pathname);
  const local=pathname.startsWith('/uploads/')&&name===decodeURIComponent(pathname.slice('/uploads/'.length))
    ?path.join(process.env.UPLOAD_DIR||path.join(process.env.DATA_DIR||'/tmp/nabzesardo','uploads'),name):'';
  let bytes,declared='';
  if(local&&fs.existsSync(local)){
    bytes=fs.readFileSync(local);
  }else{
    const media=await retry(async()=>{
      const res=await fetch(mediaUrl,{redirect:'follow',signal:AbortSignal.timeout(25000)});
      if(!res.ok)throw new Error('Media fetch HTTP '+res.status);
      return res;
    },3);
    bytes=await media.arrayBuffer();
    declared=media.headers.get('content-type');
  }
  if(!bytes.byteLength)throw new Error('Media is empty');
  if(bytes.byteLength>50*1024*1024)throw new Error('Media exceeds Rubika 50MB limit');

  const fallbackName=type==='Video'?'news-video.mp4':'news-image.jpg';
  const filename=decodeURIComponent(pathname.split('/').pop()||fallbackName);
  const mime=mediaMime(filename,declared,type);

  return retry(async()=>{
    const ticket=await rubikaCall(token,'requestSendFile',{type},{retries:2});
    const ticketData=rubikaApiData(ticket)||{};
    const uploadUrl=ticketData.upload_url||ticket.upload_url;
    if(!uploadUrl)throw new Error('Rubika upload URL missing');

    const form=new FormData();
    form.append('file',new Blob([bytes],{type:mime}),filename);
    const uploaded=await fetch(uploadUrl,{method:'POST',body:form,signal:AbortSignal.timeout(25000)});
    const body=await uploaded.json();
    if(!uploaded.ok)throw new Error('Rubika upload HTTP '+uploaded.status);
    assertRubikaOk(body);
    const info=rubikaApiData(body)||{};
    const fileId=info.file_id||body.file_id;
    if(!fileId)throw new Error('Rubika file id missing');
    return fileId;
  },3);
}
async function rubika(a){
  const token=process.env.RUBIKA_BOT_TOKEN,chat=process.env.RUBIKA_CHAT_ID;
  if(!token||!chat)return {status:'skipped',reason:'not-configured'};

  const caption=rubikaCaption(a);
  let mediaFailure='';

  if(a.videoUrl&&BASE){
    try{
      const video=a.videoUrl.startsWith('http')?a.videoUrl:BASE+a.videoUrl;
      const fileId=await rubikaUpload(token,video,'Video');
      const data=await rubikaCall(token,'sendFile',{chat_id:chat,file_id:fileId,text:caption});
      return sentResult(data,'video');
    }catch(err){
      if(err.deliveryUnknown)throw err;
      mediaFailure='video: '+String(err&&err.message||err);
      console.warn('rubika video fallback',mediaFailure);
    }
  }

  // Rubika sendFile accepts a plain caption but not metadata.
  const selectedImage=a.socialImage||a.image;
  if(selectedImage&&BASE&&!/\.svg(?:\?|$)/i.test(selectedImage)){
    try{
      const image=selectedImage.startsWith('http')?selectedImage:BASE+selectedImage;
      const fileId=await rubikaUpload(token,image,'Image');
      const data=await rubikaCall(token,'sendFile',{chat_id:chat,file_id:fileId,text:caption});
      return sentResult(data,'image');
    }catch(err){
      if(err.deliveryUnknown)throw err;
      const detail='image: '+String(err&&err.message||err);
      mediaFailure=mediaFailure?mediaFailure+'; '+detail:detail;
      console.warn('rubika image fallback',detail);
    }
  }

  // Try the richer text version first. If Rubika rejects metadata,
  // fall back once more to guaranteed plain text.
  try{
    const message=rubikaText(a);
    const payload={chat_id:chat,text:message.text};
    if(message.metadata)payload.metadata=message.metadata;
    const data=await rubikaCall(token,'sendMessage',payload);
    return {
      ...sentResult(data,'rich-text'),
      mode:mediaFailure?'text-fallback':'rich-text',
      ...(mediaFailure?{note:mediaFailure}:{})
    };
  }catch(err){
    if(err.deliveryUnknown)throw err;
    console.warn('rubika rich-text fallback',String(err&&err.message||err));
  }

  const data=await rubikaCall(token,'sendMessage',{chat_id:chat,text:caption});
  return {
    ...sentResult(data,'plain-text'),
    mode:'plain-text',
    ...(mediaFailure?{note:mediaFailure}:{})
  };
}
async function whatsapp(a,checkpoint=async()=>{}){
  const token=process.env.WHATSAPP_ACCESS_TOKEN,phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID,toRaw=process.env.WHATSAPP_TO;
  if(!token||!phoneId||!toRaw)return {status:'skipped',reason:'not-configured'};
  const version=process.env.WHATSAPP_GRAPH_VERSION||'v23.0';
  const recipients=[...new Set(toRaw.split(',').map(x=>x.trim()).filter(Boolean))];
  const previous=a.distribution?.whatsapp?.results||[];
  const results=recipients.map(to=>({...previous.find(r=>r.to===to),to}));
  const snapshot=()=>({status:results.every(r=>r.status==='sent')?'sent':results.some(r=>['sent','unknown','sending'].includes(r.status))?'partial':'failed',at:new Date().toISOString(),results:structuredClone(results)});
  const caption=plainText(a,'whatsapp').slice(0,1000);
  for(const result of results){
    if(['sent','unknown','sending'].includes(result.status)){if(result.status==='sending')result.status='unknown';continue;}
    result.status='sending';await checkpoint('whatsapp',{...snapshot(),status:'partial'});
    const media=[];
    if(a.videoUrl&&BASE)media.push(['video',a.videoUrl]);
    const image=a.socialImage||a.image;
    if(image&&BASE&&!/\.svg(?:\?|$)/i.test(image))media.push(['image',image]);
    media.push(['text','']);
    for(const [type,source] of media){
      const payload={messaging_product:'whatsapp',to:result.to,type};
      payload[type]=type==='text'?{preview_url:true,body:plainText(a,'whatsapp').slice(0,4000)}:{link:source.startsWith('http')?source:BASE+source,caption};
      try{
        const data=await jsonPost('https://graph.facebook.com/'+version+'/'+phoneId+'/messages',payload,{authorization:'Bearer '+token});
        Object.assign(result,{status:'sent',mode:type,messageId:data?.messages?.[0]?.id||null});delete result.error;break;
      }catch(err){
        Object.assign(result,{status:err.deliveryUnknown?'unknown':'failed',error:String(err.message||err)});
        if(err.deliveryUnknown)break;
      }
    }
    await checkpoint('whatsapp',snapshot());
  }
  return snapshot();
}
async function dispatch(a,checkpoint=async()=>{}){
  const persist=async(name,state)=>{try{await checkpoint(name,state)}catch(err){err.checkpointFailure=true;throw err;}};
  const out={...(a.distribution||{})};
  const jobs=[
    ['telegram',a.socialTelegram!==false,telegram],
    ['rubika',a.socialRubika!==false,rubika],
    ['whatsapp',a.socialWhatsApp===true,whatsapp]
  ];
  for(const [name,enabled,fn] of jobs){
    if(['sent','unknown','sending'].includes(out[name]?.status)){
      if(out[name].status==='sending')out[name]={...out[name],status:'unknown'};
      continue;
    }
    if(!enabled){out[name]={status:'disabled'};continue;}
    if(name!=='whatsapp')await persist(name,{status:'sending',at:new Date().toISOString()});
    try{out[name]=await fn(a,persist);}catch(err){if(err.checkpointFailure)throw err;out[name]={status:err.deliveryUnknown?'unknown':'failed',at:new Date().toISOString(),error:String(err.message||err)};}
    await persist(name,out[name]);
  }
  return out;
}
function sharePackage(a){
  return {
    generatedAt:new Date().toISOString(),
    shortUrl:articleUrl(a,'site'),
    telegram:plainText(a,'telegram'),
    rubika:rubikaCaption(a),
    whatsapp:plainText(a,'whatsapp'),
    story:{
      title:clean(a.title||''),
      lead:summary(a),
      category:clean(a.categoryName||CATEGORY_TAGS[a.categoryId]||'خبر'),
      location:effectiveLocation(a),
      image:a.image||'',
      url:articleUrl(a,'story')
    }
  };
}
module.exports={status,dispatch,articleUrl,sharePackage};
