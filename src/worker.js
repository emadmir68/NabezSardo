import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";
import { handleAsNodeRequest } from "cloudflare:node";
import http from "node:http";
import { env } from "cloudflare:workers";
import articleTools from "../lib/article-tools.js";
import store from "../lib/store.js";
import views from "../lib/view-public.js";
import { ensureSmartCover, isFallbackSourceImage } from "./smart-cover.js";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgModule from "@resvg/resvg-wasm/index_bg.wasm";
import social from "../lib/social.js";
import publishing from "../lib/publishing-state.js";
let stateSerial=Promise.resolve();
function withLocalState(fn){
  const work=stateSerial.then(fn,fn);
  stateSerial=work.catch(()=>{});
  return work;
}
const uploadedMediaHashes=new Map();
const uploadedMediaSignatures=new Map();
let rasterReady;

const PORT = 3000;
const EXPECTED_BACKUP_SHA256 = "b93b59e5a9dde845a2f4ae50674b44ea7f6e8d84ee42013f7593adfddb5f4619";
const SYNC_TOKEN_SHA256 = "7959554b9a3f35cb94b38c33827254d4c36eb7a94c6f03690a2b201711513c63";
let appReady = false;

function isPrimary() {
  return String(env.CLOUDFLARE_PRIMARY || "") === "1";
}

function automaticDistributionEnabled() {
  return String(env.AUTO_DISTRIBUTION_ENABLED || "") === "1";
}

function legacyShortArticleCodeWorker(value=""){
  const input=String(value||"").trim();
  let a=0x811c9dc5>>>0,b=0x9e3779b9>>>0;
  for(let i=0;i<input.length;i++){
    const c=input.charCodeAt(i);
    a=Math.imul((a^c)>>>0,0x01000193)>>>0;
    b=Math.imul((b^(c+((i+1)*131)))>>>0,0x85ebca6b)>>>0;
  }
  return (a.toString(36).padStart(7,"0")+b.toString(36).padStart(7,"0")).slice(0,12);
}
function previousShortArticleCodeWorker(value=""){
  const input=String(value||"").trim();
  const hex=input.replace(/-/g,"").toLowerCase();
  if(/^[0-9a-f]{32}$/.test(hex)){
    return Buffer.from(hex,"hex").toString("base64")
      .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  }
  return legacyShortArticleCodeWorker(input);
}
function shortArticleCodeWorker(value=""){
  const input=String(value||"").trim();
  const hex=input.replace(/-/g,"").toLowerCase();
  if(/^[0-9a-f]{32}$/.test(hex)){
    return BigInt("0x"+hex).toString(36).padStart(25,"0");
  }
  return legacyShortArticleCodeWorker(input);
}

async function ensureRasterSocialImage(article){
  if(!article||!/\.svg(?:\?|$)/i.test(String(article.image||"")))return false;
  const name=path.basename(new URL(article.image,"https://nabzesardo.ir").pathname);
  const socialName=name.replace(/\.svg$/i,"-social.png");
  if(!(await getMedia(socialName))){
    const source=await getMedia(name);
    if(!source)throw new Error("social-preview-source-missing");
    rasterReady ||= initWasm(resvgModule);await rasterReady;
    const png=Buffer.from(new Resvg(source.data||source,{fitTo:{mode:"width",value:1200}}).render().asPng());
    await putMedia(socialName,png,"image/png");
  }
  const next="/uploads/"+socialName;
  if(article.socialImage===next)return false;
  article.socialImage=next;
  return true;
}

async function ensureSocialPreviewForPath(pathname){
  if(!/^\/(?:n|news)\//.test(String(pathname||"")))return;
  const db=safeJson(await getState("db"),null);
  if(!db||!Array.isArray(db.articles))return;
  let article=null;
  if(pathname.startsWith("/news/")){
    let key="";
    try{key=decodeURIComponent(pathname.slice("/news/".length));}catch{key=pathname.slice("/news/".length);}
    article=db.articles.find(x=>x.status==="published"&&(x.slug===key||shortArticleCodeWorker(x.id)===key||previousShortArticleCodeWorker(x.id)===key||legacyShortArticleCodeWorker(x.id)===key))||null;
  }else{
    const key=pathname.slice("/n/".length).replace(/\/+$/,"");
    article=db.articles.find(x=>x.status==="published"&&(String(x.id)===key||shortArticleCodeWorker(x.id)===key||previousShortArticleCodeWorker(x.id)===key||legacyShortArticleCodeWorker(x.id)===key))||null;
  }
  if(!article)return;
  try{
    if(await ensureRasterSocialImage(article))await putState("db",JSON.stringify(db,null,2));
  }catch(err){
    console.error("social-preview-raster",article.id,String(err?.message||err));
  }
}

async function runtimeAuth() {
  const raw = await getState("admin_auth");
  const auth = safeJson(raw, null);
  if (!auth || auth.version !== 1 || !auth.user || !auth.salt || !auth.verifier) return null;
  return auth;
}

async function constantTimeTextEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(String(a || ""))),
    crypto.subtle.digest("SHA-256", enc.encode(String(b || "")))
  ]);
  const aa = new Uint8Array(ha), bb = new Uint8Array(hb);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

async function verifyRuntimePassword(user, password) {
  const runtime = await decryptRuntimeSecrets();
  const expectedUser = String(runtime.ADMIN_USER || "");
  const expectedPass = String(runtime.ADMIN_PASS || "");
  if (!expectedUser || !expectedPass) return false;
  if (!(await constantTimeTextEqual(user, expectedUser))) return false;
  return constantTimeTextEqual(password, expectedPass);
}

function base64Bytes(value = "") {
  const bin = atob(String(value));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pemPkcs8Bytes(pem = "") {
  const b64 = String(pem).replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s+/g, "");
  return base64Bytes(b64);
}

async function decryptRuntimeSecrets() {
  const raw = await getState("runtime_secrets");
  const envelope = safeJson(raw, null);
  const privatePem = String(env.RUNTIME_PRIVATE_KEY || "");
  if (!envelope || envelope.version !== 1 || !privatePem) return {};
  try {
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      pemPkcs8Bytes(privatePem),
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );
    const aesRaw = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      base64Bytes(envelope.wrappedKey)
    );
    const aesKey = await crypto.subtle.importKey("raw", aesRaw, { name: "AES-GCM" }, false, ["decrypt"]);
    const data = base64Bytes(envelope.data);
    const tag = base64Bytes(envelope.tag);
    const combined = new Uint8Array(data.length + tag.length);
    combined.set(data, 0);
    combined.set(tag, data.length);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64Bytes(envelope.iv), tagLength: 128 },
      aesKey,
      combined
    );
    return safeJson(new TextDecoder().decode(plain), {}) || {};
  } catch (err) {
    console.error("runtime-secrets-decrypt", String(err?.message || err));
    return {};
  }
}

async function applyRuntimeEnv() {
  const auth = await runtimeAuth();
  if (!auth) return false;
  process.env.ADMIN_USER = String(auth.user);
  process.env.ADMIN_PASS = String(auth.verifier);
  process.env.SESSION_SECRET = await sha256Hex(new TextEncoder().encode("nabzesardo-cf-session|" + String(auth.verifier)));
  const runtime = await decryptRuntimeSecrets();
  for (const [key, value] of Object.entries(runtime || {})) {
    if (key === "ADMIN_USER" || key === "ADMIN_PASS" || key === "SESSION_SECRET") continue;
    if (value !== undefined && value !== null && String(value).length) process.env[key] = String(value);
  }
  if (env.GOOGLE_SITE_VERIFICATION) process.env.GOOGLE_SITE_VERIFICATION = String(env.GOOGLE_SITE_VERIFICATION);
  return true;
}

