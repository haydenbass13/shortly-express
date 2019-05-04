const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  let cookies = req.cookies; // has session hash, cookie name 'shortbread'
  // if 'shortbread' cookie exists on request
  // query database for the session hash
  // else
  // create a new session
  // assign the user to the session
  //object with property 'hash' & userID
  next();
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

