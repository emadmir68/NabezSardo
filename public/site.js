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
    const startLiveViews=()=>{
      refreshLiveViews();
      setInterval(refreshLiveViews,10000);
    };
    if('requestIdleCallback' in window)requestIdleCallback(startLiveViews,{timeout:2200});
    else setTimeout(startLiveViews,1200);
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
    renderStaticDates();
    renderCurrentDate();
    renderLiveClock();
  };
  const formatterCache=new Map();
  const getFormatter=(key,locale,opt)=>{
    const cacheKey=locale+'|'+key;
    if(formatterCache.has(cacheKey))return formatterCache.get(cacheKey);
    try{
      const fmt=new Intl.DateTimeFormat(locale,opt);
      formatterCache.set(cacheKey,fmt);
      return fmt;
    }catch{return null}
  };
  const liveClockEls=[...document.querySelectorAll('[data-live-clock]')];
  const currentDateEls=[...document.querySelectorAll('[data-jalali-date]')];
  const newsDateEls=[...document.querySelectorAll('[data-news-date]')];
  const renderLiveClock=()=>{
    if(!liveClockEls.length)return;
    const locale=root.dataset.lang==='en'?'en-GB':'fa-IR';
    const fmt=getFormatter('clock',locale,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Tehran'});
    if(!fmt)return;
    const value=fmt.format(new Date());
    liveClockEls.forEach(el=>{if(el.textContent!==value)el.textContent=value;});
  };
  const renderCurrentDate=()=>{
    if(!currentDateEls.length)return;
    const locale=root.dataset.lang==='en'?'en-US-u-ca-persian':'fa-IR-u-ca-persian';
    const fmt=getFormatter('current-date',locale,{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'});
    if(!fmt)return;
    const value=fmt.format(new Date());
    currentDateEls.forEach(el=>{if(el.textContent!==value)el.textContent=value;});
  };
  const renderStaticDates=()=>{
    if(!newsDateEls.length)return;
    const locale=root.dataset.lang==='en'?'en-US-u-ca-persian':'fa-IR-u-ca-persian';
    const fmt=getFormatter('news-date',locale,{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tehran'});
    if(!fmt)return;
    newsDateEls.forEach(el=>{
      const d=new Date(el.dataset.newsDate);
      if(!isNaN(d))el.textContent=fmt.format(d);
    });
  };
  const savedLang=localStorage.getItem(langKey)||'fa';
  document.querySelectorAll('[data-lang-option]').forEach(btn=>btn.addEventListener('click',()=>setLang(btn.dataset.langOption)));
  setLang(savedLang);
  setInterval(renderLiveClock,1000);
  setInterval(renderCurrentDate,60000);

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
    const copyBtn=articleRoot.querySelector('[data-article-copy]');
    const title=articleRoot.dataset.articleTitle||document.title;
    const lead=(articleRoot.dataset.articleLead||'').replace(/\s+/g,' ').trim();
    const shareUrl=new URL(articleRoot.dataset.articleUrl||location.pathname,location.origin).href;
    const imageRaw=articleRoot.dataset.articleImage||'';
    const imageUrl=imageRaw?new URL(imageRaw,location.origin).href:'';
    const shareText=()=>{
      const lines=['📰 '+title];
      if(lead)lines.push(lead);
      lines.push('ادامه خبر را در سایت نبض ساردو ببینید 👇','🔗 '+shareUrl);
      return lines.join('\n\n');
    };
    const copyText=async value=>{
      if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(value);
      else{
        const ta=document.createElement('textarea');
        ta.value=value;ta.style.position='fixed';ta.style.opacity='0';ta.style.pointerEvents='none';
        document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
      }
    };
    const showShareToast=(message,tone='ok')=>{
      let toast=document.querySelector('[data-article-share-toast]');
      if(!toast){
        toast=document.createElement('div');
        toast.className='article-share-toast';
        toast.dataset.articleShareToast='1';
        document.body.appendChild(toast);
      }
      toast.className='article-share-toast '+tone;
      toast.textContent=message;
      toast.classList.add('show');
      clearTimeout(showShareToast.timer);
      showShareToast.timer=setTimeout(()=>toast.classList.remove('show'),4200);
    };
    const rr=(ctx,x,y,w,h,r)=>{
      const q=Math.min(r,w/2,h/2);
      ctx.beginPath();ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);ctx.closePath();
    };
    const wrapCardLines=(ctx,value,maxWidth)=>{
      const words=String(value||'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';
      words.forEach(word=>{
        const test=line?line+' '+word:word;
        if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test;
      });
      if(line)lines.push(line);
      return lines;
    };
    const loadShareCardImage=async()=>{
      if(!imageUrl)return null;
      try{
        const res=await fetch(imageUrl,{cache:'force-cache',credentials:'same-origin'});
        if(!res.ok)return null;
        const blob=await res.blob();
        if(!blob.type.startsWith('image/'))return null;
        const objectUrl=URL.createObjectURL(blob);
        const img=await new Promise(resolve=>{
          const el=new Image();
          el.onload=()=>resolve(el);el.onerror=()=>resolve(null);el.src=objectUrl;
        });
        URL.revokeObjectURL(objectUrl);
        return img;
      }catch{return null;}
    };
    const makeDirectShareCard=async()=>{
      if(typeof File==='undefined')return null;
      try{if(document.fonts&&document.fonts.ready)await document.fonts.ready}catch{}
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
      const ctx=canvas.getContext('2d');if(!ctx)return null;
      const bg=ctx.createLinearGradient(0,0,1080,1920);
      bg.addColorStop(0,'#081019');bg.addColorStop(.55,'#101823');bg.addColorStop(1,'#090d13');
      ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);
      const glow=ctx.createRadialGradient(860,130,20,860,130,520);
      glow.addColorStop(0,'rgba(139,31,67,.30)');glow.addColorStop(.55,'rgba(217,173,94,.10)');glow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=glow;ctx.fillRect(360,0,720,620);

      ctx.textAlign='right';ctx.direction='rtl';
      ctx.fillStyle='#f0c97a';ctx.font='900 42px Vazirmatn, Tahoma, sans-serif';ctx.fillText('نبض ساردو',980,82);
      ctx.fillStyle='rgba(226,233,242,.62)';ctx.font='700 19px Vazirmatn, Tahoma, sans-serif';ctx.fillText('رسانه محلی ساردوئیه و جنوب کرمان',980,118);
      ctx.fillStyle='#d9ad61';ctx.fillRect(800,138,180,4);

      const imgX=70,imgY=175,imgW=940,imgH=790;
      ctx.fillStyle='#0b1119';rr(ctx,imgX,imgY,imgW,imgH,32);ctx.fill();
      const img=await loadShareCardImage();
      if(img){
        const scale=Math.min(imgW/img.naturalWidth,imgH/img.naturalHeight);
        const dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;
        const dx=imgX+(imgW-dw)/2,dy=imgY+(imgH-dh)/2;
        ctx.save();rr(ctx,imgX,imgY,imgW,imgH,32);ctx.clip();ctx.drawImage(img,dx,dy,dw,dh);ctx.restore();
      }else{
        ctx.textAlign='center';ctx.direction='rtl';ctx.fillStyle='rgba(240,201,122,.72)';
        ctx.font='900 64px Vazirmatn, Tahoma, sans-serif';ctx.fillText('نبض ساردو',540,570);
      }
      ctx.strokeStyle='rgba(224,182,109,.22)';ctx.lineWidth=3;rr(ctx,imgX,imgY,imgW,imgH,32);ctx.stroke();

      ctx.textAlign='right';ctx.direction='rtl';
      const titleFont=title.length>95?48:title.length>62?55:64;
      ctx.fillStyle='#f7f2ea';ctx.font='900 '+titleFont+'px Vazirmatn, Tahoma, sans-serif';
      let y=1065;
      wrapCardLines(ctx,title,900).slice(0,4).forEach(line=>{ctx.fillText(line,980,y);y+=titleFont*1.34;});

      if(lead){
        y+=10;ctx.fillStyle='rgba(224,230,238,.78)';ctx.font='600 29px Vazirmatn, Tahoma, sans-serif';
        wrapCardLines(ctx,lead,900).slice(0,4).forEach(line=>{if(y<1600){ctx.fillText(line,980,y);y+=47;}});
      }

      const ctaY=1665;
      ctx.fillStyle='rgba(218,173,91,.08)';rr(ctx,70,ctaY,940,150,26);ctx.fill();
      ctx.strokeStyle='rgba(224,182,109,.22)';ctx.lineWidth=2;rr(ctx,70,ctaY,940,150,26);ctx.stroke();
      ctx.textAlign='right';ctx.direction='rtl';ctx.fillStyle='#efc77a';
      ctx.font='900 29px Vazirmatn, Tahoma, sans-serif';ctx.fillText('ادامه خبر را در سایت نبض ساردو ببینید',970,1718);
      ctx.direction='ltr';ctx.textAlign='right';ctx.fillStyle='#f2f5f8';ctx.font='800 23px Arial, sans-serif';ctx.fillText(shareUrl,970,1770);

      ctx.direction='ltr';ctx.textAlign='center';ctx.fillStyle='rgba(229,235,242,.42)';ctx.font='700 18px Arial, sans-serif';
      ctx.fillText('NABZESARDO.IR',540,1875);

      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));
      return blob?new File([blob],'nabez-sardo-direct.jpg',{type:'image/jpeg',lastModified:Date.now()}):null;
    };
    const copyArticleLink=async()=>{
      try{
        await copyText(shareUrl);
        if(copyBtn){
          copyBtn.classList.add('is-copied');
          const label=copyBtn.querySelector('[data-copy-label]');
          if(label)label.textContent=root.dataset.lang==='en'?'Copied':'لینک کپی شد';
          setTimeout(()=>{
            copyBtn.classList.remove('is-copied');
            const label2=copyBtn.querySelector('[data-copy-label]');
            if(label2)label2.innerHTML='<span class="lang-fa">کپی لینک</span><span class="lang-en">Copy link</span>';
          },1700);
        }
      }catch(err){console.warn('article copy failed',err);}
    };
    if(copyBtn)copyBtn.addEventListener('click',copyArticleLink);
    if(shareBtn)shareBtn.addEventListener('click',async()=>{
      const caption=shareText();
      try{
        await copyText(caption);
        showShareToast(root.dataset.lang==='en'?'Caption and short link copied. If Instagram sends only the image, paste the text in Direct.':'متن خبر و لینک کوتاه کپی شد؛ اگر اینستاگرام فقط عکس را گرفت، داخل دایرکت Paste کنید.');
      }catch{}
      try{
        if(!navigator.share){
          showShareToast(root.dataset.lang==='en'?'Sharing is not supported here; the text and link are already copied.':'اشتراک‌گذاری در این مرورگر پشتیبانی نمی‌شود؛ متن و لینک کپی شده است.','warn');
          return;
        }
        const cardFile=await makeDirectShareCard();
        if(cardFile&&(!navigator.canShare||navigator.canShare({files:[cardFile]}))){
          try{
            await navigator.share({files:[cardFile],title,text:caption,url:shareUrl});
            return;
          }catch(err){
            if(err&&err.name==='AbortError')return;
            console.warn('article file share fallback',err);
            try{await navigator.share({files:[cardFile],title});return;}catch(err2){if(err2&&err2.name==='AbortError')return;}
          }
        }
        await navigator.share({title,text:caption,url:shareUrl});
      }catch(err){
        if(err&&err.name!=='AbortError'){
          console.warn('article share failed',err);
          showShareToast(root.dataset.lang==='en'?'The text and short link are copied; paste them into Instagram Direct.':'متن و لینک کوتاه کپی شده؛ آن را داخل دایرکت اینستاگرام Paste کنید.','warn');
        }
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


  // Long-press Story sharing for Latest News cards.
  const newsStoryCards=[...document.querySelectorAll('.latest-grid [data-story-card], .archive-grid [data-story-card]')];
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
        <button class="btn ghost" type="button" data-news-story-download disabled><span class="lang-fa">ذخیره تصویر استوری</span><span class="lang-en">Save story image</span></button>
        <button class="story-sheet-cancel" type="button" data-news-story-close><span class="lang-fa">انصراف</span><span class="lang-en">Cancel</span></button>
      </div>`;
    document.body.appendChild(storySheet);

    const storyStatus=storySheet.querySelector('[data-news-story-status]');
    const storyPreview=storySheet.querySelector('[data-news-story-preview]');
    const shareBtn=storySheet.querySelector('[data-news-story-native]');
    const downloadBtn=storySheet.querySelector('[data-news-story-download]');
    let activeStoryCard=null,preparedStoryFile=null,preparedStoryUrl='';

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
      const img=new Image();
      img.decoding='async';
      img.onload=()=>resolve(img);
      img.onerror=()=>resolve(null);
      img.src=src.startsWith('http')?src:new URL(src,location.origin).href;
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
      return {file:new File([blob],'nabez-sardo-news-story.png',{type:'image/png'}),articleUrl,title};
    };

    const closeNewsStory=()=>{
      storySheet.hidden=true;
      document.body.classList.remove('story-sheet-open');
      if(preparedStoryUrl){URL.revokeObjectURL(preparedStoryUrl);preparedStoryUrl='';}
      storyPreview.innerHTML='';
      activeStoryCard=null;preparedStoryFile=null;
    };
    storySheet.querySelectorAll('[data-news-story-close]').forEach(btn=>btn.addEventListener('click',closeNewsStory));

    const openNewsStory=card=>{
      activeStoryCard=card;preparedStoryFile=null;
      if(preparedStoryUrl){URL.revokeObjectURL(preparedStoryUrl);preparedStoryUrl='';}
      storyPreview.innerHTML='';
      shareBtn.disabled=true;downloadBtn.disabled=true;
      storyStatus.innerHTML=root.dataset.lang==='en'?'Preparing story image…':'در حال آماده‌سازی تصویر استوری…';
      storySheet.hidden=false;document.body.classList.add('story-sheet-open');
      if(navigator.vibrate)navigator.vibrate(25);
      makeNewsStory(card).then(result=>{
        if(activeStoryCard!==card)return;
        preparedStoryFile=result.file;
        preparedStoryUrl=URL.createObjectURL(result.file);
        const previewImg=document.createElement('img');previewImg.src=preparedStoryUrl;previewImg.alt='';
        storyPreview.replaceChildren(previewImg);
        storyStatus.textContent=root.dataset.lang==='en'?'Image + headline are ready for Story.':'عکس و متن خبر برای استوری آماده شد.';
        shareBtn.disabled=false;downloadBtn.disabled=false;
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
      try{
        if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[preparedStoryFile]}))){
          await navigator.share({files:[preparedStoryFile],title,text:(lang==='en'?'Nabez Sardo — ':'نبض ساردو — ')+title+'\n'+url});
          closeNewsStory();
        }else{
          const a=document.createElement('a');a.href=preparedStoryUrl;a.download=preparedStoryFile.name;a.click();
        }
      }catch(err){if(err&&err.name!=='AbortError')console.warn('news story share failed',err);}
    });
    downloadBtn.addEventListener('click',()=>{
      if(!preparedStoryFile)return;
      const a=document.createElement('a');a.href=preparedStoryUrl;a.download=preparedStoryFile.name;a.click();
    });

    newsStoryCards.forEach(card=>{
      let timer=null,startX=0,startY=0,triggered=false,lastPointerType='';
      const cancel=()=>{if(timer){clearTimeout(timer);timer=null;}card.classList.remove('story-holding');};
      card.addEventListener('pointerdown',ev=>{
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

  // One-hour short-news stories on the homepage hero.
  const shortStoryRoot=document.querySelector('[data-short-story-stack]');
  if(shortStoryRoot){
    let shortStoryItems=[...shortStoryRoot.querySelectorAll('[data-short-story]')];
    const shortStoryCounter=shortStoryRoot.querySelector('[data-short-story-counter]');
    const shortStoryProgress=shortStoryRoot.querySelector('[data-short-story-progress]');
    const shortStoryDuration=6000;
    let shortStoryIndex=0;
    let shortStoryRotateTimer=0;
    let shortStoryExpiryTimer=0;
    const shortStoryNumber=n=>Number(n||0).toLocaleString(document.documentElement.dataset.lang==='en'?'en-US':'fa-IR');

    const stopShortStoryTimers=()=>{
      if(shortStoryRotateTimer)clearInterval(shortStoryRotateTimer);
      if(shortStoryExpiryTimer)clearInterval(shortStoryExpiryTimer);
      shortStoryRotateTimer=0;
      shortStoryExpiryTimer=0;
    };

    const cleanupShortStories=()=>{
      const now=Date.now();
      shortStoryItems.forEach(item=>{
        const expires=Number(item.dataset.expires||0);
        if(!expires||expires<=now)item.remove();
      });
      shortStoryItems=[...shortStoryRoot.querySelectorAll('[data-short-story]')];
      if(!shortStoryItems.length){
        stopShortStoryTimers();
        shortStoryRoot.remove();
        return false;
      }
      if(shortStoryIndex>=shortStoryItems.length)shortStoryIndex=0;
      return true;
    };

    const restartShortStoryProgress=()=>{
      if(!shortStoryProgress)return;
      shortStoryProgress.style.transition='none';
      shortStoryProgress.style.width='0%';
      void shortStoryProgress.offsetWidth;
      shortStoryProgress.style.transition='width '+shortStoryDuration+'ms linear';
      requestAnimationFrame(()=>{shortStoryProgress.style.width='100%';});
    };

    const restartShortStoryHeadline=item=>{
      const box=item?.querySelector('.hero-short-story-text');
      if(!box)return;
      const lang=document.documentElement.dataset.lang==='en'?'en':'fa';
      const moving=box.querySelector(lang==='en'?'.lang-en':'.lang-fa')||box.querySelector('.lang-fa,.lang-en');
      if(!moving)return;
      moving.style.animation='none';
      moving.style.setProperty('--short-story-travel','0px');
      void moving.offsetWidth;
      const overflow=Math.max(0,moving.scrollWidth-box.clientWidth);
      const travel=overflow>4
        ? (lang==='en'?-1:1)*(overflow+14)
        : (lang==='en'?-8:8);
      moving.style.setProperty('--short-story-travel',travel+'px');
      moving.style.removeProperty('animation');
    };

    const showShortStory=next=>{
      if(!cleanupShortStories())return;
      shortStoryIndex=(next+shortStoryItems.length)%shortStoryItems.length;
      shortStoryItems.forEach((item,i)=>{
        const active=i===shortStoryIndex;
        item.classList.toggle('is-active',active);
        item.setAttribute('aria-hidden',active?'false':'true');
      });
      const activeItem=shortStoryItems[shortStoryIndex];
      restartShortStoryHeadline(activeItem);
      restartShortStoryProgress();
      if(shortStoryCounter){
        shortStoryCounter.textContent=shortStoryNumber(shortStoryIndex+1)+' / '+shortStoryNumber(shortStoryItems.length);
      }
    };

    showShortStory(0);
    shortStoryRotateTimer=setInterval(()=>showShortStory(shortStoryIndex+1),shortStoryDuration);
    shortStoryExpiryTimer=setInterval(()=>{
      const oldLength=shortStoryItems.length;
      if(cleanupShortStories()&&shortStoryItems.length!==oldLength){
        showShortStory(Math.min(shortStoryIndex,shortStoryItems.length-1));
      }
    },1000);

    const shortStoryLangObserver=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.attributeName==='data-lang'))showShortStory(shortStoryIndex);
    });
    shortStoryLangObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-lang']});
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


  // Nabez 60 — immersive glass newsroom stories.
  const n60Root=document.querySelector('[data-n60-root]');
  if(n60Root){
    const slides=[...n60Root.querySelectorAll('[data-n60-slide]')];
    const bars=[...n60Root.querySelectorAll('[data-n60-progress]')];
    const prevBtn=n60Root.querySelector('[data-n60-prev]');
    const nextBtn=n60Root.querySelector('[data-n60-next]');
    const pauseBtn=n60Root.querySelector('[data-n60-pause]');
    let index=0,paused=false,started=performance.now(),raf=0;
    const duration=11000;
    const render=(next,dir=0)=>{
      if(!slides.length)return;
      const old=index;
      index=(next+slides.length)%slides.length;
      slides.forEach((slide,i)=>{
        const on=i===index;
        slide.classList.toggle('is-active',on);
        slide.setAttribute('aria-hidden',on?'false':'true');
        slide.classList.remove('enter-next','enter-prev');
        if(on&&old!==index&&dir){
          void slide.offsetWidth;
          slide.classList.add(dir>0?'enter-next':'enter-prev');
          setTimeout(()=>slide.classList.remove('enter-next','enter-prev'),620);
        }
      });
      bars.forEach((bar,i)=>{
        bar.classList.toggle('is-done',i<index);
        bar.classList.toggle('is-current',i===index);
        const fill=bar.querySelector('i');
        if(fill)fill.style.width=i<index?'100%':'0%';
      });
      started=performance.now();
    };
    const frame=now=>{
      if(!paused&&slides.length){
        const elapsed=now-started;
        const fill=bars[index]?.querySelector('i');
        if(fill)fill.style.width=Math.min(100,(elapsed/duration)*100)+'%';
        if(elapsed>=duration){render(index+1,1);}
      }
      raf=requestAnimationFrame(frame);
    };
    render(0);raf=requestAnimationFrame(frame);
    prevBtn?.addEventListener('click',()=>render(index-1,-1));
    nextBtn?.addEventListener('click',()=>render(index+1,1));
    pauseBtn?.addEventListener('click',()=>{
      paused=!paused;
      pauseBtn.textContent=paused?'▶':'Ⅱ';
      pauseBtn.setAttribute('aria-label',paused?'ادامه پخش':'توقف پخش');
      if(!paused)started=performance.now();
    });
    addEventListener('keydown',ev=>{
      if(ev.key==='ArrowDown'||ev.key==='ArrowRight')render(index+1,1);
      if(ev.key==='ArrowUp'||ev.key==='ArrowLeft')render(index-1,-1);
      if(ev.key===' '){ev.preventDefault();pauseBtn?.click();}
      if(ev.key==='Escape')location.href='/';
    });
    let sy=0,sx=0;
    n60Root.addEventListener('touchstart',ev=>{
      const t=ev.touches[0];if(!t)return;sy=t.clientY;sx=t.clientX;
    },{passive:true});
    n60Root.addEventListener('touchend',ev=>{
      const t=ev.changedTouches[0];if(!t)return;
      const dy=t.clientY-sy,dx=t.clientX-sx;
      if(Math.abs(dy)>55&&Math.abs(dy)>Math.abs(dx)){const dir=dy<0?1:-1;render(index+dir,dir);}
    },{passive:true});
    let holdPaused=false;
    const stage=n60Root.querySelector('.n60-stage');
    const holdStart=ev=>{
      if(ev.target.closest('a,button'))return;
      holdPaused=true;
      paused=true;
      n60Root.classList.add('is-hold-paused');
    };
    const holdEnd=()=>{
      if(!holdPaused)return;
      holdPaused=false;
      paused=false;
      started=performance.now();
      n60Root.classList.remove('is-hold-paused');
      if(pauseBtn)pauseBtn.textContent='Ⅱ';
    };
    stage?.addEventListener('pointerdown',holdStart);
    ['pointerup','pointercancel','pointerleave'].forEach(name=>stage?.addEventListener(name,holdEnd));

    const cardParallax=ev=>{
      if(matchMedia('(pointer:coarse)').matches)return;
      const card=slides[index]?.querySelector('.n60-glass-card');
      if(!card)return;
      const b=card.getBoundingClientRect();
      const nx=Math.max(-.5,Math.min(.5,(ev.clientX-b.left)/Math.max(1,b.width)-.5));
      const ny=Math.max(-.5,Math.min(.5,(ev.clientY-b.top)/Math.max(1,b.height)-.5));
      card.style.setProperty('--n60-rx',(-ny*2.8).toFixed(2)+'deg');
      card.style.setProperty('--n60-ry',(nx*3.8).toFixed(2)+'deg');
      card.style.setProperty('--n60-glow-x',((nx+.5)*100).toFixed(1)+'%');
      card.style.setProperty('--n60-glow-y',((ny+.5)*100).toFixed(1)+'%');
    };
    n60Root.addEventListener('pointermove',cardParallax,{passive:true});
    n60Root.addEventListener('pointerleave',()=>{
      slides.forEach(slide=>{
        const card=slide.querySelector('.n60-glass-card');
        if(card){card.style.removeProperty('--n60-rx');card.style.removeProperty('--n60-ry');}
      });
    });

    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='hidden')paused=true;
      else{paused=false;started=performance.now();if(pauseBtn)pauseBtn.textContent='Ⅱ';}
    });
    addEventListener('beforeunload',()=>cancelAnimationFrame(raf),{once:true});
  }

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

  // Video cards load/play only near the viewport so they do not compete with
  // the hero, CSS and article images during initial mobile/desktop rendering.
  const cardVideos=[...document.querySelectorAll('video[data-card-video]')];
  if(cardVideos.length){
    const videoReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrowViewport=matchMedia('(max-width:760px)').matches;
    const cardVideoAutoplay=!narrowViewport&&matchMedia('(hover:hover) and (pointer:fine)').matches;
    if(cardVideoAutoplay&&!videoReduced&&'IntersectionObserver' in window){
      const videoObserver=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          const video=entry.target;
          if(entry.isIntersecting&&entry.intersectionRatio>=.18){
            const source=video.querySelector('source[data-src]');
            if(source&&!source.src){
              source.src=source.dataset.src||'';
              video.load();
            }
            if(video.preload==='none')video.preload='metadata';
            const p=video.play();
            if(p&&typeof p.catch==='function')p.catch(()=>{});
          }else{
            video.pause();
          }
        });
      },{rootMargin:'180px 0px',threshold:[0,.18,.6]});
      cardVideos.forEach(video=>videoObserver.observe(video));
    }
  }

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
  if(reduceMotion||matchMedia('(pointer:coarse)').matches)return;
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