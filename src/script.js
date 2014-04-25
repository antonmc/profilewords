/* ============ MAIN SCRIPT ============== */

    var container = document.getElementById('wordle-container');
    var wordle = new WORDLEJS.Wordle(container);

    var wordsLimit = 20;
    
    var surplus = 'with, own, no, at, on, our, not, from, the, it is, we all, an, by, to, you, me, he, she, they, we, how, it, are, to, for, of, and, in, as, am, their, also, that, my, co, http, com, is, so, de, por, un, una, el, es, or, la, mi, les, di, des, que, en, ser, soy, all, follow, las, lo, il, des, don, del, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o ,p, q, r, s, t, u, v, w, x, y, z';
 
    var cleanResponse = function( text, common ) {
        var wordArr = text.match(/\w+/g),
            commonObj = {},
            uncommonArr = [],
            word, i;

        var newString = '';
        
        common = common.split(',');
        for ( i = 0; i < common.length; i++ ) {
            commonObj[ common[i].trim() ] = true;
        }

        for ( i = 0; i < wordArr.length; i++ ) {
            word = wordArr[i].trim().toLowerCase();
            if ( !commonObj[word] ) {                
                newString = newString + ' ' + word;
            }
        }
        
        newString = newString.replace( /[0-9]/g, '' );

        return newString;
    }
    
    var getParameter = function() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,    
        function(m,key,value) {
          vars[key] = value;
        });
        return vars;
    }
    
    var renderWordle = function () {
        
        var idField = document.getElementById( 'twitterIDfield' );
        
        console.log( 'render wordle: ' + idField.value );
        
        if( idField.value ){
        
            var path = '/words/' + idField.value ;
            
            var oauth_token = getParameter()['oauth_token'];
            
            var parameters;
            
            if( oauth_token ){                
                console.log( 'read oauth token: ' + oauth_token );
                parameters = 'oauth_token=' + oauth_token;
                
            }
            
            var xhr = new XMLHttpRequest();
               
                xhr.open("GET", path, true);
                xhr.onload = function (e) {
                  if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                      console.log(xhr.responseText);

                        var res = JSON.parse( xhr.responseText );

                        var response = cleanResponse( res.profiles, surplus );

                        var sortResult = TextUtil.countWordOccurance( response );
                        
                        console.log( sortResult );

                        wordle.reset();
                        wordle.setWords(sortResult, 60);
                        console.log('wordle sortType: ' + wordle.sortType);

                        wordle.doLayout();      

                    } else {
                      console.error(xhr.statusText);
                    }
                  }
                };
            
                xhr.setRequestHeader( "oauth_token", oauth_token );
            
                xhr.onerror = function (e) {
                  console.error(xhr.statusText);
                };
                xhr.send( parameters );
        }
    };


