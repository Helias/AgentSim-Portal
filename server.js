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

/*
 * /livesim
 *
 * path:    the script's path that needs to be read [string]
 * data:    the script's text
 *
 */
app.post('/agentsim/livesim', function(req, res, next){
  fs.readFile('./header.html', function(err, data){
    if(err)
      throw(err);
    req.script = data;
    next();
  });
},function(req, res, next){
    if(req.body.path){
      fs.readFile("upload/" + req.body.path, function(err, data){
        if(err)
          throw(err);
        var html = req.script.toString().replace("<script></script>", "<script>" + data + "</script>");
        res.write(html);
        res.end();
      });
    }
    else
      next();
  },function(req, res, next){
      if(req.body.data){
        var html = req.script.toString().replace("<script></script>", "<script>" + req.body.data + "</script>");
        res.write(html);
        res.end();
      }
    }
);

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

/*
 * /register
 *
 * name:      name of the user [string]
 * password:  password of the user [string]
 * email:     email of the user [string]
 */

apiRoutes.post('/register', function(req, res, next) {
  User.find({email: req.body.email}, function(err, users){
    if(err)
      throw(err);
    if(users[0]){
      return res.json({
        success: false,
        message: "this email is already registered"
      });
    }
    else{
      next();
    }
  });
},function(req, res, next){
      User.find({name: req.body.name}, function(err, users) {
        if(err)
          throw(err);
        console.log(users[0]);
        if(users[0])
          return res.json({
            success: false,
            message: "This username already exist."
          });
        else{
          next();
        }
      });
  },function(req, res, next){
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
        res.json({
          success: true,
          message: "Utente registrato con successo!"
        })
        console.log('User saved successfully');
      });

      var id = nick._id;
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.email,
          pass: config.password
        }
      });

      var verify = 'http://localhost:8080/api/verify?token='+id;
      var mailOptions = {
        from: 'agentsimjs@gmail.com',
        to: nick.email,
        subject: 'Verify your AgentSim account!',
        text: verify
      };

      transporter.sendMail(mailOptions, function(err, info){
        if(err)
          throw(err);
        else {
          console.log('Message sent: ' +info.response);
          res.json({
            success: true,
            message: "Email di conferma inviata con successo!"
          });
        };
      });
      return;
  }
);

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
 * /email_verify route to verify if it already exists an user with this email
 *
 * email: email that needs to be verified [string]
 */
 apiRoutes.get('/email_verify', function(req, res){
   User.find({email: req.query.email}, function(err, users){
    if(err)
      throw(err);
    if(users[0])
      res.json({
        success: false,
        message: "This email is already registered"
      });
    else
      res.json({
        success: true,
        message: "Valid email"
      });
   });
 });

 apiRoutes.get('/nick_verify', function(req, res){
   User.find({name: req.query.name}, function(err, users){
    if(err)
      throw(err);
    if(users[0])
      res.json({
        success: false,
        message: "This username already exists"
      });
    else
      res.json({
        success: true,
        message: "Valid username"
      })
   });
 });

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {

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
});

// ######### API PROTECTED #########

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
  }).skip(req.query.from).sort({creation: -1});
});

/*
 * /script/:user     route to return all user's scripts
 */
 apiRoutes.get('/scripts/:user', function(req, res){
  var user = req.params.user;
  console.log(user);
  Script.find({owner: user}, function(err, scripts){
    res.json(scripts);
  }).sort({creation: -1});
});



/*
 * /upload - route to upload new scripts
 *
 * param_script:  content of the script
 * name:          name of the script
 OR
 * sampleFile: file.js that contain the script
 *
 * token: user's token
 */
apiRoutes.post('/upload', function(req, res, next){
  var token = req.body.token;

  jwt.verify(token, app.get('superSecret'), function(err, decoded) {
    if (err) {
      return res.json({ success: false, message: 'Failed to authenticate token.' });
    }
    else {
      req.id = decoded._doc._id;
      req.name = decoded._doc.name;
      next();
    }
  });
},function(req, res, next){
  if(!req.files && !req.body.param_script)
    return res.json({
      success: false,
      message: 'No file uploaded.'
    });

  var upload_path;

  if(req.body.param_script && req.body.name) {
    upload_path = req.body.name+'.js';
    fs.writeFile('upload/'+upload_path, req.body.param_script, function(err){
      if(err)
        throw(err);
      else{
        console.log("File created and uploaded");
        next();
      }
    })
  }
  else {
    //the name of the input field is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile;

    //check if the file uploaded is html or javascript
    if(sampleFile.mimetype != "application/javascript"){
      return res.json({
        success: false,
        message: 'You can update only .js files'
      });
    }

    //use the mv() method to place the file on server directory
    upload_path = sampleFile.name;
    sampleFile.mv('./upload/'+upload_path, function(err){
      if(err)
        throw err;
      else{
        console.log("File Uploaded");
        next();
      }
    });
  }
},function(req, res, next){
    var tmp = req.id;
    var name = req.name;
    // create a sample script
    var upload_path = req.files.sampleFile.name || req.body.name+'.js';
    var script = new Script({
      users_id: tmp,
      path: upload_path,
      owner: name
    });

    // save the sample script
    script.save(function(err) {
      if (err) throw err;

      console.log('Script saved successfully');
      res.json({
        success: true,
        message: "Scipt saved successfully"
      })
    });
  }
);

/*
 * /modify     route to modify a script
 *
 * token: user's token [token]
 * id_script: script's id
 * name: the new name the user want to give to own script
 * value: the new modified text of the script
 *
 */

apiRoutes.post('/modify', function(req, res, next){
  var token = req.body.token;

  jwt.verify(token, app.get('superSecret'), function(err, decoded) {
    if (err) {
      return res.json({ success: false, message: 'Failed to authenticate token.' });
    }
    else {
      req.tmp = decoded._doc.name;
      next();
    }
  });
},function(req, res, next){
    Script.find({ $and: [ {_id: req.body.id_script}, {owner: req.tmp} ]}, function(err, users){
      if(err)
        throw(err);
      else{
        if(!users[0])
          res.json({
            success: false,
            message: "You're not the owner of this script"
          })
        else{
          req.script_name = users[0].path;
          next();
        }
      }
    })
  },function(req, res, next){
      if(req.body.name){
        Script.update({"_id": req.body.id_script}, {"$set": {"path": req.body.name+".js"}}, function(err){
          if(err)
            throw(err);
          else{
            fs.rename('./upload/'+req.script_name, './upload/'+req.body.name+".js", function(err){
              if(err)
                throw(err);
              else{
                req.script_name = req.body.name;
                console.log("Name updated");
                next();
              }
            });
          }
        });
      }
      else
        next();
    },function(req, res, next){
        if(req.body.value){
          fs.writeFile('upload/'+req.script_name+".js", req.body.value, function(err){
            if(err)
              throw(err);
            else{
              console.log("File updated");
            }
          })
        }
        res.json({
          success: true,
          message: "File updated"
        })
    }
);

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
