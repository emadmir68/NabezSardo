const BASE=String(process.env.PUBLIC_BASE_URL||'').replace(/\/$/,'');
function clean(v=''){return String(v).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function slugTag(v=''){return clean(v).replace(/[\\s\\-–—/]+/g,'_').replace(/[^\\p{L}\\p{N}_]/gu,'').slice(0,40);}
function articleUrl(a,source='site'){
  if(!BASE)return '';
  const url=new URL(BASE+'/news/'+encodeURIComponent(a.slug));
  if(source&&source!=='site'){
    url.searchParams.set('utm_source',source);
    url.searchParams.set('utm_medium','social');
    url.searchParams.set('utm_campaign','auto_news');
  }
  return url.toString();
}
function postText(a,source='site'){
  const lead=clean(a.lead||'');
  const url=articleUrl(a,source);
  const tags=['نبض_ساردو',slugTag(a.location||''),slugTag(a.categoryName||'')].filter(Boolean);
  const hashtag=[...new Set(tags)].slice(0,3).map(x=>'#'+x).join(' ');
  const cta=source==='telegram'?'🔗 ادامه خبر در نبض ساردو':source==='rubika'?'🔗 متن کامل خبر در نبض ساردو':'🔗 مشاهده خبر';
  return [a.title,lead,a.location?'📍 '+clean(a.location):'',cta,url,hashtag].filter(Boolean).join('\n\n').slice(0,3500);
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
  const text=postText(a,'telegram');
  const base='https://api.telegram.org/bot'+token;
  if(a.videoUrl&&BASE){
    try{
      const video=a.videoUrl.startsWith('http')?a.videoUrl:BASE+a.videoUrl;
      await jsonPost(base+'/sendVideo',{chat_id:chat,video,caption:text.slice(0,1000),supports_streaming:true});
      return {status:'sent',at:new Date().toISOString(),mode:'video'};
    }catch(err){
      console.warn('telegram video fallback',String(err.message||err));
    }
  }
  if(a.image&&BASE){
    try{
      const photo=a.image.startsWith('http')?a.image:BASE+a.image;
      await jsonPost(base+'/sendPhoto',{chat_id:chat,photo,caption:text.slice(0,1000)});
      return {status:'sent',at:new Date().toISOString(),mode:'photo'};
    }catch(err){
      await jsonPost(base+'/sendMessage',{chat_id:chat,text});
      return {status:'sent',at:new Date().toISOString(),mode:'text-fallback',note:String(err.message||err)};
    }
  }
  await jsonPost(base+'/sendMessage',{chat_id:chat,text});
  return {status:'sent',at:new Date().toISOString(),mode:'text'};
}
async function rubika(a){
  const token=process.env.RUBIKA_BOT_TOKEN,chat=process.env.RUBIKA_CHAT_ID;
  if(!token||!chat)return {status:'skipped',reason:'not-configured'};
  const url='https://botapi.rubika.ir/v3/'+encodeURIComponent(token)+'/sendMessage';
  const data=await jsonPost(url,{chat_id:chat,text:postText(a,'rubika')});
  if(data&&typeof data==='object'&&data.status&&String(data.status).toUpperCase()!=='OK'){
    throw new Error('Rubika API: '+String(data.status));
  }
  return {status:'sent',at:new Date().toISOString(),mode:'text'};
}
async function whatsapp(a){
  const token=process.env.WHATSAPP_ACCESS_TOKEN,phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID,toRaw=process.env.WHATSAPP_TO;
  if(!token||!phoneId||!toRaw)return {status:'skipped',reason:'not-configured'};
  const version=process.env.WHATSAPP_GRAPH_VERSION||'v23.0';
  const recipients=toRaw.split(',').map(x=>x.trim()).filter(Boolean);
  const results=[];
  for(const to of recipients){
    try{
      await jsonPost('https://graph.facebook.com/'+version+'/'+phoneId+'/messages',{
        messaging_product:'whatsapp',to,type:'text',text:{preview_url:true,body:postText(a,'whatsapp').slice(0,4000)}
      },{authorization:'Bearer '+token});
      results.push({to,status:'sent'});
    }catch(err){results.push({to,status:'failed',error:String(err.message||err)});}
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
module.exports={status,dispatch,articleUrl};