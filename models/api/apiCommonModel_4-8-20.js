
var AdminSchema = require('../../schema/admin/admin');

var commonMethod = require("../../utility/common");
const fetch = require('node-fetch');


var AboutUsSchema = require('../../schema/admin/aboutus');
var UserSchema = require('../../schema/admin/user');
var FieldSchema = require('../../schema/admin/field');
var SpecializationSchema = require('../../schema/admin/specialization');
var NotificationsSchema = require('../../schema/admin/notifications');
var TimerSchema = require('../../schema/admin/timer');
var UserTypeSchema = require('../../schema/admin/usertype');
var RatingSchema = require('../../schema/admin/rating');


const moment = require('moment')


var TermSchema = require('../../schema/admin/term');
var PrivacyPolicySchema = require('../../schema/admin/privacypolicy');

var config = require('../../config');
var async = require("async");
var bcrypt = require('bcrypt-nodejs');
var mailProperty = require('../../modules/sendMail');

var jwt = require('jsonwebtoken');
var jwtOtp = require('jwt-otp');
var fs = require('fs');
var csvtojson = require("csvtojson");

var mongoose = require('mongoose');
var mongo = require('mongodb');

var FCM = require('fcm-node')
var fcmServerKey = config.FCM_SERVER_KEY;
const serverKey = fcmServerKey //put your server key here
const fcm = new FCM(serverKey);

var ObjectID = mongoose.Types.ObjectId;
var secretKey = config.secretKey;

//create auth token
createToken = (admin) => {
    var tokenData = {
        id: admin._id
    };
    var token = jwt.sign(tokenData, secretKey, {
        expiresIn: 86400
    });
    return token;
};

var commonModel = {
    authenticate: function (jwtData, callback) {
        if (jwtData["x-access-token"]) {
            jwt.verify(jwtData["x-access-token"], config.secretKey, function (err, decoded) {
                if (err) {
                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "Session timeout! Please login again.",
                        response: err
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Authenticate successfully.",
                        response: decoded
                    });
                }
            });
        }
    },
//#region AboutUs

changepassword: function (data, callback) {
    console.log('data----',data)
    if (data.userId) {
        UserSchema.findOne({
            _id: data.userId
        }, {
            "personal.fullname": 1
        }, function (err, resDetails) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 5005,
                    message: "INTERNAL DB ERROR",
                    response: err
                });
            } else {
                if (resDetails == null) {
                    callback({
                        success: false,
                        STATUSCODE: 5002,
                        message: "User does not exist",
                        response: {}
                    });
                } else {
                    bcrypt.hash(data.newPassword, null, null, function (err, hash) {
                        if (err) {
                            callback({
                                success: false,
                                STATUSCODE: 5005,
                                message: "INTERNAL DB ERROR",
                                response: err
                            });
                        } else {
                            UserSchema.update({
                                _id: resDetails._id
                            }, {
                                $set: {
                                    "personal.password": hash
                                }
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        success: false,
                                        STATUSCODE: 5005,
                                        message: "INTERNAL DB ERROR",
                                        response: err
                                    });
                                } else {
                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "Password changed.Please check your registered email.",
                                        response: {_id: resDetails._id, ...resDetails.personal}
                                    });
                                }
                            });
                        }
                    });

                }
            }
        });
    } else {
        callback({
            success: false,
            STATUSCODE: 5005,
            message: "User Id not provided",
            response: {}
        });
    }
},

forgotpassword: function (data, callback) {
    console.log('data----',data)

        UserSchema.findOne({
            "personal.email": data.email.toLowerCase()
        }, {
            "personal.fullname": 1
        }, function (err, resDetails) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 5005,
                    message: "INTERNAL DB ERROR",
                    response: err
                });
            } else {
                if (resDetails == null) {
                    callback({
                        success: false,
                        STATUSCODE: 5002,
                        message: "User does not exist",
                        response: {}
                    });
                } else {
                    bcrypt.hash(data.password, null, null, function (err, hash) {
                        if (err) {
                            callback({
                                success: false,
                                STATUSCODE: 5005,
                                message: "INTERNAL DB ERROR",
                                response: err
                            });
                        } else {
                            UserSchema.update({
                                _id: resDetails._id
                            }, {
                                $set: {
                                    "personal.password": hash
                                }
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        success: false,
                                        STATUSCODE: 5005,
                                        message: "INTERNAL DB ERROR",
                                        response: err
                                    });
                                } else {
                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "Password changed.Please check your registered email.",
                                        response: {_id: resDetails._id, ...resDetails.personal}
                                    });
                                }
                            });
                        }
                    });

                }
            }
        });
    
},

addEditUserSpecializationModel: async function (data, callback) {
                
    if (data) {


    var userDetails = await UserSchema.findOne({_id: data.userId})

    if(userDetails)
    {

        UserSchema.update({
            _id: data.userId
        }, {
            $set: {
                "personal.specialization": data.specialization
            }
        }, async function (err, result) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 5005,
                    message: "INTERNAL DB ERROR",
                    response: err
                });
            } else {
                var userDetail = await UserSchema.findOne({_id: data.userId})
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Specialization Updated Successfully.",
                    response: userDetail
                });
            }
        });

    }else{
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "User  not Exist.",
                    response: {}
                });
            }
          

    }
},

