/* ProfileWords (c) Anton McConville 2014 */

/* Definitions and globals */

var WARNING_REFRESH = 'Not so fast - nothing to refresh yet - submit a query first!';
var WARNING_RATE_LIMIT = 'You have reached your rate limit for this 15 minute window';
var WARNING_INVALID_ID = 'There was no data for that twitter id. Is it an actual id? Please try another';

var latestProfileData;
var latestRateData = 15;
var CLOUD_TYPE = 'following';

var getParameter = function() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,    
    function(m,key,value) {
      vars[key] = value;
    });
    return vars;
}
    
function renderWordle(){
        
    var idField = document.getElementById( 'twitterIDfield' );

    console.log( 'render wordle: ' + idField.value );

    if( idField.value ){

        var path = '/words/' + idField.value ;

        var oauth_token = getParameter()['oauth_token'];

        var parameters;

        if( oauth_token ){                
            console.log( 'read oauth token: ' + oauth_token );
            parameters = 'oauth_token=' + oauth_token + 'cloudType=' + CLOUD_TYPE;
        }

        var xhr = new XMLHttpRequest();

            xhr.open("GET", path, true);
            xhr.onload = function (e) {
              if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var res = JSON.parse( xhr.responseText );

                    if( res.outcome === 'success' ){

                        latestProfileData = res.profiles;

                        parseProfileData( latestProfileData );
                        drawScrollbar( res.budget );
                    }else{
                        showWarning( WARNING_INVALID_ID );
                        drawScrollbar( res.budget );
                    }

                } else {
                  console.error(xhr.statusText);
                }
              }
            };

            xhr.setRequestHeader( "oauth_token", oauth_token );
            xhr.setRequestHeader( "cloudtype", CLOUD_TYPE );

            xhr.onerror = function (e) {
                console.error(xhr.statusText);
                showWarning( WARNING_INVALID_ID );
            };
            xhr.send( parameters );
    }
}

function setCloudType(event){
    CLOUD_TYPE = event;
    renderWordle();
}


function refresh(){
    if( latestProfileData ){
        parseProfileData( latestProfileData );   
    }else{
        showWarning( WARNING_REFRESH );
    }
}


document.getElementById('canvas'),
ctx = canvas.getContext('2d');
                             
function drawScrollbar( remaining ) {
    
    var max = 15;
    
    var marker = max - remaining;
    
    var width = 200,
    height = 10,
    val = Math.min(Math.max(marker, 0), max),
    direction = 'horizontal';
  
  // Draw the background
  ctx.fillStyle = '#EEE';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(0, 0, width, height);

  // Draw the fill
  ctx.fillStyle = '#777';
  var fillVal = Math.min(Math.max(val / max, 0), 1);
  if (direction === 'vertical') {
    ctx.fillRect(0, 0, width, fillVal * height);
  } else {
    ctx.fillRect(0, 0, fillVal * width, height);
  }
}

drawScrollbar(15);


function showWarning( warning ){
    var warningText =   '<div class="alert alert-warning alert-dismissable">' +
                        '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' +
                        '<strong>Warning! </strong>' + warning + '</div>';  
    
    var warningArea = document.getElementById( 'warningArea' );
    
    warningArea.innerHTML = warningText;
}

var fill = d3.scale.category20b();

var w = 600, h = 600;

//var w = 1500, h = 421;


var words = [],
    max,
    scale = 1,
    complete = 0,
    keyword = "",
    tags,
    fontSize,
    maxLength = 30,
    fetcher,
    statusText = d3.select("#status");

var layout = d3.layout.cloud()
    .timeInterval(10)
    .size([w, h])
    .fontSize(function(d) { return fontSize(+d.value); })
    .text(function(d) { return d.key; })
    .on("word", progress)
    .on("end", draw);

var svg = d3.select("#wordle-container").append("svg").attr("width", w).attr("height", h);

var background = svg.append("g");
var visualisation = svg.append("g").attr("transform", "translate(" + [w >> 1, h >> 1] + ")");

d3.select("#download-svg").on("click", downloadSVG);
d3.select("#download-png").on("click", downloadPNG);

