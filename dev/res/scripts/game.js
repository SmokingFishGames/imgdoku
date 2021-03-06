var stage;
var numStage;
var imgLayer;
var backCellLayer;
var miniCellLayer;
var cellLayer;
var victory;
var imgToolLayer;
var cellToolLayer;

var images = [];
var loaded = 0;
var loadedPuzzle = false;

var victoryDancers = [];
var victoryDance;

var erase;
var zoomIn;
var zoomOut;

var diff;
var hash;
var origin;
var mess;
var playNow = false;

var solved = [];
var unsolved = [];

var board;

var checkpoints = [];

var selected = 1;

var drawImg = true;

var albumURL;

var mousedOver = {x:null, y:null};

var debug = false;

var playHist = [];

window.oncontextmenu = function() {
        return debug;
};

var popped = false;

window.onpopstate = function(e) {
	console.log(e);
	if (e.state !== null) {
		popped = true;
		loaded = 3;
		hash = e.state.h;
		origin = e.state.o;
		diff = e.state.d;
		$('#alerts').text('Loading...');
		if (origin == 'i')
			getImgurImages(hash);
		else if (origin == 'fb')
			getFBAlbumFromStatePop(hash);
	} else {
		nonPopState;
	}
}

function nonPopState() {
	if(typeof(specHash) !== 'undefined') {
		hash = specHash;
	} else if (typeof(getUrlVars()['h']) !== 'undefined') {
		hash = getUrlVars()['h'];
	} else {
		hash = '6EsqA';
	}
	if(typeof(specOrigin) !== 'undefined') {
		origin = specOrigin;
	} else if (typeof(getUrlVars()['o']) !== 'undefined') {
		origin = getUrlVars()['o'];
	} else {
		origin = 'i';
	}
	if(typeof(specDiff) !== 'undefined') {
		diff = specDiff;
	} else if (typeof(getUrlVars()['d']) !== 'undefined') {
		diff = getUrlVars()['d'];
	} else {
		diff = 2;
	}
	if (typeof(specMess) !== 'undefined') {
		mess = specMess;
	} else if (typeof(getUrlVars()['pn']) !== 'undefined') {
		if (getUrlVars()['pn'] == 1) {
			playNow = true;
			$.get('/_static/pn/pnm.txt', function(data) {
				$('#announceWrapperMess').append(data);
				$('#announceWrapper').css('padding-bottom', '20px');
				$('#announceWrapper').css('display', 'block');
			});
		}
		mess = -1;
	} else {
		mess = -1;
	}
	
	var stateObj = {h:hash, o:origin, d:diff};
	if (!playNow)
		history.replaceState(stateObj, "Play Imagedoku", "game.html?o=" + origin + "&h="+hash+"&d="+(diff));
	else
		history.replaceState(stateObj, "Play Imagedoku", "game.html?o=" + origin + "&h="+hash+"&d="+(diff)+"&pn=1");
	
	if (mess != -1) {
		$('#announceWrapperMess').append(mess);
		$('#announceWrapper').css('padding-bottom', '20px');
		$('#announceWrapper').css('display', 'block');
	}
	
	
	if (origin=='i') {
		getImgurImages(hash);
	} else if (origin == 'fb') {
		getFBAlbum(hash);
	}
}



$(document).keypress(function(e) {
	switch (Number(e.which)) {
		case 32:
			selectTool('.');
			break;
		case 48:
			selectTool('.');
			break;
		case 46:
			selectTool('.');
			break;
		case 49:
			selectTool(1);
			break;
		case 50:
			selectTool(2);
			break;
		case 51:
			selectTool(3);
			break;
		case 52:
			selectTool(4);
			break;
		case 53:
			selectTool(5);
			break;
		case 54:
			selectTool(6);
			break;
		case 55:
			selectTool(7);
			break;
		case 56:
			selectTool(8);
			break;
		case 57:
			selectTool(9);
			break;
		case 43:
			selectTool('+');
			break;
		case 61:
			selectTool('+');
			break;
		case 45:
			selectTool('-');
			break;
		case 95:
			selectTool('-');
			break;
	}
	drawToolbar();
});

function loadUtil() {
	loaded++;
	if (loaded == 12) {
		drawUnsolved();
		drawToolbar();
	}
}

