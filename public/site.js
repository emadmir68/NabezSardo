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