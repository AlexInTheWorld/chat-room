"use strict";
require('dotenv').config()
const routes = require('./routes.js');
const auth = require('./auth.js');
const express = require("express");
const myDB = require('./connection');
const session = require("express-session");
const passport = require('passport')
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const passportSocketIo = require("passport.socketio");
const cookieParser = require('cookie-parser');

const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

// compute the hash used to encrypt the cookie:
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: store
}));
app.use(passport.initialize());
app.use(passport.session());

app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');
app.set('views', `/${__dirname}/views/pug`);

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

myDB(async (client) => {
  let currentUsers = 0;
  const myDataBase = await client.db('database').collection('users');
  auth(app, myDataBase);
  routes(app, myDataBase);
  
  io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);

  io.on('connection', socket => {
    ++currentUsers;
    io.emit('user', {
    name: socket.request.user.name || socket.request.user.username,
    currentUsers,
    connected: true
    });
    socket.on('disconnect', () => {
      /*anything you want to do on disconnect*/
      --currentUsers;
      io.emit('user', {
    name: socket.request.user.name || socket.request.user.username,
    currentUsers,
    connected: false
    })
    });

    socket.on('chat message', (data) => {
      io.emit('chat message', {
        message: data,
        name: socket.request.user.name || socket.request.user.username,
        connected: true,
        reader: socket.request.user._id
      })
    });
    
});

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to login' });
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});

