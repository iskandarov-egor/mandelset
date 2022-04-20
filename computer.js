
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
    //orbit: [ns.init(-0.7106313570184799), ns.init(0.2893887960509232)],
    //orbit: [ns.init(-0.7106313570184888), ns.init(0.2893887960509253)],
    
};

var scanner_window = 100;

var clearColor = new Uint32Array(4);
clearColor[0] = 0;
clearColor[1] = 0xFFFFFFFF;
clearColor[2] = 0;
clearColor[3] = 0;

var STATE_INITIAL = 1;
var STATE_ORBIT = 2;
var STATE_DRAW = 3;

class Computer {
    
    // args:
    // gl: -
    // framebuffer: the WebGLFramebuffer object of the destination buffer.
    // refOrbitFinder: if provided, will use this one.
    // bufParam:
    //   w, h: width and height of the @framebuffer
    constructor(args) {
        this.gl = args.gl;
        var gl = this.gl;
        
        maxSyncTout = gl.getParameter(gl.MAX_CLIENT_WAIT_TIMEOUT_WEBGL);
        this.bufParam = {
            w: args.buffer.w,
            h: args.buffer.h,
            ratio: args.buffer.w/args.buffer.h,
        };
        
        if (args.refOrbitFinder) {
            this.refOrbitFinder = args.refOrbitFinder;
        } else {
            this.refOrbitFinder = new M.mandel.OrbitFinder(1);
        }
        this.job = new Job(gl, this.bufParam, this.isPyramidLayer);
        this.overlay = new M.CanvasOverlay(document.getElementById('canvas1'));
        this.overlay.addLiveCallback(overlay => this.overlayCallback(overlay));
        this._orbitLenLimit = args._orbitLenLimit;
        this.jobReset = false;
        this.state = STATE_INITIAL;
    }
    
    // sets a new draw target. abandons the previous one and does not wait for its completion.
    // 
    // sampleShift is an extra transformation to the sample point coordinates.
    // the sample point coordinates are initially in the centers of pixels
    // and so range from (0.5, 0.5) to (width - 0.5, height - 0.5) inclusive.
    // the transformation is: sampleCoordinate * shift.scale + shift.xy
    // using sampleShift is better than simply shifting the eye, because the shift may be smaller the
    // precision of the eye position.
    // 
    // opts.isPyramidLayer: if true, computer will know that it is part of a pyramid computer and
    // will skip computing the central pixel in each 9x9 block, but will use the existing pixel
    // value in the @framebuffer
    reset(newEye, sampleShift = {x: 0, y: 0, scale: 1}, opts = {}) {
        var gl = this.gl;
        this.sampleShift = sampleShift;
        this.eye = newEye.clone();
        this.isPyramidLayer = opts.isPyramidLayer === true;
        
        M.Stat.Computer.lastTimingStart = performance.now();
        
        this.updateRefOrbit();
        var orbitComputer = this.refOrbitFinder.getBestComputer();
        if (d.orbit) {
            orbitComputer.compute(d.orbit[0], d.orbit[1], newEye.iterations);
        }
        this.state = STATE_ORBIT;
    }
    
    init() {
        this.job.init();
    }
    
    isTextureDirty() {
        return (!this.drawingEye) || (this.eye != this.drawingEye);
    }
    
    getTexture() {
        return this.job.renderTexture;
    }
    
    getDrawingEye() {
        return (this.drawingEye) ? this.drawingEye : this.eye;
    }
    
    computeSome(callback, timeLimit) {
        var gl = this.gl;
        
        var waitPeriod = 1;
        if (d.superSlow) {
            waitPeriod = 100;
        }
        var sync;
        var timerQ;
        var startTime;
        var that = this;
        
        if (this.state >= STATE_DRAW && this.job.done) {
            trace('comp', 'doneq');
            callback(true);
            return;
        }
        
        function blast() {
            startTime = performance.now();
            trace('comp', 'blast');
            
            //const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
            //timerQ = gl.createQuery();
            
            //gl.beginQuery(ext.TIME_ELAPSED_EXT, timerQ);
            that.job.iterate(1);
            //gl.endQuery(ext.TIME_ELAPSED_EXT);
            
            sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
            gl.flush();
            setTimeout(timerCb, waitPeriod);
        }
        
        function timerCb() {
            if (gl.isContextLost()) {
                return;
            }
            var status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
            if (!that.job.done && status != gl.SIGNALED) {
                trace('comp', 'zzz');
                setTimeout(timerCb, waitPeriod);
            } else {
                //const available = gl.getQueryParameter(timerQ, gl.QUERY_RESULT_AVAILABLE);
                
                gl.deleteSync(sync);
                var now = performance.now();
                if (that.job.done) {
                    trace('comp', 'done');
                    that.done = true;
                    M.Stat.Computer.lastTiming = performance.now() - M.Stat.Computer.lastTimingStart;
                    callback(true);
                    return;
                }
                trace('comp', 'uvi');
                
                var now = performance.now();
                if (timeLimit > now + now - startTime) {
                    // have time for some more work
                    blast();
                    return;
                }
                callback(false);
            }
        }
        
        if (this.state == STATE_ORBIT && this.refOrbitFinder.searchSome()) {
            callback(false);
        } else {
            if (this.state == STATE_ORBIT) {
                if (!this.isPyramidLayer) {
                    this.job.clear();
                }
                this.job.reset(this.eye, this.refOrbitFinder.getBestComputer(), this.sampleShift);
                this.state = STATE_DRAW;
                this.drawingEye = this.eye;
            }
            blast();
        }
    }
    
