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
			console.log(books.items);
			res.render('books/index', { books: books.items.sort(compare) });
		});
});

// SHOW - informacije o pojedinačnim knjigama
router.get('/:id', (req, res) => {
	//pronadji knjigu s tim ID-em
	let bookId = req.params.id;
	fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`)
		.then(res => res.json())
		.then(book => {
			res.render('books/show', { book });
		});
});

// // EDIT CAMPGROUND ROUTE
// router.get("/:slug/edit", isLoggedIn, checkCampgroundOwnership, (req, res) => {
//     res.render("campgrounds/edit", {
//         campground: req.campground
//     });
// });

// // UPDATE CAMPGROUND ROUTE
// router.put("/:slug", isLoggedIn, checkCampgroundOwnership, upload.single("image"), async (req, res) => {
//     delete req.body.campground.rating;
//     let campground = req.campground; // campground returned from checkCampgroundOwnership in middleware/index

//     if (req.file) {
//         try {
//             await cloudinary.uploader.destroy(campground.imageId);
//             let result = await cloudinary.uploader.upload(req.file.path);
//             campground.image = result.secure_url;
//         } catch (err) {
//             req.flash("error", err.message);
//             return res.redirect('back');
//         }
//     }
//     if (req.body.campground.location) {
//         try {
//             let data = await geocoder.geocode(req.body.campground.location);
//             campground.lat = data[0].latitude;
//             campground.lng = data[0].longitude;
//             campground.location = data[0].formattedAddress;
//         } catch (err) {
//             req.flash("error", "Invalid address");
//             return res.redirect("back");
//         }
//     }
//     campground.name = req.body.campground.name;
//     campground.price = req.body.campground.price;
//     campground.description = req.body.campground.description;
//     campground.save(err => {
//         if (err) {
//             req.flash("error", "Campground could not be updated!");
//             res.redirect("/campgrounds");
//         } else {
//             req.flash("success", "Campground successfully updated!");
//             res.redirect(`/campgrounds/${campground.slug}`);
//         }
//     });

// });

// // ADD CAMPGROUND TO FAVORITES ROUTE
// router.get("/favorites/:slug", isLoggedIn, async (req, res) => {
//     try {
//         let campground = await Campground.findOne({
//             slug: req.params.slug
//         });
//         req.user.favorites.push(campground._id);
//         req.user.save();
//         req.flash("success", `${campground.name} added to favorites!`)
//         res.redirect("/campgrounds");
//     } catch (err) {
//         req.flash("error", "Campground could not be added to favorites!");
//         res.redirect("back");
//     }
// });

// // DESTROY CAMPGROUND ROUTE
// router.delete("/:slug", isLoggedIn, checkCampgroundOwnership, async (req, res) => {
//     let campground = req.campground; // campground returned from checkCampgroundOwnership in middleware/index

//     try {
//         await campground.deleteOne();
//     } catch (err) {
//         req.flash("error", "Campground could not be removed!");
//         return res.redirect("back");
//     }
//     req.flash("success", "Campground succesfully removed!");
//     res.redirect("/campgrounds");
// });

// // function for escaping regular expressions in search input, /g is to replace all ocurrences of special characters (globally)
// let escapeRegexp = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

module.exports = router;
