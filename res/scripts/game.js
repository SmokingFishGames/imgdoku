var stage;
var numStage;
var imgLayer;
var backCellLayer;
var miniCellLayer;
var cellLayer;
var imgToolLayer;
var cellToolLayer;

var images = [];
var loaded = 0;

var erase;
var zoomIn;
var zoomOut;

var diff;

var solved = [];
var unsolved = [];

var board;

var selected = 1;

window.oncontextmenu = function() {
        return false;
};

$(document).keypress(function(e) {
	switch (Number(e.which)) {
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
	stage = new Kinetic.Stage({
		container: 'gameStage',
		width: 675,
		height: 675
	});
	numStage = new Kinetic.Stage({
		container: 'numStage',
		width: 150,
		height:675
	});
	var hash;
	var origin;
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
	if (origin=='i') {
		getImgurImages(hash);
	} else if (origin == 'fb') {
		getFBAlbum(hash);
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
	
	//var zoom = function(e) {
	//	if (stage.getMousePosition()) {
	//		var zoomAmount = e.wheelDeltaY*0.001;
	//		if (imgLayer.getScale().x+zoomAmount > 0)
	//			imgLayer.setScale(imgLayer.getScale().x+zoomAmount)
	//		imgLayer.draw();
	//	}
	//}
	//
	//document.addEventListener('mousewheel', zoom(), false);
	
	$.get('/res/php/puzzle.php', {d:diff}).done( function(data) {
		var puzzle = $.parseJSON(data);
		for (var i = 0; i < 9; i++) {
			solved[i] = [];
			unsolved[i] = [];
			for (var j = 0; j < 9; j++) {
				unsolved[i][j] = puzzle.Unsolved.charAt(0);
				solved[i][j] = puzzle.Solved.charAt(0);
				puzzle.Unsolved = puzzle.Unsolved.substr(1);
				puzzle.Solved = puzzle.Solved.substr(1);
			}
		}
		board = new Board();
	});
});



function getImgurImages(hash) {
	$.ajax({
		url: 'https://api.imgur.com/3/album/' + hash + '/images',
		type: 'GET',
		dataType: 'json',
		beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Client-ID aec6af81bfca057');},
		success: function(data) {
			if (data.data.length >= 9) {
				for (var i = 0; i < 9; i++) {
					images.push(new Image());
					images[i].src = data.data[i].link;
					images[i].index = i;
					images[i].onload = function() {
						loaded++;
						if (this.width > this.height) {
							this.divisor = this.width/75;
						} else {
							this.divisor = this.height/75;
						}
						//$('body').append('<img src='' + this.src + ''></img>');
						//$('#h'+this.index).attr('src', this.src);
						//$('#h'+this.index).attr('height', this.height/this.divisor);
						//$('#h'+this.index).attr('width', this.width/this.divisor);
						if (loaded==12) {
							drawUnsolved();
							drawToolbar();
						}
					}
				}
			} else {
				alert('Not enough images in album.');
			}
		},
		error: function(data) {
			alert('Malformed hash or URL');
		}
	});
}

function getFBAlbum(hash) {
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
			channelUrl : '/res/fb/channel.html', // Channel File
			status     : true, // check login status
			cookie     : true, // enable cookies to allow the server to access the session
			xfbml      : true  // parse XFBML
		});
		
		FB.getLoginStatus(function(response) {
			if (response.status === 'connected') {
				// connected
				console.log(response);
				console.log('connected');
				FB.api('/' + hash + '/photos', function(newResp) {
					getFBImages(newResp);
				});
			} else if (response.status === 'not_authorized') {
				// not_authorized
				alert('You don\'t have the permissions to view this album!  Try changing permissions or using a different album.');
			} else {
				// not_logged_in
				alert('You aren\'t logged in to Facebook!');
			}
		});
		
		// Additional init code here
		
	};
}