$(document).ready(function() {
	if (!popped) {
		nonPopState();
	}
	stage = new Kinetic.Stage({
		container: 'gameStage',
		width: 751,
		height: 751
	});
	numStage = new Kinetic.Stage({
		container: 'numStage',
		width: 158,
		height:751
	});
	
	if (typeof(getUrlVars()['debug']) !== 'undefined') {
		if (getUrlVars()['debug'] == 1) {
			debug = true;
		}
	} else {
		debug = false;
	}
	
	erase = new Image();
	zoomIn = new Image();
	zoomOut = new Image();
	
	erase.src = '/res/img/erase.png';
	zoomIn.src = '/res/img/in.png';
	zoomOut.src = '/res/img/out.png';
	
	erase.onload = new loadUtil;
	zoomIn.onload = new loadUtil;
	zoomOut.onload = new loadUtil;
	
	imgLayer = new Kinetic.Layer();
	backCellLayer = new Kinetic.Layer();
	miniCellLayer = new Kinetic.Layer();
	cellLayer = new Kinetic.Layer();
	imgToolLayer = new Kinetic.Layer();
	cellToolLayer = new Kinetic.Layer();
	numStage.add(imgToolLayer);
	numStage.add(cellToolLayer);
	stage.add(imgLayer);
	stage.add(backCellLayer);
	stage.add(miniCellLayer);
	stage.add(cellLayer);
	
	var zoomMouse = function(e) {
		if (stage.getMousePosition()) {
			e.preventDefault();
			if (mousedOver.x != null && mousedOver.y != null) {
				if (e.wheelDeltaY > 0) {
					zoom(mousedOver.x,mousedOver.y, true);
				} else if (e.wheelDeltaY < 0) {
					zoom(mousedOver.x,mousedOver.y, false);
				}
			}
		}
	}
	
	document.addEventListener('mousewheel', zoomMouse, false);
	
	$.get('/res/py/puzzle.py', {d:diff}).done( function(data) {
		var puzzData = data.board;
		puzzData = puzzData.split('#');
		var puzzle = {};
		puzzle.Solved = puzzData[0];
		puzzle.Unsolved = puzzData[1];
		for (var i = 0; i < 9; i++) {
			solved[i] = [];
			unsolved[i] = [];
			for (var j = 0; j < 9; j++) {
				unsolved[i][j] = puzzle.Unsolved.charAt(0);
				solved[i][j] = puzzle.Solved.charAt(0);
				puzzle.Unsolved = puzzle.Unsolved.substr(1);
				puzzle.Solved = puzzle.Solved.substr(1);
				if (unsolved[i][j] == '_') {
					unsolved[i][j] = '.';
				}
			}
		}
		board = new Board();
		checkpoints.push(JSON.stringify(board));
		loadedPuzzle = true;
		if (loaded == 12) {
			drawUnsolved();
			drawToolbar();
		}
	});
});

function getImgurImages(hash) {
	$('#albumShare').css('display', 'inline');
	document.title = 'Imagedoku - ' + hash + ' (Imgur)';
	$.ajax({
		url: 'https://api.imgur.com/3/album/'+hash,
		type: 'GET',
		dataType: 'json',
		cache: false,
		beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Client-ID '+imgurClientID);},
		success: function(data) {
			albumURL = data.data.link;
			if (data.data.images.length >= 9) {
				$('#alerts').text('Loading...');
				for (var i = 0; i < 9; i++) {
					images.push(new Image());
					images[i].src = data.data.images[i].link;
					images[i].index = i;
					images[i].onload = function() {
						loaded++;
						$('#alerts').append('.');
						if (this.width > this.height) {
							this.divisor = this.width/75;
						} else {
							this.divisor = this.height/75;
						}
						if (loaded==12) {
							$('#alerts').text('Loaded!  Enjoy your game.');
							if (loadedPuzzle) {
								drawUnsolved();
								drawToolbar();
							}
						}
					}
				}
			} else {
				$('#insufficientImagesError').modal();
			}
		},
		error: function(data) {
			$('#imgurMalformedError').modal();
		}
	});
	addAlbumToHist(hash, 0);
}

function getFBAlbum(hash) {
	$('#albumShare').css('display', 'none');
	// Load the SDK Asynchronously
	(function(d){
		var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
		if (d.getElementById(id)) {return;}
		js = d.createElement('script'); js.id = id; js.async = true;
		js.src = "//connect.facebook.net/en_US/all.js";
		ref.parentNode.insertBefore(js, ref);
	}(document));
	
	window.fbAsyncInit = function() {
		FB.init({
			appId      : '154174584743698', // App ID
			channelUrl : '/res/misc/channel.html', // Channel File
			status     : true, // check login status
			cookie     : true, // enable cookies to allow the server to access the session
			xfbml      : true  // parse XFBML
		});
		
		FB.getLoginStatus(function(response) {
			if (response.status === 'connected') {
				// connected
				FB.api('/' + hash, function(newResp) {
					document.title = 'Imagedoku - ' + newResp.name + ' (Facebook)';
					albumURL = newResp.link;
				});
				FB.api('/' + hash + '/photos', function(newResp) {
					getFBImages(newResp);
				});
			} else if (response.status === 'not_authorized') {
				// not_authorized
				$('#fbUnauthorizedError').modal();
			} else {
				// not_logged_in
				$('#fbLoggedOutError').modal();
			}
		});
		
		// Additional init code here
		
	};
	addAlbumToHist(hash, 1);
}

