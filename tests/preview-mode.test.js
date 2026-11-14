'use strict';
const assert=require('node:assert/strict');
const preview=require('../lib/preview-mode');

assert.equal(preview.enabled({PREVIEW_MODE:'1'}),true);
assert.equal(preview.enabled({PREVIEW_MODE:'true'}),true);
assert.equal(preview.enabled({PREVIEW_MODE:'YES'}),true);
assert.equal(preview.enabled({PREVIEW_MODE:'0'}),false);
assert.equal(preview.enabled({}),false);
assert.deepEqual(preview.securityHeaders(true),{'X-Robots-Tag':'noindex, nofollow, noarchive'});
assert.deepEqual(preview.securityHeaders(false),{});
assert.equal(preview.robotsTxt(),'User-agent: *\nDisallow: /\n');
console.log('preview mode tests passed');
