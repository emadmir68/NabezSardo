'use strict';

function enabled(env=process.env){
  if(/^(?:1|true|yes)$/i.test(String(env.PREVIEW_MODE||'').trim()))return true;
  const names=[env.RAILWAY_ENVIRONMENT_NAME,env.RAILWAY_GIT_BRANCH].map(x=>String(x||'').trim()).filter(Boolean);
  return names.some(name=>/^(?:pr(?:[-_/ #]|$)|preview(?:[-_/ ]|$)|design\/|fix\/|feature\/|hotfix\/)/i.test(name));
}
function securityHeaders(active){
  return active?{'X-Robots-Tag':'noindex, nofollow, noarchive'}:{};
}
function robotsTxt(){
  return 'User-agent: *\nDisallow: /\n';
}
module.exports={enabled,securityHeaders,robotsTxt};