function getFBAlbumFromStatePop(hash) {
	$('#albumShare').css('display', 'none');
	if (typeof(FB) === 'undefined') {
		getFBAlbum(hash);
	} else {
		FB.api('/' + hash, function(newResp) {
			document.title = 'Imagedoku - ' + newResp.name + ' (Facebook)';
			albumURL = newResp.link;
		});
		FB.api('/' + hash + '/photos', function(newResp) {
			getFBImages(newResp);
		});
	}
	addAlbumToHist(hash, 1);
}

function getFBImages(api) {
	if (api.data.length >= 9) {
		$('#alerts').text('Loading...');
		for (var i = 0; i < 9; i++) {
			images.push(new Image());
			images[i].src = api.data[i].source;
			images[i].index = i;
			images[i].onload = function() {
				loaded++;
				$('#alerts').append('.');
				if (this.width > this.height) {
					this.divisor = this.width/75;
				} else {
					this.divisor = this.height/75;
				} if (loaded==12) {
					$('#alerts').text('Loaded!  Enjoy your game.');
					if (loadedPuzzle) {
						drawUnsolved();
						drawToolbar();
					}
				}
			}
		}
	} else {
		$('#insufficientImagesError').modal();
	}
}

//Origin of hash -- 0 is Imgur, 1 is Facebook
function addAlbumToHist(hashToAdd, originOfHash) {
	if (typeof($.cookie('userPlayed')) != 'undefined') {
		var prevHist = $.cookie('userPlayed');
		prevHist = $.parseJSON(prevHist);
		playHist = prevHist;
	}
	var albumHist;
	switch (originOfHash) {
		case 0:
			albumHist = new albumHistObj('i', hashToAdd);
			break;
		case 1:
			albumHist = new albumHistObj('fb', hashToAdd);
			break;
	}
	for (i in playHist) {
		if (playHist[i].o == albumHist.o && playHist[i].h == albumHist.h) {
			playHist.splice(i,1);
			break;
		}
	}
	playHist.push(albumHist);
	var jsonUpHist = JSON.stringify(playHist);
	$.cookie('userPlayed', jsonUpHist, {expires: 999, path: '/'});
}

//function drawSolved() {
//	for (var i = 0; i < 9; i++) {
//		for (var j = 0; j < 9; j++) {
//			imageSrc = images[solved[i][j]-1];
//			var imageToAdd = new Kinetic.Image({
//				image:imageSrc,
//				height: imageSrc.height/imageSrc.divisor,
//				width: imageSrc.width/imageSrc.divisor,
//				x:(75*i)+(75-((imageSrc.width/imageSrc.divisor)/2)),
//				y:(75*j)+(75-((imageSrc.height/imageSrc.divisor)/2)),
//				draggable:true
//			});
//			imageToAdd.on('mouseover', function() {
//				stage.setDraggable(false);
//			});
//			imageToAdd.on('mouseout', function() {
//				stage.setDraggable(true);
//			});
//			imgLayer.add(imageToAdd);
//		}
//	}
//	stage.draw();
//	
//}

