// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Script', new Schema({
	creation: {type: Date, default: Date.now},
	updated: {type: Date, default: Date.now},
	users_id: Schema.Types.ObjectId,
	path: String
}));