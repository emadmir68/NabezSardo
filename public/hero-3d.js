(() => {
  const root=document.querySelector('[data-news-coverflow]');
  if(!root)return;

  const stage=root.querySelector('[data-cover-stage]');
  const slides=[...root.querySelectorAll('[data-cover-slide]')];
  const dots=[...root.querySelectorAll('[data-cover-dot]')];
  const prevButtons=[...root.querySelectorAll('[data-cover-prev]')];
  const nextButtons=[...root.querySelectorAll('[data-cover-next]')];
  const bg=root.querySelector('[data-cover-bg]');
  const focusImage=root.querySelector('[data-cover-focus-image]');
  const focusTitle=root.querySelector('[data-cover-focus-title]');
  const focusCat=root.querySelector('[data-cover-focus-cat]');
  if(!stage||!slides.length)return;

  let active=Math.max(0,slides.findIndex(x=>x.classList.contains('is-active')));
  let pointerId=null,startX=0,startY=0,dragged=false,autoTimer=null;
  const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrap=n=>(n%slides.length+slides.length)%slides.length;

  function distance(index,current){
    let d=index-current;
    const half=slides.length/2;
    if(d>half)d-=slides.length;
    if(d<-half)d+=slides.length;
    return d;
  }

  function refreshAuto(){
    if(reduceMotion||slides.length<2)return;
    clearInterval(autoTimer);
    autoTimer=setInterval(()=>setActive(active+1),7000);
  }

  function setBackground(slide){
    if(!bg||!slide)return;
    const src=slide.dataset.bg;
    if(!src||bg.getAttribute('src')===src)return;
    root.classList.add('is-shifting');
    const probe=new Image();
    probe.onload=()=>{
      bg.src=src;
      requestAnimationFrame(()=>setTimeout(()=>root.classList.remove('is-shifting'),80));
    };
    probe.onerror=()=>root.classList.remove('is-shifting');
    probe.src=src;
  }

  function updateFocus(slide){
    if(!slide)return;
    const img=slide.dataset.thumb||slide.dataset.bg||'';
    if(focusImage&&img)focusImage.src=img;
    if(focusTitle)focusTitle.textContent=slide.dataset.title||'';
    if(focusCat)focusCat.textContent=slide.dataset.cat||'خبر';
  }

  function setActive(index,opts={}){
    active=wrap(index);
    slides.forEach((slide,i)=>{
      const d=distance(i,active);
      slide.classList.remove('is-active','is-pos--2','is-pos--1','is-pos-1','is-pos-2','is-far');
      slide.classList.add(d===0?'is-active':Math.abs(d)<=2?'is-pos-'+d:'is-far');
      slide.setAttribute('aria-current',d===0?'true':'false');
      slide.setAttribute('tabindex',Math.abs(d)<=1?'0':'-1');
    });
    dots.forEach((dot,i)=>{
      dot.classList.toggle('is-active',i===active);
      dot.setAttribute('aria-pressed',i===active?'true':'false');
    });
    setBackground(slides[active]);
    updateFocus(slides[active]);
    if(opts.focus)slides[active].focus({preventScroll:true});
    refreshAuto();
  }

  slides.forEach((slide,i)=>{
    slide.addEventListener('click',ev=>{
      if(dragged){ev.preventDefault();return;}
      if(i!==active){ev.preventDefault();setActive(i);}
    });
  });
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>setActive(i)));
  prevButtons.forEach(btn=>btn.addEventListener('click',()=>setActive(active-1)));
  nextButtons.forEach(btn=>btn.addEventListener('click',()=>setActive(active+1)));

  stage.addEventListener('keydown',ev=>{
    if(ev.key==='ArrowLeft'){ev.preventDefault();setActive(active-1,{focus:true});}
    if(ev.key==='ArrowRight'){ev.preventDefault();setActive(active+1,{focus:true});}
    if(ev.key==='Home'){ev.preventDefault();setActive(0,{focus:true});}
    if(ev.key==='End'){ev.preventDefault();setActive(slides.length-1,{focus:true});}
  });

  stage.addEventListener('pointerdown',ev=>{
    if(ev.button!==undefined&&ev.button!==0)return;
    pointerId=ev.pointerId;startX=ev.clientX;startY=ev.clientY;dragged=false;
    stage.classList.add('is-dragging');
    try{stage.setPointerCapture(pointerId)}catch{}
    clearInterval(autoTimer);
  });
  stage.addEventListener('pointermove',ev=>{
    if(pointerId===null||ev.pointerId!==pointerId)return;
    const dx=ev.clientX-startX,dy=ev.clientY-startY;
    if(Math.abs(dx)>9&&Math.abs(dx)>Math.abs(dy))dragged=true;
  });
  const finish=ev=>{
    if(pointerId===null||ev.pointerId!==pointerId)return;
    const dx=ev.clientX-startX,dy=ev.clientY-startY;
    stage.classList.remove('is-dragging');
    try{stage.releasePointerCapture(pointerId)}catch{}
    pointerId=null;
    if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)){
      setActive(active+(dx<0?1:-1));
    }else refreshAuto();
    setTimeout(()=>{dragged=false},0);
  };
  stage.addEventListener('pointerup',finish);
  stage.addEventListener('pointercancel',finish);

  root.addEventListener('mouseenter',()=>clearInterval(autoTimer));
  root.addEventListener('mouseleave',refreshAuto);
  root.addEventListener('focusin',()=>clearInterval(autoTimer));
  root.addEventListener('focusout',ev=>{if(!root.contains(ev.relatedTarget))refreshAuto()});
  document.addEventListener('visibilitychange',()=>document.hidden?clearInterval(autoTimer):refreshAuto());

  setActive(active);
})();