addVideoCallModel: async function (data, callback) 
{
                
    if (data) 
    {

    let searchFilters ={}

    if(data.talkTo == 'p2p' )
    {
        data.talkTo = "1"
        searchFilters["personal.userType"] = data.talkTo;
    }else if(data.talkTo == 'e2p' )
    {
        data.talkTo = "2"
        searchFilters["expert.userType"] = data.talkTo;
    }

    if (data.talkTo == '1') {

     //Gender
     if (data.settingGender.length>0) {
        searchFilters["personal.gender"] = {$in :data.settingGender}; 
      }
    //Age
      if (data.settingStartage && data.settingEndage) {
        searchFilters["personal.age"] = {
          $gte: data.settingStartage,
          $lte: data.settingEndage
        };
      }
    //Location
      if (data.settingTalkLocation) {


        //searchFilters["talkLocation"] = {$in :data.settingTalkLocation};

        console.log('data.settingTalkLocation---',data.settingTalkLocation)

        if(data.settingTalkLocation.length>0)
        {
            let count    =0
            let countryValue =''
            let cityValue =''
            async.each(data.settingTalkLocation , (value,cb) => {

                console.log('value---',value)
                if(value!='')
                {
                    if(value=='city' && data.city !=''){
                       // searchFilters["city"] = data.city;
                        cityValue= 'city'
                        count++;
                    }
                    if(value=='country'  && data.country !=''){
                       // searchFilters["country"] = data.country;
                        countryValue= 'country'
                        count++;
                    }
                    if(value=='world'  && data.world !=''){

                      //  searchFilters["country"] = data.country;

                    }
                }

            })

        if(count == 2)
        {
            searchFilters["personal.country"] = data.country;

        }else if(count == 1 && countryValue == 'country'){

            searchFilters["personal.country"] = data.country;

        }else if(count == 1 && cityValue == 'city'){

            searchFilters["personal.city"] = data.city;

        }



        }


      } 


    if (data.specialization) {


        searchFilters["personal.specialization"] = {$in :data.specialization};
    } 
    if (data.excludeUserId) {

        searchFilters["_id"] = {$ne :data.excludeUserId};
    } 

    var userDetails = await UserSchema.find(searchFilters)
    .populate('personal.specialization')
    let  userSpecializationArray = []
    let  enqDetailpersonal = []

    if(userDetails)
    {
        //console.log("userDetails",userDetails);
        let counter = 0

        for (let index = 0; index < userDetails.length; index++) {
            const field         = userDetails[index].personal.field;
            const deviceId      = userDetails[index].personal.deviceId;
            const specialization= userDetails[index].personal.specialization;
            const createdAt     = userDetails[index].personal.createdAt;
            const updatedAt     = userDetails[index].personal.updatedAt;
            const currUserId    = userDetails[index]._id;
            const elementId = { ...userDetails[index].toObject() };
            let ratingfieldName = await RatingSchema.findOne({userId:currUserId})
            if(ratingfieldName !== null)
            {
                ratingfieldName = ratingfieldName.rating
            }else{
                ratingfieldName = 0

            }

            enqDetailpersonal.push({
                _id: elementId._id,
                rating: ratingfieldName,
                  ...userDetails[index].personal
                });
            // const to_user       = userDetails[index]._id;
            // toUserArray.push(to_user)
    
            let fieldNameArray =[]
                for (let fieldIndex = 0; fieldIndex < field.length; fieldIndex++) {
                    const element = field[fieldIndex];
                     fieldName = await FieldSchema.findOne({_id:element})
                     fieldNameArray.push( fieldName.name )
                }
    
                let specializationNameArray = ''
    
                for (let specializationIndex = 0; specializationIndex < specialization.length; specializationIndex++) {
                    const element = specialization[specializationIndex];
    
    
                        //#region send notification to user
                        //console.log('noti=====>',data.specialization)
                       // data.specialization =  data.specialization)
                       // if(index == '0')
                       // {
                        if (data.specialization && data.specialization.length>0) {
    
                            searchFilters["_id"] = {$nin :data.userId};

                            var userSpecializationDetails = await UserSchema.find(searchFilters)

                            if(userSpecializationDetails.length>0)
                            {

                                for (let i = 0; i < userSpecializationDetails.length; i++) {
                                    userSpecializationArray.push(userSpecializationDetails[i]._id)
                                }
                            }          

                            for (let dataSpecializationIndex = 0; dataSpecializationIndex < data.specialization.length; dataSpecializationIndex++) {
                            
                                let dataSpecializationElement = data.specialization[dataSpecializationIndex];
                              
                                let specializationName        = await SpecializationSchema.findOne({_id:dataSpecializationElement})
                                
                                if(specializationName !== null)
                                {
                                    counter = counter +1
    
                                    specializationNameArray = specializationNameArray + specializationName.name +' ,' 
                                    
                                }
                                
                            }
                            
                        }
    
                      // }
                        //#endregion send notification to user
    
                }  
                
                
                
                if(counter > 0)
                {
                   // console.log('notification specialization matched-->',dataSpecializationElement)
    
                    //const userDeviceId = 'd9ogqEbG6XM:APA91bGZGKf8SaC086xJnaTPEqic3UCbhWZXpUwRHihnSzZLHopQwhNfWxoNpCaiNK9kYe2p0_50aVJ8TCZFDpiddEO9LEM-IbT8CLLpNYIzZP2ljO3Wf20UaqoReYAtekyln3BBIBkK'
                    //console.log('typeof currUserId-->',typeof currUserId)
                    //console.log('typeof data.userId-->',typeof data.userId)

                    const userDeviceId       = currUserId == data.userId ? '': deviceId
                    let  fullname     = ''
                    let  userAge      = ''
                    let  userSpec     = ''
                    let  userCity  = ''
                    let  userCountry  = ''
                    let  overallUserInfo      = ''

                    console.log('--udata data.userId---',data.userId)

                    if(data.userId){

                        let udata = await UserSchema.findOne({_id:data.userId})
                                          .populate('personal.specialization') 
                        if(udata.personal.specialization.length>0)
                        {
                            async.each(udata.personal.specialization, (spec)=>{
                                userSpec = userSpec + spec.name + ' ,'
                            })
                        }

                        fullname    = udata.personal.fullname.indexOf(' ') > -1 ? (udata.personal.fullname.split(' '))[0] : udata.personal.fullname
                        userAge     = udata.personal.age
                        userSpec    = userSpec.substr(0, userSpec.length-1)
                        userCity    = udata.personal.city
                        userCountry = udata.personal.country

                        overallUserInfo = fullname +', '+userAge+', in '+userCity+', '+userCountry
                    }
                    data.to_user = userSpecializationArray
                    console.log('overallUserInfo------>',overallUserInfo)
                    let message = overallUserInfo + ' Called to talk about ' + specializationNameArray.substr(0, specializationNameArray.length-1);
                    
                    let notificationResponse = await fcmSentPush(data, userDeviceId,message)
                   // console.log(notificationResponse,'notificationResponse');
                
    
                }
        }


                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "List of users fetched Successfully.",
                    totalData: userDetails.length,
                    response: enqDetailpersonal
                });
            

    }else{



                callback({
                    success: false,
                    STATUSCODE: 2000,
                    message: "Something Went Wrong.",
                    response: {}
                });
           
    
    }


    }else if (data.talkTo == '2') {

     //Gender
     if (data.settingGender.length>0) {
        searchFilters["expert.gender"] = {$in :data.settingGender}; 
      }
    //Age
      if (data.settingStartage && data.settingEndage) {
        searchFilters["expert.age"] = {
          $gte: data.settingStartage,
          $lte: data.settingEndage
        };
      }
    //Location
      if (data.settingTalkLocation) {


        //searchFilters["talkLocation"] = {$in :data.settingTalkLocation};

        console.log('data.settingTalkLocation---',data.settingTalkLocation)

        if(data.settingTalkLocation.length>0)
        {
            let count    =0
            let countryValue =''
            let cityValue =''
            async.each(data.settingTalkLocation , (value,cb) => {

                console.log('value---',value)
                if(value!='')
                {
                    if(value=='city' && data.city !=''){
                       // searchFilters["city"] = data.city;
                        cityValue= 'city'
                        count++;
                    }
                    if(value=='country'  && data.country !=''){
                       // searchFilters["country"] = data.country;
                        countryValue= 'country'
                        count++;
                    }
                    if(value=='world'  && data.world !=''){

                      //  searchFilters["country"] = data.country;

                    }
                }

            })

        if(count == 2)
        {
            searchFilters["expert.country"] = data.country;

        }else if(count == 1 && countryValue == 'country'){

            searchFilters["expert.country"] = data.country;

        }else if(count == 1 && cityValue == 'city'){

            searchFilters["expert.city"] = data.city;

        }



        }


      } 


    if (data.specialization) {


        searchFilters["expert.specialization"] = {$in :data.specialization};
    } 
    if (data.excludeUserId) {

        searchFilters["_id"] = {$ne :data.excludeUserId};
    } 

    var userDetails = await UserSchema.find(searchFilters)
    .populate('expert.specialization')

    let  userSpecializationArray = []
   // let  enqDetailpersonal = []
    let  enqDetailexpert   = []

    if(userDetails)
    {
        //console.log("userDetails",userDetails);
        let counter = 0


        for (let index = 0; index < userDetails.length; index++) {
            const field         = userDetails[index].expert.field;
            const deviceId      = userDetails[index].expert.deviceId;
            const specialization= userDetails[index].expert.specialization;
            const createdAt     = userDetails[index].expert.createdAt;
            const updatedAt     = userDetails[index].expert.updatedAt;
            const currUserId    = userDetails[index]._id;
            const elementId = { ...userDetails[index].toObject() };
            let ratingfieldName = await RatingSchema.findOne({userId:currUserId})
            if(ratingfieldName !== null)
            {
                ratingfieldName = ratingfieldName.rating
            }else{
                ratingfieldName = 0

            }
            enqDetailexpert.push({
              _id: elementId._id,
              rating:ratingfieldName,
                ...userDetails[index].expert
              });

            // const to_user       = userDetails[index]._id;
            // toUserArray.push(to_user)
    
            let fieldNameArray =[]
                for (let fieldIndex = 0; fieldIndex < field.length; fieldIndex++) {
                    const element = field[fieldIndex];
                     fieldName = await FieldSchema.findOne({_id:element})
                     fieldNameArray.push( fieldName.name )
                }
    
                let specializationNameArray = ''
    
                for (let specializationIndex = 0; specializationIndex < specialization.length; specializationIndex++) {
                    const element = specialization[specializationIndex];
    
                        if (data.specialization && data.specialization.length>0) {
    
                            searchFilters["_id"] = {$nin :data.userId};

                            var userSpecializationDetails = await UserSchema.find(searchFilters)

                            if(userSpecializationDetails.length>0)
                            {

                                for (let i = 0; i < userSpecializationDetails.length; i++) {
                                    userSpecializationArray.push(userSpecializationDetails[i]._id)
                                }
                            }          

                            for (let dataSpecializationIndex = 0; dataSpecializationIndex < data.specialization.length; dataSpecializationIndex++) {
                            
                                let dataSpecializationElement = data.specialization[dataSpecializationIndex];
                              
                                let specializationName        = await SpecializationSchema.findOne({_id:dataSpecializationElement})
                                
                                if(specializationName !== null)
                                {
                                    counter = counter +1
    
                                    specializationNameArray = specializationNameArray + specializationName.name +' ,' 
                                    
                                }
                                
                            }
                            
                        }
    
                      // }
                        //#endregion send notification to user
    
                }  
                
                
                
                if(counter > 0)
                {

                    const userDeviceId       = currUserId == data.userId ? '': deviceId
                    let  fullname     = ''
                    let  userAge      = ''
                    let  userSpec     = ''
                    let  userCity  = ''
                    let  userCountry  = ''
                    let  overallUserInfo      = ''

                    console.log('--udata data.userId---',data.userId)

                    if(data.userId){

                        let udata = await UserSchema.findOne({_id:data.userId})
                                          .populate('expert.specialization') 
                        if(udata.expert.specialization.length>0)
                        {
                            async.each(udata.expert.specialization, (spec)=>{
                                userSpec = userSpec + spec.name + ' ,'
                            })
                        }

                        fullname    = udata.expert.fullname.indexOf(' ') > -1 ? (udata.expert.fullname.split(' '))[0] : udata.expert.fullname
                        userAge     = udata.expert.age
                        userSpec    = userSpec.substr(0, userSpec.length-1)
                        userCity    = udata.expert.city
                        userCountry = udata.expert.country

                        overallUserInfo = fullname +', '+userAge+', in '+userCity+', '+userCountry
                    }
                    data.to_user = userSpecializationArray
                    console.log('overallUserInfo------>',overallUserInfo)
                    let message = overallUserInfo + ' Called to talk about ' + specializationNameArray.substr(0, specializationNameArray.length-1);
                    
                    let notificationResponse = await fcmSentPush(data, userDeviceId,message)
                   // console.log(notificationResponse,'notificationResponse');
                
    
                }
        }



                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "List of users fetched Successfully.",
                    totalData: userDetails.length,
                    response: enqDetailexpert
                });
           

    }else{



                callback({
                    success: false,
                    STATUSCODE: 2000,
                    message: "Something Went Wrong.",
                    response: {}
                });
           
    
    }

    }else{
           
   //personal details 

     //Gender
     if (data.settingGender) {
        searchFilters["personal.gender"] = {$in :data.settingGender}; 
      }
    //Age
      if (data.settingStartage && data.settingEndage) {
        searchFilters["personal.age"] = {
          $gte: data.settingStartage,
          $lte: data.settingEndage
        };
      }
    //Location
      if (data.settingTalkLocation) {


        //searchFilters["talkLocation"] = {$in :data.settingTalkLocation};

        console.log('data.settingTalkLocation---',data.settingTalkLocation)

        if(data.settingTalkLocation.length>0)
        {
            let count    =0
            let countryValue =''
            let cityValue =''
            async.each(data.settingTalkLocation , (value,cb) => {

                console.log('value---',value)
                if(value!='')
                {
                    if(value=='city' && data.city !=''){
                       // searchFilters["city"] = data.city;
                        cityValue= 'city'
                        count++;
                    }
                    if(value=='country'  && data.country !=''){
                       // searchFilters["country"] = data.country;
                        countryValue= 'country'
                        count++;
                    }
                    if(value=='world'  && data.world !=''){

                      //  searchFilters["country"] = data.country;

                    }
                }

            })

        if(count == 2)
        {
            searchFilters["personal.country"] = data.country;

        }else if(count == 1 && countryValue == 'country'){

            searchFilters["personal.country"] = data.country;

        }else if(count == 1 && cityValue == 'city'){

            searchFilters["personal.city"] = data.city;

        }
        }


      } 


    if (data.specialization) {
        searchFilters["personal.specialization"] = {$in :data.specialization};
    } 
    if (data.excludeUserId) {

        searchFilters["_id"] = {$ne :data.excludeUserId};
    } 

    var userDetails = await UserSchema.find(searchFilters)
    .populate('personal.specialization')
    let  userSpecializationArray = []
    let  enqDetailpersonal = []

    if(userDetails)
    {
        //console.log("userDetails",userDetails);
        let counter = 0

        for (let index = 0; index < userDetails.length; index++) {
            const field         = userDetails[index].personal.field;
            const deviceId      = userDetails[index].personal.deviceId;
            const specialization= userDetails[index].personal.specialization;
            const createdAt     = userDetails[index].personal.createdAt;
            const updatedAt     = userDetails[index].personal.updatedAt;
            const currUserId    = userDetails[index]._id;
            const elementId = { ...userDetails[index].toObject() };
            let ratingfieldName = await RatingSchema.findOne({userId:currUserId})
            if(ratingfieldName !== null)
            {
                ratingfieldName = ratingfieldName.rating
            }else{
                ratingfieldName = 0

            }
            enqDetailpersonal.push({
                _id: elementId._id,
                rating: ratingfieldName,
                  ...userDetails[index].personal
                });
            // const to_user       = userDetails[index]._id;
            // toUserArray.push(to_user)
    
            let fieldNameArray =[]
                for (let fieldIndex = 0; fieldIndex < field.length; fieldIndex++) {
                    const element = field[fieldIndex];
                     fieldName = await FieldSchema.findOne({_id:element})
                     fieldNameArray.push( fieldName.name )
                }
    
                let specializationNameArray = ''
    
                for (let specializationIndex = 0; specializationIndex < specialization.length; specializationIndex++) {
                    const element = specialization[specializationIndex];
    
    
                        //#region send notification to user
                        //console.log('noti=====>',data.specialization)
                       // data.specialization =  data.specialization)
                       // if(index == '0')
                       // {
                        if (data.specialization && data.specialization.length>0) {
    
                            searchFilters["_id"] = {$nin :data.userId};

                            var userSpecializationDetails = await UserSchema.find(searchFilters)

                            if(userSpecializationDetails.length>0)
                            {

                                for (let i = 0; i < userSpecializationDetails.length; i++) {
                                    userSpecializationArray.push(userSpecializationDetails[i]._id)
                                }
                            }          

                            for (let dataSpecializationIndex = 0; dataSpecializationIndex < data.specialization.length; dataSpecializationIndex++) {
                            
                                let dataSpecializationElement = data.specialization[dataSpecializationIndex];
                              
                                let specializationName        = await SpecializationSchema.findOne({_id:dataSpecializationElement})
                                
                                if(specializationName !== null)
                                {
                                    counter = counter +1
    
                                    specializationNameArray = specializationNameArray + specializationName.name +' ,' 
                                    
                                }
                                
                            }
                            
                        }
    
                      // }
                        //#endregion send notification to user
    
                }  
                if(counter > 0)
                {
                   // console.log('notification specialization matched-->',dataSpecializationElement)
    
                    //const userDeviceId = 'd9ogqEbG6XM:APA91bGZGKf8SaC086xJnaTPEqic3UCbhWZXpUwRHihnSzZLHopQwhNfWxoNpCaiNK9kYe2p0_50aVJ8TCZFDpiddEO9LEM-IbT8CLLpNYIzZP2ljO3Wf20UaqoReYAtekyln3BBIBkK'
                    //console.log('typeof currUserId-->',typeof currUserId)
                    //console.log('typeof data.userId-->',typeof data.userId)

                    const userDeviceId       = currUserId == data.userId ? '': deviceId
                    let  fullname     = ''
                    let  userAge      = ''
                    let  userSpec     = ''
                    let  userCity  = ''
                    let  userCountry  = ''
                    let  overallUserInfo      = ''

                    console.log('--udata data.userId---',data.userId)

                    if(data.userId){

                        let udata = await UserSchema.findOne({_id:data.userId})
                                          .populate('personal.specialization') 
                        if(udata.personal.specialization.length>0)
                        {
                            async.each(udata.personal.specialization, (spec)=>{
                                userSpec = userSpec + spec.name + ' ,'
                            })
                        }

                        fullname    = udata.personal.fullname.indexOf(' ') > -1 ? (udata.personal.fullname.split(' '))[0] : udata.personal.fullname
                        userAge     = udata.personal.age
                        userSpec    = userSpec.substr(0, userSpec.length-1)
                        userCity    = udata.personal.city
                        userCountry = udata.personal.country

                        overallUserInfo = fullname +', '+userAge+', in '+userCity+', '+userCountry
                    }
                    data.to_user = userSpecializationArray
                    console.log('overallUserInfo------>',overallUserInfo)
                    let message = overallUserInfo + ' Called to talk about ' + specializationNameArray.substr(0, specializationNameArray.length-1);
                    
                    let notificationResponse = await fcmSentPush(data, userDeviceId,message)
                   // console.log(notificationResponse,'notificationResponse');
                
    
                }
        }


 //               callback({
   //                 success: true,
     //               STATUSCODE: 2000,
       //             message: "List of users fetched Successfully.",
         //           totalData: userDetails.length,
           //         response: enqDetailpersonal
             //   });
            

    }else{



                callback({
                    success: false,
                    STATUSCODE: 2000,
                    message: "Something Went Wrong.",
                    response: {}
                });
           
    
    }


//Expert details


         //Gender
     if (data.settingGender) {
        searchFilters["expert.gender"] = {$in :data.settingGender}; 
      }
    //Age
      if (data.settingStartage && data.settingEndage) {
        searchFilters["expert.age"] = {
          $gte: data.settingStartage,
          $lte: data.settingEndage
        };
      }
    //Location
      if (data.settingTalkLocation) {


        //searchFilters["talkLocation"] = {$in :data.settingTalkLocation};

        console.log('data.settingTalkLocation---',data.settingTalkLocation)

        if(data.settingTalkLocation.length>0)
        {
            let count    =0
            let countryValue =''
            let cityValue =''
            async.each(data.settingTalkLocation , (value,cb) => {

                console.log('value---',value)
                if(value!='')
                {
                    if(value=='city' && data.city !=''){
                       // searchFilters["city"] = data.city;
                        cityValue= 'city'
                        count++;
                    }
                    if(value=='country'  && data.country !=''){
                       // searchFilters["country"] = data.country;
                        countryValue= 'country'
                        count++;
                    }
                    if(value=='world'  && data.world !=''){

                      //  searchFilters["country"] = data.country;

                    }
                }

            })

        if(count == 2)
        {
            searchFilters["expert.country"] = data.country;

        }else if(count == 1 && countryValue == 'country'){

            searchFilters["expert.country"] = data.country;

        }else if(count == 1 && cityValue == 'city'){

            searchFilters["expert.city"] = data.city;

        }



        }


      } 


    if (data.specialization) {


        searchFilters["expert.specialization"] = {$in :data.specialization};
    } 
    if (data.excludeUserId) {

        searchFilters["_id"] = {$ne :data.excludeUserId};
    } 

    var userDetails = await UserSchema.find(searchFilters)
    .populate('expert.specialization')

     userSpecializationArray = []
   // let  enqDetailpersonal = []
    let  enqDetailexpert   = []

    if(userDetails)
    {
        //console.log("userDetails",userDetails);
        let counter = 0


        for (let index = 0; index < userDetails.length; index++) {
            const field         = userDetails[index].expert.field;
            const deviceId      = userDetails[index].expert.deviceId;
            const specialization= userDetails[index].expert.specialization;
            const createdAt     = userDetails[index].expert.createdAt;
            const updatedAt     = userDetails[index].expert.updatedAt;
            const currUserId    = userDetails[index]._id;
            const elementId = { ...userDetails[index].toObject() };

            enqDetailexpert.push({
              _id: elementId._id,
                ...userDetails[index].expert
              });

            // const to_user       = userDetails[index]._id;
            // toUserArray.push(to_user)
    
            let fieldNameArray =[]
                for (let fieldIndex = 0; fieldIndex < field.length; fieldIndex++) {
                    const element = field[fieldIndex];
                     fieldName = await FieldSchema.findOne({_id:element})
                     fieldNameArray.push( fieldName.name )
                }
    
                let specializationNameArray = ''
    
                for (let specializationIndex = 0; specializationIndex < specialization.length; specializationIndex++) {
                    const element = specialization[specializationIndex];
    
                        if (data.specialization && data.specialization.length>0) {
    
                            searchFilters["_id"] = {$nin :data.userId};

                            var userSpecializationDetails = await UserSchema.find(searchFilters)

                            if(userSpecializationDetails.length>0)
                            {

                                for (let i = 0; i < userSpecializationDetails.length; i++) {
                                    userSpecializationArray.push(userSpecializationDetails[i]._id)
                                }
                            }          

                            for (let dataSpecializationIndex = 0; dataSpecializationIndex < data.specialization.length; dataSpecializationIndex++) {
                            
                                let dataSpecializationElement = data.specialization[dataSpecializationIndex];
                              
                                let specializationName        = await SpecializationSchema.findOne({_id:dataSpecializationElement})
                                
                                if(specializationName !== null)
                                {
                                    counter = counter +1
    
                                    specializationNameArray = specializationNameArray + specializationName.name +' ,' 
                                    
                                }
                                
                            }
                            
                        }
    
                      // }
                        //#endregion send notification to user
    
                }  
                
                
                
                if(counter > 0)
                {

                    const userDeviceId       = currUserId == data.userId ? '': deviceId
                    let  fullname     = ''
                    let  userAge      = ''
                    let  userSpec     = ''
                    let  userCity  = ''
                    let  userCountry  = ''
                    let  overallUserInfo      = ''

                    console.log('--udata data.userId---',data.userId)

                    if(data.userId){

                        let udata = await UserSchema.findOne({_id:data.userId})
                                          .populate('expert.specialization') 
                        if(udata.expert.specialization.length>0)
                        {
                            async.each(udata.expert.specialization, (spec)=>{
                                userSpec = userSpec + spec.name + ' ,'
                            })
                        }

                        fullname    = udata.expert.fullname.indexOf(' ') > -1 ? (udata.expert.fullname.split(' '))[0] : udata.expert.fullname
                        userAge     = udata.expert.age
                        userSpec    = userSpec.substr(0, userSpec.length-1)
                        userCity    = udata.expert.city
                        userCountry = udata.expert.country

                        overallUserInfo = fullname +', '+userAge+', in '+userCity+', '+userCountry
                    }
                    data.to_user = userSpecializationArray
                    console.log('overallUserInfo------>',overallUserInfo)
                    let message = overallUserInfo + ' Called to talk about ' + specializationNameArray.substr(0, specializationNameArray.length-1);
                    
                    let notificationResponse = await fcmSentPush(data, userDeviceId,message)
                   // console.log(notificationResponse,'notificationResponse');
                
    
                }
        }



                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "List of users fetched Successfully.",
                    totalData: userDetails.length,
                    response: enqDetailpersonal
                });
           

    }else{



                callback({
                    success: false,
                    STATUSCODE: 2000,
                    message: "Something Went Wrong.",
                    response: {}
                });
           
    
    }

    }  
    }  

},

