document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-confirm]').forEach(form=>{
    form.addEventListener('submit',e=>{
      const msg=form.getAttribute('data-confirm')||'مطمئن هستید؟';
      if(!confirm(msg))e.preventDefault();
    });
  });


  // ==================== UNIFIED ADMIN DRAWERS / V1 ====================
  // Keep every dashboard section compact by default without changing its forms or data.
  const dashboard=document.querySelector('.admin-dashboard-content');
  if(dashboard){
    const configs={
      overview:{no:'01',title:'نمای کلی',desc:'خلاصه وضعیت تحریریه و آمار سایت'},
      news:{no:'02',title:'مدیریت خبرها',desc:'ویرایش، حذف و بررسی وضعیت انتشار'},
      followups:{no:'03',title:'پیگیری تا نتیجه',desc:'وعده‌ها، پروژه‌ها و پرونده‌های پیگیری'},
      live:{no:'04',title:'نبض فوری',desc:'متن فوری و وضعیت LIVE DESK'},
      ads:{no:'05',title:'مدیریت تبلیغات',desc:'عنوان، تصویر و لینک جایگاه تبلیغاتی'},
      social:{no:'06',title:'شبکه‌های اجتماعی',desc:'وضعیت اتصال و انتشار هم‌زمان'},
      citizens:{no:'07',title:'خبرهای مردمی',desc:'گزارش‌ها و فایل‌های ارسالی مخاطبان'},
      messages:{no:'08',title:'پیام‌ها',desc:'پیام‌های دریافتی از فرم تماس'},
      backup:{no:'09',title:'پشتیبان‌گیری',desc:'دانلود، ساخت و بازیابی نسخه پشتیبان'}
    };
    const sidebarCount=id=>document.querySelector('.admin-sidebar-nav a[href="#'+id+'"] i')?.textContent?.trim()||'';
    const metaFor=(id,node)=>{
      if(id==='overview')return (sidebarCount('news')||'۰')+' خبر';
      if(id==='news')return (sidebarCount('news')||'۰')+' خبر';
      if(id==='followups')return (sidebarCount('followups')||'۰')+' پرونده';
      if(id==='live')return node.querySelector('.live-desk-admin-state b')?.textContent?.trim()||'وضعیت خبر فوری';
      if(id==='ads')return node.querySelector('input[name="adEnabled"]')?.checked?'فعال':'خاموش';
      if(id==='social')return String(node.querySelectorAll('.integration-card.ready').length)+' اتصال آماده';
      if(id==='citizens')return (sidebarCount('citizens')||'۰')+' مورد';
      if(id==='messages')return (sidebarCount('messages')||'۰')+' پیام';
      if(id==='backup')return String(node.querySelectorAll('.backup-list span').length)+' نسخه اخیر';
      return '';
    };
    const makeSummary=(cfg,meta)=>{
      const summary=document.createElement('summary');
      summary.className='admin-drawer-summary';

      const main=document.createElement('div');
      main.className='admin-drawer-summary-main';
      const no=document.createElement('span');
      no.className='admin-section-no';
      no.textContent=cfg.no;
      const copy=document.createElement('div');
      const h=document.createElement('h2');
      h.textContent=cfg.title;
      const p=document.createElement('p');
      p.textContent=cfg.desc;
      copy.append(h,p);
      main.append(no,copy);

      const metaEl=document.createElement('span');
      metaEl.className='admin-drawer-meta';
      metaEl.textContent=meta||'';

      const toggle=document.createElement('span');
      toggle.className='admin-drawer-toggle';
      const open=document.createElement('span');
      open.className='admin-drawer-open';
      open.textContent='باز کردن';
      const close=document.createElement('span');
      close.className='admin-drawer-close';
      close.textContent='بستن';
      const arrow=document.createElement('i');
      arrow.textContent='⌄';
      toggle.append(open,close,arrow);
      summary.append(main,metaEl,toggle);
      return summary;
    };

    [...dashboard.querySelectorAll('.admin-section-block')].forEach(node=>{
      const id=node.id;
      const cfg=configs[id];
      if(!cfg)return;
      if(node.tagName==='DETAILS'){
        node.classList.add('admin-drawer');
        node.setAttribute('data-admin-drawer','');
        node.open=false;
        const no=node.querySelector('.admin-section-no');
        if(no)no.textContent=cfg.no;
        return;
      }

      const details=document.createElement('details');
      details.id=id;
      details.className=node.className+' admin-drawer';
      details.setAttribute('data-admin-drawer','');

      const meta=metaFor(id,node);
      const summary=makeSummary(cfg,meta);
      const body=document.createElement('div');
      body.className='admin-drawer-body';

      const header=node.querySelector(':scope > .admin-section-title, :scope > .panel-head');
      if(header){
        const first=header.querySelector(':scope > div:first-child');
        if(first&&first.querySelector('h2'))first.remove();
        if(!header.children.length)header.remove();
      }

      while(node.firstChild)body.appendChild(node.firstChild);
      details.append(summary,body);
      node.replaceWith(details);
    });

    const drawers=[...dashboard.querySelectorAll('details[data-admin-drawer]')];
    drawers.forEach(drawer=>{
      drawer.addEventListener('toggle',()=>{
        if(!drawer.open)return;
        drawers.forEach(other=>{if(other!==drawer)other.open=false;});
      });
    });

    const openDrawer=id=>{
      const drawer=document.getElementById(id);
      if(!drawer||!drawer.matches('details[data-admin-drawer]'))return;
      drawer.open=true;
      requestAnimationFrame(()=>drawer.scrollIntoView({behavior:'smooth',block:'start'}));
    };
    document.querySelectorAll('.admin-sidebar-nav a[href^="#"]').forEach(link=>{
      link.addEventListener('click',()=>{
        const id=(link.getAttribute('href')||'').slice(1);
        if(id)setTimeout(()=>openDrawer(id),0);
      });
    });
    if(location.hash)setTimeout(()=>openDrawer(location.hash.slice(1)),0);
  }


  // ==================== PUBLICATION KIT / V1 ====================
  const copyAdminText=async value=>{
    const text=String(value||'');
    if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);
    else{
      const ta=document.createElement('textarea');
      ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
    }
  };
  document.querySelectorAll('[data-share-copy]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const box=btn.closest('.share-kit-copy'),field=box&&box.querySelector('[data-share-copy-text]');
      if(!field)return;
      try{
        await copyAdminText(field.value);
        const old=btn.textContent;btn.textContent='کپی شد ✓';btn.classList.add('is-copied');
        setTimeout(()=>{btn.textContent=old;btn.classList.remove('is-copied');},1500);
      }catch{}
    });
  });
  document.querySelectorAll('[data-copy-value]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      try{
        await copyAdminText(btn.dataset.copyValue||'');
        const old=btn.textContent;btn.textContent='کپی شد ✓';
        setTimeout(()=>btn.textContent=old,1400);
      }catch{}
    });
  });

  const shareStoryRoot=document.querySelector('[data-share-kit-story]');
  if(shareStoryRoot){
    const preview=shareStoryRoot.querySelector('[data-share-kit-story-preview]');
    const shareBtn=shareStoryRoot.querySelector('[data-share-kit-story-share]');
    const downloadBtn=shareStoryRoot.querySelector('[data-share-kit-story-download]');
    let storyFile=null,storyObjectUrl='';

    const roundRect=(ctx,x,y,w,h,r)=>{
      const q=Math.min(r,w/2,h/2);
      ctx.beginPath();ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);ctx.closePath();
    };
    const wrapLines=(ctx,value,maxWidth)=>{
      const words=String(value||'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';
      words.forEach(word=>{
        const test=line?line+' '+word:word;
        if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test;
      });
      if(line)lines.push(line);
      return lines;
    };
    const loadKitImage=src=>new Promise(resolve=>{
      if(!src){resolve(null);return;}
      const img=new Image();img.decoding='async';img.crossOrigin='anonymous';
      img.onload=()=>resolve(img);img.onerror=()=>resolve(null);
      try{img.src=new URL(src,location.origin).href}catch{resolve(null)}
    });
    const drawContain=(ctx,img,x,y,w,h)=>{
      ctx.fillStyle='#0b1118';roundRect(ctx,x,y,w,h,36);ctx.fill();
      if(!img)return;
      const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight);
      const dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;
      ctx.save();roundRect(ctx,x,y,w,h,36);ctx.clip();
      ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();
    };
    const buildStory=async()=>{
      try{if(document.fonts&&document.fonts.ready)await document.fonts.ready}catch{}
      const title=shareStoryRoot.dataset.storyTitle||'نبض ساردو';
      const lead=shareStoryRoot.dataset.storyLead||'';
      const category=shareStoryRoot.dataset.storyCategory||'خبر';
      const place=shareStoryRoot.dataset.storyLocation||'';
      const url=shareStoryRoot.dataset.storyUrl||location.origin;
      const img=await loadKitImage(shareStoryRoot.dataset.storyImage||'');
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');

      const bg=ctx.createLinearGradient(0,0,1080,1920);
      bg.addColorStop(0,'#070b11');bg.addColorStop(.55,'#111923');bg.addColorStop(1,'#080b10');
      ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);
      const glow=ctx.createRadialGradient(860,180,20,860,180,620);
      glow.addColorStop(0,'rgba(146,31,68,.34)');glow.addColorStop(.5,'rgba(210,169,92,.11)');glow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=glow;ctx.fillRect(0,0,1080,850);

      ctx.strokeStyle='rgba(218,177,99,.25)';ctx.lineWidth=3;roundRect(ctx,60,65,960,1790,46);ctx.stroke();
      ctx.direction='rtl';ctx.textAlign='right';
      ctx.fillStyle='#f0c978';ctx.font='900 50px Vazirmatn, Tahoma, sans-serif';ctx.fillText('نبض ساردو',980,145);
      ctx.fillStyle='rgba(230,235,242,.66)';ctx.font='600 22px Vazirmatn, Tahoma, sans-serif';ctx.fillText('رسانه محلی ساردوئیه و جنوب کرمان',980,190);
      ctx.fillStyle='#d7ae63';ctx.fillRect(800,215,180,4);

      drawContain(ctx,img,90,255,900,710);
      ctx.strokeStyle='rgba(218,177,99,.22)';ctx.lineWidth=3;roundRect(ctx,90,255,900,710,36);ctx.stroke();

      ctx.font='800 24px Vazirmatn, Tahoma, sans-serif';
      const pillW=Math.min(340,Math.max(160,ctx.measureText(category).width+70));
      ctx.fillStyle='rgba(130,29,60,.88)';roundRect(ctx,990-pillW,1012,pillW,58,29);ctx.fill();
      ctx.fillStyle='#f0d49a';ctx.textAlign='center';ctx.fillText(category,990-pillW/2,1051);

      ctx.textAlign='right';ctx.direction='rtl';
      const titleFont=title.length>95?56:title.length>62?63:70;
      ctx.fillStyle='#f7f1e8';ctx.font='900 '+titleFont+'px Vazirmatn, Tahoma, sans-serif';
      let y=1172;
      wrapLines(ctx,title,880).slice(0,4).forEach(line=>{ctx.fillText(line,980,y);y+=titleFont*1.36;});

      if(lead){
        y+=12;ctx.fillStyle='rgba(224,230,238,.78)';ctx.font='600 29px Vazirmatn, Tahoma, sans-serif';
        wrapLines(ctx,lead,870).slice(0,4).forEach(line=>{if(y<1605){ctx.fillText(line,980,y);y+=47;}});
      }
      if(place){
        ctx.fillStyle='rgba(224,230,238,.5)';ctx.font='700 22px Vazirmatn, Tahoma, sans-serif';ctx.fillText('📍 '+place,980,1650);
      }

      ctx.fillStyle='rgba(218,173,91,.08)';roundRect(ctx,90,1690,900,112,24);ctx.fill();
      ctx.strokeStyle='rgba(224,182,109,.20)';ctx.lineWidth=2;roundRect(ctx,90,1690,900,112,24);ctx.stroke();
      ctx.fillStyle='#efc77a';ctx.font='900 24px Vazirmatn, Tahoma, sans-serif';ctx.fillText('ادامه خبر در سایت نبض ساردو',955,1735);
      ctx.direction='ltr';ctx.textAlign='right';ctx.fillStyle='#f2f5f8';ctx.font='700 19px Arial, sans-serif';ctx.fillText(url,955,1773);

      ctx.textAlign='center';ctx.fillStyle='rgba(229,235,242,.42)';ctx.font='700 18px Arial, sans-serif';ctx.fillText('NABZESARDO.IR',540,1840);

      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob)throw new Error('blob');
      storyFile=new File([blob],'nabez-sardo-story.png',{type:'image/png',lastModified:Date.now()});
      if(storyObjectUrl)URL.revokeObjectURL(storyObjectUrl);
      storyObjectUrl=URL.createObjectURL(storyFile);
      const imgPreview=document.createElement('img');imgPreview.src=storyObjectUrl;imgPreview.alt='پیش‌نمایش استوری خبر';
      preview.replaceChildren(imgPreview);
      shareBtn.disabled=false;downloadBtn.disabled=false;
    };

    buildStory().catch(()=>{
      if(preview)preview.textContent='ساخت استوری انجام نشد؛ تصویر خبر را بررسی کن.';
    });

    downloadBtn.addEventListener('click',()=>{
      if(!storyFile||!storyObjectUrl)return;
      const a=document.createElement('a');a.href=storyObjectUrl;a.download=storyFile.name;a.click();
    });
    shareBtn.addEventListener('click',async()=>{
      if(!storyFile)return;
      try{
        if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[storyFile]}))){
          await navigator.share({files:[storyFile],title:shareStoryRoot.dataset.storyTitle||'نبض ساردو',text:shareStoryRoot.dataset.storyUrl||''});
        }else downloadBtn.click();
      }catch(err){if(err&&err.name!=='AbortError')downloadBtn.click();}
    });
    addEventListener('beforeunload',()=>{if(storyObjectUrl)URL.revokeObjectURL(storyObjectUrl);},{once:true});
  }

  const cleanSingleLine=value=>String(value||'').replace(/\u00a0/g,' ').replace(/[\t\r\n]+/g,' ').replace(/ {2,}/g,' ').trim();
  const escapeEditorHtml=value=>String(value||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const plainToParagraphHtml=text=>{
    const normalized=String(text||'').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ');
    const lines=normalized.split(/\n+/).map(part=>cleanSingleLine(part)).filter(Boolean);
    return lines.map(part=>'<p>'+escapeEditorHtml(part)+'</p>').join('');
  };

  async function uploadImage(file,statusEl){
    if(!file)throw new Error('فایلی انتخاب نشده است');
    if(file.size>10*1024*1024)throw new Error('حجم عکس باید کمتر از ۱۰ مگابایت باشد.');
    if(statusEl){statusEl.hidden=false;statusEl.textContent='در حال آپلود '+file.name+' ...';}
    const fd=new FormData();fd.append('image',file);
    const res=await fetch('/admin/upload/image',{method:'POST',body:fd,credentials:'same-origin'});
    let data={};try{data=await res.json()}catch{}
    if(!res.ok||!data.ok)throw new Error(data.error||'آپلود تصویر ناموفق بود.');
    if(statusEl)statusEl.textContent='آپلود انجام شد ✓';
    return data.url;
  }

  document.querySelectorAll('[data-editor]').forEach(box=>{
    const area=box.querySelector('[data-rich-area]');
    const input=box.querySelector('[data-rich-input]');
    const inlineBtn=box.querySelector('[data-insert-image]');
    const inlineFile=box.querySelector('[data-inline-file]');
    const inlineStatus=box.querySelector('[data-inline-status]');
    if(!area||!input)return;
    let savedRange=null;
    const sync=()=>{input.value=area.innerHTML.trim();};
    const saveRange=()=>{
      const sel=window.getSelection();
      if(sel&&sel.rangeCount&&area.contains(sel.anchorNode))savedRange=sel.getRangeAt(0).cloneRange();
    };
    const focus=()=>{area.focus();};
    function normalizeEditorDom(){
      const walker=document.createTreeWalker(area,NodeFilter.SHOW_TEXT);
      const nodes=[];
      while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(node=>{
        node.nodeValue=String(node.nodeValue||'').replace(/\u00a0/g,' ').replace(/[\t\r\n]+/g,' ').replace(/ {2,}/g,' ');
      });
      area.querySelectorAll('p,div,li,blockquote,h2,h3').forEach(block=>{
        block.removeAttribute('align');
        block.style.removeProperty('margin-left');
        block.style.removeProperty('margin-right');
        block.style.removeProperty('padding-left');
        block.style.removeProperty('padding-right');
        if(block.getAttribute('dir')!=='ltr')block.setAttribute('dir','rtl');
        if(block.style.textAlign==='left'||block.style.textAlign==='center'||block.style.textAlign==='right'||block.style.textAlign==='justify')block.style.removeProperty('text-align');
      });
      area.querySelectorAll('p,div').forEach(block=>{
        const meaningful=block.querySelector('img')||cleanSingleLine(block.textContent||'');
        if(!meaningful&&block!==area)block.remove();
      });
      area.querySelectorAll('br + br').forEach(br=>br.remove());
      area.normalize();
    }

    box.querySelectorAll('[data-cmd]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        focus();
        document.execCommand(btn.dataset.cmd,false,null);
        sync();saveRange();
      });
    });

    function currentBlock(){
      const sel=window.getSelection();
      if(!sel||!sel.rangeCount)return area;
      let n=sel.anchorNode;if(n&&n.nodeType===3)n=n.parentElement;
      while(n&&n!==area){if(/^(P|DIV|LI|H2|H3|BLOCKQUOTE)$/.test(n.tagName))return n;n=n.parentElement;}
      return area;
    }
    box.querySelectorAll('[data-dir]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        focus();const dir=btn.dataset.dir,block=currentBlock();
        block.setAttribute('dir',dir);block.style.textAlign=dir==='rtl'?'right':'left';sync();saveRange();
      });
    });
    function applyWeight(weight){
      focus();const sel=window.getSelection();
      if(!sel||!sel.rangeCount||sel.isCollapsed)return;
      const range=sel.getRangeAt(0),span=document.createElement('span');span.style.fontWeight=weight;
      try{range.surroundContents(span)}catch{span.appendChild(range.extractContents());range.insertNode(span)}
      sel.removeAllRanges();const r=document.createRange();r.selectNodeContents(span);sel.addRange(r);sync();saveRange();
    }
    box.querySelectorAll('[data-weight]').forEach(btn=>btn.addEventListener('click',()=>applyWeight(btn.dataset.weight)));

    const fontPicker=box.querySelector('[data-font-family]');
    if(fontPicker){
      fontPicker.addEventListener('change',()=>{
        focus();
        const family=fontPicker.value||'Vazirmatn';
        document.execCommand('fontName',false,family);
        sync();saveRange();
      });
    }

    area.addEventListener('keyup',saveRange);area.addEventListener('mouseup',saveRange);area.addEventListener('input',()=>{sync();saveRange()});
    area.addEventListener('paste',event=>{
      const text=event.clipboardData&&event.clipboardData.getData('text/plain');
      if(!text)return;
      event.preventDefault();
      const html=plainToParagraphHtml(text);
      if(html)document.execCommand('insertHTML',false,html);
      normalizeEditorDom();sync();saveRange();
    });
    if(inlineBtn&&inlineFile){
      inlineBtn.addEventListener('click',()=>{saveRange();inlineFile.click();});
      inlineFile.addEventListener('change',async()=>{
        const file=inlineFile.files&&inlineFile.files[0];if(!file)return;
        inlineBtn.disabled=true;
        try{
          const url=await uploadImage(file,inlineStatus);
          focus();
          const img=document.createElement('img');img.src=url;img.alt=file.name||'تصویر خبر';
          const p=document.createElement('p');p.appendChild(img);
          if(savedRange&&area.contains(savedRange.commonAncestorContainer)){
            savedRange.deleteContents();savedRange.insertNode(p);savedRange.setStartAfter(p);savedRange.collapse(true);
            const sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedRange);
          }else area.appendChild(p);
          sync();
        }catch(err){if(inlineStatus){inlineStatus.hidden=false;inlineStatus.textContent=err.message}else alert(err.message)}
        finally{inlineBtn.disabled=false;inlineFile.value='';setTimeout(()=>{if(inlineStatus)inlineStatus.hidden=true},2500);}
      });
    }
    const form=area.closest('form');if(form)form.addEventListener('submit',()=>{normalizeEditorDom();sync();});sync();
  });

  const autoTextFields=document.querySelectorAll('input[name="title"],textarea[name="lead"],input[name="author"],input[name="location"]');
  const normalizeField=field=>{field.value=cleanSingleLine(field.value);};
  autoTextFields.forEach(field=>{
    field.addEventListener('blur',()=>normalizeField(field));
    field.addEventListener('paste',()=>setTimeout(()=>normalizeField(field),0));
  });
  document.querySelectorAll('form[data-rich-form]').forEach(form=>{
    form.addEventListener('submit',e=>{
      if(form.dataset.saving==='1'){e.preventDefault();return;}
      autoTextFields.forEach(normalizeField);
      form.dataset.saving='1';
      const btn=form.querySelector('[data-save-news]');
      const status=form.querySelector('[data-save-status]');
      if(btn){
        btn.disabled=true;
        btn.dataset.originalText=btn.textContent;
        btn.textContent='در حال ذخیره خبر…';
      }
      if(status){
        status.textContent='در حال ارسال و ذخیره خبر…';
        status.classList.add('is-saving');
      }
    });
  });

  document.querySelectorAll('[data-image-input]').forEach(input=>{
    input.addEventListener('change',()=>{
      const file=input.files&&input.files[0];if(!file)return;
      if(file.size>10*1024*1024){alert('حجم عکس باید کمتر از ۱۰ مگابایت باشد.');input.value='';return;}
      const root=input.closest('.image-upload');
      const img=root?.querySelector('[data-image-preview]');
      const frame=root?.querySelector('[data-image-preview-frame]');
      const empty=root?.querySelector('[data-preview-empty]');
      if(!img)return;
      const reader=new FileReader();
      reader.onload=()=>{
        const probe=new Image();
        probe.onload=()=>{
          const w=probe.naturalWidth||16,h=probe.naturalHeight||9,ratio=w/h;
          if(frame){
            frame.style.setProperty('--preview-ratio',String(ratio));
            frame.classList.remove('portrait','square','landscape');
            frame.classList.add(ratio<.92?'portrait':ratio>1.08?'landscape':'square');
          }
          img.src=reader.result;img.hidden=false;if(empty)empty.hidden=true;
        };
        probe.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  });

  document.querySelectorAll('[data-video-input]').forEach(input=>{
    input.addEventListener('change',()=>{
      const file=input.files&&input.files[0];if(!file)return;
      const allowed=new Set(['video/mp4','video/webm','video/quicktime']);
      if(!allowed.has(file.type)){alert('فرمت ویدئو باید MP4، WebM یا MOV باشد.');input.value='';return;}
      if(file.size>50*1024*1024){alert('حجم ویدئو باید کمتر از ۵۰ مگابایت باشد.');input.value='';return;}
      const root=input.closest('.video-upload-panel');
      const video=root?.querySelector('[data-video-preview]');
      const empty=root?.querySelector('[data-video-empty]');
      if(!video)return;
      const url=URL.createObjectURL(file);
      const old=video.dataset.previewUrl;
      if(old)URL.revokeObjectURL(old);
      video.dataset.previewUrl=url;
      video.src=url;video.hidden=false;
      if(empty)empty.hidden=true;
    });
  });

  document.querySelectorAll('[data-gallery]').forEach(box=>{
    const input=box.querySelector('[data-gallery-input]'),list=box.querySelector('[data-gallery-list]');
    const hidden=box.querySelector('[data-gallery-json]'),status=box.querySelector('[data-gallery-status]');
    if(!input||!list||!hidden)return;
    const urls=()=>[...list.querySelectorAll('[data-url]')].map(x=>x.dataset.url).filter(Boolean);
    const sync=()=>{hidden.value=JSON.stringify(urls());};
    const bindRemove=item=>{
      item.querySelector('[data-gallery-remove]')?.addEventListener('click',()=>{item.remove();sync();});
    };
    [...list.querySelectorAll('.gallery-item')].forEach(bindRemove);
    input.addEventListener('change',async()=>{
      const files=[...(input.files||[])];if(!files.length)return;
      input.disabled=true;
      for(const file of files){
        try{
          const url=await uploadImage(file,status);
          const item=document.createElement('div');item.className='gallery-item';item.dataset.url=url;
          const img=document.createElement('img');img.src=url;img.alt=file.name||'تصویر گالری';
          const btn=document.createElement('button');btn.type='button';btn.dataset.galleryRemove='';btn.textContent='×';
          item.append(img,btn);list.appendChild(item);bindRemove(item);sync();
        }catch(err){if(status){status.hidden=false;status.textContent=err.message}}
      }
      input.disabled=false;input.value='';setTimeout(()=>{if(status)status.hidden=true},2500);
    });
    sync();
  });

  document.querySelectorAll('[data-status-select]').forEach(select=>{
    const form=select.closest('form'),wrap=form?.querySelector('[data-schedule-wrap]'),field=wrap?.querySelector('input[name="scheduledAt"]');
    const refresh=()=>{const on=select.value==='scheduled';if(wrap)wrap.hidden=!on;if(field)field.required=on;};
    select.addEventListener('change',refresh);refresh();
  });


});