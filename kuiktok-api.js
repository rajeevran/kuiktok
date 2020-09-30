var express = require('express');
var fileUpload = require('express-fileupload');
var mongoose = require('mongoose');
var bodyparser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var methodOverride = require('method-override');
var _ = require('lodash');
var fs = require('fs');
const socketIo = require("socket.io");
var UserSchema = require('./schema/admin/user');
var NotificationsSchema = require('./schema/admin/notifications');

var config = require("./config");
var FCM = require('fcm-node')
var fcmServerKey = config.FCM_SERVER_KEY;
const serverKey = fcmServerKey //put your server key here
const fcm = new FCM(serverKey);

//var apiService = require('./services/apiService');
//========================Create the application======================
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// This line is from the Node.js HTTPS documentation.

// var credentials = {
//     key: fs.readFileSync('/etc/letsencrypt/live/nodeserver.brainiuminfotech.com/privkey.pem', 'utf8'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/nodeserver.brainiuminfotech.com/fullchain.pem', 'utf8')
//   };
// var server = require('https').createServer(credentials, app);
var server = require('http').createServer(app);
var io = socketIo(server);
//==============Add middleware necessary for REST API's===============
app.use(bodyparser.json({limit: '50mb'}));
app.use(bodyparser.urlencoded(
    {
        limit: '50mb',
        parameterLimit: 100000, 
        extended: true 
    }));
app.use(bodyparser.json());
app.use(fileUpload());
app.use(cookieParser());
app.use(methodOverride('X-HTTP-Method-Override'));
//==========Add module to recieve file from angular to node===========
//app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(express.static(__dirname + '/public'));
//===========================CORS support==============================
app.use(function (req, res, next) {
    req.setEncoding('utf8');
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    // Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, user_id, authtoken");
    //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");

    if ('OPTIONS' == req.method) {
        res.sendStatus(200)
       // res.send(200);
    } else {
        next();
    }
});

//=========================Load the routes===============================
// var apiRoutesUser = require('./routes/apiRoutesUser.js')(app, express);
// var apiRoutesInstaller = require('./routes/apiRoutesInstaller.js')(app, express);

var apiRoutes = require('./routes/apiRoutes.js');
var adminRoutes = require('./routes/adminRoutes.js');
// app.use('/apiUser', apiRoutesUser);
// app.use('/apiInstaller', apiRoutesInstaller);

app.use('/apiAdmin', apiRoutes);
app.use('/admin', adminRoutes);


// var adminRoutes = require('./routes/adminRoutes.js')(app, express);
// app.use('/admin', adminRoutes);

// var adminRoutes = require('./routes/adminRoutes.js')(app, express);
// app.use('/admin', adminRoutes);
//=========================Load the views================================
app.get("*", function (req, res) {
    res.sendFile(__dirname + '/public/views/404.html');
});
//===========================Connect to MongoDB==========================
// producation config or local config
//mongodb://kuiktok:brainium123@3.17.27.20/admin
var producationString = "mongodb://" + config.production.username + ":" + config.production.password + "@" + config.production.host + ":" + config.production.port + "/" + config.production.dbName + "?authSource=" + config.production.authDb;
//var producationString = "mongodb://kuiktok:brainium123@3.128.124.147/kuiktok"
//var producationString = "mongodb://" + config.local.username + ":" + config.local.password + "@" + config.local.host + ":" + config.local.port + "/" + config.local.dbName + "?authSource=" + config.local.authDb;

console.log(producationString);

//var producationString = config.local.database;
var localString = 'mongodb://localhost:27017/Rito'
var options = {};
var db = mongoose.connect(producationString, options, function (err) {
    if (err) {
        console.log(err + "connection failed");
    } else {
        console.log('Connected to database ');
    }
});
//mongo on connection emit
mongoose.connection.on('connected', function (err) {
    console.log("mongo Db conection successfull");
});
//mongo on error emit
mongoose.connection.on('error', function (err) {
    console.log("MongoDB Error: ", err);
});
//mongo on dissconnection emit
mongoose.connection.on('disconnected', function () {
    console.log("mongodb disconnected and trying for reconnect");
    mongoose.connectToDatabase();
});
mongoose.set('debug', true);

