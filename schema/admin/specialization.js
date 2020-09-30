var mongoose = require("mongoose");
//Create SpecializationSchema
var specializationSchema = new mongoose.Schema({
    name: { type: String},
    userType: { type: String},//1- for personal, 2- for Expert
    fieldId: {type: mongoose.Schema.Types.ObjectId, required: false },
    description: { type: String}
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("Specialization", specializationSchema);
