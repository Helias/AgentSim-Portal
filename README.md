# AgentSim-Portal
A web portal for [AgentSimJS](https://github.com/maxdeben83/agentsimjs)


### Requirements

- NodeJS & npm
- MongoDB
- AgentSimJS

### Install Requirements on Ubuntu 16.04

Install **NodeJS** and **npm**
```
$ curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh
$ ./nodesource_setup.sh
$ sudo apt install nodejs
```
Install **MongoDB**
```
$ sudo apt install mongodb-server
```

Download AgentSimJS, go in the directory project and run:
```
$ git submodule init
$ git submodule update
```

### Configure

Copy the file *config.js.dist* into **config.js** and configure it like:
```
module.exports = {
    'secret': 'your_secret_string',
    'database': "mongodb://localhost:27017/db_name",
    'email': 'user@gmail.com',
    'password': 'password',
    'home_path': 'http://localhost:8080'
};
```

Run your application:
```
$ node server.js
```

Now you can visit http://localhost:8080/ and see the output of the project!
