var fbalbums;
var selectedFB = {empty:true};
var selectedUpHist = {empty:true};

function submitImgurURL(isConf) {
	var val = $('#imgurinput').val();
	val = parseImgurURL(val);
	if (val=='' || val.length != 5) {
		//var r = confirm('This appears to be a malformed Imgur hash or URL.  Are you sure you want to try to load it?');
		if (isConf) {
			window.location = 'game.html?o=i&h='+val+'&d='+getDiff();
		} else {
			$('#imgurMalformedError').modal({
				overlayClose: true
			});
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
		$('#fbUnselectedError').modal({
			overlayClose: true
		});
		//alert('You haven\'t selected a Facebook album yet.  Please select one, then try again.');
	} else {
		window.location = 'game.html?o=fb&h=' + selectedFB.albumID + '&d='+getDiff();
	}
}

function playNow() {
	$.get('/res/misc/playNowHash.txt', function(pnHash) {
		window.location = 'game.html?o=i&h=' + pnHash + '&d='+getDiff()+'&pn=1';
	}).error(function() {
		window.location = 'game.html?o=i&h=6EsqA&d='+getDiff()+'&pn=1';
	});
}

function getDiff() {
	$.cookie('diff',  $('input[name=difficulty]:checked', '#mainForm').val());
	return $('input[name=difficulty]:checked', '#mainForm').val();
}

$(document).ready(function() {
	if (typeof($.cookie('diff') != 'undefined')) {
		$('input[name=difficulty]:eq(' + (Number($.cookie('diff'))-1) + ')', '#mainForm').attr('checked', 'checked');
	}
});

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
						$('#fbalbums').append('<img id="' + response.data[i].cover_photo + '" class="albumthumb" onclick="selectFBImg(\'' + String(response.data[i].id) + '\',\'' + String(response.data[i].cover_photo) + '\');" title="' + response.data[i].name + '" />');
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

//UPLOAD CODE
function openModal() {
	$('#uploadHolder').modal({
		overlayClose: true,
		onClose: function() {
			closeModal();
		},
		onShow: function() {
			$('#simplemodal-container').css('height', 'auto');
			$('#simplemodal-container').css('width', 'auto');
		},
		autoResize: true
	});
	document.getElementById('infile').addEventListener('change', inputLocal, false);
	$.ajax({
		url: 'https://api.imgur.com/3/album/',
		type: 'POST',
		//data: 'ids[]=' + imgurIDs[0],
		beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Client-ID '+imgurClientID);},
		success: function(data) {
			console.log(data);
			upDeleteHash = data.data.deletehash;
			upHash = data.data.id;
			$('#albumLink').html('<a href="http://imgur.com/a/' + upHash + '" target="_blank">Any images will be publicly available at this address.</a>');
		},
		error: function(data) { console.log(data); }
	});
}
function closeModal() {
	$.modal.close();
	deleteAlbum();
	uploadedImgs = [];
	currUploading = 0;
	upDeleteHash;
	upHash;
	$('#infile').prop('disabled', false);
	$('#inurl').prop('disabled', false);
	$('#inurlButton').prop('disabled', false);
	$('#submitUpload').prop('disabled', true);
}
var imgurClientID = '60512304ac2e7ce';
var uploadedImgs = [];
var currUploading = 0;
var upDeleteHash;
var upHash;
var upHist = [];
function imgurImg(ID, link, deletehash) {
	this.ID = ID;
	this.link = link;
	this.deletehash = deletehash;
}
function uploadImgur(string) {
	if (uploadedImgs.length + currUploading < 9) {
		currUploading++;
		$('#upProgress').css('display', 'inline');
		$.ajax({
			url: 'https://api.imgur.com/3/image/',
			type: 'POST',
			data: {image:string, album:upDeleteHash},
			beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Client-ID '+imgurClientID);},
			success: function(data) {
				var newImgur = new imgurImg(data.data.id, data.data.link, data.data.deletehash);
				uploadedImgs.push(newImgur);
				currUploading--;
				drawImages();
				if (uploadedImgs.length == 9) {
					$('#infile').prop('disabled', true);
					$('#inurl').prop('disabled', true);
					$('#inurlButton').prop('disabled', true);
					$('#submitUpload').prop('disabled', false);
				}
				if (currUploading == 0) {
					$('#upProgress').css('display', 'none');
				}
			},
			error: function(data) {
				currUploading--;
				if (currUploading == 0) {
					$('#upProgress').css('display', 'none');
				}
				console.log(data);
			}
		});
	}
}
function submitImages() {
	var imgurIDs = [];
	for (i = 0; i < 9; i++) {
		imgurIDs[i] = uploadedImgs[i].ID;
	}
	
}
function drawImages() {
	$('#imgDisp').html('');
	var stringToDisp = '';
	stringToDisp += '<table class="imgDispTable">';
	for (i in uploadedImgs) {
		if (i %3 == 0)
			stringToDisp += '<tr>';
		stringToDisp += '<td class="thumbHolder"><img class="thumb" src="' + uploadedImgs[i].link + '" /><img src="/res/img/cancel1.png" class="deleteImg" onclick="deleteImg(\'' + uploadedImgs[i].ID + '\');" /></td>';
		if (i%2 == 2)
			stringToDisp += '</tr>';
	}
	stringToDisp += '</table>';
	$('#imgDisp').html(stringToDisp);
}
function deleteImg(hash) {
	for (i in uploadedImgs) {
		if (uploadedImgs[i].ID == hash) {
			$.ajax({
				url: 'https://api.imgur.com/3/image/' + uploadedImgs[i].deletehash,
				type: 'DELETE',
				beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Client-ID '+imgurClientID);},
				success: function(data) {
					console.log(data);
				},
				error: function(data) { console.log(data); }
			});
			uploadedImgs.splice(i, 1);
			$('#infile').prop('disabled', false);
			$('#inurl').prop('disabled', false);
			$('#inurlButton').prop('disabled', false);
			$('#submitUpload').prop('disabled', true);
			break;
		}
	}
	drawImages();
}
function deleteAlbum() {
	for (i in uploadedImgs) {
		$.ajax({
			url: 'https://api.imgur.com/3/image/' + uploadedImgs[i].deletehash,
			type: 'DELETE',
			beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Client-ID '+imgurClientID);},
			success: function(data) {
				console.log(data);
			},
			error: function(data) { console.log(data); }
		});
	}
	$.ajax({
		url: 'https://api.imgur.com/3/album/' + upDeleteHash,
		type: 'DELETE',
		beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Client-ID '+imgurClientID);},
		success: function(data) {
			console.log(data);
		},
		error: function(data) { console.log(data); }
	});
}
function inputLocal(evt) {
	//var reader = new FileReader();
	var files = evt.target.files;
	for (var i = 0, f; f = files[i]; i++) {
		if (!f.type.match('image.*')) {
			continue;
		}
		var r = new FileReader();
		r.onload = function (file) {
			var b64 = file.target.result;
			b64 = b64.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, "")
			uploadImgur(b64);
		}
		r.readAsDataURL(f);
	}
	$('#infile').val('');
}
function inputExternal() {
	var link = $('#inurl').val();
	uploadImgur(link);
	$('#inurl').val('');
}
function submitAlbum() {
	upHist.push(upHash);
	var jsonUpHist = JSON.stringify(upHist);
	$.cookie('userUpped', jsonUpHist);
	window.location = 'game.html?o=i&h=' + upHash + '&d='+getDiff();
}
function submitUpHist() {
	if (selectedUpHist.empty == true) {
		$('#imgurUnselectedError').modal({
			overlayClose: true
		});
		//alert('You haven\'t selected a Facebook album yet.  Please select one, then try again.');
	} else {
		window.location = 'game.html?o=i&h=' + selectedUpHist.ID + '&d='+getDiff();
	}
}

