document.addEventListener('DOMContentLoaded',()=>{
  const root=document.documentElement;
  const pageBuildVersion=document.querySelector('meta[name="nabez-build"]')?.content||'';
  let buildReloading=false;
  const autoReloadAllowed=!location.pathname.startsWith('/admin')&&!['/send-news','/contact'].includes(location.pathname);
  const cleanBuildParam=()=>{
    try{
      const u=new URL(location.href);
      if(u.searchParams.has('__build')){
        u.searchParams.delete('__build');
        history.replaceState(history.state,'',u.pathname+(u.search||'')+u.hash);
      }
    }catch{}
  };
  cleanBuildParam();
  const reloadForBuild=version=>{
    if(buildReloading||!autoReloadAllowed)return;
    buildReloading=true;
    try{
      const u=new URL(location.href);
      u.searchParams.set('__build',String(version||Date.now()).slice(0,24));
      location.replace(u.href);
    }catch{
      location.reload();
    }
  };
  const checkBuildVersion=async()=>{
    if(!autoReloadAllowed||buildReloading||document.visibilityState==='hidden')return;
    try{
      const res=await fetch('/__version?_='+Date.now(),{cache:'no-store',credentials:'same-origin',headers:{'Cache-Control':'no-cache'}});
      if(!res.ok)return;
      const data=await res.json();
      const remote=String(data?.version||'');
      if(!remote)return;
      if(!pageBuildVersion||remote!==pageBuildVersion)reloadForBuild(remote);
    }catch{}
  };
  setTimeout(checkBuildVersion,2500);
  setInterval(checkBuildVersion,12000);
  addEventListener('pageshow',()=>setTimeout(checkBuildVersion,300),{passive:true});
  addEventListener('online',()=>setTimeout(checkBuildVersion,300),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(checkBuildVersion,300);});
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
    document.querySelectorAll('[data-live-clock],[data-radar-clock]').forEach(el=>el.textContent=new Intl.DateTimeFormat(clockLocale,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Tehran'}).format(now));
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
    const copyBtn=articleRoot.querySelector('[data-article-copy]');
    const title=articleRoot.dataset.articleTitle||document.title;
    const shareUrl=new URL(articleRoot.dataset.articleUrl||location.pathname,location.origin).href;
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
      try{
        if(navigator.share)await navigator.share({title,text:(root.dataset.lang==='en'?'Nabez Sardo — ':'نبض ساردو — ')+title,url:shareUrl});
        else await copyArticleLink();
      }catch(err){if(err&&err.name!=='AbortError')console.warn('article share failed',err);}
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
      frame.style.aspectRatio=w+' / '+h;
      frame.classList.remove('portrait','square','landscape');
      frame.classList.add(ratio<.92?'portrait':ratio>1.08?'landscape':'square');
    };
    if(img.complete)apply();
    else img.addEventListener('load',apply,{once:true});
  };
  document.querySelectorAll('[data-adaptive-media]').forEach(syncAdaptiveMedia);

  // Experimental live news radar: refresh only this module when hot stories change.
  const radarRoot=document.querySelector('[data-news-radar]');
  if(radarRoot){
    let radarPolling=false;
    const refreshRadar=async()=>{
      if(radarPolling||document.visibilityState==='hidden')return;
      radarPolling=true;
      try{
        const res=await fetch('/?__radar='+Date.now(),{
          cache:'no-store',
          credentials:'same-origin',
          headers:{'Cache-Control':'no-cache','X-Nabez-Partial':'radar'}
        });
        if(!res.ok)return;
        const html=await res.text();
        const doc=new DOMParser().parseFromString(html,'text/html');
        const next=doc.querySelector('[data-news-radar]');
        const current=document.querySelector('[data-news-radar]');
        if(!next||!current)return;
        if((next.dataset.radarSignature||'')!==(current.dataset.radarSignature||'')){
          current.replaceWith(next);
          updateDateTime();
          next.classList.add('radar-just-updated');
          setTimeout(()=>next.classList.remove('radar-just-updated'),1400);
        }
      }catch(err){
        console.warn('news radar refresh failed',err);
      }finally{
        radarPolling=false;
      }
    };
    setInterval(refreshRadar,45000);
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible')setTimeout(refreshRadar,700);
    });
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