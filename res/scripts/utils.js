function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
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