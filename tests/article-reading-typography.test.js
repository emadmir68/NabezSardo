const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const reader = read('gemini-source/src/components/ArticleReader.tsx');
const geminiCss = read('gemini-source/src/index.css');
const serverRenderer = read('lib/rebirth-public.js');
const serverCss = read('public/assets/rebirth.css');

test('Gemini article paragraphs use RTL justified alignment for Persian and LTR for English', () => {
  assert.match(reader, /dir=\{locale === 'fa' \? 'rtl' : 'ltr'\}/);
  assert.match(reader, /article-prose-paragraph-fa/);
  assert.match(reader, /article-prose-paragraph-en/);
  assert.match(reader, /lg:col-span-8 min-w-0/);
});

test('server-rendered article pages mark Persian and English prose independently', () => {
  assert.match(serverRenderer, /rb-article-prose-fa" dir="rtl"/);
  assert.match(serverRenderer, /rb-article-prose-en" dir="ltr"/);
});

test('justification styles are scoped to article body text and preserve centered pull quotes', () => {
  assert.match(geminiCss, /\.article-prose-paragraph-fa\s*\{[^}]*text-align:\s*justify[^}]*text-align-last:\s*start/s);
  assert.match(geminiCss, /\.article-prose-paragraph-en\s*\{[^}]*text-align:\s*left/s);
  assert.match(serverCss, /\.rb-article-prose-fa p\s*\{[^}]*text-align:\s*justify[^}]*text-align-last:\s*start/s);
  assert.match(serverCss, /\.rb-article-prose-fa blockquote p\s*\{?[^}]*text-align:\s*center/s);
  assert.match(serverCss, /\.rb-article-prose-en p\s*\{[^}]*text-align:\s*left/s);
});
