var canvas = document.querySelector("#canvas");

var ns = M.ns.ns;
// 2162819005114
// 76619

function loadLabels() {
	document.getElementById("input_scale").value = 1/Game.eye.scale;
	document.getElementById("input_x").value = ns.number(Game.eye.offsetX).toFixed(30);
	document.getElementById("input_y").value = ns.number(Game.eye.offsetY).toFixed(30);
	document.getElementById("input_iter").value = Game.eye.iterations;
}

function saveLabels() {
	Game.eye.iterations = parseFloat(document.getElementById("input_iter").value);
	//Game.eye.previewScale = parseFloat(document.getElementById("preview").value);
	Game.eye.offsetX = ns.init(parseFloat(document.getElementById("input_x").value));
	Game.eye.offsetY = ns.init(parseFloat(document.getElementById("input_y").value));
	Game.eye.scale = 1/parseFloat(document.getElementById("input_scale").value);
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

var acc = 0;

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
		
	loadLabels();
	Game.setEye(Game.eye);
	Game.requestDraw();
});

function myclick() {
	saveLabels();
	
	Game.requestDraw();
	
}

var utexture = M.gl_util.createRenderTexture(gl, renderW, renderH);

function myclick2() {

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



