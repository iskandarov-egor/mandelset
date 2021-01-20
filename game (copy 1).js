var Game = {
	state: {
		name: 'none',
	},
};

var zeroVars = {
	scale: 1,
	offsetX: 0,
	offsetY: 0,
	previewScale: 1,
	iterations: 100000,
};

var f32vars = {
	scale: 0.000013051581850936334, //f32 star
	//scale: 0.000013051581850936334/16,
	offsetX: -1.6331274114303949, //32 star
	//offsetX: -1.6331328461523655,
	offsetY: 0,
	previewScale: 1,
	iterations: 1000,
};

var mystVars = {
	offsetX: -1.6331463553828895,
	offsetY: 5.843362841437326e-7,
	scale: 1/117916235.51574515,
	previewScale: 1,
	iterations: 100,
};
Game.vars = zeroVars;
Game.vars.usingTexture = true;

var canvas = document.querySelector("#canvas");
var gl = canvas.getContext("webgl2");
if (!gl) {
	alert("no webgl2 for you!");
}

resizeCanvas(canvas, 1/Game.vars.previewScale);
var renderW = gl.canvas.width/1;
var renderH = gl.canvas.height/1;

var includes = {
	'ff_math': loadFile('ff_math.glsl'),
	'mandel': loadFile('mandel.glsl'),
	'debug': loadFile('debug.glsl'),
}
fragmentShaderSource = preprocess(fragmentShaderSource, includes);
var program = createProgram(
	gl,
	createShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
	createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
);
var program2 = createProgram(
	gl,
	createShader(gl, gl.VERTEX_SHADER, vertexShaderSource2),
	createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource2)
);
var positionLocation = 0; //gl.getAttribLocation(program, "a_position");

var positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// three 2d points
var positions = [
  -1, 1,
  -1, -1,
  1, -1,
  -1, 1,
  1, 1,
  1, -1,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
var vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.enableVertexAttribArray(positionLocation);

var size = 2;          // 2 components per iteration
var type = gl.FLOAT;   // the data is 32bit floats
var normalize = false; // don't normalize the data
var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
var offset = 0;        // start at the beginning of the buffer
gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

var refOrbitTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, refOrbitTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, 1024, 1024, 0, gl.RG, gl.FLOAT, null);
var orbitArray = new Float32Array(1024*1024*2);

gl.useProgram(program);
gl.uniform1i(gl.getUniformLocation(program, "refOrbit"), 0);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

/* create framebuffer and its texture */
var frameBuffer = gl.createFramebuffer();
var renderTexture = gl.createTexture();
{
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, renderTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		const level = 0;
		const internalFormat = gl.RGBA;
		const border = 0;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;
		const data = null;
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
					renderW, renderH, border,
					format, type, data);
		
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, level);
}

