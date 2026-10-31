/* Nabez Sardo / sitewide glass navigation. Progressive enhancement only. */
(function(){
 'use strict';
 const run=()=>{
   const button=document.querySelector('[data-ns4-menu-toggle]');
   const nav=document.getElementById('ns4-main-nav');
   if(!button||!nav)return;
   const close=()=>{button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','باز کردن منوی سایت');nav.classList.remove('ns4-open');};
   button.addEventListener('click',()=>{
     const open=button.getAttribute('aria-expanded')!=='true';
     nav.classList.toggle('ns4-open',open);
     button.setAttribute('aria-expanded',String(open));
     button.setAttribute('aria-label',open?'بستن منوی سایت':'باز کردن منوی سایت');
   });
   nav.addEventListener('click',e=>{if(e.target.closest('a'))close();});
   document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!button.contains(e.target))close();});
   document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
   window.addEventListener('resize',()=>{if(innerWidth>1000)close();},{passive:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