function drawUnsolved() {
	stage.clear();
	imgLayer.removeChildren();
	cellLayer.removeChildren();
	miniCellLayer.removeChildren();
	backCellLayer.removeChildren();
	for (var i = 0; i < 9; i++) {
		for (var j = 0; j < 9; j++) {
			if (board.tiles[i][j].val != '.' && board.tiles[i][j].val != '*') {
				imageSrc = images[board.tiles[i][j].val-1];
				var imageToAdd;
				if (drawImg) {
					imageToAdd = new Kinetic.Image({
						image:imageSrc,
						height: Math.floor(imageSrc.height/imageSrc.divisor),
						width: Math.floor(imageSrc.width/imageSrc.divisor),
						x: Math.floor((75*i)+10*(Math.floor(i/3)+1)+2*(i+1)+2*i+(75-((imageSrc.width/imageSrc.divisor)))/2),
						y: Math.floor((75*j)+10*(Math.floor(j/3)+1)+2*(j+1)+2*j+(75-((imageSrc.height/imageSrc.divisor)))/2)
					});
				} else if (!drawImg) {
					imageToAdd = new Kinetic.Text({
						x: Math.floor(75*i)+10*(Math.floor(i/3)+1)+2*(i+1)+2*i,
						y: Math.floor(75*j)+10*(Math.floor(j/3)+1)+2*(j+1)+2*j,
						fontFamily: 'Liberation',
						text: board.tiles[i][j].val,
						fontSize: 75,
						fill: 'black',
						height: 75,
						width: 75,
						align: 'center'
					});
				}
				imgLayer.add(imageToAdd);
			} else if (board.tiles[i][j].val == '*') {
				for (k in board.tiles[i][j].poss) {
					if (board.tiles[i][j].poss[k]) {
						imageSrc = images[k];
						var x, y;
						x = 75*i+10*(Math.floor(i/3)+1)+2*(i+1)+2*i;
						y = 75*j+10*(Math.floor(j/3)+1)+2*(j+1)+2*j;
						x += (k%3)*25;
						y += Math.floor((k/3))*25;
						var imageToAdd;
						if (drawImg) {
							//x += (Math.floor(((imageSrc.width/imageSrc.divisor))/3));
							//y += (Math.floor(((imageSrc.height/imageSrc.divisor))/3));
							var xoff = Math.floor((25-((imageSrc.width/imageSrc.divisor)/3))/2);
							var yoff = Math.floor((25-((imageSrc.height/imageSrc.divisor)/3))/2);
							x += xoff;
							y += yoff;
							x = Math.floor(x);
							y = Math.floor(y);
							imageToAdd = new Kinetic.Image({
								image:imageSrc,
								height: Math.floor((imageSrc.height/imageSrc.divisor)/3),
								width: Math.floor((imageSrc.width/imageSrc.divisor)/3),
								x: x,
								y: y
							});
						} else if (!drawImg) {
							var value = Number(k)+1;
							x = Math.floor(x);
							y = Math.floor(y);
							imageToAdd = new Kinetic.Text({
								fontFamily: 'Liberation',
								height: Math.floor(75/3),
								width: Math.floor(75/3),
								fontSize: 25,
								text: value,
								x: x,
								y: y,
								align: 'center',
								fill: 'black'
							});
						}
						imgLayer.add(imageToAdd);
					}
				}
				
			}
		}
	}
	drawTiles();
	stage.draw();
}

function drawTiles() {
	for (var i = 0; i < 3; i++) {
		for (var j = 0; j < 3; j++) {
			var newCell = new Kinetic.Rect({
				x: Math.floor(242*i)+5*(i+1),
				y: Math.floor(242*j)+5*(j+1),
				width: 247,
				height: 247,
				stroke: 'black',
				strokeWidth: 10
			});
			backCellLayer.add(newCell);
		}
	}
	for(var i = 0; i < 9; i++) {
		for(var j = 0; j < 9; j++) {
			if (board.tiles[i][j].val == '*') {
				for (var k = 0; k < 3; k++) {
					for (var l = 0; l < 3; l++) {
						var newCell = new Kinetic.Rect({
							X: Math.floor((75*i)+(k*25))+10*(Math.floor(i/3)+1)+2*(i+1)+2*i,
							y: Math.floor((75*j) + (l*25))+10*(Math.floor(j/3)+1)+2*(j+1)+2*j,
							width: 25,
							height:25,
							stroke:'black',
							strokeWidth:1
						});
						miniCellLayer.add(newCell);
					}
				}
			}
			var strokeColor, strokeWidth;
			if (board.tiles[i][j].conf == 3) {
				strokeColor = 'green';
				strokeWidth = 4;
			} else if (board.tiles[i][j].conf == 2) {
				strokeColor = 'yellow';
				strokeWidth = 4;
			} else if (board.tiles[i][j].conf == 1) {
				strokeColor = 'red';
				strokeWidth = 4;
			} else if (board.tiles[i][j].conf == 0) {
				strokeColor = 'black';
				strokeWidth = 4;
			}
			var newCell = new Kinetic.Rect({
				x: Math.floor(75*i)+10*(Math.floor(i/3)+1)+2*(i+1)+2*i,
				y: Math.floor(75*j)+10*(Math.floor(j/3)+1)+2*(j+1)+2*j,
				width: 75,
				height: 75,
				stroke: strokeColor,
				strokeWidth: 4
			});
			newCell.ix = i;
			newCell.iy = j;
			newCell.on('mouseover', function() {
				mousedOver = {x:this.ix, y:this.iy};
			});
			if (!board.tiles[i][j].perm) {
				newCell.on('mouseover', function() {
					this.setStroke('rgb(145, 253, 255)');
					this.setStrokeWidth(4);
					this.moveToTop();
					stage.draw();
				});
				if (board.tiles[i][j].conf == 3) {
					newCell.on('mouseout', function() {
						this.setStroke('green');
						this.setStrokeWidth(4);
						this.moveToBottom();
						stage.draw();
					});
				} else if (board.tiles[i][j].conf == 2) {
					newCell.on('mouseout', function() {
						this.setStroke('yellow');
						this.setStrokeWidth(4);
						this.moveToBottom();
						stage.draw();
					});
				} else if (board.tiles[i][j].conf == 1) {
					newCell.on('mouseout', function() {
						this.setStroke('red');
						this.setStrokeWidth(4);
						this.moveToBottom();
						stage.draw();
					});
				} else {
					newCell.on('mouseout', function() {
						this.setStroke('black');
						this.setStrokeWidth(4);
						this.moveToBottom();
						stage.draw();
					});
				}
			}
			newCell.on('click tap', function(e) {
				if(e.which == 1 && e.ctrlKey == false)
					selectTile(this.ix, this.iy, true);
				else if (e.which == 3 || (e.which == 1 && e.ctrlKey == true))
					selectTile(this.ix, this.iy, false);
			});
			cellLayer.add(newCell);
		}
	}
}

