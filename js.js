var canvas = document.querySelector("#canvas");

// 2162819005114
// 76619

function loadLabels() {
	document.getElementById("zoom").value = 1/Game.eye.scale;
	document.getElementById("x").value = Game.eye.offsetX;
	document.getElementById("y").value = Game.eye.offsetY;
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

function myclick() {
	saveLabels();
	//Game.resizeCanvas();
	const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
	const query = gl.createQuery();
	gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
	var t0 = performance.now();
	
	//Game.draw();
	
	gl.endQuery(ext.TIME_ELAPSED_EXT);
	var i = 0;
	function checkFlag() {
		const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
		if (available) {
			const dt = gl.getQueryParameter(query, gl.QUERY_RESULT);		
			var str = 'dt1: ' + dt/1e6;
			document.getElementById("infolabel").innerText = str;
			return;
		} else {
			i++;
			if (i >= 100) {
				document.getElementById("infolabel").innerText = 'too long!';
				return;
			}
			window.setTimeout(checkFlag, 100);
		}
	}
	checkFlag();
}

function measureclick() {
	saveLabels();
	mainLoop();
}
loadLabels();
mainLoop();