function getFBImages(api) {
	console.log(api);
	if (api.data.length >= 9) {
		for (var i = 0; i < 9; i++) {
			images.push(new Image());
			images[i].src = api.data[i].source;
			images[i].index = i;
			images[i].onload = function() {
				loaded++;
				if (this.width > this.height) {
					this.divisor = this.width/75;
				} else {
					this.divisor = this.height/75;
				} if (loaded==12) {
					drawUnsolved();
					drawToolbar();
				}
			}
		}
	} else {
		alert('Not enough images in album.');
	}
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
				var imageToAdd = new Kinetic.Image({
					image:imageSrc,
					height: Math.floor(imageSrc.height/imageSrc.divisor),
					width: Math.floor(imageSrc.width/imageSrc.divisor),
					x: Math.floor((75*i)+(75-((imageSrc.width/imageSrc.divisor)))/2),
					y: Math.floor((75*j)+(75-((imageSrc.height/imageSrc.divisor)))/2)/*,
					draggable:true*/
				});
				//imageToAdd.on('mouseover', function() {
				//	stage.setDraggable(false);
				//});
				//imageToAdd.on('mouseout', function() {
				//	stage.setDraggable(true);
				//});
				imgLayer.add(imageToAdd);
			} else if (board.tiles[i][j].val == '*') {
				//NEEDS TO BE DRAWN--WILL COMPLETE LATER
				for (k in board.tiles[i][j].poss) {
					if (board.tiles[i][j].poss[k]) {
						imageSrc = images[k];
						var x, y;
						x = 75*i;
						y = 75*j;
						x += (k%3)*25;
						y += Math.floor((k/3))*25;
						x += 25-(((imageSrc.width/imageSrc.divisor))/3);
						y += 25-(((imageSrc.height/imageSrc.divisor))/3);
						x = Math.floor(x);
						y = Math.floor(y);
						var imageToAdd = new Kinetic.Image({
							image:imageSrc,
							height: Math.floor((imageSrc.height/imageSrc.divisor)/3),
							width: Math.floor((imageSrc.width/imageSrc.divisor)/3),
							x: x,
							y: y
						});
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
				x: Math.floor(225*i),
				y: Math.floor(225*j),
				width: 225,
				height: 225,
				stroke: 'black',
				strokeWidth: 4
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
							X: Math.floor((75*i)+(k*25)),
							y: Math.floor((75*j) + (l*25)),
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
				strokeWidth = 1;
			}
			var newCell = new Kinetic.Rect({
				x: Math.floor(75*i),
				y: Math.floor(75*j),
				width: 75,
				height: 75,
				stroke: strokeColor,
				strokeWidth: strokeWidth
			});
			newCell.ix = i;
			newCell.iy = j;
			if (!board.tiles[i][j].perm) {
				newCell.on('mouseover', function() {
					this.setStroke('blue');
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
						this.setStrokeWidth(1);
						this.moveToBottom();
						stage.draw();
					});
				}
			}
			newCell.on('click tap', function(e) {
					if(e.which == 1)
						selectTile(this.ix, this.iy, true);
					else if (e.which == 3)
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
		var x = 0;
		var y = i;
		y*=75;
		var imageToAdd = new Kinetic.Image({
			image:imageSrc,
			height: Math.floor(imageSrc.height/imageSrc.divisor),
			width: Math.floor(imageSrc.width/imageSrc.divisor),
			x: Math.floor(x+(75-((imageSrc.width/imageSrc.divisor)))/2),
			y: Math.floor(y+(75-((imageSrc.height/imageSrc.divisor)))/2)
		});
		imgToolLayer.add(imageToAdd);
	}
	for (var i = 0; i < 9; i++) {
		var stroke, strokeWidth;
		if (i+1 == selected) {
			stroke = 'blue';
			strokeWidth = 4;
		} else {
			stroke = 'black';
			strokeWidth = 1;
		}
		var newCell = new Kinetic.Rect({
			x: 0,
			y: Math.floor(i*75),
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
		x:75,
		y:375
	});
	imgToolLayer.add(imageToAdd);
	
	var stroke, strokeWidth;
	if ('.' == selected) {
		stroke = 'blue';
		strokeWidth = 4;
	} else {
		stroke = 'black';
		strokeWidth = 1;
	}
	var newCell = new Kinetic.Rect({
		x: 75,
		y: 375,
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
		x:75,
		y:225
	});
	imgToolLayer.add(imageToAdd);
	
	var stroke, strokeWidth;
	if ('+' == selected) {
		stroke = 'blue';
		strokeWidth = 4;
	} else {
		stroke = 'black';
		strokeWidth = 1;
	}
	var newCell = new Kinetic.Rect({
		x: 75,
		y: 225,
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
		x:75,
		y:300
	});
	imgToolLayer.add(imageToAdd);
	
	var stroke, strokeWidth;
	if ('-' == selected) {
		stroke = 'blue';
		strokeWidth = 4;
	} else {
		stroke = 'black';
		strokeWidth = 1;
	}
	var newCell = new Kinetic.Rect({
		x: 75,
		y: 300,
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
			$('#alerts').text('We have a winner!');
		}
	}
	this.set = function(x,y,val, perm) {
		this.tiles[x][y].set(val, perm);
		this.checkWin();
	}
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
				this.val = val;
				this.conf = 2;
				this.resetPoss();
			}
			drawUnsolved();
		}
	}
}

function selectTile(x, y, perm) {
	if (selected == '+' || selected == '-') {
		zoom(x,y);
	} else {
		board.set(x,y,selected, perm);
	}
}

function selectTool(val) {
	console.log(selected + '->' + val);
	selected = val;
}

function zoom(x,y) {
	console.log(x + " " + y);
	var currScale = stage.getScale();
	console.log(currScale);
	if (selected == '+') {
		if (currScale.x < 9) {
			stage.setScale(currScale.x*3);
		}
	} else if (selected == '-') {
		if (currScale.x > 1) {
			stage.setScale(currScale.x/3);
		}
	}
	currScale = stage.getScale();
	if (currScale.x > 1) {
		if (currScale.x == 3) {
			stage.setX(-Math.floor(x/3)*3*75*currScale.x);
			stage.setY(-Math.floor(y/3)*3*75*currScale.x);
		} else {
			stage.setX(-x*75*currScale.x);
			stage.setY(-y*75*currScale.x);
		}
	} else {
		stage.setX(0);
		stage.setY(0);
	}
	stage.draw();
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

//function zoom(zoomIn) {
//	var zoomAmount;
//	if (zoomIn)
//		zoomAmount = 1;
//	else
//		zoomAmount = -1;
//	if (imgLayer.getScale().x+zoomAmount > 0) {
//		imgLayer.setScale(imgLayer.getScale().x+zoomAmount);
//		backCellLayer.setScale(imgLayer.getScale().x+zoomAmount);
//		cellLayer.setScale(imgLayer.getScale().x+zoomAmount);
//	}
//	imgLayer.draw();
//	backCellLayer.draw();
//	cellLayer.draw();
//}