'use strict';
const publicViews=require('./rebirth-public');
const adminViews=require('./rebirth-admin');
module.exports={...publicViews,...adminViews};