function parseProfileData( data ) {  
    tags = data;
    tags = tags.sort(function(a, b) { return b.value - a.value; });
    generate();
}

function generate() {
    layout.font('Varela').spiral('archimedean');
    //    layout.font('love-ya-like-a-sister, fantasy').spiral('archimedean');
    //    layout.font('amatic-sc, sans-serif').spiral('archimedean');

    fontSize = d3.scale['linear']().range([5, 75]);
    if (tags.length) fontSize.domain([+tags[tags.length - 1].value || 1, +tags[0].value]);
    complete = 0;
    statusText.style("display", null);
    words = [];
    layout.stop().words(tags.slice(0, max = 70 )).start();
}

function progress(d) {
    statusText.text(++complete + "/" + max);
}

function randomColor( scheme ){
    return scheme[ Math.floor( ( Math.random() * scheme.length ) ) ]
}

function customFill(d){    
    
    var Maddening_Caravan = [ '#FAD089', '#FF9C5B', '#F5634A', '#ED303C', '#3B8183' ];    
    var Kuler = [ 'FF530D', 'E82C0C', 'FF0000', 'E80C7A', 'FF0DFF' ];    
    var High_Rollers = [ '#FF534E', '#FFD7AC', '#BED194', '#499989', '#176785' ];
    var Primavera = [ '#5EBFAD', '#F1F2D8', '#F2A03D', '#F2541B', '#D94423' ];    
    var Winter_Snowfall = [ '#273F5A', '#C6DBF3', '#4B81A5', '#74A0BF', '#98C4DA' ];    
    var Earth = [ '#cbc4ba', '#d4806d', '#c2be98', '#e3cb92', '#695d4f' ];
    var Anton = [ '#C3DBCE', '#FF3300', '#170746', '#D7E7E7' ];
    var Adjustment = [ '#5C8C7E', '#47738c', '#8A9FB0', '#95AA99', '#2f4d57' ];
    var Lifeguard = [ '#b6c6c6 ', '#ec6c52', '#f2b26f', '#ABC5CB', '#93ADB6', '#7cb2c4' ];
    var Drop = [ 'ed7157' ]
        
    fillColor =  randomColor( Earth );
    
    return fillColor;
}

function draw(data, bounds) {
  statusText.style("display", "none");
  scale = bounds ? Math.min(
      w / Math.abs(bounds[1].x - w / 2),
      w / Math.abs(bounds[0].x - w / 2),
      h / Math.abs(bounds[1].y - h / 2),
      h / Math.abs(bounds[0].y - h / 2)) / 2 : 1;
  words = data;
  var text = visualisation.selectAll("text")
      .data(words, function(d) { return d.text.toLowerCase(); });
  text.transition()
      .duration(1000)
      .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
      .style("font-size", function(d) { return d.size + "px"; });
  text.enter().append("text")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
      .style("font-size", function(d) { return d.size + "px"; })
      .on("click", function(d) {
        load(d.text);
      })
      .style("opacity", 1e-6)
    .transition()
      .duration(1000)
      .style("opacity", 1);
  text.style("font-family", function(d) { return d.font; })
      .style("fill", customFill)
      .text(function(d) { return d.text; });
  var exitGroup = background.append("g")
      .attr("transform", visualisation.attr("transform"));
  var exitGroupNode = exitGroup.node();
  text.exit().each(function() {
    exitGroupNode.appendChild(this);
  });
  exitGroup.transition()
      .duration(1000)
      .style("opacity", 1e-6)
      .remove();
  visualisation.transition()
      .delay(1000)
      .duration(750)
      .attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")");
}

// Converts a given word cloud to image/png.
function downloadPNG() {
  var canvas = document.createElement("canvas"),
      c = canvas.getContext("2d");
  canvas.width = w;
  canvas.height = h;
  c.translate(w >> 1, h >> 1);
  c.scale(scale, scale);
  words.forEach(function(word, i) {
    c.save();
    c.translate(word.x, word.y);
    c.rotate(word.rotate * Math.PI / 180);
    c.textAlign = "center";
    c.fillStyle = fill(word.text.toLowerCase());
    c.font = word.size + "px " + word.font;
    c.fillText(word.text, 0, 0);
    c.restore();
  });
  d3.select(this).attr("href", canvas.toDataURL("image/png"));
}

