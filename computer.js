
// - internally uses texture unit 0.
// - requires unit square values in vertex attribute 0.
// - requires gloval variable 'program' with the main webgl program
// - must be initialized with a call to init() before use.

var maxSyncTout;

M.Stat = {
	Computer: {
		lastTimingStart: 0,
		lastTiming: 0,
	},
	callback: function(){},
};

var d = {
	superSlow: false,
	oneIter: false,
	iterLimit: null,
};

var clearColor = new Uint32Array(4);
clearColor[0] = 0;
clearColor[1] = 0xFFFFFFFF;
clearColor[2] = 0;
clearColor[3] = 0;

class Computer {
	
	// args:
	// gl: -
	// isPyramidLayer: for optimization. if true, computer will know that it is part of a pyramid computer and
	//                 will skip computing the central pixel in each 9x9 block, but will use the existing pixel
	//                 value in the @framebuffer
	// eye: -
	// framebuffer: the WebGLFramebuffer object of the destination buffer.
	// bufParam:
	//   w, h: width and height of the @framebuffer
	constructor(args) {
		this.gl = args.gl;
		
		this.isPyramidLayer = args.isPyramidLayer;
		maxSyncTout = gl.getParameter(gl.MAX_CLIENT_WAIT_TIMEOUT_WEBGL);
		this.eye = cloneEye(args.eye);
		this.drawingEye = cloneEye(this.eye);
		this.bufParam = {
			w: args.buffer.w,
			h: args.buffer.h,
			ratio: args.buffer.w/args.buffer.h,
		};
		this.fbuffer = args.frameBuffer;
		this.renderTexture = null;
		this.program = null;
		this.refOrbitTexture = null;
		this.orbitArray = null;
		this.job = null;
	}
	
	// sets a new draw target. abandons the previous one and does not wait for its completion.
	// basically a soft version of 'init'. reinitializes itself, except for some heavy non-changing webgl components.
	// returns the texture with results so far. this texture is valid until the next call to 'reset', when it will be
	// swapped back.
	reset(newEye) {
		var gl = this.gl;
		this.eye = cloneEye(newEye);
		
		var ret = this.renderTexture;
		//this.renderTexture = this.renderTextureSwap;
		//this.renderTextureSwap = ret;
		
		gl.useProgram(this.program);
		this.setUniforms();
		this.job = newJob(this);
		this.done = false;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderTexture, 0);

		//gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		gl.clearBufferuiv(gl.COLOR, 0, clearColor);
		this.drawingEye = cloneEye(this.eye);
		M.Stat.Computer.lastTimingStart = performance.now()
		
		return ret;
	}
	
	init() {
		var gl = this.gl;
		this.renderTexture = M.gl_util.createRenderTexture(gl, this.bufParam.w, this.bufParam.h);
		this.renderTextureSwap = M.gl_util.createRenderTexture(gl, this.bufParam.w, this.bufParam.h);
		this.program = M.game_gl.createProgram1();

		/* create orbit texture */
		gl.activeTexture(gl.TEXTURE0);
		this.refOrbitTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.refOrbitTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, 1024, 1024, 0, gl.RG, gl.FLOAT, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		this.orbitArray = new Float32Array(1024*1024*2);

		gl.useProgram(this.program);
		gl.uniform1i(gl.getUniformLocation(this.program, "refOrbit"), 0);
		if (this.isPyramidLayer) {
			gl.uniform1i(gl.getUniformLocation(this.program, "isPyramidLayer"), 1);
		} else {
			gl.uniform1i(gl.getUniformLocation(this.program, "isPyramidLayer"), 0);
		}
		
		this.reset(this.eye);
	}
	
	setUniforms() {
		var gl = this.gl;
		gl.uniform1f(gl.getUniformLocation(this.program, "screenAspectRatio"), this.bufParam.w / this.bufParam.h);
		gl.uniform1f(gl.getUniformLocation(this.program, "scale"), this.eye.scale);
		gl.uniform1f(gl.getUniformLocation(this.program, "one"), 1.0);
		M.gl_util.glUniformD(gl.getUniformLocation(this.program, "offsetX"), ns.number(this.eye.offsetX));
		M.gl_util.glUniformD(gl.getUniformLocation(this.program, "offsetY"), ns.number(this.eye.offsetY));
		gl.uniform1i(gl.getUniformLocation(this.program, "iterations"), this.eye.iterations);
	}
	
	computeAll() {
		this.job = newJob(this);
		for(var i = 0; i < 1000; i++) {
			if (!this.job.iteration()) {
				return;
			}
		}
		this.done = true;
		alert('too many iterations');
	}
	
	getTexture() {
		return this.renderTexture;
	}
	
	// todo why?
	getDrawingEye() {
		return this.drawingEye;
	}
	
	computeSome(callback) {
		var gl = this.gl;
		// todo handle lost context
		var worstCaseIterationsPerMs = 16216216;
		var maxWorkTime = 200;
		var maxIterationsPerCall = 100*100*this.eye.iterations;
		var ncalls = Math.max(1, Math.floor(maxWorkTime*worstCaseIterationsPerMs / maxIterationsPerCall));
		var calls = 0;
		var waitPeriod = 1;
		var timeUsed = 0;
		var sync;
		var timerQ;
		var startTime = performance.now();
		if (d.superSlow) {
			ncalls = 1;
			waitPeriod = 5;
		}
		
		if (this.job.done) {
			trace('comp', 'doneq');
			this.done = true;
			callback(true);
			return;
		}
				
		var that = this;
		
		function blast() {
			trace('comp', 'blast', ncalls, that.eye);
			//callsTime = performance.now();
			const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
			timerQ = gl.createQuery();
			gl.beginQuery(ext.TIME_ELAPSED_EXT, timerQ);
			for (var i = 0; i < ncalls && !that.job.done; i++) {
				that.job.iteration();
				calls++;
			}
			gl.endQuery(ext.TIME_ELAPSED_EXT);
			
			sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
			gl.flush();
			setTimeout(timerCb, waitPeriod);
		}
		
		function timerCb() {
			var status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
			if (status != gl.SIGNALED) {
				trace('comp', 'zzz');
				setTimeout(timerCb, waitPeriod);
			} else {
				const available = gl.getQueryParameter(timerQ, gl.QUERY_RESULT_AVAILABLE);
				if (available) {
					M.Stat.Computer.GLTimer = gl.getQueryParameter(timerQ, gl.QUERY_RESULT) / 1e6;
				} else {
					M.Stat.Computer.GLTimer = 'unavail';
				}
				
				gl.deleteSync(sync);
				var now = performance.now();
				if (that.job.done) {
					trace('comp', 'done');
					that.done = true;
					M.Stat.Computer.lastTiming = performance.now() - M.Stat.Computer.lastTimingStart;
					callback(true);
					return;
				}
				trace('comp', 'uvi', );
				callback(false);
			}
		}
		
		blast();
	}
	
	updateRefOrbit(array, orbitLen) {
		var gl = this.gl;
		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(gl.getUniformLocation(this.program, "refOrbit"), 0);
		gl.bindTexture(gl.TEXTURE_2D, this.refOrbitTexture);
		var t0 = performance.now();
		gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 512, gl.RG, gl.FLOAT, array);
		var dt = performance.now() - t0;
		gl.uniform1i(gl.getUniformLocation(this.program, "refOrbitLen"), orbitLen);
		//console.log("perf", orbitLen, dt);
	}
	
	isDone() {
		return this.job.done;
	}
}


