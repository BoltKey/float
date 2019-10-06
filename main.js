var canvas;
var ctx;
var zoom = 1;
var targetZoom = 1;
var ballSize = 10;
var mousePos;
var balls = [];
var center = [0, 0];
var targetCenter = [0, 0];
var colorChange = 20;
var gridOffset = [0, 0];
var startTime = 0;
var timer = 0;
var target = 500;
var audio = [];
var player = {
	speed: [0, 1],
	accel: 0.0001,
	update: function() {
		gridOffset[0] += this.speed[0];
		gridOffset[1] += this.speed[1];
		this.speed[0] += (canvas.width / 2 - mousePos[0]) * this.accel;
		this.speed[1] += (canvas.height / 2 - mousePos[1]) * this.accel;
		this.speed[0] = Math.min(5, Math.max(-5, this.speed[0]));
		this.speed[1] = Math.min(5, Math.max(-5, this.speed[1]));
		var ballsInSight = 0;
		for (var j = 0; j < balls.length; ++j) {
			var b = balls[j];
			b.pos[0] += this.speed[0];
			b.pos[1] += this.speed[1];
			
			var d = dist(b.pos, center);
			if (d > canvas.width / 2 / zoom * 7) {
				b.ded = true;
				continue;
			}
			else
				++ballsInSight;
			
			
			for (var i = 0; i < this.balls.length; ++i) {
				var ob = this.balls[i];
				if (ob && b && dist(ob.pos, b.pos) < ballSize * 2) {
					b.inPlayer = true;
					for (var c = 0; c < 3; ++c) {
						var n = ob.color[c] - colorChange + Math.floor(Math.random() * colorChange * 2);
						n = Math.max(0, Math.min(255, n));
						b.color[c] = n;
					}
				}
			}
		}
		var bts = ballsToSee();
		for (var i = ballsInSight; i < bts; ++i) {
			this.generateBall();
		}
		
	},
	
	balls: [],
	draw: function() {
		ctx.fillStyle = "red";
		for (var b of this.balls.concat(balls)) {
			b.draw();
			ctx.fillStyle = "black";
		}
	},
	newBall: function() {
		balls.push(new Ball([Math.random() * 2400 - 800, Math.random() * 2400 - 800]));
	},
	generateBall: function() {
		var dir = Math.random() * Math.PI * 2;
		var x = center[0] + Math.cos(dir) * canvas.width / 2 * 3;
		var y = center[1] + Math.sin(dir) * canvas.height / 2 * 3;
		balls.push(new Ball([x, y]));
		console.log("new ball at ", x, y);
	}
}

function Ball(pos, r = 0, g = 0, b = 0) {
	this.pos = pos;
	this.inPlayer = false;
	this.color = [r, g, b];
}

Ball.prototype.draw = function() {
	var r = ballSize;
	ctx.beginPath();
	ctx.arc(this.pos[0] - center[0], this.pos[1] - center[1], r, 0, Math.PI * 2);
	ctx.fillStyle = "rgb(" + this.color.join(", ") + ")";
	ctx.fill();
}

function main() {
	canvas = $("canvas")[0];
	ctx = canvas.getContext("2d");
	mousePos = [canvas.width / 2, canvas.height / 2];
	restart();
	
	for (var i = 0; i < 4; ++i) {
		audio.push([]);
		for (var j = 0; j < 10; ++j) {
			audio[i].push(new Audio("blip" + (i+1) + ".wav"));
			audio[i].i = 0;
		}
	}
	
	$("canvas").mousemove(function(e) {
		mousePos = [e.offsetX, e.offsetY];
	});
	$("canvas").mousedown(function(e) {
		if (player.balls.length === 0) {
			for (var i = 0; i < balls.length; ++i) {
				var b = balls[i];
				
				if (dist(b.pos, [e.offsetX, e.offsetY]) < ballSize) {
					player.speed = [0, 0];
					player.balls.push(b);
					
					b.color = [255, 0, 0];
					balls.splice(i, 1);
					targetCenter = [b.pos[0], b.pos[1]];
					updateZoom();
					startTime = timer;
					break;
				}
			}
		}
	});
	
	update();
}

function restart() {
	targetCenter = [canvas.width / 2, canvas.height / 2];
	center[0] = targetCenter[0];
	center[1] = targetCenter[1];
	player.balls = [];
	player.speed = [0, 0];
	
	balls = [];
	timer = 0;
	for (var i = 0; i < 250; ++i) {
		player.newBall();
	}
	zoom = 1;
	targetZoom = 1;
}

function update() {
	requestAnimationFrame(update);
	if (player.balls.length < target) {
		++timer;
		if (timer - startTime > 7200) {
			restart();
		}
	}
	
	for (var i = 0; i < balls.length; ++i) {
		var b = balls[i];
		if (b.ded) {
			balls.splice(i--, 1);
		}
		if (b.inPlayer) {
			player.balls.push(b);
			balls.splice(i--, 1);
			updateZoom();
			if (Math.sqrt(player.balls.length) % 1 === 0) {
				updateCenter();
			}
			var a = Math.floor(Math.random() * 4);
			audio[a][audio[a].i++].play();
			audio[a].i %= 10;
		}
		
	}
	var s = 0.006;
	if (dist(center, targetCenter) > 1) {
		
		var dx = (center[0] - targetCenter[0]) * s;
		var dy = (center[1] - targetCenter[1]) * s;
		center[0] -= dx;
		center[1] -= dy;
		
	}
	zoom += (targetZoom - zoom) * s;
	player.update();
	
	draw();
}

function updateZoom() {
	targetZoom = 1/(Math.log(Math.sqrt(player.balls.length + 1)) / Math.log(8));
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.font = "40px Arial";
	ctx.fillText(player.balls.length + "/" + target, 20, 40);
	if (player.balls[0]) {
		var s = (timer - startTime) / 60;
		var tex = Math.floor(s) + "." + Math.floor(s*10)%10 + "/120";
		if (player.balls.length >= target) {
			tex = "You won, yay";
		}
		ctx.fillText(tex, 20 , 70);
		
	}
	ctx.save();
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.scale(zoom, zoom);
	drawGrid();
	player.draw();
	
	ctx.restore();
}

function drawGrid() {
	var x = Math.floor((canvas.width /  zoom + gridOffset[0]) / 100);
	ctx.globalAlpha = 0.2;
	for (var i = 0; i > -20; --i) {
		ctx.fillRect( gridOffset[0] - (x+i) * 100, -100000, 1, 100000000);
	}
	var y = Math.floor((canvas.height /  zoom + gridOffset[1]) / 100) ;
	for (var i = 0; i > -20; --i) {
		ctx.fillRect( -100000, gridOffset[1] - (y+i) * 100, 10000000, 1);
	}
	ctx.globalAlpha = 1;
}

function updateCenter() {
	var x = player.balls.map(a => a.pos[0]).reduce((a, s) => a+s, 0);
	console.log(x/player.balls.length);
	var y = player.balls.map(a => a.pos[1]).reduce((a, s) => a+s, 0);
	console.log(y/player.balls.length);
	targetCenter = [x/player.balls.length, y/player.balls.length];
}

function consideredArea() {
	return (canvas.width * canvas.height) / (Math.pow(zoom, 2) * 3);
}

function ballsToSee() {
	var ballDensity = 1/1000;
	return consideredArea() * ballDensity;
}

function dist(p1, p2) {
	return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2))
}

window.onload = main;