function drawToolbar() {
	imgToolLayer.removeChildren();
	cellToolLayer.removeChildren();
	for (var i = 0; i < 9; i++) {
		imageSrc = images[i];
		var x = 2;
		var y = i;
		y*=75;
		y+=4*i+2+20;
		var imageToAdd;
		if (drawImg) {
			imageToAdd = new Kinetic.Image({
				image:imageSrc,
				height: Math.floor(imageSrc.height/imageSrc.divisor),
				width: Math.floor(imageSrc.width/imageSrc.divisor),
				x: Math.floor(x+(75-((imageSrc.width/imageSrc.divisor)))/2),
				y: Math.floor(y+(75-((imageSrc.height/imageSrc.divisor)))/2)
			});
		} else if (!drawImg) {
			imageToAdd = new Kinetic.Text({
				x: x,
				y: y,
				fontFamily: 'Liberation',
				text: i+1,
				fontSize: 75,
				fill: 'black',
				height: 75,
				width: 75,
				align: 'center'
			});
		}
		imgToolLayer.add(imageToAdd);
	}
	for (var i = 0; i < 9; i++) {
		var stroke, strokeWidth;
		if (i+1 == selected) {
			stroke = 'rgb(145, 253, 255)';
			strokeWidth = 4;
		} else {
			stroke = 'black';
			strokeWidth = 4;
		}
		var newCell = new Kinetic.Rect({
			x: 2,
			y: Math.floor(i*75)+4*i+2+20,
			width: 75,
			height: 75,
			stroke: stroke,
			strokeWidth: strokeWidth
		});
		newCell.val = i+1;
		newCell.on('click', function() {
			selectTool(this.val);
			drawToolbar();
		});
		cellToolLayer.add(newCell);
	}
	
	var imageToAdd = new Kinetic.Image({
		image:erase,
		height:75,
		width:75,
		x:75 + 6,
		y:375 + 22+20
	});
	imgToolLayer.add(imageToAdd);
	
	var stroke, strokeWidth;
	if ('.' == selected) {
		stroke = 'rgb(145, 253, 255)';
		strokeWidth = 4;
	} else {
		stroke = 'black';
		strokeWidth = 4;
	}
	var newCell = new Kinetic.Rect({
		x: 75 + 6,
		y: 375 + 22+20,
		width: 75,
		height: 75,
		stroke: stroke,
		strokeWidth: strokeWidth
	});
	newCell.val = '.';
	newCell.on('click', function() {
		selectTool(this.val);
		drawToolbar();
	});
	cellToolLayer.add(newCell);
	numStage.draw();

	var imageToAdd = new Kinetic.Image({
		image:zoomIn,
		height:75,
		width:75,
		x:75 + 6,
		y:225 + 14+20
	});
	imgToolLayer.add(imageToAdd);
	
	var stroke, strokeWidth;
	if ('+' == selected) {
		stroke = 'rgb(145, 253, 255)';
		strokeWidth = 4;
	} else {
		stroke = 'black';
		strokeWidth = 4;
	}
	var newCell = new Kinetic.Rect({
		x: 75 + 6,
		y: 225 + 14+20,
		width: 75,
		height: 75,
		stroke: stroke,
		strokeWidth: strokeWidth
	});
	newCell.val = '+';
	newCell.on('click', function() {
		selectTool(this.val);
		drawToolbar();
	});
	cellToolLayer.add(newCell);
	numStage.draw();
	
	var imageToAdd = new Kinetic.Image({
		image:zoomOut,
		height:75,
		width:75,
		x:75 + 6,
		y:300 + 18+20
	});
	imgToolLayer.add(imageToAdd);
	
	var stroke, strokeWidth;
	if ('-' == selected) {
		stroke = 'rgb(145, 253, 255)';
		strokeWidth = 4;
	} else {
		stroke = 'black';
		strokeWidth = 4;
	}
	var newCell = new Kinetic.Rect({
		x: 75 + 6,
		y: 300 + 18+20,
		width: 75,
		height: 75,
		stroke: stroke,
		strokeWidth: strokeWidth
	});
	newCell.val = '-';
	newCell.on('click', function() {
		selectTool(this.val);
		drawToolbar();
	});
	cellToolLayer.add(newCell);
	numStage.draw();
}

