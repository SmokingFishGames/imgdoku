//function fbAlbum(id, name, cover, link) {
//	this.id = id;
//	this.name = name;
//	this.cover = cover;
//	this.link = link;
//	FB.api(this.cover, function(response) {
//		for (i in fbalbums) {
//			if (response.id == fbalbums[i].cover) {
//				fbalbums[i].coverLink = response.source;
//				$('body').append('<a href="' + fbalbums[i].link + '"><img src="' + fbalbums[i].coverLink + '" /></a>');
//			}
//		}
//	});
//}
//
//var fbalbums = [];
//
//
//window.fbAsyncInit = function() {
//	FB.init({
//		appId      : '154174584743698', // App ID
//		channelUrl : '/res/fb/channel.html', // Channel File
//		status     : true, // check login status
//		cookie     : true, // enable cookies to allow the server to access the session
//		xfbml      : true  // parse XFBML
//	});
//	
//	FB.getLoginStatus(function(response) {
//		if (response.status === 'connected') {
//			// connected
//			console.log(response);
//			console.log('connected');
//		} else if (response.status === 'not_authorized') {
//			// not_authorized
//			console.log('not authorized');
//			login();
//		} else {
//			// not_logged_in
//			console.log('not logged in');
//			login();
//		}
//	});
//	
//	// Additional init code here
//	
//};
//
//function login() {
//	FB.login(function(response) {
//		if (response.authResponse) {
//			// connected
//			console.log(response);
//			console.log('connected');
//		} else {
//			// cancelled
//			console.log('cancelled');
//		}
//	}, {scope: 'user_photos, friends_photos'});
//}
//
//
//
//// Load the SDK Asynchronously
//(function(d){
//	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
//	if (d.getElementById(id)) {return;}
//	js = d.createElement('script'); js.id = id; js.async = true;
//	js.src = "//connect.facebook.net/en_US/all.js";
//	ref.parentNode.insertBefore(js, ref);
//}(document));

//function fetchAlbums() {
//	FB.api('/me/albums', function(response) {
//		console.log(response);
//		for (i in response.data) {
//			if (response.data[i].count >= 9) {
//				fbalbums.push(new fbAlbum(response.data[i].id, response.data[i].name, response.data[i].cover_photo, response.data[i].link));
//			}
//		}
//		//console.log(response.metadata.connections.photos);
//		//FB.api(response.metadata.connections.photos, function(secResponse) {
//		//	console.log(secResponse.data);
//		//});
//	});
//}