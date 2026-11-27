const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'public/assets/rebirth.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'public/assets/rebirth.js'), 'utf8');

test('mobile header remains compact and search control stays visible', () => {
  assert.match(css, /\.rb-header-main\s*\{[^}]*position:\s*relative[^}]*gap:\s*10px/s);
  assert.match(css, /\.rb-header-side \.rb-search\s*\{[^}]*display:\s*flex[^}]*width:\s*40px/s);
  assert.match(css, /\.rb-header-side \.rb-search\.is-open\s*\{[^}]*position:\s*absolute/s);
  assert.match(css, /\.rb-hero-bottomline\s*\{[^}]*flex-wrap:\s*wrap/s);
});

test('mobile search behavior uses the same 820px breakpoint as its visible control', () => {
  assert.match(js, /window\.matchMedia\('\(max-width:820px\)'\)/);
});
