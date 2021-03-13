const passport = require('passport');
const bcrypt = require('bcrypt');
var flash = require('connect-flash');

module.exports = function(app, myDataBase) {
  // Show warning messages to the user through flash
  app.use(flash());

  function ensureAuthenticated(req, res, next) {
    console.log("you are going to be verified");
    console.log("Do you have permit to enter?")
    console.log(req.isAuthenticated());
    if (req.isAuthenticated()) {
      return next();
    } else {
      console.log("not authenticated!");
      res.redirect('/');
    }
  };
  
  
  app.route("/").get((req, res) => {
    res.render('index', {title: 'Connected to Database!', message: 'Please login/register'});
  });

  app.route('/login').get((req, res) => {
    let msg = req.flash('error')[0];
    res.render('login', {message: msg});
  });
  
  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/login', failureFlash: 'Invalid username or password' }), (req,res) => {
  res.redirect('/chat');
  });

  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
  });
  
  app.route('/register').get((req, res) => {
    let msg = req.flash('error')[0];
    res.render('register', {message: msg});   
  })

  app.route('/register')
    .post((req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, function(err, user) {
        if (err) {
          next(err);
        } else if (user) {
          req.flash('error', 'username taken')
          res.redirect('/register');
        } else {
          const hash = bcrypt.hashSync(req.body.password, 12);
          myDataBase.insertOne({
            username: req.body.username,
            password: hash
          },
            (err, doc) => {
              if (err) {
                res.redirect('/');
              } else {
                // The inserted document is held within
                // the ops property of the doc
                next(null, doc.ops[0]);
              }
            }
          )
        }
      })
    },
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res, next) => {
        res.redirect('/chat');
      }
    );

    app.route('/auth/github').get(passport.authenticate('github'));   

    app.route('/auth/github/callback').get(passport.authenticate('github', {failureRedirect: '/login'}), (req, res) => {
      req.session.user_id = req.user.id
      res.redirect('/chat');
    });
  
    app.route('/chat').get(ensureAuthenticated, (req, res) => {
      res.render('chat', {user: req.user.name || req.user.username, author: req.user._id})
    });

    app.use((req, res) => {
    res.redirect(404, "/");
    });

}