const mongoose = require('mongoose'),
	pasportLocalMongoose = require('passport-local-mongoose'),
	UserSchema = new mongoose.Schema(
		{
			username: {
				type: String,
				unique: true,
				required: true
			},
			password: String,
			firstName: String,
			lastName: String,
			profileImage: String,
			profileImageId: String,
			email: {
				type: String,
				unique: true,
				required: true
			},
			resetPasswordToken: String,
			resetPasswordExpires: Date,
			isAdmin: {
				type: Boolean,
				default: false
			},
			favorites: [
				{
					type: String
				}
			]
		},
		{
			timestamps: true
		}
	);

UserSchema.plugin(pasportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
