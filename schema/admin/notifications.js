var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;
var Notoficationschema = new Schema({

    from_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },

    message:  {type: String, required: false } ,

    to_user: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    channelId:  {type: String, required: false } ,
    timeForTalking:  {type: Number, required: false } 



}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', Notoficationschema);