const express = require('express'),
	router = express.Router(),
	passport = require('passport'),
	User = require('../models/user'),
	Review = require("../models/review"),
	async = require('async'),
	multer = require('multer'),
	cloudinary = require('cloudinary').v2,
	nodemailer = require('nodemailer'),
	crypto = require('crypto'),
	{ isLoggedIn } = require('../middleware');

// multer config
const storage = multer.diskStorage({
	filename: (req, file, callback) => {
		callback(null, Date.now() + file.originalname);
	}
});
const imageFilter = (req, file, cb) => {
	// only accept images
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
		return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true);
};
const upload = multer({
	storage: storage,
	fileFilter: imageFilter
});

// cloudinary config
cloudinary.config({
	cloud_name: 'ajdinkomiccloud',
	api_key: process.env.CLOUDINARY_API,
	api_secret: process.env.CLOUDINARY_SECRET
});

// LANDING PAGE
router.get('/', async (req, res) => {
	try {
		res.render('landing');
	} catch (err) {
		req.flash('error', 'Početna stranica nije mogla biti učitana!');
		res.redirect('back');
	}
});

//================================================
//          AUTH ROUTES
//================================================

// show register form
router.get('/register', (req, res) => {
	res.render('register', {
		page: 'register'
	});
});

// handle sign up logic
router.post('/register', upload.single('image'), async (req, res) => {
	let result, profileImage, profileImageId;
	if (req.file) {
		result = await cloudinary.uploader.upload(req.file.path);
		profileImage = result.secure_url;
		profileImageId = result.public_id;
	}
	const newUser = new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		profileImage: profileImage,
		profileImageId: profileImageId,
		email: req.body.email
	});
	if (req.body.adminCode === process.env.ADMINCODE) {
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, (err, user) => {
		if (err) {
			return res.render('register', {
				errorMessage: err.message
			});
		}
		passport.authenticate('local')(req, res, () => {
			req.flash('success', 'Uspješno ste se registrovali! Dobrodošli, ' + user.username + '.');
			res.redirect('/');
		});
	});
});

// show login form
router.get('/login', (req, res) => {
	res.render('login', {
		page: 'login'
	});
});

// handling login logic
router.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: true,
		successFlash: 'Dobrodošli nazad.'
	}),
	function (req, res) {}
);

// logout
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('success', 'Uspješno ste se odjavili! Vidimo se.');
	res.redirect('/');
});

// user profile
router.get("/users/:username", async (req, res) => {
    try {
        let user = await User.findOne({
            username: req.params.username
        });
        let reviews = await Review.find({
            "author.id": user._id
        });
        res.render("users/show", {
            user,
						reviews,
						page: 'profil'
        });
    } catch (err) {
        req.flash("error", 'Korisnik s tim korisničkom imenom nije pronađen!');
        res.redirect("back");
    }
});

// // forgot password
// router.get("/forgot", (req, res) => {
//     res.render("forgot");
// });

// router.post("/forgot", (req, res, next) => {
//     async.waterfall([
//         done => {
//             crypto.randomBytes(20, (err, buf) => {
//                 const token = buf.toString("hex");
//                 done(err, token);
//             });
//         },
//         (token, done) => {
//             User.findOne({
//                 email: req.body.email
//             }, (err, user) => {
//                 if (err || !user) {
//                     req.flash("error", "No account with that email address found.");
//                     return res.redirect("/forgot");
//                 }

//                 user.resetPasswordToken = token;
//                 user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

//                 user.save(err => {
//                     done(err, token, user);
//                 });
//             });
//         },
//         (token, user, done) => {
//             let reject = true;
//             if (process.env.REJECTUNAUTHORIZED && process.env.REJECTUNAUTHORIZED === "false") {
//                 reject = false;
//             }
//             const smtpTransport = nodemailer.createTransport({
//                 service: "Gmail",
//                 auth: {
//                     user: "ajdin.komic12@gmail.com",
//                     pass: process.env.MAILPW
//                 },
//                 tls: {
//                     rejectUnauthorized: reject
//                 }
//             });
//             const mailOptions = {
//                 to: user.email,
//                 from: "ajdin.komic12@gmail.com",
//                 subject: "YelpCamp Password Reset Request",
//                 text: `Dear ${user.firstName},\n\nYou are receiving this because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\nhttps://${req.headers.host}/reset/${token}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`
//             };
//             smtpTransport.sendMail(mailOptions, err => {
//                 req.flash("success", `An e-mail has been sent to ${user.email} with further instructions.`);
//                 done(err, "done");
//             });
//         }
//     ], err => {
//         if (err) return next(err);
//         res.redirect("/forgot");
//     });
// });

// router.get("/reset/:token", (req, res) => {
//     // $gt means greater than
//     User.findOne({
//         resetPasswordToken: req.params.token,
//         resetPasswordExpires: {
//             $gt: Date.now()
//         }
//     }, (err, user) => {
//         if (err || !user) {
//             req.flash("error", "Password reset token is invalid or has expired.");
//             return res.redirect("/forgot");
//         }
//         res.render("reset", {
//             token: req.params.token
//         });
//     });
// });

// router.post("/reset/:token", (req, res) => {
//     async.waterfall([
//         done => {
//             User.findOne({
//                 resetPasswordToken: req.params.token,
//                 resetPasswordExpires: {
//                     $gt: Date.now()
//                 }
//             }, (err, user) => {
//                 if (err || !user) {
//                     req.flash("error", "Password reset token is invalid or has expired.");
//                     return res.redirect("/forgot");
//                 }
//                 if (req.body.password === req.body.confirm) {
//                     user.setPassword(req.body.password, err => {
//                         user.resetPasswordToken = undefined;
//                         user.resetPasswordExpires = undefined;

//                         user.save(err => {
//                             if (err) {
//                                 req.flash("error", "User could not be saved to DB!");
//                                 return res.redirect("back");
//                             }
//                             req.logIn(user, err => {
//                                 done(err, user);
//                             });
//                         });
//                     });
//                 } else {
//                     req.flash("error", "Passwords do not match!");
//                     return res.redirect("back");
//                 }
//             });
//         },
//         (user, done) => {
//             let reject = true;
//             if (process.env.REJECTUNAUTHORIZED && process.env.REJECTUNAUTHORIZED === "false") {
//                 reject = false;
//             }
//             const smtpTransport = nodemailer.createTransport({
//                 service: "Gmail",
//                 auth: {
//                     user: "ajdin.komic12@gmail.com",
//                     pass: process.env.MAILPW
//                 },
//                 tls: {
//                     rejectUnauthorized: reject
//                 }
//             });
//             const mailOptions = {
//                 to: user.email,
//                 from: "ajdin.komic12@gmail.com",
//                 subject: "Your YelpCamp Password Has Been Changed",
//                 text: `Hello, ${user.firstName}\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
//             };
//             smtpTransport.sendMail(mailOptions, err => {
//                 req.flash("success", "Your password has been successfully changed.");
//                 done(err);
//             });
//         }
//     ], err => {
//         if (err) {
//             req.flash("error", "Something went wrong!");
//             return res.redirect("back");
// }
// res.redirect("/campgrounds");
// });
// });

module.exports = router;
