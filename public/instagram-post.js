(()=>{
const $=s=>document.querySelector(s),root=$('[data-article-root]'),btn=$('[data-article-instagram-post]');
if(!root||!btn)return;

const clean=t=>String(t||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
const lab=btn.querySelector('[data-instagram-post-label]');
const title=clean(root.dataset.articleTitle||document.title);
const lead=clean(root.dataset.articleLead||'');
const bodyEl=$('.article-body .lang-fa');
const fullBody=clean(bodyEl?(bodyEl.innerText||bodyEl.textContent||''):'')||lead;
const imgUrl=root.dataset.articleImage?new URL(root.dataset.articleImage,location.origin).href:'';
const kind=root.dataset.articleImageKind||'none';
const catId=root.dataset.articleCategoryId||'';
const url=new URL(root.dataset.articleUrl||location.pathname,location.origin).href;
const isDemand=catId==='opinion';
const cats={
  'sardouiyeh':'ساردوئیه',
  'city-village':'سیاسی',
  'social':'اجتماعی',
  'culture':'فرهنگی',
  'sports':'ورزش',
  'agriculture':'کشاورزی',
  'tourism':'گردشگری',
  'kerman':'استان کرمان',
  'video':'ویدئو',
  'short-news':'خبر کوتاه',
  'opinion':'یادداشت و مطالبه'
};
const caption=title+'\n\n'+(fullBody||lead)+(fullBody||lead?'\n\n':'')+'🔗 متن خبر در نبض ساردو:\n'+url+'\n\n#نبض_ساردو';
const set=t=>{if(lab)lab.textContent=t};
const reset=()=>setTimeout(()=>set('پست اینستاگرام'),1800);
const rr=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
const copyText=async text=>{
  try{
    if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true;}
  }catch{}
  try{
    const ta=document.createElement('textarea');
    ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';ta.style.pointerEvents='none';
    document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);
    const ok=document.execCommand('copy');ta.remove();return ok;
  }catch{return false;}
};
const download=file=>{
  const u=URL.createObjectURL(file),a=document.createElement('a');
  a.href=u;a.download=file.name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),1800);
};
const cover=(c,bm,x,y,w,h)=>{
  const s=Math.max(w/bm.width,h/bm.height),sw=w/s,sh=h/s;
  c.drawImage(bm,(bm.width-sw)/2,(bm.height-sh)/2,sw,sh,x,y,w,h);
};
const wrap=(c,t,w,max)=>{
  const words=clean(t).split(/\s+/).filter(Boolean),out=[];let line='';
  for(const word of words){
    const next=line?line+' '+word:word;
    if(c.measureText(next).width<=w)line=next;
    else{
      if(line)out.push(line);
      line=word;
      if(out.length>=max-1)break;
    }
  }
  if(line&&out.length<max)out.push(line);
  return out.slice(0,max);
};

