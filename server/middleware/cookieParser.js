const parseCookies = (req, res, next) => {
  if (req.headers.cookie) {
    let cookieArray = req.headers.cookie.split(';');
    cookieArray.forEach(cookie => {
      let temp = cookie.split('=');
      req.cookies[temp[0].trim()] = temp[1];
    });
  }
  next();
};

module.exports = parseCookies;