import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";
import { handleAsNodeRequest } from "cloudflare:node";
import http from "node:http";
import { env } from "cloudflare:workers";
import articleTools from "../lib/article-tools.js";
import views from "../lib/view-public.js";
const originalDispatchAndPersist = articleTools.dispatchAndPersist;

const PORT = 3000;
const EXPECTED_BACKUP_SHA256 = "b93b59e5a9dde845a2f4ae50674b44ea7f6e8d84ee42013f7593adfddb5f4619";
const SYNC_TOKEN_SHA256 = "7959554b9a3f35cb94b38c33827254d4c36eb7a94c6f03690a2b201711513c63";
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
    schemaReady = (async () => {
      await env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))"
      ).run();
      await env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS media_meta (name TEXT PRIMARY KEY, content_type TEXT NOT NULL, size INTEGER NOT NULL, chunk_count INTEGER NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))"
      ).run();
      await env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS media_chunks (name TEXT NOT NULL, chunk_index INTEGER NOT NULL, chunk_data TEXT NOT NULL, PRIMARY KEY(name, chunk_index))"
      ).run();
    })();
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

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-frame-options": "SAMEORIGIN"
    }
  });
}

async function loadDbObject() {
  const text = await getState("db");
  return safeJson(text, { settings: {}, categories: [], articles: [], contacts: [], citizens: [] });
}

