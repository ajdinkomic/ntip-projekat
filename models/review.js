const mongoose = require('mongoose'),
	reviewSchema = new mongoose.Schema(
		{
			stars: {
				type: Number,
				required: 'Molimo unesite ocjenu (1-5 zvjezdica).',
				min: 1,
				max: 5,
				validate: {
					validator: Number.isInteger,
					message: '{VALUE} nije cijeli broj.'
				}
			},
			text: {
				type: String
			},
			author: {
				id: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User'
				},
				username: String
			},
			bookId: {
				type: String
			}
		},
		{
			timestamps: true
		}
	);

module.exports = mongoose.model('Review', reviewSchema);
