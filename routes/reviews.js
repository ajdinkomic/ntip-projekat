const express = require('express'),
	router = express.Router({
		mergeParams: true
	}),
	Review = require('../models/review'),
	{ isLoggedIn, checkReviewOwnership, checkReviewExistence } = require('../middleware');

// NOVA RECENZIJA
router.post('/', isLoggedIn, checkReviewExistence, (req, res) => {
	let bookId = req.params.id;

	Review.create(req.body.review, async (err, review) => {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		review.author.id = req.user._id;
		review.author.username = req.user.username;
		review.bookId = bookId;
		await review.save();
		req.flash('success', 'Hvala! Vaša recenzija je uspješno dodana.');
		res.redirect(`/books/${bookId}`);
	});
});

// OBRISI RECENZIJU
router.delete('/:review_id', isLoggedIn, checkReviewOwnership, async (req, res) => {
	let review = req.review;
	await review.remove();
	req.flash('success', 'Vaša recenzija je uspješno obrisana.');
	res.redirect('back');
});

module.exports = router;
