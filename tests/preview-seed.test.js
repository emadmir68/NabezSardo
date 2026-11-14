'use strict';
const assert=require('node:assert/strict');
const {parseJsonOutput,findDatabaseValue,sanitizeDb,buildSql}=require('../scripts/build-preview-seed');

const original={
  settings:{siteName:'نبض ساردو',socialDistribution:true,apiToken:'private'},
  categories:[{id:'social',name:'اجتماعی'}],
  articles:[
    {id:'published',status:'published',title:'خبر عمومی',slug:'public-story'},
    {id:'draft',status:'draft',title:'پیش‌نویس خصوصی',slug:'private-draft'}
  ],
  contacts:[{name:'نام خصوصی',contact:'09120000000'}],
  citizens:[{name:'گزارشگر',phone:'09120000001'}],
  followups:[{title:'پیگیری عمومی'}]
};
const output=JSON.stringify({success:true,results:[{results:[{value:JSON.stringify(original)}]}]});
const parsed=parseJsonOutput('wrangler output\\n'+output);
const found=findDatabaseValue(parsed);
assert.ok(found);
const safe=sanitizeDb(found);
assert.deepEqual(safe.articles.map(x=>x.id),['published']);
assert.deepEqual(safe.contacts,[]);
assert.deepEqual(safe.citizens,[]);
assert.equal(safe.settings.apiToken,undefined);
assert.equal(safe.settings.socialDistribution,false);
assert.equal(safe.followups.length,1);
const built=buildSql(safe,80);
assert.ok(built.chunks>1);
assert.ok(built.sql.includes('preview:db:manifest'));
assert.ok(built.sql.includes('preview:db:chunk:000000'));
assert.ok(!built.sql.includes('private-draft'));
console.log('Cloudflare preview seed tests passed');
