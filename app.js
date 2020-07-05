// configure dotenv package
const dotenv = require('dotenv');
dotenv.config();

const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	mongoose = require('mongoose'),
	flash = require('connect-flash'),
	passport = require('passport'),
	LocalStrategy = require('passport-local'),
	methodOverride = require('method-override'),
	User = require('./models/user');

// Require routes
const indexRoutes = require('./routes/index'),
			bookRoutes = require('./routes/books'),
    	reviewRoutes = require("./routes/reviews");
const moment = require('moment');

// FLASH MESSAGES - should come before passport
app.use(flash());

// MOMENT JS
app.locals.moment = require("moment");
moment.locale('hr');

// PASSPORT CONFIG
app.use(
	require('express-session')({
		secret: 'Always reading.',
		resave: false,
		saveUninitialized: false
	})
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// make our req.user or currentUser accessible on all routes and views
app.use(async (req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.errorMessage = req.flash('error');
	res.locals.successMessage = req.flash('success');
	next(); // IMPORTANT!!! it will stop without this
});

// connect to mongodb
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
const url = process.env.DATABASEURL || 'mongodb://localhost:27017/ntip';
mongoose.connect(url);

app.set('view engine', 'ejs');
app.use(
	bodyParser.urlencoded({
		extended: true
	})
);
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));

app.use('/', indexRoutes);
app.use('/books', bookRoutes);
app.use("/books/:id/reviews", reviewRoutes);

const port = process.env.PORT;
const ip = process.env.IP;
app.listen(port, ip, function () {
	console.log('Online Biblioteka Server Pokrenut!');
});