async function make(){
  if(document.fonts?.ready)await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,800))]);
  let bm=null;
  if(imgUrl&&kind==='real'){
    try{
      const r=await fetch(imgUrl,{credentials:'same-origin',cache:'force-cache'}),b=await r.blob();
      if(r.ok&&/^image\//i.test(b.type)&&typeof createImageBitmap==='function')bm=await createImageBitmap(b);
    }catch{}
  }

  const W=1080,H=1350,PHOTO_H=770,cv=document.createElement('canvas');
  cv.width=W;cv.height=H;
  const c=cv.getContext('2d');
  if(!c)return null;

  const base=c.createLinearGradient(0,0,0,H);
  base.addColorStop(0,'#171017');base.addColorStop(.52,'#4b0f28');base.addColorStop(1,'#220812');
  c.fillStyle=base;c.fillRect(0,0,W,H);

  if(bm)cover(c,bm,0,0,W,PHOTO_H);
  else{
    const empty=c.createLinearGradient(0,0,W,PHOTO_H);
    empty.addColorStop(0,'#24212a');empty.addColorStop(1,'#111017');
    c.fillStyle=empty;c.fillRect(0,0,W,PHOTO_H);
  }

  const vignette=c.createLinearGradient(0,0,0,PHOTO_H);
  vignette.addColorStop(0,'rgba(10,8,13,.18)');
  vignette.addColorStop(.55,'rgba(42,6,19,.03)');
  vignette.addColorStop(.78,'rgba(71,10,31,.62)');
  vignette.addColorStop(1,'rgba(72,11,32,.98)');
  c.fillStyle=vignette;c.fillRect(0,0,W,PHOTO_H);

  const panel=c.createLinearGradient(0,650,0,H);
  panel.addColorStop(0,'rgba(96,16,44,.03)');
  panel.addColorStop(.12,'rgba(96,16,44,.88)');
  panel.addColorStop(.54,'rgba(76,12,34,.985)');
  panel.addColorStop(1,'rgba(31,6,15,1)');
  c.fillStyle=panel;c.fillRect(0,620,W,H-620);

  const topShade=c.createLinearGradient(0,0,0,190);
  topShade.addColorStop(0,'rgba(0,0,0,.56)');topShade.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=topShade;c.fillRect(0,0,W,200);

  const cat=cats[catId]||'خبر';
  c.direction='rtl';c.textBaseline='middle';
  c.font='800 25px Vazirmatn,Arial';
  const cw=Math.max(168,Math.min(320,c.measureText(cat).width+76));
  const cg=c.createLinearGradient(46,0,46+cw,0);
  cg.addColorStop(0,'#b58a45');cg.addColorStop(.48,'#f3d895');cg.addColorStop(1,'#c49a57');
  c.fillStyle=cg;rr(c,46,54,cw,62,20);c.fill();
  c.textAlign='center';c.fillStyle='#36101e';c.fillText(cat,46+cw/2,86);

  c.fillStyle='rgba(70,10,31,.92)';rr(c,718,46,316,90,25);c.fill();
  c.strokeStyle='rgba(240,204,126,.58)';c.lineWidth=1.6;rr(c,718,46,316,90,25);c.stroke();
  c.textAlign='right';c.fillStyle='#fff9ef';c.font='900 35px Vazirmatn,Arial';c.fillText('نبض ساردو',975,82);
  c.strokeStyle='#e6bb67';c.lineWidth=3;c.lineCap='round';c.lineJoin='round';
  c.beginPath();c.moveTo(748,90);c.lineTo(770,90);c.lineTo(780,75);c.lineTo(793,106);c.lineTo(807,67);c.lineTo(821,103);c.lineTo(835,83);c.lineTo(849,90);c.stroke();

  c.textBaseline='top';c.textAlign='right';c.direction='rtl';
  c.fillStyle='#efd19a';c.font='700 22px Vazirmatn,Arial';
  c.fillText('NABEZ SARDO  •  LOCAL NEWS',1008,690);

  let titleSize=title.length>120?46:title.length>86?52:60;
  c.font='900 '+titleSize+'px Vazirmatn,Arial';
  let titleLines=wrap(c,title,920,3);
  while(titleSize>44&&titleLines.length===3&&c.measureText(titleLines[2]).width>900){
    titleSize-=2;c.font='900 '+titleSize+'px Vazirmatn,Arial';titleLines=wrap(c,title,920,3);
  }
  let y=735;
  titleLines.forEach((line,i)=>{
    c.fillStyle=i===1?'#f4c24d':'#fffaf2';
    c.fillText(line,1008,y);
    y+=titleSize*1.32;
  });

  if(lead){
    let leadSize=30;
    c.font='500 '+leadSize+'px Vazirmatn,Arial';
    let leadLines=wrap(c,lead,920,3);
    const footerTop=1210;
    let need=y+18+leadLines.length*leadSize*1.48;
    while(leadSize>24&&need>footerTop){
      leadSize-=2;c.font='500 '+leadSize+'px Vazirmatn,Arial';leadLines=wrap(c,lead,920,2);
      need=y+18+leadLines.length*leadSize*1.48;
    }
    let ly=y+18;
    c.fillStyle='rgba(255,246,238,.90)';
    for(const line of leadLines){c.fillText(line,1008,ly);ly+=leadSize*1.48;}
  }

  c.fillStyle='rgba(235,190,107,.78)';c.fillRect(64,1222,952,2);
  c.textBaseline='middle';
  c.font='700 25px Vazirmatn,Arial';
  c.direction='ltr';c.textAlign='left';c.fillStyle='#fff8ee';c.fillText('nabzesardo.ir',66,1266);
  c.direction='rtl';c.textAlign='right';c.fillStyle='#f0d39b';
  c.fillText(isDemand?'متن کامل مطالبه در کپشن':'متن کامل خبر در کپشن',1014,1266);

  c.font='600 18px Vazirmatn,Arial';c.fillStyle='rgba(255,247,239,.62)';
  c.fillText('رسانه محلی ساردوئیه و جنوب کرمان',1014,1306);

  const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',.93));
  bm?.close?.();
  return blob?new File([blob],'nabez-sardo-instagram-post.jpg',{type:'image/jpeg'}):null;
}

let file=null;
btn.disabled=true;set('در حال آماده‌سازی پست…');
make().then(f=>{file=f;btn.disabled=!f;set('پست اینستاگرام')}).catch(()=>{btn.disabled=false;set('پست اینستاگرام')});

btn.addEventListener('click',async()=>{
  if(!file)file=await make();
  if(!file){set('خطا در ساخت پست');reset();return;}

  const copied=await copyText(caption);
  set(copied?'متن خبر کپی شد • انتخاب اینستاگرام':'پست آماده است');
  const share={files:[file],text:caption,title};

  try{
    if(navigator.share&&(!navigator.canShare||navigator.canShare(share))){
      await navigator.share(share);
    }else if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
      await navigator.share({files:[file],title});
    }else{
      download(file);
      set(copied?'عکس ذخیره شد • متن خبر کپی شد':'عکس پست ذخیره شد');
    }
  }catch(err){
    if(err?.name!=='AbortError'){
      download(file);
      set(copied?'عکس ذخیره شد • متن خبر کپی شد':'عکس پست ذخیره شد');
    }else if(copied){
      set('متن خبر کپی شد');
    }
  }
  reset();
});
})();