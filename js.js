var canvas = document.querySelector("#canvas");

var ns = M.ns.ns;
// 2162819005114
// 76619

function loadLabels() {
	document.getElementById("zoom").value = 1/Game.eye.scale;
	document.getElementById("x").value = ns.number(Game.eye.offsetX);
	document.getElementById("y").value = ns.number(Game.eye.offsetY);
	document.getElementById("iter").value = Game.eye.iterations;
}

function saveLabels() {
	Game.eye.iterations = parseFloat(document.getElementById("iter").value);
	Game.eye.previewScale = parseFloat(document.getElementById("preview").value);
	Game.eye.offsetX = parseFloat(document.getElementById("x").value);
	Game.eye.offsetY = parseFloat(document.getElementById("y").value);
	Game.eye.scale = 1/parseFloat(document.getElementById("zoom").value);
	Game.setEye(Game.eye);
}

canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const dir = Math.sign(e.deltaY);
    var ratio = canvas.width/canvas.height;
    var x = e.offsetX / canvas.clientHeight * 2 - ratio;
    var y = e.offsetY / canvas.clientHeight * -2 + 1;
    var factor = Math.pow(1.1, dir);
    
    // :: var cx = x * Game.eye.scale + Game.eye.offsetX;
	// :: Game.eye.offsetX = cx + (Game.eye.offsetX - cx) * factor;
	// :: Game.eye.offsetX = x * Game.eye.scale + Game.eye.offsetX + (-x * Game.eye.scale) * factor;
	// :: Game.eye.offsetX = x * Game.eye.scale*(1 - factor) + Game.eye.offsetX;
	Game.eye.offsetX = ns.add(ns.init(x * Game.eye.scale*(1 - factor)), Game.eye.offsetX);
    Game.eye.offsetY = ns.add(ns.init(y * Game.eye.scale*(1 - factor)), Game.eye.offsetY);
    Game.eye.scale *= factor;
    loadLabels();
    Game.setEye(Game.eye);
	Game.requestDraw();
});



canvas.addEventListener("mousemove", e => {
	if (e.buttons % 2 == 0) {
		return;
	}
	// todo test when page is zoomed
	//var canvasX = 
	Game.eye.offsetX = ns.sub(
		Game.eye.offsetX,
		ns.mul(ns.init(e.movementX*2/canvas.clientHeight), ns.init(Game.eye.scale)),
	);
	Game.eye.offsetY = ns.add(
		Game.eye.offsetY,
		ns.mul(ns.init(e.movementY*2/canvas.clientHeight), ns.init(Game.eye.scale)),
	);
	//console.log('mov', Game.eye.offsetX, Game.eye.offsetY, Game.eye.scale);
    loadLabels();
	Game.setEye(Game.eye);
	Game.requestDraw();
});

/*
canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const dir = Math.sign(e.deltaY);
    var ratio = canvas.width/canvas.height;
    var x = e.offsetX / canvas.clientHeight * 2 - ratio;
    var y = e.offsetY / canvas.clientHeight * -2 + 1;
    var factor = Math.pow(1.1, dir);
    
    var cx = x * Game.eye.scale + Game.eye.offsetX;
    var cy = y * Game.eye.scale + Game.eye.offsetY;
    Game.eye.offsetX = cx + (Game.eye.offsetX - cx) * factor;
    Game.eye.offsetY = cy + (Game.eye.offsetY - cy) * factor;
    Game.eye.scale *= factor;
    loadLabels();
    Game.setEye(Game.eye);
	Game.requestDraw();
});

canvas.addEventListener("mousemove", e => {
	if (e.buttons % 2 == 0) {
		return;
	}
	// todo test when page is zoomed
	//var canvasX = 
	Game.eye.offsetX -= 2 * e.movementX / canvas.clientHeight * Game.eye.scale;
	Game.eye.offsetY += 2 * e.movementY / canvas.clientHeight * Game.eye.scale;
	//console.log('mov', Game.eye.offsetX, Game.eye.offsetY, Game.eye.scale);
    loadLabels();
	Game.setEye(Game.eye);
	Game.requestDraw();
});
*/

function myclick() {
	saveLabels();
	
	Game.drawDirect();
	
}

var utexture = M.gl_util.createRenderTexture(gl, renderW, renderH);

function myclick2() {
	/*
	var fbuffer1 = gl.createFramebuffer();
	var fbuffer2 = gl.createFramebuffer();
	//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbuffer1);
	gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fbuffer2);
		
	gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, comp2.getTexture(), 0);
	gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, utexture, 0);
	gl.readBuffer(gl.COLOR_ATTACHMENT0);
	gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
	gl.blitFramebuffer(0, 0, renderW, renderH,
		renderW/2, renderH/2,renderW, renderH,
		gl.COLOR_BUFFER_BIT, gl.NEAREST);
	visualizeBuffer();
	*/
	//underlay.take(comp2.getDrawingEye(), comp2.getTexture());
	underlay.combine(comp2.getDrawingEye(), comp2.getTexture(), renderW, renderH);
	visualizeBuffer(comp2.getTexture());
}

function myclick3() {
	underlay.combine(comp2.getDrawingEye(), comp2.getTexture(), renderW, renderH);
	visualizeBuffer(comp2.getTexture());
}
loadLabels();
mainLoop();

setInterval(function() {
  document.getElementById("lblTiming").innerText = 'Timing: ' + M.Stat.Computer.lastTiming;
  document.getElementById("lblGLTimer").innerText = 'GL Timer: ' + M.Stat.Computer.GLTimer;
}, 500);



