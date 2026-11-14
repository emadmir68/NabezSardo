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

  const articleRoot=$('[data-article-root]');
  if(articleRoot){
    const articleTitle=articleRoot.dataset.articleTitle||document.title;
    const articleLead=String(articleRoot.dataset.articleLead||'').replace(/\\s+/g,' ').trim();
    const articleUrl=new URL(articleRoot.dataset.articleUrl||location.href,location.origin).href;
    const articleImage=articleRoot.dataset.articleImage?new URL(articleRoot.dataset.articleImage,location.origin).href:'';
    const articleVideo=articleRoot.dataset.articleVideo?new URL(articleRoot.dataset.articleVideo,location.origin).href:'';
    const shareMessage=[articleTitle,articleLead,articleUrl].filter(Boolean).join('\\n\\n');
    if(location.pathname.startsWith('/news/')&&history.replaceState){
      try{const shortPath=new URL(articleUrl,location.origin);history.replaceState(history.state,'',shortPath.pathname+shortPath.search+location.hash);}catch{}
    }
    const copyText=async(value)=>{
      try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);return true;}}catch{}
      try{const area=document.createElement('textarea');area.value=value;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();return ok;}catch{return false;}
    };
    $('[data-article-copy-message]',articleRoot).forEach(button=>{
      button.addEventListener('click',async()=>{
        const ok=await copyText(shareMessage);
        button.textContent=ok?'متن آماده کپی شد ✓':'کپی متن در دسترس نیست';
      });
    });
    $('[data-article-share-image]',articleRoot).forEach(button=>{
      button.addEventListener('click',async()=>{
        let shared=false;
        if(articleImage&&navigator.share&&navigator.canShare){
          try{
            const response=await fetch(articleImage,{credentials:'same-origin'});
            if(!response.ok)throw new Error('image unavailable');
            const blob=await response.blob();
            const ext=/png/i.test(blob.type)?'png':/webp/i.test(blob.type)?'webp':'jpg';
            const file=new File([blob],'nabz-sardo-story.'+ext,{type:blob.type||'image/jpeg'});
            if(navigator.canShare({files:[file]})){await navigator.share({title:articleTitle,text:shareMessage,url:articleUrl,files:[file]});shared=true;}
          }catch{}
        }
        if(!shared){
          const ok=await copyText(shareMessage);
          button.textContent=ok?'پیوند و متن کپی شد ✓':'اشتراک تصویر در دسترس نیست';
        }
      });
    });
    $('[data-article-share-video]',articleRoot).forEach(button=>{
      button.addEventListener('click',async()=>{
        if(navigator.share){try{await navigator.share({title:articleTitle,text:shareMessage,url:articleVideo||articleUrl});return;}catch{}}
        const ok=await copyText(articleVideo||shareMessage);
        button.textContent=ok?'پیوند ویدئو کپی شد ✓':'اشتراک ویدئو در دسترس نیست';
      });
    });
    const progress=$('[data-article-progress] i',articleRoot);
    if(progress){
      const update=()=>{
        const rect=articleRoot.getBoundingClientRect();
        const total=Math.max(1,rect.height-window.innerHeight*.72);
        const done=Math.max(0,Math.min(1,(window.innerHeight*.18-rect.top)/total));
        progress.style.width=(done*100).toFixed(2)+'%';
      };
      update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update,{passive:true});
    }
  }

  $('[data-admin-filter]').forEach(input=>{
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
  $$('[data-search-toggle]').forEach(button=>{
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
