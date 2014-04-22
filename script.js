/* ============ MAIN SCRIPT ============== */

    var container = document.getElementById('wordle-container');
    var wordle = new WORDLEJS.Wordle(container);

    var wordsLimit = 20;
    
    var surplus = 'manager, toman, with, own, no, t, at, on, our, not, from, the, it is, we all, a, an, by, to, you, me, he, she, they, we, how, it, i, are, to, for, of, and, in, as, am, their, also, that, my, co, http, com, is, so, de, m, 1, 2, 3, 4, 5, 6, 7, 8, 9, el, es, or, s, la, mi, y, o, les, di, b, des, u, n, e, que, en, ser, soy, 10, 11, 12, 13, 14';
    
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
//                uncommonArr.push(word);
                
                newString = newString + ' ' + word;
            }
        }

        return newString;
    }
    
    var renderWordle = function () {
        
        var idField = document.getElementById( 'twitterIDfield' );
        
        console.log( 'render wordle: ' + idField.value );
        
        if( idField.value ){
        
            var path = '/words/' + idField.value ;
            
            var xhr = new XMLHttpRequest();
                xhr.open("GET", path, true);
                xhr.onload = function (e) {
                  if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                      console.log(xhr.responseText);

                        var res = JSON.parse( xhr.responseText );

                        var response = cleanResponse( res.profiles, surplus );

                        var sortResult = TextUtil.countWordOccurance( response );

                        wordle.reset();
                        wordle.setWords(sortResult, 60);
                        log('wordle sortType: ' + wordle.sortType);

                        wordle.doLayout();      

                    } else {
                      console.error(xhr.statusText);
                    }
                  }
                };
                xhr.onerror = function (e) {
                  console.error(xhr.statusText);
                };
                xhr.send(null);
        }
    };


