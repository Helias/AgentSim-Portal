// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose models
var Script = require('./app/models/script');

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// ######### API ROUTES #########

// get an instance of the router for api routes
var apiRoutes = express.Router();

// ######### PUBLIC API #########

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the AgentSimJS Portal API!' });
});

/*
 * /authenticate
 * name:      name of the user [string]
 * password:  password of the user [string]
 */
apiRoutes.post('/authenticate', function(req, res) {

  // find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({
        success: false,
        message: 'Authentication failed. User not found.'
      });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({
          success: false,
          message: 'Authentication failed. Wrong password.'
        });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: 1440 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }

    }

  });
});

// route middleware to verify a token
/*apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });

  }
});*/

// ######### API PROTECTED #########

/*
 * /setup
 * name:      name of the user [string]
 * password:  password of the user [string]
 */

apiRoutes.get('/setup/:name', function(req, res) {
  var name = req.params.name;

  if(name == "user"){
    // create a sample user
    var nick = new User({
      name: req.query.name,
      password: req.query.password,
      surname: "",
      nickname: "",
      admin: true
    });

    // save the sample user
    nick.save(function(err) {
      if (err) throw err;

      console.log('User saved successfully');
      res.json({ success: true });
    });
  }
  else if(name == "script"){
    // create a sample script
    if(!req.query.users_id){
      res.json({
        success: false,
        message: 'You have to specify the owner user.'
      });
    }
    var script = new Script({
      users_id: req.query.users_id
    });

    // save the sample script
    script.save(function(err) {
      if (err) throw err;

      console.log('Script saved successfully');
      res.json({ success: true });
    });
  }
  else{
    res.json({
      succes: false,
      message: 'You have to specify /setup/user or setup/script'
    });
  }
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

// route to return all scripts (GET http://localhost:8080/api/scripts)
apiRoutes.get('/scripts', function(req, res){
  Script.find({}, function(err, scripts){
    res.json(scripts);
  });
});

//route to return all user's scripts (GET http://localhost:8080/api/scripts/:user)
apiRoutes.get('/scripts/:user', function(req, res){
  var user = req.params.user;
  console.log(user);
  Script.find({"users_id": user}, function(err, scripts){
    res.json(scripts);
  });
});

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('AgentSimJS http://localhost:' + port);
/*
console.log(" █████╗  ██████╗ ███████╗███╗   ██╗████████╗    ███████╗██╗███╗   ███╗         ██╗███████╗");
console.log("██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝    ██╔════╝██║████╗ ████║         ██║██╔════╝");
console.log("███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║       ███████╗██║██╔████╔██║         ██║███████╗");
console.log("██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║       ╚════██║██║██║╚██╔╝██║    ██   ██║╚════██║");
console.log("██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║       ███████║██║██║ ╚═╝ ██║    ╚█████╔╝███████║");
console.log("╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚══════╝╚═╝╚═╝     ╚═╝     ╚════╝ ╚══════╝");
*/
