var mongoose = require("mongoose");
//Create RatingSchema
var ratingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId,  ref:'User'},
    rating: { type: Number,default:0},
    userName: { type: String,default:''}
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("Rating", ratingSchema);