async function ensureAppServer() {
  if (appReady) return;
  const authReady = await applyRuntimeEnv();
  if (isPrimary() && !authReady) throw new Error("cloudflare-admin-auth-not-ready");
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
    articleTools.dispatchAndPersist = async (articleId,options={}) => {
      const db=store.load(),a=db.articles.find(x=>x.id===articleId);
      if(!a||a.status!=="published")return;
      a.shareKit=social.sharePackage(a);
      if(!automaticDistributionEnabled()&&!options.retry){
        a.distributionAutoPausedAt=new Date().toISOString();
        store.save(db);
        return;
      }
      a.distributionRequest=options.retry&&a.distributionRequest?crypto.randomUUID():(a.distributionRequest||a.id+":initial");
      if(options.retry)a.distributionManualRequest=a.distributionRequest;
      store.save(db);
    };
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
const BACKUP_MANIFEST_FILE = path.join(DATA_DIR, "backups-manifest.json");

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

let trafficSchemaReady;
async function ensureTrafficSchema(){
  if(!trafficSchemaReady){
    trafficSchemaReady=(async()=>{
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS traffic_daily(day TEXT PRIMARY KEY,page_views INTEGER NOT NULL DEFAULT 0,google_entrances INTEGER NOT NULL DEFAULT 0,external_entrances INTEGER NOT NULL DEFAULT 0,direct_entrances INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS traffic_paths(day TEXT NOT NULL,path TEXT NOT NULL,views INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,path))").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS traffic_sources(day TEXT NOT NULL,source TEXT NOT NULL,views INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,source))").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS traffic_visitors(day TEXT NOT NULL,visitor_hash TEXT NOT NULL,PRIMARY KEY(day,visitor_hash))").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS article_view_counts(article_id TEXT PRIMARY KEY,views INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL)").run();
    })();
  }
  await trafficSchemaReady;
}
function tehranDayFast(date=new Date()){
  try{
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tehran",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
    const p=Object.fromEntries(parts.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
    return p.year+"-"+p.month+"-"+p.day;
  }catch{return date.toISOString().slice(0,10);}
}
function fastTrackablePath(p=""){
  return /^\/$|^\/all-news$|^\/search$|^\/about$|^\/contact$|^\/send-news$|^\/news\/|^\/n\/|^\/category\/|^\/local\//.test(String(p||""));
}
function fastBot(ua=""){
  return /(bot|crawl|spider|slurp|bingpreview|facebookexternalhit|telegrambot|discordbot|preview|headless|lighthouse|pagespeed|uptime|monitor|cloudflare-sync)/i.test(String(ua||""));
}
async function fastVisitorHash(request){
  const ua=String(request.headers.get("user-agent")||"");
  const ip=String(request.headers.get("cf-connecting-ip")||request.headers.get("x-forwarded-for")||"").split(",")[0].trim();
  const bytes=new TextEncoder().encode(ip+"|"+ua+"|nabez-fast-analytics-v1");
  return sha256Hex(bytes).then(x=>x.slice(0,24));
}
async function recordFastVisit(request,pathname,articleId=""){
  if(request.method!=="GET"||!fastTrackablePath(pathname))return;
  const ua=String(request.headers.get("user-agent")||"");
  if(!ua||fastBot(ua))return;
  await ensureTrafficSchema();
  const day=tehranDayFast(),stamp=new Date().toISOString();
  const url=new URL(request.url);
  const ref=String(request.headers.get("referer")||"");
  let host="";try{host=ref?new URL(ref).hostname.toLowerCase().replace(/^www\./,""):"";}catch{}
  const utm=String(url.searchParams.get("utm_source")||"").toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,40);
  const internal=!host||host==="nabzesardo.ir"||host.endsWith(".nabzesardo.ir");
  const google=host&&/(^|\.)google\.[a-z.]+$/i.test(host)?1:0;
  const direct=!host?1:0;
  const external=host&&!internal?1:0;
  const statements=[
    env.DB.prepare("INSERT INTO traffic_daily(day,page_views,google_entrances,external_entrances,direct_entrances,updated_at) VALUES(?,1,?,?,?,?) ON CONFLICT(day) DO UPDATE SET page_views=page_views+1,google_entrances=google_entrances+excluded.google_entrances,external_entrances=external_entrances+excluded.external_entrances,direct_entrances=direct_entrances+excluded.direct_entrances,updated_at=excluded.updated_at").bind(day,google,external,direct,stamp),
    env.DB.prepare("INSERT INTO traffic_paths(day,path,views) VALUES(?,?,1) ON CONFLICT(day,path) DO UPDATE SET views=views+1").bind(day,String(pathname).slice(0,700)),
    env.DB.prepare("INSERT OR IGNORE INTO traffic_visitors(day,visitor_hash) VALUES(?,?)").bind(day,await fastVisitorHash(request))
  ];
  if(utm)statements.push(env.DB.prepare("INSERT INTO traffic_sources(day,source,views) VALUES(?,?,1) ON CONFLICT(day,source) DO UPDATE SET views=views+1").bind(day,utm));
  if(articleId)statements.push(env.DB.prepare("INSERT INTO article_view_counts(article_id,views,updated_at) VALUES(?,1,?) ON CONFLICT(article_id) DO UPDATE SET views=views+1,updated_at=excluded.updated_at").bind(articleId,stamp));
  await env.DB.batch(statements);
}

