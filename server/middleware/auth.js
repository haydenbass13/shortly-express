const models = require('../models');
const Promise = require('bluebird');
const parseCookies = require('./cookieParser');

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

