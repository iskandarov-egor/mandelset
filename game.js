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
	offsetX: -1.6331395811715201,
	offsetY: 0,
	scale: 1/173413815746731,
	previewScale: 1,
	iterations: 1000,
};

function cloneEye(e) {
	return {
		offsetX: e.offsetX,
		offsetY: e.offsetY,
		scale: e.scale,
		previewScale: e.previewScale,
		iterations: e.iterations,
	};
}

Game.eye = zeroEye;
Game.eye.dirty = false;

document.querySelector("#canvas");
var gl = canvas.getContext("webgl2", {antialias: false});
if (!gl) {
	alert("no webgl2 for you!");
}

M.game_gl.init();

M.gl_util.resizeCanvas(canvas, Game.eye.previewScale);

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
}

// contains the eye of the previous drawing and the results so far
var swap = {
	eye: null,
	texture: null,
};

var comp2 = new M.Computer(compArg2);
//var comp2 = new M.PyramidComputer(compArg2);
comp2.init();

var program2 = M.gl_util.createProgram(
	gl,
	M.gl_util.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource2),
	M.gl_util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource2)
);

program2 = M.game_gl.createProgramVisualizer();

function visualizeBuffer(texture) {
	if (Game.state.name != 'idle') {
		//return;
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.useProgram(program2);
	gl.clearColor(0, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	var drawingEye = comp2.getDrawingEye();
	gl.uniform1i(gl.getUniformLocation(program2, "fgTexture"), 1);
	gl.uniform1f(gl.getUniformLocation(program2, "screenAspectRatio"), gl.canvas.width/gl.canvas.height);
	gl.uniform1f(gl.getUniformLocation(program2, "eyeX"), Game.eye.offsetX);
	gl.uniform1f(gl.getUniformLocation(program2, "eyeY"), Game.eye.offsetY);
	gl.uniform1f(gl.getUniformLocation(program2, "scale"), Game.eye.scale);
	gl.uniform1f(gl.getUniformLocation(program2, "fgEyeX"), drawingEye.offsetX);
	gl.uniform1f(gl.getUniformLocation(program2, "fgEyeY"), drawingEye.offsetY);
	gl.uniform1f(gl.getUniformLocation(program2, "fgScale"), drawingEye.scale);
	
	gl.activeTexture(gl.TEXTURE2);
	gl.uniform1i(gl.getUniformLocation(program2, "bgTexture"), 2);
	if (underlay.eye){
		gl.bindTexture(gl.TEXTURE_2D, underlay.texture);
		console.log('bound', utexture);
		gl.uniform1f(gl.getUniformLocation(program2, "bgEyeX"), underlay.eye.offsetX);
		gl.uniform1f(gl.getUniformLocation(program2, "bgEyeX"), underlay.eye.offsetY);
		gl.uniform1f(gl.getUniformLocation(program2, "bgScale"), underlay.eye.scale);
	} else {
		// we are required by opengl to bind some texture anyway
		gl.bindTexture(gl.TEXTURE_2D, texture);
	}
	
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// underlay is the image that contains the rendering results of the previous view.
// this image will be used as a background so that the user has something to look at
// while the new view is being rendered. otherwise the screen will be cleared after
// each movement.
class Underlay {
	constructor(gl, w, h){
		this.w = w;
		this.h = h;
		this.gl = gl;
		this.texture = M.gl_util.createRenderTexture(gl, w, h);
		this.eye = null;
		this.fbuffer1 = gl.createFramebuffer();
		this.fbuffer2 = gl.createFramebuffer();
	}
	
	take(eye, txt) {
		this.eye = cloneEye(eye);
		var gl = this.gl;
		gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fbuffer1);
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fbuffer2);
			
		gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, comp2.getTexture(), 0);
		gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
		gl.readBuffer(gl.COLOR_ATTACHMENT0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		gl.blitFramebuffer(
			0, 0, this.w, this.h,
			0, 0, this.w, this.h,
			gl.COLOR_BUFFER_BIT, gl.NEAREST
		);
	}
	
	combine(eye, texture, w, h) {
		// convert coordinate of a pixel in one view to another (either x or y)
		// e1, e2 - eye offsets of the views
		// hside1, hside2 - half of the side of the views in
		//                  real space (width or height correspondingly)
		// ps1, ps2 - the width of one pixel in real space in the views
		// x2 - the pixel coordinate in the view2
		// returns the pixel coordinate in the view1
		function convertPixelCoord(e1, e2, hside1, hside2, ps1, ps2, x2) {
			// :: 1) 0.5ps + ps*x + e - (hside/S)*S = e + t*s
			// ::    t*s = ps*(0.5+x) - hside
			// :: 2) e1 + s1*t1 = e2 + s2*t2
			// ::    e1 + ps1*(0.5+x1) - hside1 = e2 + ps2*(0.5+x2) - hside2
			var tmp = e2 - e1 + hside1 - hside2 + ps2*(0.5 + x2);
			var x1 = tmp/ps1 - 0.5;
			return Math.floor(x1);
		}
		
		var gl = this.gl;
		gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fbuffer1);
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fbuffer2);
			
		gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, comp2.getTexture(), 0);
		gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
		gl.readBuffer(gl.COLOR_ATTACHMENT0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		var hside1 = this.eye.scale * (this.w/this.h);
		
		var ps1 = 2*hside1/this.w;
		var ps2 = 2*hside2/w;
		var ratio1 = this.w/this.h;
		var ratio2 = w/h;
		var hw1 = this.eye.scale*ratio1;
		var hw2 = eye.scale*ratio2;
		gl.blitFramebuffer(
			0, 0, this.w, this.h,
			convertPixelCoord(this.eye.offsetX, eye.offsetX, hw1, hw2, ps1, ps2, 0), 
			convertPixelCoord(this.eye.offsetY, eye.offsetY, this.eye.scale, eye.scale, ps1, ps2, 0), 
			convertPixelCoord(this.eye.offsetX, eye.offsetX, hw1, hw2, eye.scale*ratio2, ps1, ps2, w),
			convertPixelCoord(this.eye.offsetY, eye.offsetY, this.eye.scale, eye.scale, ps1, ps2, h),
			gl.COLOR_BUFFER_BIT, gl.NEAREST
		);
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

var ut = {
};

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
			if (comp2.isDone()) {
				console.log('swap');
				swap.eye = comp2.getDrawingEye();
				swap.texture = comp2.reset(Game.eye);
			} else {
				console.log('no swap');
				comp2.reset(Game.eye);
			}
			
			done = false;
			Game.eye.dirty = false;
		}
		var now = performance.now();
		if (done) {
			trace('loop', 'all done', now - startTime0);
			//visualizeBuffer(pyramid.textureL1);
			Game.state = { name: 'idle'	};
			ut.eye = comp2.getDrawingEye();
			ut.texture = comp2.getTexture();
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
