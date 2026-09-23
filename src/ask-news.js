const STOP_WORDS=new Set([
  "از","به","در","با","برای","و","یا","که","این","آن","اون","یک","یه","را","رو","بر","روی","تا","هم",
  "چه","چی","چیه","چیست","هست","است","بود","شد","شده","میشه","می‌شود","کن","کرد","کرده","درباره","مورد",
  "خبر","خبرها","اخبار","آخرین","جدید","جدیدترین","مهم","مهمی","اتفاق","افتاده","منتشر","انتشار","امروز","دیروز",
  "هفته","ماه","سال","کدام","کجا","کی","چطور","چگونه","لطفا","لطفاً","بگو","بده","داریم","داره","هستند","هستش"
]);
const PRIMARY_MODEL="@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const FALLBACK_MODEL="@cf/meta/llama-3.1-8b-instruct-fp8";

function clean(v=""){
  return String(v||"")
    .replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]+>/g," ")
    .replace(/&nbsp;|&#160;/gi," ")
    .replace(/&amp;/gi,"&")
    .replace(/\s+/g," ")
    .trim();
}
function norm(v=""){
  return clean(v)
    .replace(/[يى]/g,"ی").replace(/ك/g,"ک")
    .replace(/[\u064B-\u065F\u0670\u200c\u200f\u202a-\u202e]/g," ")
    .replace(/[^\p{L}\p{N}\s]/gu," ")
    .replace(/\s+/g," ").trim().toLowerCase();
}
function queryTokens(q=""){
  const raw=norm(q).split(" ").filter(Boolean);
  const out=[];
  for(const t0 of raw){
    const t=t0==="ساردو"?"ساردوئیه":t0;
    if(t.length<2||STOP_WORDS.has(t))continue;
    if(!out.includes(t))out.push(t);
  }
  return out.slice(0,12);
}
function published(db){
  return (db?.articles||[])
    .filter(a=>a&&a.status==="published")
    .sort((a,b)=>new Date(b.publishedAt||b.createdAt||0)-new Date(a.publishedAt||a.createdAt||0));
}
function ageHours(a){
  const t=new Date(a.publishedAt||a.createdAt||0).getTime();
  return Number.isFinite(t)?Math.max(0,(Date.now()-t)/3600000):999999;
}
function scoreArticle(a,category,q,tokens){
  const title=norm(a.title||"");
  const lead=norm(a.lead||"");
  const body=norm(a.body||"");
  const location=norm(a.location||"");
  const cat=norm(category?.name||"");
  const full=norm(q);
  let score=0, hits=0;
  if(full.length>3){
    if(title.includes(full))score+=36;
    else if(lead.includes(full))score+=22;
    else if(body.includes(full))score+=10;
  }
  for(const t of tokens){
    let hit=false;
    if(title.includes(t)){score+=12;hit=true;}
    if(lead.includes(t)){score+=6;hit=true;}
    if(body.includes(t)){score+=2.5;hit=true;}
    if(location.includes(t)){score+=9;hit=true;}
    if(cat.includes(t)){score+=8;hit=true;}
    if(hit)hits++;
  }
  if(tokens.length>1&&hits===tokens.length)score+=12;
  const nq=norm(q),h=ageHours(a);
  if(/\bامروز\b/.test(nq)){if(h<=36)score+=18;else if(h<=72)score+=7;}
  else if(/\bدیروز\b/.test(nq)){if(h>=12&&h<=60)score+=15;}
  else if(/\bهفته\b/.test(nq)){if(h<=24*7)score+=13;else if(h<=24*14)score+=4;}
  else if(/\bماه\b/.test(nq)){if(h<=24*31)score+=9;}
  if(/آخرین|جدید|جدیدترین/.test(nq)){if(h<=72)score+=10;else if(h<=24*7)score+=5;}
  if(/پربازدید|بیشترین بازدید/.test(nq))score+=Math.min(10,Math.log10(Number(a.views||0)+1)*3);
  return {score,hits};
}
function excerpt(a,max=520){
  const t=clean(a.lead||a.body||a.title||"");
  return t.length>max?t.slice(0,max).trim()+"…":t;
}
function retrieve(db,q){
  const tokens=queryTokens(q);
  const cats=new Map((db?.categories||[]).map(c=>[c.id,c]));
  const rows=published(db).map((a,index)=>{
    const category=cats.get(a.categoryId)||null;
    const scored=scoreArticle(a,category,q,tokens);
    return {a,category,index,...scored};
  }).filter(x=>x.score>0);
  rows.sort((x,y)=>y.score-x.score||x.index-y.index);
  const threshold=tokens.length?5:10;
  return rows.filter(x=>x.score>=threshold).slice(0,6);
}
function sourcePayload(row){
  const a=row.a;
  return {
    title:clean(a.title||""),
    url:"/news/"+encodeURIComponent(a.slug||""),
    excerpt:excerpt(a,180),
    category:clean(row.category?.name||"خبر"),
    location:clean(a.location||""),
    date:a.publishedAt||a.createdAt||"",
    image:a.image||"",
    score:Math.round(row.score*10)/10
  };
}
function fallbackAnswer(rows){
  if(!rows.length)return "برای این سؤال هنوز خبر مرتبط و قابل اتکایی در آرشیو نبض ساردو پیدا نکردم. می‌توانی نام محل، شخص، موضوع یا بازه زمانی را دقیق‌تر بنویسی.";
  const first=rows[0].a;
  const firstText=excerpt(first,280);
  if(rows.length===1)return "نزدیک‌ترین خبر مرتبط در آرشیو: «"+clean(first.title)+"». "+firstText;
  const second=rows[1].a;
  return "در آرشیو نبض ساردو، نزدیک‌ترین پاسخ از خبر «"+clean(first.title)+"» به دست می‌آید. "+firstText+" همچنین خبر مرتبط دیگری با عنوان «"+clean(second.title)+"» منتشر شده است.";
}
function contextFor(rows){
  return rows.map((r,i)=>{
    const a=r.a;
    return [
      "منبع "+(i+1),
      "عنوان: "+clean(a.title||""),
      "دسته: "+clean(r.category?.name||"خبر"),
      "محل: "+clean(a.location||"نامشخص"),
      "تاریخ: "+String(a.publishedAt||a.createdAt||""),
      "متن: "+excerpt(a,850)
    ].join("\n");
  }).join("\n\n---\n\n");
}
function extractAiText(result){
  if(typeof result==="string")return result.trim();
  if(result&&typeof result.response==="string")return result.response.trim();
  if(result&&result.result&&typeof result.result.response==="string")return result.result.response.trim();
  const c=result?.choices?.[0]?.message?.content;
  return typeof c==="string"?c.trim():"";
}
async function runModel(ai,model,q,rows){
  const system=[
    "تو دستیار خبری رسمی «نبض ساردو» هستی.",
    "فقط و فقط بر اساس منابعی که پایین به تو داده می‌شود پاسخ بده و هیچ اطلاعات بیرونی، حدس یا جزئیات ساخته‌شده اضافه نکن.",
    "اگر منابع برای پاسخ قطعی کافی نیستند، شفاف بگو اطلاعات آرشیو کافی نیست.",
    "پاسخ باید فارسی روان، دقیق و کوتاه باشد؛ معمولاً 2 تا 4 جمله.",
    "عدد، نام شخص، سمت و مکان را فقط وقتی بنویس که در منابع وجود دارد.",
    "به کاربر نگو که مدل زبانی هستی و URL تولید نکن؛ لینک منابع جداگانه در رابط نمایش داده می‌شود."
  ].join(" ");
  const user="سؤال کاربر:\n"+q+"\n\nمنابع آرشیو نبض ساردو:\n"+contextFor(rows);
  const result=await ai.run(model,{messages:[{role:"system",content:system},{role:"user",content:user}],temperature:0.15,max_tokens:360});
  return extractAiText(result);
}
export async function handleAskNewsRequest(request,db,ai){
  let payload=null;
  try{
    const raw=await request.text();
    if(raw.length>12000)return Response.json({ok:false,error:"request-too-large"},{status:413});
    payload=JSON.parse(raw||"{}");
  }catch{
    return Response.json({ok:false,error:"invalid-json"},{status:400});
  }
  const q=clean(payload?.q||payload?.query||"").slice(0,180);
  if(q.length<2)return Response.json({ok:false,error:"query-too-short"},{status:400});
  const rows=retrieve(db,q);
  const sources=rows.map(sourcePayload);
  if(!rows.length){
    return Response.json({ok:true,query:q,answer:fallbackAnswer([]),sources:[],mode:"archive",confidence:"low"},{headers:{"cache-control":"no-store"}});
  }
  let answer="",model="";
  if(ai){
    try{answer=await runModel(ai,PRIMARY_MODEL,q,rows);model=PRIMARY_MODEL;}
    catch{
      try{answer=await runModel(ai,FALLBACK_MODEL,q,rows);model=FALLBACK_MODEL;}catch{}
    }
  }
  if(!answer)answer=fallbackAnswer(rows);
  const top=rows[0].score;
  const confidence=top>=30?"high":top>=14?"medium":"low";
  return Response.json({ok:true,query:q,answer,sources,mode:model?"ai":"archive",confidence,model:model||undefined},{headers:{"cache-control":"no-store","x-nabzesardo-ask":"v1"}});
}
