/* Complete text-only stories. Layout helpers are shared with Node regression tests. */
(function(global){
  'use strict';
  const WIDTH=1080,HEIGHT=1920,CONTENT_TOP=346,CONTENT_BOTTOM=1650,CONTENT_WIDTH=820;
  function clean(value){return String(value||'').replace(/[ \t\r]+/g,' ').trim();}
  function storyParagraphs(input){
    const body=String(input.body||'').split(/\n+/).map(clean).filter(Boolean);
    const lead=clean(input.lead);
    const first=body.join(' ').replace(/\s+/g,' ').trim();
    if(lead&&!(first===lead||first.startsWith(lead+' ')))body.unshift(lead);
    return body;
  }
  function graphemes(value){
    if(typeof Intl.Segmenter==='function')return Array.from(new Intl.Segmenter('fa',{granularity:'grapheme'}).segment(value),x=>x.segment);
    return Array.from(value);
  }
  function wrapText(value,maxWidth,measure){
    const result=[];let line='';
    function flush(){if(line){result.push(line);line='';}}
    for(const paragraph of String(value||'').split(/\n+/)){
      for(const word of paragraph.trim().split(/\s+/).filter(Boolean)){
        const next=line?line+' '+word:word;
        if(measure(next)<=maxWidth){line=next;continue;}
        flush();
        if(measure(word)<=maxWidth){line=word;continue;}
        for(const part of graphemes(word)){
          if(line&&measure(line+part)>maxWidth)flush();
          line+=part;
        }
      }
      flush();
    }
    return result;
  }
  function paginateStory(input,measure){
    const blocks=[];
    if(clean(input.title))blocks.push({text:input.title,kind:'title',font:76,height:110,weight:800});
    storyParagraphs(input).forEach(text=>blocks.push({text,kind:'body',font:52,height:78,weight:500}));
    const pages=[];let page={items:[]},y=CONTENT_TOP;
    function nextPage(){if(page.items.length)pages.push(page);page={items:[]};y=CONTENT_TOP;}
    blocks.forEach((block,index)=>{
      if(index&&page.items.length)y+=22;
      const lines=wrapText(block.text,CONTENT_WIDTH,text=>measure(text,block.font,block.weight));
      for(const text of lines){
        if(y+block.height>CONTENT_BOTTOM)nextPage();
        page.items.push({...block,text,y});y+=block.height;
      }
    });
    nextPage();
    return pages.length?pages:[{items:[]}];
  }
  function extractText(node){
    if(!node)return '';
    const blockTags=new Set(['P','DIV','SECTION','ARTICLE','H1','H2','H3','H4','H5','H6','LI','UL','OL','BLOCKQUOTE','TR','TABLE','PRE','FIGCAPTION','TD','TH']);
    function visit(n){
      if(n.nodeType===3)return n.nodeValue||'';
      if(n.nodeType!==1)return '';
      if(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE'].includes(n.tagName)||n.hidden||n.getAttribute?.('aria-hidden')==='true')return '';
      if(n.tagName==='BR')return '\n';
      const text=Array.from(n.childNodes||[]).map(visit).join('');
      return blockTags.has(n.tagName)?'\n'+text+'\n':text;
    }
    return visit(node).replace(/\u00a0/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  }
  const CRC_TABLE=Array.from({length:256},(_,n)=>{
    let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;
  });
  function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=CRC_TABLE[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
  async function zipFiles(files){
    const chunks=[],directory=[];let offset=0;
    for(const file of files){
      const name=new TextEncoder().encode(file.name),data=new Uint8Array(await file.arrayBuffer()),crc=crc32(data);
      const local=new Uint8Array(30+name.length),lv=new DataView(local.buffer);
      lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);
      lv.setUint16(12,33,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);
      lv.setUint16(26,name.length,true);local.set(name,30);
      const entry=new Uint8Array(46+name.length),ev=new DataView(entry.buffer);
      ev.setUint32(0,0x02014b50,true);ev.setUint16(4,20,true);ev.setUint16(6,20,true);ev.setUint16(8,0x800,true);
      ev.setUint16(14,33,true);ev.setUint32(16,crc,true);ev.setUint32(20,data.length,true);ev.setUint32(24,data.length,true);
      ev.setUint16(28,name.length,true);ev.setUint32(42,offset,true);entry.set(name,46);
      chunks.push(local,data);directory.push(entry);offset+=local.length+data.length;
    }
    if(files.length>65535||offset>0xffffffff)throw new Error('story-archive-too-large');
    const size=directory.reduce((n,x)=>n+x.length,0),end=new Uint8Array(22),view=new DataView(end.buffer);
    view.setUint32(0,0x06054b50,true);view.setUint16(8,files.length,true);view.setUint16(10,files.length,true);
    view.setUint32(12,size,true);view.setUint32(16,offset,true);
    return new Blob([...chunks,...directory,end],{type:'application/zip'});
  }
  function drawPage(ctx,page,index,total,input){
    const en=input.lang==='en',edge=en?130:950;
    const round=(x,y,w,h,r)=>{
      ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
      ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
    };
    const pulse=(x,y,scale,color,width)=>{
      ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle=color;ctx.lineWidth=width;
      ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
      [[0,38],[38,38],[49,23],[64,57],[82,6],[99,49],[114,31],[129,38],[163,38]].forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));
      ctx.stroke();ctx.restore();
    };
    const gradient=ctx.createLinearGradient(0,0,WIDTH,HEIGHT);
    gradient.addColorStop(0,'#18212e');gradient.addColorStop(.44,'#080d15');gradient.addColorStop(1,'#271423');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,WIDTH,HEIGHT);
    const glow=ctx.createRadialGradient(990,240,0,990,240,940);
    glow.addColorStop(0,'rgba(202,165,91,.19)');glow.addColorStop(.55,'rgba(122,49,79,.08)');glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.strokeStyle='rgba(231,199,135,.055)';ctx.lineWidth=1;
    for(let x=-HEIGHT;x<WIDTH;x+=90){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+HEIGHT,HEIGHT);ctx.stroke();}
    pulse(-130,1410,7,'rgba(213,168,95,.045)',.7);
    ctx.fillStyle='#b39157';ctx.fillRect(58,128,6,142);
    ctx.strokeStyle='rgba(232,202,141,.28)';ctx.lineWidth=2;round(58,116,964,1700,34);ctx.stroke();
    ctx.direction=en?'ltr':'rtl';ctx.textAlign=en?'left':'right';ctx.textBaseline='top';
    const brandX=en?248:828;
    pulse(en?100:846,160,.7,'#f0cc86',4);
    ctx.fillStyle='#f1d295';ctx.font='800 54px Vazirmatn, Tahoma, sans-serif';
    ctx.fillText(en?'NABEZ SARDO':'نبض ساردو',brandX,146);
    ctx.fillStyle='#96a5b9';ctx.font='500 25px Vazirmatn, Tahoma, sans-serif';
    ctx.fillText(en?'LOCAL NEWSROOM / SOUTH KERMAN':'صدای خبرهای محلی · جنوب کرمان',brandX,210);
    ctx.fillStyle='rgba(183,143,76,.12)';round(110,260,860,48,24);ctx.fill();
    ctx.fillStyle='#d7bc8d';ctx.font='700 27px Vazirmatn, Tahoma, sans-serif';
    const category=String(input.category|| (en?'LOCAL REPORT':'گزارش محلی'));
    ctx.fillText(category,edge,266);
    ctx.save();ctx.direction='ltr';ctx.textAlign=en?'right':'left';ctx.font='600 25px Arial, sans-serif';
    ctx.fillText(index===0?'NEWS / FULL STORY':'NEWS / CONTINUED',en?950:130,271);ctx.restore();
    const panel=ctx.createLinearGradient(90,322,990,1648);
    panel.addColorStop(0,'rgba(37,42,52,.92)');panel.addColorStop(1,'rgba(15,21,31,.95)');
    ctx.fillStyle=panel;round(90,322,900,1346,26);ctx.fill();
    ctx.strokeStyle='rgba(206,220,241,.08)';ctx.lineWidth=1;ctx.stroke();
    const titleItems=page.items.filter(item=>item.kind==='title');
    if(titleItems.length){
      const last=titleItems[titleItems.length-1];
      ctx.fillStyle='rgba(201,156,81,.06)';round(106,330,868,Math.min(last.y+last.height+8,1660)-330,18);ctx.fill();
      ctx.fillStyle='#e2b96b';ctx.fillRect(en?108:965,350,4,Math.min(110,last.y+last.height-350));
    }
    const number=n=>Number(n).toLocaleString(en?'en-US':'fa-IR');
    for(const item of page.items){
      ctx.font=item.weight+' '+item.font+'px Vazirmatn, Tahoma, sans-serif';
      ctx.fillStyle=item.kind==='title'?'#ffe8b8':'#edf1f7';ctx.fillText(item.text,edge,item.y);
    }
    ctx.fillStyle='#e1bd7b';ctx.font='700 28px Vazirmatn, Tahoma, sans-serif';
    ctx.fillText(index===total-1?(en?'END OF STORY':'پایان خبر'):(en?'CONTINUED ON NEXT STORY':'ادامه در استوری بعدی ←'),edge,1701);
    ctx.save();ctx.direction='ltr';ctx.textAlign=en?'right':'left';ctx.fillStyle='#a8b5c6';ctx.font='600 29px Vazirmatn, Tahoma, sans-serif';
    ctx.fillText(number(index+1)+' / '+number(total),en?950:130,1701);ctx.restore();
    ctx.fillStyle='rgba(207,167,100,.25)';ctx.fillRect(130,1750,820,1);
    ctx.direction='ltr';ctx.textAlign='center';ctx.fillStyle='#aab6c6';ctx.font='500 24px Arial, sans-serif';
    ctx.fillText(input.url.replace(/^https?:\/\//,''),540,1770);
    ctx.fillStyle='#d7b370';round(320,1844,440,5,2);ctx.fill();
    ctx.fillStyle='#fff0c5';round(320,1844,440*((index+1)/total),5,2);ctx.fill();
  }
  async function renderStories(input,onProgress=()=>{},isCancelled=()=>false){
    try{if(document.fonts)await Promise.race([Promise.all([document.fonts.load('500 52px Vazirmatn'),document.fonts.load('800 76px Vazirmatn')]),new Promise(resolve=>setTimeout(resolve,4000))]);}catch{}
    const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('story-canvas-unavailable');
    try{
      const pages=paginateStory(input,(text,font,weight)=>{
        ctx.font=weight+' '+font+'px Vazirmatn, Tahoma, sans-serif';return ctx.measureText(text).width;
      });
      const files=[];
      for(let i=0;i<pages.length;i++){
        if(isCancelled())return null;
        drawPage(ctx,pages[i],i,pages.length,input);
        const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('story-png-failed')),'image/png'));
        files.push(new File([blob],'nabze-sardo-text-story-'+String(i+1).padStart(3,'0')+'-of-'+String(pages.length).padStart(3,'0')+'.png',{type:'image/png'}));
        onProgress(i+1,pages.length);
      }
      return files;
    }finally{canvas.width=0;canvas.height=0;}
  }
  function mount(){
    const article=document.querySelector('[data-article-root]'),openButton=document.querySelector('[data-article-text-story]');
    if(!article||!openButton)return;
    const dialog=document.createElement('dialog');
    dialog.className='text-story-dialog';dialog.setAttribute('aria-labelledby','text-story-heading');
    dialog.innerHTML='<div class="text-story-panel"><button type="button" class="text-story-close" aria-label="بستن">×</button><h2 id="text-story-heading">استوری متن کامل خبر</h2><p class="text-story-status" role="status" aria-live="polite"></p><div class="text-story-preview"></div><div class="text-story-navigation"><button type="button" data-text-prev>قبلی</button><span data-text-page></span><button type="button" data-text-next>بعدی</button></div><div class="text-story-buttons"><button type="button" data-text-share-all>اشتراک همه استوری‌ها</button><button type="button" data-text-share-one>اشتراک این صفحه</button><button type="button" data-text-download-one>ذخیره این صفحه</button><button type="button" data-text-download-all>ذخیره همه (ZIP)</button></div><p class="text-story-help">خبر بلند در چند استوری شماره‌دار آماده می‌شود. برای برنامه‌هایی که فقط یک تصویر می‌پذیرند، هر صفحه را به‌ترتیب ارسال کن.</p></div>';
    document.body.appendChild(dialog);
    const status=dialog.querySelector('.text-story-status'),preview=dialog.querySelector('.text-story-preview');
    const prev=dialog.querySelector('[data-text-prev]'),next=dialog.querySelector('[data-text-next]'),counter=dialog.querySelector('[data-text-page]');
    const shareAll=dialog.querySelector('[data-text-share-all]'),shareOne=dialog.querySelector('[data-text-share-one]');
    const downloadOne=dialog.querySelector('[data-text-download-one]'),downloadAll=dialog.querySelector('[data-text-download-all]');
    const actions=[prev,next,shareAll,shareOne,downloadOne,downloadAll];
    let files=[],index=0,previewUrl='',token=0,zipPromise=null;
    function releasePreview(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}}
    function paint(){
      releasePreview();
      previewUrl=URL.createObjectURL(files[index]);
      const img=document.createElement('img');img.src=previewUrl;img.alt='استوری متن کامل، صفحه '+(index+1)+' از '+files.length;
      preview.replaceChildren(img);counter.textContent=(index+1).toLocaleString('fa-IR')+' از '+files.length.toLocaleString('fa-IR');
      actions.forEach(b=>b.disabled=false);prev.disabled=index===0;next.disabled=index===files.length-1;
      shareAll.hidden=files.length===1;downloadAll.hidden=files.length===1;
    }
    function cleanup(){token++;releasePreview();files=[];zipPromise=null;preview.replaceChildren();openButton.focus();}
    dialog.addEventListener('close',cleanup);
    dialog.querySelector('.text-story-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    openButton.addEventListener('click',async()=>{
      const current=++token;files=[];index=0;zipPromise=null;releasePreview();preview.replaceChildren();
      actions.forEach(b=>b.disabled=true);counter.textContent='';status.textContent='در حال آماده‌سازی متن کامل خبر…';
      if(!dialog.open)dialog.showModal();
      const lang=document.documentElement.dataset.lang==='en'?'en':'fa';
      const body=article.querySelector('.article-body .lang-'+lang)||article.querySelector('.article-body .lang-fa');
      const deck=article.querySelector('.article-deck .lang-'+lang)||article.querySelector('.article-deck .lang-fa');
      const heading=article.querySelector('h1 .lang-'+lang)||article.querySelector('h1 .lang-fa');
      const category=article.querySelector('.article-category-pill .lang-'+lang)||article.querySelector('.article-category-pill .lang-fa');
      const input={title:heading?.textContent||article.dataset.articleTitle||'',lead:extractText(deck),body:extractText(body),category:category?.textContent||'',lang,url:new URL(article.dataset.articleUrl||location.pathname,location.origin).href};
      try{
        const result=await renderStories(input,(done,total)=>{if(current===token)status.textContent='آماده‌سازی صفحه '+done.toLocaleString('fa-IR')+' از '+total.toLocaleString('fa-IR');},()=>current!==token);
        if(current!==token||!result)return;
        files=result;paint();status.textContent='متن کامل در '+files.length.toLocaleString('fa-IR')+' استوری آماده است.';
      }catch(error){
        if(current!==token)return;
        status.textContent='ساخت استوری انجام نشد. دوباره امتحان کن.';console.warn('text story preparation failed',error);
      }
    });
    prev.addEventListener('click',()=>{if(index>0){index--;paint();}});
    next.addEventListener('click',()=>{if(index<files.length-1){index++;paint();}});
    function download(blob,name){
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }
    async function saveAll(){
      if(!files.length)return;
      const current=token;downloadAll.disabled=true;status.textContent='در حال آماده‌سازی همه استوری‌ها برای ذخیره…';
      try{
        if(!zipPromise)zipPromise=zipFiles(files);
        const zip=await zipPromise;
        if(current!==token)return;
        download(zip,'nabze-sardo-text-stories.zip');status.textContent='همه صفحات در یک فایل ZIP ذخیره شد.';
      }catch(error){if(current===token)status.textContent='ذخیره مجموعه انجام نشد؛ می‌توانی هر صفحه را جدا ذخیره کنی.';}
      finally{if(current===token)downloadAll.disabled=false;}
    }
    function share(selected){
      if(!selected.length)return;
      const current=token;
      try{
        const payload={files:selected};
        if(typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare(payload)){
          // Native share stays inside this user tap; no rendering or network awaits.
          navigator.share(payload).catch(error=>{
            if(current!==token||error?.name==='AbortError')return;
            status.textContent='ارسال انجام نشد؛ دوباره امتحان کن یا تصویر استوری را ذخیره کن.';
          });return;
        }
      }catch(error){console.warn('text story share capability failed',error);}
      if(selected.length===1){
        download(selected[0],selected[0].name);status.textContent='تصویر استوری ذخیره شد؛ آن را از گالری در برنامهٔ دلخواه ارسال کن.';
      }else{
        status.textContent='مرورگر ارسال چند تصویر را پشتیبانی نمی‌کند؛ همه را ذخیره کن یا صفحه‌ها را جدا ارسال کن.';
      }
    }
    shareAll.addEventListener('click',()=>share(files));
    shareOne.addEventListener('click',()=>share(files[index]?[files[index]]:[]));
    downloadOne.addEventListener('click',()=>{if(files[index])download(files[index],files[index].name);});
    downloadAll.addEventListener('click',saveAll);
  }
  const api={wrapText,paginateStory,storyParagraphs,extractText,zipFiles,crc32};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof document!=='undefined'){
    global.NabezTextStory=api;
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  }
})(typeof globalThis!=='undefined'?globalThis:this);
