/* global document process require console */
/* jslint browser:true */

var mongo;

var OAuth= require('oauth').OAuth;

var oa = new OAuth(
	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	"LCbB9rX8gmHmOwfQT0GKMXERc",
	"O1Bva58C18GcJ4i0kHJbKbJxO6aV6wJX4aedb1GW4YCU8QHAdR",
	"1.0",
	"http://followers.ng.bluemix.net",
	"HMAC-SHA1"
);

if (process.env.VCAP_SERVICES) {
  var env = JSON.parse(process.env.VCAP_SERVICES);
  mongo = env['mongodb-2.2'][0]['credentials'];
} else {
  mongo = { "hostname":"192.168.19.1",
   			"port":27017,
   			"username":"",
    		"password":"",
    		"name":"",
    		"db":"db",
    		"url":"mongodb://192.168.19.1:27017/db" };
}


var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');
var http = require('http');
var twit = require("twit");
var express = require("express");
var app = express();
var csv = [];

var config = {
    consumer_key:         'LCbB9rX8gmHmOwfQT0GKMXERc',
    consumer_secret:      'O1Bva58C18GcJ4i0kHJbKbJxO6aV6wJX4aedb1GW4YCU8QHAdR',
    access_token:         '15673818-M8Su6qPGBVUU3oFRGxTTn18GKtQFVmaz0HP44dlD0',
    access_token_secret:  'hLkRvhmUENi03lFGVSTTA39q4OqG97i1U29oFGcBHqlSd'
}

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

        followerSets = [];

  		var count = 0;

  		var idList = "";

        if( reply ){

            set = [];

            reply.ids.forEach( function( id ){

                if( count < 100 ){
                    set.push( id );
                }else{
                    count = 0;
                    followerSets.push( set );
                    set = [];
                    set.push( id );
                }

                count++;
            })

            followerSets.push( set );

            count = 0;

            var descriptions = '';

            followerSets.forEach( function( set ){

                var csv = makeCommaList( set );

                twitterObject.get( 'users/lookup', { user_id: csv }, function( usererr, userReply ){

                    if( userReply ){
                        userReply.forEach( function( profile ){
                            descriptions = descriptions + ' ' + profile.description;
                        });

                        res.end( JSON.stringify({ profiles: descriptions }));                        
                    }
                })
            })
        }
    })
}

 /* serves main page */
 app.get("/", function(req, res) {
    res.sendfile('index.html');
 });

app.param('id', function(req,res, next, id){    
    res.setHeader('Content-Type', 'application/json');
    retrieveProfiles( config, res, id );
    next();
});

 app.get( "/words/:id", function(req, res ){

 } )

  app.post("/user/add", function(req, res) {
	/* some server side logic */
	res.send("OK");
  });


app.get('/auth/twitter', function(req, res){
	oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
		if (error) {
			console.log(error);
			res.send("yeah no. didn't work.")
		}
		else {
            req.session = new Object();
            
			req.session.oauth = {};
			req.session.oauth.token = oauth_token;
			console.log('oauth.token: ' + req.session.oauth.token);
			req.session.oauth.token_secret = oauth_token_secret;
			console.log('oauth.token_secret: ' + req.session.oauth.token_secret);
			res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token)
	}
	});
});


app.get('/auth/twitter/callback', function(req, res, next){
	if (req.session.oauth) {
		req.session.oauth.verifier = req.query.oauth_verifier;
		var oauth = req.session.oauth;

		oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
		function(error, oauth_access_token, oauth_access_token_secret, results){
			if (error){
				console.log(error);
				res.send("yeah something broke.");
			} else {
				req.session.oauth.access_token = oauth_access_token;
				req.session.oauth,access_token_secret = oauth_access_token_secret;
				console.log(results);
				res.send("worked. nice one.");
			}
		}
		);
	} else
		next(new Error("you're not supposed to be here."))
});

var __dirname = '.';

 /* serves all the static files */
app.get(/^(.+)$/, function(req, res){
     console.log('static file request : ' + req.params);
     res.sendfile( __dirname + req.params[0]);
});

 app.listen(port, function() {
   console.log("Listening on " + port);
 });
