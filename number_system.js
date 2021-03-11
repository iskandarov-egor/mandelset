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

function fraction_split(x, width) {
  var x = Math.abs(x).toFixed(width);
  
  var list = [];
  var z = '0'.charCodeAt(0);
  var dot = x.indexOf('.')

  for (var i = x.length - 1; i < width + dot; i++) {
    list.push(0);
  }
  for (var i = x.length - 1; i >= 0; i--) {
    if (i != dot) {
      list.push(x.charCodeAt(i) - z);
    }
  }
  
  return list;
}

function fractions_add(x) {
  var w = 30;
  var hi = fraction_split(x[0], w);
  var lo = fraction_split(x[1], w);
  console.log(hi,lo);
  if (lo.length > hi.length) {
    alert('todo'); // must not happen
  }
  hi.push(0);
  for (var i = 0; i < lo.length; i++) {
    var d = lo[i] + hi[i];
    if (d > 9) {
      hi[i + 1]++;
      hi[i] = d - 10;
    } else {
      hi[i] = d;
    }
  }
  
  if (hi[hi.length - 1] == 0) {
    hi.pop();
  }
  
  hi.reverse();
  
  return hi.slice(0, hi.length - w).join('') + '.' + hi.slice(hi.length - w, hi.length).join('');
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
        return x[1];
    },
  tostring: function(x) {
        var lo = x[0].toFixed(30);
    var hi = x[1].toFixed(30);
    var out = hi;
    if (lo.includes('e') || hi.includes('e')) {
      return hi.toFixed(30);
    }
    lo = lo.split('')
    hi = hi.split('')
    if (lo[0] == '-') {
      lo.shift()
    }
    if (hi[0] == '-') {
      hi.shift()
    }
    if (lo.length() != hi.length()) {
    }
    if ((x[0] > 0) == (x[1] > 0)) {
      // addition
      
      if (x[0] < 0) {
        
      }
    } else {
      // subtraction
    }
    }
};

/*
class DD {
    constructor(x) {
        this.x = x;
    }
    add(y) {
        return dd_add(this.x, y);
    }
    mul(y) {
        return dd_mul(this.x, y);
    }
    sub(y) {
        return dd_add(x, dd_mul([0, -1], y));
    }
    clone() {
        var ret = new DD();
        ret.x = [this.x[0], this.x[1]];
        return ret;
    }
    number: function(x) {
        return this.x[1];
    },
}

M.ns.DD = DD;
*/

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