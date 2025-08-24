var sharedAlbumID;

$(document).ready(function() {
	//var fb_ref = getUrlVars()['fb_ref'];
	//if (typeof(fb_ref) != 'undefined') {
	//	window.location = "https://imagedoku.com/share.html?h=" + fb_ref;
	//} else {
		$('input[name=difficulty]:eq(' + (Number($.cookie('diff'))-1) + ')', '#mainForm').attr('checked', 'checked');
		sharedAlbumID = getUrlVars()['h'];
		if (typeof(sharedAlbumID) == 'undefined') {
			$('#shareLinkHolder').css('display', 'none');
			$('#albumHolder').text('No album hash provided.');
		} else {
			//<a data-pin-config="beside" href="//pinterest.com/pin/create/button/?url=http%3A%2F%2Fwww.flickr.com%2Fphotos%2Fkentbrew%2F6851755809%2F&media=http%3A%2F%2Ffarm8.staticflickr.com%2F7027%2F6851755809_df5b2051c9_z.jpg&description=Next%20stop%3A%20Pinterest" data-pin-do="buttonPin" ><img src="//assets.pinterest.com/images/pidgets/pin_it_button.png" /></a>
			$.ajax({
				url: 'https://api.imgur.com/3/album/' + sharedAlbumID,
				type: 'GET',
				dataType: 'json',
				cache: false,
				beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Client-ID '+imgurClientID);},
				success: function(data) {
					var url = encodeURI(reddit_url);
					var media = encodeURI('https://i.imgur.com/' + data.data.cover + '.jpg');
					$('#pinterestHolder').html('<a target="_blank" data-pin-config="beside" href="//pinterest.com/pin/create/button/?url=' + url + '&media=' + media + '&description=Imagedoku album recommendation: ' + data.data.id + '" data-pin-do="buttonPin" ><img src="//assets.pinterest.com/images/pidgets/pin_it_button.png" /></a>');
					if (data.data.images.length >= 9) {
						for (var i = 0; i < 9; i++) {
							var imgID = data.data.images[i].id;
							imgID += 't';
							imgID = 'https://i.imgur.com/' + imgID + '.jpg';
							$('#albumHolder').append('<div class="albumThumbHolder"><a href="' + data.data.images[i].link + '" target="_blank"><img class="imguralbumthumb" title="' + data.data.images[i].id + '" src="' + imgID + '" /></a></div>');
						}
						$('.imguralbumthumb').powerTip({
							followMouse: true,
							smartPlacement: true
						});
					} else {
						$('#shareLinkHolder').css('display', 'none');
						$('#albumHolder').text('Not enough images in album.');
					}
					$('#albumLink').html('<a href="https://imgur.com/a/' + sharedAlbumID + '" target="_blank">View album on Imgur</a>');
				},
				error: function(data) {
					$('#shareLinkHolder').css('display', 'none');
					$('#albumHolder').text('Malformed album hash.');
				}
			});
		}
	//}
	$('#twitterTweeter').attr('href', 'https://twitter.com/share?url=' + encodeURIComponent(reddit_url));
});

function getDiff() {
	$.cookie('diff',  $('input[name=difficulty]:checked', '#mainForm').val(), {expires: 999, path: '/'});
	return $('input[name=difficulty]:checked', '#mainForm').val();
}

function playShared() {
	window.location = '/game.html?o=i&h=' + sharedAlbumID + '&d='+getDiff();
}

function cancel() {
	window.location = '/';
}
