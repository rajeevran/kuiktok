var mongoose = require("mongoose");
//Create AbuseUserReportSchema
var abuseUserReportSchema = new mongoose.Schema({
    fromUserId: { type: mongoose.Schema.Types.ObjectId,  ref:'User'},
    toUserId: { type: mongoose.Schema.Types.ObjectId,  ref:'User'},
    title: { type: String,default:''},
    abuseReport: { type: String,default:''}
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("AbuseUserReport", abuseUserReportSchema);
