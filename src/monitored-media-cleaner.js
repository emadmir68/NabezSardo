import { Buffer } from "node:buffer";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgModule from "@resvg/resvg-wasm/index_bg.wasm";
import policy from "../lib/media-clean-policy.js";

const {mergeDetectedBoxes,chooseCleanupMethod,expandBox}=policy;
const MODEL="@cf/moondream/moondream3.1-9B-A2B";
const TARGETS=[
  "logo or watermark",
  "news source branding, channel name, website watermark or broadcaster mark"
];
let rasterReady;

function dataUri(file){
  const type=String(file?.type||"image/jpeg").split(";")[0].trim().toLowerCase();
  return "data:"+type+";base64,"+Buffer.from(file.data).toString("base64");
}
function safeObjects(result){
  if(Array.isArray(result?.objects))return result.objects;
  if(Array.isArray(result?.result?.objects))return result.result.objects;
  return [];
}
async function detectBranding(ai,file){
  if(!ai||typeof ai.run!=="function")return {boxes:[],reliable:false,error:"ai-unavailable"};
  if(!file?.data?.length||file.data.length>6*1024*1024)return {boxes:[],reliable:false,error:"image-unsupported-size"};
  const image=dataUri(file);
  const settled=await Promise.allSettled(TARGETS.map(target=>ai.run(MODEL,{
    task:"detect",image,target,max_objects:12,stream:false
  })));
  const objects=[];let successes=0;
  for(const item of settled){
    if(item.status!=="fulfilled")continue;
    successes++;
    objects.push(...safeObjects(item.value));
  }
  return {boxes:mergeDetectedBoxes(objects),reliable:successes>0,error:successes?"":"logo-detection-failed"};
}