// a job is a small 'submodule' that handles the drawing in small iterations.
function newJob(c) {
	var job = {
		done: false,
	};
	var first = true;
	var iters = 0;
	function iteration1() {
		//var orbitLen = mandelOrbit(ns.number(c.eye.offsetX), ns.number(c.eye.offsetY), c.eye.iterations, c.orbitArray);
		var orbitLen = mandelOrbitNS(c.eye.offsetX, c.eye.offsetY, c.eye.iterations, c.orbitArray);
		c.updateRefOrbit(c.orbitArray, orbitLen);
		
		//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		//gl.clearColor(1, 0, 1, 1);
		//gl.clear(gl.COLOR_BUFFER_BIT);
	};
	
	var scanner = newBlockScanner(c.bufParam.w, c.bufParam.h, 100);
	if (d.oneIter) {
		scanner = newBlockScanner(c.bufParam.w, c.bufParam.h, 1000000);
	}
	job.iteration = function() {
		var gl = c.gl;
		var view = scanner.next();
		if (view == null) {
			job.done = true;
			return false;
		}
		if (d.iterLimit && d.iterLimit <= iters) {
			job.done = true;
			return true;
		}
		iters++;
		gl.useProgram(c.program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, c.fbuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, c.renderTexture, 0);
		
		gl.activeTexture(gl.TEXTURE1);
		if (c.parentTexture != null) {
			gl.bindTexture(gl.TEXTURE_2D, c.parentTexture);
		} else {
			// we have to bind something that is not null and not renderTexture
			gl.bindTexture(gl.TEXTURE_2D, c.refOrbitTexture);
		}
		if (first) {
			iteration1();
			first = false;
		}
		//view = {x: 650, y:300, w:400, h:300};
		// todo GL_MAX_VIEWPORT_DIMS
		gl.viewport(view.x, view.y, view.w, view.h);
		//console.log('viw', view.x, view.y, view.w, view.h, 2*view.x/c.bufParam.h - c.bufParam.ratio,
		//	2*view.y/c.bufParam.h - 1,
		//	2*(view.w)/c.bufParam.h,
		//	2*(view.h)/c.bufParam.h);

		gl.uniform4f(gl.getUniformLocation(c.program, "viewport"),
			2*view.x/c.bufParam.h - c.bufParam.ratio,
			2*view.y/c.bufParam.h - 1,
			2*(view.w)/c.bufParam.h,
			2*(view.h)/c.bufParam.h
		);

		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		var count = 6;
		gl.drawArrays(primitiveType, offset, count);
		return true;
	};
	return job;
}


M.Computer = Computer;