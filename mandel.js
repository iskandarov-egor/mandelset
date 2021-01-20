
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
