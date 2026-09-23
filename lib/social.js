const BASE=String(process.env.PUBLIC_BASE_URL||'').replace(/\/$/,'');
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
  const target=key?('/n/'+encodeURIComponent(key)):('/news/'+encodeURIComponent(a.slug||''));
  const url=new URL(BASE+target);
  if(source&&source!=='site')url.searchParams.set('utm_source',source);
  return url.toString();
}
function summary(a){return clip(a.lead||a.body||'',360);}
function hashtags(a){
  const category=CATEGORY_TAGS[a.categoryId]||a.categoryName||'';
  const tags=['نبض_ساردو',slugTag(a.location||''),slugTag(category)].filter(Boolean);
  return [...new Set(tags)].slice(0,3).map(x=>'#'+x).join(' ');
}
function telegramText(a,source='telegram'){
  const url=articleUrl(a,source);
  const title=clip(a.title||'',260);
  const lead=summary(a);
  const location=clean(a.location||'');
  const tags=hashtags(a);
  const lines=[
    '🟠 <b>نبض ساردوئیه</b>',
    '📰 <b>'+escHtml(title)+'</b>',
    lead?escHtml(lead):'',
    location?'📍 '+escHtml(location):'',
    url?'🔗 <a href="'+escHtml(url)+'">ادامه خبر در نبض ساردو</a>':'',
    tags
  ].filter(Boolean);
  return lines.join('\n\n');
}
function plainText(a,source='site'){
  const title=clip(a.title||'',260);
  const lead=summary(a);
  const location=clean(a.location||'');
  const url=articleUrl(a,source);
  const tags=hashtags(a);
  return [
    '🟠 نبض ساردوئیه',
    '📰 '+title,
    lead,
    location?'📍 '+location:'',
    url?'🔗 ادامه خبر در نبض ساردو\n'+url:'',
    tags
  ].filter(Boolean).join('\n\n').slice(0,3500);
}
function utf16Len(s=''){
  let n=0;
  for(const ch of String(s))n+=ch.codePointAt(0)>0xFFFF?2:1;
  return n;
}
function rubikaDisplayUrl(a){
  if(!BASE)return '';
  return BASE+'/news/'+String(a.slug||'').replace(/^\/+|\/+$/g,'');
}
function rubikaCaption(a){
  const title=clip(a.title||'',260);
  const lead=summary(a);
  const location=clean(a.location||'');
  const url=rubikaDisplayUrl(a);
  const tags=hashtags(a);
  return [
    '🟠 نبض ساردوئیه',
    '📰 '+title,
    lead,
    location?'📍 '+location:'',
    url?'🔗 ادامه خبر در نبض ساردو\n'+url:'',
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
  const location=clean(a.location||'');
  const tags=hashtags(a);

  add('🟠 ');
  add('نبض ساردوئیه',{type:'Bold'});
  add('\n\n📰 ');
  add(title,{type:'Bold'});
  if(lead)add('\n\n'+lead);
  if(location)add('\n\n📍 '+location);
  if(url){
    add('\n\n🔗 ');
    add('ادامه خبر در نبض ساردو',{type:'Link',url});
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
async function jsonPost(url,payload,headers={}){
  const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(payload)});
  let data=null;try{data=await res.json()}catch{data=await res.text()}
  if(!res.ok)throw new Error((data&&data.error&&data.error.message)||('HTTP '+res.status));
  return data;
}
async function telegram(a){
  const token=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chat)return {status:'skipped',reason:'not-configured'};
  const text=telegramText(a,'telegram');
  const base='https://api.telegram.org/bot'+token;
  const common={chat_id:chat,caption:text.slice(0,1000),parse_mode:'HTML'};
  if(a.image&&BASE){
    try{
      const photo=a.image.startsWith('http')?a.image:BASE+a.image;
      await jsonPost(base+'/sendPhoto',{...common,photo});
      return {status:'sent',at:new Date().toISOString(),mode:'photo'};
    }catch(err){
      console.warn('telegram photo fallback',String(err.message||err));
    }
  }
  if(a.videoUrl&&BASE){
    try{
      const video=a.videoUrl.startsWith('http')?a.videoUrl:BASE+a.videoUrl;
      await jsonPost(base+'/sendVideo',{...common,video,supports_streaming:true});
      return {status:'sent',at:new Date().toISOString(),mode:'video'};
    }catch(err){
      console.warn('telegram video fallback',String(err.message||err));
    }
  }
  await jsonPost(base+'/sendMessage',{chat_id:chat,text,parse_mode:'HTML',disable_web_page_preview:false});
  return {status:'sent',at:new Date().toISOString(),mode:'text'};
}
function rubikaApiData(payload){
  return payload&&payload.data&&typeof payload.data==='object'?payload.data:payload;
}
function assertRubikaOk(payload){
  const status=payload&&typeof payload==='object'&&payload.status?String(payload.status).toUpperCase():'OK';
  if(status&&status!=='OK')throw new Error('Rubika API: '+status);
  return payload;
}
async function rubikaCall(token,method,payload){
  const out=await jsonPost('https://botapi.rubika.ir/v3/'+encodeURIComponent(token)+'/'+method,payload);
  return assertRubikaOk(out);
}
async function rubikaUpload(token,mediaUrl,type='Image'){
  const ticket=await rubikaCall(token,'requestSendFile',{type});
  const ticketData=rubikaApiData(ticket)||{};
  const uploadUrl=ticketData.upload_url||ticket.upload_url;
  if(!uploadUrl)throw new Error('Rubika upload URL missing');

  const media=await fetch(mediaUrl);
  if(!media.ok)throw new Error('Media fetch HTTP '+media.status);
  const bytes=await media.arrayBuffer();
  const mime=media.headers.get('content-type')||'application/octet-stream';
  const pathname=new URL(mediaUrl).pathname;
  const filename=decodeURIComponent(pathname.split('/').pop()||'news-media');

  const form=new FormData();
  form.append('file',new Blob([bytes],{type:mime}),filename);
  const uploaded=await fetch(uploadUrl,{method:'POST',body:form});
  let body=null;try{body=await uploaded.json()}catch{body=await uploaded.text()}
  if(!uploaded.ok)throw new Error('Rubika upload HTTP '+uploaded.status);
  assertRubikaOk(body);
  const info=rubikaApiData(body)||{};
  const fileId=info.file_id||body.file_id;
  if(!fileId)throw new Error('Rubika file id missing');
  return fileId;
}
async function rubika(a){
  const token=process.env.RUBIKA_BOT_TOKEN,chat=process.env.RUBIKA_CHAT_ID;
  if(!token||!chat)return {status:'skipped',reason:'not-configured'};

  const caption=rubikaCaption(a);

  // Rubika sendFile accepts a plain caption but not metadata.
  if(a.image&&BASE){
    try{
      const image=a.image.startsWith('http')?a.image:BASE+a.image;
      const fileId=await rubikaUpload(token,image,'Image');
      await rubikaCall(token,'sendFile',{chat_id:chat,file_id:fileId,text:caption});
      return {status:'sent',at:new Date().toISOString(),mode:'image'};
    }catch(err){
      console.warn('rubika image fallback',String(err&&err.message||err));
    }
  }

  // Try the richer text version first. If Rubika rejects metadata,
  // fall back once more to guaranteed plain text.
  try{
    const message=rubikaText(a);
    const payload={chat_id:chat,text:message.text};
    if(message.metadata)payload.metadata=message.metadata;
    await rubikaCall(token,'sendMessage',payload);
    return {status:'sent',at:new Date().toISOString(),mode:'rich-text'};
  }catch(err){
    console.warn('rubika rich-text fallback',String(err&&err.message||err));
  }

  await rubikaCall(token,'sendMessage',{chat_id:chat,text:caption});
  return {status:'sent',at:new Date().toISOString(),mode:'plain-text'};
}
async function whatsapp(a){
  const token=process.env.WHATSAPP_ACCESS_TOKEN,phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID,toRaw=process.env.WHATSAPP_TO;
  if(!token||!phoneId||!toRaw)return {status:'skipped',reason:'not-configured'};
  const version=process.env.WHATSAPP_GRAPH_VERSION||'v23.0';
  const recipients=toRaw.split(',').map(x=>x.trim()).filter(Boolean);
  const results=[],caption=plainText(a,'whatsapp').slice(0,1000);
  const image=a.image&&BASE?(a.image.startsWith('http')?a.image:BASE+a.image):'';
  const video=a.videoUrl&&BASE?(a.videoUrl.startsWith('http')?a.videoUrl:BASE+a.videoUrl):'';
  for(const to of recipients){
    let sent=false,lastError='';
    if(image){
      try{
        await jsonPost('https://graph.facebook.com/'+version+'/'+phoneId+'/messages',{
          messaging_product:'whatsapp',to,type:'image',image:{link:image,caption}
        },{authorization:'Bearer '+token});
        results.push({to,status:'sent',mode:'image'});sent=true;
      }catch(err){lastError=String(err.message||err);}
    }
    if(!sent&&video){
      try{
        await jsonPost('https://graph.facebook.com/'+version+'/'+phoneId+'/messages',{
          messaging_product:'whatsapp',to,type:'video',video:{link:video,caption}
        },{authorization:'Bearer '+token});
        results.push({to,status:'sent',mode:'video'});sent=true;
      }catch(err){lastError=String(err.message||err);}
    }
    if(!sent){
      try{
        await jsonPost('https://graph.facebook.com/'+version+'/'+phoneId+'/messages',{
          messaging_product:'whatsapp',to,type:'text',text:{preview_url:true,body:plainText(a,'whatsapp').slice(0,4000)}
        },{authorization:'Bearer '+token});
        results.push({to,status:'sent',mode:'text'});
      }catch(err){results.push({to,status:'failed',error:String(err.message||err)||lastError});}
    }
  }
  if(results.some(x=>x.status==='sent'))return {status:'sent',at:new Date().toISOString(),results};
  throw new Error(results.map(x=>x.error).filter(Boolean).join('; ')||'WhatsApp delivery failed');
}
async function dispatch(a){
  const out={...(a.distribution||{})};
  const jobs=[
    ['telegram',a.socialTelegram!==false,telegram],
    ['rubika',a.socialRubika!==false,rubika],
    ['whatsapp',a.socialWhatsApp===true,whatsapp]
  ];
  for(const [name,enabled,fn] of jobs){
    if(!enabled){out[name]={status:'disabled'};continue;}
    try{out[name]=await fn(a);}catch(err){out[name]={status:'failed',at:new Date().toISOString(),error:String(err.message||err)};}
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
      location:clean(a.location||''),
      image:a.image||'',
      url:articleUrl(a,'story')
    }
  };
}
module.exports={status,dispatch,articleUrl,sharePackage};
