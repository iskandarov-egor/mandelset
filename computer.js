
// - internally uses texture unit 0.
// - requires unit square values in vertex attribute 0.
function newComputer(args) {
var c = {};

var gl = args.gl;
var eye = {
	offsetX: args.eye.offsetX,
	offsetY: args.eye.offsetY,
	scale: args.eye.scale,
	iterations: args.eye.iterations,
};
c.drawingEye = eye;
var bufParam = {
	w: args.buffer.w,
	h: args.buffer.h,
	ratio: args.buffer.w/args.buffer.h,
}
var fbuffer = args.frameBuffer;
var renderTexture;
var parentTexture = args.parentTexture;
var program = null;
var refOrbitTexture = null;
var orbitArray;
var job;

c.reset = function(newEye) {
	eye = {
		offsetX: newEye.offsetX,
		offsetY: newEye.offsetY,
		scale: newEye.scale,
		iterations: newEye.iterations,
	}
	
	gl.useProgram(program);
	setUniforms();
	job = newJob();
	c.done = false;
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, 0);
	gl.clearColor(0.5, 0.5, 0, 1);
	
	gl.clear(gl.COLOR_BUFFER_BIT);
	c.drawingEye = eye;
}

function newJob() {
	var job = {
		done: false,
	};
	var first = true;
	function iteration1() {
		//var orbitLen = mandelOrbit(eye.offsetX, eye.offsetY, eye.iterations, orbitArray);
		//glUpdateRefOrbit(orbitArray, orbitLen);
		
		//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		//gl.clearColor(1, 0, 1, 1);
		//gl.clear(gl.COLOR_BUFFER_BIT);
	};
	
	var scanner = newBlockScanner(bufParam.w, bufParam.h, 100);
	job.iteration = function() {
		var view = scanner.next();
		if (view == null) {
			job.done = true;
			return false;
		}
		gl.useProgram(program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, 0);
		
		gl.activeTexture(gl.TEXTURE1);
		if (parentTexture != null) {
			gl.bindTexture(gl.TEXTURE_2D, parentTexture);
		} else {
			// we have to bind something that is not null and not renderTexture
			gl.bindTexture(gl.TEXTURE_2D, refOrbitTexture);
		}
		if (first) {
			iteration1();
			first = false;
		}
		//view = {x: 650, y:300, w:400, h:300};
		// todo GL_MAX_VIEWPORT_DIMS
		gl.viewport(view.x, view.y, view.w, view.h);
		//console.log('viw', view);

		gl.uniform4f(gl.getUniformLocation(program, "viewport"),
			2*view.x/bufParam.h - bufParam.ratio,
			2*view.y/bufParam.h - 1,
			2*(view.w)/bufParam.h,
			2*(view.h)/bufParam.h
		);

		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		var count = 6;
		gl.drawArrays(primitiveType, offset, count);
		return true;
	};
	return job;
}

c.init = function() {
	renderTexture = createRenderTexture(gl, bufParam.w, bufParam.h);
	c.renderTexture = renderTexture;
	program = createProgram1();
	c.program = program; // todo

	gl.activeTexture(gl.TEXTURE0);
	refOrbitTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, refOrbitTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, 1024, 1024, 0, gl.RG, gl.FLOAT, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	orbitArray = new Float32Array(1024*1024*2);

	gl.useProgram(program);
	gl.uniform1i(gl.getUniformLocation(program, "refOrbit"), 0);
	gl.uniform1i(gl.getUniformLocation(program, "parent"), 1);
	if (parentTexture == null) {
		gl.uniform1i(gl.getUniformLocation(program, "haveParent"), 0);
	} else {
		gl.uniform1i(gl.getUniformLocation(program, "haveParent"), 1);
	}
	
	c.reset(eye);
}

function glUpdateRefOrbit(array, orbitLen) {	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(gl.getUniformLocation(program, "refOrbit"), 0);
	gl.bindTexture(gl.TEXTURE_2D, refOrbitTexture);
	var t0 = performance.now();
	gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 512, gl.RG, gl.FLOAT, array);
	var dt = performance.now() - t0;
	gl.uniform1i(gl.getUniformLocation(program, "refOrbitLen"), orbitLen);
	//console.log("perf", orbitLen, dt);
}

function setUniforms() {
	gl.uniform1f(gl.getUniformLocation(program, "screenAspectRatio"), bufParam.w / bufParam.h);
	gl.uniform1f(gl.getUniformLocation(program, "scale"), eye.scale);
	gl.uniform1f(gl.getUniformLocation(program, "one"), 1.0);
	glUniformD(gl.getUniformLocation(program, "offsetX"), eye.offsetX);
	glUniformD(gl.getUniformLocation(program, "offsetY"), eye.offsetY);
	gl.uniform1i(gl.getUniformLocation(program, "iterations"), eye.iterations);
}

c.drawDirect = function() {
	gl.clearColor(1, 0, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.useProgram(program);
	
	if (false) {
		var orbitLen = mandelOrbit(Game.vars.offsetX, Game.vars.offsetY, Game.vars.iterations, orbitArray);
		//var orbit = testOrbit();
		glUpdateRefOrbit(orbitArray, orbitLen);
	}

	gl.uniform4f(gl.getUniformLocation(program, "viewport"), -bufParam.ratio, -1, 2*bufParam.ratio, 2);
	var primitiveType = gl.TRIANGLES;
	var offset = 0;
	var count = 6;
	gl.drawArrays(primitiveType, offset, count);
		c.done = true;
}

c.computeAll = function() {
	job = newJob();
	for(var i = 0; i < 1000; i++) {
		if (!job.iteration()) {
			return;
		}
	}
		c.done = true;
	alert('too many iterations');
}

var maxSyncTout = gl.getParameter(gl.MAX_CLIENT_WAIT_TIMEOUT_WEBGL);

c.computeSome = function(callback) {
	// todo handle lost context
	var worstCaseIterationsPerMs = 16216216;
	var maxWorkTime = 200;
	var maxIterationsPerCall = 100*100*eye.iterations;
	var ncalls = Math.max(1, Math.floor(maxWorkTime*worstCaseIterationsPerMs / maxIterationsPerCall));
	var calls = 0;
	var waitPeriod = 1;
	var timeUsed = 0;
	var sync;
	var startTime = performance.now();
	if (1 == 1) {
		ncalls = 1;
		waitPeriod = 5;
	}
	
	if (job.done) {
		trace('comp', 'doneq');
		c.done = true;
		callback(true);
		return;
	}
	
	function blast() {
		trace('comp', 'blast', ncalls, eye);
		//callsTime = performance.now();
		const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
		sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
		for (var i = 0; i < ncalls && !job.done; i++) {
			job.iteration();
			calls++;
		}
		gl.flush();
		setTimeout(timerCb, waitPeriod);
	}
	
	function timerCb() {
		var status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
		if (status != gl.SIGNALED) {
			trace('comp', 'zzz');
			setTimeout(timerCb, waitPeriod);
		} else {
			gl.deleteSync(sync);
			var now = performance.now();
			if (job.done) {
				trace('comp', 'done', performance.now() - startTime);
				c.done = true;
				callback(true);
				return;
			}
			trace('comp', 'uvi', );
			callback(false);
		}
	}
	
	blast();
}

c.getTexture = function() {
	return renderTexture;
}

c.isDone = function() {
	return job.done;
}

c.getDrawingEye = function() {
	return c.drawingEye;
}

return c;
}
