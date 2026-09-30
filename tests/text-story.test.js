const test=require('node:test');
const assert=require('node:assert/strict');
const {wrapText,paginateStory,storyParagraphs}=require('../public/text-story');
const measure=(text,font)=>Array.from(text).length*font*.48;

test('full text flows into numbered story pages without omissions or overflowing the safe area',()=>{
  const body=Array.from({length:120},(_,i)=>'بند '+i+' ـ خبر مردم ساردوئیه و جنوب کرمان با جزئیات کامل.').join('\n\n')+'\n\nپایان واقعی خبر';
  const input={title:'متن کامل خبر منطقه',lead:'خلاصه مستقل',body};
  const pages=paginateStory(input,measure);
  assert.ok(pages.length>1);
  const items=pages.flatMap(p=>p.items);
  const normalize=s=>s.replace(/\s+/g,' ').trim();
  assert.equal(normalize(items.map(i=>i.text).join(' ')),normalize([input.title,input.lead,body].join(' ')));
  assert.ok(items.some(i=>i.text.includes('پایان واقعی خبر')));
  for(const page of pages)for(const item of page.items){
    assert.ok(item.y>=300);
    assert.ok(item.y+item.height<=1650);
    assert.ok(measure(item.text,item.font)<=880);
  }
});

test('long words wrap by grapheme without dropping characters or splitting joined emoji',()=>{
  const long='نشانیبسیارطولانی'.repeat(8)+'👨‍👩‍👧‍👦'.repeat(3);
  const lines=wrapText(long,150,t=>Array.from(t).length*10);
  assert.equal(lines.join(''),long);
  assert.ok(lines.every(line=>Array.from(line).length*10<=150));
  assert.ok(lines.filter(line=>line.includes('👨')).every(line=>line.includes('👨‍👩‍👧‍👦')));
});

test('the deck is included once when it is already the first paragraph of the body',()=>{
  assert.deepEqual(storyParagraphs({lead:'این   خلاصه خبر است.',body:'این خلاصه خبر است.\n\nبند بعدی'}),['این خلاصه خبر است.','بند بعدی']);
  assert.deepEqual(storyParagraphs({lead:'خلاصه جدا',body:'متن کامل'}),['خلاصه جدا','متن کامل']);
  assert.deepEqual(storyParagraphs({lead:'فقط خلاصه',body:''}),['فقط خلاصه']);
});

test('very long titles also paginate instead of being clipped or shrinking the body font',()=>{
  const title='تیتر طولانی '.repeat(240);
  const pages=paginateStory({title,body:'متن انتهایی'},measure);
  assert.ok(pages.length>1);
  assert.equal(pages.flatMap(p=>p.items).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim(),(title+' متن انتهایی').replace(/\s+/g,' ').trim());
  assert.ok(pages.flatMap(p=>p.items).filter(i=>i.kind==='body').every(i=>i.font===52));
});

test('rich text is read in full with paragraph breaks and HTML entities already decoded by the DOM',()=>{
 const {extractText}=require('../public/text-story');
 const text=value=>({nodeType:3,nodeValue:value});
 const node=(tag,...children)=>({nodeType:1,tagName:tag,childNodes:children,getAttribute:()=>null});
 const body=node('DIV',node('P',text('بند اول & خبر'),node('STRONG',text(' مهم'))),node('P',text('بند دوم'),node('BR'),text('ادامهٔ کامل')),node('SCRIPT',text('do not include')),node('STYLE',text('CSS')));
 assert.equal(extractText(body),'بند اول & خبر مهم\n\nبند دوم\nادامهٔ کامل');
});
test('the all-pages download is a standard ZIP containing every ordered page and valid CRC checksums',async()=>{
 const {zipFiles,crc32}=require('../public/text-story');
 assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
 const files=[1,2,3].map(i=>({name:'story-00'+i+'.png',arrayBuffer:async()=>new TextEncoder().encode('page '+i).buffer}));
 const blob=await zipFiles(files),bytes=new Uint8Array(await blob.arrayBuffer()),view=new DataView(bytes.buffer);
 let position=0;
 for(let i=0;i<files.length;i++){
  assert.equal(view.getUint32(position,true),0x04034b50);
  assert.equal(view.getUint16(position+8,true),0);
  const size=view.getUint32(position+18,true),nameLength=view.getUint16(position+26,true);
  const name=new TextDecoder().decode(bytes.slice(position+30,position+30+nameLength));
  assert.equal(name,files[i].name);
  const data=bytes.slice(position+30+nameLength,position+30+nameLength+size);
  assert.equal(new TextDecoder().decode(data),'page '+(i+1));
  assert.equal(view.getUint32(position+14,true),crc32(data));
  position+=30+nameLength+size;
 }
 assert.equal(view.getUint32(position,true),0x02014b50);
 assert.equal(view.getUint32(bytes.length-22,true),0x06054b50);
 assert.equal(view.getUint16(bytes.length-12,true),files.length);
});
