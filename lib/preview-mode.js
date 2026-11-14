'use strict';

function enabled(env=process.env){
  return /^(?:1|true|yes)$/i.test(String(env.PREVIEW_MODE||'').trim());
}
function securityHeaders(active){
  return active?{'X-Robots-Tag':'noindex, nofollow, noarchive'}:{};
}
function robotsTxt(){
  return 'User-agent: *\nDisallow: /\n';
}
module.exports={enabled,securityHeaders,robotsTxt};
