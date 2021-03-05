
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
    markers: true,
};

var scanner_window = 100;

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
		this.bufParam = {
			w: args.buffer.w,
			h: args.buffer.h,
			ratio: args.buffer.w/args.buffer.h,
		};
		
		this.refOrbitFinder = new M.mandel.OrbitFinder(1);
		this.job = new Job(gl, this.bufParam);
        this.overlay = new M.CanvasOverlay(document.getElementById('canvas1'));
        this._orbitLenLimit = args._orbitLenLimit;
	}
	
	// sets a new draw target. abandons the previous one and does not wait for its completion.
	// basically a soft version of 'init'. reinitializes itself, except for some heavy non-changing webgl components.
	// returns the texture with results so far.
	reset(newEye) {
		var gl = this.gl;
		this.eye = cloneEye(newEye);  // todo maybe we only need eye in job
		
		M.Stat.Computer.lastTimingStart = performance.now();
        
        this.updateRefOrbit();
		this.job.reset(newEye, this.refOrbitFinder.getBestComputer());
        this.drawingEye = this.eye;
	}
	
	init() {
        this.job.init();
		this.reset(this.eye); // todo not good remove this
	}
    		
	computeAll() {
		this.job.iterate(100000);
		
        if (!this.job.done) {
            alert('too many iterations');
        }
	}
	
	getTexture() {
		return this.job.renderTexture;
	}
	
	// todo why not simply getEye?
	getDrawingEye() {
		return this.drawingEye;
	}
	
	computeSome(callback) {
		var gl = this.gl;
		
		var waitPeriod = 1;
		if (d.superSlow) {
			waitPeriod = 5;
		}
		var sync;
		var timerQ;
		var startTime = performance.now();
		var that = this;
		
		if (this.job.done) {
			trace('comp', 'doneq');
			callback(true);
			return;
		}
				
		function blast() {
			trace('comp', 'blast');
            
			const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
			timerQ = gl.createQuery();
            
			gl.beginQuery(ext.TIME_ELAPSED_EXT, timerQ);
            that.job.iterate(1);
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
                    gl.deleteQuery(timerQ);
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
	
	updateRefOrbit() {
        var that = this;
        function eyeWindow(e) {
            var w = ns.init(that.bufParam.ratio * e.scale);
            var h = ns.init(e.scale);
            return [
                ns.sub(e.offsetX, w),
                ns.sub(e.offsetY, h),
                ns.add(e.offsetX, w),
                ns.add(e.offsetY, h),
            ];
        }
        var gl = this.gl;
        
        var window = eyeWindow(this.eye);
        var iterLimit = (this._orbitLenLimit) ? this._orbitLenLimit : this.eye.iterations;
        this.refOrbitFinder.search(window[0], window[1], window[2], window[3], iterLimit);
        
        this.overlay.clear();
        for (var i = 0; i < this.refOrbitFinder.computers.length; i++) {
            var c = this.refOrbitFinder.computers[i];
            this.overlay.addMarker(c.x, c.y, 'yellow');
        }
	}
	
	isDone() {
		return this.job.done;
	}
}

// a job is a small class that handles iterative drawing in small windows.
class Job {
    constructor(gl, bufParam) {
        this.gl = gl;
        this.bufParam = bufParam;
        this.done = false;
        this.program = M.game_gl.createProgram1();
        this.fbuffer = gl.createFramebuffer();
    }
    
    init() {
        this.renderTexture = M.gl_util.createRenderTexture(gl, this.bufParam.w, this.bufParam.h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderTexture, 0);
        gl.clearBufferuiv(gl.COLOR, 0, clearColor);
    }
    
    // orbitComputer should contain a computed orbit
    reset(eye, orbitComputer) {
        this.orbitComputer = orbitComputer;
        this.eye = cloneEye(eye);
        this.done = false;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
        gl.clearBufferuiv(gl.COLOR, 0, clearColor);
        
        gl.useProgram(this.program);
		gl.uniform1f(gl.getUniformLocation(this.program, "screenAspectRatio"), this.bufParam.ratio);
		gl.uniform1f(gl.getUniformLocation(this.program, "scale"), this.eye.scale);
		gl.uniform1f(gl.getUniformLocation(this.program, "one"), 1.0);
		M.gl_util.glUniformD(gl.getUniformLocation(this.program, "offsetX"), ns.number(this.eye.offsetX));
		M.gl_util.glUniformD(gl.getUniformLocation(this.program, "offsetY"), ns.number(this.eye.offsetY));
		gl.uniform1i(gl.getUniformLocation(this.program, "iterations"), this.eye.iterations);
        if (this.isPyramidLayer) {
			gl.uniform1i(gl.getUniformLocation(this.program, "isPyramidLayer"), 1);
		} else {
			gl.uniform1i(gl.getUniformLocation(this.program, "isPyramidLayer"), 0);
		}
        
		gl.uniform1i(gl.getUniformLocation(this.program, "refOrbit"), 0);
		gl.uniform1i(gl.getUniformLocation(this.program, "refOrbitLen"), orbitComputer.iterations);
        gl.uniform1f(gl.getUniformLocation(this.program, "refOrbitEyeOffsetX"), ns.number(ns.sub(this.eye.offsetX, orbitComputer.x)));
        gl.uniform1f(gl.getUniformLocation(this.program, "refOrbitEyeOffsetY"), ns.number(ns.sub(this.eye.offsetY, orbitComputer.y)));
        
        var superSlowGPUIterationsPerMs = 10000000; // how many iterations should any gpu be able to execute (with no ref orbit)
		var maxWorkTime = 1000 / 60 / 2; // how much time can we keep the gpu busy before letting it sleep
        var conservativePixelsPerMs = superSlowGPUIterationsPerMs / this.eye.iterations; // how many pixels can we draw before sleeping
        var window_size = Math.max(1, Math.floor(Math.sqrt(maxWorkTime * conservativePixelsPerMs)));
        this.scanner = newBlockScanner(this.bufParam.w, this.bufParam.h, window_size);
        if (d.oneIter) {
            this.scanner = newBlockScanner(this.bufParam.w, this.bufParam.h, 1000000);
        }
        console.log('wsize', window_size, conservativePixelsPerMs, maxWorkTime * conservativePixelsPerMs);
    }
    
    iterate(n) {
        this._setup();
        var i;
        for (i = 0; i < n && !this.done; i++) {
            this._iteration();
        }
        return i;
    }
    
    _setup() {
        var gl = this.gl;
        gl.useProgram(this.program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
        gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.orbitComputer.getTexture(gl));
    }
    
    _iteration() {
        var gl = this.gl;
		var view = this.scanner.next();
		if (view == null) {
			this.done = true;
			return;
		}
		
		//view = {x: 650, y:300, w:400, h:300};
		// todo GL_MAX_VIEWPORT_DIMS
		gl.viewport(view.x, view.y, view.w, view.h);

		gl.uniform4f(gl.getUniformLocation(this.program, "viewport"),
			2*view.x/this.bufParam.h - this.bufParam.ratio,
			2*view.y/this.bufParam.h - 1,
			2*(view.w)/this.bufParam.h,
			2*(view.h)/this.bufParam.h
		);

		gl.drawArrays(gl.TRIANGLES, 0, 6);
		return true;
    }
}


M.Computer = Computer;