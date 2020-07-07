const express = require('express'),
	router = express.Router(),
	passport = require('passport'),
	User = require('../models/user'),
	Review = require('../models/review'),
	async = require('async'),
	multer = require('multer'),
	cloudinary = require('cloudinary').v2,
	nodemailer = require('nodemailer'),
	crypto = require('crypto'),
	{ isLoggedIn, checkUserPrivileges } = require('../middleware');

// multer konfiguracija
const storage = multer.diskStorage({
	filename: (req, file, callback) => {
		callback(null, Date.now() + file.originalname);
	}
});
const imageFilter = (req, file, cb) => {
	// prihvati samo slike
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
		return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true);
};
const upload = multer({
	storage: storage,
	fileFilter: imageFilter
});

// cloudinary konfiguracija
cloudinary.config({
	cloud_name: 'ajdinkomiccloud',
	api_key: process.env.CLOUDINARY_API,
	api_secret: process.env.CLOUDINARY_SECRET
});

// LANDING STRANICA
router.get('/', async (req, res) => {
	try {
		res.render('landing');
	} catch (err) {
		req.flash('error', 'Početna stranica nije mogla biti učitana!');
		res.redirect('back');
	}
});

//================================================
//          AUTENTIFIKACIJA
//================================================

// REGISTRACIJA - forma
router.get('/register', (req, res) => {
	res.render('register', {
		page: 'register'
	});
});

// REGISTRACIJA - logika
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

// PRIJAVA - forma
router.get('/login', (req, res) => {
	res.render('login', {
		page: 'login'
	});
});

// PRIJAVA - logika
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

// ODJAVA
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('success', 'Uspješno ste se odjavili! Vidimo se.');
	res.redirect('/');
});

// PRIKAZI PROFIL
router.get('/users/:username', async (req, res) => {
	try {
		let user = await User.findOne({
			username: req.params.username
		});
		let reviews = await Review.find({
			'author.id': user._id
		});
		res.render('users/show', {
			user,
			reviews,
			page: 'profil'
		});
	} catch (err) {
		req.flash('error', 'Korisnik s tim korisničkom imenom nije pronađen!');
		res.redirect('back');
	}
});

// UREDI PROFIL - forma
router.get('/users/:username/edit', isLoggedIn, checkUserPrivileges, (req, res) => {
	res.render('users/edit', { user: req.userToEdit });
});

// UREDI PROFIL - logika
router.post('/users/:username/edit', isLoggedIn, checkUserPrivileges, upload.single('image'), async (req, res) => {
	let user = req.userToEdit;

	if (req.file) {
		try {
			await cloudinary.uploader.destroy(user.profileImageId);
			let result = await cloudinary.uploader.upload(req.file.path);
			user.profileImage = result.secure_url;
		} catch (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
	}
	user.username = req.body.username;
	user.firstName = req.body.firstName;
	user.lastName = req.body.lastName;
	user.email = req.body.email;
	user.save(err => {
		if (err) {
			req.flash('error', 'Profil ne može biti ažuriran!');
			res.redirect('/users');
		} else {
			req.flash('success', 'Uspješno ste uredili profil.');
			res.redirect(`/users/${user.username}`);
		}
	});
});

// // PROMIJENI SIFRU - forma
// router.get("/forgot", (req, res) => {
// 	res.render("forgot");
// });

// // PROMIJENI SIFRU - logika
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
//                     req.flash("error", "Nije pronađen korisnik s tom e-mail adresom!");
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
//                 subject: "Online Biblioteka - Zahtjev za promjenu šifre",
//                 text: `Pozdrav ${user.firstName},\n\nPrimate ovaj e-mail zato što ste zatražili promjenu šifre svog računa.\n\nMolimo kliknite na sljedeći link, ili kopirajte link u svoj web preglednik kako biste kompletirali proces:\n\nhttps://${req.headers.host}/reset/${token}\n\nUkoliko niste zatražili promjenu šifre, molimo ignorišite ovaj e-mail i vaša šifra će ostati nepromijenjena.\n\nHvala na povjerenju! Vaša NTIP Online Biblioteka.`
//             };
//             smtpTransport.sendMail(mailOptions, err => {
//                 req.flash("success", `E-mail je poslan na adresu: ${user.email} sa detaljnim uputama.`);
//                 done(err, "done");
//             });
//         }
//     ], err => {
//         if (err) return next(err);
//         res.redirect("/forgot");
//     });
// });

// // TOKEN ZA PROMJENU SIFRE - get
// router.get("/reset/:token", (req, res) => {
//     // $gt je >=
//     User.findOne({
//         resetPasswordToken: req.params.token,
//         resetPasswordExpires: {
//             $gt: Date.now()
//         }
//     }, (err, user) => {
//         if (err || !user) {
//             req.flash("error", "Token za promjenu šifre nije validan ili je istekao.");
//             return res.redirect("/forgot");
//         }
//         res.render("reset", {
//             token: req.params.token
//         });
//     });
// });

// TOKEN ZA PROMJENU SIFRE - post
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
// res.redirect("/users");
// });
// });

module.exports = router;