addNotificationModel: async function (data, callback) {
                
    if (data) {


    var notificationDetails = await NotificationsSchema.findOne({userId: data.userId})

    if(notificationDetails)
    {

        NotificationsSchema.update({
            userId: data.userId
        }, {
            $set: {
                message: data.message,
                notificationUserType:data.notificationUserType
            }
        }, async function (err, result) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 5005,
                    message: "INTERNAL DB ERROR",
                    response: err
                });
            } else {
                var notificationDetail = await NotificationsSchema.findOne({userId: data.userId})
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Notification Data Updated Successfully.",
                    response: notificationDetail
                });
            }
        });

    }else{


        new NotificationsSchema({
            userId: data.userId,
            message: data.message.length>0 ? JSON.parse(data.message): data.message,
            notificationUserType:data.notificationUserType

        })
            .save(r =>{
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Submitted test successfully.",
                    response: r
                });
            })

    }
          

    }
},
listNotificationModel: async function (data, callback) {
    var searchArray = [];
    var combineResponse = [];
    console.log("listNotData----------",data);
    let searchFilters = {};

      if (data.userId) {
        searchFilters["to_user"] = { $in : data.userId  };
      }

      if (data.userType) {
      //  searchFilters["userType"] = data.userType;
      }

    let countNotifications = await NotificationsSchema.countDocuments(searchFilters).exec()

 //#region Set pagination and sorting===============================================
    //=======(common Params[pageindex=1&pagesize=10&sortby=name&sorttype=Asc])
    let sortRecord = { updatedAt: -1 };
    let pageIndex = 1;
    let pageSize = parseInt(config.limit);
    let limitRecord = pageSize;
    let skipRecord = 0;
    //pageSize, pageIndex, sortBy, sortType, lat, long
    if (data.pageSize) {
      pageSize = parseInt(data.pageSize);
    }
    if (data.pageIndex) {
      pageIndex = parseInt(data.pageIndex);
    }
    if (pageIndex > 1) {
      skipRecord = (pageIndex - 1) * pageSize;
    }
    limitRecord = pageSize;
    if (data.sortBy && data.sortType) {
      let sortBy = data.sortBy;
      let sortType = "";
      if (data.sortType.toLowerCase() === "desc") {
        sortType = -1;
      }
      //sortRecord = {}
      sortRecord[sortBy] = sortType;
    }

    console.log('---searchFilters',searchFilters)


    let NotificationsCategory = await NotificationsSchema.find(searchFilters)
    .sort(sortRecord)
    .limit(limitRecord)
    .skip(skipRecord)
    .exec()

    if(NotificationsCategory)
    {

        for (let index = 0; index < NotificationsCategory.length; index++) {

                const fromUserId  = NotificationsCategory[index].from_user;

                let searchUsers = {};

                searchUsers["_id"] = fromUserId;
                
                if(data.userType)
                {
                    if(data.userType == '1')
                    {
                    searchUsers["personal.userType"] = { $in: data.userType };
                    }else{
                    searchUsers["expert.userType"] = { $in: data.userType };
                    }
                }

                let UserDetails = await UserSchema.findOne(searchUsers)
                
                if(UserDetails !== null)
                {
                    combineResponse.push({ 
                        ...NotificationsCategory[index].toObject(),
                        UserDetails:UserDetails
                    })
                }

        }

    }


    callback({
            success: true,
            STATUSCODE: 2000,
            message: "Success",
            totalData: countNotifications,
            response: combineResponse
        })


    
},