function newJob(gl, texture, w, h, blockWidth) {
	var job = {
		w: w,
		h: h,
		glTexture: texture,
		done: false,
	};
	var first = true;
	function iteration1() {
		
		var orbitLen = mandelOrbit(Game.vars.offsetX, Game.vars.offsetY, Game.vars.iterations, orbitArray);
		glUpdateRefOrbit(orbitArray, orbitLen);
		
		//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.clearColor(1, 0, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
	};
	
	var scanner = newBlockScanner(w, h, 200);
	job.iteration = function() {
		gl.useProgram(program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		if (first) {
			iteration1();
			first = false;
		}
		var view = scanner.next();
		if (view == null) {
			job.done = true;
			return false;
		}
		//view = {x:800, y:0, w:800, h:h};
		// todo GL_MAX_VIEWPORT_DIMS
		gl.viewport(view.x, view.y, view.w, view.h);

		gl.uniform4f(gl.getUniformLocation(program, "viewport"), 2*view.x/h - w/h, 2*view.y/h - 1, 2*(view.w)/h, 2*(view.h)/h);
		gl.uniform1f(gl.getUniformLocation(program, "screenAspectRatio"), gl.canvas.width/gl.canvas.height);
		gl.uniform1f(gl.getUniformLocation(program, "scale"), Game.vars.scale);
		gl.uniform1f(gl.getUniformLocation(program, "one"), 1.0);
		glUniformD(gl.getUniformLocation(program, "offsetX"), Game.vars.offsetX);
		glUniformD(gl.getUniformLocation(program, "offsetY"), Game.vars.offsetY);
		gl.uniform1i(gl.getUniformLocation(program, "iterations"), Game.vars.iterations);

		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		var count = 6;
		gl.drawArrays(primitiveType, offset, count);
		return true;
	};
	return job;
}

function recreateJob() {
	return newJob(gl, renderTexture, renderW, renderH);
}

var job = recreateJob();

function visualizeBuffer() {
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.useProgram(program2);
	gl.clearColor(0, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.uniform1i(gl.getUniformLocation(program2, "canvas"), 1);
	gl.uniform1f(gl.getUniformLocation(program2, "screenAspectRatio"), gl.canvas.width/gl.canvas.height);
	
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function glUpdateRefOrbit(array, orbitLen) {	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(gl.getUniformLocation(program, "refOrbit"), 0);
	gl.bindTexture(gl.TEXTURE_2D, refOrbitTexture);
	var t0 = performance.now();
	gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 512, gl.RG, gl.FLOAT, array);
	var dt = performance.now() - t0;
	gl.uniform1i(gl.getUniformLocation(program, "refOrbitLen"), orbitLen);
	console.log("perf", orbitLen, dt);
}

Game.drawDirect = function() {
	gl.clearColor(1, 0, 1, 1);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.uniform1f(gl.getUniformLocation(program, "screenAspectRatio"), gl.canvas.width/gl.canvas.height);
	gl.uniform1f(gl.getUniformLocation(program, "scale"), Game.vars.scale);
	gl.uniform1f(gl.getUniformLocation(program, "one"), 1.0);
	glUniformD(gl.getUniformLocation(program, "offsetX"), Game.vars.offsetX);
	glUniformD(gl.getUniformLocation(program, "offsetY"), Game.vars.offsetY);
	gl.uniform1i(gl.getUniformLocation(program, "iterations"), Game.vars.iterations);
	gl.activeTexture(gl.TEXTURE0);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	
	if (Game.vars.usingTexture) {
		var orbitLen = mandelOrbit(Game.vars.offsetX, Game.vars.offsetY, Game.vars.iterations, orbitArray);
		//var orbit = testOrbit();
		glUpdateRefOrbit(orbitArray, orbitLen);
	}

	var primitiveType = gl.TRIANGLES;
	var offset = 0;
	var count = 6;
	gl.drawArrays(primitiveType, offset, count);
}

Game.draw = function() {
	job = recreateJob();
	for(var i = 0; i < 1000; i++) {
		if (!job.iteration()) {
			visualizeBuffer();
			return;
		}
	}
	alert('too many iterations');
}

Game.step1 = function() {
	job.iteration();
	visualizeBuffer();
}

Game.step = function() {
	var workTime = 250;
	var callsAhead = 2;
	var waitPeriod = 5;
	var maxTout = gl.getParameter(gl.MAX_CLIENT_WAIT_TIMEOUT_WEBGL);
	
	function blast() {
		Game.state.sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
		for (var i = 0; i < callsAhead; i++) {
			job.iteration();
			if (job.done) {
				visualizeBuffer();
				return;
			}
			Game.state.calls++;
		}
	}
	
	if (Game.state.name == 'none' || Game.state.name == 'zzz') {
		Game.state = {
			name: 'drawing',
			time: performance.now(),
			calls: 0,
		}
		
		console.log(performance.now(), 'blast1');
		blast();
		
	} else if (Game.state.name == 'drawing') {
		var status = gl.getSyncParameter(Game.state.sync, gl.SYNC_STATUS);
		if (status != gl.SIGNALED) {
			console.log(performance.now(), 'wait more', status);
			return waitPeriod;
		} else {
			gl.deleteSync(Game.state.sync);
			var dt = performance.now() - Game.state.time;
			var blastTime = callsAhead * dt / Game.state.calls;
			if (job.done) {
				Game.state = { name: 'none' };
				return -1;
			}
			if (dt + blastTime < workTime) {
				console.log(performance.now(), 'more blast');
				blast();
				return waitPeriod;
			} else {
				console.log(performance.now(), 'sleep!');
				Game.state = { name: 'zzz' };
				return -1;
			}
		}
	}
	
}

Game.startDrawing = function() {
	var job = recreateJob();
	var drawing = {
	}
}

Game.resizeCanvas = function() {
	resizeCanvas(canvas, 1/Game.vars.previewScale);
}

Game.pixels2gameSpaceX = function(x) {
	var cx = ratio*(x / canvas.width * 2 - 1);
	return cx * Game.vars.scale + Game.vars.offsetX;
}

