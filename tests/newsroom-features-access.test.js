'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('New studio retains entry points to operational legacy tools', () => {
  const studio = fs.readFileSync('gemini-source/src/components/AdminStudio.tsx', 'utf8');
  for (const route of ['/admin#monitor', '/admin#followups', '/admin#social', '/admin#live', '/admin#news', '/admin#citizens', '/admin#backup', '/admin#overview']) {
    assert.ok(studio.includes(route), 'Missing legacy operational tool: ' + route);
  }
  assert.ok(studio.includes('href="/admin"'), 'Full legacy admin entry point missing');
});

test('Public follow-ups and working RSS remain reachable after redesign', () => {
  const footer = fs.readFileSync('gemini-source/src/components/Footer.tsx', 'utf8');
  assert.ok(footer.includes('href="/follow-up"'));
  assert.ok(footer.includes('href="/feed.xml"'));
  const app = fs.readFileSync('app.js', 'utf8');
  assert.ok(app.includes("p==='/follow-up'"));
  assert.ok(app.includes("p==='/feed.xml'"));
});

test('Export uses server D1 newsroom full backup, never local draft snapshot', () => {
  const app = fs.readFileSync('gemini-source/src/App.tsx', 'utf8');
  assert.ok(app.includes("window.location.assign('/admin/backup/download')"));
  const backend = fs.readFileSync('app.js', 'utf8');
  assert.ok(backend.includes("p==='/admin/backup/download'"));
});

test('Legacy admin still handles monitoring, follow-up cases, and social distribution', () => {
  const backend = fs.readFileSync('app.js', 'utf8');
  const views = fs.readFileSync('lib/view-admin.js', 'utf8');
  assert.ok(backend.includes("p==='/admin/news-monitor/run'"));
  assert.ok(backend.includes("p==='/admin/followups/new'") || backend.includes("/admin/followups/new"));
  assert.ok(views.includes('id="monitor"'));
  assert.ok(views.includes('id="followups"'));
  assert.ok(views.includes('id="social"'));
});
