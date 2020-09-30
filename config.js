//let Url = "http://localhost:3110/"
let Url = "https://nodeserver.brainiuminfotech.com:3110/"

module.exports = {
    "port": 3110,
    "secretKey": "hyrgqwjdfbw4534efqrwer2q38945765",
    production: {
        // username: 'mongoAdminBIT',
        // password: 'BiT^7129~jsQ​-P',
        // host: '162.243.110.92',
        // port: '27017',
        // dbName: 'rx123',
        // authDb: 'admin'
        //mongoose.connection.on

        username: 'brain1uMMong0User',
        password: 'PL5qnU9nuvX0pBa',
        host: '68.183.173.21',
        port: '27017',
        dbName: 'Kuiktok',
        authDb: 'admin'
    },
    local: {
        // database: "mongodb://localhost:27017/rx123",
         MAIL_USERNAME: "kuiktok@gmail.com",
         MAIL_PASS: "Kuiktok0607#1",
        database: "mongodb://localhost:27017/Rito",
      //  MAIL_USERNAME: "root",
      //  MAIL_PASS: ""     
        //mongoose.connection.on
       // kuiktok@gmail.com
        //pw: Kuiktok0607

    },

    //liveUrl: "http://localhost:3110/",
    liveUrl: "https://nodeserver.brainiuminfotech.com:3110/",
    siteConfig: {
        LOGO: 'images/app_icon.png',
        SITECOLOR: '#1173E5',
        SITENAME: 'KuikTok'
    },
    uploadUserPath:'public/uploads/user/',
    //userPath:Url+'uploads/user/',
    userPath:Url+'uploads/user/',          

    //liveUrl: "http://68.183.173.21:3004/", 
    logPath: "/ServiceLogs/admin.debug.log",
    dev_mode: true,
    __root_dir: __dirname,
    FCM_SERVER_KEY: 'AAAAe4-sK9A:APA91bF5JYL2fNfZHO14t2o06ohLsSMzWf8DQ66H6UeUgDs7ZpMwSTZjKzLemdGIduYSnE-xa4FPDpQP-Vgf8r95WhLy4kRxTQWnN_D_amitK7H5dp0YO5UUzbHRT9asHfN0-9UzM1zu',
   // __site_url: 'http://mydevfactory.com/~sanjib/dibyendu/rx123/',
    __site_url: 'http://localhost:3110/',
    limit:10
}
