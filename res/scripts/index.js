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
		//urlcomponents = urlcomponents.split('#');
		//for (i in urlcomponents) {
		//	if (i.length < 5)
		//		return url;
		//}
	}
	return url;
}

function playNow() {
	window.location = 'game.html?o=i&h=6EsqA&d='+getDiff();
}

function getDiff() {
	return $('input[name=difficulty]:checked', '#mainForm').val();
}