function help(open) {
	if(open) {
		$('#help').modal({overlayClose:true});
	} else {
		$.modal.close();
	}
}

function Board() {
	this.tiles = [];
	this.solved = false;
	for (var i = 0; i < 9; i++) {
		this.tiles[i] = [];
		for (var j = 0; j < 9; j++) {			
			if (unsolved[i][j] != '.') {
				this.tiles[i][j] = new Tile(unsolved[i][j], solved[i][j], true);
			} else {
				this.tiles[i][j] = new Tile(unsolved[i][j], solved[i][j], false);
			}
		}
	}
	this.check = function() {
		var blank = 0;
		var errors = 0;
		for (var i = 0; i < 9; i++) {
			for (var j = 0; j < 9; j++) {
				if (this.tiles[i][j].val != this.tiles[i][j].sol && this.tiles[i][j].val != '.' && this.tiles[i][j].val != '*') {
					this.tiles[i][j].conf = 1;
					errors++;
				} else if (this.tiles[i][j].val == '.' || this.tiles[i][j].val == '*') {
					blank++;
				} else {
					if (!this.tiles[i][j].perm)
						this.tiles[i][j].conf = 3;
				}
			}
		}
		drawUnsolved();
		return {b:blank, e: errors};
	}
	this.solve = function() {
		for (var i = 0; i < 9; i++) {
			for (var j = 0; j < 9; j++) {
				if (!this.tiles[i][j].perm) {
					this.tiles[i][j].val = this.tiles[i][j].sol;
					this.tiles[i][j].conf = 3;
				}
			}
		}
		drawUnsolved();
		this.checkWin();
	}
	this.checkWin = function() {
		var blank = 0;
		var errors = 0;
		for (var i = 0; i < 9; i++) {
			for (var j = 0; j < 9; j++) {
				if (this.tiles[i][j].val != this.tiles[i][j].sol && this.tiles[i][j].val != '.' && this.tiles[i][j].val != '*') {
					errors++;
				} else if (this.tiles[i][j].val == '.' || this.tiles[i][j].val == '*') {
					blank++;
				}
			}
		}
		if(blank == 0 && errors == 0) {
			this.victoryDance(true);
		}
	}
	this.set = function(x,y,val, perm) {
		if (!this.solved) {
			this.tiles[x][y].set(val, perm);
			this.checkWin();
		}
	}
	this.victoryDance = function() {
		if (!this.dancing) {
			$('#alerts').html('We have a winner!<br /><button type="button" onclick="board.victoryDance();">Toggle victory dance</button>');
			this.solved = true;
			victory = new Kinetic.Layer();
			victory.setClearBeforeDraw(false);
			stage.add(victory);
			for (i in images) {
				var newImg = new Kinetic.Image({
					x: Math.floor(Math.random()*675),
					y: -75,
					height: Math.floor(images[i].height/images[i].divisor),
					width: Math.floor(images[i].width/images[i].divisor),
					image:images[i]
				});
				newImg.dx = Math.random()*10 - 5;
				newImg.dy = Math.random()*10 - 5;
				victoryDancers.push(newImg);
				victory.add(newImg);
			}
			victoryDance = window.setInterval(function() {
				for (i in victoryDancers) {
					victoryDancers[i].setX(victoryDancers[i].dx + victoryDancers[i].getX());
					victoryDancers[i].dy += .14;
					victoryDancers[i].setY(victoryDancers[i].dy + victoryDancers[i].getY());
					if (victoryDancers[i].getX() < -75) {
						victoryDancers[i].setX(stage.getWidth());
					}
					if (victoryDancers[i].getX() > stage.getWidth()) {
						victoryDancers[i].setX(-75);
					}
					if (victoryDancers[i].getY() > stage.getHeight()) {
						victoryDancers[i].setY(-75);
						victoryDancers[i].dy = Math.random()*10-5;
					}
				}
				victory.draw();
			}, 33);
			this.dancing = true;
		} else {
			window.clearInterval(victoryDance);
			victory.removeChildren();
			victory.clear();
			this.dancing = false;
		}
	}
	this.dancing=false;
	this.canZoom = true;
}

