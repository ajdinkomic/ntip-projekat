const Review = require('../models/review');
const User = require('../models/user');

module.exports = {
	isLoggedIn: (req, res, next) => {
		if (req.isAuthenticated()) {
			return next();
		}
		req.flash('error', 'Morate biti prijavljeni!');
		res.redirect('/login');
	},

	checkUserPrivileges: (req, res, next) => {
		User.findOne({ username: req.params.username }, (err, foundUser) => {
			if (err || !foundUser) {
				req.flash('error', 'Korisnik nije pronađen!');
				res.redirect('back');
			} else {
				if (foundUser.username == req.user.username || req.user.isAdmin) {
					req.userToEdit = foundUser;
					next();
				} else {
					req.flash('error', 'Nemate privilegije!');
					res.redirect('back');
				}
			}
		});
	},

	checkReviewOwnership: (req, res, next) => {
		Review.findById(req.params.review_id, (err, foundReview) => {
			if (err || !foundReview) {
				req.flash('error', 'Recenzija nije pronađena!');
				res.redirect('back');
			} else {
				if (foundReview.author.id.equals(req.user._id) || req.user.isAdmin) {
					req.review = foundReview;
					next();
				} else {
					req.flash('error', 'Nemate privilegije!');
					res.redirect('back');
				}
			}
		});
	},

	checkReviewExistence: async (req, res, next) => {
		let bookId = req.params.id;
		let foundReviews = await Review.find({ bookId }, err => {
			if (err) {
				req.flash('error', 'Recenzija nije pronađena!');
				res.redirect('back');
			}
		});
		let foundUserReview = false;
		if (foundReviews && foundReviews.length > 0) {
			for (const foundReview of foundReviews) {
				foundReview.author.id.equals(req.user._id) ? (foundUserReview = true) : (foundUserReview = false);
			}
			if (foundUserReview) {
				req.flash('error', 'Već ste napisali jednu recenziju!');
				return res.redirect(`/books/${bookId}`);
			}
		}
		next();
	}
};
