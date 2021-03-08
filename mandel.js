
M.mandel = {};

var ns = M.ns.ns;

function mandelOrbit(cx, cy, iterations, array) {
    var x = 0.0;
    var y = 0.0;
    for (var i = 0; i < iterations; i++) {
		var xx = x*x;
		var yy = y*y;
        array[2*i] = x;
        array[2*i + 1] = y;
		if (xx + yy > 4) {
			return i;
		}
        var x2 = xx - yy + cx;
        y = 2.0 * x * y + cy;
        x = x2;
    }
    return iterations;
}

function newMandelOrbitIterator(cx, cy, iterations, array) {
    var x = ns.init(0.0);
    var y = ns.init(0.0);
    var i = 0;
    return function() {
        for (var j = 0; j < 10000; j++) {
            var nx = ns.number(x);
            var ny = ns.number(y);
            var xx = ns.mul(x, x);
            var yy = ns.mul(y, y);
            array[2*i] = nx;
            array[2*i + 1] = ny;
            if (nx*nx + ny*ny > 10000) {
                //console.log('uuyyy', i, ns.number(cx));
                //globalOverlay.addMarker(cx, cy, 'lime');
                return i;
            }
            var x2 = ns.add(ns.sub(xx, yy), cx);
            y = ns.add(ns.mul(ns.mul(ns.init(2.0), x), y), cy);
            x = ns.clone(x2);
            i++;
            if (i >= iterations) {
                //console.log('uuyyy', i);
                return i;
            }
        }
        return null;
    }
}

function mandelOrbitNS(cx, cy, iterations, array) {
    var x = ns.init(0.0);
    var y = ns.init(0.0);
    for (var i = 0; i < iterations; i++) {
        var nx = ns.number(x);
        var ny = ns.number(y);
        var xx = ns.mul(x, x);
        var yy = ns.mul(y, y);
        array[2*i] = nx;
        array[2*i + 1] = ny;
        if (nx*nx + ny*ny > 4) {
            return i;
        }
        var x2 = ns.add(ns.sub(xx, yy), cx);
        y = ns.add(ns.mul(ns.mul(ns.init(2.0), x), y), cy);
        x = ns.clone(x2);
    }
    return iterations;
}

class OrbitComputer {
    constructor() {
        this.array = new Float32Array(1024*1024*2);
        this.iterations = null;
        this.textureUpdated = false;
        this.texture = null;
        this.iterator = null;
        this.ready = false;
    }
    
    compute2(x, y, iterLimit) {
        this.iterLimit = iterLimit;
        if (iterLimit > 1024*1024) {
            alert('todo2');
        }
        this.textureUpdated = false;
        this.x = x;
        this.y = y;
        var startTime = performance.now();
        this.iterations = mandelOrbitNS(x, y, this.iterLimit, this.array);
        console.log('dt', performance.now() - startTime);
        return this.iterations;
    }
    
    reset(x, y, iterLimit) {
        if (iterLimit > 1024*1024) {
            alert('todo2');
        }
        this.textureUpdated = false;
        this.x = x;
        this.y = y;
        this.iterator = newMandelOrbitIterator(x, y, iterLimit, this.array);
    }
    
    computeSome() {
        var startTime = performance.now();
 
        while (1) {
            this.iterations = this.iterator();
            if (this.iterations == null) {
                var now = performance.now();
                if (now - startTime > 1) {
                    return true;
                }
            } else {
                this.iterator = null;
                this.ready = true;
                return false;
            }
        };
    }
    
    computeAll() {
        while (this.computeSome()) {};
    }
    
    isReady() {
        return this.ready;
    }
    
    // computing must be finished before calling this function
    getTexture(gl) {
        if (!this.ready) {
            alert('panic');
        }
        if (this.texture == null) {
            this.texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, 1024, 1024, 0, gl.RG, gl.FLOAT, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        }
        if (this.textureUpdated == false) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            var height = Math.ceil(this.iterations / 1024);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, height, gl.RG, gl.FLOAT, this.array);
            this.textureUpdated = true;
        }
        return this.texture;
    }
}

function ns_lerp(a, b, x) {
    return ns.add(a, ns.mul(ns.init(x), ns.sub(b, a)));
}

function guessOrbitUniform(window) {
    return {
        x: ns_lerp(window.x1, window.x2, Math.random()()),
        y: ns_lerp(window.y1, window.y2, Math.random()()),
    }
}

function guessOrbitCenterBias(window) {
    function biasedRandom() { // linearly biased towards the center
        var r = Math.random();
        if (r <= 0.5) {
            return Math.sqrt(r/2);
        } else {
            return 1 - Math.sqrt((1 - r)/2);
        }
    }
    return {
        x: ns_lerp(window.x1, window.x2, biasedRandom()),
        y: ns_lerp(window.y1, window.y2, biasedRandom()),
    }
}

class OrbitFinder {
    constructor() {
        this.computer = new M.mandel.OrbitComputer();
        this.tmpComputer = new M.mandel.OrbitComputer();
        this.inprogress = false;
        this.window = null;
        this.attempts = 0;
    }
    
    setWindow(x1, y1, x2, y2, iterLimit) {
        this.window = {x1: x1, y1: y1, x2: x2, y2: y2};
        this.iterLimit = iterLimit;
        this.attempts = 0;
    }
    
