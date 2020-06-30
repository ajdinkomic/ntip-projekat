const express = require('express'),
	router = express.Router(),
	// Campground = require("../models/campground"),
	// User = require("../models/user"),
	// Notification = require("../models/notification"),
	multer = require('multer'),
	fetch = require('node-fetch'),
	cloudinary = require('cloudinary').v2,
	nodeGeocoder = require('node-geocoder');

const { isLoggedIn, checkCampgroundOwnership } = require('../middleware'); // if we require folder it requires automatically file named index.js

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

// google maps geocoder config
const options = {
		provider: 'google',
		httpAdapter: 'https',
		apiKey: process.env.GEOCODER_API,
		formatter: null
	},
	geocoder = nodeGeocoder(options);

// INDEX - prikazi sve knjige
router.get('/', (req, res) => {
	//funkcija za sortiranje po nazivu
	function compare(a, b) {
		if (a.volumeInfo.title < b.volumeInfo.title) {
			return -1;
		}
		if (a.volumeInfo.title > b.volumeInfo.title) {
			return 1;
		}
		return 0;
	}
	//parametar pretrage
	let searchTerm = req.query.search;
	fetch(`https://www.googleapis.com/books/v1/volumes?q=%22%22+intitle:${searchTerm}`)
		.then(res => res.json())
		.then(books => {
			// console.log(books.items);
			res.render('books/index', { books: books.items.sort(compare), page: '' });
		});
});

// PREGLEDAJ FAVORITE
router.get('/favorites', isLoggedIn, async (req, res) => {
	try {
		let favorites = req.user.favorites;
		let books = new Array();

		for (const favorite of favorites) {
			await fetch(`https://www.googleapis.com/books/v1/volumes/${favorite}`)
				.then(res => res.json())
				.then(data => {
					books.push(data);
				})
				.catch(err => {
					console.warn('Error: ' + err);
				});
		}

		res.render('books/favorites', { books, page: 'favoriti' });
	} catch (err) {
		req.flash('error', 'Ne možemo prikazati favorite!');
		res.redirect('back');
	}
});

// DODAJ U FAVORITE
router.get('/favorites/:id', isLoggedIn, async (req, res) => {
	try {
		let bookId = req.params.id;
		req.user.favorites.push(bookId);
		await req.user.save();
		res.redirect('back');
	} catch (err) {
		req.flash('error', 'Knjiga ne može biti dodana u favorite!');
		res.redirect('back');
	}
});

// UKLONI IZ FAVORITA
router.delete('/favorites/:id', isLoggedIn, async (req, res) => {
	let favorites = req.user.favorites;
	let filteredFavorites = favorites.filter(value => value != req.params.id);
	req.user.favorites = filteredFavorites;
	await req.user.save();
	req.flash('success', 'Uspješno ste uklonili knjigu iz favorita!');
	res.redirect('back');
});

// SHOW - informacije o pojedinačnim knjigama
router.get('/:id', (req, res) => {
	//pronadji knjigu s tim ID-em
	let bookId = req.params.id;
	fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`)
		.then(res => res.json())
		.then(book => {
			res.render('books/show', { book, page: '' });
		});
});

module.exports = router;
