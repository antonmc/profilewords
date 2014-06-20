/* global document process require console */
/* jslint browser:true */

var mongo;

var MongoClient = require('mongodb').MongoClient;

var _callBackPage = "http://127.0.0.1:3000/sessions/callback";

var __dirname = '.';

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

MongoClient.connect( path, function(err, followersDatabase) {
    
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
    var logic = require( './logic' );
    
    
    if(err) throw err;
    
    var app = express();
    var server = http.createServer(app);

    app.listen(port, function() {
        console.log("Listening on " + port);
    });

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

    var retrieveProfiles = function( config, res, id, cloudType ) {

        /* To begin with this function will retrieve the first 5000
           followers as defined by Twitter's API */

        this.twit = new twit(config);

        var twitterObject = this.twit;

        var followerSets = [];

        var set = [];

        console.log( 'id: ' + id );
        
        var query = 'followers/ids';
        
        switch( cloudType ){
         
            case 'following':
                query = 'friends/ids';
                break;
            
            case 'favorites':
                query = 'favorites/list';
                break;
                
            case 'tweets':
                query = 'statuses/user_timeline';
                break;
            
            default:
                query = 'followers/ids';
                break;
        }
        
        

        this.twit.get(query, { screen_name: id },  function( err, reply, response ){
            
            console.log( ' -------------- anton --------------- \n\n\n' );
            
            var REQUESTS_REMAINING = response.headers['x-rate-limit-remaining'];
            
            console.log( 'REQUESTS REMAINING: ' + REQUESTS_REMAINING );
            
            console.log( ' -------------- end --------------- \n\n\n' );

            var MAX_SAMPLE_SIZE = 1000;

            followerSets = [];

            var count = 0;

            var totalCount = 0;

            var idList = "";

            var sampleSize;

            if( reply ){
                
                if( query === 'favorites/list' || query === 'statuses/user_timeline' ){
                    
                    console.log( 'favorites or tweets ... \n' );
                    
                    var tweetText = '';

                    
                    reply.forEach( function( element ){
                        tweetText = tweetText + element.text;                        
                    });
                    
                    var words = logic.process( tweetText );                                
                    res.end( JSON.stringify({ outcome: 'success', profiles: words, budget: REQUESTS_REMAINING })); 
                    
                    
//                    console.log( reply );
                }
                

                if( query === 'followers/ids' || query === 'friends/ids' ){
                
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

                        twitterObject.get( 'users/lookup', { user_id: csv }, function( usererr, userReply, response ){

                            if( userReply ){
                                userReply.forEach( function( profile ){

                                    descriptions = descriptions + ' ' + profile.description;
                                    count++;

                                    if( count === expectedReplies ){

                                        var words = logic.process( descriptions );                                
                                        res.end( JSON.stringify({ outcome: 'success', profiles: words, budget: REQUESTS_REMAINING }));  
                                    }

                                });  
                            }
                        })
                    })
                }
            }

            if( err ){
                console.log( 'retrieval error' );
                console.log( err );
                res.end( JSON.stringify({ outcome: 'failure', profiles: [], budget: REQUESTS_REMAINING }) );  
            }
        })
    }

    app.param('id', function(req, res, next, id){    

        res.setHeader( 'Content-Type', 'application/json' );

        if( req.headers['oauth_token'] ){

            var token = req.headers['oauth_token'];
            var cloudType = req.headers['cloudtype'];
            
            console.log( 'CLOUD TYPE: ' + cloudType );

            var collection = followersDatabase.collection( 'tokens' );

            collection.findOne( { 'oauth_access_token': token }, function( err, item ) {                 

                var config = {
                    consumer_key:         'LCbB9rX8gmHmOwfQT0GKMXERc',
                    consumer_secret:      'O1Bva58C18GcJ4i0kHJbKbJxO6aV6wJX4aedb1GW4YCU8QHAdR',
                    access_token_secret: item.oauth_access_token_secret,
                    access_token: item.oauth_access_token
                }

                console.log( 'account: ' + item.name );

                retrieveProfiles( config, res, id, cloudType );   

                var requests = followersDatabase.collection( 'requests' );

                var date = new Date();

                var request = ( { 'twitterId':id, 'timeStamp': date, 'account': item.name } );

                console.log( request );

                requests.insert( request, {safe:true}, errorHandler );

            });
        }

        next();
    });

    app.get( "/words/:id", function(req, res ){ } );

    app.post("/user/add", function(req, res) {
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

      consumer.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
        
        if( error ){
            
            /* TODO: CREATE AN ERROR PAGE HERE, REQUESTING THEY TRY AGAIN */    
            
          res.send("Error getting OAuth access token : " + util.inspect(error) + "["+oauthAccessToken+"]"+ "["+oauthAccessTokenSecret+"]"+ "["+util.inspect(results)+"]", 500); 
            
//            res.redirect( 'index.html' );
            
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

        var twitterVerification = "https://api.twitter.com/1.1/account/verify_credentials.json";
        var token = req.session.oauthAccessToken;
        var secret = req.session.oauthAccessTokenSecret;

        consumer.get( twitterVerification, token, secret, function (error, data, response) {
            if( error ){
                console.log( 'Twitter verification error\n' );
                console.log( error );
                res.redirect('/sessions/connect');

            } else {

                var parsedData = JSON.parse(data);
                            
                var person = ( {'name':parsedData.screen_name, 
                                'oauth_access_token': req.session.oauthAccessToken, 
                                'oauth_access_token_secret': req.session.oauthAccessTokenSecret } );

                var collection = followersDatabase.collection( 'tokens' );

                collection.remove( { 'name':parsedData.screen_name }, errorHandler );

                collection.insert( person, {safe:true}, errorHandler );

                res.sendfile('profilewords.html');
            }
        });
    });

    var errorHandler = function(err){
        if (err){ console.log(err); }
    };

    /* serves all the static files */
    
    app.get(/^(.+)$/, function(req, res){
         res.sendfile( __dirname + req.params[0]);
    });

    app.use(session({ secret: 'keyboard cat', key: 'sid', cookie: { secure: true }}));

});