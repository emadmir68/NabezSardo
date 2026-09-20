document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-confirm]').forEach(form=>{
    form.addEventListener('submit',e=>{
      const msg=form.getAttribute('data-confirm')||'مطمئن هستید؟';
      if(!confirm(msg))e.preventDefault();
    });
  });

  document.querySelectorAll('[data-editor]').forEach(box=>{
    const area=box.querySelector('[data-rich-area]');
    const input=box.querySelector('[data-rich-input]');
    if(!area||!input)return;
    const sync=()=>{input.value=area.innerHTML.trim();};
    const focus=()=>{area.focus();};

    box.querySelectorAll('[data-cmd]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        focus();
        document.execCommand(btn.dataset.cmd,false,null);
        sync();
      });
    });

    function currentBlock(){
      const sel=window.getSelection();
      if(!sel||!sel.rangeCount)return area;
      let n=sel.anchorNode;
      if(n&&n.nodeType===3)n=n.parentElement;
      while(n&&n!==area){
        if(/^(P|DIV|LI|H2|H3|BLOCKQUOTE)$/.test(n.tagName))return n;
        n=n.parentElement;
      }
      return area;
    }

    box.querySelectorAll('[data-dir]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        focus();
        const dir=btn.dataset.dir,block=currentBlock();
        block.setAttribute('dir',dir);
        block.style.textAlign=dir==='rtl'?'right':'left';
        sync();
      });
    });

    function applyWeight(weight){
      focus();
      const sel=window.getSelection();
      if(!sel||!sel.rangeCount||sel.isCollapsed)return;
      const range=sel.getRangeAt(0);
      const span=document.createElement('span');
      span.style.fontWeight=weight;
      try{range.surroundContents(span)}
      catch{span.appendChild(range.extractContents());range.insertNode(span)}
      sel.removeAllRanges();
      const r=document.createRange();r.selectNodeContents(span);sel.addRange(r);
      sync();
    }
    box.querySelectorAll('[data-weight]').forEach(btn=>btn.addEventListener('click',()=>applyWeight(btn.dataset.weight)));

    area.addEventListener('input',sync);
    const form=area.closest('form');
    if(form)form.addEventListener('submit',sync);
    sync();
  });

  document.querySelectorAll('[data-image-input]').forEach(input=>{
    input.addEventListener('change',()=>{
      const file=input.files&&input.files[0];
      if(!file)return;
      if(file.size>10*1024*1024){alert('حجم عکس باید کمتر از ۱۰ مگابایت باشد.');input.value='';return;}
      const img=input.closest('.image-upload')?.querySelector('[data-image-preview]');
      const empty=input.closest('.image-upload')?.querySelector('[data-preview-empty]');
      if(!img)return;
      const reader=new FileReader();
      reader.onload=()=>{img.src=reader.result;img.hidden=false;if(empty)empty.hidden=true;};
      reader.readAsDataURL(file);
    });
  });
});