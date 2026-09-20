document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-confirm]').forEach(form=>{
    form.addEventListener('submit',e=>{
      const msg=form.getAttribute('data-confirm')||'مطمئن هستید؟';
      if(!confirm(msg))e.preventDefault();
    });
  });

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

    area.addEventListener('keyup',saveRange);area.addEventListener('mouseup',saveRange);area.addEventListener('input',()=>{sync();saveRange()});
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
    const form=area.closest('form');if(form)form.addEventListener('submit',sync);sync();
  });

  document.querySelectorAll('[data-image-input]').forEach(input=>{
    input.addEventListener('change',()=>{
      const file=input.files&&input.files[0];if(!file)return;
      if(file.size>10*1024*1024){alert('حجم عکس باید کمتر از ۱۰ مگابایت باشد.');input.value='';return;}
      const img=input.closest('.image-upload')?.querySelector('[data-image-preview]');
      const empty=input.closest('.image-upload')?.querySelector('[data-preview-empty]');
      if(!img)return;const reader=new FileReader();
      reader.onload=()=>{img.src=reader.result;img.hidden=false;if(empty)empty.hidden=true;};reader.readAsDataURL(file);
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