const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('weekly in-site backup is durable and separate from daily Arvan backup',()=>{
  const worker=fs.readFileSync('src/worker.js','utf8');
  const store=fs.readFileSync('lib/store.js','utf8');
  const admin=fs.readFileSync('lib/view-admin.js','utf8');

  assert.match(worker,/async function createWeeklySiteBackup\(\)/);
  assert.match(worker,/backup:weekly-/);
  assert.match(worker,/retentionWeeks: 12/);
  assert.match(worker,/createWeeklySiteBackup\(\)/);
  assert.match(worker,/createDailyArvanBackup\(\)/);
  assert.match(worker,/weeklySite:/);
  assert.match(store,/auto-weekly-/);
  assert.match(admin,/بکاپ داخلی سایت هفته‌ای یک‌بار/);
});
