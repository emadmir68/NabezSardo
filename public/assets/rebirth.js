'use strict';
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

  const languageKey='nabez-lang';
  const languageButtons=$$('[data-lang-option]');
  function setLanguage(value){
    const lang=value==='en'?'en':'fa';
    document.documentElement.dataset.lang=lang;
    document.documentElement.lang=lang==='en'?'en':'fa-IR';
    document.documentElement.dir=lang==='en'?'ltr':'rtl';
    document.body.classList.toggle('rb-lang-en',lang==='en');
    try{localStorage.setItem(languageKey,lang);}catch{}
    languageButtons.forEach(button=>button.classList.toggle('active',button.dataset.langOption===lang));
    $$('[data-placeholder-fa]').forEach(input=>{
      input.placeholder=lang==='en'?(input.dataset.placeholderEn||input.dataset.placeholderFa):(input.dataset.placeholderFa||'');
    });
  }
  if(languageButtons.length){
    let saved='fa';try{saved=localStorage.getItem(languageKey)||'fa';}catch{}
    languageButtons.forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.langOption)));
    setLanguage(saved);
  }
  const updateClock=()=>{
    const lang=document.documentElement.dataset.lang==='en'?'en':'fa';
    const dateLocale=lang==='en'?'en-US-u-ca-persian':'fa-IR-u-ca-persian';
    const clockLocale=lang==='en'?'en-GB':'fa-IR';
    const now=new Date();
    $$('[data-jalali-date]').forEach(el=>{try{el.textContent=new Intl.DateTimeFormat(dateLocale,{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'}).format(now);}catch{}});
    $$('[data-live-clock]').forEach(el=>{try{el.textContent=new Intl.DateTimeFormat(clockLocale,{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Tehran'}).format(now);}catch{}});
  };
  updateClock();setInterval(updateClock,30000);
  const liveCounter=$('[data-live-views]');
  async function refreshLiveViews(){
    if(!liveCounter||document.visibilityState==='hidden')return;
    try{
      const response=await fetch('/api/live-stats?_='+Date.now(),{cache:'no-store',credentials:'same-origin'});
      if(!response.ok)return;
      const data=await response.json();
      if(Number.isFinite(Number(data.totalPageViews)))liveCounter.textContent=Number(data.totalPageViews).toLocaleString(document.documentElement.dataset.lang==='en'?'en-US':'fa-IR');
    }catch{}
  }
  if(liveCounter){refreshLiveViews();setInterval(refreshLiveViews,20000);}

  $$('[data-menu-toggle]').forEach(button=>{
    button.addEventListener('click',()=>{
      const nav=$('[data-main-nav]');
      if(!nav)return;
      const open=nav.classList.toggle('is-open');
      button.setAttribute('aria-expanded',String(open));
    });
  });

  $$('[data-copy-link]').forEach(button=>{
    button.addEventListener('click',async()=>{
      try{
        await navigator.clipboard.writeText(location.href);
        button.textContent='پیوند کپی شد ✓';
      }catch{button.textContent='کپی پیوند در این مرورگر در دسترس نیست';}
    });
  });
  $$('[data-share]').forEach(button=>{
    button.addEventListener('click',async()=>{
      const data={title:document.title,url:location.href};
      if(navigator.share){try{await navigator.share(data);}catch{}}
      else{
        try{await navigator.clipboard.writeText(location.href);button.textContent='پیوند کپی شد ✓';}
        catch{button.textContent='اشتراک‌گذاری در دسترس نیست';}
      }
    });
  });

  $$('[data-admin-filter]').forEach(input=>{
    input.addEventListener('input',()=>{
      const q=input.value.trim().toLocaleLowerCase();
      $$('[data-admin-list] .rb-admin-list-row').forEach(row=>{
        row.hidden=!row.textContent.toLocaleLowerCase().includes(q);
      });
    });
  });

  $$('form[data-confirm]').forEach(form=>{
    form.addEventListener('submit',event=>{
      if(!window.confirm(form.getAttribute('data-confirm')||'ادامه می‌دهید؟'))event.preventDefault();
    });
  });

  async function uploadImage(file){
    const fd=new FormData();
    fd.append('image',file,file.name||'upload.jpg');
    const response=await fetch('/admin/upload/image',{method:'POST',body:fd,credentials:'same-origin'});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.url)throw new Error(payload.error||'آپلود تصویر انجام نشد.');
    return payload.url;
  }
  function setPreview(input,selector,emptySelector){
    const file=input.files&&input.files[0];
    const frame=$(selector);
    if(!file||!frame)return;
    const img=$('[data-image-preview]',frame);
    const empty=$(emptySelector,frame);
    if(img){img.src=URL.createObjectURL(file);img.hidden=false;}
    if(empty)empty.hidden=true;
  }
  $$('[data-image-input]').forEach(input=>{
    input.addEventListener('change',()=>setPreview(input,'[data-image-preview-frame]','[data-preview-empty]'));
  });
  $$('[data-video-input]').forEach(input=>{
    input.addEventListener('change',()=>{
      const file=input.files&&input.files[0],frame=$('[data-video-preview-frame]');
      if(!file||!frame)return;
      const video=$('[data-video-preview]',frame),empty=$('[data-video-empty]',frame);
      if(video){video.src=URL.createObjectURL(file);video.hidden=false;}
      if(empty)empty.hidden=true;
    });
  });

  $$('[data-status-select]').forEach(select=>{
    const form=select.closest('form');
    const wrap=form&&$('[data-schedule-wrap]',form);
    const update=()=>{if(wrap)wrap.hidden=select.value!=='scheduled';};
    select.addEventListener('change',update);update();
  });

  $$('[data-rebirth-editor]').forEach(form=>{
    const area=$('[data-rich-area]',form),hidden=$('[data-rich-input]',form);
    const galleryInput=$('[data-gallery-json]',form),galleryList=$('[data-gallery-list]',form),galleryStatus=$('[data-gallery-status]',form);
    const saveStatus=$('[data-save-status]',form);
    const sync=()=>{if(area&&hidden)hidden.value=area.innerHTML;if(galleryInput&&galleryList){galleryInput.value=JSON.stringify($$('.rb-gallery-item',galleryList).map(x=>x.dataset.url).filter(Boolean));}};
    $$('[data-cmd]',form).forEach(button=>{
      button.addEventListener('click',()=>{
        if(!area)return;
        area.focus();
        const command=button.dataset.cmd;
        if(command==='formatBlock')document.execCommand(command,false,button.dataset.value||'h2');
        else document.execCommand(command,false,null);
        sync();
      });
    });
    $$('[data-dir]',form).forEach(button=>{
      button.addEventListener('click',()=>{
        if(!area)return;
        area.focus();area.dir=button.dataset.dir==='ltr'?'ltr':'rtl';
        area.style.textAlign=area.dir==='ltr'?'left':'right';
      });
    });
    const inlineButton=$('[data-inline-image]',form),inlineInput=$('[data-inline-file]',form);
    if(inlineButton&&inlineInput){
      inlineButton.addEventListener('click',()=>inlineInput.click());
      inlineInput.addEventListener('change',async()=>{
        const file=inlineInput.files&&inlineInput.files[0];if(!file||!area)return;
        if(galleryStatus)galleryStatus.textContent='در حال بارگذاری تصویر...';
        try{
          const url=await uploadImage(file);
          area.focus();document.execCommand('insertHTML',false,'<p><img src="'+url.replace(/"/g,'%22')+'" alt=""></p>');
          sync();if(galleryStatus)galleryStatus.textContent='تصویر به متن خبر افزوده شد.';
        }catch(err){if(galleryStatus)galleryStatus.textContent=err.message;}
        inlineInput.value='';
      });
    }
    const galleryInputFile=$('[data-gallery-input]',form);
    if(galleryInputFile){
      galleryInputFile.addEventListener('change',async()=>{
        const files=Array.from(galleryInputFile.files||[]);
        if(!files.length||!galleryList)return;
        if(galleryStatus)galleryStatus.textContent='در حال بارگذاری '+files.length+' تصویر...';
        for(const file of files){
          try{
            const url=await uploadImage(file);
            const figure=document.createElement('figure');
            figure.className='rb-gallery-item';figure.dataset.url=url;
            const img=document.createElement('img');img.src=url;img.alt='';
            const remove=document.createElement('button');remove.type='button';remove.dataset.galleryRemove='';remove.setAttribute('aria-label','حذف تصویر');remove.textContent='×';
            figure.append(img,remove);galleryList.appendChild(figure);
          }catch(err){if(galleryStatus)galleryStatus.textContent=err.message;}
        }
        sync();galleryInputFile.value='';
        if(galleryStatus)galleryStatus.textContent='گالری به‌روزرسانی شد.';
      });
    }
    if(galleryList){
      galleryList.addEventListener('click',event=>{
        const button=event.target.closest('[data-gallery-remove]');
        if(!button)return;
        const item=button.closest('.rb-gallery-item');if(item)item.remove();sync();
      });
    }
    form.addEventListener('submit',()=>{
      sync();
      if(saveStatus)saveStatus.textContent='در حال ذخیره خبر...';
    });
    sync();
  });
  $('[data-share-copy]').forEach(button=>{
    button.addEventListener('click',async()=>{
      const area=button.closest('.rb-share-copy')?.querySelector('[data-share-copy-text]');
      if(!area)return;
      try{await navigator.clipboard.writeText(area.value);button.textContent='کپی شد ✓';}
      catch{area.focus();area.select();button.textContent='متن انتخاب شد؛ کپی کنید';}
    });
  });
  $('[data-copy-value]').forEach(button=>{
    button.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(button.dataset.copyValue||'');button.textContent='کپی شد ✓';}
      catch{button.textContent='کپی در دسترس نیست';}
    });
  });
  $('[data-share-kit-story]').forEach(root=>{
    const preview=$('[data-share-kit-story-preview]',root);
    const shareButton=$('[data-share-kit-story-share]',root);
    const downloadButton=$('[data-share-kit-story-download]',root);
    if(!preview||!shareButton||!downloadButton)return;
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const title=root.dataset.storyTitle||'نبض ساردو';
    const lead=root.dataset.storyLead||'';
    const category=root.dataset.storyCategory||'خبر';
    const locationName=root.dataset.storyLocation||'جنوب کرمان';
    const storyUrl=root.dataset.storyUrl||location.href;
    const wrap=(value,font,maxWidth,maxLines)=>{
      ctx.direction='rtl';ctx.textAlign='right';ctx.font=font;const words=String(value||'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';
      for(const word of words){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word;if(lines.length>=maxLines)break;}else line=next;}
      if(line&&lines.length<maxLines)lines.push(line);
      if(words.length&&lines.length===maxLines&&ctx.measureText(lines[lines.length-1]+'…').width>maxWidth){while(lines[lines.length-1].length>2&&ctx.measureText(lines[lines.length-1]+'…').width>maxWidth)lines[lines.length-1]=lines[lines.length-1].slice(0,-1);lines[lines.length-1]+='…';}
      return lines;
    };
    const rounded=(x,y,w,h,r)=>{ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();};
    const draw=async()=>{
      await document.fonts.ready;
      const bg=ctx.createLinearGradient(0,0,1080,1920);bg.addColorStop(0,'#0b0d14');bg.addColorStop(.62,'#171a23');bg.addColorStop(1,'#08090e');ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);
      ctx.fillStyle='#e11b22';ctx.fillRect(72,72,92,92);ctx.fillStyle='#fff';ctx.font='900 64px Vazirmatn, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('N',118,118);
      ctx.textAlign='right';ctx.textBaseline='alphabetic';ctx.fillStyle='#fff';ctx.font='900 43px Estedad, Vazirmatn, sans-serif';ctx.fillText('نبض ساردو',1005,128);
      ctx.fillStyle='#aaa59e';ctx.font='18px Georgia, serif';ctx.textAlign='left';ctx.fillText('NABZ SARDO / SOUTH KERMAN',170,120);
      ctx.fillStyle='#e11b22';ctx.fillRect(72,205,936,3);
      ctx.fillStyle='#ff5b60';ctx.textAlign='right';ctx.font='700 26px Estedad, Vazirmatn, sans-serif';ctx.fillText(category+'  /  '+locationName,1008,280);
      const imageSrc=root.dataset.storyImage||'';
      if(imageSrc){
        const image=await new Promise(resolve=>{const im=new Image();if(/^https?:\/\//i.test(imageSrc)&&!imageSrc.startsWith(location.origin))im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=imageSrc;});
        ctx.fillStyle='#252a33';rounded(72,330,936,600,28);ctx.fill();
        if(image){ctx.save();rounded(72,330,936,600,28);ctx.clip();const scale=Math.max(936/image.naturalWidth,600/image.naturalHeight);const w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,72+(936-w)/2,330+(600-h)/2,w,h);ctx.restore();}
      }else{
        const art=ctx.createLinearGradient(72,330,1008,930);art.addColorStop(0,'#262b35');art.addColorStop(1,'#10131a');ctx.fillStyle=art;rounded(72,330,936,600,28);ctx.fill();ctx.fillStyle='#e11b22';ctx.fillRect(120,430,12,400);ctx.fillStyle='#f2ede6';ctx.font='900 130px Georgia, serif';ctx.textAlign='left';ctx.fillText('NS',180,720);
      }
      ctx.fillStyle='#e11b22';ctx.fillRect(72,990,86,5);
      ctx.direction='rtl';ctx.textAlign='right';ctx.fillStyle='#f7f3ed';const titleLines=wrap(title,'900 58px Estedad, Vazirmatn, sans-serif',920,4);ctx.font='900 58px Estedad, Vazirmatn, sans-serif';let y=1090;for(const line of titleLines){ctx.fillText(line,1008,y);y+=92;}
      const leadLines=wrap(lead,'400 32px Vazirmatn, sans-serif',900,4);ctx.font='400 32px Vazirmatn, sans-serif';ctx.fillStyle='#c6c0b8';y+=18;for(const line of leadLines){ctx.fillText(line,1008,y);y+=58;}
      ctx.fillStyle='#e11b22';ctx.fillRect(72,1630,936,2);
      ctx.textAlign='right';ctx.fillStyle='#f2ede6';ctx.font='700 24px Vazirmatn, sans-serif';ctx.fillText('خبر را دقیق بخوان؛ روایت را دنبال کن.',1008,1700);
      ctx.direction='ltr';ctx.textAlign='left';ctx.fillStyle='#aaa59e';ctx.font='20px Arial, sans-serif';ctx.fillText(storyUrl.slice(0,70),72,1790);
      ctx.fillStyle='#e11b22';ctx.fillRect(72,1840,936,8);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob)throw new Error('ساخت تصویر PNG ممکن نشد');
      const objectUrl=URL.createObjectURL(blob);
      preview.innerHTML='';const imagePreview=document.createElement('img');imagePreview.src=objectUrl;imagePreview.alt='پیش‌نمایش استوری نبض ساردو';preview.appendChild(imagePreview);
      downloadButton.disabled=false;shareButton.disabled=false;
      downloadButton.onclick=()=>{const a=document.createElement('a');a.href=objectUrl;a.download='nabz-sardo-story.png';a.click();};
      shareButton.onclick=async()=>{const file=new File([blob],'nabz-sardo-story.png',{type:'image/png'});if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:title});return;}catch{}}downloadButton.click();};
    };
    draw().catch(error=>{preview.textContent='ساخت استوری ناموفق بود: '+error.message;});
  });
  $('[data-search-toggle]').forEach(button=>{
    button.addEventListener('click',()=>{
      const form=button.closest('.rb-search'),input=form&&form.querySelector('input[name="q"]');
      if(!form||!input)return;
      const mobile=window.matchMedia('(max-width:760px)').matches;
      if(mobile&&!form.classList.contains('is-open')){
        form.classList.add('is-open');input.focus();return;
      }
      if(!input.value.trim()){input.focus();return;}
      if(form.requestSubmit)form.requestSubmit();else form.submit();
    });
  });

})();
