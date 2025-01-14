///<reference path='types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='types/DefinitelyTyped/express/express.d.ts'/> 
///<reference path='public/javascripts/ServerCommService.ts'/> 
///<reference path='public/javascripts/Airport.ts'/> 
///<reference path='public/javascripts/BuildMap.ts'/> 
interface Error {

  status ? : number;

}
class Application {

  constructor() {
    var express = require('express');
    var path = require('path');
    var favicon = require('serve-favicon');
    var logger = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var passport = require('passport');

    // New Code
    var mongo = require('mongodb');
    var monk = require('monk');
    var db = monk('localhost:27017/sprint1db');
    var http = require('http');
	console.log(http);
    var routes = require('./routes/index');
    var users = require('./routes/users');
    var auth = require('./routes/auth');
    var app = express();

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    // uncomment after placing your favicon in /public
    //app.use(favicon(__dirname + '/public/favicon.ico'));
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: false
    }));
	app.use(function(req,res,next){
      req.db = db;
	  req.monk = monk;
	  req.mongo = mongo;
	  req.http = http;
	  req.serverCommInstance = new ServerCommService(req)
	  req.next = next;
      next();
    });
    app.use(cookieParser());

    var expressSession = require('express-session');

    app.use(expressSession({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: false,
      store: new expressSession.MemoryStore()
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.use(express.static(path.join(__dirname, 'public')));


    // Use requires to dependency inject instead
    // app.use(function(req,res,next){
    //     req.db = db;
    //         next();
    // });

    app.use('/', routes);
    app.use('/users', users);
    app.use('/auth', auth);

    app.use(function(req, res, next) {
      req.session = req.session || {};
    });

    /// catch 404 and forwarding to error handler
    app.use(function(req, res, next) {
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
    });

    /// error handlers

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
      app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
          message: err.message,
          error: err
        });
      });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: {}
      });
    });

    module.exports = app;
  }
}
var app = new Application();