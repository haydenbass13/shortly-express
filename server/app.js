const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const parseCookies = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(parseCookies);
app.use(Auth.createSession);


app.get('/', Auth.verifySession, (req, res) => {
  res.render('index');
});

app.get('/create', Auth.verifySession, (req, res) => {
  res.render('index');
});

app.get('/links', Auth.verifySession,
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links', Auth.verifySession,
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/signup',
  (req, res) => {
    res.render('signup');
  });

app.get('/logout', (req, res) => {
  console.log('BYE!');
  if (req.headers.cookie) {
    models.Sessions.get({ hash: req.cookies.shortbread })
      .then(session => {
        if (session && models.Sessions.isLoggedIn(session)) {
          models.Sessions.delete({ hash: session.hash });
          res.clearCookie('shortbread');
          res.redirect('/login');
        }
      });
  } else {
    res.end();
  }
});

app.post('/signup', (req, res) => {
  models.Users.create(req.body)
    .then(() => {
      return models.Users.get({ username: req.body.username });
    })
    .then(user => {
      models.Sessions.update({ hash: req.session.hash }, { userId: user.id });
      res.redirect('/');
    })
    .catch(err => {
      console.error(err);
      res.redirect('/signup');
    });
});

app.get('/login',
  (req, res) => {
    res.render('login');
  });

app.post('/login', (req, res) => {
  models.Users.get({ username: req.body.username })
    .then(user => {
      req.user = user;
      return user && models.Users.compare(req.body.password, user.password, user.salt);
    })
    .then(credentialsAreValid => {
      if (credentialsAreValid) {
        console.log('SUCCESS! You deserve a session, friend');
        models.Sessions.update({ hash: req.cookies.shortbread }, { userId: req.user.id });
        res.redirect('/');
      } else {
        console.log('INVALID credentials, please try again');
        res.redirect('/login');
      }
    });
});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
