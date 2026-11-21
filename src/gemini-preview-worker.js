import store from "../lib/store.js";
import geminiBridge from "../lib/gemini-bridge.js";

// Strictly read-only preview against the real Cloudflare D1 news index.
// Public preview cannot write reports, alter articles, or authenticate editors.
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const p=url.pathname;
    if(p==='/api/gemini/articles'&&request.method==='GET'){
      const row=await env.DB.prepare("SELECT value FROM app_state WHERE key='db' LIMIT 1").first();
      const raw=row?.value?JSON.parse(row.value):{articles:[],categories:[]};
      const db=store.normalizeEditorialDb(raw);
      const articles=store.published(db).map(geminiBridge.mapArticle);
      return Response.json({ok:true,source:'cloudflare-d1',articles},{headers:{'cache-control':'private,no-store','x-robots-tag':'noindex, nofollow'}});
    }
    if(p==='/api/gemini/view')return new Response(null,{status:204,headers:{'cache-control':'no-store'}});
    if(p==='/api/gemini/config')return Response.json({ok:true,turnstileSiteKey:''});
    if(p.startsWith('/api/gemini/'))return Response.json({ok:false,error:'Preview is read-only'},{status:403});
    return env.ASSETS.fetch(request);
  }
};