settingNotificationModel: async function (data, callback) {

    if(!data.userId)
    {
        callback({
            success: false,
            STATUSCODE: 4200,
            message: "userId required",
            response: []
        });
    }

    if(!data.userType)
    {
        callback({
            success: false,
            STATUSCODE: 4200,
            message: "userType required",
            response: []
        });
    }

    if(!data.settingNotificationUserType)
    {
        callback({
            success: false,
            STATUSCODE: 4200,
            message: "settingNotificationUserType required",
            response: []
        });
    }


    if(data){

        if(data.userType == '1')
        {
       await UserSchema.update(
            {_id: data.userId},
            {
                $set:{
                   
                    "personal.settingNotificationUserType": data.settingNotificationUserType                            
                }
            }
        )
        }else{
            await UserSchema.update(
                {_id: data.userId},
                {
                    $set:{
                       
                        "expert.settingNotificationUserType": data.settingNotificationUserType                            
                    }
                }
            )
        }
      let uDetails =await  UserSchema.findOne({_id:data.userId})

        if(uDetails !== null)
        {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Successfully Updated",
                response: uDetails

            });
        }else{
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "something went wrong!",
                response: []
            });
        }
    }else{
        callback({
            success: false,
            STATUSCODE: 4200,
            message: "something went wrong!",
            response: []
        });
    }
},

editNotificationsModel: async function (data, callback) {
    var obj = data.options;
    //console.log(obj);
    
    var answer = 0
    var answer_key = 0;
    var counter = 0;

    //console.log("answer",answer);
    
    if(data){
        NotificationsSchema.update(
            {_id: data._id},
            {
                $set:{
                   
                    description: data.description                            
                }
            }
        ).then(r =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success"
            });
        })
    }
},

addAboutUsModel: async function (data, callback) {
                
    if (data) {

        var aboutusSchema = {
            
            description: data.description  
        }

        new AboutUsSchema(aboutusSchema)
            .save(r =>{
                console.log('addAboutUs',r)
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Submitted test successfully.",
                    response: r
                });
            })
          

    }
},
listAboutUsModel: async function (data, callback) {
    var searchArray = [];
    var combineResponse = [];

    if(data.searchTerm){
        searchArray.push({'description': new RegExp(data.searchTerm, 'i')});
    }
    else{
        searchArray.push({})
    }
    
    var qry = {$or: searchArray};
    
    AboutUsSchema.countDocuments(qry).exec(function (err, resCount) {
        if(err){
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "something went wrong!",
                response: err
            });
        }
    })

let countAboutUs = await AboutUsSchema.countDocuments(qry).exec()


let aboutusCategory = await AboutUsSchema.findOne(qry)
    .skip(data.offset).limit(data.limit)

callback({
        success: true,
        STATUSCODE: 2000,
        message: "Success",
        totalData: countAboutUs,
        response: aboutusCategory
    })


    
},
editAboutUsModel: async function (data, callback) {
    var obj = data.options;
    //console.log(obj);
    
    var answer = 0
    var answer_key = 0;
    var counter = 0;

    //console.log("answer",answer);
    
    if(data){
        AboutUsSchema.update(
            {_id: data._id},
            {
                $set:{
                   
                    description: data.description                            
                }
            }
        ).then(r =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success"
            });
        })
    }
},

deleteAboutUsModel: async function (data, callback) {
    var obj = data.options;
    //console.log(obj);
    
    var answer = 0
    var answer_key = 0;
    var counter = 0;

    //console.log("answer",answer);
    
    if(data){
        AboutUsSchema.deleteOne({ _id:data._id  })
        .then(r =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success"
            });
        })
    }
},

getAllAboutUsModel: async function (data, callback) {

    AboutUsSchema.findOne()
        .then(res =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                response: res
            });
        })
        .catch(err => {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "something went wrong!",
                response: err
            });
        })
    
},

//#endregion AboutUs

//#region User Management

addUserModel: async function (data, callback) {
                
console.log('data.email--------',data.email.toLowerCase())
 let duplicateUserEmail = await UserSchema.findOne({ "personal.email": String(data.email).toLowerCase() })
 console.log('duplicateUserEmail--------',duplicateUserEmail)

    if(duplicateUserEmail !== null){

        callback({
            success: false,
            STATUSCODE: 4200,
            message: "Email Id already exist",
            response: {}
        });

    }else{
        
        if (data) {

            if (!data.fullname) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "fullname Required",
                    response: {}
                      });
            }

            if (!data.phone) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "phone Required",
                    response: {}
                      });
            }

            if (!data.email) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "Email Id Required",
                    response: {}
                      });
            }

            if (!data.password) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "password Required",
                    response: {}
                      });
            }

            if (!data.termCondition) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "termCondition Required",
                    response: {}
                      });
            }

            let hashedPassword = await  bcrypt.hashSync(data.password, bcrypt.genSaltSync(8), null);


            data.email = String(data.email).toLowerCase();
            data.otp = Math.random().toString().replace('0.', '').substr(0, 4);

                mailProperty('sendOTPdMail')(data.email, {
                    otp: data.otp,
                    email: data.email,
                    name: data.fullname,
                    site_url: config.liveUrl,
                    date: new Date()
                }).send();
            

            var userSchemaData = {
                personal: {
                fullname: data.fullname,
                language:data.language,
                email: data.email,
                phone: data.phone,
                gender: data.gender,
                age: data.age,
                dob :data.dob,// for personal
                location: data.location,
                website: data.website,
                educationLabel: data.educationLabel,
                field: data.field,
                otp:data.otp,
                specialization: data.specialization,
                deviceId: data.deviceId,
                occupation: data.occupation,
                contact: data.contact,
                experience: data.experience,
                consultingFees: data.consultingFees,
                password: hashedPassword,
                talkTime:data.talkTime,
                profileImage: data.profileImage,
                permission: data.permission,
                talkChargeTime: data.talkChargeTime,
                linkedIn:data.linkedIn,
                //authtoken: data.authtoken,
                blockStatus: data.blockStatus,
                userType: "1",
                termCondition: data.termCondition
            },
            expert: {
                fullname: data.fullname,
                language:data.language,
                email: data.email,
                phone: data.phone,
                gender: data.gender,
                age: data.age,
                dob :data.dob,// for personal
                location: data.location,
                website: data.website,
                educationLabel: data.educationLabel,
                field: data.field,
                otp:data.otp,
                specialization: data.specialization,
                occupation: data.occupation,
                deviceId: data.deviceId,
                contact: data.contact,
                experience: data.experience,
                consultingFees: data.consultingFees,
                password: hashedPassword,
                talkTime:data.talkTime,
                profileImage: data.profileImage,
                permission: data.permission,
                talkChargeTime: data.talkChargeTime,
                linkedIn:data.linkedIn,
                //authtoken: data.authtoken,
                blockStatus: data.blockStatus,
                userType: "2",
                termCondition: data.termCondition
            }
            }

            let addUserSchemaDataResponse = await UserSchema.create(userSchemaData);

            if(addUserSchemaDataResponse)
            {
                var token = createToken(addUserSchemaDataResponse);

                let updateResponse = await UserSchema.updateOne({_id: addUserSchemaDataResponse._id}, {
                $set: {"personal.authtoken": token}           
                });
         


                
                let userResponse = await UserSchema.findOne({_id: addUserSchemaDataResponse._id});

                bcrypt.hash(data.password, null, null, function (err, hash) {
                    if (err) {
                        callback({
                            success: false,
                            STATUSCODE: 5005,
                            message: "INTERNAL DB ERROR",
                            response: err
                        });
                    } else {
                        UserSchema.update({
                            _id: userResponse._id
                        }, {
                            $set: {
                                "personal.password": hash
                            }
                        }, function (err, result) {
                            if (err) {
                                callback({
                                    success: false,
                                    STATUSCODE: 5005,
                                    message: "INTERNAL DB ERROR",
                                    response: err
                                });
                            } else {
                                callback({
                                    success: true,
                                    STATUSCODE: 2000,
                                    message: "User Registered Successfully. Please Check Your Email for Verification. ",
                                    response: {_id: userResponse._id, ...userResponse.personal}
                                });
                            }
                        });
                    }
                });




            }else{
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "Something went wrong",
                    response: {}
                      });
            }
              
    
        }

    }

},
listUserModel: async function (data, callback) {

    var searchArray = [];
    var combineResponse = [];

    if(data.searchTerm){
        searchArray.push({'personal.fullname': new RegExp(data.searchTerm, 'i')});
    }
    else{
        searchArray.push({})
    }
    
    var qry = {$or: searchArray};
    
    UserSchema.countDocuments(qry).exec(function (err, resCount) {
        if(err){
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "something went wrong!",
                response: err
            });
        }
    })

   let countUser = await UserSchema.countDocuments().exec()

