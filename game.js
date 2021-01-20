var Game = {
	state: {
		name: 'idle',
	},
	screenDirty: true,
};

var zeroEye = {
	scale: 1,
	offsetX: 0,
	offsetY: 0,
	previewScale: 1,
	iterations: 100,
};

var f32eye = {
	scale: 0.000013051581850936334, //f32 star
	//scale: 0.000013051581850936334/16,
	offsetX: -1.6331274114303949, //32 star
	//offsetX: -1.6331328461523655,
	offsetY: 0,
	previewScale: 1,
	iterations: 1000,
};

var mystEye = {
	offsetX: -1.6331463553828895,
	offsetY: 5.843362841437326e-7,
	scale: 1/117916235.51574515,
	previewScale: 1,
	iterations: 100,
};

Game.eye = f32eye;
Game.eye.dirty = false;

document.querySelector("#canvas");
var gl = canvas.getContext("webgl2");
if (!gl) {
	alert("no webgl2 for you!");
}


resizeCanvas(canvas, Game.eye.previewScale);
var renderW = gl.canvas.width/1;
var renderH = gl.canvas.height/1;


var postitionVao = createPositionVAO(gl);
//var pyramid = createRenderPyramid(gl, renderW, renderH);
var fbuffer = gl.createFramebuffer();

var compArg2 = {
	gl: gl,
	eye: Game.eye,
	buffer: {
		w: renderW,
		h: renderH,
	},
	frameBuffer: fbuffer,
	nLevels: 2,
}

//var comp2 = newComputer(compArg2);
var comp2 = newPyramidComputer(compArg2);
comp2.init();

var program2 = createProgram(
	gl,
	createShader(gl, gl.VERTEX_SHADER, vertexShaderSource2),
	createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource2)
);

function visualizeBuffer(texture) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.useProgram(program2);
	gl.clearColor(0, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	var drawingEye = comp2.getDrawingEye();
	gl.uniform1i(gl.getUniformLocation(program2, "canvas"), 1);
	gl.uniform1f(gl.getUniformLocation(program2, "screenAspectRatio"), gl.canvas.width/gl.canvas.height);
	gl.uniform1f(gl.getUniformLocation(program2, "eyeX"), Game.eye.offsetX);
	gl.uniform1f(gl.getUniformLocation(program2, "eyeY"), Game.eye.offsetY);
	gl.uniform1f(gl.getUniformLocation(program2, "scale"), Game.eye.scale);
	gl.uniform1f(gl.getUniformLocation(program2, "canvasOffsetX"), drawingEye.offsetX);
	gl.uniform1f(gl.getUniformLocation(program2, "canvasOffsetY"), drawingEye.offsetY);
	gl.uniform1f(gl.getUniformLocation(program2, "canvasScale"), drawingEye.scale);
	//console.log('eye', Game.eye.offsetX, comp2.eye.offsetX);
	//console.log('info', Game.eye.offsetX, comp2.eye.offsetX);
	
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

Game.draw = function() {
	
	//comp2.reset(eye);
	//comp2.computeAll();
	//comp1.computeAll();
	
	//visualizeBuffer(pyramid.textureL1);
}

Game.requestDraw = function() {
	if (Game.state.name == 'idle') {
		mainLoop();
	} else {
	}
}

Game.drawDirect = function() {
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	comp.drawDirect();
}

function mainLoop() {
	Game.state = { name: 'loop'	};
	var startTime0 = performance.now();
	var startTime = performance.now();
	var sleep2workRatio = 0.5;
	
	function timer() {
		if (Game.eye.dirty) {
			trace('loop', 'dirty eye2');
			comp2.reset(Game.eye);
			Game.eye.dirty = false;
		}
		var now = performance.now();
		startTime = now;
		trace('loop', 'timer');
		comp2.computeSome(cb);
	}
	
	function cb(done) {
		Game.screenDirty = true;
		if (Game.eye.dirty) {
			trace('loop', 'dirty eye');
			comp2.reset(Game.eye);
			done = false;
			Game.eye.dirty = false;
		}
		var now = performance.now();
		if (done) {
			trace('loop', 'all done', now - startTime0);
			//visualizeBuffer(pyramid.textureL1);
			Game.state = { name: 'idle'	};
		} else {
			var workTime = now - startTime;
			trace('loop', 'sleep for', workTime * sleep2workRatio);
			setTimeout(timer, workTime * sleep2workRatio);
		}
			//visualizeBuffer(pyramid.textureL1);
	}
	comp2.computeSome(cb);
}

Game.setEye = function(newEye) {
	Game.eye = newEye;
	Game.eye.dirty = true;
}


Game.resizeCanvas = function() {
	resizeCanvas(canvas, 1/Game.eye.previewScale);
}

function raf() {
	if (Game.screenDirty) {
		trace('raf', '<raf>');
		visualizeBuffer(comp2.getTexture());
		Game.screenDirty = false;
	}
	requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