let publicDbCache={at:0,db:null};
async function loadPublicDbFast(){
  const nowMs=Date.now();
  if(publicDbCache.db&&nowMs-publicDbCache.at<1500)return publicDbCache.db;
  await ensureTrafficSchema();
  const [text,viewRows]=await Promise.all([
    getState("db"),
    env.DB.prepare("SELECT article_id,views FROM article_view_counts").all()
  ]);
  const db=safeJson(text,{settings:{},categories:[],articles:[],contacts:[],citizens:[]});
  const counts=new Map((viewRows.results||[]).map(x=>[String(x.article_id),Number(x.views||0)]));
  for(const a of db.articles||[])a.views=Number(a.views||0)+Number(counts.get(String(a.id))||0);
  publicDbCache={at:nowMs,db};
  return db;
}
function fastHtml(body,status=200){
  return new Response(body,{status,headers:{
    "content-type":"text/html; charset=utf-8",
    "cache-control":"public, max-age=0, must-revalidate",
    "x-content-type-options":"nosniff",
    "x-frame-options":"SAMEORIGIN",
    "referrer-policy":"strict-origin-when-cross-origin",
    "x-nabzesardo-runtime":"cloudflare-fast-public-v1"
  }});
}
async function handleFastPublic(request,url,pathname,ctx){
  if(request.method!=="GET"&&request.method!=="HEAD")return null;
  if(pathname==="/nabez60")return Response.redirect(new URL("/all-news",request.url).toString(),301);
  if(pathname==="/briefs")return Response.redirect(new URL("/category/short-news",request.url).toString(),301);
  const recognized=
    pathname==="/"||pathname==="/all-news"||pathname==="/search"||pathname==="/about"||pathname==="/contact"||pathname==="/send-news"||
    /^\/local\/(sardouiyeh|jiroft|south-kerman)$/.test(pathname)||/^\/(?:n|news)\//.test(pathname)||/^\/category\//.test(pathname);
  if(!recognized)return null;
  const db=await loadPublicDbFast();
  let body="",status=200,articleId="";
  if(pathname==="/")body=views.home(db);
  else if(pathname==="/all-news")body=views.archive(db,url.searchParams.get("q")||"");
  else if(pathname==="/search")body=views.search(db,url.searchParams.get("q")||"");
  else if(pathname==="/about")body=views.simple(db,"about");
  else if(pathname==="/contact")body=views.simple(db,"contact",url.searchParams.get("ok")==="1");
  else if(pathname==="/send-news")body=views.simple(db,"send-news",url.searchParams.get("ok")==="1",url.searchParams.get("uploadError")||"");
  else if(pathname.startsWith("/local/")){
    body=views.localHub(db,pathname.slice("/local/".length));
    if(!body){body="صفحه پیدا نشد";status=404;}
  }else if(pathname.startsWith("/category/")){
    const key=pathname.slice("/category/".length);
    const cat=(db.categories||[]).find(x=>String(x.id)===key);
    if(cat)body=views.category(db,cat);else{body="دسته‌بندی یافت نشد";status=404;}
  }else{
    const prefix=pathname.startsWith("/news/")?"/news/":"/n/";
    const key=pathname.slice(prefix.length);
    const article=(db.articles||[]).find(x=>x.status==="published"&&(String(x.slug)===key||String(x.id)===key||shortArticleCodeWorker(x.id)===key||previousShortArticleCodeWorker(x.id)===key||legacyShortArticleCodeWorker(x.id)===key));
    if(article){body=views.article(db,article);articleId=String(article.id);}
    else{body="خبر یافت نشد";status=404;}
  }
  if(status===200&&ctx&&fastTrackablePath(pathname)){
    ctx.waitUntil(recordFastVisit(request,pathname,articleId).catch(err=>console.error("fast-analytics",String(err?.message||err))));
    if(articleId)ctx.waitUntil(ensureSocialPreviewForPath(pathname).catch(err=>console.error("fast-social-preview",String(err?.message||err))));
  }
  if(request.method==="HEAD")return new Response(null,{status,headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=0, must-revalidate","x-nabzesardo-runtime":"cloudflare-fast-public-v1"}});
  return fastHtml(body,status);
}

async function handlePublicPreview(request, url, pathname) {
  if (request.method !== "GET") return null;
  const db = await loadDbObject();

  if (pathname === "/health") {
    return Response.json({ ok: true, name: "nabzesardo-cloudflare", migrated: true, primary: isPrimary(), origin: "cloudflare", railwayDependency: false, storage: arvanConfig() ? "arvan" : "d1" });
  }
  if (pathname === "/") return html(views.home(db));
  if (pathname === "/all-news") return html(views.archive(db, url.searchParams.get("q") || ""));
  if (pathname === "/search") return html(views.search(db, url.searchParams.get("q") || ""));
  if (pathname === "/about") return html(views.simple(db, "about"));
  if (pathname === "/contact") return html(views.simple(db, "contact", url.searchParams.get("ok") === "1"));
  if (pathname === "/send-news") return html(views.simple(db, "send-news", url.searchParams.get("ok") === "1", url.searchParams.get("uploadError") || ""));

  let m = pathname.match(/^\/news\/(.+)$/);
  if (m) {
    const slug = m[1];
    const a = (db.articles || []).find(x => x.status === "published" && x.slug === slug);
    if (!a) return html("خبر یافت نشد", 404);
    const snapshot = await getState("snapshot_article:" + slug);
    return html(snapshot || views.article(db, a));
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


function arvanConfig() {
  const accessKey = String(env.ARVAN_ACCESS_KEY || "").trim();
  const secretKey = String(env.ARVAN_SECRET_KEY || "").trim();
  const endpoint = String(env.ARVAN_ENDPOINT || "").trim().replace(/\/+$/, "");
  const bucket = String(env.ARVAN_BUCKET || "").trim();
  if (!accessKey || !secretKey || !endpoint || !bucket) return null;
  let url;
  try { url = new URL(endpoint); } catch { return null; }
  const inferred = url.hostname.match(/^s3\.([^.]+)\.arvanstorage\.ir$/i);
  const region = String(env.ARVAN_REGION || inferred?.[1] || "ir-thr-at1").trim();
  return { accessKey, secretKey, endpoint, bucket, region, host: url.host };
}

function awsUriEncode(value = "") {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, ch =>
    "%" + ch.charCodeAt(0).toString(16).toUpperCase()
  );
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key, value) {
  const rawKey = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw", rawKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign(
    "HMAC", cryptoKey, new TextEncoder().encode(String(value))
  ));
}

function amzTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

async function arvanRequest(method, name = null, { body = null, contentType = "", timeoutMs = 45000 } = {}) {
  const cfg = arvanConfig();
  if (!cfg) throw new Error("arvan-not-configured");

  const hasObject = name !== null && name !== undefined && String(name).length > 0;
  let safe = "";
  if (hasObject) {
    safe = path.basename(String(name || ""));
    if (!safe || safe !== name) throw new Error("invalid-media-name");
  }

  const canonicalUri = "/" + awsUriEncode(cfg.bucket) + (hasObject ? "/" + awsUriEncode(safe) : "");
  const url = cfg.endpoint + canonicalUri;
  const payload = body == null
    ? new Uint8Array()
    : (Buffer.isBuffer(body) ? new Uint8Array(body) : (body instanceof Uint8Array ? body : new Uint8Array(body)));
  const payloadHash = await sha256Hex(payload);
  const stamp = amzTimestamp();
  const dateStamp = stamp.slice(0, 8);
  const canonicalHeaders =
    "host:" + cfg.host + "\n" +
    "x-amz-content-sha256:" + payloadHash + "\n" +
    "x-amz-date:" + stamp + "\n";
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method.toUpperCase(),
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");
  const scope = dateStamp + "/" + cfg.region + "/s3/aws4_request";
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    stamp,
    scope,
    await sha256Hex(new TextEncoder().encode(canonicalRequest))
  ].join("\n");

  const kDate = await hmacSha256("AWS4" + cfg.secretKey, dateStamp);
  const kRegion = await hmacSha256(kDate, cfg.region);
  const kService = await hmacSha256(kRegion, "s3");
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signature = bytesToHex(await hmacSha256(kSigning, stringToSign));

  const headers = new Headers({
    "x-amz-date": stamp,
    "x-amz-content-sha256": payloadHash,
    "authorization": "AWS4-HMAC-SHA256 Credential=" + cfg.accessKey + "/" + scope + ", SignedHeaders=" + signedHeaders + ", Signature=" + signature
  });
  if (contentType) headers.set("content-type", contentType);

  return fetch(url, {
    method: method.toUpperCase(),
    headers,
    body: method.toUpperCase() === "PUT" ? payload : undefined,
    signal: AbortSignal.timeout(timeoutMs)
  });
}

async function putArvanObject(name, data, contentType) {
  const res = await arvanRequest("PUT", name, { body: data, contentType });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error("arvan-put-" + res.status + (detail ? ":" + detail : ""));
  }
}

async function getArvanObject(name) {
  const res = await arvanRequest("GET", name);
  if (res.status === 404) return null;
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error("arvan-get-" + res.status + (detail ? ":" + detail : ""));
  }
  const data = Buffer.from(await res.arrayBuffer());
  return {
    data,
    contentType: res.headers.get("content-type") || mimeFor(name),
    size: data.length
  };
}