//   let users = await UserSchema.find({})
//     .skip(data.offset).limit(data.limit)
//from_user 
    let searchFilters = {};

    if (data.userType == '1') 
    {


      if (data.searchTerm) {
        searchFilters["personal.fullname"] = { $regex: data.searchTerm, $options: "i" };
      }

      if (data.userType) {
        searchFilters["personal.userType"] = data.userType;
      }

      if (data.phone) {
        searchFilters["personal.phone"] = data.phone;
      }

      if (data.gender) {
        searchFilters["personal.gender"] = data.gender;
      }

      if (data.age) {
        searchFilters["personal.age"] = data.age;
      }    

      if (data._id) {
        searchFilters["_id"] = data._id;
      }  
  

      if (data.consultingFees) {
        searchFilters["personal.consultingFees"] = data.consultingFees;
      }                          
      
      if (data.field) {
        searchFilters["personal.field"] = {$in :data.field};
      } 
      console.log('data.specialization 0------>',data.specialization)

      if (data.specialization) {
        searchFilters["personal.specialization"] = {$in :data.specialization};
      }
        console.log('data.specialization 1------>',data.specialization)

    //userType

      if (data.settingUserType) {
        searchFilters["personal.userType"] = data.settingUserType;
      } 

     //Gender

      if (data.settingGender && data.settingGender.length>0) {

        searchFilters["personal.gender"] = {$in :data.settingGender};

       // {$or:[{region: "NA"},{sector:"Some Sector"}]}
        
      }

    //Age

      if (data.settingStartage && data.settingEndage) {
        searchFilters["personal.age"] = {
          $gte: data.settingStartage,
          $lte: data.settingEndage
        };
      }

    //Location

      if (data.settingTalkLocation && data.settingTalkLocation.length>0) {


        searchFilters["personal.talkLocation"] = {$in :data.settingTalkLocation};
      }


      if (data.talkLocation) {
        searchFilters["personal.talkLocation"] = data.talkLocation;
      } 
      
      if (data.talkTime) {
        searchFilters["personal.talkTime"] = data.talkTime;
      } 

      if (data.email) {
        searchFilters["personal.email"] = data.email;
      } 

      if (data.location) {
        searchFilters["personal.location"] = { $regex: data.location, $options: "i" };
      }    

      if (data.fullname) {
        searchFilters["personal.fullname"] = { $regex: data.fullname, $options: "i" };
      }
    }
    else   if (data.userType == '2') 
    {


      if (data.searchTerm) {
        searchFilters["expert.fullname"] = { $regex: data.searchTerm, $options: "i" };
      }

      if (data.userType) {
        searchFilters["expert.userType"] = data.userType;
      }

      if (data.phone) {
        searchFilters["expert.phone"] = data.phone;
      }

      if (data.gender) {
        searchFilters["expert.gender"] = data.gender;
      }

      if (data.age) {
        searchFilters["expert.age"] = data.age;
      }    

      if (data._id) {
        searchFilters["_id"] = data._id;
      }  
  

      if (data.consultingFees) {
        searchFilters["expert.consultingFees"] = data.consultingFees;
      }                          
      
      if (data.field) {
        searchFilters["expert.field"] = {$in :data.field};
      } 
      console.log('data.specialization 0------>',data.specialization)

      if (data.specialization) {
        searchFilters["expert.specialization"] = {$in :data.specialization};
      }
        console.log('data.specialization 1------>',data.specialization)

    //userType

      if (data.settingUserType) {
        searchFilters["expert.userType"] = data.settingUserType;
      } 

     //Gender

      if (data.settingGender && data.settingGender.length>0) {

        searchFilters["expert.gender"] = {$in :data.settingGender};

       // {$or:[{region: "NA"},{sector:"Some Sector"}]}
        
      }

    //Age

      if (data.settingStartage && data.settingEndage) {
        searchFilters["expert.age"] = {
          $gte: data.settingStartage,
          $lte: data.settingEndage
        };
      }

    //Location

      if (data.settingTalkLocation && data.settingTalkLocation.length>0) {


        searchFilters["expert.talkLocation"] = {$in :data.settingTalkLocation};
      }


      if (data.talkLocation) {
        searchFilters["expert.talkLocation"] = data.talkLocation;
      } 
      
      if (data.talkTime) {
        searchFilters["expert.talkTime"] = data.talkTime;
      } 

      if (data.email) {
        searchFilters["expert.email"] = data.email;
      } 

      if (data.location) {
        searchFilters["expert.location"] = { $regex: data.location, $options: "i" };
      }    

      if (data.fullname) {
        searchFilters["expert.fullname"] = { $regex: data.fullname, $options: "i" };
      }
    }else{
            
          if (data.searchTerm) {
            searchFilters["personal.fullname"] = { $regex: data.searchTerm, $options: "i" };
          }
    
          if (data.userType) {
            searchFilters["personal.userType"] = data.userType;
          }
    
          if (data.phone) {
            searchFilters["personal.phone"] = data.phone;
          }
    
          if (data.gender) {
            searchFilters["personal.gender"] = data.gender;
          }
    
          if (data.age) {
            searchFilters["personal.age"] = data.age;
          }    
    
          if (data._id) {
            searchFilters["_id"] = data._id;
          }  
      
    
          if (data.consultingFees) {
            searchFilters["personal.consultingFees"] = data.consultingFees;
          }                          
          
          if (data.field) {
            searchFilters["personal.field"] = {$in :data.field};
          } 
          console.log('data.specialization 0------>',data.specialization)
    
          if (data.specialization) {
            searchFilters["personal.specialization"] = {$in :data.specialization};
          }
            console.log('data.specialization 1------>',data.specialization)
    
        //userType
    
          if (data.settingUserType) {
            searchFilters["personal.userType"] = data.settingUserType;
          } 
    
         //Gender
    
          if (data.settingGender && data.settingGender.length>0) {
    
            searchFilters["personal.gender"] = {$in :data.settingGender};
    
           // {$or:[{region: "NA"},{sector:"Some Sector"}]}
            
          }
    
        //Age
    
          if (data.settingStartage && data.settingEndage) {
            searchFilters["personal.age"] = {
              $gte: data.settingStartage,
              $lte: data.settingEndage
            };
          }
    
        //Location
    
          if (data.settingTalkLocation && data.settingTalkLocation.length>0) {
    
    
            searchFilters["personal.talkLocation"] = {$in :data.settingTalkLocation};
          }
    
    
          if (data.talkLocation) {
            searchFilters["personal.talkLocation"] = data.talkLocation;
          } 
          
          if (data.talkTime) {
            searchFilters["personal.talkTime"] = data.talkTime;
          } 
    
          if (data.email) {
            searchFilters["personal.email"] = data.email;
          } 
    
          if (data.location) {
            searchFilters["personal.location"] = { $regex: data.location, $options: "i" };
          }    
    
          if (data.fullname) {
            searchFilters["personal.fullname"] = { $regex: data.fullname, $options: "i" };
          }
       
          

          if (data.searchTerm) {
            searchFilters["expert.fullname"] = { $regex: data.searchTerm, $options: "i" };
          }
    
          if (data.userType) {
            searchFilters["expert.userType"] = data.userType;
          }
    
          if (data.phone) {
            searchFilters["expert.phone"] = data.phone;
          }
    
          if (data.gender) {
            searchFilters["expert.gender"] = data.gender;
          }
    
          if (data.age) {
            searchFilters["expert.age"] = data.age;
          }    
    
          if (data._id) {
            searchFilters["_id"] = data._id;
          }  
      
    
          if (data.consultingFees) {
            searchFilters["expert.consultingFees"] = data.consultingFees;
          }                          
          
          if (data.field) {
            searchFilters["expert.field"] = {$in :data.field};
          } 
          console.log('data.specialization 0------>',data.specialization)
    
          if (data.specialization) {
            searchFilters["expert.specialization"] = {$in :data.specialization};
          }
            console.log('data.specialization 1------>',data.specialization)
    
        //userType
    
          if (data.settingUserType) {
            searchFilters["expert.userType"] = data.settingUserType;
          } 
    
         //Gender
    
          if (data.settingGender && data.settingGender.length>0) {
    
            searchFilters["expert.gender"] = {$in :data.settingGender};
    
           // {$or:[{region: "NA"},{sector:"Some Sector"}]}
            
          }
    
        //Age
    
          if (data.settingStartage && data.settingEndage) {
            searchFilters["expert.age"] = {
              $gte: data.settingStartage,
              $lte: data.settingEndage
            };
          }
    
        //Location
    
          if (data.settingTalkLocation && data.settingTalkLocation.length>0) {
    
    
            searchFilters["expert.talkLocation"] = {$in :data.settingTalkLocation};
          }
    
    
          if (data.talkLocation) {
            searchFilters["expert.talkLocation"] = data.talkLocation;
          } 
          
          if (data.talkTime) {
            searchFilters["expert.talkTime"] = data.talkTime;
          } 
    
          if (data.email) {
            searchFilters["expert.email"] = data.email;
          } 
    
          if (data.location) {
            searchFilters["expert.location"] = { $regex: data.location, $options: "i" };
          }    
    
          if (data.fullname) {
            searchFilters["expert.fullname"] = { $regex: data.fullname, $options: "i" };
          }


    }

    //#region Set pagination and sorting===============================================
    //=======(common Params[pageindex=1&pagesize=10&sortby=name&sorttype=Asc])
    let sortRecord = { updatedAt: 'desc' };
    let pageIndex = 1;
    let pageSize = parseInt(config.limit);
    let limitRecord = pageSize;
    let skipRecord = 0;
    //pageSize, pageIndex, sortBy, sortType, lat, long
    if (data.pageSize) {
      pageSize = parseInt(data.pageSize);
    }
    if (data.pageIndex) {
      pageIndex = parseInt(data.pageIndex);
    }
    if (pageIndex > 1) {
      skipRecord = (pageIndex - 1) * pageSize;
    }
    limitRecord = pageSize;
    if (data.sortBy && data.sortType) {
      let sortBy = data.sortBy;
      let sortType = "";
      if (data.sortType.toLowerCase() === "desc") {
        sortType = -1;
      }
      //sortRecord = {}
      sortRecord[sortBy] = sortType;
    }

    console.log('---searchFilterssss-->',searchFilters)
    let users =''
    if (data.userType == '1')
    {
     users = await UserSchema.find(searchFilters)
      .populate('personal.specialization') 
      .sort(sortRecord)
      .limit(limitRecord)
      .skip(skipRecord)
      .exec();
    }else  if (data.userType == '2'){
        users = await UserSchema.find(searchFilters)
        .populate('expert.specialization') 
        .sort(sortRecord)
        .limit(limitRecord)
        .skip(skipRecord)
        .exec();
    }else {
        users = await UserSchema.find(searchFilters)
        .populate('expert.specialization') 
        .populate('personal.specialization') 
        .sort(sortRecord)
        .limit(limitRecord)
        .skip(skipRecord)
        .exec();
    }
     // console.log('---users-->',users)

      let typeOfUser = ''
      let enqDetailpersonal =[]
      let enqDetailexpert =[]

      if (!data.userType || data.userType == '1')
      {
        typeOfUser = 'personal'
        for (let index = 0; index < users.length; index++) {
            const element = { ...users[index].toObject() };

            enqDetailpersonal.push({
              _id: element._id,
                ...users[index].personal
              });
        }
        console.log('---users enqDetailpersonal -->',enqDetailpersonal)

      }else if (data.userType == '2')
      {
        typeOfUser = 'expert'
        for (let index = 0; index < users.length; index++) {
            const element = { ...users[index].toObject() };

            enqDetailexpert.push({
              _id: element._id,
                ...users[index].expert
              });
        }
      }else{
          
        typeOfUser = 'personal'
        for (let index = 0; index < users.length; index++) {
            const element = { ...users[index].toObject() };

            enqDetailpersonal.push({
              _id: element._id,
                ...users[index].personal
              });
        }
        console.log('---users enqDetailpersonal -->',enqDetailpersonal)

      
      }




    let usersCountFiltered = await UserSchema.find(searchFilters)

    if(users.length>0)
    {
        if (!data.userType || data.userType == '1')
        {

            callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Success",
                    totalData: countUser,
                    filteredData:usersCountFiltered.length,
                    response: enqDetailpersonal
                })

        }else if (data.userType == '2'){

            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countUser,
                filteredData:usersCountFiltered.length,
                response: enqDetailexpert
            })

        }else{
            

            callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Success",
                    totalData: countUser,
                    filteredData:usersCountFiltered.length,
                    response: enqDetailpersonal
                })

        
        }



    }else {
        callback({
            success: true,
            STATUSCODE: 2000,
            message: "Success",
            totalData: 0,
            filteredData:0,
            response: []
        })
    }
    
},

