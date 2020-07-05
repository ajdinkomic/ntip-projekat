  const Review = require("../models/review");

module.exports = {
	isLoggedIn: (req, res, next) => {
		if (req.isAuthenticated()) {
			return next();
		}
		req.flash('error', 'Morate biti prijavljeni!'); // we can add this before res.redirect or in the same line as res.render like: return res.render("register", {"error": err.message});
		res.redirect('/login');
	},

	// checkCampgroundOwnership: (req, res, next) => {
	//     Campground.findOne({
	//         slug: req.params.slug
	//     }, (err, foundCampground) => {
	//         if (err || !foundCampground) { // error or foundcampground is null
	//             req.flash("error", "Campground not found!"); // we can add this before res.redirect or in the same line as res.render like: return res.render("register", {"error": err.message});
	//             res.redirect("/campgrounds");
	//         } else if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
	//             // does user own campground?
	//             // console.log(foundCampground.author.id); // this is object (mongoose object)
	//             // console.log(req.user._id); // this is String,so we can't use === but .equals
	//             req.campground = foundCampground;
	//             next();
	//         } else {
	//             req.flash("error", "You don't have permission!"); // we can add this before res.redirect or in the same line as res.render like: return res.render("register", {"error": err.message});
	//             res.redirect(`/campgrounds/${req.params.slug}`);
	//         }
	//     });
	// },

	checkReviewOwnership: (req, res, next) => {
	    Review.findById(req.params.review_id, (err, foundReview) => {
	        if (err || !foundReview) {
	            req.flash("error", "Recenzija nije pronađena!");
	            res.redirect("back");
	        } else {
	            if (foundReview.author.id.equals(req.user._id) || req.user.isAdmin) {
	                req.review = foundReview;
	                next();
	            } else {
									req.flash("error", "Nemate privilegije!"); 
									res.redirect("back");
	            }
	        }
	    });
	},

	checkReviewExistence: async (req, res, next) => {
		let bookId = req.params.id;
		let foundReviews = await Review.find({bookId}, err=>{
			if (err) {
				req.flash("error", "Recenzija nije pronađena!");
				res.redirect("back");
			}
		});
		let foundUserReview = false;
	  if(foundReviews && foundReviews.length > 0){
			for(const foundReview of foundReviews){
				foundReview.author.id.equals(req.user._id) ? foundUserReview=true : foundUserReview=false;
			}
	    if (foundUserReview) {
	    	req.flash("error", "Već ste napisali jednu recenziju!");
	      return res.redirect(`/books/${bookId}`);
	    }
		}
		next();
	}
};
