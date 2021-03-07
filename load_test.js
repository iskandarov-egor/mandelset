
var blackEye = {
    scale: 1/5.559917313492236,
	offsetX: ns.init(-0.123880123476094672341218938527),
	offsetY: ns.init(1),
	previewScale: 1,
	iterations: 100,
};

function timoutLoop (interval, f, cb) {
    function timer() {
        var goOn = f();
		if (goOn) {
            trace('ltest', 'goon');
            setTimeout(timer, interval);
        } else {
            cb();
        };
	};
    timer();
};

// on my gpu iterations*w*h = 50000000 take about 1/60 of a second to complete

class LoadTester {
    constructor(gl) {
        var fbuffer = gl.createFramebuffer();
        this.eye = cloneEye(blackEye);
        this.gl = gl;
        var compArg = {
            gl: gl,
            eye: this.eye,
            buffer: {
                w: 100,
                h: 100,
            },
            frameBuffer: fbuffer,
            //_orbitLenLimit: 1,
        };
        this.computer = new M.Computer(compArg);
        this.computer.init();
        //this.computer.reset(this.eye);
        this.iterationsPerMs = 1000;
    }
    
    load(iterations, cb) {
        var eye = cloneEye(blackEye);
        eye.iterations = iterations / 100 / 100;
        this.computer.reset(eye);
        var gl = this.gl;
        var startTime = performance.now();
        this.computer.computeAll();
        var sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        console.log(gl.getSyncParameter(sync, gl.SYNC_STATUS) == gl.SIGNALED);
        
        function f() {
            var status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
			return status != gl.SIGNALED;
        }
        
        function _cb() {
            gl.deleteSync(sync);
            cb(performance.now() - startTime);
        }
        timoutLoop(1, f, _cb);
    }
    
    load_and_print(iterations) {
        function cb(dt) {
            console.log('dt', dt);
        }
        this.load(iterations, cb);
    }
    
    doSomeTesting(cb, timeLimit) {
        var startTime = performance.now();
        while (1) {
            
        };
    }
        
    _debug_overload() {
        this.eye.iterations = 10000000;
        this.computer.reset(this.eye);
        var now = performance.now();
        canvas.addEventListener("webglcontextlost", function(event) {
            var dt = performance.now() - now;
            console.log('lost context after ms', dt);
        }, false);
        this.computer.computeAll();
        gl.flush();
    }
    
    getIterationsPerMs() {
    }
};


M.LoadTester = LoadTester;