editUserModel: async function (data, callback) {
    var obj = data.options;
    console.log('data edit------>',data);
    
    var answer = 0
    var answer_key = 0;
    var counter = 0;
    let file_with_path=''
    console.log('data--->',data._id);
    //  let us = await UserSchema.findOne({_id: data._id})
    //  console.log('user data--->',us);
    if(!data.userType)
    {
        callback({
            success: false,
            STATUSCODE: 4200,
            message: "Please provide userType to proceed",
            response: {}
        });
    }

    UserSchema.findOne({_id: data._id})
    
        .then(async ven => {
            if(ven){
                console.log('data.profileImage--->',data.profileImage)
                console.log('data.profileImage type of--->',typeof data.profileImage)
    if(data.userType == '1')
    {
    
        if (data.profileImage !== undefined && data.profileImage !== null && ven.personal.profileImage !== undefined) {

            if( (ven.personal.profileImage !== null ) && ven.personal.profileImage.toString().indexOf('/') > -1)
            {
            var resStrSplit = ven.personal.profileImage.toString().split("/")[5];
            console.log('resStrSplit--',resStrSplit)
            file_with_path = `./public/uploads/user/${resStrSplit}`;
            //console.log('file_with_path--',file_with_path)
    
                if (fs.existsSync(file_with_path)) {
                    await fs.unlink(file_with_path, (err) => {
                        if (err) throw err;
                        console.log('successfully deleted');
                    });
                }
            }
        }
    }else{
        if (data.profileImage !== undefined && data.profileImage !== null && ven.expert.profileImage !== undefined) {

            if( (ven.expert.profileImage !== null ) && ven.expert.profileImage.toString().indexOf('/') > -1)
            {
            var resStrSplit = ven.expert.profileImage.toString().split("/")[5];
            console.log('resStrSplit--',resStrSplit)
            file_with_path = `./public/uploads/user/${resStrSplit}`;
            //console.log('file_with_path--',file_with_path)
    
                if (fs.existsSync(file_with_path)) {
                    await fs.unlink(file_with_path, (err) => {
                        if (err) throw err;
                        console.log('successfully deleted');
                    });
                }
            }
        }
    }
                
    if(data){
        
        UserSchema.findOne({_id: data._id})
        .then(userData => {
                if(data.userType == '1')
                {
                    UserSchema.update(
                        {_id: data._id},
                        {

                            $set:{
                                "personal.fullname": data.fullname?data.fullname:userData.personal.fullname ,
                                "personal.email": data.email?String(data.email).toLowerCase():userData.personal.email,
                                "personal.phone": data.phone?data.phone:userData.personal.phone,
                                "personal.gender": data.gender?data.gender:userData.personal.gender,
                                "personal.age": data.age?data.age:userData.personal.age,
                                "personal.location": data.location?data.location:userData.personal.location,
                                "personal.language": data.language?data.language:userData.personal.language,
                                "personal.website": data.website?data.website:userData.personal.website,
                                "personal.educationLabel": data.educationLabel?data.educationLabel:userData.personal.educationLabel,
                                "personal.field": data.field?JSON.parse(data.field):userData.personal.field,
                                
                                "personal.settingUserType": data.settingUserType?data.settingUserType:userData.personal.settingUserType,
                                "personal.settingStartage": data.settingStartage?data.settingStartage:userData.personal.settingStartage,
                                "personal.settingEndage": data.settingEndage?data.settingEndage:userData.personal.settingEndage,

                                "personal.settingGender": data.settingGender?JSON.parse(data.settingGender):userData.personal.settingGender,
                                "personal.settingTalkLocation": data.settingTalkLocation?JSON.parse(data.settingTalkLocation):userData.personal.settingTalkLocation,
                                
                                "personal.specialization": data.specialization?JSON.parse(data.specialization):userData.personal.specialization,
                                "personal.occupation": data.occupation?data.occupation:userData.personal.occupation,
                                "personal.contact": data.contact?data.contact:userData.personal.contact,
                                "personal.talkLocation": data.talkLocation?data.talkLocation:userData.personal.talkLocation,
                                "personal.talkTime":data.talkTime?data.talkTime:userData.personal.talkTime,
                                "personal.aboutme": data.aboutme?data.aboutme:userData.personal.aboutme,
                                "personal.talkChargeTime": data.talkChargeTime?data.talkChargeTime:userData.personal.talkChargeTime,// for expert
                                "personal.dob" :data.dob?data.dob:userData.personal.dob,// for personal
                                "personal.linkedIn":data.linkedIn?data.linkedIn:userData.personal.linkedIn,
                                "personal.city":data.googleAddress?(JSON.parse(data.googleAddress)).city:userData.personal.city,
                                "personal.country":data.googleAddress?(JSON.parse(data.googleAddress)).country:userData.personal.country,

                                "personal.experience": data.experience?data.experience:userData.personal.experience,
                                "personal.consultingFees": data.consultingFees?data.consultingFees:userData.personal.consultingFees,
                                "personal.profileImage": (data.profileImage !== undefined)?data.profileImage:userData.personal.profileImage,
                                "personal.permission": data.permission?JSON.parse(data.permission):userData.personal.permission,
                                "personal.authtoken": data.authtoken?data.authtoken:userData.personal.authtoken,
                                "personal.blockStatus": data.blockStatus?data.blockStatus:userData.personal.blockStatus,
                                "personal.userType": data.userType?data.userType:userData.personal.userType,
                                "personal.termCondition": data.termCondition?data.termCondition:userData.personal.termCondition 
                            }
                        }
                    )
                    .then(r =>{

                            UserSchema.findOne({_id: data._id})
                            .populate('personal.specialization')
                            .then(user => {

                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "Success",
                                        response: {_id: data._id , ...user.personal }

                                    });
                               
                            }).catch(err => {
                                callback({
                                    success: false,
                                    STATUSCODE: 4200,
                                    message: "Something Went Wrongs",
                                    response: err
                                });
                            })


                            })
                }else{
                        UserSchema.update(
                            {_id: data._id},
                            {
            
                                $set:{

                                    "expert.fullname": data.fullname?data.fullname:userData.expert.fullname ,
                                    "expert.email": data.email?String(data.email).toLowerCase():userData.expert.email,
                                    "expert.phone": data.phone?data.phone:userData.expert.phone,
                                    "expert.gender": data.gender?data.gender:userData.expert.gender,
                                    "expert.age": data.age?data.age:userData.expert.age,
                                    "expert.location": data.location?data.location:userData.expert.location,
                                    "expert.language": data.language?data.language:userData.expert.language,
                                    "expert.website": data.website?data.website:userData.expert.website,
                                    "expert.educationLabel": data.educationLabel?data.educationLabel:userData.expert.educationLabel,
                                    "expert.field": data.field?JSON.parse(data.field):userData.expert.field,
                                    
                                    "expert.settingUserType": data.settingUserType?data.settingUserType:userData.expert.settingUserType,
                                    "expert.settingStartage": data.settingStartage?data.settingStartage:userData.expert.settingStartage,
                                    "expert.settingEndage": data.settingEndage?data.settingEndage:userData.expert.settingEndage,
    
                                    "expert.settingGender": data.settingGender?JSON.parse(data.settingGender):userData.expert.settingGender,
                                    "expert.settingTalkLocation": data.settingTalkLocation?JSON.parse(data.settingTalkLocation):userData.expert.settingTalkLocation,
                                    
                                    "expert.specialization": data.specialization?JSON.parse(data.specialization):userData.expert.specialization,
                                    "expert.occupation": data.occupation?data.occupation:userData.expert.occupation,
                                    "expert.contact": data.contact?data.contact:userData.expert.contact,
                                    "expert.talkLocation": data.talkLocation?data.talkLocation:userData.expert.talkLocation,
                                    "expert.talkTime":data.talkTime?data.talkTime:userData.expert.talkTime,
                                    "expert.aboutme": data.aboutme?data.aboutme:userData.expert.aboutme,
                                    "expert.talkChargeTime": data.talkChargeTime?data.talkChargeTime:userData.expert.talkChargeTime,// for expert
                                    "expert.dob" :data.dob?data.dob:userData.expert.dob,// for expert
                                    "expert.linkedIn":data.linkedIn?data.linkedIn:userData.expert.linkedIn,
                                    "expert.city":data.googleAddress?(JSON.parse(data.googleAddress)).city:userData.expert.city,
                                    "expert.country":data.googleAddress?(JSON.parse(data.googleAddress)).country:userData.expert.country,
    
                                    "expert.experience": data.experience?data.experience:userData.expert.experience,
                                    "expert.consultingFees": data.consultingFees?data.consultingFees:userData.expert.consultingFees,
                                    "expert.profileImage": (data.profileImage !== undefined)?data.profileImage:userData.expert.profileImage,
                                    "expert.permission": data.permission?JSON.parse(data.permission):userData.expert.permission,
                                    "expert.authtoken": data.authtoken?data.authtoken:userData.expert.authtoken,
                                    "expert.blockStatus": data.blockStatus?data.blockStatus:userData.expert.blockStatus,
                                    "expert.userType": data.userType?data.userType:userData.expert.userType,
                                    "expert.termCondition": data.termCondition?data.termCondition:userData.expert.termCondition 
                                }
                            }
                        )
                        .then(r =>{
            
                                UserSchema.findOne({_id: data._id})
                                .populate('expert.specialization')
                                .then(user => {
            
                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "Success",
                                        response: {_id: data._id , ...user.expert }

                                    });

                                }).catch(err => {
                                    callback({
                                        success: false,
                                        STATUSCODE: 4200,
                                        message: "Something Went Wrong",
                                        response: err
                                    });
                                })
            
            
                                })
                        
                }
                
            })

        }else{
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "Something Went Wrongs",
                response: {}
            });
        }
}
})


},

