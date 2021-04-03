M.ns = {};

function split_dd(x) { // double x
    var c = 268435456.0; // 1 << 27 + 1
    var y = c * x;
    var b = x - y;
    var h = y/* *one */ + b;
    return [x - h, h];
}

function fast2sum(a, b) { // double a, b
    var s_hi = 0;
    var s_lo = 0;
    if (Math.abs(a) < Math.abs(b)) {
        var dum = a;
        a = b;
        b = dum;
    }
    s_hi = a + b;
    var z = s_hi - /* *one */a;
    s_lo = b - /* *one */z;
    return [s_lo, s_hi];
}

function dd_add(x, y) {
    var r = [0, 0];
    var s;
    if (Math.abs(x[1]) >= Math.abs(y[1])) {
        r = fast2sum(x[1], y[1]);
        s = ((r[0] + y[0])/* *one */ + x[0]);
    } else {
        r = fast2sum(y[1], x[1]);
        s = ((r[0] + x[0])/* *one */ + y[0]);
    }
    return fast2sum(r[1], s);
}

function dekker_mul(a, b) {
    var s = [0, 0];
    var x = split_dd(a);
    var y = split_dd(b);
    s[1] = a * b;
    var t1 = -s[1] + x[1]*y[1];
    t1 = t1 + x[1]*y[0];
    t1 = t1 + x[0]*y[1];
    t1 = t1 + x[0]*y[0];
    s[0] = t1 + x[0]*y[0];
    return s;
}

function dd_mul(x, y) {
    var c = dekker_mul(x[1], y[1]);
    var p1 = x[1]*y[0];
    var p2 = x[0]*y[1];
    c[0] = c[0] + /* one* */(p1 + p2);
    return fast2sum(c[1], c[0]);
}

var ns; // "number system" used to compute orbits. eg simple Number, double Number, etc

var bigFloatFactor = 4;

// big float is a BigInt = x * ((10^10)^factor)
function makeBigFloat(x) {
    var mult = 1;
    while (x != Math.floor(x)) {
        x *= 2;
        mult *= 2;
    }
    var b = BigInt(x);
    for (var i = 0; i < bigFloatFactor; i++) {
        b *= BigInt(10000000000);
    }
    return b/BigInt(mult);
}

function bigFloat2String(b) {
    var neg = false;
    if (b < 0) {
        neg = true;
        b = -b;
    }
    var s = b.toString();
    s = s.split('');
    while (s.length < bigFloatFactor*10 + 1) {
        s.unshift('0');
    }
    s.splice(1, 0, '.');
    while (s[s.length - 1] == '0') {
        s.pop();
    }
    if (s[s.length - 1] == '.') {
        s.pop();
    }
    return (neg ? '-' : '') + s.join('');
}

var ns_dd = { // double double
    add: dd_add,
    mul: dd_mul,
    sub: function(x, y) {
        return dd_add(x, dd_mul([0, -1], y));
    },
    init: function(x) {
        return [0, x];
    },
    clone: function(x) {
        return [x[0], x[1]];
    },
    number: function(x) {
        return x[1] + x[0];
    },
    tostring: function(x) {
        if (typeof(window.BigInt)=="undefined") {
            return ns_dd.number(x).toFixed(20);
        }
        if (!Number.isFinite(x[0]) || !Number.isFinite(x[1])) {
            return (x[0] + x[1]).toString();
        }
        var b = makeBigFloat(x[0]) + makeBigFloat(x[1]);
        return bigFloat2String(b, bigFloatFactor);
    },
    fromstring(s) {
        if (typeof(window.BigInt)=="undefined") {
            return ns_dd.init(parseFloat(s));
        }
        
        if (-1 != s.indexOf('e')) {
            return ns_dd.init(parseFloat(s));
        }
        
        s = s.trim();
        var neg = (s[0] == '-');
        if (neg || s[0] == '+') {
            s = s.substring(1);
        }
        var parts = s.split('.');
        if (parts.length > 2) {
            return NaN;
        }
        if (parts.length == 1) {
            parts.push('0');
        }
        if (parts[0].length == 0) {
            parts[0] = '0';
        }
        if (parts[1].length == 0) {
            parts[1] = '0';
        }
        if (!(/^[0-9]*$/.test(parts[0])) || !(/^[0-9]*$/.test(parts[1]))) {
            return NaN;
        }
        // we have 2 '.'-parts, integers, non empty
        var floor = parseInt(parts[0], 10);
        if (floor.toString() != parts[0]) {
            return NaN;
        }
        
        // make fractional part exactly 10*bigFloatFactor characters long
        var fract = parts[1].substring(0, 10*bigFloatFactor);
        while (fract.length < 10*bigFloatFactor) {
            fract += '0';
        }
        
        // convert it to float and find the difference
        var fract1 = parseFloat('0.' + fract);
        var diff = BigInt(fract) - makeBigFloat(fract1);
        
        // make a dd from the float and the difference
        var fract2 = parseFloat(bigFloat2String(diff));
        var ret = ns_dd.add(ns_dd.init(floor), ns_dd.add(ns_dd.init(fract1), ns_dd.init(fract2)));
        return neg ? ns_dd.sub(ns_dd.init(0), ret) : ret;
    }
};

function testToString() {
    var pairs = [
        [100, 0],
        [100, 1],
        [100, -1],
        [-100, 1],
        [-100, -1],
        [0.100, 0.001],
        [0.100, -0.001],
        [-0.100, 0.001],
        [-0.100, -0.001],
        [100.001, 1.001],
        [100.001, -1.001],
        [-100.001, 1.001],
        [-100.001, -1.001],
    ];
    
    for (var i = 0; i < pairs.length; i++) {
        console.log('a', pairs[i][0]);
        console.log('b', pairs[i][1]);
        console.log('=', ns.tostring(pairs[i]));
    }
}

var ns_Number = { // simple js Number
    add: function(x, y) {
        return x + y;
    },
    mul: function(x, y) {
        return x * y;
    },
    sub: function(x, y) {
        return x - y;
    },
    init: function(x) {
        return x;
    },
    clone: function(x) {
        return x;
    },
    number: function(x) {
        return x;
    },
  tostring: function(x) {
        return x.toFixed(30);
    },
};

M.ns.ns = ns_dd;