//===========================Connect to MongoDB==========================
//===========================Socket====================================

async function funUser(userId,status){
    let userExist =  await UserSchema.findOne({_id:userId})
    let response = {}
    if(userExist)
    {
        let updateUserStatusResponse =  await UserSchema.update(
            {_id:userId},
            {$set: {
                "personal.isOnline": status
            }
            }
            )

            response =  await UserSchema.findOne({_id:userId})

            console.log('fetched response',response);
            //  return response
    }
  return response

}

//#region sent push Notification
async function fcmSentVideoPush (data = '', userDeviceId = '', msgBody= '',userId= '',channelId= '') {
    var title = '';
    console.log('-----video call fcm data-------',data)
    console.log('-----video call fcm userDeviceId-------',userDeviceId)
    console.log('-----video call fcm userId-------',userId)
    if(data.title != ''){
        title = data.title;
    }else {
        title = "Video Call from "+data.fullname
    }

    let sendData = {title:'video call',data:data,msgBody:msgBody,type:'Calling...',notificationType:'VideoCall'}

    let Response = ''
    const message = {
        to: userDeviceId,
        notification: {
            rawData:sendData,
            title: 'Video Calling', 
            body: msgBody,
            sound: "default",
            icon: "ic_launcher",
            tag : sendData,
            content_available : true,
        },
        
        data: {  //you can send only notification or only data(or include both)
            'title' : 'Video Calling',
            'body' : msgBody,
            'tag' : sendData
        }
    };

    console.log("message=====",message);
    
   await fcm.send(message, async function(err, response){
        if (err) {
            console.log("Something has gone wrong!", err);
            return Response = {
                isSuccess: false,
                message: 'User deviceId is wrong or missing.'
            };
        } else {
            console.log('-----fcm success----call-------')

            console.log('type Success==>', typeof JSON.parse(response))
            console.log('Success==>',JSON.parse(response))

            if(JSON.parse(response).success == '1'){


                console.log('data.from_user--->',userId)
                console.log('data.msgBody--->',msgBody)

                if(userId != ''){

                    //from_user,message,NotificationsSchema
                    let notificationdata = {
                        from_user : userId,
                        message   : msgBody,
                        timeForTalking  :data.timeForTalking,
                        to_user   : data.callerid,
                        channelId : channelId
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


connected_user = [];
io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    let userId = ''

    socket.on('new user', function (data, callback) {

        //console.log('new user data------->',data)


        //socket.join(data.userId);

        const index = connected_user.indexOf(data.userId);

        if (index == -1) {
            connected_user.push(data.userId);
        }
        //console.log('connected_user------->',connected_user)
        updateOnline();

    });

    function updateOnline() {
        io.sockets.emit('userStatusDetail', connected_user);

    }

    // socket.on('kick', function (data) {

    //     //console.log('kick user data------->',data)

    //     const index = connected_user.indexOf(data.userId);
    //     if (index > -1) {
    //         connected_user.splice(index, 1);
    //         console.log(data.userId + " has been kick");
    //         updateOnline();
    //     } else {
    //         console.log(data.userId + " not exist");
    //     }

    //     //console.log('After kick connected_user------->',connected_user)
    // });

    socket.on('startCall', async (message) => {
    console.log('WebSocket startCall connected')

        io.emit('message',  message)
    })


    socket.on('sendNotification', async (message) => {
        console.log('sendNotification',message)
    
        if(message.userId)
        {
            userId = message.userId
             user = await funUser(message.userId,true)
            console.log('user under function-->',user)

            // const userDeviceId       = message.deviceId
            
            let userDeviceId            = message.deviceId


            let  fullname     = ''
            let  userAge      = ''
            let  userSpec     = ''
            let  userCountry  = ''
            let  userCity     = ''
            let  overallUserInfo      = ''

                let umessage = await UserSchema.findOne({_id:message.userId})
                                  .populate('personal.specialization') 
                if(umessage.personal.specialization.length>0)
                {
                    for (var i = 0; i < umessage.personal.specialization.length; i++) {
                        
                        userSpec = userSpec + umessage.personal.specialization[i].name + ' ,'

                    }

                    // async.each(umessage.specialization, (spec)=>{
                    //     userSpec = userSpec + spec.name + ' ,'
                    // })
                }

                fullname    = umessage.personal.fullname.indexOf(' ') > -1 ? (umessage.personal.fullname.split(' '))[0] : umessage.personal.fullname
                userAge     = umessage.personal.age
                userSpec    = userSpec.substr(0, userSpec.length-1)
                userCountry = umessage.personal.country
                userCity    = umessage.personal.city

                overallUserInfo = fullname +', '+userAge+', '+userCity+', '+userCountry
            //“Robins,    (age)    (Location)    is    calling    about    (topic)

            message.fullname = overallUserInfo

            let messageRes = message.fullname + ' is calling about '+userSpec
            let notificationResponse = await fcmSentVideoPush(message, userDeviceId,messageRes,userId,message.channelid)

        }
    
        })


    socket.on('signOutUser', async (data) => {
    console.log('WebSocket signOutUser disconnected',data)

    	const index = connected_user.indexOf(data.userId);
        if (index > -1) {
            connected_user.splice(index, 1);
            console.log(data.userId + " has been kick");
            updateOnline();
        } else {
            console.log(data.userId + " not exist");
        }
    })

    socket.on('leaveRoom', async (data) => {
        console.log('Before leave room ------------->',data)

        io.emit('leaveUserData',  data)
    })

    socket.on('disconnect', async () => {
        console.log('disconnecte user')

       // io.emit('userStatusDetail',  userId)
        // let user = await funUser(userId,false)
        // console.log('user under function-->',user)
        // io.emit('userStatusDetail',  user)

    })

   })


// io.on('connection', (socket) => {
//     console.log('New WebSocket connection')

//     socket.on('connect', (message, callback) => {
//         console.log('Get connected')

//         io.emit('connect', message)
//         callback()
//     })   
// })


    // io.sockets.on('connection',function(socket){

    //     socket.on('connect',function(msg){
    //         console.log(msg)
    //         io.emit('receive',msg);
    //     })
   // console.log(socket.id + 'a user connected');
    // io.emit('authenticate');
    // socket.on('authentication',function(data){
    //     apiService.jwtAuthVerification(data,function(auth){
    //         if(auth.response_code === 2000){
    //             io.to(socket.id).emit('authenticated',auth);
    //             socket.join(data.user_id);
    //         }
    //         if(auth.response_code ===4000){
    //             io.to(socket.id).emit('authenticated',auth);
    //         }
    //         if(auth.response_code === 5005){
    //             io.to(socket.id).emit('authenticated',auth);
    //         }
    //     })
    // })
    // socket.on('startChat',function(startChatData){
    //     apiService.startChat(startChatData,function(sRes){
    //         io.to(startChatData.from).emit('chatStarted',sRes);
    //     })
    // })
    // socket.on('getChatList',function(userData){
    //     apiService.getChatList(userData,function(chatList){
    //         io.to(userData.user_id).emit('chatList',chatList);
    //     })
    // })
    // socket.on('sendMsg',function(msg){
    //     io.to(msg.to).emit('rcvMsg',msg);
    // })
    // socket.on('disconnect', function () {
    //     console.log('user disconnected');
    // });
//});
//===========================Socket====================================
app.set('port', config.port);
console.log('config.port',config.port);
server.listen(app.get('port'), function (err) {
    if (err) {
        throw err;
    }
    else {
        console.log("Server is AS running at http://localhost:" + app.get('port'));
    }
});
server.timeout = 500000000; 