async function deleteArvanObject(name) {
  const res = await arvanRequest("DELETE", name);
  if (res.status === 404) return;
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error("arvan-delete-" + res.status + (detail ? ":" + detail : ""));
  }
}

async function probeArvan() {
  const cfg = arvanConfig();
  if (!cfg) return { configured: false, authenticated: false, status: null };
  try {
    const res = await arvanRequest("HEAD", null, { timeoutMs: 5000 });
    return { configured: true, authenticated: res.ok, status: res.status };
  } catch (err) {
    return { configured: true, authenticated: false, status: null, error: String(err?.message || err).slice(0, 180) };
  }
}

function backupCryptoMaterial() {
  const source = String(env.RUNTIME_PRIVATE_KEY || "");
  return source ? new TextEncoder().encode("nabzesardo-arvan-backup-v1|" + source) : null;
}

async function encryptBackupPayload(text) {
  const material = backupCryptoMaterial();
  if (!material) throw new Error("backup-encryption-key-unavailable");
  const rawKey = await crypto.subtle.digest("SHA-256", material);
  const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(String(text));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
  return JSON.stringify({
    format: "nabzesardo-encrypted-backup",
    version: 1,
    algorithm: "AES-256-GCM",
    createdAt: new Date().toISOString(),
    iv: Buffer.from(iv).toString("base64"),
    data: Buffer.from(cipher).toString("base64"),
    sha256: await sha256Hex(plain)
  });
}

function utcDayOffset(days = 0) {
  const d = new Date(Date.now() + Number(days || 0) * 86400000);
  return d.toISOString().slice(0, 10);
}

async function createDailyArvanBackup() {
  if (!arvanConfig()) return { ok: false, skipped: true, reason: "arvan-not-configured" };
  const day = utcDayOffset(0);
  if ((await getState("arvan_backup_day")) === day) {
    return { ok: true, skipped: true, day, at: await getState("arvan_backup_at") };
  }

  try {
    const [dbText, analyticsText] = await Promise.all([
      getState("db"),
      getState("analytics")
    ]);
    if (!dbText) throw new Error("backup-db-state-missing");

    const payload = JSON.stringify({
      format: "nabzesardo-database-backup",
      version: 1,
      createdAt: new Date().toISOString(),
      db: safeJson(dbText, {}),
      analytics: safeJson(analyticsText, {})
    });
    const encrypted = await encryptBackupPayload(payload);
    const objectName = "db-backup-" + day + ".json.enc";
    await putArvanObject(objectName, Buffer.from(encrypted, "utf8"), "application/octet-stream");

    // Flat object names let us retain exactly 30 days without needing bucket listing permissions.
    const expiredName = "db-backup-" + utcDayOffset(-31) + ".json.enc";
    try { await deleteArvanObject(expiredName); } catch {}

    const stamp = new Date().toISOString();
    await putState("arvan_backup_day", day);
    await putState("arvan_backup_at", stamp);
    await putState("arvan_backup_object", objectName);
    await putState("arvan_backup_bytes", String(Buffer.byteLength(encrypted)));
    await putState("arvan_backup_error", "");
    return { ok: true, day, at: stamp, object: objectName };
  } catch (err) {
    const message = String(err?.message || err).slice(0, 500);
    await putState("arvan_backup_error", message);
    console.error("arvan-daily-backup", message);
    return { ok: false, error: message };
  }
}

async function storageUsageStatus() {
  await ensureSchema();
  const [mediaRow, stateRow, chunkRow] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(size),0) AS bytes FROM media_meta").first(),
    env.DB.prepare("SELECT COALESCE(SUM(LENGTH(key)+LENGTH(value)),0) AS bytes FROM app_state").first(),
    env.DB.prepare("SELECT COALESCE(SUM(LENGTH(chunk_data)),0) AS bytes FROM media_chunks").first()
  ]);
  const mediaBytes = Number(mediaRow?.bytes || 0);
  const stateBytes = Number(stateRow?.bytes || 0);
  const chunkTextBytes = Number(chunkRow?.bytes || 0);
  return {
    mediaObjects: Number(mediaRow?.count || 0),
    arvanMediaBytes: mediaBytes,
    arvanFreeTierBytes: 5 * 1024 * 1024 * 1024,
    arvanUsagePercentOfFreeTier: Number(((mediaBytes / (5 * 1024 * 1024 * 1024)) * 100).toFixed(2)),
    d1TrackedBytesApprox: stateBytes + chunkTextBytes,
    d1FreeTierDatabaseLimitBytes: 500 * 1024 * 1024,
    d1UsagePercentApprox: Number((((stateBytes + chunkTextBytes) / (500 * 1024 * 1024)) * 100).toFixed(2))
  };
}

const MEDIA_CHUNK_BYTES = 1350000;

async function putMediaD1(safe, buf, contentType) {
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

async function putMedia(name, data, contentType = mimeFor(name)) {
  await ensureSchema();
  const safe = path.basename(String(name || ""));
  if (!safe || safe !== name) throw new Error("invalid-media-name");
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);

  if (arvanConfig()) {
    try {
      await putArvanObject(safe, buf, contentType);
      await env.DB.prepare("DELETE FROM media_chunks WHERE name = ?").bind(safe).run();
      await env.DB.prepare("DELETE FROM media_meta WHERE name = ?").bind(safe).run();
      await env.DB.prepare(
        "INSERT INTO media_meta(name,content_type,size,chunk_count,updated_at) VALUES(?,?,?,?,datetime('now'))"
      ).bind(safe, contentType, buf.length, 0).run();
      await putState("arvan_last_success", new Date().toISOString());
      await putState("arvan_last_error", "");
      return;
    } catch (err) {
      const message = String(err?.message || err).slice(0, 500);
      console.error("arvan-put-fallback", safe, message);
      await putState("arvan_last_error", message);
    }
  }

  await putMediaD1(safe, buf, contentType);
}

async function getMedia(name) {
  await ensureSchema();
  const safe = path.basename(String(name || ""));
  if (!safe || safe !== name) return null;
  const meta = await env.DB.prepare(
    "SELECT name,content_type,size,chunk_count FROM media_meta WHERE name = ? LIMIT 1"
  ).bind(safe).first();
  if (!meta) return null;

  if (Number(meta.chunk_count || 0) === 0 && arvanConfig()) {
    try {
      const remote = await getArvanObject(safe);
      if (!remote) return null;
      return {
        name: safe,
        contentType: String(meta.content_type || remote.contentType || mimeFor(safe)),
        size: Number(remote.size || meta.size || 0),
        data: remote.data
      };
    } catch (err) {
      console.error("arvan-get", safe, String(err?.message || err));
      return null;
    }
  }

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
    if (arvanConfig()) {
      try { await deleteArvanObject(safe); }
      catch (err) { console.error("arvan-delete", safe, String(err?.message || err)); }
    }
    await env.DB.prepare("DELETE FROM media_chunks WHERE name = ?").bind(safe).run();
    await env.DB.prepare("DELETE FROM media_meta WHERE name = ?").bind(safe).run();
  }
}

async function clearMedia() {
  await ensureSchema();
  if (arvanConfig()) {
    const rows = await env.DB.prepare("SELECT name FROM media_meta ORDER BY name ASC").all();
    for (const row of rows.results || []) {
      const safe = path.basename(String(row.name || ""));
      if (!safe) continue;
      try { await deleteArvanObject(safe); }
      catch (err) { console.error("arvan-clear-delete", safe, String(err?.message || err)); }
    }
  }
  await env.DB.prepare("DELETE FROM media_chunks").run();
  await env.DB.prepare("DELETE FROM media_meta").run();
}

