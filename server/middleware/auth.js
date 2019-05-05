const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next = () => { }) => {
  if (req.cookies && req.cookies.shortbread) {
    models.Sessions.get({ hash: req.cookies.shortbread })
      .then(session => {
        if (session) {
          req.session = session;
          next();
        } else {
          models.Sessions.create()
            .then(okPacket => {
              return models.Sessions.get({ id: okPacket.insertId });
            })
            .then(session => {
              req.session = session;
              res.cookie('shortbread', session.hash);
              next();
            });
        }
      });
  } else {
    models.Sessions.create()
      .then(okPacket => {
        return models.Sessions.get({ id: okPacket.insertId });
      })
      .then(session => {
        req.session = session;
        req.cookies = req.cookies ? req.cookies : {};
        req.cookies.shortbread = session.hash;
        res.cookie('shortbread', session.hash);
        next();
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.verifySession = (req, res, next) => {
  if (!models.Sessions.isLoggedIn(req.session)) {
    res.redirect('/login');
  } else {
    next();
  }
};