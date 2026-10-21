const publicViews=require('./view-public');
const adminViews=require('./view-admin');
const claudeHome=require('./view-home-claude');
module.exports={...publicViews,...adminViews,home:claudeHome};
