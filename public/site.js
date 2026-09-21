document.addEventListener('DOMContentLoaded',()=>{
  const root=document.documentElement;
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
      const title=storyBanner.dataset[lang==='en'?'storyTitleEn':'storyTitleFa']||'Nabez Sardo';
      const message=storyBanner.dataset[lang==='en'?'storyTextEn':'storyTextFa']||'';
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
      const ctx=canvas.getContext('2d');

      const bg=ctx.createLinearGradient(0,0,1080,1920);
      bg.addColorStop(0,'#08111f');bg.addColorStop(.52,'#10233b');bg.addColorStop(1,'#071019');
      ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);

      const glow=ctx.createRadialGradient(810,280,40,810,280,520);
      glow.addColorStop(0,'rgba(240,190,92,.32)');glow.addColorStop(1,'rgba(240,190,92,0)');
      ctx.fillStyle=glow;ctx.fillRect(0,0,1080,900);

      ctx.strokeStyle='rgba(232,188,103,.24)';ctx.lineWidth=3;
      roundedRect(ctx,72,90,936,1740,54);ctx.stroke();

      // Decorative autumn dots/leaves
      ctx.fillStyle='rgba(210,116,48,.9)';
      [[120,270,16],[930,360,13],[150,1500,12],[900,1420,18],[840,240,9]].forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],p[2],0,Math.PI*2);ctx.fill();});

      // Brand
      ctx.textAlign=lang==='en'?'left':'right';ctx.direction=lang==='en'?'ltr':'rtl';
      ctx.fillStyle='#f0ca7b';ctx.font='800 34px Vazirmatn, sans-serif';
      ctx.fillText(lang==='en'?'NABEZ SARDO':'نبض ساردو',lang==='en'?110:970,170);
      ctx.fillStyle='rgba(232,238,247,.68)';ctx.font='500 21px Vazirmatn, sans-serif';
      ctx.fillText(lang==='en'?'LOCAL NEWSROOM':'رسانه محلی ساردوئیه و جنوب کرمان',lang==='en'?110:970,212);

      // School illustration card
      const cardX=120,cardY=310,cardW=840,cardH=640;
      const glass=ctx.createLinearGradient(cardX,cardY,cardX+cardW,cardY+cardH);
      glass.addColorStop(0,'rgba(255,255,255,.08)');glass.addColorStop(1,'rgba(255,255,255,.025)');
      ctx.fillStyle=glass;roundedRect(ctx,cardX,cardY,cardW,cardH,48);ctx.fill();
      ctx.strokeStyle='rgba(240,190,92,.28)';ctx.lineWidth=3;roundedRect(ctx,cardX,cardY,cardW,cardH,48);ctx.stroke();

      // Sun
      const sun=ctx.createRadialGradient(780,435,10,780,435,120);
      sun.addColorStop(0,'#ffe4a6');sun.addColorStop(.35,'#e9b75b');sun.addColorStop(1,'rgba(233,183,91,0)');
      ctx.fillStyle=sun;ctx.beginPath();ctx.arc(780,435,120,0,Math.PI*2);ctx.fill();

      // School icon
      ctx.strokeStyle='#e2b35b';ctx.lineWidth=20;ctx.lineJoin='round';ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(280,790);ctx.lineTo(280,570);ctx.lineTo(540,420);ctx.lineTo(800,570);ctx.lineTo(800,790);ctx.stroke();
      ctx.beginPath();ctx.moveTo(390,790);ctx.lineTo(390,670);ctx.lineTo(490,670);ctx.lineTo(490,790);ctx.moveTo(590,790);ctx.lineTo(590,670);ctx.lineTo(690,670);ctx.lineTo(690,790);ctx.stroke();
      ctx.strokeStyle='rgba(226,179,91,.45)';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(220,815);ctx.lineTo(860,815);ctx.stroke();
      ctx.strokeStyle='#f6dc9d';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(540,420);ctx.lineTo(540,340);ctx.lineTo(690,382);ctx.lineTo(540,420);ctx.stroke();

      // Title
      ctx.textAlign=lang==='en'?'left':'right';ctx.direction=lang==='en'?'ltr':'rtl';
      ctx.fillStyle='#f7efe0';ctx.font='900 72px Vazirmatn, sans-serif';
      const titleLines=wrapLines(ctx,title,850);
      let ty=1100;titleLines.slice(0,3).forEach(line=>{ctx.fillText(line,lang==='en'?115:965,ty);ty+=96;});

      // Gold rule
      const rule=ctx.createLinearGradient(120,0,960,0);rule.addColorStop(0,'rgba(225,177,86,0)');rule.addColorStop(.2,'#e1b156');rule.addColorStop(.8,'#e1b156');rule.addColorStop(1,'rgba(225,177,86,0)');
      ctx.fillStyle=rule;ctx.fillRect(120,ty+15,840,4);

      // Message
      ctx.fillStyle='#cfd6e0';ctx.font='500 34px Vazirmatn, sans-serif';
      const msgLines=wrapLines(ctx,message,840);
      let my=ty+95;msgLines.slice(0,5).forEach(line=>{ctx.fillText(line,lang==='en'?120:960,my);my+=58;});

      // Tags
      const tags=lang==='en'?['KNOWLEDGE','HOPE','FUTURE']:['دانش','امید','آینده'];
      ctx.textAlign='center';ctx.direction=lang==='en'?'ltr':'rtl';ctx.font='800 25px Vazirmatn, sans-serif';
      tags.forEach((tag,i)=>{
        const x=220+i*320,y=1570;
        ctx.fillStyle='rgba(255,255,255,.055)';roundedRect(ctx,x-115,y-40,230,80,40);ctx.fill();
        ctx.strokeStyle='rgba(225,177,86,.25)';ctx.lineWidth=2;roundedRect(ctx,x-115,y-40,230,80,40);ctx.stroke();
        ctx.fillStyle='#e6bf73';ctx.fillText(tag,x,y+9);
      });

      ctx.textAlign='center';ctx.direction='ltr';ctx.fillStyle='rgba(232,238,247,.56)';ctx.font='600 22px Arial, sans-serif';
      ctx.fillText('NABZESARDO.IR',540,1760);
      ctx.fillStyle='rgba(225,177,86,.9)';ctx.fillRect(365,1800,350,3);

      const dataUrl=canvas.toDataURL('image/png');
      const parts=dataUrl.split(','),mime='image/png',bin=atob(parts[1]);const bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      return new File([bytes],'nabez-sardo-mehr-story.png',{type:mime});
    };

    const nativeShare=storyBanner.querySelector('[data-story-native]');
    if(nativeShare)nativeShare.addEventListener('click',async()=>{
      const file=storyFile();
      try{
        if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
          await navigator.share({files:[file],title:'Nabez Sardo',text:root.dataset.lang==='en'?'Nabez Sardo story':'استوری نبض ساردو'});
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