var ns = M.ns.ns;

var Game = {
	state: {
		name: 'idle',
	},
	screenDirty: true,
};

var zeroEye = {
	scale: 1,
	offsetX: ns.init(0),
	offsetY: ns.init(0),
	previewScale: 1,
	iterations: 100,
};

var f32eye = {
	scale: 0.000013051581850936334, //f32 star
	//scale: 0.000013051581850936334/16,
	offsetX: ns.init(-1.6331274114303949), //32 star
	//offsetX: -1.6331328461523655,
	offsetY: ns.init(0),
	previewScale: 1,
	iterations: 100,
};

var mystEye = {
	offsetX: -1.6331463553828895,
	offsetY: 5.843362841437326e-7,
	scale: 1/117916235.51574515,
	previewScale: 1,
	iterations: 100,
};

var immovableEye = {
	offsetX: ns.init(-1.6331395811715201),
	offsetY: ns.init(0),
	scale: 1/173413815746731,
	previewScale: 1,
	iterations: 1000,
};

var ddLimitEye = {
	offsetX: ns.init(-1.6331395811715201),
	offsetY: ns.init(0),
	scale: 1/1.361052241705286e+30,
	previewScale: 1,
	iterations: 1000,
};

var almostBlackEye = {
	scale: 1/3.7974983358324126,
	offsetX: ns.init(-0.224190897277197292991601784706),
	offsetY: ns.init(0),
	previewScale: 1,
	iterations: 100,
};

// the derivative's magnitude is so big it messes up calculations
var error1 = {
	scale: 1/371727914934102.25,
	offsetX: ns.init(-0.710631357018485121379569591227),
	offsetY: ns.init(0.289388796050924990144181947471),
	previewScale: 1,
	iterations: 1000,
};

var error2 = {
	scale: 1/492565378.95253223,
	offsetX: ns.init(-0.672719884767477349640785178053),
	offsetY: ns.init(0.445552821138786914190177412820),
	previewScale: 1,
	iterations: 8000,
};

// here ff_main glitches strongly
var deep1 = {
	scale: 1/1342940438193.1177,
	offsetX: ns.init(-0.672719885909637826948426209128),
	offsetY: ns.init(0.445552820999778387278666968996),
	previewScale: 1,
	iterations: 64000,
}

function cloneEye(e) {
	return {
		offsetX: ns.clone(e.offsetX),
		offsetY: ns.clone(e.offsetY),
		scale: e.scale,
		previewScale: e.previewScale,
		iterations: e.iterations,
	};
};

Game.eye = deep1;
Game.eye.dirty = false;

document.querySelector("#canvas");
document.querySelector("#canvas1");
var gl = canvas.getContext("webgl2", {antialias: false});
if (!gl) {
	alert("no webgl2 for you!");
}

M.game_gl.init();

//canvas.onselectstart = function () { return false; }
//canvas1.onselectstart = function () { return false; }

M.gl_util.resizeCanvas(canvas, Game.eye.previewScale);
M.gl_util.resizeCanvas(canvas1, Game.eye.previewScale);

gl.canvas.width = gl.canvas.width - (gl.canvas.width % 3);
gl.canvas.height = gl.canvas.height - (gl.canvas.height % 3);
var renderW = gl.canvas.width/1;
var renderH = gl.canvas.height/1;


var postitionVao = M.game_gl.createPositionVAO(gl);
//var pyramid = createRenderPyramid(gl, renderW, renderH);
var fbuffer = gl.createFramebuffer();

var swapTexture;

var compArg2 = {
	gl: gl,
	eye: Game.eye,
	buffer: {
		w: renderW,
		h: renderH,
	},
	frameBuffer: fbuffer,
	nLevels: 2,
    //_orbitLenLimit: 2,
};

//var comp2 = new M.Computer(compArg2);
var comp2 = new M.PyramidComputer(compArg2);
comp2.init();

var program2 = M.gl_util.createProgram(
	gl,
	M.gl_util.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource2),
	M.gl_util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource2)
);

program2 = M.game_gl.createProgramVisualizer();

var lt = new M.LoadTester(gl); // for debugging

