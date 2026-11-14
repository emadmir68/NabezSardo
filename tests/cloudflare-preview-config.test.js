'use strict';
const assert=require('node:assert/strict');
const {parseJson,findDatabase}=require('../scripts/prepare-cloudflare-preview-config');
const payload={result:[{name:'production-db',uuid:'111'},{database_name:'nabzesardo-editorial-preview',database_id:'222'}]};
assert.equal(findDatabase(payload,'nabzesardo-editorial-preview'),'222');
assert.equal(findDatabase(payload,'missing'),null);
assert.deepEqual(parseJson('wrangler info\n'+JSON.stringify(payload)),payload);
console.log('Cloudflare preview config tests passed');
