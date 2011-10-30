var request = function (options, callback) {
  options.success = function (obj) {
    callback(null, obj);
  }
  options.error = function (err) {
    if (err) callback(err);
    else callback(true);
  }
  if (options.data && typeof options.data == 'object') {
    options.data = JSON.stringify(options.data)
  }
  if (!options.dataType) options.processData = false;
  if (!options.dataType) options.contentType = 'application/json';
  if (!options.dataType) options.dataType = 'json';
  $.ajax(options)
}

$.expr[":"].exactly = function(obj, index, meta, stack){ 
  return ($(obj).text() == meta[3])
}

var param = function( a ) {
  // Query param builder from jQuery, had to copy out to remove conversion of spaces to +
  // This is important when converting datastructures to querystrings to send to CouchDB.
	var s = [];
	if ( jQuery.isArray(a) || a.jquery ) {
		jQuery.each( a, function() { add( this.name, this.value ); });		
	} else { 
	  for ( var prefix in a ) { buildParams( prefix, a[prefix] ); }
	}
  return s.join("&");
	function buildParams( prefix, obj ) {
		if ( jQuery.isArray(obj) ) {
			jQuery.each( obj, function( i, v ) {
				if (  /\[\]$/.test( prefix ) ) { add( prefix, v );
				} else { buildParams( prefix + "[" + ( typeof v === "object" || jQuery.isArray(v) ? i : "") +"]", v )}
			});				
		} else if (  obj != null && typeof obj === "object" ) {
			jQuery.each( obj, function( k, v ) { buildParams( prefix + "[" + k + "]", v ); });				
		} else { add( prefix, obj ); }
	}
	function add( key, value ) {
		value = jQuery.isFunction(value) ? value() : value;
		s[ s.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
	}
}
function formatTwitString(str)
{
  str=' '+str;
  str = str.replace(/((ftp|https?):\/\/([-\w\.]+)+(:\d+)?(\/([\w/_\.]*(\?\S+)?)?)?)/gm,'<a href="$1" target="_blank">$1</a>');
  str = str.replace(/([^\w])\@([\w\-]+)/gm,'$1@<a href="http://twitter.com/$2" target="_blank">$2</a>');
  str = str.replace(/([^\w])\#([\w\-]+)/gm,'$1<a href="http://twitter.com/search?q=%23$2" target="_blank">#$2</a>');
  str = str.replace(/(\bshitty\b)/gi, '<span class="hl">$1</span>');
  return str;
}

function relativeTime(pastTime)
{ 
  var origStamp = Date.parse(pastTime);
  var curDate = new Date();
  var currentStamp = curDate.getTime();
  
  var difference = parseInt((currentStamp - origStamp)/1000);

  if(difference < 0) return false;

  if(difference <= 5)       return "Proprio ora";
  if(difference <= 20)      return "Secondi fa";
  if(difference <= 60)      return "Un minuto fa";
  if(difference < 3600)     return parseInt(difference/60)+" minuti fa";
  if(difference <= 1.5*3600)    return "Un'ora fa";
  if(difference < 23.5*3600)    return Math.round(difference/3600)+" ore fa";
  if(difference < 1.5*24*3600)  return "Un giorno fa";
  
  var dateArr = pastTime.split(' ');
  return dateArr[4].replace(/\:\d+$/,'')+' '+dateArr[2]+' '+dateArr[1]+(dateArr[3]!=curDate.getFullYear()?' '+dateArr[3]:'');
}

var search_query = encodeURIComponent("#romajs|roma.js");
function addTweet() {
    var str = ' <div class="tweet">\
            <div class="avatar"><a href="http://twitter.com/'+this.from_user+'" target="_blank"><img src="'+this.profile_image_url+'" alt="'+this.from_user+'" /></a></div>\
            <div class="content"><p class="txt">'+formatTwitString(this.text)+'</p>\
            <p class="meta">'+relativeTime(this.created_at)+' <a href="http://twitter.com/timeline/home?status=%40'+this.from_user+'%20" target="_blank">reply</a></p><div>\
          </div>';
    
  $("#tweets").append(str);

}

function makeUpper(text, indexes) {
  var html = [];
  for(var i=0; i<text.length; i++) {
    var letter = text.charAt(i);
    if($.inArray(i, indexes) != -1) {
      letter = "<span style='text-transform: uppercase;'>"+letter+"</span>";
    }
    html.push(letter);
  }
  return html.join("");
}

var app = {};
app.index = function () {
  /*
  $.getJSON("http://search.twitter.com/search.json?q="+search_query+"&callback=?&rpp=33", function(data) {
    $.each(data.results, function(){
      addTweet.call(this);
    });
  });
  */
  /*
  var $sub = $("p.sub"),
      text = $sub.text(),
      $text = makeUpper(text, [0, 4]);
  $sub.html($text);
  */
  
    $.getJSON("https://github.com/api/v2/json/commits/list/lmatteis/romajs/master/README.md?callback=?", function(data) {
        var latest_commit = data.commits[0],
            latest_commit_id = latest_commit.id;
        // now  get the README.md blob
        $.getJSON("https://github.com/api/v2/json/blob/show/lmatteis/romajs/"+latest_commit_id+"/README.md?callback=?", function(data) {
            // convert markdown to html
            var md = data.blob.data;
            var converter = new Showdown.converter();
            var html = converter.makeHtml(md);

            $('article#md').html(html);
        });
    });
};

$(function () { 
  app.s = $.sammy(function () {
    // Index of all databases
    this.get('', app.index);
    this.get("#/", app.index);
  })
  app.s.run();
});