function selectUpHist(ID) {
	console.log(ID);
	if (selectedUpHist.empty == true) {
	} else {
		$('#'+selectedUpHist.ID).css('border','0px');
		$('#'+selectedUpHist.ID).css('margin','5px');
	}
	selectedUpHist.ID = ID;
	selectedUpHist.empty = false;
	$('#'+selectedUpHist.ID).css('border','5px solid #91FDFF');
	$('#'+selectedUpHist.ID).css('margin','0px');
}

function deleteUpHist(ID) {
	for (var i in upHist) {
		if (upHist[i] == ID) {
			upHist.splice(i, 1);
			$('#' + ID).css('display', 'none');
			var jsonUpHist = JSON.stringify(upHist);
			$.cookie('userUpped', jsonUpHist);
			break;
		}
	}
}

$(document).ready(function() {
	if (typeof($.cookie('userUpped')) != 'undefined') {
		var prevHist = $.cookie('userUpped');
		prevHist = $.parseJSON(prevHist);
		if (typeof(prevHist) == 'string') {
			upHist = [prevHist];
		} else {
			upHist = prevHist;
		}
		for (i in upHist) {
			$.ajax({
				url: 'https://api.imgur.com/3/album/' + upHist[i],
				type: 'GET',
				beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Client-ID '+imgurClientID);},
				success: function(data) {
					console.log(data);
					var imgID = data.data.cover;
					imgID += 't';
					imgID = 'http://i.imgur.com/' + imgID + '.jpg';
					$('#createdPalettes').append('<div class="albumThumbHolder" id="' + data.data.id + '"><img class="albumthumb" onclick="selectUpHist(\'' + data.data.id + '\');" title="' + data.data.id + '" src="' + imgID + '" /><img src="/res/img/cancel1.png" class="deleteImg" onclick="deleteUpHist(\'' + data.data.id + '\');"></div>');
				},
				error: function(data) { console.log(data); }
			});
		}
		if (upHist.length == 0) {
			$('#createdPalettes').text('You haven\'t made any image sets yet.');
		}
	} else {
		$('#createdPalettes').text('You haven\'t made any image sets yet.');
	}
});