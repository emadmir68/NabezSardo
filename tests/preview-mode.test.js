'use strict';
const assert=require('node:assert/strict');
const preview=require('../lib/preview-mode');

assert.equal(preview.enabled({PREVIEW_MODE:'1'}),true);
assert.equal(preview.enabled({PREVIEW_MODE:'true'}),true);
assert.equal(preview.enabled({PREVIEW_MODE:'YES'}),true);
assert.equal(preview.enabled({PREVIEW_MODE:'0'}),false);
assert.equal(preview.enabled({}),false);
assert.equal(preview.enabled({RAILWAY_ENVIRONMENT_NAME:'design/experimental-editorial'}),true);
assert.equal(preview.enabled({RAILWAY_ENVIRONMENT_NAME:'fix/monitor-policy'}),true);
assert.equal(preview.enabled({RAILWAY_ENVIRONMENT_NAME:'pr-75'}),true);
assert.equal(preview.enabled({RAILWAY_GIT_BRANCH:'feature/newsroom-preview'}),true);
assert.equal(preview.enabled({RAILWAY_ENVIRONMENT_NAME:'production'}),false);
assert.equal(preview.enabled({RAILWAY_ENVIRONMENT_NAME:'staging'}),false);
assert.deepEqual(preview.securityHeaders(true),{'X-Robots-Tag':'noindex, nofollow, noarchive'});
assert.deepEqual(preview.securityHeaders(false),{});
assert.equal(preview.robotsTxt(),'User-agent: *\nDisallow: /\n');

process.env.PREVIEW_MODE='true';
process.env.PUBLIC_BASE_URL='https://preview.example.test';
const social=require('../lib/social');
assert.deepEqual(social.status(),{telegram:false,rubika:false,whatsapp:false,baseUrl:true});
(async()=>{
  const result=await social.dispatch({socialTelegram:true,socialRubika:true,socialWhatsApp:true});
  for(const name of ['telegram','rubika','whatsapp']){
    assert.deepEqual(result[name],{status:'disabled',reason:'preview-mode'});
  }
  console.log('preview mode tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
