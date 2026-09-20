const publicViews=require('./view-public');
const adminViews=require('./view-admin');
module.exports={...publicViews,...adminViews};