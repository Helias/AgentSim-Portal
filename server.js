// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var fileUpload  = require('express-fileupload');
var fs          = require('fs');
var nodemailer  = require('nodemailer');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose models
var Script = require('./app/models/script');

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.Promise = global.Promise;
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// use morgan to log requests to the console
app.use(morgan('dev'));

// use express-fileupload to upload file
app.use(fileUpload());

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
  console.log(req.body.name);
  User.findOne({
    "name": req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({
        success: false,
        message: 'Authentication failed. User not found.'
      });
    }
    else if(user.blocked){
      res.json({
        success: false,
        message: 'You have to verify your account first.'
      });
    }
    else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({
          success: false,
          message: 'Authentication failed. Wrong password.'
        });
      }
      else {

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
 * /register
 *
 * name:      name of the user [string]
 * password:  password of the user [string]
 * email:     email of the user [string]
 */
apiRoutes.post('/register', function(req, res) {
  // create a sample user
  var nick = new User({
    name: req.body.name,
    password: req.body.password,
    email: req.body.email,
    blocked: true,
    admin: true
  });

  // save the sample user
  nick.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
  });

  var id = nick._id;
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'alemidolo@gmail.com',
      pass: 'Followthereaper'
    }
  });

  var verify = 'http://localhost:8080/api/verify?token='+id;
  console.log(nick.email);
  var mailOptions = {
    from: 'alemidolo@gmail.com',
    to: nick.email,
    subject: 'Verify your AgentSim account!',
    text: verify
  };

  transporter.sendMail(mailOptions, function(err, info){
    if(err)
      throw(err);
    else {
      console.log('Message sent: ' +info.response);
      res.json(info.response);
    };
  });
});

/*
 * /verify route to verify an user's email
 *
 * user_id: user's id that needs to be verified [string]
 */
apiRoutes.get('/verify', function(req,res){
  var id_token = req.query.token;
  console.log(id_token);
  User.update({"_id": id_token}, {"$set": {"blocked": false}}, function(err){
    if(err)
      throw(err);
  });

  res.json({
    success: true,
    message: "User verified."
  });
});

/*
 * /users     route to return all users
 */
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

/*
 * /scripts     route to return all scripts
 *
 *  from:  starting point to see the number of scripts. example: from=20 => it will show scripts from 20 to 40
 */
apiRoutes.get('/scripts', function(req, res){

  Script.find({}, function(err, scripts){
    res.json(scripts);
  }).skip(req.query.from);
});

/*
 * /script/:user     route to return all user's scripts
 */
 apiRoutes.get('/scripts/:user', function(req, res){
  var user = req.params.user;
  console.log(user);
  Script.find({"users_id": user}, function(err, scripts){
    res.json(scripts);
  });
});


/*
 * /livesim
 *
 * path:    E  script's path that needs to be read [string]
 */
apiRoutes.get('/livesim', function(req, res){
  var html;
  fs.readFile('./header.html', function(err, data){
    if(err)
      throw(err);
    html = data;
  });
  fs.readFile(req.query.path, function(err, data){
    if(err)
      throw(err);

    html = html.toString().replace("<script></script>", data);
    res.write(html);
    res.end();
  });
});

/*
 * /upload - route to upload new scripts
 *
 * param_script:  content of the script
 * name:          name of the script
 OR
 * sampleFile: file.js that contain the script
 */
apiRoutes.post('/upload', function(req, res){
  if(!req.files && !req.body.param_script)
    res.json({
      success: false,
      message: 'No file uploaded.'
    });

  var upload_path;

  if(req.body.param_script && req.body.name){
    upload_path = 'upload/'+req.body.name+'.js';
    fs.writeFile(upload_path, req.body.param_script, function(err){
      if(err)
        throw(err);
    })
  }

  else{
    //the name of the input field is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile;

    //check if the file uploaded is html or javascript
    if(sampleFile.mimetype != "application/javascript"){
      res.json({
        success: false,
        message: 'You can update only .js files'
      })
    }

    //use the mv() method to place the file on server directory
    upload_path = './upload/'+sampleFile.name;
    sampleFile.mv(upload_path, function(err){
      if(err)
        throw err;
    });
  }

  // create a sample script
  var script = new Script({
    users_id: req.query.user_id,
    path: upload_path
  });

  // save the sample script
  script.save(function(err) {
    if (err) throw err;

    console.log('Script saved successfully');
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
