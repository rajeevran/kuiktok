var mongoose = require("mongoose");
//Create BlockUserSchema
var blockUserSchema = new mongoose.Schema({
    fromUserId: { type: mongoose.Schema.Types.ObjectId,  ref:'User'},
    blockUserStatus: { type: Boolean,  default:false},
    toUserId: { type: mongoose.Schema.Types.ObjectId,  ref:'User'}
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("BlockUser", blockUserSchema);
