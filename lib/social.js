const BASE=String(process.env.PUBLIC_BASE_URL||'').replace(/\/$/,'');
function clean(v=''){return String(v).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function articleUrl(a){return BASE?BASE+'/news/'+encodeURIComponent(a.slug):'';}
function postText(a){
  const lead=clean(a.lead||'');
  const url=articleUrl(a);
  return [a.title,lead,url].filter(Boolean).join('\n\n').slice(0,3500);
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
  const text=postText(a);
  const base='https://api.telegram.org/bot'+token;
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
  await jsonPost(url,{chat_id:chat,text:postText(a)});
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
        messaging_product:'whatsapp',to,type:'text',text:{preview_url:true,body:postText(a).slice(0,4000)}
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