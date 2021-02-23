
M.math = {
	M: 268435455,
};

var ns = M.ns.ns;

function mandelOrbit(cx, cy, iterations, array) {
    var x = 0.0;
    var y = 0.0;
    for (var i = 0; i < iterations; i++) {
		var xx = x*x;
		var yy = y*y;
		if (xx + yy > 4) {
			return i;
		}
        array[2*i] = x;
        array[2*i + 1] = y;
        var x2 = xx - yy + cx;
        y = 2.0 * x * y + cy;
        x = x2;
    }
    return iterations;
}

function mandelOrbitNS(cx, cy, iterations, array) {
    var x = ns.init(0.0);
    var y = ns.init(0.0);
    for (var i = 0; i < iterations; i++) {
		var nx = ns.number(x);
		var ny = ns.number(y);
		var xx = ns.mul(x, x);
		var yy = ns.mul(y, y);
		if (nx*nx + ny*ny > 4) {
			return i;
		}
        array[2*i] = nx;
        array[2*i + 1] = ny;
        var x2 = ns.add(ns.sub(xx, yy), cx);
        y = ns.add(ns.mul(ns.mul(ns.init(2.0), x), y), cy);
        x = ns.clone(x2);
    }
    return iterations;
}

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
