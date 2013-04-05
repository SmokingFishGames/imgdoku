var imgurClientID = '60512304ac2e7ce';
var sharedAlbumID;

$(document).ready(function() {
	if (typeof($.cookie('diff') != 'undefined')) {
	$('input[name=difficulty]:eq(' + (Number($.cookie('diff'))-1) + ')', '#mainForm').attr('checked', 'checked');
}
	sharedAlbumID = getUrlVars()['h'];
	$.ajax({
		url: 'https://api.imgur.com/3/album/' + sharedAlbumID + '/images',
		type: 'GET',
		beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Client-ID '+imgurClientID);},
		success: function(data) {
			if (data.data.length >= 9) {
				for (var i = 0; i < 9; i++) {
					var imgID = data.data[i].id;
					imgID += 't';
					imgID = 'http://i.imgur.com/' + imgID + '.jpg';
					$('#albumHolder').append('<div class="albumThumbHolder"><a href="' + data.data[i].link + '"><img class="imguralbumthumb" title="' + data.data[i].id + '" src="' + imgID + '" /></a></div>');
				}
			} else {
				$('#insufficientImagesError').modal();
			}
			$('#albumLink').html('<a href="http://imgur.com/a/' + sharedAlbumID + '" target="_blank">View album on Imgur</a>');
		},
		error: function(data) {
			$('#imgurMalformedError').modal();
		}
	});
});

function getDiff() {
	$.cookie('diff',  $('input[name=difficulty]:checked', '#mainForm').val(), {expires: 999, path: '/'});
	console.log('hereDiff');
	return $('input[name=difficulty]:checked', '#mainForm').val();
}

function playShared() {
	console.log('here');
	window.location = '/game.html?o=i&h=' + sharedAlbumID + '&d='+getDiff();
}

function cancel() {
	console.log('here');
	window.location = '/';
}