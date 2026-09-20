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