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
