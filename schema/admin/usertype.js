var mongoose = require("mongoose");
//Create FieldSchema
var usertypeSchema = new mongoose.Schema({
    name: { type: String},
    description: { type: String}
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("UserType", usertypeSchema);
