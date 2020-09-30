'use strict';
var express = require("express");
var commonService = require('../services/apiServices/apiCommonService');
var bodyParser = require('body-parser');
var config = require('../config');
var jwt = require('jsonwebtoken');

var multer = require('multer');
var path = require('path');


var secretKey = config.secretKey;

var api = express.Router();
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({
extended: false
}));


const fs = require('fs');

// const DIR = 'public/uploads';
console.log('__dirname-->', __dirname.replace('routes',''))
const DIR =  path.resolve(__dirname.replace('routes','public'), 'uploads');
//__dirname.replace('routes','public')+'uploads';
console.log('DIR-->', DIR)

let storage = multer.diskStorage({
destination: (req, file, cb) => {
cb(null, DIR);
},
filename: (req, file, cb) => {
cb(null, file.fieldname + '-' + Date.now() + '.' + path.extname(file.originalname));
}
});
let upload = multer({storage: storage});
//app.use(multer().single('photo'));

api.post('/upload',multer().single('photo'), function (req, res) {
    console.log(req.files)
    if (!req.files) {
        console.log("No file received");
        return res.send({
        success: false
        });

    } else {
        console.log('file received successfully');
        return res.send({
        success: true
        })
    }
});


api.post('/adminSignup', function (req, res) {
    var adminData = req.body;
    commonService.adminSignup(adminData, function (response) {
         res.send(response);
    });
});
api.post('/adminLogin', function (req, res) {
    var adminData = req.body;
    commonService.adminLogin(adminData, function (response) {
         res.send(response);
    });
});



//#region for user management

//Change password
api.post('/changePassword', function (req, res) {
    console.log('req.headers---->',req.headers.authtoken)
    var token = req.body.authtoken || req.params.authtoken || req.headers.authtoken;

    commonService.changePassword(req.body,token, function (response) {
        res.send(response);
    });
});

//verify Changed Email 
api.post('/verifyChangedEmail', function (req, res) {
    //console.log('req.headers---->',req.headers.authtoken)

    commonService.verifyChangedEmail(req.body, function (response) {
        res.send(response);
    });
});



//Forgot password
api.post('/forgotPassword', function (req, res) {
    commonService.forgotPassword(req.body, function (response) {
        res.send(response);
    });
});

api.post('/userLogin', function (req, res) {
    var userData = req.body;
    commonService.userLogin(userData, function (response) {
         res.send(response);
    });
});

api.post('/addUser', function (req, res) {
    var adminData = req.body;
    commonService.addUserService(adminData, function (response) {
          res.send(response);
    });
});

api.post('/listUser', function (req, res) {
    var adminData = req.query;
    commonService.listUserService(adminData, function (response) {
         res.send(response);
    });
})

api.post('/editUser', function (req, res) {

    var adminData = req.body;
    commonService.editUserService(req.body,req.files, function (response) {
    res.send(response);
    });

})

api.post('/deleteUser', function (req, res) {
    var adminData = req.body;
    commonService.deleteUserService(adminData, function (response) {
        res.send(response);
    });
})

api.get('/get-all-user', function (req, res) {
    var adminData = req.body;
    commonService.getAllUserService(adminData, function (response) {
         res.send(response);
    });
})        

//#endregion

  //Add edit Rating
  api.post('/addRating', function (req, res) {

    commonService.addRatingService(req.body, function (response) {
        res.send(response);
    });

  });

  //Add list Rating
  api.post('/listRating', function (req, res) {

    commonService.listRatingService(req.body, function (response) {
        res.send(response);
    });

  });

//#region for Specialization management


api.post('/addSpecialization', function (req, res) {
    var adminData = req.body;
    commonService.addSpecializationService(adminData, function (response) {
          res.send(response);
    });
});

api.get('/listSpecialization', function (req, res) {
    var adminData = req.query;
    commonService.listSpecializationService(adminData, function (response) {
         res.send(response);
    });
})

api.post('/editSpecialization', function (req, res) {
    var adminData = req.body;
    commonService.editSpecializationService(adminData, function (response) {
         res.send(response);
    });
})

api.post('/deleteSpecialization', function (req, res) {
    var adminData = req.body;
    commonService.deleteSpecializationService(adminData, function (response) {
        res.send(response);
    });
})

api.post('/get-all-specialization', function (req, res) {
    var adminData = req.body;
    commonService.getAllSpecializationService(adminData, function (response) {
         res.send(response);
    });
})        

//#endregion


//#region for Field management


api.post('/addField', function (req, res) {
    var adminData = req.body;
    commonService.addFieldService(adminData, function (response) {
          res.send(response);
    });
});

api.get('/listField', function (req, res) {
    var adminData = req.query;
    commonService.listFieldService(adminData, function (response) {
         res.send(response);
    });
})

api.post('/editField', function (req, res) {
    var adminData = req.body;
    commonService.editFieldService(adminData, function (response) {
         res.send(response);
    });
})

api.post('/deleteField', function (req, res) {
    var adminData = req.body;
    commonService.deleteFieldService(adminData, function (response) {
        res.send(response);
    });
})

