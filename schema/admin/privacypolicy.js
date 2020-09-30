var mongoose = require("mongoose");
//Create UserSchema
var privacypolicySchema = new mongoose.Schema({
    text: {type: String, default: ''}
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("privacypolicy", privacypolicySchema);
