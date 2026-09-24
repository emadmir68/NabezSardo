const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
process.env.PUBLIC_BASE_URL='https://example.test';
process.env.TELEGRAM_BOT_TOKEN='test';process.env.TELEGRAM_CHAT_ID='test';
process.env.RUBIKA_BOT_TOKEN='test';process.env.RUBIKA_CHAT_ID='test';
const social=require('../lib/social');
const originalFetch=global.fetch;
afterEach(()=>{global.fetch=originalFetch;});
const article={id:'one',title:'خبر',socialTelegram:true,socialRubika:false,socialWhatsApp:false};
test('a delivered channel is not sent again when another channel is retried',async()=>{
 let calls=0;global.fetch=async()=>{calls++;return Response.json({ok:true,result:{message_id:1}})};
 const out=await social.dispatch({...article,distribution:{telegram:{status:'sent',messageId:5}}});
 assert.equal(calls,0);assert.equal(out.telegram.messageId,5);
});
test('lost acknowledgement must not send a fallback duplicate',async()=>{
 let calls=0;global.fetch=async()=>{calls++;throw new TypeError('connection lost after send')};
 const out=await social.dispatch({...article,image:'/photo.jpg'});
 assert.equal(calls,1);assert.equal(out.telegram.status,'unknown');
});
test('Rubika lost acknowledgement must not retry or fall back',async()=>{
 let calls=0;global.fetch=async()=>{calls++;throw new TypeError('connection lost after send')};
 const out=await social.dispatch({...article,socialTelegram:false,socialRubika:true});
 assert.equal(calls,1);assert.equal(out.rubika.status,'unknown');
});
test('Telegram explicit API rejection is not recorded as sent',async()=>{
 global.fetch=async()=>Response.json({ok:false,error_code:400,description:'Bad Request'});
 const out=await social.dispatch(article);assert.equal(out.telegram.status,'failed');
});
test('checkpoint is durable before the next network delivery',async()=>{
 const events=[];
 global.fetch=async url=>{events.push(url.includes('telegram')?'telegram':'rubika');return Response.json(url.includes('telegram')?{ok:true,result:{message_id:22}}:{status:'OK',data:{message_id:'33'}})};
 const out=await social.dispatch({...article,socialRubika:true},async(name,state)=>events.push(name+':'+state.status));
 assert.deepEqual(events,['telegram:sending','telegram','telegram:sent','rubika:sending','rubika','rubika:sent']);
 assert.equal(out.telegram.messageId,22);assert.equal(out.rubika.messageId,'33');
});
test('WhatsApp retry sends only recipients with definite failures',async()=>{
 process.env.WHATSAPP_ACCESS_TOKEN='test';process.env.WHATSAPP_PHONE_NUMBER_ID='test';process.env.WHATSAPP_TO='one,two,three';
 const sent=[];global.fetch=async(url,options)=>{sent.push(JSON.parse(options.body).to);return Response.json({messages:[{id:'42'}]})};
 const out=await social.dispatch({...article,socialTelegram:false,socialWhatsApp:true,distribution:{whatsapp:{status:'partial',results:[{to:'one',status:'sent'},{to:'two',status:'unknown'},{to:'three',status:'failed'}]}}});
 assert.deepEqual(sent,['three']);assert.equal(out.whatsapp.status,'partial');
 delete process.env.WHATSAPP_ACCESS_TOKEN;delete process.env.WHATSAPP_PHONE_NUMBER_ID;delete process.env.WHATSAPP_TO;
});
test('a failed WhatsApp checkpoint cannot erase a potentially delivered recipient',async()=>{
 process.env.WHATSAPP_ACCESS_TOKEN='test';process.env.WHATSAPP_PHONE_NUMBER_ID='test';process.env.WHATSAPP_TO='one';
 global.fetch=async()=>Response.json({messages:[{id:'42'}]});
 await assert.rejects(social.dispatch({...article,socialTelegram:false,socialWhatsApp:true},async(name,state)=>{if(state.results?.[0]?.status==='sent')throw Error('D1 temporarily unavailable')}),/D1 temporarily unavailable/);
 delete process.env.WHATSAPP_ACCESS_TOKEN;delete process.env.WHATSAPP_PHONE_NUMBER_ID;delete process.env.WHATSAPP_TO;
});
