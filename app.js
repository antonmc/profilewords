/* global document process require console */
/* jslint browser:true */

var mongo;

var OAuth= require('oauth').OAuth;

var _callBackPage = "http://127.0.0.1:3000/sessions/callback";

if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    mongo = env['mongodb-2.2'][0]['credentials'];
    _callBackPage = "http://followers.ng.bluemix.net/sessions/callback";               
} else {
    mongo = {   "hostname":"127.0.0.1",
                "port":27017,
   	            "username":"",
                "password":"",
                "name":"",
                "db":"db",
                "url":"mongodb://127.0.0.1:27017/db" };
}

var path = mongo.url;

var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');

var http = require('http');
var twit = require("twit");

var express = require('express');
var util = require('util');
var oauth = require('oauth');
var http = require('http');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var errorHandler = require('errorhandler');
var logger = require('morgan');


var csv = [];

var app = express();
var server = http.createServer(app);

// Get your credentials here: https://dev.twitter.com/apps
var _twitterConsumerKey = "LCbB9rX8gmHmOwfQT0GKMXERc";
var _twitterConsumerSecret = "O1Bva58C18GcJ4i0kHJbKbJxO6aV6wJX4aedb1GW4YCU8QHAdR";

var consumer = new oauth.OAuth(
    "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",
    _twitterConsumerKey, _twitterConsumerSecret, "1.0A", _callBackPage, "HMAC-SHA1");

    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(logger());
    app.use(cookieParser());
    app.use(session({ secret: "very secret" })
);

app.use(function(req, res, next){
    var err = req.session.error, msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
    next();
});

var makeCommaList = function( followerArray ){

    var csv = '';

    followerArray.forEach( function( item ){
        csv = csv + item + ',';
    });

    csv = csv.substring(0, csv.length - 1);

    return csv;
}

var retrieveProfiles = function( config, res, id ) {

    /* To begin with this function will retrieve the first 5000
       followers as defined by Twitter's API */
    
    this.twit = new twit(config);

  	var twitterObject = this.twit;

    var followerSets = [];
    
    var set = [];

    console.log( 'id: ' + id );

  	this.twit.get('followers/ids', { screen_name: id },  function( err, reply ){
    
        var MAX_SAMPLE_SIZE = 1000;
        
        followerSets = [];

  		var count = 0;
        
        var totalCount = 0;

  		var idList = "";

        var sampleSize;
        
        if( reply ){

            set = [];
            
            if( reply.ids.length > MAX_SAMPLE_SIZE ){
                sampleSize = MAX_SAMPLE_SIZE;
            }else{
                sampleSize = reply.ids.length;
            }

            reply.ids.forEach( function( id ){
                
                if( totalCount < sampleSize ){

                    if( count < 100 ){
                        set.push( id );
                    }else{
                        count = 0;
                        followerSets.push( set );
                        set = [];
                        set.push( id );
                    }

                    count++;
                    totalCount++;
                }
            })

            followerSets.push( set );

            var descriptions = '';
            
            var expectedReplies = ( followerSets.length - 1 ) * 100 + count;
            
            console.log( 'expectedReplies: ' + expectedReplies );
            
            count = 0;

            followerSets.forEach( function( set ){

                var csv = makeCommaList( set );

                twitterObject.get( 'users/lookup', { user_id: csv }, function( usererr, userReply ){

                    if( userReply ){
                        userReply.forEach( function( profile ){
                            descriptions = descriptions + ' ' + profile.description;
                            count++;
                            
                            if( count === expectedReplies ){
//                                res.end( JSON.stringify({ profiles: descriptions }));  
                            }
                            
                        });
                        
//                        console.log( 'Number of profiles: ' + count );     
                        
                        res.end( JSON.stringify({ profiles: descriptions }));  
                    }
                })
            })
            
            console.log( descriptions );
        }
        
        if( err ){
            console.log( 'retrieval error' );
            console.log( err );
        }
    })
}