    getProgress() {
        return (this.state == STATE_ORBIT) ? ['finding a reference orbit', this.refOrbitFinder.getProgress()] : ['rendering', this.job.getProgress()];
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
        this.refOrbitFinder.setWindow(window[0], window[1], window[2], window[3], iterLimit);
        this.refOrbitFinder.searchSome();
    }
    
    overlayCallback(overlay) {
        overlay.clear();
        var c = this.refOrbitFinder.computer;
        if (c.isReady()) {
            overlay.addMarker(c.x, c.y, 'yellow');
        }
    }
    
    getOverlays() {
        return [this.overlay];
    }
    
    isDone() {
        return this.state == STATE_DRAW && this.job.done;
    }
}

// a job is a small class that handles iterative drawing in small windows.
class Job {
    constructor(gl, bufParam, isPyramidLayer) {
        this.gl = gl;
        this.bufParam = bufParam;
        this.isPyramidLayer = isPyramidLayer;
        this.done = false;
        this.program = M.gl_resources.createProgram1(gl);
        this.fbuffer = gl.createFramebuffer();
    }
    
    init() {
        var gl = this.gl;
        this.renderTexture = M.gl_resources.createRenderTexture(gl, this.bufParam.w, this.bufParam.h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderTexture, 0);
        gl.clearBufferuiv(gl.COLOR, 0, clearColor);
    }
    
    clear() {
        var gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
        gl.clearBufferuiv(gl.COLOR, 0, clearColor);
    }
    
    getProgress() {
        return (this.scanner) ? this.scanner.getProgress() : 0;
    }
    
    // orbitComputer should contain a computed orbit
    reset(eye, orbitComputer, sampleShift) {
        var gl = this.gl;
        this.orbitComputer = orbitComputer;
        this.eye = eye.clone();
        this.done = false;
        
        gl.useProgram(this.program);
        gl.uniform1f(gl.getUniformLocation(this.program, "bufferAspectRatio"), this.bufParam.ratio);
        gl.uniform1f(gl.getUniformLocation(this.program, "bufferW"), this.bufParam.w);
        gl.uniform1f(gl.getUniformLocation(this.program, "bufferH"), this.bufParam.h);
        gl.uniform1f(gl.getUniformLocation(this.program, "scale"), this.eye.scale);
        gl.uniform1f(gl.getUniformLocation(this.program, "one"), 1.0);
        M.gl_util.glUniformD(gl, gl.getUniformLocation(this.program, "offsetX"), ns.number(this.eye.offsetX));
        M.gl_util.glUniformD(gl, gl.getUniformLocation(this.program, "offsetY"), ns.number(this.eye.offsetY));
        gl.uniform1i(gl.getUniformLocation(this.program, "iterations"), this.eye.iterations);
        if (this.isPyramidLayer) {
            gl.uniform1i(gl.getUniformLocation(this.program, "isPyramidLayer"), 1);
        } else {
            gl.uniform1i(gl.getUniformLocation(this.program, "isPyramidLayer"), 0);
        }
        
        var pixelSize = 2.0 / this.bufParam.h;
        gl.uniform1i(gl.getUniformLocation(this.program, "refOrbit"), 0);
        gl.uniform1i(gl.getUniformLocation(this.program, "refOrbitLen"), orbitComputer.iterations);
        gl.uniform1f(gl.getUniformLocation(this.program, "refOrbitEyeOffsetX"), ns.number(ns.sub(this.eye.offsetX, orbitComputer.x)));
        gl.uniform1f(gl.getUniformLocation(this.program, "refOrbitEyeOffsetY"), ns.number(ns.sub(this.eye.offsetY, orbitComputer.y)));
        gl.uniform1f(gl.getUniformLocation(this.program, "sampleShiftX"), sampleShift.x);
        gl.uniform1f(gl.getUniformLocation(this.program, "sampleShiftY"), sampleShift.y);
        gl.uniform1f(gl.getUniformLocation(this.program, "sampleShiftScale"), sampleShift.scale);
        
        var myGPUIterationsPerMs = 18750000; // how many iterations my gpu is able to execute per ms (with no ref orbit)
        var slowGPUIterationsPerMs = myGPUIterationsPerMs / 4; // how many iterations should any gpu be able to execute per ms (with no ref orbit)
        var refOrbitSpeedup = 4; // how many times faster the rendering with a reference orbit is
        var maxWorkTime = 1000 / 60 / 2; // how much time can we keep the gpu busy before letting it sleep
        var conservativePixelsPerMs = slowGPUIterationsPerMs / this.eye.iterations; // how many pixels can we draw before sleeping
        conservativePixelsPerMs = conservativePixelsPerMs + conservativePixelsPerMs*(refOrbitSpeedup - 1)*(orbitComputer.iterations/this.eye.iterations);
        if (this.isPyramidLayer) {
            conservativePixelsPerMs *= 9/8;
        }
        
        // TODO: ugly global game variable
        var aggressiveness = (game.aggressiveness >= 5) ? 1 + (game.aggressiveness - 5) * 2 : game.aggressiveness / 5;
        var window_size = Math.max(1, Math.floor(Math.sqrt(maxWorkTime * conservativePixelsPerMs * aggressiveness)));
        this.scanner = M.utils.newBlockScanner(this.bufParam.w, this.bufParam.h, window_size);
        if (d.oneIter) {
            this.scanner = newBlockScanner(this.bufParam.w, this.bufParam.h, 1000000);
        }
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
        
        gl.viewport(view.x, view.y, view.w, view.h);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return true;
    }
}


M.Computer = Computer;