api.post('/get-all-field', function (req, res) {
    var adminData = req.body;
    commonService.getAllFieldService(adminData, function (response) {
         res.send(response);
    });
})        

//#endregion


//#region for AboutUs


api.post('/addAboutUs', function (req, res) {
    var adminData = req.body;
    commonService.addAboutUsService(adminData, function (response) {
          res.send(response);
    });
});

api.get('/listAboutUs', function (req, res) {
    var adminData = req.query;
    commonService.listAboutUsService(adminData, function (response) {
         res.send(response);
    });
})

api.post('/editAboutUs', function (req, res) {
    var adminData = req.body;
    commonService.editAboutUsService(adminData, function (response) {
         res.send(response);
    });
})

api.post('/deleteAboutUs', function (req, res) {
    var adminData = req.body;
    commonService.deleteAboutUsService(adminData, function (response) {
        res.send(response);
    });
})

api.get('/get-all-aboutus', function (req, res) {
    var adminData = req.body;
    commonService.getAllAboutUsService(adminData, function (response) {
         res.send(response);
    });
})        

//#endregion



//#region for Timer


api.post('/addTimer', function (req, res) {
    var adminData = req.body;
    commonService.addTimerService(adminData, function (response) {
          res.send(response);
    });
});

api.post('/listTimer', function (req, res) {
    var adminData = req.query;
    commonService.listTimerService(adminData, function (response) {
         res.send(response);
    });
})

api.post('/editTimer', function (req, res) {
    var adminData = req.body;
    commonService.editTimerService(adminData, function (response) {
         res.send(response);
    });
})

api.post('/get-all-timer', function (req, res) {
    var adminData = req.body;
    commonService.getAllTimerService(adminData, function (response) {
         res.send(response);
    });
})        

//#endregion



  //verify Email
  api.post('/verifyEmail', function (req, res) {
    commonService.verifyEmail(req.body, function (response) {
      res.send(response);
    });
  });

  //verify Email Otp
  api.post('/verifyEmailOtp', function (req, res) {
    commonService.verifyEmailOtpService(req.body, function (response) {
      res.send(response);
    });
  });

    //social Login
  api.post('/socialLogin', (req, res) => {

    commonService.socialRegister(req.body, function (response) {
      res.send(response);
    });
  });

  //Add edit Notification
  api.post('/addNotification', function (req, res) {

    var token = req.body.authtoken || req.params.authtoken || req.headers.authtoken;

    commonService.addNotificationService(req.body,token, function (response) {
        res.send(response);
    });

  });

  //Add list Notification
  api.post('/listNotification', function (req, res) {

    commonService.listNotificationService(req.body, function (response) {
        res.send(response);
    });

  });

  //Add list UserType
  api.post('/listUserType', function (req, res) {

    commonService.listUserTypeService(req.body, function (response) {
        res.send(response);
    });

  });

  //Add setting Notification
  api.post('/settingNotification', function (req, res) {

    commonService.settingNotificationService(req.body, function (response) {
        res.send(response);
    });

  });

  //Add edit VideoCall
  api.post('/addVideoCall', function (req, res) {

    var token = req.body.authtoken || req.params.authtoken || req.headers.authtoken;

    commonService.addVideoCallService(req.body,token, function (response) {
        res.send(response);
    });

  });


  //Add edit User Specialization Button
  api.post('/addEditUserSpecialization', function (req, res) {

    var token = req.body.authtoken || req.params.authtoken || req.headers.authtoken;

    commonService.addEditUserSpecialization(req.body,token, function (response) {
        res.send(response);
    });

  });

api.post('/get-terms-and-condition', function (req, res) {
    var adminData = req.body;
    commonService.getTermsAndConditionsService(adminData, function (response) {
         res.send(response);
    });
})
api.post('/edit-terms-and-condition', function (req, res) {
    var adminData = req.body;
    commonService.editTermsAndConditionsService(adminData, function (response) {
        res.send(response);
    });
})

api.post('/get-privacy-policy', function (req, res) {
    var adminData = req.body;
    commonService.getPrivacyPolicyService(adminData, function (response) {
         res.send(response);
    });
})
api.post('/edit-privacy-policy', function (req, res) {
    var adminData = req.body;
    commonService.editPrivacyPolicyService(adminData, function (response) {
        res.send(response);
    });
})

api.post('/get-abuse-report', function (req, res) {
    var adminData = req.body;
    commonService.getAbuseReportService(adminData, function (response) {
         res.send(response);
    });
})
api.post('/add-abuse-report', function (req, res) {
    var adminData = req.body;
    commonService.addAbuseReportService(adminData, function (response) {
        res.send(response);
    });
})

api.post('/get-block-user', function (req, res) {
    var adminData = req.body;
    commonService.getBlockUserService(adminData, function (response) {
         res.send(response);
    });
})
api.post('/add-block-user', function (req, res) {
    var adminData = req.body;
    commonService.addBlockUserService(adminData, function (response) {
        res.send(response);
    });
})
api.post('/edit-block-user', function (req, res) {
    var adminData = req.body;
    commonService.editBlockUserService(adminData, function (response) {
        res.send(response);
    });
})
module.exports = api;