function jpegSize(buf){
  let i=2;
  while(i+9<buf.length){
    if(buf[i]!==0xff){i++;continue;}
    const marker=buf[i+1];
    if(marker===0xd8||marker===0xd9){i+=2;continue;}
    if(i+3>=buf.length)break;
    const len=buf.readUInt16BE(i+2);
    if(len<2)break;
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&i+8<buf.length){
      return {width:buf.readUInt16BE(i+7),height:buf.readUInt16BE(i+5)};
    }
    i+=2+len;
  }
  return null;
}
function webpSize(buf){
  if(buf.length<30||buf.toString("ascii",0,4)!=="RIFF"||buf.toString("ascii",8,12)!=="WEBP")return null;
  const kind=buf.toString("ascii",12,16);
  if(kind==="VP8X"&&buf.length>=30){
    const w=1+buf[24]+(buf[25]<<8)+(buf[26]<<16);
    const h=1+buf[27]+(buf[28]<<8)+(buf[29]<<16);
    return {width:w,height:h};
  }
  if(kind==="VP8 "&&buf.length>=30&&buf[23]===0x9d&&buf[24]===0x01&&buf[25]===0x2a){
    return {width:buf.readUInt16LE(26)&0x3fff,height:buf.readUInt16LE(28)&0x3fff};
  }
  if(kind==="VP8L"&&buf.length>=25&&buf[20]===0x2f){
    const b0=buf[21],b1=buf[22],b2=buf[23],b3=buf[24];
    return {width:1+(((b2&0x3f)<<8)|b1),height:1+(((b3&0x0f)<<10)|(b2>>6)|(b3&0xf0)<<2)};
  }
  return null;
}
function dimensions(file){
  const b=Buffer.from(file.data),type=String(file.type||"").toLowerCase();
  if(type==="image/png"&&b.length>=24&&b.toString("ascii",1,4)==="PNG")return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
  if(type==="image/gif"&&b.length>=10)return {width:b.readUInt16LE(6),height:b.readUInt16LE(8)};
  if(type==="image/jpeg"&&b.length>=4&&b[0]===0xff&&b[1]===0xd8)return jpegSize(b);
  if(type==="image/webp")return webpSize(b);
  return null;
}
function canvas(file){
  const d=dimensions(file)||{width:1200,height:675};
  const width=Math.max(240,Number(d.width)||1200),height=Math.max(180,Number(d.height)||675);
  const scale=Math.min(1,1600/width,1200/height);
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
function imageTag(uri,W,H,attrs=""){
  return '<image href="'+uri+'" x="0" y="0" width="'+W+'" height="'+H+'" preserveAspectRatio="none" '+attrs+'/>';
}
function svgWrap(W,H,defs,body){
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><defs>'+defs+'</defs>'+body+'</svg>';
}
function cropSvg(file,crop){
  const uri=dataUri(file),{width:W,height:H}=canvas(file);
  const f=Math.max(0.01,Math.min(0.18,Number(crop.fraction)||0.08)),s=1/(1-f);
  const iw=W*s,ih=H*s;
  let x=(W-iw)/2,y=(H-ih)/2;
  if(crop.edge==="left")x=-f*W*s;
  if(crop.edge==="right")x=0;
  if(crop.edge==="top")y=-f*H*s;
  if(crop.edge==="bottom")y=0;
  const body='<image href="'+uri+'" x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" width="'+iw.toFixed(2)+'" height="'+ih.toFixed(2)+'" preserveAspectRatio="none"/>';
  return {svg:svgWrap(W,H,"",body),width:W,height:H};
}
function blurSvg(file,boxes,strong=false){
  const uri=dataUri(file),{width:W,height:H}=canvas(file);
  const defs=['<filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="'+(strong?26:16)+'"/></filter>'];
  let overlays="";
  boxes.map(b=>expandBox(b,strong?0.026:0.018)).forEach((b,i)=>{
    const x=b.x1*W,y=b.y1*H,w=b.width*W,h=b.height*H;
    defs.push('<clipPath id="c'+i+'"><rect x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" width="'+w.toFixed(2)+'" height="'+h.toFixed(2)+'" rx="'+Math.min(18,w/5,h/5).toFixed(2)+'"/></clipPath>');
    overlays+=imageTag(uri,W,H,'filter="url(#blur)" clip-path="url(#c'+i+')"');
    if(strong)overlays+='<rect x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" width="'+w.toFixed(2)+'" height="'+h.toFixed(2)+'" fill="#10141b" fill-opacity=".22" clip-path="url(#c'+i+')"/>';
  });
  return {svg:svgWrap(W,H,defs.join(""),imageTag(uri,W,H)+overlays),width:W,height:H};
}
async function rasterize(spec){
  rasterReady ||= initWasm(resvgModule);
  await rasterReady;
  const png=new Resvg(spec.svg,{fitTo:{mode:"width",value:spec.width}}).render().asPng();
  return {data:Buffer.from(png),type:"image/png"};
}
async function verifiedClean(ai,file){
  const scan=await detectBranding(ai,file);
  return scan.reliable&&scan.boxes.length===0;
}

export async function cleanMonitoredImage({file,ai}){
  try{
    if(!file?.data?.length)return {action:"fallback",method:"smart-cover",reason:"missing-image",logoDetected:null};
    const initial=await detectBranding(ai,file);
    if(!initial.reliable)return {action:"fallback",method:"smart-cover",reason:initial.error||"logo-scan-unreliable",logoDetected:null};
    if(!initial.boxes.length)return {action:"use",file,method:"original-verified",logoDetected:false,verified:true};

    const decision=chooseCleanupMethod(initial.boxes);
    if(decision.method==="crop"&&decision.crop){
      const cropped=await rasterize(cropSvg(file,decision.crop));
      if(await verifiedClean(ai,cropped))return {action:"use",file:cropped,method:"crop",logoDetected:true,verified:true,boxes:initial.boxes};
    }

    const blurred=await rasterize(blurSvg(file,initial.boxes,false));
    if(await verifiedClean(ai,blurred))return {action:"use",file:blurred,method:"blur",logoDetected:true,verified:true,boxes:initial.boxes};

    const stronger=await rasterize(blurSvg(file,initial.boxes,true));
    if(await verifiedClean(ai,stronger))return {action:"use",file:stronger,method:"blur-strong",logoDetected:true,verified:true,boxes:initial.boxes};

    return {action:"fallback",method:"smart-cover",reason:"branding-remains-after-cleanup",logoDetected:true,boxes:initial.boxes};
  }catch(err){
    return {action:"fallback",method:"smart-cover",reason:String(err?.message||err||"media-clean-failed").slice(0,180),logoDetected:null};
  }
}

export async function cleanMonitoredVideo(){
  return {action:"fallback",method:"smart-cover",reason:"video-transcode-cleanup-unavailable",logoDetected:null};
}