async function migrateLegacyMediaBatch(limit = 2) {
  await ensureSchema();
  if (!arvanConfig()) return { migrated: 0, pending: null };
  const rows = await env.DB.prepare(
    "SELECT name,content_type,size,chunk_count FROM media_meta WHERE chunk_count > 0 ORDER BY updated_at ASC LIMIT ?"
  ).bind(Math.max(1, Math.min(10, Number(limit || 2)))).all();
  let migrated = 0;
  for (const row of rows.results || []) {
    const safe = path.basename(String(row.name || ""));
    if (!safe) continue;
    try {
      const media = await getMedia(safe);
      if (!media || !media.data?.length) continue;
      await putArvanObject(safe, media.data, media.contentType || mimeFor(safe));
      await env.DB.prepare("DELETE FROM media_chunks WHERE name = ?").bind(safe).run();
      await env.DB.prepare(
        "UPDATE media_meta SET chunk_count = 0, updated_at = datetime('now') WHERE name = ?"
      ).bind(safe).run();
      migrated++;
      await putState("arvan_last_success", new Date().toISOString());
      await putState("arvan_last_error", "");
    } catch (err) {
      const message = String(err?.message || err).slice(0, 500);
      console.error("arvan-migrate", safe, message);
      await putState("arvan_last_error", message);
    }
  }
  const pendingRow = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM media_meta WHERE chunk_count > 0"
  ).first();
  const pending = Number(pendingRow?.count || 0);
  await putState("arvan_media_pending", String(pending));
  await putState("arvan_media_last_migrated", String(migrated));
  if (migrated) await putState("arvan_media_last_run", new Date().toISOString());
  return { migrated, pending };
}

async function hydrateBackups() {
  ensureDirs();
  const rows = await env.DB.prepare("SELECT key,value FROM app_state WHERE key LIKE 'backup:%' ORDER BY updated_at DESC LIMIT 30").all();
  for (const row of rows.results || []) {
    const name = String(row.key || "").slice("backup:".length);
    const safe = path.basename(name);
    if (!safe || safe !== name || !safe.endsWith(".json")) continue;
    fs.writeFileSync(path.join(BACKUP_DIR, safe), String(row.value || ""), "utf8");
  }
}

async function hydrateBackupManifest() {
  ensureDirs();
  const rows = await env.DB.prepare(
    "SELECT key,length(value) AS size,updated_at FROM app_state WHERE key LIKE 'backup:%' ORDER BY updated_at DESC LIMIT 12"
  ).all();
  const manifest = (rows.results || []).map(row => ({
    name: String(row.key || "").slice("backup:".length),
    size: Number(row.size || 0),
    updatedAt: row.updated_at ? new Date(String(row.updated_at).replace(" ","T")+"Z").toISOString() : new Date().toISOString()
  })).filter(x => x.name && path.basename(x.name) === x.name && x.name.endsWith(".json"));
  fs.writeFileSync(BACKUP_MANIFEST_FILE, JSON.stringify(manifest), "utf8");
}

async function persistBackups() {
  ensureDirs();
  const names = fs.readdirSync(BACKUP_DIR).filter(x => x.endsWith(".json")).slice(-30);
  for (const name of names) {
    const value = fs.readFileSync(path.join(BACKUP_DIR, name), "utf8");
    await putState("backup:" + name, value);
  }
  // Retention is enforced inside D1. We never hydrate or compare every historical
  // backup during a normal request, which keeps editor saves and cron ticks light.
  await env.DB.prepare(
    "DELETE FROM app_state WHERE key IN (SELECT key FROM app_state WHERE key LIKE 'backup:%' ORDER BY updated_at DESC LIMIT -1 OFFSET 30)"
  ).run();
}

async function hydrateState({ includeUploads = false, includeBackups = false } = {}) {
  ensureDirs();
  const [dbText, analyticsText] = await Promise.all([
    getState("db"),
    getState("analytics")
  ]);
  if (dbText) fs.writeFileSync(DB_FILE, dbText, "utf8");
  if (analyticsText) fs.writeFileSync(ANALYTICS_FILE, analyticsText, "utf8");
  if (includeBackups) await hydrateBackups();

  if (includeUploads) {
    const items = await listMedia();
    for (const item of items) {
      const media = await getMedia(item.name);
      if (!media) continue;
      fs.writeFileSync(path.join(UPLOAD_DIR, path.basename(item.name)), media.data);
      uploadedMediaHashes.set(item.name,await sha256Hex(media.data));
    }
  }
  return { dbText: dbText || "", analyticsText: analyticsText || "" };
}

async function uploadTempFiles(onlyNames = null) {
  ensureDirs();
  const requested = onlyNames ? [...new Set(onlyNames.map(x=>path.basename(String(x||""))).filter(Boolean))] : fs.readdirSync(UPLOAD_DIR);
  let count = 0;
  for (const name of requested) {
    const file = path.join(UPLOAD_DIR, name);
    if(!fs.existsSync(file))continue;
    const stat=fs.statSync(file);
    if (!stat.isFile()) continue;
    const signature=String(stat.size)+":"+String(Math.trunc(stat.mtimeMs));
    if(uploadedMediaSignatures.get(name)===signature)continue;
    const data = fs.readFileSync(file);
    const hash=await sha256Hex(data);
    if(uploadedMediaHashes.get(name)===hash){
      uploadedMediaSignatures.set(name,signature);
      continue;
    }
    await putMedia(name, data, mimeFor(name));
    uploadedMediaHashes.set(name,hash);
    uploadedMediaSignatures.set(name,signature);
    count++;
  }
  return count;
}

async function flushState(before, request, response) {
  ensureDirs();
  const afterDbText = fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE, "utf8") : "";
  const afterAnalyticsText = fs.existsSync(ANALYTICS_FILE) ? fs.readFileSync(ANALYTICS_FILE, "utf8") : "";

  // Persist media first so a queued publication never points at missing files.
  let committedDb=safeJson(afterDbText,{});
  if (afterAnalyticsText && afterAnalyticsText !== before.analyticsText) await putState("analytics", afterAnalyticsText);

  const url = new URL(request.url);
  const restored = request.method === "POST" &&
    url.pathname === "/admin/backup/restore" &&
    response.status >= 300 && response.status < 400 &&
    String(response.headers.get("location") || "").includes("restored=1");

  if (restored) {
    await clearMedia();
    uploadedMediaHashes.clear();
    uploadedMediaSignatures.clear();
    await uploadTempFiles();
  } else if(request.method!=="GET"&&request.method!=="HEAD") {
    const oldRefs=uploadRefsFromText(before.dbText||"");
    const newRefs=uploadRefsFromText(afterDbText||"");
    const added=[...newRefs].filter(name=>!oldRefs.has(name));
    if(added.length)await uploadTempFiles(added);
  }
  if (afterDbText && afterDbText !== before.dbText) {
    committedDb=await publishing.commitChanges(env.DB,safeJson(before.dbText,{}),committedDb);
    fs.writeFileSync(DB_FILE,JSON.stringify(committedDb),"utf8");
  }

  if (before.dbText && afterDbText) {
    const oldRefs = uploadRefsFromText(before.dbText);
    const newRefs = uploadRefsFromText(JSON.stringify(committedDb));
    const removed = [...oldRefs].filter(x => !newRefs.has(x));
    if (removed.length) await deleteMedia(removed);
  }

  return { beforeDb: safeJson(before.dbText, {}), afterDb: committedDb };
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

  if (payload.runtimeAuth && payload.runtimeAuth.version === 1 && payload.runtimeAuth.user && payload.runtimeAuth.salt && payload.runtimeAuth.verifier) {
    await putState("admin_auth", JSON.stringify(payload.runtimeAuth));
  }
  if (payload.runtimeSecrets && payload.runtimeSecrets.version === 1 && payload.runtimeSecrets.wrappedKey && payload.runtimeSecrets.data) {
    await putState("runtime_secrets", JSON.stringify(payload.runtimeSecrets));
  }
  if (isPrimary()) {
    return Response.json({ ok: true, skippedData: true, refreshedRuntime: true, primary: true, syncedAt: new Date().toISOString() });
  }

  await putState("db", JSON.stringify(payload.db, null, 2));
  if (typeof payload.analytics === "string" && payload.analytics.trim()) {
    await putState("analytics", payload.analytics);
  }
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
  const assetResponse = await env.ASSETS.fetch(new Request(u, request));
  if (request.method !== "GET" || !assetResponse.ok) return assetResponse;
  const headers = new Headers(assetResponse.headers);
  if (u.searchParams.has("v")) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  } else {
    headers.set("cache-control", "public, max-age=86400, stale-while-revalidate=604800");
  }
  headers.set("x-content-type-options", "nosniff");
  return new Response(assetResponse.body, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers
  });
}

