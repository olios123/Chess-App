const http = require('http'),
      path = require('path'),
      express = require('express'),
      handlebars = require('express-handlebars'),
      socket = require('socket.io'),
      ejs = require('ejs'),
      session = require('express-session')

const config = require('../config');

const myIo = require('./sockets/io'),
      routes = require('./routes/routes');

const app = express(),
      server = http.Server(app),
      io = socket(server);

const databse = require('./database/mysql');
const bodyParser = require('body-parser');
const store = new session.MemoryStore()

server.listen(config.port);

games = {};

myIo(io);

console.log(`Server listening on port ${config.port}`);

// Session handling
app.use(session({
  secret: 'key',
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true },
  store
}))

app.use((req, res, next) => {
  next()
})

// const Handlebars = handlebars.create({
//   extname: '.html', 
//   partialsDir: path.join(__dirname, '..', 'front', 'views', 'partials'), 
//   defaultLayout: false,
//   helpers: {}
// });
// app.engine('html', Handlebars.engine);
app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.set('views', path.join(__dirname, '..', 'front', 'views'));
app.use('/public', express.static(path.join(__dirname, '..', 'front', 'public')));
app.set('view engine', 'ejs');

routes(app);