    searchSome() {
        var window = this.window;
        function within(c) {
            function gt(x, y) {
                return ns.number(ns.sub(x, y)) > 0;
            }
            return gt(c.x, window.x1) && gt(window.x2, c.x) && gt(c.y, window.y1) && gt(window.y2, c.y);
        }
        
        if ((!this.inprogress && this.attempts >= 100) || (this.computer.isReady() && this.computer.iterations >= this.iterLimit && within(this.computer))) {
            //console.log('search complete', this.attempts, this.computer.iterations);
            return false;
        }
        
        if (!this.inprogress) {
            this.attempts++;
            var point;
            if (this.attempts == 1) { // always try center first
                point = {
                    x: ns_lerp(window.x1, window.x2, 0.5),
                    y: ns_lerp(window.y1, window.y2, 0.5),
                };
            } else {
                point = guessOrbitCenterBias(this.window);
            }
            this.tmpComputer.reset(point.x, point.y, this.iterLimit);
            this.inprogress = true;
            //console.log('new attempt', this.attempts);
        }
                
        if (this.tmpComputer.computeSome()) {
            //console.log('tmp some ');
        } else {
           // console.log('tmp ready');
            this.inprogress = false;
            // ready
            if (!this.computer.isReady() || this.computer.iterations < this.tmpComputer.iterations || !within(this.computer)) {
                //console.log('swap', this.computer.iterations, this.tmpComputer.iterations, this.computer.isReady() ? within(this.computer) : 'aaa');
                var c = this.computer;
                this.computer = this.tmpComputer;
                this.tmpComputer = c;
                
            }
        }
        
        return true;
    }    
    
    search2(x1, y1, x2, y2, iterLimit) {
        function gt(x, y) {
            return ns.number(ns.sub(x, y)) > 0;
        }
        function within(c) {
            return gt(c.x, x1) && gt(x2, c.x) && gt(c.y, y1) && gt(y2, c.y);
        }
        
        for (var i = 0; i < this.computers.length; i++) {
            var c = this.computers[i];
            var win = false;
            if (c.iterations != null) {
                win = within(c);
            }
            if (c.iterations != null && win && c.iterations >= iterLimit) {
                continue;
            }
            var x = ns.add(x1, ns.mul(ns.init(Math.random()), ns.sub(x2, x1)));
            var y = ns.add(y1, ns.mul(ns.init(Math.random()), ns.sub(y2, y1)));
            this.tmpComputer.reset(x, y, iterLimit);
            this.tmpComputer.computeAll();
            if (c.iterations == null || c.iterations < this.tmpComputer.iterations || !win) {
                this.computers[i] = this.tmpComputer;
                this.tmpComputer = c;
            }
        }
    }
    
    // search() must have been called at least once
    getBestComputer() {
        return this.computer;
    }
}

M.mandel.OrbitComputer = OrbitComputer;
M.mandel.OrbitFinder = OrbitFinder;

function mandelOrbitDD(cx, cy, iterations, array) {
    var x = [0, 0];
    var y = [0, 0];
    for (var i = 0; i < iterations; i++) {
		var xx = dd_mul(x, x);
		var yy = dd_mul(y, y);
		if (xx[1] + yy[1] > 4) {
			return i;
		}
        array[2*i] = x[1];
        array[2*i + 1] = y[1];
        var x2 = dd_add(dd_add(xx, dd_mul([0, -1], yy)), cx);
        y = dd_add(dd_mul(dd_mul([0, 2], x),  y), cy);
        x = x2;
    }
    return iterations;
}

function mandelError(cx, cy, iterations, array) {
    var x = 0.0;
    var y = 0.0;
    var xerr = 0;
    var yerr = 0;
    var eps = 5.960464477539063e-08;
    function g(n) {
		return (n*eps)/(1 - n*eps)
	}
	function add_err(a, b, aerr, berr) {
		return aerr + berr + g(1)*(Math.abs(a + b) + aerr + berr);
	}
	function mul_err(a, b, aerr, berr) {
		return (Math.abs(b*aerr) + Math.abs(a*berr) + aerr*berr) + g(1)*Math.abs(a*b);
	}
    var nerrors = 0;
    for (var i = 0; i < iterations; i++) {
		var xx = x*x;
		var yy = y*y;
		if (xx + yy > 4) {
			return i;
		}
		
        var xxerr = mul_err(x, x, xerr, xerr);
        var yyerr = mul_err(y, y, yerr, yerr);
        var xyerr = mul_err(x, y, xerr, yerr);
        var xerr2 = add_err(xx, -yy, xxerr, yyerr);
        xerr2 = add_err(xx - yy, cx, xerr2, 0);
        var yerr2 = mul_err(x, y, xerr, yerr);
        yerr2 = add_err(2*x*y, cy, yerr2, 0);
        xerr = xerr2;
        yerr = yerr2;
        
        var x2 = xx - yy + cx;
        y = 2.0 * x * y + cy;
        x = x2;
        
        if (xerr*0 > 0.00001 || yerr > 0.00001) {
			nerrors++;
			xerr = 0;
		}
		console.log(xerr);
    }
    return nerrors;
}

function testOrbit() {
	var orbit = new Float32Array(1024*1024*2);
    for (var i = 0; i < 1024; i++) {
        orbit[2*i] = i/1024;
        orbit[2*i + 1] = ((2*i) % 1024)/1024;
    }
    return orbit;
}
