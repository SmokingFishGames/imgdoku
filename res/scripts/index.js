var fbalbums;
var selectedFB = {empty:true};

function submitImgurURL() {
	var val = $('#imgurinput').val();
	val = parseImgurURL(val);
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
	window.location = 'game.html?o=i&h=6EsqA&d='+getDiff()+'&pn=1';
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
			initFBAlbums();
		} else if (response.status === 'not_authorized') {
			$('#fbalbums').text('You need to log in.');
			console.log('not authorized');
		} else {
			$('#fbalbums').text('You need to log in.');
			console.log('not logged in');
		}
	});
};

function finishFBLogin() {
	FB.getLoginStatus(function(response) {
		if (response.status=="connected") {
			initFBAlbums();
		}
	});
}

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

function initFBAlbums() {
	$('#fbfriendmenu').append('<option value="me">' + 'Me' + '</option>');
	FB.api('/me/friends', function(friends) {
		for (i in friends.data) {
			FB.api('/' + friends.data[i].id + '/albums', function (friendsresp){
				if (friendsresp.data.length > 0) {
					var over9 = false;
					for (i in friendsresp.data) {
						if (friendsresp.data[i].count >= 9) {
							over9 = true;
							break;
						}
					}
					if (over9)
						$('#fbfriendmenu').append('<option value="' + friendsresp.data[0].from.id + '">' + friendsresp.data[0].from.name + '</option>');
				}
			});
		}
	});
	fetchFBAlbums('me');
	$('#fbfriendmenu').css('display', 'inline');
	$('#fbfriendselect').css('display', 'inline');
}

function selectFriend() {
	var id = $('#fbfriendmenu').val();
	fetchFBAlbums(id);
}

function fetchFBAlbums(id) {
	FB.api('/' + id + '/albums', function(response) {
		if (response.data.length == 0) {
			if (id == 'me') {
				$('#fbalbums').text('You don\'t have any albums available to this app.');
			} else {
				FB.api('/' + id, function(response) {
					$('#fbalbums').text(response.name + ' doesn\'t have any albums available to this app.');
				});
			}
		} else {
			$('#fbalbums').html('');
			for (i in response.data) {
				if (response.data[i].count >= 9) {
					//entries++;
					if (response.data[i].type != 'app') {
						$('#fbalbums').append('<img id="' + response.data[i].cover_photo + '" class="fbalbumimg" onclick="selectFBImg(\'' + String(response.data[i].id) + '\',\'' + String(response.data[i].cover_photo) + '\');" title="' + response.data[i].name + '" />');
						FB.api(response.data[i].cover_photo, function(response) {
							for (i in response.images) {
								if (response.images[i].height < 200 || response.images[i].width < 200) {
									$('#' + response.id).attr('src', response.images[i].source);
									break;
								}
							}
						});
					}
				}
			}
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