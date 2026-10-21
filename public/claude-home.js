(()=>{
  const $=id=>document.getElementById(id);
  const st=$('stage'),dots=$('dots');
  if(st){
    const cards=[...st.querySelectorAll('[data-slide]')];
    let index=0,startX=null,faves={},autoTimer=null,autoPaused=false;
    try{faves=JSON.parse(localStorage.getItem('nabez-claude-faves')||'{}')||{}}catch{}
    const syncPlayer=()=>{
      const c=cards[index];if(!c)return;
      if($('pt'))$('pt').textContent=c.dataset.cat||'نبض ساردو';
      if($('ps'))$('ps').textContent=(c.dataset.time||'')+' · نبض ساردو';
      if($('hv'))$('hv').classList.toggle('on',!!faves[c.dataset.url]);
    };
    const layout=()=>{
      if(!cards.length)return;
      const width=cards[0].offsetWidth||300;
      cards.forEach((c,k)=>{
        const o=k-index,a=Math.abs(o);
        c.style.transform=`translate(-50%,-50%) translateX(${-o*(a>1?.8:.74)*width}px) translateZ(${-a*90}px) rotateY(${-o*30}deg) scale(${a?1-a*.11:1})`;
        c.style.opacity=a>2?0:1-a*.18;
        c.style.zIndex=String(10-a);
        c.style.pointerEvents=a>2?'none':'auto';
        c.classList.toggle('on',a===0);
        c.setAttribute('aria-hidden',a?'true':'false');
        c.tabIndex=a===0?0:-1;
        c.querySelectorAll('a,button').forEach(el=>{el.tabIndex=a===0?0:-1});
        if(dots&&dots.children[k]){
          dots.children[k].className=a?'':'on';
          dots.children[k].setAttribute('aria-current',a?'false':'true');
        }
      });
      syncPlayer();
    };
    const normalize=n=>cards.length?((n%cards.length)+cards.length)%cards.length:0;
    const scheduleAuto=()=>{
      clearTimeout(autoTimer);
      if(cards.length<2||document.hidden||autoPaused||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      autoTimer=setTimeout(()=>{go(index+1)},6000);
    };
    const go=(n)=>{
      index=normalize(n);
      layout();
      scheduleAuto();
    };
    cards.forEach((c,k)=>{
      c.addEventListener('click',e=>{if(k!==index){e.preventDefault();go(k)}});
      c.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&k!==index){e.preventDefault();go(k)}});
      if(matchMedia('(pointer:fine)').matches)c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');c.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%')});
    });
    if($('nx'))$('nx').addEventListener('click',()=>go(index+1));
    if($('pv'))$('pv').addEventListener('click',()=>go(index-1));
    if(dots)[...dots.querySelectorAll('[data-dot]')].forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.dot||0))));
    if($('ap'))$('ap').addEventListener('click',()=>{
      autoPaused=!autoPaused;
      $('ap').setAttribute('aria-pressed',autoPaused?'true':'false');
      $('ap').setAttribute('aria-label',autoPaused?'ادامه چرخش خودکار':'توقف چرخش خودکار');
      if($('apx'))$('apx').textContent=autoPaused?'▶':'Ⅱ';
      if(autoPaused)clearTimeout(autoTimer);else scheduleAuto();
    });
    if($('hv'))$('hv').addEventListener('click',()=>{const c=cards[index];if(!c)return;faves[c.dataset.url]=!faves[c.dataset.url];try{localStorage.setItem('nabez-claude-faves',JSON.stringify(faves))}catch{}syncPlayer()});
    st.addEventListener('pointerdown',e=>{startX=e.clientX});
    st.addEventListener('pointerup',e=>{if(startX===null)return;const d=e.clientX-startX;startX=null;if(Math.abs(d)>45)go(index+(d<0?1:-1))});
    document.addEventListener('keydown',e=>{if(e.target&&['INPUT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='ArrowLeft')go(index+1);if(e.key==='ArrowRight')go(index-1)});
    addEventListener('resize',layout,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(autoTimer);else scheduleAuto()});
    st.addEventListener('mouseenter',()=>clearTimeout(autoTimer));
    st.addEventListener('mouseleave',scheduleAuto);
    requestAnimationFrame(()=>{layout();scheduleAuto()});
  }
  const share=$('sh');
  if(share)share.addEventListener('click',async()=>{
    try{if(navigator.share)await navigator.share({title:'نبض ساردو',url:location.href});else if(navigator.clipboard)await navigator.clipboard.writeText(location.href)}catch{}
  });
  document.querySelectorAll('.th [data-a]').forEach(b=>b.addEventListener('click',()=>{
    const a=b.dataset.a||'gold';document.documentElement.dataset.accent=a;try{localStorage.setItem('nabez-claude-accent',a)}catch{}
  }));
  const mt=$('mt'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(mt&&!reduce)addEventListener('scroll',()=>{mt.style.transform=`translateY(${Math.min(scrollY*.18,60)}px)`},{passive:true});
})();