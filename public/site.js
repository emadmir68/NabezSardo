document.addEventListener('DOMContentLoaded',()=>{
  const root=document.documentElement;
  const liveViewsEl=document.querySelector('[data-live-views]');
  let liveViewsValue=null,liveViewsAnim=null;
  const formatLiveViews=value=>new Intl.NumberFormat(root.dataset.lang==='en'?'en-US':'fa-IR').format(Number(value||0));
  const paintLiveViews=(value,bump=false)=>{
    if(!liveViewsEl)return;
    liveViewsValue=Math.max(0,Math.floor(Number(value||0)));
    liveViewsEl.textContent=formatLiveViews(liveViewsValue);
    if(bump){
      liveViewsEl.classList.remove('count-bump');
      void liveViewsEl.offsetWidth;
      liveViewsEl.classList.add('count-bump');
      setTimeout(()=>liveViewsEl.classList.remove('count-bump'),260);
    }
  };
  const animateLiveViews=target=>{
    if(!liveViewsEl)return;
    target=Math.max(0,Math.floor(Number(target||0)));
    if(liveViewsAnim){clearTimeout(liveViewsAnim);liveViewsAnim=null;}
    if(liveViewsValue===null||target<=liveViewsValue){paintLiveViews(target,false);return;}
    const diff=target-liveViewsValue;
    const delay=Math.max(28,Math.min(140,Math.floor(900/Math.max(1,diff))));
    const step=()=>{
      if(liveViewsValue>=target){liveViewsAnim=null;return;}
      paintLiveViews(liveViewsValue+1,true);
      liveViewsAnim=setTimeout(step,delay);
    };
    step();
  };
  const refreshLiveViews=async()=>{
    if(!liveViewsEl||document.visibilityState==='hidden')return;
    try{
      const res=await fetch('/api/live-stats?_='+Date.now(),{cache:'no-store',credentials:'same-origin',headers:{'Cache-Control':'no-cache'}});
      if(!res.ok)return;
      const data=await res.json();
      if(Number.isFinite(Number(data?.totalPageViews)))animateLiveViews(Number(data.totalPageViews));
    }catch{}
  };
  if(liveViewsEl){
    refreshLiveViews();
    setInterval(refreshLiveViews,4000);
    new MutationObserver(()=>{if(liveViewsValue!==null)paintLiveViews(liveViewsValue,false)}).observe(root,{attributes:true,attributeFilter:['data-lang']});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshLiveViews();});
  }
  // Automatic page reloads are intentionally disabled. Deploys must never refresh readers' pages.
  const themeKey='nabez-theme';
  const savedTheme=localStorage.getItem(themeKey)||'gold';
  root.dataset.theme=savedTheme;
  const syncThemeButtons=()=>document.querySelectorAll('[data-theme-option]').forEach(btn=>btn.classList.toggle('active',btn.dataset.themeOption===root.dataset.theme));
  syncThemeButtons();
  document.querySelectorAll('[data-theme-option]').forEach(btn=>btn.addEventListener('click',()=>{
    const theme=btn.dataset.themeOption||'gold';
    root.dataset.theme=theme;
    localStorage.setItem(themeKey,theme);
    syncThemeButtons();
  }));

  const langKey='nabez-lang';
  const setLang=(lang)=>{
    const l=lang==='en'?'en':'fa';
    root.dataset.lang=l;
    root.lang=l==='en'?'en':'fa-IR';
    root.dir=l==='en'?'ltr':'rtl';
    localStorage.setItem(langKey,l);
    document.querySelectorAll('[data-lang-option]').forEach(btn=>btn.classList.toggle('active',btn.dataset.langOption===l));
    document.querySelectorAll('[data-placeholder-fa]').forEach(el=>{
      el.placeholder=l==='en'?(el.dataset.placeholderEn||el.dataset.placeholderFa):(el.dataset.placeholderFa||'');
    });
    updateDateTime();
  };
  const formatJalali=(date,withTime=false)=>{
    const lang=root.dataset.lang==='en'?'en-US-u-ca-persian':'fa-IR-u-ca-persian';
    const opt=withTime
      ? {year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tehran'}
      : {year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'};
    try{return new Intl.DateTimeFormat(lang,opt).format(date)}catch{return ''}
  };
  const updateDateTime=()=>{
    const now=new Date();
    const clockLocale=root.dataset.lang==='en'?'en-GB':'fa-IR';
    document.querySelectorAll('[data-live-clock]').forEach(el=>el.textContent=new Intl.DateTimeFormat(clockLocale,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Tehran'}).format(now));
    document.querySelectorAll('[data-jalali-date]').forEach(el=>el.textContent=formatJalali(now,false));
    document.querySelectorAll('[data-news-date]').forEach(el=>{
      const d=new Date(el.dataset.newsDate);
      if(!isNaN(d))el.textContent=formatJalali(d,true);
    });
  };
  const savedLang=localStorage.getItem(langKey)||'fa';
  document.querySelectorAll('[data-lang-option]').forEach(btn=>btn.addEventListener('click',()=>setLang(btn.dataset.langOption)));
  setLang(savedLang);
  updateDateTime();
  setInterval(updateDateTime,1000);

  // Premium article reading tools: progress, native share and copy link.
  const articleRoot=document.querySelector('[data-article-root]');
  const articleProgress=document.querySelector('[data-article-progress] i');
  if(articleRoot&&articleProgress){
    let articleProgressTick=false;
    const syncArticleProgress=()=>{
      articleProgressTick=false;
      const rect=articleRoot.getBoundingClientRect();
      const total=Math.max(1,rect.height-innerHeight*.72);
      const done=Math.max(0,Math.min(1,(innerHeight*.18-rect.top)/total));
      articleProgress.style.width=(done*100).toFixed(2)+'%';
    };
    syncArticleProgress();
    addEventListener('scroll',()=>{
      if(articleProgressTick)return;
      articleProgressTick=true;
      requestAnimationFrame(syncArticleProgress);
    },{passive:true});
    addEventListener('resize',syncArticleProgress,{passive:true});

    const shareBtn=articleRoot.querySelector('[data-article-share]');
    const shareImageBtn=articleRoot.querySelector('[data-article-share-image]');
    const shareVideoBtn=articleRoot.querySelector('[data-article-share-video]');
    const copyBtn=articleRoot.querySelector('[data-article-copy]');
    const copyMessageBtn=articleRoot.querySelector('[data-article-copy-message]');
    const title=articleRoot.dataset.articleTitle||document.title;
    const lead=(articleRoot.dataset.articleLead||'').replace(/\s+/g,' ').trim();
    const shortLead=lead.length>150?lead.slice(0,147).replace(/[\s،,:؛.!؟-]+$/,'')+'…':lead;
    const shareUrl=new URL(articleRoot.dataset.articleUrl||location.pathname,location.origin).href;
    const shareImageUrl=articleRoot.dataset.articleImage?new URL(articleRoot.dataset.articleImage,location.origin).href:'';
    const shareImageKind=articleRoot.dataset.articleImageKind||(/^.*auto-cover/i.test(articleRoot.dataset.articleImage||'')?'auto':shareImageUrl?'real':'none');
    const shareVideoUrl=articleRoot.dataset.articleVideo?new URL(articleRoot.dataset.articleVideo,location.origin).href:'';
    const shareVideoType=articleRoot.dataset.articleVideoType||'video/mp4';
    const articleCategoryId=articleRoot.dataset.articleCategoryId||'';
    const isDemand=articleCategoryId==='opinion';

    // Keep the readable SEO URL as canonical, but show visitors a compact permanent URL
    // in the browser so manual copy/paste can never expose the encoded Persian slug.
    if(location.pathname.startsWith('/news/')&&history.replaceState){
      try{
        const shortPath=new URL(shareUrl,location.origin);
        history.replaceState(history.state,'',shortPath.pathname+shortPath.search+location.hash);
      }catch{}
    }

    const shareText=()=>{
      const lines=[(isDemand?'📣 ':'📰 ')+title];
      if(shortLead)lines.push((isDemand?'خلاصه مطالبه':'خلاصه خبر')+'\n'+shortLead);
      lines.push((isDemand?'متن کامل مطالبه در نبض ساردو 👇':'ادامه خبر در نبض ساردو 👇'),shareUrl);
      return lines.join('\n\n');
    };
    const copyArticleLink=async()=>{
      try{
        if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(shareUrl);
        else{
          const ta=document.createElement('textarea');ta.value=shareUrl;ta.style.position='fixed';ta.style.opacity='0';
          document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
        }
        if(copyBtn){
          copyBtn.classList.add('is-copied');
          const label=copyBtn.querySelector('[data-copy-label]');
          if(label)label.textContent=root.dataset.lang==='en'?'Copied':'لینک کوتاه کپی شد';
          setTimeout(()=>{
            copyBtn.classList.remove('is-copied');
            const label2=copyBtn.querySelector('[data-copy-label]');
            if(label2)label2.innerHTML='<span class="lang-fa">کپی لینک کوتاه</span><span class="lang-en">Copy short link</span>';
          },1700);
        }
      }catch(err){console.warn('article copy failed',err);}
    };
    if(copyBtn){
      const label=copyBtn.querySelector('[data-copy-label]');
      if(label)label.innerHTML='<span class="lang-fa">کپی لینک کوتاه</span><span class="lang-en">Copy short link</span>';
      copyBtn.addEventListener('click',copyArticleLink);
    }
    const copySharePayload=async()=>{
      const value=shareText();
      try{
        if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(value);
        else{
          const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.opacity='0';
          document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
        }
        return true;
      }catch(err){console.warn('article share copy failed',err);return false;}
    };
    if(copyMessageBtn)copyMessageBtn.addEventListener('click',async()=>{
      const ok=await copySharePayload();
      if(ok){
        copyMessageBtn.classList.add('is-copied');
        const label=copyMessageBtn.querySelector('[data-copy-message-label]');
        if(label)label.textContent=root.dataset.lang==='en'?'Ready message copied':'متن آماده کپی شد';
        setTimeout(()=>{
          copyMessageBtn.classList.remove('is-copied');
          const label2=copyMessageBtn.querySelector('[data-copy-message-label]');
          if(label2)label2.innerHTML='<span class="lang-fa">کپی متن آماده</span><span class="lang-en">Copy ready message</span>';
        },1700);
      }
    });

    const fetchShareImageFile=async()=>{
      if(!shareImageUrl||shareImageKind!=='real')return null;
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      try{
        const res=await fetch(shareImageUrl,{credentials:'same-origin',cache:'force-cache',signal:controller.signal});
        if(!res.ok)throw new Error('share image fetch '+res.status);
        const source=await res.blob();
        if(!/^image\//i.test(source.type||''))throw new Error('share image is not an image');
        const type=/^image\/(jpeg|png|webp)$/i.test(source.type)?source.type:'image/jpeg';
        const ext=type.includes('png')?'png':type.includes('webp')?'webp':'jpg';
        return new File([source],'nabez-sardo-news.'+ext,{type,lastModified:Date.now()});
      }finally{
        clearTimeout(timer);
      }
    };

    const fetchShareVideoFile=async()=>{
      if(!shareVideoUrl)return null;
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),45000);
      try{
        const res=await fetch(shareVideoUrl,{credentials:'same-origin',cache:'force-cache',signal:controller.signal});
        if(!res.ok)throw new Error('share video fetch '+res.status);
        const source=await res.blob();
        const type=/^video\//i.test(source.type||'')?source.type:shareVideoType;
        if(!/^video\//i.test(type||''))throw new Error('share video is not a video');
        const ext=/webm/i.test(type)?'webm':/(quicktime|mov)/i.test(type)?'mov':'mp4';
        return new File([source],'nabez-sardo-news.'+ext,{type,lastModified:Date.now()});
      }finally{
        clearTimeout(timer);
      }
    };

    const renderBrandedShareCard=async(sourceFile)=>{
      let bitmap=null;
      try{
        if(sourceFile&&typeof createImageBitmap==='function')bitmap=await createImageBitmap(sourceFile);
        if(document.fonts&&document.fonts.ready){
          await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,900))]);
        }

        const W=1080,H=1350;
        const canvas=document.createElement('canvas');
        canvas.width=W;canvas.height=H;
        const ctx=canvas.getContext('2d');
        if(!ctx)return sourceFile||null;

        const roundRect=(x,y,w,h,r)=>{
          const rr=Math.min(r,w/2,h/2);
          ctx.beginPath();ctx.moveTo(x+rr,y);
          ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);
          ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
        };
        const wrap=(value,maxWidth,maxLines)=>{
          const words=String(value||'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
          const lines=[];let line='';let used=0;
          for(const word of words){
            const next=line?line+' '+word:word;
            if(ctx.measureText(next).width<=maxWidth){line=next;used++;continue;}
            if(line)lines.push(line);
            line=word;used++;
            if(lines.length>=maxLines-1)break;
          }
          if(line&&lines.length<maxLines)lines.push(line);
          if(used<words.length&&lines.length){
            let last=lines[lines.length-1];
            while(last&&ctx.measureText(last+'…').width>maxWidth)last=last.slice(0,-1).trim();
            lines[lines.length-1]=last+'…';
          }
          return lines.slice(0,maxLines);
        };

        // Real editorial photo: full-bleed. Automatic/no-photo: clean branded fallback.
        if(bitmap&&shareImageKind==='real'){
          ctx.fillStyle='#0b0d12';ctx.fillRect(0,0,W,H);
          const scale=Math.max(W/bitmap.width,H/bitmap.height);
          const sw=W/scale,sh=H/scale;
          const sx=Math.max(0,(bitmap.width-sw)/2),sy=Math.max(0,(bitmap.height-sh)/2);
          ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,W,H);
          const shade=ctx.createLinearGradient(0,430,0,H);
          shade.addColorStop(0,'rgba(7,9,14,0)');
          shade.addColorStop(.55,'rgba(7,9,14,.10)');
          shade.addColorStop(.76,'rgba(7,9,14,.72)');
          shade.addColorStop(1,'rgba(7,9,14,.97)');
          ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
        }else{
          // No real editorial photo: use a premium card derived from the site's
          // dark burgundy + warm-gold visual language. Keep it intentionally
          // editorial and minimal; no generic icons or unrelated illustrations.
          const bg=ctx.createLinearGradient(0,0,W,H);
          bg.addColorStop(0,'#090b0f');
          bg.addColorStop(.50,'#0d1015');
          bg.addColorStop(1,'#07090c');
          ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

          // Burgundy hero glow, matching the site's brand/logo treatment.
          const wine=ctx.createRadialGradient(870,235,30,870,235,720);
          wine.addColorStop(0,'rgba(157,36,73,.42)');
          wine.addColorStop(.43,'rgba(90,13,37,.20)');
          wine.addColorStop(1,'rgba(90,13,37,0)');
          ctx.fillStyle=wine;ctx.fillRect(0,0,W,H);

          // Restrained warm-gold light from the opposite corner.
          const gold=ctx.createRadialGradient(120,1120,20,120,1120,560);
          gold.addColorStop(0,'rgba(224,182,109,.15)');
          gold.addColorStop(1,'rgba(224,182,109,0)');
          ctx.fillStyle=gold;ctx.fillRect(0,0,W,H);

          // Subtle editorial geometry inspired by the site's hero/orbit motif.
          ctx.save();
          ctx.strokeStyle='rgba(224,182,109,.13)';ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(830,270,250,0,Math.PI*2);ctx.stroke();
          ctx.strokeStyle='rgba(224,182,109,.07)';ctx.lineWidth=1;
          ctx.beginPath();ctx.ellipse(830,270,310,160,-.30,0,Math.PI*2);ctx.stroke();
          ctx.restore();

          // Glass newsroom panel.
          ctx.fillStyle='rgba(15,18,24,.72)';
          roundRect(54,410,972,690,34);ctx.fill();
          ctx.strokeStyle='rgba(224,182,109,.18)';ctx.lineWidth=1.5;
          roundRect(54,410,972,690,34);ctx.stroke();

          // Site-colored top rail: burgundy body with a fine gold highlight.
          const rail=ctx.createLinearGradient(90,0,990,0);
          rail.addColorStop(0,'rgba(90,13,37,.08)');
          rail.addColorStop(.48,'rgba(157,36,73,.88)');
          rail.addColorStop(1,'rgba(224,182,109,.42)');
          ctx.fillStyle=rail;roundRect(92,446,896,5,3);ctx.fill();

          // Small newsroom eyebrow and a very quiet wordmark watermark.
          ctx.direction='ltr';ctx.textAlign='left';ctx.textBaseline='alphabetic';
          ctx.fillStyle='rgba(208,166,95,.92)';
          ctx.font='700 23px Arial, sans-serif';
          ctx.fillText('NABEZ SARDO / NEWS REPORT',92,505);
          ctx.fillStyle='rgba(255,255,255,.025)';
          ctx.font='900 118px Arial, sans-serif';
          ctx.fillText('NABEZ',88,1040);

          // Small lower brand tile echoing the site's burgundy logo card.
          const tile=ctx.createLinearGradient(145,1095,250,1205);
          tile.addColorStop(0,'#9d2449');
          tile.addColorStop(.58,'#5a0d25');
          tile.addColorStop(1,'#18080e');
          ctx.fillStyle=tile;roundRect(88,1116,118,118,30);ctx.fill();
          ctx.strokeStyle='rgba(224,182,109,.48)';ctx.lineWidth=1.5;
          roundRect(88,1116,118,118,30);ctx.stroke();
          ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillStyle='#f1ce84';ctx.font='900 48px Tahoma, Arial, sans-serif';
          ctx.fillText('ن',147,1177);
        }

        // Compact newsroom brand pill.
        ctx.fillStyle='rgba(9,11,16,.78)';
        roundRect(686,54,322,78,24);ctx.fill();
        ctx.beginPath();ctx.arc(968,93,9,0,Math.PI*2);ctx.fillStyle='#f5a623';ctx.fill();
        ctx.direction='rtl';ctx.textAlign='right';ctx.textBaseline='middle';
        ctx.fillStyle='#fff';ctx.font='700 32px Tahoma, Arial, sans-serif';
        ctx.fillText('نبض ساردو',940,95);

        // Two-line headline only.
        ctx.direction='rtl';ctx.textAlign='right';ctx.textBaseline='alphabetic';
        ctx.fillStyle='#fff';ctx.font='700 58px Tahoma, Arial, sans-serif';
        const titleLines=wrap(title,920,2);
        const titleStart=bitmap&&shareImageKind==='real'?1010:610;
        let y=titleStart;
        for(const line of titleLines){ctx.fillText(line,990,y);y+=78;}

        // One-line lead only.
        if(shortLead){
          y+=14;
          ctx.fillStyle='rgba(255,255,255,.84)';
          ctx.font='400 31px Tahoma, Arial, sans-serif';
          const leadLine=wrap(shortLead,920,1)[0];
          if(leadLine)ctx.fillText(leadLine,990,y);
        }

        // Fixed footer signature.
        ctx.fillStyle='#f5a623';roundRect(72,1256,936,3,2);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.92)';
        ctx.font='500 27px Tahoma, Arial, sans-serif';
        ctx.direction='ltr';ctx.textAlign='left';ctx.fillText('nabzesardo.ir',72,1310);
        ctx.direction='rtl';ctx.textAlign='right';ctx.fillText('ادامه خبر در نبض ساردو',1008,1310);

        const blob=await Promise.race([
          new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.91)),
          new Promise(resolve=>setTimeout(()=>resolve(null),1800))
        ]);
        return blob?new File([blob],'nabez-sardo-card.jpg',{type:'image/jpeg',lastModified:Date.now()}):(sourceFile||null);
      }catch(err){
        console.warn('share card render fallback',err);
        return sourceFile||null;
      }finally{
        if(bitmap&&bitmap.close)bitmap.close();
      }
    };

    let preparedShareImageFile=null;
    let shareImageOriginalLabel='';
    if(shareImageBtn){
      const label=shareImageBtn.querySelector('[data-share-image-label]');
      shareImageOriginalLabel=label?label.innerHTML:'';

      // Never disable the button. First prepare the original photo quickly,
      // then upgrade it to the branded card in the background.
      fetchShareImageFile().then(file=>{
        if(file&&(!navigator.canShare||navigator.canShare({files:[file]})))preparedShareImageFile=file;
        return renderBrandedShareCard(file);
      }).then(card=>{
        if(card&&(!navigator.canShare||navigator.canShare({files:[card]})))preparedShareImageFile=card;
      }).catch(err=>console.warn('share image preload failed',err));
    }

    if(shareImageBtn)shareImageBtn.addEventListener('click',()=>{
      const label=shareImageBtn.querySelector('[data-share-image-label]');
      const payload=shareText();

      // Web Share on Android is strict about mixed file/title/text payloads.
      // Keep the native share call directly inside this tap and prefer the
      // smallest compatible payload so the Share Sheet always opens.
      if(preparedShareImageFile&&typeof navigator.share==='function'){
        const fileOnly={files:[preparedShareImageFile]};
        const fileWithText={files:[preparedShareImageFile],text:payload};
        let sharePayload=fileWithText;
        try{
          if(typeof navigator.canShare==='function'){
            if(navigator.canShare(fileWithText)){
              sharePayload=fileWithText;
            }else if(navigator.canShare(fileOnly)){
              // Some Android/WebView builds accept a file but reject file+text.
              // Copy the caption synchronously, then open file sharing.
              const ta=document.createElement('textarea');
              ta.value=payload;ta.style.position='fixed';ta.style.opacity='0';ta.style.pointerEvents='none';
              document.body.appendChild(ta);ta.focus();ta.select();
              try{document.execCommand('copy');}catch{}
              ta.remove();
              sharePayload=fileOnly;
            }else{
              sharePayload={text:payload};
            }
          }
        }catch(err){
          console.warn('article share capability check failed',err);
        }

        if(label)label.textContent=root.dataset.lang==='en'?'Opening share…':'در حال باز کردن اشتراک…';
        try{
          const result=navigator.share(sharePayload);
          Promise.resolve(result)
            .then(()=>{if(label)label.textContent=root.dataset.lang==='en'?'Shared':'ارسال شد';})
            .catch(err=>{
              if(err&&err.name!=='AbortError')console.warn('article image share failed',err);
            })
            .finally(()=>setTimeout(()=>{if(label)label.innerHTML=shareImageOriginalLabel;},1000));
        }catch(err){
          console.warn('article image share sync failure',err);
          if(label)label.innerHTML=shareImageOriginalLabel;
        }
        return;
      }

      // Image is still preparing or file sharing is unavailable: open normal
      // text/link sharing immediately instead of leaving a dead button.
      if(typeof navigator.share==='function'){
        try{
          const result=navigator.share({text:payload});
          Promise.resolve(result).catch(err=>{
            if(err&&err.name!=='AbortError')console.warn('article share fallback failed',err);
          });
        }catch(err){
          console.warn('article share fallback sync failure',err);
          copySharePayload();
        }
      }else{
        copySharePayload();
      }
      if(label)label.textContent=root.dataset.lang==='en'?'Opening share…':'در حال باز کردن اشتراک…';
      setTimeout(()=>{if(label)label.innerHTML=shareImageOriginalLabel;},1000);
    });

    let preparedShareVideoFile=null;
    let shareVideoOriginalLabel='';
    if(shareVideoBtn){
      const label=shareVideoBtn.querySelector('[data-share-video-label]');
      shareVideoOriginalLabel=label?label.innerHTML:'';
      if(label)label.textContent=root.dataset.lang==='en'?'Preparing video…':'در حال آماده‌سازی فیلم…';
      fetchShareVideoFile().then(file=>{
        if(file&&(!navigator.canShare||navigator.canShare({files:[file]}))){
          preparedShareVideoFile=file;
          if(label)label.innerHTML=shareVideoOriginalLabel;
        }else if(label){
          label.textContent=root.dataset.lang==='en'?'Video sharing unavailable':'اشتراک فایل فیلم پشتیبانی نمی‌شود';
        }
      }).catch(err=>{
        console.warn('share video preload failed',err);
        if(label)label.innerHTML=shareVideoOriginalLabel;
      });
    }

    if(shareVideoBtn)shareVideoBtn.addEventListener('click',()=>{
      const label=shareVideoBtn.querySelector('[data-share-video-label]');
      const payload=shareText();
      if(preparedShareVideoFile&&typeof navigator.share==='function'){
        const fileOnly={files:[preparedShareVideoFile]};
        const fileWithText={files:[preparedShareVideoFile],text:payload};
        let sharePayload=fileWithText;
        try{
          if(typeof navigator.canShare==='function'){
            if(navigator.canShare(fileWithText)){
              sharePayload=fileWithText;
            }else if(navigator.canShare(fileOnly)){
              const ta=document.createElement('textarea');
              ta.value=payload;ta.style.position='fixed';ta.style.opacity='0';ta.style.pointerEvents='none';
              document.body.appendChild(ta);ta.focus();ta.select();
              try{document.execCommand('copy');}catch{}
              ta.remove();
              sharePayload=fileOnly;
            }else{
              sharePayload={text:payload};
            }
          }
        }catch(err){
          console.warn('article video share capability check failed',err);
        }

        if(label)label.textContent=root.dataset.lang==='en'?'Opening share…':'در حال باز کردن اشتراک…';
        try{
          const result=navigator.share(sharePayload);
          Promise.resolve(result)
            .then(()=>{if(label)label.textContent=root.dataset.lang==='en'?'Shared':'ارسال شد';})
            .catch(err=>{
              if(err&&err.name!=='AbortError')console.warn('article video share failed',err);
            })
            .finally(()=>setTimeout(()=>{if(label)label.innerHTML=shareVideoOriginalLabel;},1000));
        }catch(err){
          console.warn('article video share sync failure',err);
          if(label)label.innerHTML=shareVideoOriginalLabel;
        }
        return;
      }

      if(typeof navigator.share==='function'){
        try{
          const result=navigator.share({text:payload});
          Promise.resolve(result).catch(err=>{
            if(err&&err.name!=='AbortError')console.warn('article video share fallback failed',err);
          });
        }catch(err){
          console.warn('article video share fallback sync failure',err);
          copySharePayload();
        }
      }else{
        copySharePayload();
      }
      if(label)label.textContent=root.dataset.lang==='en'?'Preparing video…':'در حال آماده‌سازی فیلم…';
      setTimeout(()=>{if(label)label.innerHTML=shareVideoOriginalLabel;},1200);
    });

    if(shareBtn)shareBtn.addEventListener('click',()=>{
      const payload=shareText();
      if(navigator.share){
        navigator.share({title,text:payload}).catch(err=>{
          if(err&&err.name!=='AbortError')console.warn('article share failed',err);
        });
      }else{
        copySharePayload();
      }
    });
  }

  // Compact glass newsroom navigation after the full masthead scrolls away.
  let navScrollTick=false;
  const syncCompactNav=()=>{
    navScrollTick=false;
    root.classList.toggle('nav-condensed',window.scrollY>118);
  };
  syncCompactNav();
  addEventListener('scroll',()=>{
    if(navScrollTick)return;
    navScrollTick=true;
    requestAnimationFrame(syncCompactNav);
  },{passive:true});


  // Reusable long-press story sharing for homepage promotional banners.
  const storyBanner=document.querySelector('[data-home-banner]');
  if(storyBanner){
    const sheet=storyBanner.querySelector('[data-story-sheet]');
    const openSheet=()=>{
      if(!sheet)return;
      sheet.hidden=false;
      document.body.classList.add('story-sheet-open');
      if(navigator.vibrate)navigator.vibrate(25);
    };
    const closeSheet=()=>{
      if(!sheet)return;
      sheet.hidden=true;
      document.body.classList.remove('story-sheet-open');
    };
    storyBanner.querySelectorAll('[data-story-share]').forEach(btn=>btn.addEventListener('click',openSheet));
    storyBanner.querySelectorAll('[data-story-close]').forEach(btn=>btn.addEventListener('click',closeSheet));

    let holdTimer=null,startX=0,startY=0;
    const cancelHold=()=>{if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}};
    storyBanner.addEventListener('pointerdown',ev=>{
      if(ev.target.closest('button,a,input,textarea,select'))return;
      startX=ev.clientX;startY=ev.clientY;
      cancelHold();
      holdTimer=setTimeout(()=>{holdTimer=null;openSheet();},720);
    });
    storyBanner.addEventListener('pointermove',ev=>{
      if(Math.hypot(ev.clientX-startX,ev.clientY-startY)>14)cancelHold();
    });
    ['pointerup','pointercancel','pointerleave'].forEach(name=>storyBanner.addEventListener(name,cancelHold));
    storyBanner.addEventListener('contextmenu',ev=>{if(!ev.target.closest('a,button'))ev.preventDefault();});

    const roundedRect=(ctx,x,y,w,h,r)=>{
      const rr=Math.min(r,w/2,h/2);
      ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
    };
    const wrapLines=(ctx,text,maxWidth)=>{
      const words=String(text||'').split(/\s+/),lines=[];let line='';
      words.forEach(word=>{
        const test=line?line+' '+word:word;
        if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test;
      });
      if(line)lines.push(line);
      return lines;
    };
    const storyFile=()=>{
      const lang=root.dataset.lang==='en'?'en':'fa';
      const pick=(selector,fallback='')=>{
        const node=storyBanner.querySelector(selector+' .lang-'+lang)||storyBanner.querySelector(selector);
        return String(node?.textContent||fallback).trim();
      };
      const title=storyBanner.dataset[lang==='en'?'storyTitleEn':'storyTitleFa']||'Nabez Sardo';
      const lead=pick('.citizen-promo-lead',lang==='en'?'Seen something newsworthy?':'از اتفاقات منطقه خبر داری؟ عکس یا فیلمی گرفتی؟');
      const paragraphs=[...storyBanner.querySelectorAll('.citizen-promo-text .lang-'+lang)].map(x=>x.textContent.trim()).filter(Boolean);
      const note=pick('.citizen-promo-note',lang==='en'?'Be the reporter in your city.':'تو می‌تونی خبرنگار شهر خودت باشی؛ ببین، ثبت کن، بفرست و هدیه بگیر.');
      const cta=pick('.citizen-promo-cta',lang==='en'?'Send your news & get rewarded':'خبرتو بفرست و هدیه بگیر');
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
      const ctx=canvas.getContext('2d');

      const bg=ctx.createLinearGradient(0,0,1080,1920);
      bg.addColorStop(0,'#07101b');bg.addColorStop(.52,'#0d1a2a');bg.addColorStop(1,'#071018');
      ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);

      const glowA=ctx.createRadialGradient(830,260,25,830,260,470);
      glowA.addColorStop(0,'rgba(231,185,94,.28)');glowA.addColorStop(1,'rgba(231,185,94,0)');
      ctx.fillStyle=glowA;ctx.fillRect(350,0,730,760);
      const glowB=ctx.createRadialGradient(180,1250,20,180,1250,420);
      glowB.addColorStop(0,'rgba(129,28,61,.16)');glowB.addColorStop(1,'rgba(129,28,61,0)');
      ctx.fillStyle=glowB;ctx.fillRect(0,820,650,900);

      ctx.strokeStyle='rgba(230,188,105,.28)';ctx.lineWidth=3;
      roundedRect(ctx,64,76,952,1768,58);ctx.stroke();

      // Brand
      ctx.textAlign=lang==='en'?'left':'right';ctx.direction=lang==='en'?'ltr':'rtl';
      ctx.fillStyle='#f0c776';ctx.font='900 35px "Noto Sans Arabic", Tahoma, sans-serif';
      ctx.fillText(lang==='en'?'NABEZ SARDO':'نبض ساردو',lang==='en'?105:975,150);
      ctx.fillStyle='rgba(230,236,245,.65)';ctx.font='600 20px "Noto Sans Arabic", Tahoma, sans-serif';
      ctx.fillText(lang==='en'?'CITIZEN NEWSROOM • SOUTH KERMAN':'خبرنگار مردمی • ساردوئیه و جنوب کرمان',lang==='en'?105:975,190);

      // Visual panel
      const px=100,py=245,pw=880,ph=500;
      const panel=ctx.createLinearGradient(px,py,px+pw,py+ph);
      panel.addColorStop(0,'rgba(255,255,255,.065)');panel.addColorStop(1,'rgba(255,255,255,.018)');
      ctx.fillStyle=panel;roundedRect(ctx,px,py,pw,ph,48);ctx.fill();
      ctx.strokeStyle='rgba(231,188,103,.22)';ctx.lineWidth=3;roundedRect(ctx,px,py,pw,ph,48);ctx.stroke();

      // Phone
      const phoneX=190,phoneY=300,phoneW=245,phoneH=380;
      ctx.fillStyle='#0a0f16';roundedRect(ctx,phoneX,phoneY,phoneW,phoneH,42);ctx.fill();
      ctx.strokeStyle='rgba(236,195,114,.44)';ctx.lineWidth=4;roundedRect(ctx,phoneX,phoneY,phoneW,phoneH,42);ctx.stroke();
      ctx.fillStyle='#030507';roundedRect(ctx,phoneX+78,phoneY+18,90,14,8);ctx.fill();
      const screen=ctx.createLinearGradient(phoneX,phoneY,phoneX+phoneW,phoneY+phoneH);
      screen.addColorStop(0,'#101c2a');screen.addColorStop(1,'#0b121c');
      ctx.fillStyle=screen;roundedRect(ctx,phoneX+18,phoneY+55,phoneW-36,phoneH-95,28);ctx.fill();

      // Upload cloud
      ctx.strokeStyle='#edc271';ctx.lineWidth=10;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.beginPath();
      ctx.moveTo(phoneX+78,phoneY+205);
      ctx.bezierCurveTo(phoneX+48,phoneY+205,phoneX+47,phoneY+160,phoneX+84,phoneY+155);
      ctx.bezierCurveTo(phoneX+101,phoneY+112,phoneX+164,phoneY+111,phoneX+181,phoneY+156);
      ctx.bezierCurveTo(phoneX+216,phoneY+158,phoneX+223,phoneY+205,phoneX+190,phoneY+207);
      ctx.stroke();
      ctx.beginPath();ctx.moveTo(phoneX+135,phoneY+220);ctx.lineTo(phoneX+135,phoneY+165);ctx.moveTo(phoneX+113,phoneY+188);ctx.lineTo(phoneX+135,phoneY+165);ctx.lineTo(phoneX+157,phoneY+188);ctx.stroke();

      // Gift
      const gx=600,gy=415;
      ctx.fillStyle='#e3b359';roundedRect(ctx,gx,gy+70,220,160,22);ctx.fill();
      ctx.fillStyle='#f1cf87';roundedRect(ctx,gx-18,gy+48,256,55,18);ctx.fill();
      ctx.fillStyle='#9d2045';ctx.fillRect(gx+92,gy+48,38,182);
      ctx.strokeStyle='#ad2750';ctx.lineWidth=16;
      ctx.beginPath();ctx.ellipse(gx+88,gy+34,58,38,-.28,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.ellipse(gx+145,gy+34,58,38,.28,0,Math.PI*2);ctx.stroke();

      // Reward chip
      ctx.fillStyle='rgba(7,12,19,.86)';roundedRect(ctx,560,665,335,80,24);ctx.fill();
      ctx.strokeStyle='rgba(232,190,109,.28)';ctx.lineWidth=2;roundedRect(ctx,560,665,335,80,24);ctx.stroke();
      ctx.textAlign='center';ctx.direction=lang==='en'?'ltr':'rtl';ctx.fillStyle='#efc477';
      ctx.font='900 25px "Noto Sans Arabic", Tahoma, sans-serif';
      ctx.fillText(lang==='en'?'CASH REWARD':'هدیه نقدی',728,697);
      ctx.fillStyle='rgba(220,227,236,.64)';ctx.font='600 16px "Noto Sans Arabic", Tahoma, sans-serif';
      ctx.fillText(lang==='en'?'After approval & publication':'پس از تأیید و انتشار',728,723);

      // Headline
      ctx.textAlign=lang==='en'?'left':'right';ctx.direction=lang==='en'?'ltr':'rtl';
      ctx.fillStyle='#fff5e4';ctx.font='900 68px "Noto Sans Arabic", Tahoma, sans-serif';
      const titleLines=wrapLines(ctx,title,860);
      let ty=870;titleLines.slice(0,3).forEach(line=>{ctx.fillText(line,lang==='en'?110:970,ty);ty+=90;});

      ctx.fillStyle='#e8edf4';ctx.font='800 31px "Noto Sans Arabic", Tahoma, sans-serif';
      const leadLines=wrapLines(ctx,lead,850);
      let ly=ty+12;leadLines.slice(0,2).forEach(line=>{ctx.fillText(line,lang==='en'?110:970,ly);ly+=52;});

      // Main copy
      ctx.fillStyle='rgba(213,220,230,.84)';ctx.font='600 27px "Noto Sans Arabic", Tahoma, sans-serif';
      let cy=ly+22;
      const copy=(paragraphs.length?paragraphs:[storyBanner.dataset[lang==='en'?'storyTextEn':'storyTextFa']||'']).join(' ');
      const copyLines=wrapLines(ctx,copy,850);
      copyLines.slice(0,7).forEach(line=>{ctx.fillText(line,lang==='en'?110:970,cy);cy+=46;});

      // Note box
      const noteY=Math.max(cy+18,1400);
      ctx.fillStyle='rgba(230,184,96,.065)';roundedRect(ctx,104,noteY,872,112,26);ctx.fill();
      ctx.strokeStyle='rgba(230,184,96,.20)';ctx.lineWidth=2;roundedRect(ctx,104,noteY,872,112,26);ctx.stroke();
      ctx.fillStyle='#edc273';ctx.font='800 24px "Noto Sans Arabic", Tahoma, sans-serif';
      const noteLines=wrapLines(ctx,note,810);
      let ny=noteY+42;noteLines.slice(0,2).forEach(line=>{ctx.fillText(line,lang==='en'?135:945,ny);ny+=38;});

      // CTA
      const ctaY=noteY+145;
      const ctaGrad=ctx.createLinearGradient(170,ctaY,910,ctaY);
      ctaGrad.addColorStop(0,'#d7a84f');ctaGrad.addColorStop(1,'#f0cd84');
      ctx.fillStyle=ctaGrad;roundedRect(ctx,170,ctaY,740,92,28);ctx.fill();
      ctx.textAlign='center';ctx.direction=lang==='en'?'ltr':'rtl';ctx.fillStyle='#10151c';
      ctx.font='900 29px "Noto Sans Arabic", Tahoma, sans-serif';ctx.fillText(cta,540,ctaY+57);

      ctx.textAlign='center';ctx.direction='ltr';ctx.fillStyle='rgba(232,238,247,.55)';ctx.font='700 21px Arial, sans-serif';
      ctx.fillText('NABZESARDO.IR',540,1773);
      ctx.fillStyle='rgba(225,177,86,.86)';ctx.fillRect(370,1810,340,3);

      const dataUrl=canvas.toDataURL('image/png');
      const parts=dataUrl.split(','),mime='image/png',bin=atob(parts[1]);const bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      return new File([bytes],'nabez-sardo-citizen-reward-story.png',{type:mime});
    };

    const nativeShare=storyBanner.querySelector('[data-story-native]');
    if(nativeShare)nativeShare.addEventListener('click',async()=>{
      const file=storyFile();
      try{
        if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
          await navigator.share({files:[file],title:'Nabez Sardo',text:root.dataset.lang==='en'?'Send local news to Nabez Sardo':'خبر داری؟ برای نبض ساردو بفرست و هدیه بگیر'});
          closeSheet();
        }else{
          const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
        }
      }catch(err){if(err&&err.name!=='AbortError')console.warn('story share failed',err);}
    });
    const downloadBtn=storyBanner.querySelector('[data-story-download]');
    if(downloadBtn)downloadBtn.addEventListener('click',()=>{
      const file=storyFile(),url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
    });
  }


  // Use one identical Story/Instagram pipeline for every standard news card.
  // Category/local/search pages render the same data-story-card markup, so
  // "یادداشت و مطالبه" must be wired exactly like Latest and Archive cards.
  const newsStoryCards=[...document.querySelectorAll('[data-story-card]')];
  if(newsStoryCards.length){
    const storySheet=document.createElement('div');
    storySheet.className='story-share-sheet news-story-sheet';
    storySheet.hidden=true;
    storySheet.innerHTML=`
      <button class="story-sheet-backdrop" type="button" data-news-story-close aria-label="بستن"></button>
      <div class="story-sheet-card" role="dialog" aria-modal="true" aria-label="اشتراک خبر در استوری">
        <span class="story-sheet-handle"></span>
        <h3><span class="lang-fa">استوری این خبر</span><span class="lang-en">Story this news</span></h3>
        <p data-news-story-status><span class="lang-fa">در حال آماده‌سازی تصویر استوری…</span><span class="lang-en">Preparing story image…</span></p>
        <div class="news-story-preview" data-news-story-preview></div>
        <button class="btn primary" type="button" data-news-story-native disabled><span class="lang-fa">اشتراک در استوری / اینستاگرام</span><span class="lang-en">Share to Story / Instagram</span></button>
        <button class="btn ghost" type="button" data-news-reel-card disabled><span class="lang-fa">Reels متحرک اینستاگرام</span><span class="lang-en">Animated Instagram Reels</span></button>
        <button class="btn ghost" type="button" data-news-story-download disabled><span class="lang-fa">ذخیره تصویر استوری</span><span class="lang-en">Save story image</span></button>
        <button class="story-sheet-cancel" type="button" data-news-story-close><span class="lang-fa">انصراف</span><span class="lang-en">Cancel</span></button>
      </div>`;
    document.body.appendChild(storySheet);

    const storyStatus=storySheet.querySelector('[data-news-story-status]');
    const storyPreview=storySheet.querySelector('[data-news-story-preview]');
    const shareBtn=storySheet.querySelector('[data-news-story-native]');
    const reelBtn=storySheet.querySelector('[data-news-reel-card]');
    const downloadBtn=storySheet.querySelector('[data-news-story-download]');
    let activeStoryCard=null,preparedStoryFile=null,preparedStoryUrl='',preparedReelUrl='';

    const rr=(ctx,x,y,w,h,r)=>{
      const q=Math.min(r,w/2,h/2);
      ctx.beginPath();ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);ctx.closePath();
    };
    const wrapStoryLines=(ctx,value,maxWidth)=>{
      const words=String(value||'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';
      words.forEach(word=>{
        const test=line?line+' '+word:word;
        if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test;
      });
      if(line)lines.push(line);
      return lines;
    };
    const loadStoryImage=src=>new Promise(resolve=>{
      const value=String(src||'').trim();
      if(!value||/\/assets\/placeholder\.svg(?:\?|$)/i.test(value)){resolve(null);return;}
      const img=new Image();
      img.decoding='async';
      // Prevent a remote image from tainting the Story canvas. If the source
      // does not allow CORS, onerror gives us the branded no-photo fallback.
      if(/^https?:\/\//i.test(value)&&!value.startsWith(location.origin))img.crossOrigin='anonymous';
      img.onload=()=>resolve(img);
      img.onerror=()=>resolve(null);
      img.src=value.startsWith('http')?value:new URL(value,location.origin).href;
    });
    const drawContain=(ctx,img,x,y,w,h)=>{
      ctx.fillStyle='#0d1219';rr(ctx,x,y,w,h,34);ctx.fill();
      if(!img)return;
      const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight);
      const dw=img.naturalWidth*scale,dh=img.naturalHeight*scale,dx=x+(w-dw)/2,dy=y+(h-dh)/2;
      ctx.save();rr(ctx,x,y,w,h,34);ctx.clip();ctx.drawImage(img,dx,dy,dw,dh);ctx.restore();
    };
    const makeNewsStory=async card=>{
      try{if(document.fonts&&document.fonts.ready)await document.fonts.ready}catch{}
      const lang=root.dataset.lang==='en'?'en':'fa';
      const title=card.dataset[lang==='en'?'storyTitleEn':'storyTitleFa']||card.dataset.storyTitleFa||'Nabez Sardo';
      const lead=card.dataset[lang==='en'?'storyLeadEn':'storyLeadFa']||card.dataset.storyLeadFa||'';
      const body=card.dataset[lang==='en'?'storyBodyEn':'storyBodyFa']||card.dataset.storyBodyFa||'';
      const category=card.dataset[lang==='en'?'storyCategoryEn':'storyCategoryFa']||card.dataset.storyCategoryFa||'News';
      const categoryId=card.dataset.storyCategoryId||'';
      const articleUrl=new URL(card.dataset.storyUrl||'/',location.origin).href;
      const img=await loadStoryImage(card.dataset.storyImage||'');
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
      const ctx=canvas.getContext('2d');
      const bg=ctx.createLinearGradient(0,0,1080,1920);
      bg.addColorStop(0,'#070b11');bg.addColorStop(.48,'#111925');bg.addColorStop(1,'#080b10');
      ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);
      const glow=ctx.createRadialGradient(860,250,20,860,250,620);
      glow.addColorStop(0,'rgba(151,34,70,.30)');glow.addColorStop(.48,'rgba(207,166,91,.12)');glow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=glow;ctx.fillRect(0,0,1080,930);

      ctx.strokeStyle='rgba(213,173,100,.25)';ctx.lineWidth=3;rr(ctx,66,72,948,1776,48);ctx.stroke();
      ctx.textAlign=lang==='en'?'left':'right';ctx.direction=lang==='en'?'ltr':'rtl';
      ctx.fillStyle='#f2c978';ctx.font='900 48px Vazirmatn, sans-serif';ctx.fillText(lang==='en'?'NABEZ SARDO':'نبض ساردو',lang==='en'?100:980,150);
      ctx.fillStyle='rgba(232,237,244,.68)';ctx.font='600 22px Vazirmatn, sans-serif';ctx.fillText(lang==='en'?'LOCAL NEWS / SOUTH KERMAN':'رسانه محلی ساردوئیه و جنوب کرمان',lang==='en'?100:980,194);
      ctx.fillStyle='#d7ae63';ctx.fillRect(lang==='en'?100:800,216,180,4);

      drawContain(ctx,img,90,250,900,720);
      ctx.strokeStyle='rgba(213,173,100,.24)';ctx.lineWidth=3;rr(ctx,90,250,900,720,34);ctx.stroke();

      const pillText=category;
      ctx.font='800 24px Vazirmatn, sans-serif';
      const pillW=Math.min(330,Math.max(150,ctx.measureText(pillText).width+70));
      const pillX=lang==='en'?90:990-pillW;
      ctx.fillStyle='rgba(132,29,61,.85)';rr(ctx,pillX,1015,pillW,58,29);ctx.fill();
      ctx.fillStyle='#f0d49a';ctx.textAlign='center';ctx.fillText(pillText,pillX+pillW/2,1053);

      ctx.textAlign=lang==='en'?'left':'right';ctx.direction=lang==='en'?'ltr':'rtl';
      const titleFont=title.length>95?58:title.length>62?64:72;
      ctx.fillStyle='#f7f1e8';ctx.font='900 '+titleFont+'px Vazirmatn, sans-serif';
      const titleLines=wrapStoryLines(ctx,title,880);
      let y=1175;titleLines.slice(0,4).forEach(line=>{ctx.fillText(line,lang==='en'?100:980,y);y+=titleFont*1.38;});

      const ruleY=Math.min(y+10,1510);
      const rule=ctx.createLinearGradient(100,0,980,0);rule.addColorStop(0,'rgba(217,176,99,0)');rule.addColorStop(.15,'#d9b063');rule.addColorStop(.85,'#d9b063');rule.addColorStop(1,'rgba(217,176,99,0)');
      ctx.fillStyle=rule;ctx.fillRect(100,ruleY,880,3);

      ctx.fillStyle='#d8dee7';ctx.font='600 30px Vazirmatn, sans-serif';
      const leadLines=wrapStoryLines(ctx,lead,870);
      let ly=ruleY+60;leadLines.slice(0,3).forEach(line=>{ctx.fillText(line,lang==='en'?105:975,ly);ly+=48;});

      ctx.fillStyle='rgba(226,231,238,.86)';ctx.font='500 25px Vazirmatn, sans-serif';
      const bodyLines=wrapStoryLines(ctx,body,860);
      let by=ly+14;bodyLines.slice(0,5).forEach(line=>{if(by<1710){ctx.fillText(line,lang==='en'?110:970,by);by+=42;}});

      ctx.textAlign='center';ctx.direction='ltr';ctx.fillStyle='rgba(230,235,242,.58)';ctx.font='700 22px Arial, sans-serif';
      ctx.fillText('NABZESARDO.IR',540,1770);
      ctx.fillStyle='#d7ae63';ctx.fillRect(390,1807,300,3);

      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob)throw new Error('story-render-failed');
      return {file:new File([blob],categoryId==='opinion'?'nabez-sardo-demand-story.png':'nabez-sardo-news-story.png',{type:'image/png'}),articleUrl,title,categoryId};
    };

    const loadReelVideo=card=>new Promise(resolve=>{
      const existing=card.querySelector('video');
      const source=existing?.querySelector('source');
      const src=String(source?.src||source?.getAttribute('src')||existing?.currentSrc||existing?.src||'').trim();
      if(!src){resolve(null);return;}
      const video=document.createElement('video');
      video.muted=true;video.playsInline=true;video.preload='auto';
      if(/^https?:\/\//i.test(src)&&!src.startsWith(location.origin))video.crossOrigin='anonymous';
      const timer=setTimeout(()=>{try{video.pause()}catch{}resolve(null);},7000);
      video.onloadeddata=async()=>{
        clearTimeout(timer);
        try{await video.play()}catch{}
        resolve(video);
      };
      video.onerror=()=>{clearTimeout(timer);resolve(null);};
      video.src=src.startsWith('http')?src:new URL(src,location.origin).href;
      video.load();
    });

    const makeAnimatedReel=async(card,storyFile)=>{
      try{if(document.fonts&&document.fonts.ready)await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,900))])}catch{}
      const canMediaRecorder=typeof MediaRecorder!=='undefined'&&!!HTMLCanvasElement.prototype.captureStream;
      const canWebCodecs=typeof VideoEncoder!=='undefined'&&typeof VideoFrame!=='undefined'&&!!window.Mp4Muxer;
      if(!canMediaRecorder&&!canWebCodecs)throw new Error('animated-reels-not-supported');
      const preferWebCodecs=/SamsungBrowser/i.test(navigator.userAgent||'')&&canWebCodecs;

      const lang=root.dataset.lang==='en'?'en':'fa';
      const title=card.dataset[lang==='en'?'storyTitleEn':'storyTitleFa']||card.dataset.storyTitleFa||'Nabez Sardo';
      const lead=card.dataset[lang==='en'?'storyLeadEn':'storyLeadFa']||card.dataset.storyLeadFa||'';
      const category=card.dataset[lang==='en'?'storyCategoryEn':'storyCategoryFa']||card.dataset.storyCategoryFa||'News';
      const categoryId=card.dataset.storyCategoryId||'';
      const [img,video]=await Promise.all([loadStoryImage(card.dataset.storyImage||''),loadReelVideo(card)]);

      const LW=1080,LH=1920,DURATION=6500;
      const easeOut=x=>1-Math.pow(1-Math.max(0,Math.min(1,x)),3);
      const fade=(t,start,end)=>{
        if(t<=start)return 0;
        if(t>=end)return 1;
        return easeOut((t-start)/(end-start));
      };

      const drawCover=(ctx,media,x,y,w,h,zoom=1,shiftX=0,shiftY=0)=>{
        if(!media)return false;
        const mw=media.videoWidth||media.naturalWidth||media.width||0;
        const mh=media.videoHeight||media.naturalHeight||media.height||0;
        if(!mw||!mh)return false;
        const scale=Math.max(w/mw,h/mh)*zoom;
        const sw=w/scale,sh=h/scale;
        const sx=Math.max(0,Math.min(mw-sw,(mw-sw)/2-shiftX/scale));
        const sy=Math.max(0,Math.min(mh-sh,(mh-sh)/2-shiftY/scale));
        try{
          ctx.drawImage(media,sx,sy,sw,sh,x,y,w,h);
          return true;
        }catch{return false}
      };

      const renderAttempt=async({width,height,fps,bitRate,safeMode=false})=>{
        if(!canMediaRecorder)throw new Error('media-recorder-unavailable');
        const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true})||canvas.getContext('2d',{alpha:false});
        if(!ctx)throw new Error('animated-reels-canvas-failed');
        const scale=width/LW;

        const mediaTypes=[
          'video/mp4;codecs=avc1.42E01E',
          'video/mp4',
          'video/webm;codecs=vp8',
          'video/webm'
        ].filter(type=>{try{return MediaRecorder.isTypeSupported(type)}catch{return false}});
        if(!mediaTypes.length)mediaTypes.push('');

        const renderFrame=elapsed=>{
          const t=Math.max(0,Math.min(DURATION,elapsed));
          const p=t/DURATION;
          ctx.setTransform(scale,0,0,scale,0,0);

          const bg=ctx.createLinearGradient(0,0,LW,LH);
          bg.addColorStop(0,'#070b11');bg.addColorStop(.52,'#111925');bg.addColorStop(1,'#080b10');
          ctx.fillStyle=bg;ctx.fillRect(0,0,LW,LH);

          const glow=ctx.createRadialGradient(855,260,20,855,260,720);
          glow.addColorStop(0,'rgba(151,34,70,.34)');
          glow.addColorStop(.48,'rgba(207,166,91,.13)');
          glow.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=glow;ctx.fillRect(0,0,LW,1020);

          ctx.save();
          rr(ctx,66,72,948,1776,48);ctx.clip();
          const media=!safeMode&&video&&video.readyState>=2?video:img;
          const zoom=1.012+(p*.055);
          if(!drawCover(ctx,media,66,72,948,1776,zoom,(p-.5)*26,(p-.5)*14)){
            ctx.fillStyle='#10151d';ctx.fillRect(66,72,948,1776);
          }
          const shade=ctx.createLinearGradient(0,260,0,1848);
          shade.addColorStop(0,'rgba(4,7,12,.16)');
          shade.addColorStop(.42,'rgba(4,7,12,.18)');
          shade.addColorStop(.64,'rgba(4,7,12,.66)');
          shade.addColorStop(1,'rgba(4,7,12,.97)');
          ctx.fillStyle=shade;ctx.fillRect(66,72,948,1776);
          ctx.restore();

          ctx.strokeStyle='rgba(213,173,100,.36)';ctx.lineWidth=3;rr(ctx,66,72,948,1776,48);ctx.stroke();

          const brandA=fade(t,80,720);
          ctx.globalAlpha=brandA;
          ctx.textAlign=lang==='en'?'left':'right';ctx.direction=lang==='en'?'ltr':'rtl';
          ctx.fillStyle='#f2c978';ctx.font='900 48px Vazirmatn, sans-serif';
          const brandX=lang==='en'?100:980;
          ctx.fillText(lang==='en'?'NABEZ SARDO':'نبض ساردو',brandX,150+(1-brandA)*16);
          ctx.fillStyle='rgba(242,232,215,.72)';ctx.font='600 22px Vazirmatn, sans-serif';
          ctx.fillText(lang==='en'?'LOCAL NEWS / SOUTH KERMAN':'رسانه محلی ساردوئیه و جنوب کرمان',brandX,194+(1-brandA)*16);
          ctx.fillStyle='#d7ae63';ctx.fillRect(lang==='en'?100:800,216,180*brandA,4);
          ctx.globalAlpha=1;

          const catA=fade(t,520,1100);
          ctx.font='800 24px Vazirmatn, sans-serif';
          const pillW=Math.min(330,Math.max(150,ctx.measureText(category).width+70));
          const pillX=lang==='en'?90:990-pillW;
          ctx.globalAlpha=catA;
          ctx.fillStyle='rgba(132,29,61,.88)';rr(ctx,pillX,1010+(1-catA)*14,pillW,58,29);ctx.fill();
          ctx.fillStyle='#f0d49a';ctx.textAlign='center';ctx.fillText(category,pillX+pillW/2,1048+(1-catA)*14);
          ctx.globalAlpha=1;

          ctx.textAlign=lang==='en'?'left':'right';ctx.direction=lang==='en'?'ltr':'rtl';
          const titleFont=title.length>95?58:title.length>62?64:72;
          ctx.font='900 '+titleFont+'px Vazirmatn, sans-serif';ctx.fillStyle='#fff8ed';
          const titleLines=wrapStoryLines(ctx,title,880).slice(0,4);
          const titleA=fade(t,850,1800);
          ctx.globalAlpha=titleA;
          titleLines.forEach((line,index)=>ctx.fillText(line,lang==='en'?100:980,1185+(1-titleA)*34+index*titleFont*1.34));
          ctx.globalAlpha=1;

          const ruleA=fade(t,1650,2350),ruleW=880*ruleA,ruleX=540-ruleW/2;
          if(ruleW>2){
            const rule=ctx.createLinearGradient(ruleX,0,ruleX+ruleW,0);
            rule.addColorStop(0,'rgba(217,176,99,0)');rule.addColorStop(.15,'#d9b063');rule.addColorStop(.85,'#d9b063');rule.addColorStop(1,'rgba(217,176,99,0)');
            ctx.fillStyle=rule;ctx.fillRect(ruleX,1510,ruleW,3);
          }

          const leadA=fade(t,2150,3150);
          ctx.fillStyle='#e5e9ef';ctx.font='600 31px Vazirmatn, sans-serif';
          const leadLines=wrapStoryLines(ctx,lead,860).slice(0,4);
          ctx.globalAlpha=leadA;
          leadLines.forEach((line,index)=>ctx.fillText(line,lang==='en'?105:975,1582+(1-leadA)*24+index*50));
          ctx.globalAlpha=1;

          const ctaA=fade(t,4700,5550);
          ctx.globalAlpha=ctaA;
          ctx.textAlign='center';ctx.direction=lang==='en'?'ltr':'rtl';
          ctx.fillStyle='rgba(8,11,16,.84)';rr(ctx,210,1730+(1-ctaA)*20,660,96,34);ctx.fill();
          ctx.strokeStyle='rgba(215,174,99,.46)';ctx.lineWidth=2;rr(ctx,210,1730+(1-ctaA)*20,660,96,34);ctx.stroke();
          ctx.fillStyle='#f2d28e';ctx.font='800 28px Vazirmatn, sans-serif';
          ctx.fillText(lang==='en'?'Read more on NABZESARDO.IR':'ادامه خبر در NABZESARDO.IR',540,1790+(1-ctaA)*20);
          ctx.globalAlpha=1;

          const sweepX=-260+(LW+520)*p;
          const sweep=ctx.createLinearGradient(sweepX-180,0,sweepX+180,0);
          sweep.addColorStop(0,'rgba(255,255,255,0)');
          sweep.addColorStop(.5,'rgba(242,202,120,.045)');
          sweep.addColorStop(1,'rgba(255,255,255,0)');
          ctx.fillStyle=sweep;ctx.fillRect(66,72,948,1776);
          ctx.setTransform(1,0,0,1,0,0);
        };

        let lastError=null;
        for(const mimeType of mediaTypes){
          const stream=canvas.captureStream(fps);
          const chunks=[];
          let recorder;
          try{
            const options={videoBitsPerSecond:bitRate};
            if(mimeType)options.mimeType=mimeType;
            recorder=new MediaRecorder(stream,options);
          }catch(err){
            stream.getTracks().forEach(track=>track.stop());
            lastError=err;continue;
          }

          let fatal=null;
          const done=new Promise((resolve,reject)=>{
            recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
            recorder.onerror=e=>{
              fatal=e?.error||new Error('animated-reels-recording-failed');
              reject(fatal);
            };
            recorder.onstop=()=>{
              try{
                stream.getTracks().forEach(track=>track.stop());
                if(fatal)return;
                const finalType=recorder.mimeType||mimeType||'video/webm';
                const blob=new Blob(chunks,{type:finalType});
                if(!blob.size){reject(new Error('animated-reels-empty'));return;}
                const extension=/^video\/mp4/i.test(finalType)?'mp4':'webm';
                const name=categoryId==='opinion'?'nabez-sardo-demand-reel.'+extension:'nabez-sardo-news-reel.'+extension;
                resolve({file:new File([blob],name,{type:blob.type,lastModified:Date.now()}),extension,mimeType:finalType,width,height});
              }catch(err){reject(err)}
            };
          });

          try{
            recorder.start();
            const started=performance.now();
            await new Promise((resolve,reject)=>{
              const tick=now=>{
                if(fatal){reject(fatal);return;}
                const elapsed=now-started;
                try{renderFrame(elapsed)}catch(err){reject(err);return;}
                if(elapsed<DURATION)requestAnimationFrame(tick);
                else{renderFrame(DURATION);setTimeout(resolve,100)}
              };
              requestAnimationFrame(tick);
            });
            if(recorder.state!=='inactive')recorder.stop();
            return await done;
          }catch(err){
            lastError=err;
            try{if(recorder.state!=='inactive')recorder.stop()}catch{}
            stream.getTracks().forEach(track=>track.stop());
            await new Promise(resolve=>setTimeout(resolve,160));
          }
        }
        throw lastError||new Error('animated-reels-recording-failed');
      };

      const renderWebCodecsMp4=async()=>{
        if(!canWebCodecs||!storyFile)throw new Error('webcodecs-mp4-unavailable');
        let bitmap=null;
        try{bitmap=await createImageBitmap(storyFile)}catch(err){throw new Error('webcodecs-story-image-failed:'+String(err?.message||err))}
        const profiles=[
          {width:720,height:1280,fps:15,bitRate:1400000},
          {width:540,height:960,fps:12,bitRate:900000}
        ];
        const premiumCapability=async()=>{
          try{
            const cores=Number(navigator.hardwareConcurrency||0);
            const memory=Number(navigator.deviceMemory||0);
            if(cores&&cores<4)return false;
            if(memory&&memory<4)return false;
            if(VideoEncoder.isConfigSupported){
              const probe=await VideoEncoder.isConfigSupported({
                codec:'avc1.42001f',
                width:720,
                height:1280,
                bitrate:1400000,
                framerate:15,
                hardwareAcceleration:'prefer-hardware',
                latencyMode:'quality'
              });
              if(!probe?.supported)return false;
            }
            return true;
          }catch{return false}
        };
        let premiumEnabled=await premiumCapability();
        let lastError=null;
        try{
          for(const profile of profiles){
            const {width,height,fps,bitRate}=profile;
            const codecCandidates=['avc1.42001f','avc1.42E01E','avc1.4d001f'];
            for(const codec of codecCandidates){
              let encoder=null;
              try{
                const config={codec,width,height,bitrate:bitRate,framerate:fps,hardwareAcceleration:'prefer-hardware',latencyMode:'quality'};
                if(VideoEncoder.isConfigSupported){
                  const support=await VideoEncoder.isConfigSupported(config);
                  if(!support?.supported)continue;
                }
                const target=new Mp4Muxer.ArrayBufferTarget();
                const muxer=new Mp4Muxer.Muxer({
                  target,
                  video:{codec:'avc',width,height,frameRate:fps},
                  fastStart:'in-memory',
                  firstTimestampBehavior:'offset'
                });
                let encodeError=null;
                encoder=new VideoEncoder({
                  output:(chunk,meta)=>muxer.addVideoChunk(chunk,meta),
                  error:err=>{encodeError=err}
                });
                encoder.configure(config);

                const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
                const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true})||canvas.getContext('2d',{alpha:false});
                if(!ctx)throw new Error('webcodecs-canvas-failed');

                const frames=Math.max(1,Math.round(DURATION/1000*fps));
                const frameDuration=Math.round(1000000/fps);
                for(let i=0;i<frames;i++){
                  if(encodeError)throw encodeError;
                  const p=frames<=1?1:i/(frames-1);
                  ctx.fillStyle='#070b11';ctx.fillRect(0,0,width,height);

                  // Animate the already-approved Story artwork with a subtle
                  // editorial Ken Burns motion. This keeps text/branding exact
                  // while avoiding Samsung Internet's MediaRecorder path.
                  const zoom=1.0+0.035*p;
                  const dw=width*zoom,dh=height*zoom;
                  const dx=(width-dw)/2+(Math.sin(p*Math.PI)*8);
                  const dy=(height-dh)/2-(p*10);
                  ctx.drawImage(bitmap,dx,dy,dw,dh);

                  const sweepX=-width*.25+(width*1.5)*p;
                  const sweep=ctx.createLinearGradient(sweepX-width*.16,0,sweepX+width*.16,0);
                  sweep.addColorStop(0,'rgba(255,255,255,0)');
                  sweep.addColorStop(.5,'rgba(242,202,120,.055)');
                  sweep.addColorStop(1,'rgba(255,255,255,0)');
                  ctx.fillStyle=sweep;ctx.fillRect(0,0,width,height);

                  // Progressive premium layer. The stable frame above is already
                  // complete; any overlay failure simply turns premium off.
                  if(premiumEnabled){
                    try{
                      const intro=Math.max(0,Math.min(1,p/.16));
                      const outro=Math.max(0,Math.min(1,(p-.72)/.22));
                      const pulse=.72+.28*Math.sin(p*Math.PI);

                      // Burgundy/gold cinematic ambience.
                      const wine=ctx.createRadialGradient(width*.82,height*.16,8,width*.82,height*.16,width*.55);
                      wine.addColorStop(0,'rgba(151,34,70,'+(0.18*pulse)+')');
                      wine.addColorStop(.52,'rgba(116,24,57,'+(0.07*pulse)+')');
                      wine.addColorStop(1,'rgba(0,0,0,0)');
                      ctx.fillStyle=wine;ctx.fillRect(0,0,width,height*.62);

                      const gold=ctx.createRadialGradient(width*.16,height*.82,8,width*.16,height*.82,width*.42);
                      gold.addColorStop(0,'rgba(225,184,111,'+(0.075*pulse)+')');
                      gold.addColorStop(1,'rgba(225,184,111,0)');
                      ctx.fillStyle=gold;ctx.fillRect(0,height*.52,width*.78,height*.48);

                      // Premium inner frame fades in, never replaces the base.
                      ctx.globalAlpha=.14*intro;
                      ctx.strokeStyle='rgba(238,198,124,.95)';
                      ctx.lineWidth=Math.max(1,width/540);
                      ctx.strokeRect(width*.035,height*.022,width*.93,height*.956);
                      ctx.globalAlpha=1;

                      // Glass sheen across the information region.
                      const sheenP=Math.max(0,Math.min(1,(p-.24)/.52));
                      if(sheenP>0&&sheenP<1){
                        const sx=-width*.22+(width*1.44)*sheenP;
                        const sheen=ctx.createLinearGradient(sx-width*.12,0,sx+width*.12,0);
                        sheen.addColorStop(0,'rgba(255,255,255,0)');
                        sheen.addColorStop(.48,'rgba(247,215,153,.018)');
                        sheen.addColorStop(.5,'rgba(247,215,153,.13)');
                        sheen.addColorStop(.52,'rgba(247,215,153,.018)');
                        sheen.addColorStop(1,'rgba(255,255,255,0)');
                        ctx.fillStyle=sheen;ctx.fillRect(0,height*.48,width,height*.44);
                      }

                      // Animated gold rail gives the title area a premium beat.
                      const railP=Math.max(0,Math.min(1,(p-.20)/.28));
                      if(railP>0){
                        const railW=width*.60*railP;
                        const railX=(width-railW)/2;
                        const rail=ctx.createLinearGradient(railX,0,railX+Math.max(2,railW),0);
                        rail.addColorStop(0,'rgba(227,187,112,0)');
                        rail.addColorStop(.18,'rgba(242,205,136,.86)');
                        rail.addColorStop(.82,'rgba(242,205,136,.86)');
                        rail.addColorStop(1,'rgba(227,187,112,0)');
                        ctx.fillStyle=rail;ctx.fillRect(railX,height*.776,railW,Math.max(1,height*.0018));
                      }

                      // CTA glow/pulse only near the end.
                      if(outro>0){
                        const ctaPulse=1+Math.sin(p*38)*.05*outro;
                        const glow=ctx.createRadialGradient(width*.5,height*.922,5,width*.5,height*.922,width*.34*ctaPulse);
                        glow.addColorStop(0,'rgba(233,193,116,'+(0.15*outro)+')');
                        glow.addColorStop(1,'rgba(233,193,116,0)');
                        ctx.fillStyle=glow;ctx.fillRect(width*.12,height*.845,width*.76,height*.14);
                      }

                      // Final edge-light trace.
                      if(p>.78){
                        const edgeA=(p-.78)/.22;
                        ctx.globalAlpha=.18*edgeA;
                        const edge=ctx.createLinearGradient(0,0,width,0);
                        edge.addColorStop(0,'rgba(225,184,111,0)');
                        edge.addColorStop(.5,'rgba(246,215,151,.95)');
                        edge.addColorStop(1,'rgba(225,184,111,0)');
                        ctx.strokeStyle=edge;
                        ctx.lineWidth=Math.max(1,width/420);
                        ctx.strokeRect(width*.026,height*.014,width*.948,height*.972);
                        ctx.globalAlpha=1;
                      }
                    }catch(err){
                      premiumEnabled=false;
                      ctx.globalAlpha=1;
                      console.warn('premium reels overlay disabled',String(err?.message||err));
                    }
                  }

                  const frame=new VideoFrame(canvas,{
                    timestamp:i*frameDuration,
                    duration:frameDuration
                  });
                  encoder.encode(frame,{keyFrame:i===0||i%(fps*2)===0});
                  frame.close();

                  if(encoder.encodeQueueSize>4){
                    await new Promise(resolve=>setTimeout(resolve,0));
                  }
                }
                await encoder.flush();
                if(encodeError)throw encodeError;
                muxer.finalize();
                const buffer=target.buffer;
                if(!buffer||!buffer.byteLength)throw new Error('webcodecs-empty-mp4');
                const name=categoryId==='opinion'?'nabez-sardo-demand-reel.mp4':'nabez-sardo-news-reel.mp4';
                return {
                  file:new File([buffer],name,{type:'video/mp4',lastModified:Date.now()}),
                  extension:'mp4',
                  mimeType:'video/mp4',
                  width,height,
                  engine:premiumEnabled?'webcodecs-premium-auto':'webcodecs',
                  premium:premiumEnabled
                };
              }catch(err){
                lastError=err;
                console.warn('animated reels WebCodecs attempt failed',codec,profile.width+'x'+profile.height,String(err?.message||err));
              }finally{
                if(encoder){try{encoder.close()}catch{}}
              }
            }
          }
        }finally{
          if(bitmap&&bitmap.close)bitmap.close();
        }
        throw lastError||new Error('webcodecs-mp4-failed');
      };

      const attempts=[
        {width:1080,height:1920,fps:20,bitRate:2200000,safeMode:false},
        {width:720,height:1280,fps:15,bitRate:1200000,safeMode:true},
        {width:540,height:960,fps:12,bitRate:800000,safeMode:true}
      ];
      let lastError=null;
      if(preferWebCodecs){
        try{
          const result=await renderWebCodecsMp4();
          if(video){try{video.pause()}catch{}}
          return result;
        }catch(err){
          lastError=err;
          console.warn('Samsung WebCodecs Reels fallback failed',String(err?.message||err));
        }
      }

      if(canMediaRecorder){
        for(const config of attempts){
          try{
            const result=await renderAttempt(config);
            if(video){try{video.pause()}catch{}}
            return result;
          }catch(err){
            lastError=err;
            console.warn('animated reels render profile failed',config.width+'x'+config.height,String(err?.message||err));
            await new Promise(resolve=>setTimeout(resolve,180));
          }
        }
      }

      if(canWebCodecs&&!preferWebCodecs){
        try{
          const result=await renderWebCodecsMp4();
          if(video){try{video.pause()}catch{}}
          return result;
        }catch(err){
          lastError=err;
          console.warn('animated reels WebCodecs fallback failed',String(err?.message||err));
        }
      }

      if(video){try{video.pause()}catch{}}
      throw lastError||new Error('animated-reels-recording-failed');
    };

    const closeNewsStory=()=>{
      storySheet.hidden=true;
      document.body.classList.remove('story-sheet-open');
      if(preparedStoryUrl){URL.revokeObjectURL(preparedStoryUrl);preparedStoryUrl='';}
      if(preparedReelUrl){URL.revokeObjectURL(preparedReelUrl);preparedReelUrl='';}
      storyPreview.innerHTML='';
      activeStoryCard=null;preparedStoryFile=null;
    };
    storySheet.querySelectorAll('[data-news-story-close]').forEach(btn=>btn.addEventListener('click',closeNewsStory));

    const openNewsStory=card=>{
      activeStoryCard=card;preparedStoryFile=null;
      if(preparedStoryUrl){URL.revokeObjectURL(preparedStoryUrl);preparedStoryUrl='';}
      if(preparedReelUrl){URL.revokeObjectURL(preparedReelUrl);preparedReelUrl='';}
      storyPreview.innerHTML='';
      shareBtn.disabled=true;reelBtn.disabled=true;downloadBtn.disabled=true;
      storyStatus.innerHTML=root.dataset.lang==='en'?'Preparing story image…':'در حال آماده‌سازی تصویر استوری…';
      storySheet.hidden=false;document.body.classList.add('story-sheet-open');
      if(navigator.vibrate)navigator.vibrate(25);
      makeNewsStory(card).then(result=>{
        if(activeStoryCard!==card)return;
        preparedStoryFile=result.file;
        activeStoryCard.dataset.storyPreparedCategoryId=result.categoryId||activeStoryCard.dataset.storyCategoryId||'';
        preparedStoryUrl=URL.createObjectURL(result.file);
        const previewImg=document.createElement('img');previewImg.src=preparedStoryUrl;previewImg.alt='';
        storyPreview.replaceChildren(previewImg);
        storyStatus.textContent=root.dataset.lang==='en'?'Image + headline are ready for Story.':'عکس و متن خبر برای استوری آماده شد.';
        shareBtn.disabled=false;reelBtn.disabled=false;downloadBtn.disabled=false;
      }).catch(err=>{
        console.warn('news story render failed',err);
        storyStatus.textContent=root.dataset.lang==='en'?'Could not prepare the story image.':'ساخت تصویر استوری انجام نشد.';
      });
    };

    shareBtn.addEventListener('click',async()=>{
      if(!preparedStoryFile||!activeStoryCard)return;
      const lang=root.dataset.lang==='en'?'en':'fa';
      const title=activeStoryCard.dataset[lang==='en'?'storyTitleEn':'storyTitleFa']||activeStoryCard.dataset.storyTitleFa||'Nabez Sardo';
      const url=new URL(activeStoryCard.dataset.storyUrl||'/',location.origin).href;
      const isOpinion=(activeStoryCard.dataset.storyCategoryId||'')==='opinion';
      try{
        if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[preparedStoryFile]}))){
          if(isOpinion){
            // Instagram is more reliable when the Story handoff is image-only.
            // The Story artwork itself already contains the title/lead/brand.
            await navigator.share({files:[preparedStoryFile]});
          }else{
            await navigator.share({files:[preparedStoryFile],title,text:(lang==='en'?'Nabez Sardo — ':'نبض ساردو — ')+title+'\n'+url});
          }
          closeNewsStory();
        }else{
          const a=document.createElement('a');a.href=preparedStoryUrl;a.download=preparedStoryFile.name;a.click();
        }
      }catch(err){if(err&&err.name!=='AbortError')console.warn('news story share failed',err);}
    });
    reelBtn.addEventListener('click',async()=>{
      if(!activeStoryCard)return;
      reelBtn.disabled=true;
      const oldShareDisabled=shareBtn.disabled,oldDownloadDisabled=downloadBtn.disabled;
      storyStatus.textContent=root.dataset.lang==='en'
        ? 'Building Reels… premium effects are enabled automatically when supported.' : 'در حال ساخت Reels؛ افکت‌های پریمیوم در صورت پشتیبانی دستگاه خودکار فعال می‌شوند…';
      try{
        const result=await makeAnimatedReel(activeStoryCard,preparedStoryFile);
        const reelFile=result.file;
        if(preparedReelUrl){URL.revokeObjectURL(preparedReelUrl);preparedReelUrl='';}
        preparedReelUrl=URL.createObjectURL(reelFile);

        const previewVideo=document.createElement('video');
        previewVideo.src=preparedReelUrl;
        previewVideo.muted=true;previewVideo.loop=true;previewVideo.playsInline=true;previewVideo.controls=true;
        previewVideo.autoplay=true;
        storyPreview.replaceChildren(previewVideo);
        previewVideo.play().catch(()=>{});

        const isMp4=result.extension==='mp4';
        storyStatus.textContent=isMp4
          ?(root.dataset.lang==='en'
            ?(result.premium?'Premium animated MP4 is ready. Choose Instagram / Reels.':'Animated MP4 is ready. Choose Instagram / Reels.')
            :(result.premium?'Reels متحرک پریمیوم آماده است؛ Instagram / Reels را انتخاب کنید.':'ویدیوی متحرک آماده است؛ Instagram / Reels را انتخاب کنید.'))
          :(root.dataset.lang==='en'
            ?'Animated video is ready. This browser produced WebM instead of MP4.'
            :'ویدیوی متحرک آماده است؛ این مرورگر به‌جای MP4 خروجی WebM ساخته است.');

        if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[reelFile]}))){
          await navigator.share({files:[reelFile]});
        }else{
          const a=document.createElement('a');a.href=preparedReelUrl;a.download=reelFile.name;a.click();
        }
      }catch(err){
        if(err&&err.name!=='AbortError'){
          console.warn('animated reels share failed',err);
          const unsupported=/not-supported|codec/i.test(String(err&&err.message||err));
          storyStatus.textContent=root.dataset.lang==='en'
            ?(unsupported?'Animated Reels is not supported by this browser.':'Could not build the animated Reels video.')
            :(unsupported?'این مرورگر از ساخت Reels متحرک پشتیبانی نمی‌کند.':'ساخت ویدیوی Reels روی این مرورگر انجام نشد.');
        }
      }finally{
        if(activeStoryCard)reelBtn.disabled=false;
        shareBtn.disabled=oldShareDisabled;
        downloadBtn.disabled=oldDownloadDisabled;
      }
    });

    downloadBtn.addEventListener('click',()=>{
      if(!preparedStoryFile)return;
      const a=document.createElement('a');a.href=preparedStoryUrl;a.download=preparedStoryFile.name;a.click();
    });

    newsStoryCards.forEach(card=>{
      const badge=card.querySelector('.card-story-badge');
      if(badge)badge.addEventListener('click',ev=>{
        ev.preventDefault();ev.stopPropagation();
        card.dataset.storySuppressUntil=String(Date.now()+900);
        openNewsStory(card);
      });
      let timer=null,startX=0,startY=0,triggered=false,lastPointerType='';
      const cancel=()=>{if(timer){clearTimeout(timer);timer=null;}card.classList.remove('story-holding');};
      card.addEventListener('pointerdown',ev=>{
        if(ev.target.closest('.card-story-badge'))return;
        if(ev.button!==undefined&&ev.button!==0)return;
        lastPointerType=ev.pointerType||'';
        startX=ev.clientX;startY=ev.clientY;triggered=false;
        cancel();card.classList.add('story-holding');
        timer=setTimeout(()=>{timer=null;triggered=true;card.dataset.storySuppressUntil=String(Date.now()+900);card.classList.remove('story-holding');openNewsStory(card);},680);
      });
      card.addEventListener('pointermove',ev=>{if(Math.hypot(ev.clientX-startX,ev.clientY-startY)>13)cancel();});
      ['pointerup','pointercancel','pointerleave'].forEach(name=>card.addEventListener(name,cancel));
      card.addEventListener('click',ev=>{
        if(Number(card.dataset.storySuppressUntil||0)>Date.now()){
          ev.preventDefault();ev.stopPropagation();
        }
      },true);
      card.addEventListener('contextmenu',ev=>{if(lastPointerType==='touch'||triggered)ev.preventDefault();});
    });
  }

  // Desktop breaking ticker: measure the viewport before animation starts so the
  // first headline emerges from behind the fixed badge and duplicate sets line up exactly.
  const desktopTickerMQ=matchMedia('(min-width: 621px)');
  const setupBreakingTicker=()=>{
    document.querySelectorAll('.breaking-marquee').forEach(view=>{
      const track=view.querySelector('.breaking-track');
      const sets=[...view.querySelectorAll('.breaking-loop-set')];
      if(!track||sets.length<2)return;
      if(!desktopTickerMQ.matches){
        sets.forEach(set=>set.style.removeProperty('min-width'));
        track.classList.remove('desktop-ticker-ready');
        return;
      }
      const viewportWidth=Math.max(1,Math.ceil(view.getBoundingClientRect().width));
      track.classList.remove('desktop-ticker-ready');
      sets.forEach(set=>set.style.minWidth=viewportWidth+'px');
      // Force the initial frame before making the track visible; this prevents
      // the desktop browser from painting the text at a mid-track position.
      void track.offsetWidth;
      requestAnimationFrame(()=>track.classList.add('desktop-ticker-ready'));
    });
  };
  setupBreakingTicker();
  let tickerResizeTimer=0;
  addEventListener('resize',()=>{
    clearTimeout(tickerResizeTimer);
    tickerResizeTimer=setTimeout(setupBreakingTicker,120);
  },{passive:true});
  if(desktopTickerMQ.addEventListener)desktopTickerMQ.addEventListener('change',setupBreakingTicker);

  const syncAdaptiveMedia=frame=>{
    const img=frame.querySelector('img');
    if(!img)return;
    const apply=()=>{
      const w=img.naturalWidth||0,h=img.naturalHeight||0;
      if(!w||!h)return;
      const ratio=w/h;
      frame.style.setProperty('--image-ratio',String(ratio));
      // Keep newsroom display frames fixed. Natural image ratio is metadata only
      // and must never resize cards or article covers.
      frame.style.removeProperty('aspect-ratio');
      frame.classList.remove('portrait','square','landscape');
      frame.classList.add(ratio<.92?'portrait':ratio>1.08?'landscape':'square');
    };
    if(img.complete)apply();
    else img.addEventListener('load',apply,{once:true});
  };
  document.querySelectorAll('[data-adaptive-media]').forEach(syncAdaptiveMedia);


  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion){
    const hero=document.querySelector('.hero');
    const heroBg=document.querySelector('.hero-bg');
    const pulse=document.querySelector('.pulse-stage');
    if(hero&&heroBg){
      hero.addEventListener('pointermove',ev=>{
        const b=hero.getBoundingClientRect();
        const nx=(ev.clientX-b.left)/b.width-.5;
        const ny=(ev.clientY-b.top)/b.height-.5;
        heroBg.style.setProperty('--hero-shift-x',(nx*-10).toFixed(1)+'px');
        heroBg.style.setProperty('--hero-shift-y',(ny*-7).toFixed(1)+'px');
        if(pulse){
          pulse.style.setProperty('--pulse-x',(nx*12).toFixed(1)+'px');
          pulse.style.setProperty('--pulse-y',(ny*8).toFixed(1)+'px');
        }
      });
      hero.addEventListener('pointerleave',()=>{
        heroBg.style.setProperty('--hero-shift-x','0px');
        heroBg.style.setProperty('--hero-shift-y','0px');
        if(pulse){pulse.style.setProperty('--pulse-x','0px');pulse.style.setProperty('--pulse-y','0px');}
      });
      let ticking=false;
      const syncHeroScroll=()=>{
        ticking=false;
        const rect=hero.getBoundingClientRect();
        const p=Math.max(-1,Math.min(1,-rect.top/Math.max(rect.height,1)));
        heroBg.style.setProperty('--hero-shift-y',(p*-12).toFixed(1)+'px');
      };
      addEventListener('scroll',()=>{
        if(!ticking){ticking=true;requestAnimationFrame(syncHeroScroll);}
      },{passive:true});
    }
  }
  if(reduceMotion)return;
  document.querySelectorAll('.tilt').forEach(el=>{
    el.addEventListener('pointermove',ev=>{
      const b=el.getBoundingClientRect();
      const x=(ev.clientX-b.left)/b.width-.5;
      const y=(ev.clientY-b.top)/b.height-.5;
      el.style.transform='perspective(1100px) rotateX('+(-y*4)+'deg) rotateY('+(x*6)+'deg) translateY(-4px)';
    });
    el.addEventListener('pointerleave',()=>el.style.transform='');
  });
});