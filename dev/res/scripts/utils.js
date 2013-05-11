function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}

function parseImgurURL(url) {
	if (url.length == 5) {
	} else {
		var urlcomponents = url.split('a/');
		url = urlcomponents[urlcomponents.length-1];
		url = url.split('#')[0];
		url = url.split('/')[0];
	}
	return url;
}

function albumHistObj(o, h) {
	this.o = o;
	this.h = h;
}

$(document).ready(function() {
	console.log('checking browser...');
	console.log($.browser.name + ' ' + $.browser.versionNumber);
	//IE catchall due to XDR still proving troublesome.
	if ($.browser.name == 'msie' && $.browser.versionNumber < 10) {
		$.reject({
			reject: {
				safari: false, // Apple Safari
				chrome: false, // Google Chrome
				firefox: false, // Mozilla Firefox
				msie: true, // Microsoft Internet Explorer
				opera: false, // Opera
				konqueror: false, // Konqueror (Linux)
				unknown: false // Everything else
			},
			header: 'We do not currently support Internet Explorer <10',
			paragraph1: 'Due to Internet Explorer versions 9 and below not supporting many of the core technologies crucial to Imagedoku, it is unlikely you\'ll be able to play this game.',
			paragraph2: 'We strongly suggest you upgrade to a standards-compliant browser:',
			display: ['chrome', 'firefox', 'safari', 'msie'],
			browserInfo: {  
				msie: { // Specifies browser name and image name (browser_konqueror.gif)  
					text: 'Internet Explorer 10', // Text Link  
					url: 'http://windows.microsoft.com/en-US/internet-explorer/download-ie' // URL To link to  
				}
			},
			closeCookie: true
		});
	}
});

String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

//GLOBAL VARS
var imgurClientID = '60512304ac2e7ce';