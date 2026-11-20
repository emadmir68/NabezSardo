'use strict';
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

  /* -------------------------------------------------------------
     1. Language Switcher (Persian / English)
     ------------------------------------------------------------- */
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

  /* -------------------------------------------------------------
     2. Live Jalali Date & Clock
     ------------------------------------------------------------- */
  const updateClock=()=>{
    const lang=document.documentElement.dataset.lang==='en'?'en':'fa';
    const dateLocale=lang==='en'?'en-US-u-ca-persian':'fa-IR-u-ca-persian';
    const clockLocale=lang==='en'?'en-GB':'fa-IR';
    const now=new Date();
    $$('[data-jalali-date]').forEach(el=>{try{el.textContent=new Intl.DateTimeFormat(dateLocale,{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'}).format(now);}catch{}});
    $$('[data-live-clock]').forEach(el=>{try{el.textContent=new Intl.DateTimeFormat(clockLocale,{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Tehran'}).format(now);}catch{}});
  };
  updateClock();
  setInterval(updateClock,30000);

  /* -------------------------------------------------------------
     3. Real-time Live Views Counter
     ------------------------------------------------------------- */
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

  /* -------------------------------------------------------------
     4. Responsive Mobile Navigation Menu
     ------------------------------------------------------------- */
  $$('[data-menu-toggle]').forEach(button=>{
    button.addEventListener('click',()=>{
      const nav=$('[data-main-nav]');
      if(!nav)return;
      const open=nav.classList.toggle('is-open');
      button.setAttribute('aria-expanded',String(open));
    });
  });

  /* -------------------------------------------------------------
     5. Header Scroll Glass Intensity & Dynamic Floating
     ------------------------------------------------------------- */
  const header=$('.rb-header');
  if(header){
    let lastY=0;
    window.addEventListener('scroll',()=>{
      const y=window.scrollY;
      header.classList.toggle('is-scrolled',y>40);
      if(y>lastY+15&&y>180){
        header.style.transform='translateY(-100%)';
      }else if(y<lastY-8||y<=80){
        header.style.transform='translateY(0)';
      }
      lastY=y;
    },{passive:true});
  }

  /* -------------------------------------------------------------
     6. Social & Article Sharing Capabilities
     ------------------------------------------------------------- */
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
    const articleLead=String(articleRoot.dataset.articleLead||'').replace(/\s+/g,' ').trim();
    const articleUrl=new URL(articleRoot.dataset.articleUrl||location.href,location.origin).href;
    const articleImage=articleRoot.dataset.articleImage?new URL(articleRoot.dataset.articleImage,location.origin).href:'';
    const articleVideo=articleRoot.dataset.articleVideo?new URL(articleRoot.dataset.articleVideo,location.origin).href:'';
    const shareMessage=[articleTitle,articleLead,articleUrl].filter(Boolean).join('\n\n');
    if(location.pathname.startsWith('/news/')&&history.replaceState){
      try{const shortPath=new URL(articleUrl,location.origin);history.replaceState(history.state,'',shortPath.pathname+shortPath.search+location.hash);}catch{}
    }
    const copyText=async(value)=>{
      try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);return true;}}catch{}
      try{const area=document.createElement('textarea');area.value=value;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();return ok;}catch{return false;}
    };
    $$('[data-article-copy-message]',articleRoot).forEach(button=>{
      button.addEventListener('click',async()=>{
        const ok=await copyText(shareMessage);
        button.textContent=ok?'متن آماده کپی شد ✓':'کپی متن در دسترس نیست';
      });
    });
    $$('[data-article-share-image]',articleRoot).forEach(button=>{
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
    $$('[data-article-share-video]',articleRoot).forEach(button=>{
      button.addEventListener('click',async()=>{
        if(navigator.share){try{await navigator.share({title:articleTitle,text:shareMessage,url:articleVideo||articleUrl});return;}catch{}}
        const ok=await copyText(articleVideo||shareMessage);
        button.textContent=ok?'پیوند ویدئو کپی شد ✓':'اشتراک ویدئو در دسترس نیست';
      });
    });

    /* Reading Progress Bar */
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

  /* -------------------------------------------------------------
     7. 3D Card Hover / Parallax Tilt (Desktop only)
     ------------------------------------------------------------- */
  if(window.matchMedia('(hover: hover) and (pointer: fine)').matches){
    const cards=$$('.rb-story, .rb-hero-story');
    cards.forEach(card=>{
      card.addEventListener('mousemove',e=>{
        const rect=card.getBoundingClientRect();
        const x=(e.clientX-rect.left)/rect.width-0.5;
        const y=(e.clientY-rect.top)/rect.height-0.5;
        card.style.transform=`perspective(1000px) rotateY(${x*4}deg) rotateX(${-y*4}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave',()=>{
        card.style.transform='';
      });
    });
  }

  /* -------------------------------------------------------------
     8. Scroll Reveal Animations with IntersectionObserver
     ------------------------------------------------------------- */
  if('IntersectionObserver' in window){
    const revealObserver=new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});

    $$('.rb-story, .rb-category-tile, .rb-region-band, .rb-popular, .rb-briefs').forEach(el=>{
      el.style.opacity='0';
      el.style.transform='translateY(18px)';
      el.style.transition='opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      revealObserver.observe(el);
    });

    document.addEventListener('DOMContentLoaded',()=>{
      $$('.is-revealed').forEach(el=>{
        el.style.opacity='1';
        el.style.transform='translateY(0)';
      });
    });
    // Fallback for immediate items
    setTimeout(()=>{
      $$('.rb-story, .rb-category-tile, .rb-region-band, .rb-popular, .rb-briefs').forEach(el=>{
        el.style.opacity='1';
        el.style.transform='translateY(0)';
      });
    },500);
  }

  /* -------------------------------------------------------------
     9. Admin Helper Tools
     ------------------------------------------------------------- */
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
})();
