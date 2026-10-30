const publicViews=require('./view-public');
const adminViews=require('./view-admin');
const cloudDancerHome=require('./view-home-2026');
module.exports={...publicViews,...adminViews,home:cloudDancerHome};