function Tile(val, sol, perm) {
	this.val = val;
	this.poss = [];
	this.sol = sol;
	this.perm = perm;
	this.conf = 0;
	
	//CONF (CONFIRMED) SETTINGS:
	//0 = not checked, aka blank -- BLACK
	//1 = wrong -- RED
	//2 = not sure -- YELLOW
	//3 = correct -- GREEN
	
	this.resetPoss = function() {
		for (var i = 0; i < 9; i++) {
			this.poss[i] = false;
		}
	}
	
	this.set = function(val, perm) {
		if (this.perm == false) {
			if (val == '.') {
				this.val = val;
				this.conf = 0;
				this.resetPoss();
			} else if (!perm) {
				if (this.poss[val-1]) {
					this.poss[val-1] = false;
					var cleared = true;
					for (i in this.poss) {
						if (this.poss[i]) {
							cleared = false;
							i = this.poss.length;
						}
					}
					if (cleared) {
						this.val = '.';
						this.conf = 0;
					}
				} else {
					this.poss[val-1] = true;
					this.val = '*';
					this.conf = 2;
				}
			} else {
				if (this.val == val) {
					this.resetPoss();
					this.val = '.';
					this.conf = 0;
				} else {
					this.val = val;
					this.conf = 2;
					this.resetPoss();
				}
			}
			drawUnsolved();
		}
	}
}

function selectTile(x, y, perm) {
	if (selected == '+') {
		zoom(x,y,true);
	} else if (selected == '-') {
		zoom(x,y,false);
	} else {
		board.set(x,y,selected, perm);
	}
}

function selectTool(val) {
	selected = val;
}

function zoom(x,y, isZoomIn) {
	if (board.canZoom) {
		var currScale = stage.getScale();
		if (isZoomIn) {
			if (currScale.x < 9) {
				stage.setScale(currScale.x*3);
			}
		} else if (!isZoomIn) {
			if (currScale.x > 1) {
				stage.setScale(currScale.x/3);
			}
		}
		currScale = stage.getScale();
		if (currScale.x > 1) {
			if (currScale.x == 3) {
				stage.setX(-Math.floor(x/3)*3*75*currScale.x-(Math.floor(x/3)*75));
				stage.setY(-Math.floor(y/3)*3*75*currScale.x-(Math.floor(y/3)*75));
				if (Math.floor(x/3) == 0) {
					stage.setX(stage.getX()-10);
				} else if (Math.floor(x/3) == 2) {
					stage.setX(stage.getX()+10);
				}
				if (Math.floor(y/3) == 0) {
					stage.setY(stage.getY()-10);
				} else if (Math.floor(y/3) == 2) {
					stage.setY(stage.getY()+10);
				}
			} else {
				//stage.setX(-x*75*currScale.x-(x*75)-(Math.floor(x/3)*10));
				//stage.setY(-y*75*currScale.x-(y*75)-(Math.floor(y/3)*10));
				stage.setX(((-79)*(x*9)-79)+(-10)*(Math.floor(x/3)*9)+10);
				stage.setY(((-79)*(y*9)-79)+(-10)*(Math.floor(y/3)*9)+10);
			}
		} else {
			stage.setX(0);
			stage.setY(0);
		}
		stage.draw();
	} else {
		console.log('Can\'t zoom due to board size.');
	}
}

function checkErrors() {
	var checkObj = board.check();
	var alertString = 'You have ' + checkObj.e + ' error';
	if (checkObj.e != 1) {
		alertString += 's';
	}
	alertString += ' and ' + checkObj.b + ' blank cell';
	if (checkObj.b != 1) {
		alertString += 's';
	}
	alertString += '.';
	$('#alerts').text(alertString);
}

function toggleDrawImg() {
	if (drawImg) {
		drawImg = false;
		$('#toggleDrawImg').text('Switch to Images');
	} else {
		drawImg = true;
		$('#toggleDrawImg').text('Switch to Numbers');
	}
	drawUnsolved();
	drawToolbar();
}

function hint() {
	
}

function solvePuzzle(conf) {
	if (conf) {
		$.modal.close();
		board.solve();
	} else {
		$('#solvePuzzleConfirmation').modal({
			overlayClose: true
		});
	}
}

function viewAlbum() {
	var win=window.open(albumURL, '_blank');
	win.focus();
}

function shareAlbum() {
	var shareURL = '/share.html?h=' + hash;
	var win = window.open(shareURL, '_blank');
	win.focus();
}

function openCheckpoints() {
	$('#checkpoints').html('');
	for (i in checkpoints) {
		var newBoard = JSON.parse(checkpoints[i]);
		$('#checkpoints').prepend(drawCheckpoint(newBoard, i));
	}
	$('#checkpointHolder').modal({
		overlayClose: true,
		onShow: function() {
			$('#simplemodal-container').css('height', 'auto');
			$('#simplemodal-container').css('width', 'auto');
		},
		onClose: function() {
			selectedCP = null;
			$.modal.close();
		},
		autoResize: true
	});
	
}
function setCheckpoint() {
	checkpoints.push(JSON.stringify(board));
}