deleteUserModel: async function (data, callback) {
    var obj = data.options;
    //console.log(obj);
    
    var answer = 0
    var answer_key = 0;
    var counter = 0;

    //console.log("answer",answer);
    
    if(data){
        UserSchema.deleteOne({ _id:data._id  })
        .then(r =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success"
            });
        })
    }
},


getAllUserModel: async function (data, callback) {

    UserSchema.findOne()
        .then(res =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                response: res
            });
        })
        .catch(err => {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "something went wrong!",
                response: err
            });
        })
    
},



//#endregion User


//#region Specialization

addSpecializationModel: async function (data, callback) {
                
    if (data) {

        
        if(!data.userType)
        {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "userType Required!",
                response: {}
            });
        }
        if(!data.fieldId)
        {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "fieldId Required!",
                response: {}
            });
        }
        if(!data.name)
        {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "name Required!",
                response: {}
            });
        }
        
        var aboutusSchema = {
            fieldId : data.fieldId,
            userType	: data.userType  ,
            name	: data.name  ,
            description: data.description  
        }
        
        let addSpecialization = await SpecializationSchema.create(aboutusSchema)

        if(addSpecialization){
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Submitted test successfully.",
                response: addSpecialization
            });
        }else{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Something went wrong.",
                response: r
            });
        }

        // new SpecializationSchema(aboutusSchema)
        //     .save(r =>{
        //         console.log('addSpecialization',r)
        //         callback({
        //             success: true,
        //             STATUSCODE: 2000,
        //             message: "Submitted test successfully.",
        //             response: r
        //         });
        //     })
          

    }
},
listSpecializationModel: async function (data, callback) {
    var searchArray = [];
    var combineResponse = [];

    if(data.searchTerm){
        searchArray.push({'description': new RegExp(data.searchTerm, 'i')});
    }
    else{
        searchArray.push({})
    }
    
    var qry = {$or: searchArray};
    
    SpecializationSchema.countDocuments(qry).exec(function (err, resCount) {
        if(err){
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "something went wrong!",
                response: err
            });
        }
    })

let countSpecialization = await SpecializationSchema.countDocuments(qry).exec()


let aboutusCategory = await SpecializationSchema.findOne(qry)
    .skip(data.offset).limit(data.limit)

callback({
        success: true,
        STATUSCODE: 2000,
        message: "Success",
        totalData: countSpecialization,
        response: aboutusCategory
    })   
},

editSpecializationModel: async function (data, callback) {
    var obj = data.options;
    //console.log(obj);
    
    var answer = 0
    var answer_key = 0;
    var counter = 0;

    //console.log("answer",answer);
    
    if(data){
        SpecializationSchema.update(
            {_id: data._id},
            {
                $set:{
                    fieldId : data.fieldId,
                    description: data.description                            
                }
            }
        ).then(r =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success"
            });
        })
    }
},

deleteSpecializationModel: async function (data, callback) {
    var obj = data.options;
    //console.log(obj);
    
    var answer = 0
    var answer_key = 0;
    var counter = 0;

    //console.log("answer",answer);
    
    if(data){
        SpecializationSchema.deleteOne({ _id:data._id  })
        .then(r =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success"
            });
        })
    }
},

getAllSpecializationModel: async function (data, callback) {

    let searchFilters ={}

    if(data.fieldId)
    {
        searchFilters['fieldId'] =data.fieldId 

    }

    if(data.userType)
    {
        searchFilters['userType'] =data.userType 

    }
    
    if(data.name)
    {
     //   data.name  = JSON.parse(data.name)
        searchFilters['name'] =data.name 

    }

    SpecializationSchema.find(searchFilters)
        .then(res =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                response: res
            });
        })
        .catch(err => {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "something went wrong!",
                response: err
            });
        })
    
},

//#endregion Specialization


//#region Rating

addRatingModel: async function (data, callback) {
                
    if (data) {

        if(!data.userId)
        {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "userId Required!",
                response: {}
            });
        }
        if(!data.rating)
        {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "rating Required!",
                response: {}
            });
        }
        let userName = ''
        let findUser = await UserSchema.findOne({_id:data.userId})
        console.log('findUser--',findUser)
        if(findUser !== null){
            userName = findUser.personal.fullname
        }

        //userName
        var aboutusSchema = {
            userId  : data.userId,
            rating	: data.rating ,
            userName: userName 
        }
        
        let addRating = await RatingSchema.create(aboutusSchema)

        if(addRating){
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Submitted test successfully.",
                response: addRating
            });
        }else{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Something went wrong.",
                response: {}
            });
        }        

    }
},
listRatingModel: async function (data, callback) {

        let searchFilters = {}
        console.log('data.searchbyusername-->',data.rating)
        if(data.rating)
        {
            searchFilters['rating'] = data.rating 
        }

        if(data.userId)
        {
            searchFilters['userId'] = data.userId 
        }
        console.log('searchFilters-->',searchFilters)


        let countRating = await RatingSchema.countDocuments().exec()

        let combineResponse = []
        let RatingCategory = await RatingSchema.find(searchFilters)

        callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countRating,
                response: RatingCategory
            })
    
},



//#region Timer

addTimerModel: async function (data, callback) {
                
    if (data) {

        var timerSchema = {
            
            timer: data.timer  
        }

        new TimerSchema(timerSchema)
            .save(r =>{
                console.log('addTimer',r)
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Submitted test successfully.",
                    response: r
                });
            })
          

    }
},
listTimerModel: async function (data, callback) {
    var searchArray = [];
    var combineResponse = [];

let countTimer  = await TimerSchema.countDocuments().exec()


let timer       = await TimerSchema.findOne({_id:'5de5f9517845634ca0c8863d'})

callback({
        success: true,
        STATUSCODE: 2000,
        message: "Success",
        totalData: countTimer,
        response: timer
    })
    
},
editTimerModel: async function (data, callback) {
    
    if(data){
        TimerSchema.update(
            {_id: data._id},
            {
                $set:{
                   
                    timer: data.timer                            
                }
            }
        ).then(r =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success"
            });
        })
    }
},

getAllTimerModel: async function (data, callback) {

    TimerSchema.findOne()
        .then(res =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                response: res
            });
        })
        .catch(err => {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "something went wrong!",
                response: err
            });
        })
    
},

//#endregion Timer

listUserTypeModel: async function (data, callback) {

    
let countUserType = await UserTypeSchema.countDocuments().exec()


let fieldCategory = await UserTypeSchema.find({})

callback({
        success: true,
        STATUSCODE: 2000,
        message: "Success",
        totalData: countUserType,
        response: fieldCategory
    })


    
},

//#region UserType

addFieldModel: async function (data, callback) {
                
    if (data) {

        var fieldSchema = {
            
            description: data.description  
        }

        new FieldSchema(fieldSchema)
            .save(r =>{
                console.log('addField',r)
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Submitted test successfully.",
                    response: r
                });
            })
          

    }
},
listFieldModel: async function (data, callback) {
    var searchArray = [];
    var combineResponse = [];

    if(data.searchTerm){
        searchArray.push({'description': new RegExp(data.searchTerm, 'i')});
    }
    else{
        searchArray.push({})
    }
    
    var qry = {$or: searchArray};
    
    FieldSchema.countDocuments(qry).exec(function (err, resCount) {
        if(err){
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "something went wrong!",
                response: err
            });
        }
    })

let countField = await FieldSchema.countDocuments(qry).exec()


let fieldCategory = await FieldSchema.findOne(qry)
    .skip(data.offset).limit(data.limit)

