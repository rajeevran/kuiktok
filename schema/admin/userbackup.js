var mongoose = require("mongoose");
var bcrypt = require('bcrypt-nodejs');

//Create UserSchema
var UserSchema = new mongoose.Schema({
    
    fullname: { type: String, required: true },
    email: { type: String, required: true, index: {unique : true} },
    phone: { type: String, required: true },
    gender: { type: String, required: false },
    age: { type: Number, required: false  , default: 0},
    location: { type: String, required: false  , default: ''},
    website: { type: String, required: false  , default: ''},
    educationLabel: { type: String, required: false  , default: ''},
    field: [ {type: mongoose.Schema.Types.ObjectId, required: false } ],
    specialization: [
         {
             type: mongoose.Schema.Types.ObjectId, required: false ,
             ref:'Specialization'
        } 
        ],
    occupation: { type: String, required: false  , default: ''},
    contact: { type: String, required: false  , default: ''},
    experience: { type: String, required: false  , default: '0'},
    consultingFees: { type: Number, required: false  , default: 0},
    otp: { type: Number, required: false },
    isOnline: { type: Boolean, required: false, default:false },

    password: { type: String, required: false, select: false },

    socialLogin: { type:Object },
    
    devicetoken: {
        type: String,
        default: ''
    },
    apptype: {
        type: String,
        enum: ['IOS', 'ANDROID', 'BROWSER',''],
        default: ''
    },


    profileImage: {type: String , default: ''},
    permission: {
        view: { type: String, enum: ['1', '0'], default: '1'},
        add: { type: String, enum: ['1', '0'], default: '0'},        
        edit: { type: String, enum: ['1', '0'], default: '0'},
        delete: { type: String, enum: ['1', '0'], default: '0'}
    },
    settingGender: [{ type: String, default: '' }],        
    settingTalkLocation: [{ type: String, default: '' }],
    settingField: [ {type: mongoose.Schema.Types.ObjectId, required: false } ],
    settingSpecialization: [ {type: mongoose.Schema.Types.ObjectId, required: false } ],
    settingConsultingFees: [ { type: Number, required: false, default: 0 } ] ,
    settingStartage:{ type: Number, default: 0},        
    settingEndage: { type: Number, default: 0}, 
    settingUserType:{  type: String, enum: ['1', '2'] },        
    settingNotificationUserType:[{  type: String, enum: ['1', '2'] }],        

    authtoken: { type: String,default: '' },
    blockStatus: {  type: String, enum: ['yes', 'no'], default: 'no' },
    userType: {  type: String, enum: ['1', '2'], default: '1'},
    
    talkLocation: { type: String, required: false  , default: ''},
    talkTime: { type: Number, required: false , default: 0},
    deviceId: { type: String, required: false  , default: ''},
    talkChargeTime: { type: Number, required: false , default: 0 },
    dob: { type: Date, required: false },
    linkedIn: { type: String, required: false  , default: ''},
    city: { type: String, required: false  , default: ''},
    country: { type: String, required: false  , default: ''},

    
    aboutme: { type: String, required: false  , default: ''},

    termCondition: { type: String,  required: false,  default: '1' }
},{
    timestamps: true
});

UserSchema.pre('save', function(next){
    var admin = this;
    if(!admin.isModified('password')) return next();

    bcrypt.hash(admin.password, null, null, function(err, hash){
        if(err){return next(err);}

        admin.password = hash;
        next();
    });
});

// UserSchema.methods.comparePassword = function(password){
//     var admin = this;

//     return bcrypt.compareSync(password, admin.password);
// };


	


// Export your module
module.exports = mongoose.model("User", UserSchema);
