var mongoose = require("mongoose");
//Create UserSchema
var TimerSchema = new mongoose.Schema({
    timer: [{type: Number}]
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("Timer", TimerSchema);
