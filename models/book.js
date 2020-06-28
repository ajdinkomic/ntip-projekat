const mongoose = require('mongoose'),
	cloudinary = require('cloudinary').v2,
	Review = require('./review');

//schema
const bookSchema = new mongoose.Schema({
	name: {
		type: String,
		required: 'Book name cannot be blank!'
	},
	slug: {
		type: String,
		unique: true
	},
	price: Number,
	image: String,
	imageId: String,
	description: String,
	location: String,
	lat: Number,
	lng: Number,
	createdAt: {
		type: Date,
		default: Date.now
	},
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
		username: String
	},
	reviews: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Review'
		}
	],
	rating: {
		type: Number,
		default: 0
	}
});

bookSchema.pre(
	'deleteOne',
	{
		document: true,
		query: false
	},
	async function (req, res, next) {
		try {
			await cloudinary.uploader.destroy(this.imageId);
			await Review.deleteMany({
				_id: {
					$in: this.reviews
				}
			});
			await Notification.deleteMany({
				bookId: this.id
			});
			next();
		} catch (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
	}
);

// add a slug before the book gets saved to the database
bookSchema.pre('save', async function (next) {
	try {
		// check if a new book is being saved, or if the book name is being modified
		if (this.isNew || this.isModified('name')) {
			this.slug = await generateUniqueSlug(this._id, this.name);
		}
		next();
	} catch (err) {
		next(err);
	}
});

// module.exports is very important!!!
const book = mongoose.model('book', bookSchema);
module.exports = book;

let generateUniqueSlug = async (id, bookName, slug) => {
	try {
		// generate the initial slug (checks if it is not passed when calling a function in pre save hook)
		if (!slug) {
			slug = slugify(bookName);
		}
		// check if a book with the slug already exists
		const book = await book.findOne({
			slug: slug
		});
		// check if a book was found or if the found book is the current book (in case of updating a book)
		if (!book || book._id.equals(id)) {
			return slug;
		}
		// if not unique, generate a new slug
		const newSlug = slugify(bookName);
		// check again by calling the function recursively
		return await generateUniqueSlug(id, bookName, newSlug);
	} catch (err) {
		throw new Error(err);
	}
};

// method for making slug out of passed text(book name)
let slugify = text => {
	const slug = text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, '-') // replaces spaces with -
		.replace(/[^\w\-]+/g, '') // replace all non-word chars
		.replace(/\-\-+/g, '-') // replace multiple -- with single -
		.replace(/^-+/, '') // trim - from start of text
		.replace(/-+$/g, '') // trim - from end of text
		.substring(0, 75); // trim at 75 chars
	return slug + '-' + Math.floor(1000 + Math.random() * 9000); // add 4 random digits to improve uniqueness
};
