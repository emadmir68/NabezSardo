/* Cloud Dancer 2026 — progressive enhancement. Homepage works without JS. */
(function(){
  'use strict';
  var menu=document.getElementById('ns26-menu-button');
  var nav=document.getElementById('ns26-nav');
  var searchButton=document.getElementById('ns26-search-button');
  var search=document.getElementById('ns26-search');
  if(!menu||!nav||!searchButton||!search)return;
  function closeMenu(){nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');}
  function closeSearch(){search.hidden=true;searchButton.setAttribute('aria-expanded','false');}
  menu.addEventListener('click',function(){
    var open=!nav.classList.contains('is-open');
    closeSearch();
    nav.classList.toggle('is-open',open);
    menu.setAttribute('aria-expanded',String(open));
  });
  searchButton.addEventListener('click',function(){
    var open=search.hidden;
    closeMenu();
    search.hidden=!open;
    searchButton.setAttribute('aria-expanded',String(open));
    if(open){var input=search.querySelector('input');if(input)input.focus();}
  });
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape'){closeMenu();closeSearch();}});
  document.addEventListener('click',function(ev){
    if(!nav.contains(ev.target)&&!menu.contains(ev.target))closeMenu();
    if(!search.contains(ev.target)&&!searchButton.contains(ev.target))closeSearch();
  });
  window.addEventListener('resize',function(){if(innerWidth>900)closeMenu();},{passive:true});
})();