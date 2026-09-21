import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";
import { handleAsNodeRequest } from "cloudflare:node";
import http from "node:http";
import { env } from "cloudflare:workers";
import articleTools from "../lib/article-tools.js";
const originalDispatchAndPersist = articleTools.dispatchAndPersist;

const PORT = 3000;
const EXPECTED_BACKUP_SHA256 = "b93b59e5a9dde845a2f4ae50674b44ea7f6e8d84ee42013f7593adfddb5f4619";
let appReady = false;

async function ensureAppServer() {
  if (appReady) return;
  const originalListen = http.Server.prototype.listen;
  const originalSetTimeout = globalThis.setTimeout;
  const originalSetInterval = globalThis.setInterval;
  http.Server.prototype.listen = function(...args) {
    if (typeof args[1] === "string") {
      const callback = typeof args[2] === "function" ? args[2] : (typeof args[1] === "function" ? args[1] : undefined);
      return callback ? originalListen.call(this, args[0], callback) : originalListen.call(this, args[0]);
    }
    return originalListen.apply(this, args);
  };
  globalThis.setTimeout = () => 0;
  globalThis.setInterval = () => 0;
  try {
    articleTools.dispatchAndPersist = async () => {};
    await import("../app.js");
    appReady = true;
  } finally {
    http.Server.prototype.listen = originalListen;
    globalThis.setTimeout = originalSetTimeout;
    globalThis.setInterval = originalSetInterval;
  }
}

const DATA_DIR = process.env.DATA_DIR || "/tmp/nabzesardo";
const DB_FILE = path.join(DATA_DIR, "db.json");
const ANALYTICS_FILE = path.join(DATA_DIR, "analytics.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

let schemaReady;
async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))"
    ).run();
  }
  await schemaReady;
}

async function getState(key) {
  await ensureSchema();
  const row = await env.DB.prepare("SELECT value FROM app_state WHERE key = ? LIMIT 1")
    .bind(key)
    .first();
  return row && typeof row.value === "string" ? row.value : null;
}

async function putState(key, value) {
  await ensureSchema();
  await env.DB.prepare(
    "INSERT INTO app_state(key,value,updated_at) VALUES(?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at"
  ).bind(key, value).run();
}

function safeJson(text, fallback = null) {
  try { return JSON.parse(text); } catch { return fallback; }
}

function uploadRefsFromText(text = "") {
  const out = new Set();
  const re = /\/uploads\/([a-zA-Z0-9._-]+)/g;
  let m;
  while ((m = re.exec(String(text)))) out.add(m[1]);
  return out;
}

function mimeFor(name = "") {
  const ext = path.extname(name).toLowerCase();
  return ({
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".json": "application/json; charset=utf-8"
  })[ext] || "application/octet-stream";
}