callback({
        success: true,
        STATUSCODE: 2000,
        message: "Success",
        totalData: countField,
        response: fieldCategory
    })


    
},
editFieldModel: async function (data, callback) {
    var obj = data.options;
    //console.log(obj);
    
    var answer = 0
    var answer_key = 0;
    var counter = 0;

    //console.log("answer",answer);
    
    if(data){
        FieldSchema.update(
            {_id: data._id},
            {
                $set:{
                   
                    description: data.description                            
                }
            }
        ).then(r =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success"
            });
        })
    }
},
deleteFieldModel: async function (data, callback) {
    var obj = data.options;
    //console.log(obj);
    
    var answer = 0
    var answer_key = 0;
    var counter = 0;

    //console.log("answer",answer);
    
    if(data){
        FieldSchema.deleteOne({ _id:data._id  })
        .then(r =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success"
            });
        })
    }
},
getAllFieldModel: async function (data, callback) {



    FieldSchema.find()
        .then(res =>{
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                response: res
            });
        })
        .catch(err => {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "something went wrong!",
                response: err
            });
        })
    
},

//#endregion Field
  
   
    //verifyChangedEmailModel
    verifyChangedEmailModel: function (data, callback) {
        if (data) {

            if(!data.oldEmail)
            {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "Old Email required!",
                    response: {}
                });
            }

            if(!data.newEmail)
            {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "New Email required!",
                    response: {}
                });
            }
            UserSchema.findOne({
                'personal.email': data.oldEmail.toLowerCase()
            },
                function (err, resDetails) {
                    if (err) {
                        callback({
                            success: false,
                            STATUSCODE: 5002,
                            message: "something went wrong!",
                            response: err
                        });
                    } else {
                        if (resDetails === null) {
                            callback({
                                success: false,
                                STATUSCODE: 4200,
                                message: "User does not exist",
                                response: {}
                            });
                        } else {

                                    UserSchema.update({
                                        _id: resDetails._id
                                    }, {
                                        $set: {
                                            'personal.email': data.newEmail
                                        }
                                    }, function (err, result) {
                                        if (err) {
                                            callback({
                                                success: false,
                                                STATUSCODE: 5002,
                                                message: "something went wrong!",
                                                response: err
                                            });
                                        } else {
                                            resDetails.personal.email = data.newEmail
                                            callback({
                                                success: true,
                                                STATUSCODE: 2000,
                                                message: "Email Updated Successfully ",
                                                response: {_id: resDetails._id, ...resDetails.personal}
                                            });
                                        }
                                    });

                                }                                               
                    }
                });
        } else {
            callback({
                success: false,
                STATUSCODE: 5005,
                message: "Internal Server Error!",
                response: {}
            });
        }
    },
    //verifyEmail
    verifyEmail: function (data, callback) {
        if (data) {
            console.log('verified Email Data---->',data)
            UserSchema.findOne({
                    'personal.email': data.email.toLowerCase()
                }, {
                    'personal.fullname': 1,'personal.email':1
                },
                function (err, resDetails) {
                    if (err) {
                        callback({
                            success: false,
                            STATUSCODE: 5002,
                            message: "something went wrong!",
                            response: err
                        });
                    } else {
                        if (resDetails === null) {
                            callback({
                                success: false,
                                STATUSCODE: 5002,
                                message: "User does not exist!",
                                response: {}
                            });
                        } else {
                            UserSchema.update({
                                _id: resDetails._id
                            }, {
                                $set: {
                                    "personal.otp": data.otp
                                }
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        success: false,
                                        STATUSCODE: 5002,
                                        message: "something went wrong!",
                                        response: err
                                    });
                                } else {
                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "otp send successfully. Please check your registered email address.",
                                        response: {_id: resDetails._id, ...resDetails.personal}
                                    });
                                }
                            });

                        }
                    }
                });
        } else {
            callback({
                success: false,
                STATUSCODE: 5005,
                message: "Internal Server Error!",
                response: {}
            });
        }
    },
    //verifyEmailOtpModel
    verifyEmailOtpModel: function (data, callback) {
        if (data) {

            if(!data.otp)
            {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "Otp required!",
                    response: {}
                });
            }

            if(!data.email)
            {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "Email required!",
                    response: {}
                });
            }
            UserSchema.findOne({
                'personal.email': data.email.toLowerCase(),
                'personal.otp': data.otp
            },
                function (err, resDetails) {
                    if (err) {
                        callback({
                            success: false,
                            STATUSCODE: 5002,
                            message: "something went wrong!",
                            response: err
                        });
                    } else {
                        if (resDetails === null) {
                            callback({
                                success: false,
                                STATUSCODE: 4200,
                                message: "Otp Verification Failed!",
                                response: {}
                            });
                        } else {
                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "Otp Verify successfully",
                                        response: {_id: resDetails._id, ...resDetails.personal}
                                    });
                                }                                               
                    }
                });
        } else {
            callback({
                success: false,
                STATUSCODE: 5005,
                message: "Internal Server Error!",
                response: {}
            });
        }
    },
    socialRegister: (data, callback) => {

        UserSchema.findOne({
            "personal.email": String(data.email).toLowerCase()
        }, (err, user) => {
            if (err) {
                console.log("Error1", err);
                callback({
                    success: false,
                    STATUSCODE: 5005,
                    message: "Internal Server Error!",
                    response: {}
                });
            } else {
                if (user) {
                    let token = createToken(user);
                    user.personal.authtoken      = token;
                    user.personal.socialLogin    = JSON.parse(data.socialLogin);
                    data.profileImage   = data.socialLogin.image
                    data.deviceId       = data.deviceId

                    user.save();
                    console.log('data.socialLogin--->',user)

                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "Email address already exist",
                        response: {
                            authtoken   : user.personal.authtoken,
                            deviceId    : data.deviceId,
                            _id         : user._id,
                            name        : data.fullname,
                            email       : String(data.email).toLowerCase(),
                            socialData  : user.personal.socialLogin,
                            profileImage: data.profileImage

                        }
                        
                    })
                } else {
                    data._id = new ObjectID;
                    let token = createToken(data);
                    let deviceId = data.deviceId

                    if (token) {
                        //data.authtoken = token;
                        //data.user_type = 'Normal User';
                        //console.log('-------',JSON.parse(JSON.stringify(data.socialLogin)))
                        data.personal = {
                            socialLogin    : JSON.parse(data.socialLogin),
                            profileImage   : JSON.parse(data.socialLogin).image,
                            deviceId       : data.deviceId,
                            userType       : "1",
                            fullname       : data.fullname,
                            email          : data.email,
                            phone          : data.phone
                        }

                        data.expert = {
                            socialLogin    : JSON.parse(data.socialLogin),
                            profileImage   : JSON.parse(data.socialLogin).image,
                            deviceId       : data.deviceId,
                            fullname       : data.fullname,
                            userType       : "2",
                            email          : data.email,
                            phone          : data.phone
                        }

                        console.log('data social register--->',data)

                        new UserSchema(data).save(function (err, result) {
                            if (err) {
                                console.log("Error2", err);
                                callback({
                                    success: false,
                                    STATUSCODE: 4200,
                                    message: "Internal Server Error!",
                                    response: err
                                });
                            } else {
                              
                                var all_result = {

                                    authtoken   : token,
                                    deviceId    : deviceId,
                                    _id         : result._id,
                                    name        : result.personal.fullname,
                                    email       : result.personal.email,
                                    phone       : result.personal.phone,
                                    socialLogin : result.personal.socialLogin

                                }
                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "User Successfully Logged in.",
                                        response: all_result
                                    
                                });
                            }
                        });
                    }
                }
            }
        })
    },
    getTermsAndConditionsModel: async function (data, callback) {

        TermSchema.findOne({"_id": "5de5f9517845634ca0c8863c"})
            .then(res =>{
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Success",
                    response: res
                });
            })
            .catch(err => {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            })
           
    },
    editTermsAndConditionsModel: async function (data, callback) {
        
        if(data){
            TermSchema.update(
                {"_id": data._id},
                {
                    $set:{
                        text: data.text,
                        
                    }
                }
            ).then(r =>{
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Success"
                });
            })
        }
    },
    getPrivacyPolicyModel: async function (data, callback) {

        PrivacyPolicySchema.findOne({"_id": "5de5f9517845634ca0c8863c"})
            .then(res =>{
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Success",
                    response: res
                });
            })
            .catch(err => {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            })
           
    },
    editPrivacyPolicyModel: async function (data, callback) {
        
        if(data){
            PrivacyPolicySchema.update(
                {"_id": data._id},
                {
                    $set:{
                        text: data.text,
                        
                    }
                }
            ).then(r =>{
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Success"
                });
            })
        }
    },
}

//#region sent push Notification
async function fcmSentPush (data = '', userDeviceId = '', msgBody= '') {
    var title = '';
    //console.log('-----fcmSentPush----call-------')
    if(data.title != ''){
        title = data.title;
    }else {
        title = "KuikTok"
    }
    let sendData = {title:'You appeared in Search',notificationType:'Search'}


    let Response = ''
    const message = {
        to: userDeviceId,
        notification: {
            title: 'You appeared in Search', 
            body: msgBody,
            sound: "default",
            icon: "ic_launcher",
            tag : sendData,
            content_available : true,
        },
        
        data: {  //you can send only notification or only data(or include both)
            'title' : 'You appeared in Search',
            'body' : msgBody,
            'tag' : sendData
        }
    };
    
   await fcm.send(message, async function(err, response){
        if (err) {
            //console.log("Something has gone wrong!", err);
            return Response = {
                isSuccess: false,
                message: 'User deviceId is wrong or missing.'
            };
        } else {
            //console.log('-----fcm success----call-------')

           // console.log('type Success==>', typeof JSON.parse(response))
            //console.log('Success==>',JSON.parse(response))

            if(JSON.parse(response).success == '1'){


                console.log('--------notification ok--->')
                //console.log('data.msgBody--->',msgBody)

                if(data.excludeUserId != ''){

                    //from_user,message,NotificationsSchema 
                    let notificationdata = {
                        from_user : data.excludeUserId,
                        timeForTalking  :data.timeForTalking,
                        to_user   : data.to_user,
                        message   : msgBody,
                        
                    }
                    await NotificationsSchema.create(notificationdata)
                }

                return Response = {
                    isSuccess: true,
                    message: 'Push notification sent successfully to the user.'
                };
            }
        }
    });

    return Response
}

//#endregion

//counter sequence
const getNextSequence = async (name) => {
    // var a = {
    //     _id: new ObjectID,
    //     orderId: "orderId",
    //     seq: 0
    // }
    // new OrderCounterSchema(a).save()
    var returnElement = 0
    await CounterSchema.findOneAndUpdate(

        {
            orderId: "orderId"
        }, {
            $inc: {
                seq: 1
            }
        }, {
            new: true
        }

    ).then(counter => {
        //console.log(counter);
        returnElement = counter.seq;

    })
    //console.log(returnElement);


    return returnElement;
}

module.exports = commonModel;