async function handlePublicPreview(request, url, pathname) {
  if (request.method !== "GET") return null;
  const db = await loadDbObject();

  if (pathname === "/health") {
    return Response.json({ ok: true, name: "nabzesardo-cloudflare", migrated: true });
  }
  if (pathname === "/") return html(views.home(db));
  if (pathname === "/all-news") return html(views.archive(db, url.searchParams.get("q") || ""));
  if (pathname === "/search") return html(views.search(db, url.searchParams.get("q") || ""));
  if (pathname === "/about") return html(views.simple(db, "about"));
  if (pathname === "/contact") return html(views.simple(db, "contact", url.searchParams.get("ok") === "1"));
  if (pathname === "/send-news") return html(views.simple(db, "send-news", url.searchParams.get("ok") === "1", url.searchParams.get("uploadError") || ""));

  let m = pathname.match(/^\/news\/(.+)$/);
  if (m) {
    const a = (db.articles || []).find(x => x.status === "published" && x.slug === m[1]);
    return a ? html(views.article(db, a)) : html("خبر یافت نشد", 404);
  }

  m = pathname.match(/^\/category\/(.+)$/);
  if (m) {
    const cat = (db.categories || []).find(x => x.id === m[1]);
    return cat ? html(views.category(db, cat)) : html("دسته‌بندی یافت نشد", 404);
  }

  return null;
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

const MEDIA_CHUNK_BYTES = 480000;

async function putMedia(name, data, contentType = mimeFor(name)) {
  await ensureSchema();
  const safe = path.basename(String(name || ""));
  if (!safe || safe !== name) throw new Error("invalid-media-name");
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const chunks = [];
  for (let offset = 0; offset < buf.length; offset += MEDIA_CHUNK_BYTES) {
    chunks.push(buf.subarray(offset, Math.min(offset + MEDIA_CHUNK_BYTES, buf.length)).toString("base64"));
  }
  await env.DB.prepare("DELETE FROM media_chunks WHERE name = ?").bind(safe).run();
  await env.DB.prepare("DELETE FROM media_meta WHERE name = ?").bind(safe).run();
  await env.DB.prepare(
    "INSERT INTO media_meta(name,content_type,size,chunk_count,updated_at) VALUES(?,?,?,?,datetime('now'))"
  ).bind(safe, contentType, buf.length, chunks.length).run();
  for (let i = 0; i < chunks.length; i++) {
    await env.DB.prepare(
      "INSERT INTO media_chunks(name,chunk_index,chunk_data) VALUES(?,?,?)"
    ).bind(safe, i, chunks[i]).run();
  }
}

async function getMedia(name) {
  await ensureSchema();
  const safe = path.basename(String(name || ""));
  if (!safe || safe !== name) return null;
  const meta = await env.DB.prepare(
    "SELECT name,content_type,size,chunk_count FROM media_meta WHERE name = ? LIMIT 1"
  ).bind(safe).first();
  if (!meta) return null;
  const rows = await env.DB.prepare(
    "SELECT chunk_data FROM media_chunks WHERE name = ? ORDER BY chunk_index ASC"
  ).bind(safe).all();
  const parts = (rows.results || []).map(r => Buffer.from(String(r.chunk_data || ""), "base64"));
  return {
    name: safe,
    contentType: String(meta.content_type || mimeFor(safe)),
    size: Number(meta.size || 0),
    data: Buffer.concat(parts)
  };
}

async function listMedia() {
  await ensureSchema();
  const rows = await env.DB.prepare(
    "SELECT name,content_type,size,chunk_count FROM media_meta ORDER BY name ASC"
  ).all();
  return rows.results || [];
}

async function deleteMedia(names) {
  await ensureSchema();
  for (const raw of Array.isArray(names) ? names : [names]) {
    const safe = path.basename(String(raw || ""));
    if (!safe || safe !== raw) continue;
    await env.DB.prepare("DELETE FROM media_chunks WHERE name = ?").bind(safe).run();
    await env.DB.prepare("DELETE FROM media_meta WHERE name = ?").bind(safe).run();
  }
}

async function clearMedia() {
  await ensureSchema();
  await env.DB.prepare("DELETE FROM media_chunks").run();
  await env.DB.prepare("DELETE FROM media_meta").run();
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
    const items = await listMedia();
    for (const item of items) {
      const media = await getMedia(item.name);
      if (!media) continue;
      fs.writeFileSync(path.join(UPLOAD_DIR, path.basename(item.name)), media.data);
    }
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
    await putMedia(name, data, mimeFor(name));
    count++;
  }
  return count;
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

  if (restored) await clearMedia();
  await uploadTempFiles();

  if (before.dbText && afterDbText) {
    const oldRefs = uploadRefsFromText(before.dbText);
    const newRefs = uploadRefsFromText(afterDbText);
    const removed = [...oldRefs].filter(x => !newRefs.has(x));
    if (removed.length) await deleteMedia(removed);
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

async function syncPush(request) {
  const supplied = String(request.headers.get("x-nabzesardo-sync") || "");
  if (!supplied) return Response.json({ ok: false, error: "missing-sync-token" }, { status: 401 });
  const suppliedHash = await sha256Hex(new TextEncoder().encode(supplied));
  if (suppliedHash !== SYNC_TOKEN_SHA256) {
    return Response.json({ ok: false, error: "invalid-sync-token" }, { status: 403 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  if (!payload || payload.format !== "nabezsardo-full-backup" || payload.version !== 1 || !payload.db) {
    return Response.json({ ok: false, error: "invalid-backup" }, { status: 400 });
  }

  await putState("db", JSON.stringify(payload.db, null, 2));
  await clearMedia();

  let uploaded = 0;
  for (const item of Array.isArray(payload.uploads) ? payload.uploads : []) {
    const name = path.basename(String(item.name || ""));
    if (!name || name !== item.name || !item.data) continue;
    const data = Buffer.from(item.data, "base64");
    await putMedia(name, data, mimeFor(name));
    uploaded++;
  }

  const stamp = new Date().toISOString();
  await putState("last_sync_at", stamp);
  await putState("last_sync_source", "railway");
  await putState("last_sync_articles", String(Array.isArray(payload.db.articles) ? payload.db.articles.length : 0));
  await putState("last_sync_uploads", String(uploaded));

  return Response.json({
    ok: true,
    syncedAt: stamp,
    articles: Array.isArray(payload.db.articles) ? payload.db.articles.length : 0,
    uploads: uploaded
  });
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
  await clearMedia();

  let uploaded = 0;
  for (const item of Array.isArray(payload.uploads) ? payload.uploads : []) {
    const name = path.basename(String(item.name || ""));
    if (!name || name !== item.name || !item.data) continue;
    const data = Buffer.from(item.data, "base64");
    await putMedia(name, data, mimeFor(name));
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
  for (const item of await listMedia()) {
    if (Number(item.size || 0) > 12 * 1024 * 1024) continue;
    const media = await getMedia(item.name);
    if (!media) continue;
    uploads.push({
      name: item.name,
      data: media.data.toString("base64")
    });
  }

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
  const cache = caches.default;
  const cacheKey = new Request("https://media.nabzesardo.invalid/uploads/" + encodeURIComponent(safe));
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  const media = await getMedia(safe);
  if (!media) return new Response("Not found", { status: 404 });
  const headers = new Headers({
    "content-type": media.contentType,
    "content-length": String(media.data.length),
    "cache-control": "public, max-age=31536000, immutable"
  });
  const response = new Response(media.data, { headers });
  await cache.put(cacheKey, response.clone());
  return response;
}

async function serveAsset(request, pathname) {
  if (pathname === "/hero-mosque.jpg") {
    const persisted = await getMedia("hero-mosque-hq.jpg");
    if (persisted) {
      const headers = new Headers({
        "content-type": persisted.contentType,
        "content-length": String(persisted.data.length),
        "cache-control": "public, max-age=3600"
      });
      return new Response(persisted.data, { headers });
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
    if (p === "/__sync/push" && request.method === "POST") return syncPush(request);
    if (p === "/__migration/export" && request.method === "GET") return exportBackup(request);

    if (p.startsWith("/uploads/") && request.method === "GET") {
      return serveUpload(path.basename(p));
    }

    if ((p.startsWith("/assets/") || p === "/hero-mosque.jpg") && request.method === "GET") {
      return serveAsset(request, p);
    }

    const publicResponse = await handlePublicPreview(request, url, p);
    if (publicResponse) return publicResponse;

    if (String(env.PREVIEW_READONLY || "") === "1") {
      return new Response("Preview is read-only during migration verification.", { status: 403 });
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
