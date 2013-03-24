var fbalbums;
var selectedFB = {empty:true};

function submitImgurURL() {
	var val = $('#imgurinput').val();
	val = parseImgurURL(val);
	console.log(val);
	if (val=='' || val.length != 5) {
		var r = confirm('This appears to be a malformed Imgur hash or URL.  Are you sure you want to try to load it?');
		if (r == true) {
			window.location = 'game.html?o=i&h='+val+'&d='+getDiff();
		}
	} else {
		window.location = 'game.html?o=i&h='+val+'&d='+getDiff();
	}
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

function submitFB() {
	if (selectedFB.empty == true) {
		alert('You haven\'t selected a Facebook album yet.  Please select one, then try again.');
	} else {
		window.location = 'game.html?o=fb&h=' + selectedFB.albumID + '&d='+getDiff();
	}
}

function playNow() {
	window.location = 'game.html?o=i&h=6EsqA&d='+getDiff();
}

function getDiff() {
	return $('input[name=difficulty]:checked', '#mainForm').val();
}

function getOrigin() {
	return $('input[name=origin]:checked', '#mainForm').val();
}

$(document).ready(function(d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) return;
	js = d.createElement(s); js.id = id;
	js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=154174584743698";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

window.fbAsyncInit = function() {
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			console.log('connected');
			fetchAlbums();
		} else if (response.status === 'not_authorized') {
			$('#fbalbums').text('You revoked permissions for this app.  Please re-enable permissions');
			console.log('not authorized');
		} else {
			$('#fbalbums').text('You aren\'t logged in to Facebook.');
			console.log('not logged in');
		}
	});
};

function submitCustom() {
	var origin = getOrigin();
	switch (origin) {
		case 'fb':
			submitFB();
			break;
		case 'i':
			submitImgurURL();
			break;
	}
}

function fetchAlbums() {
	FB.api('/me/albums', function(response) {
		if (response.data.length == 0) {
			$('#fbalbums').text('You don\'t have any albums on Facebook.');
		} else {
			$('#fbalbums').html('');
		}
		var entries = 0;
		for (i in response.data) {
			if (response.data[i].count >= 9) {
				entries++;
				$('#fbalbums').append('<img id="' + response.data[i].cover_photo + '" class="fbalbumimg" onclick="selectFBImg(' + response.data[i].id + ',' + response.data[i].cover_photo + ');" />');
				FB.api(response.data[i].cover_photo, function(response) {
					$('#' + response.id).attr('src', response.source);
				});
			}
		}
		if (entries == 0) {
			$('#fbalbums').text('No albums with enough images.');
		}
	});
}

function selectFBImg(albumID, coverID) {
	console.log(albumID, coverID);
	if (selectedFB.empty == true) {
	} else {
		$('#'+selectedFB.coverID).css('border','0px');
		$('#'+selectedFB.coverID).css('margin','5px');
	}
	selectedFB.albumID = albumID;
	selectedFB.coverID = coverID;
	selectedFB.empty = false;
	$('#'+selectedFB.coverID).css('border','5px solid #91FDFF');
	$('#'+selectedFB.coverID).css('margin','0px');
}