function visualizeBuffer(texture) {
	if (Game.state.name != 'idle') {
		//return;
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.useProgram(program2);
	//gl.clearColor(0, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	var drawingEye = comp2.getDrawingEye();
	gl.uniform1i(gl.getUniformLocation(program2, "fgTexture"), 1);
	gl.uniform1f(gl.getUniformLocation(program2, "screenAspectRatio"), gl.canvas.width/gl.canvas.height);
	gl.uniform1f(gl.getUniformLocation(program2, "eyeX"), 0);
	gl.uniform1f(gl.getUniformLocation(program2, "eyeY"), 0);
	gl.uniform1f(gl.getUniformLocation(program2, "scale"), Game.eye.scale);
	gl.uniform1f(gl.getUniformLocation(program2, "fgEyeX"), ns.number(ns.sub(drawingEye.offsetX, Game.eye.offsetX)));
	gl.uniform1f(gl.getUniformLocation(program2, "fgEyeY"), ns.number(ns.sub(drawingEye.offsetY, Game.eye.offsetY)));
	gl.uniform1f(gl.getUniformLocation(program2, "fgScale"), drawingEye.scale);
	
	
	gl.activeTexture(gl.TEXTURE2);
	gl.uniform1i(gl.getUniformLocation(program2, "bgTexture"), 2);
	
		gl.bindTexture(gl.TEXTURE_2D, underlay.texture);
	if (underlay.eye){ // todo is true ok?
		gl.uniform1f(gl.getUniformLocation(program2, "bgEyeX"), ns.number(ns.sub(underlay.eye.offsetX, Game.eye.offsetX)));
		gl.uniform1f(gl.getUniformLocation(program2, "bgEyeY"), ns.number(ns.sub(underlay.eye.offsetY, Game.eye.offsetY)));
		gl.uniform1f(gl.getUniformLocation(program2, "bgScale"), underlay.eye.scale);
	} else {
		// we are required by opengl to bind some texture anyway
		//gl.bindTexture(gl.TEXTURE_2D, underlay.texture);

	}
	
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    
    if (comp2.overlay) {
        comp2.overlay.ctx.clearRect(0, 0, canvas1.width, canvas1.height);
        comp2.overlay.draw(Game.eye);
    }
}

// underlay is the image that contains combined rendering results of the previous views.
// this image will be used as a background so that the user has something to look at
// while the current view is being rendered.
class Underlay {
	constructor(gl, w, h){
		this.w = w;
		this.h = h;
		this.gl = gl;
		this.texture = M.gl_util.createUnderlayTexture(gl, w, h);
		this.texture2 = M.gl_util.createUnderlayTexture(gl, w, h);
		this.eye = null;
		this.fbuffer1 = gl.createFramebuffer();
		this.fbuffer2 = gl.createFramebuffer();
	}
	
	combine(eye, texture) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer1);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture2, 0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.useProgram(program2);
		//gl.clearColor(0, 1, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.uniform1i(gl.getUniformLocation(program2, "fgTexture"), 1);
		gl.uniform1f(gl.getUniformLocation(program2, "screenAspectRatio"), gl.canvas.width/gl.canvas.height);
		gl.uniform1f(gl.getUniformLocation(program2, "eyeX"), 0);
		gl.uniform1f(gl.getUniformLocation(program2, "eyeY"), 0);
		gl.uniform1f(gl.getUniformLocation(program2, "scale"), eye.scale);
		gl.uniform1f(gl.getUniformLocation(program2, "fgEyeX"), 0);
		gl.uniform1f(gl.getUniformLocation(program2, "fgEyeY"), 0);
		gl.uniform1f(gl.getUniformLocation(program2, "fgScale"), eye.scale);
				
		gl.activeTexture(gl.TEXTURE2);
		gl.uniform1i(gl.getUniformLocation(program2, "bgTexture"), 2);
		if (this.eye){
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.uniform1f(gl.getUniformLocation(program2, "bgEyeX"), ns.number(ns.sub(this.eye.offsetX, eye.offsetX)));
			gl.uniform1f(gl.getUniformLocation(program2, "bgEyeY"), ns.number(ns.sub(this.eye.offsetY, eye.offsetY)));
			gl.uniform1f(gl.getUniformLocation(program2, "bgScale"), this.eye.scale);
		} else {
			// we are required by opengl to bind some texture anyway
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		
		
		gl.viewport(0, 0, this.w, this.h);
		
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		var tmp = this.texture;
		this.texture = this.texture2;
		this.texture2 = tmp;
		this.eye = cloneEye(eye);
	}
	
};

var underlay = new Underlay(gl, renderW, renderH);

Game.draw = function() {
	
	comp2.reset(eye);
	comp2.computeAll();
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
	comp2.reset(Game.eye);
	comp2.computeAll();
	Game.screenDirty = true;
}

function mainLoop() {
	Game.state = { name: 'loop'	};
	var startTime0 = performance.now();
	var startTime = performance.now();
	var sleep2workRatio = 0.2;
	
	function timer() {
		if (Game.eye.dirty) {
			trace('loop', 'dirty eye2');
			underlay.combine(comp2.getDrawingEye(), comp2.getTexture());
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
			underlay.combine(comp2.getDrawingEye(), comp2.getTexture());
			comp2.reset(Game.eye);
			
			done = false;
			Game.eye.dirty = false;
		}
		var now = performance.now();
		if (done) {
			trace('loop', 'all done', now - startTime0);
			//visualizeBuffer(pyramid.textureL1);
			Game.state = { name: 'idle'	};
			comp2.getDrawingEye();
			comp2.getTexture();
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
    Game.screenDirty = true;
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
