'use strict';
const publicViews=require('./view-public');
const adminViews=require('./view-admin');
const rebirthPublic=require('./rebirth-public');
const rebirthAdmin=require('./rebirth-admin');

// Keep the Cloudflare Worker and its existing route contract intact while
// replacing the public newsroom and editorial studio presentation.
function rebirthArchive(db,query={}) {
  return rebirthPublic.archive(db,query);
}

module.exports={
  ...publicViews,
  ...adminViews,
  ...rebirthPublic,
  ...rebirthAdmin,
  home:rebirthPublic.home,
  archive:rebirthArchive,
  // These legacy editorial workflows remain connected to the existing app.
  editorialPolicy:rebirthPublic.editorialPolicy,
  followup:rebirthPublic.followup,
  followupEditor:adminViews.followupEditor,
  shareKit:adminViews.shareKit
};
