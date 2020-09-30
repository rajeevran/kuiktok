
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
            fullname: 1
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
                                    password: hash
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
                                        response: resDetails
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
            email: data.email.toLowerCase()
        }, {
            fullname: 1
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
                                    password: hash
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
                                        response: resDetails
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
                specialization: data.specialization
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

addVideoCallModel: async function (data, callback) {
                
    if (data) {


//p2p,e2p p2g, , e2g
    if(data.talkTo == 'p2p' )
    {
        data.talkTo = "1"
    }else if(data.talkTo == 'e2p' )
    {
        data.talkTo = "2"
    }
    let searchFilters ={}

    if (data.talkTo) {
    searchFilters["userType"] = data.talkTo;
    }  

     //Gender

     if (data.settingGender) {
        
        searchFilters["gender"] = {$in :data.settingGender};
        
      }

    //Age

      if (data.settingStartage && data.settingEndage) {
        searchFilters["age"] = {
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
            searchFilters["country"] = data.country;

        }else if(count == 1 && countryValue == 'country'){

            searchFilters["country"] = data.country;

        }else if(count == 1 && cityValue == 'city'){

            searchFilters["city"] = data.city;

        }



        }

// "settingTalkLocation" : [ 
        //     "city"
        // ]


      } 


    if (data.specialization) {


        searchFilters["specialization"] = {$in :data.specialization};
    } 
    if (data.excludeUserId) {

        searchFilters["_id"] = {$ne :data.excludeUserId};
    } 

    var userDetails = await UserSchema.find(searchFilters)
    let  userSpecializationArray = []

    if(userDetails)
    {
        //console.log("userDetails",userDetails);
        let counter = 0

        for (let index = 0; index < userDetails.length; index++) {
            const field         = userDetails[index].field;
            const deviceId      = userDetails[index].deviceId;
            const specialization= userDetails[index].specialization;
            const createdAt     = userDetails[index].createdAt;
            const updatedAt     = userDetails[index].updatedAt;
            const currUserId    = userDetails[index]._id;
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
                                          .populate('specialization') 
                        if(udata.specialization.length>0)
                        {
                            async.each(udata.specialization, (spec)=>{
                                userSpec = userSpec + spec.name + ' ,'
                            })
                        }

                        fullname    = udata.fullname.indexOf(' ') > -1 ? (udata.fullname.split(' '))[0] : udata.fullname
                        userAge     = udata.age
                        userSpec    = userSpec.substr(0, userSpec.length-1)
                        userCity    = udata.city
                        userCountry = udata.country

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
                    response: userDetails
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

    console.log('---searchFilters',searchFilters)


    let NotificationsCategory = await NotificationsSchema.find(searchFilters).sort({ updatedAt: -1 })



    if(NotificationsCategory)
    {

        for (let index = 0; index < NotificationsCategory.length; index++) {

                const fromUserId  = NotificationsCategory[index].from_user;

                let searchUsers = {};

                searchUsers["_id"] = fromUserId;
                
                if(data.userType)
                {
                    searchUsers["userType"] = { $in: data.userType };
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
       await UserSchema.update(
            {_id: data.userId},
            {
                $set:{
                   
                    settingNotificationUserType: data.settingNotificationUserType                            
                }
            }
        )
        
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
 let duplicateUserEmail = await UserSchema.findOne({ email: String(data.email).toLowerCase() })
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
                userType: data.userType,
                termCondition: data.termCondition
            }

            let addUserSchemaDataResponse = await UserSchema.create(userSchemaData);

            if(addUserSchemaDataResponse)
            {
                var token = createToken(addUserSchemaDataResponse);

                let updateResponse = await UserSchema.updateOne({_id: addUserSchemaDataResponse._id}, {
                $set: {authtoken: token}           
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
                                password: hash
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
                                    response: userResponse
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

            // new UserSchema(userSchema)
            //     .save(r =>{
            //         console.log('addUser',r)
            //         callback({
            //             success: true,
            //             STATUSCODE: 2000,
            //             message: "Submitted User Successfully.",
            //             response: r
            //         });
            //     })
              
    
        }

    }

},
listUserModel: async function (data, callback) {

    var searchArray = [];
    var combineResponse = [];

    if(data.searchTerm){
        searchArray.push({'fullname': new RegExp(data.searchTerm, 'i')});
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

      if (data.searchTerm) {
        searchFilters["fullname"] = { $regex: data.searchTerm, $options: "i" };
      }

      if (data.userType) {
        searchFilters["userType"] = data.userType;
      }

      if (data.phone) {
        searchFilters["phone"] = data.phone;
      }

      if (data.gender) {
        searchFilters["gender"] = data.gender;
      }

      if (data.age) {
        searchFilters["age"] = data.age;
      }    

      if (data._id) {
        searchFilters["_id"] = data._id;
      }  
  

      if (data.consultingFees) {
        searchFilters["consultingFees"] = data.consultingFees;
      }                          
      
      if (data.field) {
        searchFilters["field"] = {$in :data.field};
      } 
      console.log('data.specialization 0------>',data.specialization)

      if (data.specialization) {
        searchFilters["specialization"] = {$in :data.specialization};
      }
        console.log('data.specialization 1------>',data.specialization)

    //   if (data.settingField && data.settingField.length>0) {
    //     searchFilters["field"] = {$in :JSON.parse(data.settingField)};
    //   }

    //   if (data.settingSpecialization && data.settingSpecialization.length>0) {
    //     searchFilters["specialization"] = {$in :JSON.parse(data.settingSpecialization)};
    //   }
      
    //   if (data.settingConsultingFees && data.settingConsultingFees.length>0) {

    //     searchFilters["consultingFees"] = {$in :JSON.parse(data.settingConsultingFees)};

    //   }

    //userType

      if (data.settingUserType) {
        searchFilters["userType"] = data.settingUserType;
      } 

     //Gender

      if (data.settingGender && data.settingGender.length>0) {

        searchFilters["gender"] = {$in :data.settingGender};

       // {$or:[{region: "NA"},{sector:"Some Sector"}]}
        
      }

    //Age

      if (data.settingStartage && data.settingEndage) {
        searchFilters["age"] = {
          $gte: data.settingStartage,
          $lte: data.settingEndage
        };
      }

    //Location

      if (data.settingTalkLocation && data.settingTalkLocation.length>0) {


        searchFilters["talkLocation"] = {$in :data.settingTalkLocation};
      }


      if (data.talkLocation) {
        searchFilters["talkLocation"] = data.talkLocation;
      } 
      
      if (data.talkTime) {
        searchFilters["talkTime"] = data.talkTime;
      } 

      if (data.email) {
        searchFilters["email"] = data.email;
      } 

      if (data.location) {
        searchFilters["location"] = { $regex: data.location, $options: "i" };
      }    

      if (data.fullname) {
        searchFilters["fullname"] = { $regex: data.fullname, $options: "i" };
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
    let users = await UserSchema.find(searchFilters)
      .populate('specialization') 
      .sort(sortRecord)
      .limit(limitRecord)
      .skip(skipRecord)
      .exec();

      async.each(users, (user)=>{
        let specializationArray = []
        //console.log('---user-->',user)

            if(user.specialization.length>0)
            {
                async.each(user.specialization, (spec)=>{
                    specializationArray.push(spec.name) 
                })
            }

            user.__proto__.specializationArray = specializationArray
            console.log('---specializationArray s-->',user.__proto__.specializationArray)

        })

    let usersCountFiltered = await UserSchema.find(searchFilters)



    if(users.length>0)
    {
    callback({
            success: true,
            STATUSCODE: 2000,
            message: "Success",
            totalData: countUser,
            filteredData:usersCountFiltered.length,
            response: users
        })
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

    UserSchema.findOne({_id: data._id})
        .then(async ven => {
            if(ven){
                console.log('data.profileImage--->',data.profileImage)
                console.log('data.profileImage type of--->',typeof data.profileImage)

                if (data.profileImage !== undefined && data.profileImage !== null && ven.profileImage !== undefined) {

                    if( (ven.profileImage !== null ) && ven.profileImage.toString().indexOf('/') > -1)
                    {
                    var resStrSplit = ven.profileImage.toString().split("/")[5];
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
    
    if(data){
        UserSchema.findOne({_id: data._id})
        .then(userData => {

        //console.log('---data.googleAddress city--->',(JSON.parse(data.googleAddress)).city)
        //console.log('---data.googleAddress country--->',(JSON.parse(data.googleAddress)).country)

            UserSchema.update(
                {_id: data._id},
                {

                    $set:{
                        fullname: data.fullname?data.fullname:userData.fullname ,
                         email: data.email?String(data.email).toLowerCase():userData.email,
                         phone: data.phone?data.phone:userData.phone,
                         gender: data.gender?data.gender:userData.gender,
                         age: data.age?data.age:userData.age,
                         location: data.location?data.location:userData.location,
                         language: data.language?data.language:userData.language,
                         website: data.website?data.website:userData.website,
                         educationLabel: data.educationLabel?data.educationLabel:userData.educationLabel,
                         field: data.field?JSON.parse(data.field):userData.field,
                         
                         settingUserType: data.settingUserType?data.settingUserType:userData.settingUserType,
                         settingStartage: data.settingStartage?data.settingStartage:userData.settingStartage,
                         settingEndage: data.settingEndage?data.settingEndage:userData.settingEndage,

                         settingGender: data.settingGender?JSON.parse(data.settingGender):userData.settingGender,
                         settingTalkLocation: data.settingTalkLocation?JSON.parse(data.settingTalkLocation):userData.settingTalkLocation,
                         
                         specialization: data.specialization?JSON.parse(data.specialization):userData.specialization,
                         occupation: data.occupation?data.occupation:userData.occupation,
                         contact: data.contact?data.contact:userData.contact,
                         talkLocation: data.talkLocation?data.talkLocation:userData.talkLocation,
                         talkTime:data.talkTime?data.talkTime:userData.talkTime,
                         aboutme: data.aboutme?data.aboutme:userData.aboutme,
                         talkChargeTime: data.talkChargeTime?data.talkChargeTime:userData.talkChargeTime,// for expert
                         dob :data.dob?data.dob:userData.dob,// for personal
                         linkedIn:data.linkedIn?data.linkedIn:userData.linkedIn,
                         city:data.googleAddress?(JSON.parse(data.googleAddress)).city:userData.city,
                         country:data.googleAddress?(JSON.parse(data.googleAddress)).country:userData.country,

                         experience: data.experience?data.experience:userData.experience,
                         consultingFees: data.consultingFees?data.consultingFees:userData.consultingFees,
                         profileImage: (data.profileImage !== undefined)?data.profileImage:userData.profileImage,
                         permission: data.permission?JSON.parse(data.permission):userData.permission,
                         authtoken: data.authtoken?data.authtoken:userData.authtoken,
                         blockStatus: data.blockStatus?data.blockStatus:userData.blockStatus,
                         userType: data.userType?data.userType:userData.userType,
                         termCondition: data.termCondition?data.termCondition:userData.termCondition 
                    }
                }
            )
            .then(r =>{

                    UserSchema.findOne({_id: data._id})
                    .then(user => {

                        callback({
                            success: true,
                            STATUSCODE: 2000,
                            message: "Success",
                            response: user

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
            userName = findUser.fullname
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
                email: data.oldEmail.toLowerCase()
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
                                            email: data.newEmail
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
                                            resDetails.email = data.newEmail
                                            callback({
                                                success: true,
                                                STATUSCODE: 2000,
                                                message: "Email Updated Successfully ",
                                                response: resDetails
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
                    email: data.email.toLowerCase()
                }, {
                    fullname: 1,email:1
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
                                    otp: data.otp
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
                                        response: resDetails
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
                email: data.email.toLowerCase(),
                otp: data.otp
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
                                        response: resDetails
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
            email: String(data.email).toLowerCase()
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
                    user.authtoken      = token;
                    user.socialLogin    = JSON.parse(data.socialLogin);
                    data.profileImage   = data.socialLogin.image
                    data.deviceId       = data.deviceId

                    user.save();
                    console.log('data.socialLogin--->',user)

                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "Email address already exist",
                        response: {
                            authtoken   : user.authtoken,
                            deviceId    : data.deviceId,
                            _id         : user._id,
                            name        : data.fullname,
                            email       : String(data.email).toLowerCase(),
                            socialData  : user.socialLogin,
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
                        data.socialLogin    = JSON.parse(data.socialLogin);
                        data.profileImage   = data.socialLogin.image
                        data.deviceId       = data.deviceId
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
                                    name        : result.fullname,
                                    email       : result.email,
                                    phone       : result.phone,
                                    socialLogin : result.socialLogin

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


                //console.log('data.from_user--->',data.from_user)
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