function decodeHtml(v = "") {
  return String(v)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function articleLinksFromHtml(html = "") {
  const out = [];
  const seen = new Set();
  const re = /href=["'](\/news\/[^"'?#]+)["']/g;
  let m;
  while ((m = re.exec(String(html)))) {
    const pathValue = m[1];
    if (seen.has(pathValue)) continue;
    seen.add(pathValue);
    out.push(pathValue);
  }
  return out;
}

function uploadLinksFromHtml(html = "") {
  const out = new Set();
  const re = /(?:src|href)=["'](\/uploads\/[^"'?#]+)["']/g;
  let m;
  while ((m = re.exec(String(html)))) out.add(m[1]);
  return [...out];
}

function newsSchemaFromHtml(html = "") {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(String(html)))) {
    try {
      const data = JSON.parse(decodeHtml(m[1]));
      const list = Array.isArray(data) ? data : [data];
      const news = list.find(x => x && x["@type"] === "NewsArticle");
      if (news) return news;
    } catch {}
  }
  return null;
}

function categoryIdFromArticleHtml(html = "") {
  const nav = String(html).match(/<nav[^>]*class=["'][^"']*article-breadcrumbs[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
  const hay = nav ? nav[1] : "";
  const m = hay.match(/href=["']\/category\/([^"']+)["']/i);
  return m ? decodeURIComponent(m[1]) : "";
}

async function syncPublicMedia(sourceBase, paths) {
  let count = 0;
  for (const raw of [...new Set(paths)].slice(0, 24)) {
    try {
      const u = new URL(raw, sourceBase);
      const name = path.basename(decodeURIComponent(u.pathname));
      if (!name) continue;
      const res = await fetch(u.toString(), { headers: { "user-agent": "NabezSardo-Cloudflare-Sync/1.0" } });
      if (!res.ok) continue;
      const data = Buffer.from(await res.arrayBuffer());
      if (!data.length || data.length > 12 * 1024 * 1024) continue;
      await putMedia(name, data, res.headers.get("content-type") || mimeFor(name));
      count++;
    } catch {}
  }
  return count;
}

async function publicPull() {
  if (isPrimary()) return { ok: true, skipped: true, reason: "cloudflare-primary" };
  const sourceBase = String(env.LEGACY_SYNC_SOURCE_URL || "").replace(/\/+$/, "");
  if (!sourceBase) return { ok: true, skipped: true, reason: "legacy-sync-disabled" };
  const previous = await getState("last_public_sync_at");
  if (previous && Date.now() - Date.parse(previous) < 60000) {
    return { ok: true, skipped: true, syncedAt: previous };
  }

  const common = { headers: { "user-agent": "NabezSardo-Cloudflare-Sync/1.0", "cache-control": "no-cache" } };
  const [homeRes, archiveRes] = await Promise.all([
    fetch(sourceBase + "/", common),
    fetch(sourceBase + "/all-news", common)
  ]);
  if (!homeRes.ok || !archiveRes.ok) {
    throw new Error("source-http-" + homeRes.status + "-" + archiveRes.status);
  }

  const [homeHtml, archiveHtml] = await Promise.all([homeRes.text(), archiveRes.text()]);
  if (!homeHtml.includes("نبض ساردو") || !archiveHtml.includes("نبض ساردو")) {
    throw new Error("source-content-validation-failed");
  }

  const db = await loadDbObject();
  db.settings = db.settings || {};
  db.categories = Array.isArray(db.categories) ? db.categories : [];
  db.articles = Array.isArray(db.articles) ? db.articles : [];
  db.contacts = Array.isArray(db.contacts) ? db.contacts : [];
  db.citizens = Array.isArray(db.citizens) ? db.citizens : [];

  const links = [...new Set([
    ...articleLinksFromHtml(homeHtml),
    ...articleLinksFromHtml(archiveHtml)
  ])].slice(0, 15);

  const mediaPaths = new Set([
    ...uploadLinksFromHtml(homeHtml),
    ...uploadLinksFromHtml(archiveHtml)
  ]);

  let syncedArticles = 0;
  for (const articlePath of links) {
    try {
      const articleUrl = new URL(articlePath, sourceBase);
      const res = await fetch(articleUrl.toString(), common);
      if (!res.ok) continue;
      const articleHtml = await res.text();
      const schema = newsSchemaFromHtml(articleHtml);
      if (!schema || !schema.headline) continue;

      const slugEncoded = articleUrl.pathname.replace(/^\/news\//, "");
      const slug = decodeURIComponent(slugEncoded);
      const categoryId = categoryIdFromArticleHtml(articleHtml);
      const existing = db.articles.find(a => a.slug === slug);
      const id = existing?.id || ("sync-" + (await sha256Hex(new TextEncoder().encode(slug))).slice(0, 16));
      const schemaImage = Array.isArray(schema.image) ? schema.image[0] : schema.image;
      let sourceImage = "";
      let sourceImagePath = "";
      if (schemaImage) {
        try {
          const iu = new URL(String(schemaImage), sourceBase);
          sourceImagePath = iu.pathname;
          sourceImage = iu.hostname === new URL(sourceBase).hostname ? iu.pathname : iu.toString();
        } catch {
          sourceImage = String(schemaImage || "");
        }
      }

      const baseArticle = {
        ...(existing || {}),
        id,
        slug,
        title: String(schema.headline || existing?.title || ""),
        lead: String(schema.description || existing?.lead || ""),
        body: existing?.body || String(schema.description || ""),
        bodyHtml: existing?.bodyHtml || "",
        categoryId: categoryId || existing?.categoryId || "",
        author: String(schema.author?.name || existing?.author || "تحریریه نبض ساردو"),
        status: "published",
        publishedAt: schema.datePublished || existing?.publishedAt || existing?.createdAt || new Date().toISOString(),
        updatedAt: schema.dateModified || new Date().toISOString(),
        createdAt: existing?.createdAt || schema.datePublished || new Date().toISOString(),
        featured: existing?.featured === true,
        views: Number(existing?.views || 0)
      };
      const category = db.categories.find(x => x.id === baseArticle.categoryId) || {};
      const smart = await ensureSmartCover({
        article: baseArticle, category, sourceImage, env,
        getMedia, putMedia, sha256Hex
      });
      const next = { ...baseArticle, ...smart };

      if (existing) Object.assign(existing, next);
      else db.articles.unshift(next);

      let storedArticleHtml = articleHtml;
      if (sourceImagePath && next.image && next.image !== sourceImage) {
        storedArticleHtml = storedArticleHtml.split(sourceImagePath).join(next.image);
        storedArticleHtml = storedArticleHtml.split(String(schemaImage)).join(next.image);
      } else if (!sourceImage && next.image) {
        const figure = '<figure class="article-cover-wrap"><div class="cover-frame landscape" data-adaptive-media style="--image-ratio:1.77778"><img class="cover" src="' + next.image + '" alt="" loading="eager" decoding="async" fetchpriority="high"></div><figcaption><span class="lang-fa">کاور خودکار خبر · نبض ساردو</span><span class="lang-en">Automatic news cover · Nabez Sardo</span></figcaption></figure>';
        storedArticleHtml = storedArticleHtml.replace('<div class="article-reading-zone">', figure + '<div class="article-reading-zone">');
      }
      await putState("snapshot_article:" + slug, storedArticleHtml);
      if (sourceImage && !isFallbackSourceImage(sourceImage)) {
        for (const p of uploadLinksFromHtml(articleHtml)) mediaPaths.add(p);
      }
      syncedArticles++;
    } catch (err) {
      console.error("public-sync-article", articlePath, String(err?.message || err));
    }
  }

  await putState("db", JSON.stringify(db, null, 2));
  await putState("snapshot_home", homeHtml);
  await putState("snapshot_archive", archiveHtml);
  const syncedMedia = await syncPublicMedia(sourceBase, [...mediaPaths]);
  const stamp = new Date().toISOString();
  await putState("last_public_sync_at", stamp);
  await putState("last_public_sync_articles", String(syncedArticles));
  await putState("last_public_sync_media", String(syncedMedia));
  return { ok: true, syncedAt: stamp, articles: syncedArticles, media: syncedMedia, discovered: links.length };
}

async function publicSyncStatus() {
  const [at, articles, media] = await Promise.all([
    getState("last_public_sync_at"),
    getState("last_public_sync_articles"),
    getState("last_public_sync_media")
  ]);
  const db = await loadDbObject();
  const runtimeSecrets = await decryptRuntimeSecrets();
  const analyticsState = safeJson(await getState("analytics"), {});
  const auto = (db.articles || []).filter(a => a.imageAuto === true);
  const storageCfg = arvanConfig();
  const storageProbe = await probeArvan();
  const legacyRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM media_meta WHERE chunk_count > 0").first();
  const [arvanLastSuccess, arvanLastError, backupAt, backupObject, backupBytes, backupError, usage] = await Promise.all([
    getState("arvan_last_success"),
    getState("arvan_last_error"),
    getState("arvan_backup_at"),
    getState("arvan_backup_object"),
    getState("arvan_backup_bytes"),
    getState("arvan_backup_error"),
    storageUsageStatus()
  ]);
  return {
    ok: true,
    source: "cloudflare-d1+arvan",
    cutoverMode: String(env.CUTOVER_MODE || "cloudflare-only"),
    cloudflarePrimary: isPrimary(),
    railwayDependency: false,
    legacySyncEnabled: Boolean(String(env.LEGACY_SYNC_SOURCE_URL || "").trim()),
    syncedAt: at || null,
    articles: Number(articles || 0),
    media: Number(media || 0),
    aiCovers: auto.filter(a => a.autoCoverSource === "ai").length,
    templateCovers: auto.filter(a => a.autoCoverSource === "template").length,
    fallbackCovers: auto.filter(a => a.autoCoverSource === "fallback").length,
    adminReady: Boolean(await runtimeAuth()),
    analyticsTotal: Number(analyticsState.allTimePageViews || 0),
    integrationsReady: {
      telegram: Boolean(runtimeSecrets.TELEGRAM_BOT_TOKEN && runtimeSecrets.TELEGRAM_CHAT_ID),
      rubika: Boolean(runtimeSecrets.RUBIKA_BOT_TOKEN && runtimeSecrets.RUBIKA_CHAT_ID),
      whatsapp: Boolean(runtimeSecrets.WHATSAPP_ACCESS_TOKEN && runtimeSecrets.WHATSAPP_PHONE_NUMBER_ID && runtimeSecrets.WHATSAPP_TO),
      googleVerification: Boolean(runtimeSecrets.GOOGLE_SITE_VERIFICATION)
    },
    fastLoginReady: Boolean(runtimeSecrets.ADMIN_USER && runtimeSecrets.ADMIN_PASS),
    storage: {
      provider: storageCfg ? "arvan" : "d1",
      arvanConfigured: Boolean(storageCfg),
      arvanAuthenticated: Boolean(storageProbe.authenticated),
      probeStatus: storageProbe.status,
      bucket: storageCfg?.bucket || null,
      region: storageCfg?.region || null,
      legacyPending: Number(legacyRow?.count || 0),
      lastSuccessAt: arvanLastSuccess || null,
      lastError: arvanLastError || null
    },
    backup: {
      enabled: Boolean(arvanConfig() && backupCryptoMaterial()),
      encrypted: true,
      retentionDays: 30,
      lastAt: backupAt || null,
      object: backupObject || null,
      bytes: Number(backupBytes || 0),
      lastError: backupError || null
    },
    usage,
    primary: isPrimary()
  };
}

async function prepareDistribution(a) {
  const initial=structuredClone(a);
  const db=safeJson(await getState("db"),{});
  try {
    if(a.autoCoverEnabled===true&&(a.imageAuto===true||isFallbackSourceImage(a.image||""))){
      const category=(db.categories||[]).find(x=>x.id===a.categoryId)||{};
      Object.assign(a,await ensureSmartCover({article:a,category,sourceImage:a.image||"",env,getMedia,putMedia,sha256Hex}));
    }
    if(a.imageAuto&&/\.svg(?:\?|$)/i.test(a.image||"")){
      await ensureRasterSocialImage(a);
    }
  }catch(err){console.error("publication-cover",a.id,String(err?.message||err));}
  await publishing.commitChanges(env.DB,{articles:[initial]},{articles:[a]});
  return a;
}
async function queuePublications(db){
  const automatic=automaticDistributionEnabled();
  for(const a of db.articles||[]){
    if(!a.distributionRequest||a.distributionCompletedRequest===a.distributionRequest)continue;
    if(!automatic&&a.distributionManualRequest!==a.distributionRequest)continue;
    await publishing.enqueue(env.DB,a);
  }
}
async function suppressPendingAutomaticPublications(){
  if(automaticDistributionEnabled())return false;
  const db=safeJson(await getState("db"),{});
  let changed=false;
  const pausedAt=new Date().toISOString();
  for(const a of db.articles||[]){
    if(!a.distributionRequest||a.distributionCompletedRequest===a.distributionRequest)continue;
    if(a.distributionManualRequest===a.distributionRequest)continue;
    a.distributionCompletedRequest=a.distributionRequest;
    a.distributionAutoPausedAt=pausedAt;
    changed=true;
  }
  if(changed)await putState("db",JSON.stringify(db,null,2));
  return changed;
}
async function drainPublications(){
  await applyRuntimeEnv();
  if(!automaticDistributionEnabled()){
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS publication_jobs(article_id TEXT PRIMARY KEY,request TEXT NOT NULL,status TEXT NOT NULL,distribution TEXT NOT NULL,updated_at INTEGER NOT NULL)").run();
    await env.DB.prepare("DELETE FROM publication_jobs WHERE status='pending' OR status='running'").run();
  }
  await queuePublications(safeJson(await getState("db"),{}));
  await publishing.drain(env.DB,{
    read:async id=>(safeJson(await getState("db"),{}).articles||[]).find(a=>a.id===id),
    prepare:prepareDistribution,
    dispatch:social.dispatch,
    persist:async(a,patch)=>{
      await publishing.commitChanges(env.DB,{articles:[a]},{articles:[{...a,...patch}]});
    }
  });
}

async function refreshOpinionSocialWording(){
  await applyRuntimeEnv();
  const db=safeJson(await getState("db"),{});
  let changed=false;
  for(const a of db.articles||[]){
    if(a.status!=='published'||String(a.categoryId||'')!=='opinion')continue;
    if(Number(a.socialWordingVersion||0)>=2)continue;
    let result={telegram:{status:'skipped'},rubika:{status:'skipped'}};
    try{result=await social.updateExisting(a);}
    catch(err){result={error:String(err&&err.message||err)};}
    a.socialWordingVersion=2;
    a.socialWordingRefresh={version:2,at:new Date().toISOString(),result};
    changed=true;
  }
  if(changed)await putState("db",JSON.stringify(db,null,2));
  return changed;
}

async function handleCloudflareAdminLogin(request) {
  const auth = await runtimeAuth();
  if (!auth) return new Response("Cloudflare admin authentication is not ready.", { status: 503 });
  const clone = request.clone();
  let fields;
  try {
    fields = new URLSearchParams(await clone.text());
  } catch {
    return new Response("Invalid login request.", { status: 400 });
  }
  const ok = await verifyRuntimePassword(fields.get("username"), fields.get("password"));
  if (!ok) return Response.redirect(new URL("/admin/login?error=1", request.url).toString(), 302);
  const body = new URLSearchParams({ username: String(auth.user), password: String(auth.verifier) }).toString();
  const headers = new Headers(request.headers);
  headers.set("content-type", "application/x-www-form-urlencoded");
  headers.delete("content-length");
  return handleApp(new Request(request.url, { method: "POST", headers, body, redirect: "manual" }));
}

async function ensureCutoverBackup() {
  const done = await getState("cutover_backup_created");
  if (done === "1") return;
  const dbText = await getState("db");
  if (!dbText) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await putState("backup:cutover-" + stamp + ".json", dbText);
  await putState("cutover_backup_created", "1");
}

function handleApp(request){return withLocalState(()=>handleAppSerial(request));}
async function handleAppSerial(request) {
  const url = new URL(request.url);
  if (!isPrimary() && String(env.PREVIEW_READONLY || "") === "1" && url.pathname.startsWith("/admin")) {
    return new Response("Preview admin is disabled until migration verification is complete.", { status: 403 });
  }
  if((request.method==="GET"||request.method==="HEAD")&&/^\/(?:n|news)\//.test(url.pathname)){
    await ensureSocialPreviewForPath(url.pathname);
  }
  const includeUploads = request.method === "GET" && url.pathname === "/admin/backup/download";
  const backupMutation = request.method === "POST" && (url.pathname === "/admin/backup/create" || url.pathname === "/admin/backup/restore");
  const includeBackupManifest = request.method === "GET" && url.pathname === "/admin";
  const before = await hydrateState({ includeUploads, includeBackups: false });
  if (includeBackupManifest) await hydrateBackupManifest();
  await ensureAppServer();
  const response = await handleAsNodeRequest(PORT, request);
  const states = await flushState(before, request, response);
  if (backupMutation) await persistBackups();
  return response;
}

export default {
  async fetch(request, _bindings, ctx) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    const p = decodeURIComponent(url.pathname);

    if (p === "/health" && request.method === "GET") {
      return Response.json({
        ok: true,
        name: "nabzesardo-cloudflare",
        primary: isPrimary(),
        origin: "cloudflare",
        railwayDependency: false,
        cutoverMode: String(env.CUTOVER_MODE || "cloudflare-only"),
        storage: arvanConfig() ? "arvan" : "d1",
        time: new Date().toISOString()
      });
    }
    if (p === "/__migration" && request.method === "GET") return migrationPage();
    if (p === "/__migration/import" && request.method === "POST") return importBackup(request);
    if (p === "/__sync/push" && request.method === "POST") return syncPush(request);
    if (p === "/__migration/export" && request.method === "GET") return exportBackup(request);
    if (p === "/__sync/status" && request.method === "GET") return Response.json(await publicSyncStatus());
    if (p === "/__cutover/status" && request.method === "GET") {
      const status = await publicSyncStatus();
      const ready = Boolean(
        status.cloudflarePrimary &&
        status.railwayDependency === false &&
        status.adminReady &&
        status.storage?.arvanConfigured &&
        status.storage?.arvanAuthenticated &&
        !status.storage?.lastError &&
        !status.backup?.lastError
      );
      return Response.json({ ...status, readyForRailwayShutdown: ready });
    }
    if (p === "/__sync/public-pull" && request.method === "POST") {
      if (isPrimary()) return Response.json({ ok: true, skipped: true, primary: true });
      try { return Response.json(await publicPull()); }
      catch (err) { return Response.json({ ok: false, error: String(err?.message || err) }, { status: 502 }); }
    }

    if (isPrimary() && p === "/admin/login" && request.method === "POST") {
      return handleCloudflareAdminLogin(request);
    }

    if (!isPrimary() && (p.startsWith("/admin") || (request.method !== "GET" && request.method !== "HEAD"))) {
      return new Response("Preview is read-only. Production writes run only on Cloudflare primary.", { status: 403 });
    }

    if (p.startsWith("/uploads/") && request.method === "GET") {
      return serveUpload(path.basename(p));
    }

    if ((p.startsWith("/assets/") || p === "/hero-mosque.jpg") && request.method === "GET") {
      return serveAsset(request, p);
    }

    if (isPrimary()) {
      await ensureCutoverBackup();
      const fastPublic=await handleFastPublic(request,url,p,ctx);
      if(fastPublic)return fastPublic;
      return handleApp(request);
    }

    const publicResponse = await handlePublicPreview(request, url, p);
    if (publicResponse) return publicResponse;

    if (String(env.PREVIEW_READONLY || "") === "1") {
      if (request.method === "GET" || request.method === "HEAD") return handleApp(request);
      return new Response("Preview is read-only.", { status: 403 });
    }

    return handleApp(request);
  },

  async scheduled() {
    if (!isPrimary() && String(env.PREVIEW_READONLY || "") === "1") {
      return;
    }
    await withLocalState(async()=>{
      const before=await hydrateState({includeBackups:false});
      await ensureAppServer();
      await articleTools.schedulerTick();
      const states=await flushState(before,new Request("https://nabzesardo.ir/__cron"),new Response(null,{status:204}));
      await persistBackups();
    });
    await suppressPendingAutomaticPublications();
    await drainPublications();
    if(isPrimary()){
      if(automaticDistributionEnabled()){
        try{await refreshOpinionSocialWording();}catch(err){console.error("opinion-social-refresh",String(err?.message||err));}
      }
      try{await migrateLegacyMediaBatch(10);}catch(err){console.error("arvan-migrate-batch",String(err?.message||err));}
      try{await createDailyArvanBackup();}catch(err){console.error("arvan-backup-tick",String(err?.message||err));}
    }
  }
};