function drawCheckpoint(drawBoard, iterator) {
	var drawString = '<div class="cpHolder" id="' + iterator + '" onclick="selectCP(' + iterator + ');">';
	drawString += '<table class="cp">';
	for (var i = 0; i < 9; i++) {
		drawString += '<tr class="cp">';
		for (var j = 0; j < 9; j++) {
			drawString += '<td class="cp';
			if (i == 0 || i == 3 || i == 6) {
				drawString += ' outlineTop';
			} else if (i == 2 || i == 5 || i == 8) {
				drawString += ' outlineBot';
			}
			if (j == 0 || j == 3 || j == 6) {
				drawString += ' outlineLeft';
			} else if (j == 2 || j == 5 || j == 8) {
				drawString += ' outlineRight';
			}
			drawString += '">' + drawBoard.tiles[j][i].val + '</td>';
		}
		drawString += '</tr>';
	}
	drawString += '</table>';
	drawString += '</div>';
	return drawString;
}

var selectedCP = null;

function selectCP(i) {
	if (selectedCP != null)
		$('#'+selectedCP).css('background-color', 'transparent');
	selectedCP = i;
	$('#'+selectedCP).css('background-color', 'rgb(145, 253, 255)');
}
function retrieveCP() {
	var newBoard = JSON.parse(checkpoints[selectedCP]);
	for (i in board.tiles) {
		for (j in board.tiles) {
			board.tiles[i][j].val = newBoard.tiles[i][j].val;
			board.tiles[i][j].poss = newBoard.tiles[i][j].poss;
			board.tiles[i][j].sol = newBoard.tiles[i][j].sol;
			board.tiles[i][j].perm = newBoard.tiles[i][j].perm;
			board.tiles[i][j].conf = newBoard.tiles[i][j].conf;
		}
	}
	board.solved = newBoard.solved;
	$.modal.close();
	drawUnsolved();
}
function deleteCP() {
	if (selectedCP != null)
		checkpoints.splice(selectedCP,1);
	$('#checkpoints').html('');
	selectedCP = null;
	for (i in checkpoints) {
		var newBoard = JSON.parse(checkpoints[i]);
		$('#checkpoints').prepend(drawCheckpoint(newBoard, i));
	}
}
function hideAnnounce() {
	$('#announceWrapper').slideUp();
}

//OPTION MODAL FOR DIFFICULTY/IMAGES
function change() {
	$('input[name=difficulty]:eq(' + (diff-1) + ')', '#changeForm').attr('checked', 'checked');
	$('#options').modal({
		overlayClose: true,
		onShow: function() {
			$('#simplemodal-container').css('height', 'auto');
			$('#simplemodal-container').css('width', 'auto');
		},
		autoResize: true
	});
	$('#imgurinput').keyup(function(e){
		if(e.keyCode == 13) {
			changeAlbum();
		}
	});
}
function changeAlbum() {
	loaded -= 9;
	hash = parseImgurURL($('#imgurinput').val());
	var stateObj = {h:hash, o:'i', d:diff};
	history.pushState(stateObj, "Play Imagedoku", "game.html?o=i&h="+hash+"&d="+(diff));
	$.modal.close();
	$('#alerts').text('Loading...');
	getImgurImages(hash);
}
function changeDiff() {
	window.location = '/game.html?o=' + origin + '&h=' + hash + '&d='+getDiff();
}
function getDiff() {
	$.cookie('diff',  $('input[name=difficulty]:checked', '#changeForm').val(), {expires: 999, path: '/'});
	return $('input[name=difficulty]:checked', '#changeForm').val();
}

//Resize board.  Seriously though, get a bigger sceen.
function resizeBoard() {
	var defaultSize = 751;
	var newSize = Number($('#sizeinput').val());
	console.log(newSize, newSize/defaultSize);
	stage.setScale(newSize/defaultSize);
	numStage.setScale(newSize/defaultSize);
	stage.draw();
	numStage.draw();
	var newNumStageWidth = (158) * (newSize/defaultSize);
	$('#gameStage').css('height', newSize);
	$('#gameStage').css('width', newSize);
	$('#numStage').css('height', newSize);
	$('#numStage').css('width', newNumStageWidth);
	$('#stageWrapper').css('width', newNumStageWidth+newSize);
	if (newSize/defaultSize == 1) board.canZoom = true; //This is here just because the current method of zooming is the same as resizing the board, meaning they don't coexist at present.  Will work it out later.
	else board.canZoom = false;
	$.modal.close();
	$('#sizeinput').attr('placeholder', newSize);
}
function resetBoardSize() {
	stage.setScale(1);
	numStage.setScale(1);
	stage.draw();
	numStage.draw();
	$('#gameStage').css('height', '751px');
	$('#gameStage').css('width', '751px');
	$('#numStage').css('height', '751px');
	$('#numStage').css('width', '158px');
	$('#stageWrapper').css('width', '909px');
	board.canZoom = true; //This is here just because the current method of zooming is the same as resizing the board, meaning they don't coexist at present.  Will work it out later.
	$.modal.close();
	$('#sizeinput').attr('placeholder', 751);
}