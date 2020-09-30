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

var credentials = {
    key: fs.readFileSync('/etc/letsencrypt/live/nodeserver.brainiuminfotech.com/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/nodeserver.brainiuminfotech.com/fullchain.pem', 'utf8')
  };
var server = require('https').createServer(credentials, app);
//var server = require('http').createServer(app);
//var io = socketIo(server);
var io = require('socket.io').listen(server);

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

var apiRoutesAdmin = require('./routes/apiRoutesAdmin.js');
// app.use('/apiUser', apiRoutesUser);
// app.use('/apiInstaller', apiRoutesInstaller);

app.use('/apiAdmin', apiRoutesAdmin);


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
var producationString = "mongodb://" + config.production.username + ":" + config.production.password + "@" + config.production.host + ":" + config.production.port + "/" + config.production.dbName + "?authSource=" + config.production.authDb;
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
mongoose.set('debug', false);

//===========================Connect to MongoDB==========================
//===========================Socket====================================

async function funUser(userId,status){
    let userExist =  await UserSchema.findOne({_id:userId})
    let response = {}
    if(userExist)
    {
        let updateUserStatusResponse =  await UserSchema.updateOne(
            {_id:userId},
            {$set: {
                isOnline: status
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
    console.log('-----fcmSentPush----call userId-------',userId)
    if(data.title != ''){
        title = data.title;
    }else {
        title = "Video Call from "+data.fullname
    }


    let Response = ''
    const message = {
        to: userDeviceId,
        notification: {
            title: title, 
            body: msgBody,
            sound: "default",
            icon: "ic_launcher",
            tag : Date.now(),
            content_available : true,
        },
        
        data: {  //you can send only notification or only data(or include both)
            'title' : title,
            'body' : msgBody,
            'tag' : Date.now()
        }
    };
    
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


                console.log('data.from_user--->',data.from_user)
                console.log('data.msgBody--->',msgBody)

                if(data.from_user != ''){

                    //from_user,message,NotificationsSchema
                    let notificationdata = {
                        from_user : data.from_user,
                        message   : msgBody,
                        to_user   : userId,
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


let obj={}


io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    let userId = ''
    socket.on('startCall', async (message) => {

        console.log('WebSocket startCall connected')
       // socket.leave(message.channelid)
        console.log('message.channelid----',message.channelid)
        socket.join(message.userId)

        obj[message.userId] = socket.id

        io.to(message.userId).emit('message',  message)
        console.log('message userId------->',message.userId)

            userId = message.userId
            let user = await funUser(message.userId,true)
            console.log('user under function-->',user)
            
            let userDeviceId            = message.deviceId

            let messageRes = message.fullname + ' Calling... '
            let notificationResponse = await fcmSentVideoPush(message, userDeviceId,messageRes,userId,message.channelid)

            io.to(message.userId).emit('userStatusDetail',  user)
            
       // socket.removeAllListeners()
    })

    socket.on('removeRoom', (message)  => {
        // socket.leave(obj[message.userId])
        // socket.removeAllListeners()
        // socket.disconnect()
        // socket.clients[message.userId].send({ event: 'disconnect' });
        // socket.clients[message.userId].connection.end();
        // io.of('/').in('chat').clients((error, socketIds) => {
        //     if (error) throw error;
          
        //     socketIds.forEach(socketId => io.of('/').adapter.remoteLeave(socketId, 'chat'));
          
        //   });

       // obj[message.userId] = socket.id
      // console.log('------------removeRoom socket.id-----------',obj)
       // console.log('------------removeRoom message.userId-----------',message.userId)
     //   console.log('------------removeRoom socket-----------',socket)
        //socket.to(room.channelId).emit('removeMessage', 'user has left room')
      })

    socket.on('signOutUser', async (signOutMessage) => {
    console.log('WebSocket signOutUser disconnected')

       // io.emit('signOutMessage',  signOutMessage)
        console.log('signOutMessage------->',signOutMessage.userId)
        if(signOutMessage.userId)
        {
            userId = signOutMessage.userId
            let user = await funUser(signOutMessage.userId,false)
            console.log('user under function-->',user)
           // io.emit('userStatusDetail',  user)
        }

    })


    socket.on('disconnect', function() {
       // delete clients[socket.id];
      });

   })


//    io.sockets.on('connection',function(socket){
//     console.log(socket.id + 'a user connected');
//     console.log('New WebSocket connection')
//     let userId = ''
//     socket.removeAllListeners()

//             socket.on('startCall', async (message) => {
//                 console.log('WebSocket startCall connected')
            
//                     io.to(message.userId).emit('message',  message)
//                     console.log('message userId------->',message.userId)
//                     if(message.userId)
//                     {
//                         userId = message.userId
//                         let user = await funUser(message.userId,true)
//                         console.log('user under function-->',user)
            
//                         // const userDeviceId       = message.deviceId
                        
//                         let userDeviceId            = message.deviceId
            
//                         let messageRes = message.fullname + ' Calling... '
//                         let notificationResponse = await fcmSentVideoPush(message, userDeviceId,messageRes,userId)
            
//                         io.to(message.userId).emit('userStatusDetail',  user)
//                     }
            
//                 })

//                 socket.on('signOutUser', async (signOutMessage) => {
//                     console.log('WebSocket signOutUser disconnected')
                
//                     // io.emit('signOutMessage',  signOutMessage)
//                         console.log('signOutMessage------->',signOutMessage.userId)
//                         if(signOutMessage.userId)
//                         {
//                             userId = signOutMessage.userId
//                             let user = await funUser(signOutMessage.userId,false)
//                             console.log('user under function-->',user)
//                         // io.emit('userStatusDetail',  user)
//                         }
                
//                     })

//             socket.on('disconnect', function () {
//                 console.log('user disconnected');
//             });
// });
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