app.param('id', function(req, res, next, id){    
        
    res.setHeader('Content-Type', 'application/json');
        
    if( req.headers['oauth_token'] ){
        
        var token = req.headers['oauth_token'];
                
        require('mongodb').connect(mongo.url, function(err, database) {

            var collection = database.collection( 'tokens' );

            collection.findOne( { 'oauth_access_token': token }, function( err, item ) {                 
                        
                var config = {
                    consumer_key:         'LCbB9rX8gmHmOwfQT0GKMXERc',
                    consumer_secret:      'O1Bva58C18GcJ4i0kHJbKbJxO6aV6wJX4aedb1GW4YCU8QHAdR',
                    access_token_secret: item.oauth_access_token_secret,
                    access_token: item.oauth_access_token
                }
                
                console.log( 'account: ' + item.name );
        
                retrieveProfiles( config, res, id );   
                
                var requests = database.collection( 'requests' );
                
                var date = new Date();
                
                var request = ( { 'twitterId':id, 'timeStamp': date, 'account': item.name } );
                
                console.log( request );
                
                requests.insert( request, {safe:true}, errorHandler );

            });
        });
    }
    
    next();
});

 app.get( "/words/:id", function(req, res ){
    
 } )

  app.post("/user/add", function(req, res) {
	/* some server side logic */
	res.send("OK");
  });

app.get('/sessions/connect', function(req, res){
  consumer.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      res.send("Error getting OAuth request token : " + util.inspect(error), 500);
    } else {
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      res.redirect("https://twitter.com/oauth/authorize?oauth_token="+req.session.oauthRequestToken);
      console.log( 'get sessions connect' );
    }
  });
});

app.get('/sessions/callback', function(req, res){
  util.puts(">>"+req.session.oauthRequestToken);
  util.puts(">>"+req.session.oauthRequestTokenSecret);
  util.puts(">>"+req.query.oauth_verifier);
  consumer.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (error) {
      res.send("Error getting OAuth access token : " + util.inspect(error) + "["+oauthAccessToken+"]"+ "["+oauthAccessTokenSecret+"]"+ "["+util.inspect(results)+"]", 500);
    } else {
      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;    

      console.log( 'get sessions callback' );

      res.redirect( '/profilewords.html?oauth_token=' + oauthAccessToken );
    }
  });
});

app.get('/', function(req, res){
	res.sendfile( 'index.html' );
});

app.get('/profilewords.html', function(req, res){
    consumer.get("https://api.twitter.com/1.1/account/verify_credentials.json", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
      if (error) {

          console.log( 'error\n' );
          console.log( error );

          res.redirect('/sessions/connect');
          // res.send("Error getting twitter screen name : " + util.inspect(error), 500);
      } else {
          var parsedData = JSON.parse(data);
          
          require( 'mongodb' ).connect( path, function( err, database ) {

                    var person = ( { 'name':parsedData.screen_name, 'oauth_access_token': req.session.oauthAccessToken, 'oauth_access_token_secret': req.session.oauthAccessTokenSecret } );

                    var collection = database.collection( 'tokens' );
              
                    collection.remove( { 'name':parsedData.screen_name }, errorHandler );
              
                    collection.insert( person, {safe:true}, errorHandler );
              
                     collection.find( {}, {limit:10, sort:[['_id', 'desc']]}, function(err, cursor) {

                      cursor.toArray(function(err, items) {

                        console.log( 'There are ' + items.length + ' records in the database ... \n\n' );

                        var count = 1;

                        items.forEach( function(item){
                            console.log( '[ Record: ' + item.oauth_access_token + '\n');
                            count++;
                        });
                      });
                    });

                });

          res.sendfile('profilewords.html');
      }
    });
});

var errorHandler = function(err){
	if (err){ console.log(err); }
};

var __dirname = '.';

 /* serves all the static files */
app.get(/^(.+)$/, function(req, res){
//     console.log('static file request : ' + req.params);
     res.sendfile( __dirname + req.params[0]);
});

 app.listen(port, function() {
   console.log("Listening on " + port);
 });

app.use(session({ secret: 'keyboard cat', key: 'sid', cookie: { secure: true }}));