function downloadSVG() {
  d3.select(this).attr("href", "data:image/svg+xml;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(
    svg.attr("version", "1.1")
       .attr("xmlns", "http://www.w3.org/2000/svg")
     .node().parentNode.innerHTML))));
}

function load(f) {

}

d3.select("#random-palette").on("click", function() {
  paletteJSON("http://www.colourlovers.com/api/palettes/random", {}, function(d) {
    fill.range(d[0].colors);
    visualisation.selectAll("text").style("fill", function(d) { return fill(d.text.toLowerCase()); });
  });
  d3.event.preventDefault();
});

(function() {
  var r = 40.5,
      px = 35,
      py = 20;

  var angles = d3.select("#angles").append("svg")
      .attr("width", 2 * (r + px))
      .attr("height", r + 1.5 * py)
    .append("g")
      .attr("transform", "translate(" + [r + px, r + py] +")");

  angles.append("path")
      .style("fill", "none")
      .attr("d", ["M", -r, 0, "A", r, r, 0, 0, 1, r, 0].join(" "));

  angles.append("line")
      .attr("x1", -r - 7)
      .attr("x2", r + 7);

  angles.append("line")
      .attr("y2", -r - 7);

  angles.selectAll("text")
      .data([-90, 0, 90])
    .enter().append("text")
      .attr("dy", function(d, i) { return i === 1 ? null : ".3em"; })
      .attr("text-anchor", function(d, i) { return ["end", "middle", "start"][i]; })
      .attr("transform", function(d) {
        d += 90;
        return "rotate(" + d + ")translate(" + -(r + 10) + ")rotate(" + -d + ")translate(2)";
      })
      .text(function(d) { return d + "°"; });

  var radians = Math.PI / 180,
      from,
      to,
      count,
      scale = d3.scale.linear(),
      arc = d3.svg.arc().innerRadius(0).outerRadius(r);

getAngles();

function getAngles() {
    count = 2;
    from = 0;
    to = 90;
    update();
}

function update() {
    scale.domain([0, count - 1]).range([from, to]);
    var step = (to - from) / count;

    var path = angles.selectAll("path.angle")
        .data([{startAngle: from * radians, endAngle: to * radians}]);
    path.enter().insert("path", "circle")
        .attr("class", "angle")
        .style("fill", "#fc0");
    path.attr("d", arc);

    var line = angles.selectAll("line.angle")
        .data(d3.range(count).map(scale));
    line.enter().append("line")
        .attr("class", "angle");
    line.exit().remove();
    line.attr("transform", function(d) { return "rotate(" + (90 + d) + ")"; })
        .attr("x2", function(d, i) { return !i || i === count - 1 ? -r - 5 : -r; });

    var drag = angles.selectAll("path.drag")
        .data([from, to]);
    drag.enter().append("path")
        .attr("class", "drag")
        .attr("d", "M-9.5,0L-3,3.5L-3,-3.5Z")
        .call(d3.behavior.drag()
          .on("drag", function(d, i) {
            d = (i ? to : from) + 90;
            var start = [-r * Math.cos(d * radians), -r * Math.sin(d * radians)],
                m = [d3.event.x, d3.event.y],
                delta = ~~(Math.atan2(cross(start, m), dot(start, m)) / radians);
            d = Math.max(-90, Math.min(90, d + delta - 90)); // remove this for 360°
            delta = to - from;
            if (i) {
              to = d;
              if (delta > 360) from += delta - 360;
              else if (delta < 0) from = to;
            } else {
              from = d;
              if (delta > 360) to += 360 - delta;
              else if (delta < 0) to = from;
            }
            update();
          })
          .on("dragend", generate));
    drag.attr("transform", function(d) { return "rotate(" + (d + 90) + ")translate(-" + r + ")"; });
    layout.rotate(function() {
      return scale(~~(Math.random() * count));
    });
  }

  function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
    
})();