async function hydrateState({ includeUploads = false } = {}) {
  ensureDirs();
  const [dbText, analyticsText] = await Promise.all([
    getState("db"),
    getState("analytics")
  ]);
  if (dbText) fs.writeFileSync(DB_FILE, dbText, "utf8");
  if (analyticsText) fs.writeFileSync(ANALYTICS_FILE, analyticsText, "utf8");

  if (includeUploads) {
    let cursor;
    do {
      const page = await env.UPLOADS.list({ cursor });
      for (const item of page.objects) {
        const obj = await env.UPLOADS.get(item.key);
        if (!obj) continue;
        const data = Buffer.from(await obj.arrayBuffer());
        fs.writeFileSync(path.join(UPLOAD_DIR, path.basename(item.key)), data);
      }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
  }
  return { dbText: dbText || "", analyticsText: analyticsText || "" };
}

async function uploadTempFiles() {
  ensureDirs();
  const names = fs.readdirSync(UPLOAD_DIR);
  let count = 0;
  for (const name of names) {
    const file = path.join(UPLOAD_DIR, name);
    if (!fs.statSync(file).isFile()) continue;
    const data = fs.readFileSync(file);
    await env.UPLOADS.put(name, data, { httpMetadata: { contentType: mimeFor(name) } });
    count++;
  }
  return count;
}

async function clearR2() {
  let cursor;
  do {
    const page = await env.UPLOADS.list({ cursor });
    if (page.objects.length) {
      await env.UPLOADS.delete(page.objects.map(x => x.key));
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

async function flushState(before, request, response) {
  ensureDirs();
  const afterDbText = fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE, "utf8") : "";
  const afterAnalyticsText = fs.existsSync(ANALYTICS_FILE) ? fs.readFileSync(ANALYTICS_FILE, "utf8") : "";

  if (afterDbText && afterDbText !== before.dbText) await putState("db", afterDbText);
  if (afterAnalyticsText && afterAnalyticsText !== before.analyticsText) await putState("analytics", afterAnalyticsText);

  const url = new URL(request.url);
  const restored = request.method === "POST" &&
    url.pathname === "/admin/backup/restore" &&
    response.status >= 300 && response.status < 400 &&
    String(response.headers.get("location") || "").includes("restored=1");

  if (restored) await clearR2();
  await uploadTempFiles();

  if (before.dbText && afterDbText) {
    const oldRefs = uploadRefsFromText(before.dbText);
    const newRefs = uploadRefsFromText(afterDbText);
    const removed = [...oldRefs].filter(x => !newRefs.has(x));
    if (removed.length) await env.UPLOADS.delete(removed);
  }

  return { beforeDb: safeJson(before.dbText, {}), afterDb: safeJson(afterDbText, {}) };
}

function isAuthorizedMigration(request) {
  const token = String(env.MIGRATION_TOKEN || "");
  if (!token) return false;
  return request.headers.get("authorization") === "Bearer " + token;
}

async function sha256Hex(buffer) {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function migrationPage() {
  const done = await getState("migration_complete");
  const disabled = done === "1";
  const body = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>انتقال آزمایشی نبض ساردو</title><style>body{font-family:system-ui;background:#0d1015;color:#f5f1e8;margin:0;padding:32px}.box{max-width:720px;margin:auto;background:#151922;border:1px solid #343b49;border-radius:20px;padding:24px}h1{font-size:24px}.ok{color:#9fe3b1}.warn{color:#f2cd78}input,button{width:100%;box-sizing:border-box;margin-top:14px;padding:14px;border-radius:12px;border:1px solid #394152;background:#0f131a;color:#fff}button{background:#b48a3c;border:0;font-weight:700;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}pre{white-space:pre-wrap;background:#0b0e13;padding:12px;border-radius:10px;min-height:48px}</style></head><body><div class="box"><h1>انتقال آزمایشی نبض ساردو به Cloudflare</h1><p>این صفحه فقط فایل بکاپ تأییدشده امروز را می‌پذیرد. سایت Railway هیچ تغییری نمی‌کند.</p>${disabled?'<p class="ok">انتقال این نسخه قبلاً انجام شده و مسیر Import بسته است.</p>':'<p class="warn">فایل nabezsardo-backup-2026-09-21.json را انتخاب کن و «انتقال کپی» را بزن.</p><input id="file" type="file" accept=".json,application/json"><button id="go">انتقال کپی</button>'}<pre id="out"></pre></div><script>const go=document.getElementById("go"),file=document.getElementById("file"),out=document.getElementById("out");if(go)go.onclick=async()=>{if(!file.files[0]){out.textContent="فایل را انتخاب کن.";return}go.disabled=true;out.textContent="در حال انتقال کپی...";try{const b=await file.files[0].arrayBuffer();const r=await fetch("/__migration/import",{method:"POST",headers:{"content-type":"application/json"},body:b});const j=await r.json().catch(()=>({ok:false,error:"HTTP "+r.status}));out.textContent=j.ok?("انجام شد — خبرها: "+j.articles+" | فایل‌ها: "+j.uploads):("خطا: "+(j.error||r.status));}catch(e){out.textContent="خطا: "+e.message}finally{go.disabled=false}};</script></body></html>`;
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

async function importBackup(request) {
  const done = await getState("migration_complete");
  if (done === "1") return Response.json({ ok: false, error: "migration-already-complete" }, { status: 409 });

  const raw = await request.arrayBuffer();
  const digest = await sha256Hex(raw);
  if (digest !== EXPECTED_BACKUP_SHA256) {
    return Response.json({ ok: false, error: "backup-checksum-mismatch" }, { status: 403 });
  }

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return Response.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  if (!payload || payload.format !== "nabezsardo-full-backup" || payload.version !== 1 || !payload.db) {
    return Response.json({ ok: false, error: "invalid-backup" }, { status: 400 });
  }

  await putState("db", JSON.stringify(payload.db, null, 2));
  await clearR2();

  let uploaded = 0;
  for (const item of Array.isArray(payload.uploads) ? payload.uploads : []) {
    const name = path.basename(String(item.name || ""));
    if (!name || name !== item.name || !item.data) continue;
    const data = Buffer.from(item.data, "base64");
    await env.UPLOADS.put(name, data, { httpMetadata: { contentType: mimeFor(name) } });
    uploaded++;
  }

  await putState("migration_complete", "1");
  await putState("migration_source_sha256", digest);

  return Response.json({
    ok: true,
    articles: Array.isArray(payload.db.articles) ? payload.db.articles.length : 0,
    uploads: uploaded,
    checksum: digest
  });
}

async function exportBackup(request) {
  if (!isAuthorizedMigration(request)) return new Response("Unauthorized", { status: 401 });
  const dbText = await getState("db");
  const db = safeJson(dbText, null);
  if (!db) return Response.json({ ok: false, error: "no-db" }, { status: 404 });

  const uploads = [];
  let cursor;
  do {
    const page = await env.UPLOADS.list({ cursor });
    for (const item of page.objects) {
      if (item.size > 12 * 1024 * 1024) continue;
      const obj = await env.UPLOADS.get(item.key);
      if (!obj) continue;
      uploads.push({
        name: item.key,
        data: Buffer.from(await obj.arrayBuffer()).toString("base64")
      });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  return Response.json({
    format: "nabezsardo-full-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    db,
    uploads
  });
}

async function serveUpload(name) {
  const safe = path.basename(name);
  if (!safe || safe !== name) return new Response("Not found", { status: 404 });
  const obj = await env.UPLOADS.get(safe);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}

async function serveAsset(request, pathname) {
  if (pathname === "/hero-mosque.jpg") {
    const persisted = await env.UPLOADS.get("hero-mosque-hq.jpg");
    if (persisted) {
      const headers = new Headers();
      persisted.writeHttpMetadata(headers);
      headers.set("etag", persisted.httpEtag);
      headers.set("cache-control", "public, max-age=3600");
      return new Response(persisted.body, { headers });
    }
  }
  const u = new URL(request.url);
  if (pathname.startsWith("/assets/")) u.pathname = pathname.slice("/assets".length);
  if (pathname === "/hero-mosque.jpg") u.pathname = "/header-mosque-fixed.jpg";
  return env.ASSETS.fetch(new Request(u, request));
}

async function maybeDistribute(beforeDb, afterDb) {
  const before = new Map((beforeDb?.articles || []).map(a => [a.id, a]));
  const newlyPublished = (afterDb?.articles || []).filter(a =>
    a.status === "published" && before.get(a.id)?.status !== "published"
  );
  for (const a of newlyPublished) {
    try { await originalDispatchAndPersist(a.id); } catch (err) { console.error("distribution", err); }
  }
  if (newlyPublished.length && fs.existsSync(DB_FILE)) {
    await putState("db", fs.readFileSync(DB_FILE, "utf8"));
  }
}

async function handleApp(request) {
  const url = new URL(request.url);
  if (String(env.PREVIEW_READONLY || "") === "1" && url.pathname.startsWith("/admin")) {
    return new Response("Preview admin is disabled until migration verification is complete.", { status: 403 });
  }
  const includeUploads = request.method === "GET" && url.pathname === "/admin/backup/download";
  const before = await hydrateState({ includeUploads });
  await ensureAppServer();
  const response = await handleAsNodeRequest(PORT, request);
  const states = await flushState(before, request, response);
  await maybeDistribute(states.beforeDb, states.afterDb);
  return response;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const p = decodeURIComponent(url.pathname);

    if (p === "/__migration" && request.method === "GET") return migrationPage();
    if (p === "/__migration/import" && request.method === "POST") return importBackup(request);
    if (p === "/__migration/export" && request.method === "GET") return exportBackup(request);

    if (p.startsWith("/uploads/") && request.method === "GET") {
      return serveUpload(path.basename(p));
    }

    if ((p.startsWith("/assets/") || p === "/hero-mosque.jpg") && request.method === "GET") {
      return serveAsset(request, p);
    }

    return handleApp(request);
  },

  async scheduled() {
    if (String(env.PREVIEW_READONLY || "") === "1") return;
    const before = await hydrateState();
    await articleTools.schedulerTick();
    const fakeReq = new Request("https://nabzesardo.ir/__cron", { method: "GET" });
    const fakeRes = new Response(null, { status: 204 });
    await flushState(before, fakeReq, fakeRes);
  }
};
