
M.colors = {};

M.colors.hsl2srgb = function(hsl) {
    var [h, s, l] = hsl;
    var c = s*(1-Math.abs(2*l - 1));
    var hh = h * 6;
    var x = c * (1 - Math.abs((hh % 2) - 1));
    var r, g, b;
    var m = l - c/2;
    hh = Math.floor(hh);
    if (hh % 2 == 1) {
       [x, c] = [c, x];
    }
    if (hh < 2) {
       [r, g, b] = [c, x, 0];
    } else {
       if (hh < 4) {
           [r, g, b] = [0, c, x];
       } else {
           [r, g, b] = [x, 0, c];
       }
    }
    function gamma(x) {
        if (x <= 0.0031308) {
            return 12.92*x;
        } else {
            return 1.055*Math.pow(x, 1/2.4) - 0.055;
        }
    }
    return [
       gamma(r + m),
       gamma(g + m),
       gamma(b + m),
    ];
};

M.colors.srgb2hsl = function(rgb) {
    var [r, g, b] = rgb;
    function gamma(x) {
        if (x <= 0.04045) {
            return x/12.92;
        } else {
            return Math.pow((x + 0.055)/1.055, 2.4);
        }
    }
    
    r = gamma(r);
    g = gamma(g);
    b = gamma(b);
    
    var xmax = Math.max(r, g, b);
    var xmin = Math.min(r, g, b);
    var c = xmax - xmin;
    var l = (xmax + xmin)/2;
    var h;
    
    if (c == 0) {
        h = 0;
    } else if (xmax == r) {
        h = (g - b)/c/6;
    } else if (xmax == g) {
        h = 2/6 + (b - r)/c/6;
    } else {
        h = 4/6 + (r - g)/c/6;
    }
    
    return [
        h,
        (xmax == 0) ? 0 : c/xmax,
        l,
    ];
};

M.colors.srgb2xyz = function(rgb) {
    function gamma(x) {
        if (x <= 0.04045) {
            return x/12.92;
        } else {
            return Math.pow((x + 0.055)/1.055, 2.4);
        }
    }
    
    var r = gamma(rgb[0]);
    var g = gamma(rgb[1]);
    var b = gamma(rgb[2]);
    
    // D65
    return [
        0.4124564*r + 0.3575761*g + 0.1804375*b,
        0.2126729*r + 0.7151522*g + 0.0721750*b,
        0.0193339*r + 0.1191920*g + 0.9503041*b,
    ];
};

M.colors.xyz2srgb = function(xyz) {
    var [x, y, z] = xyz;
    // D65
    var r =  3.2404542*x - 1.5371385*y - 0.4985314*z;
    var g = -0.9692660*x + 1.8760108*y + 0.0415560*z;
    var b =  0.0556434*x - 0.2040259*y + 1.0572252*z;
    function gamma(x) {
        if (x <= 0.0031308) {
            return 12.92*x;
        } else {
            return 1.055*Math.pow(x, 1/2.4) - 0.055;
        }
    }
    return [
        gamma(r),
        gamma(g),
        gamma(b),
    ];
};

M.colors.xyz2lab = function(xyz) {
    var [x, y, z] = xyz;
    function f(x) {
        if (x > 6/29*6/29*6/29) {
            return Math.pow(x, 1/3);
        } else {
            return 4/29 + x/(3*6/29*6/29);
        }
    }
    // D65
    x = f(x/0.950489);
    y = f(y/1);
    z = f(z/1.08884);
    return [
        1.16*y - 0.16,
        5.00*(x - y),
        2.00*(y - z),
    ];
};

M.colors.lab2xyz = function(lab) {
    var [l, a, b] = lab;
    function f(x) {
        if (x > 6/29) {
            return x*x*x;
        } else {
            return 3*6/29*6/29*(x - 4/29);
        }
    }
    // D65
    l = (l + 0.16)/1.16;
    a /= 5;
    b /= 2;
    return [
        0.950489*f(l + a),
        1.00*f(l),
        1.08884*f(l - b),
    ];
};

M.colors.hsl2lab = function(hsl) {
    return M.colors.xyz2lab(M.colors.srgb2xyz(M.colors.hsl2srgb(hsl)));    
};

M.colors.lab2hsl = function(lab) {
    return M.colors.srgb2hsl(M.colors.xyz2srgb(M.colors.lab2xyz(lab)));    
};

M.colors.srgb2lab = function(rgb) {
    return M.colors.xyz2lab(M.colors.srgb2xyz(rgb));
};

M.colors.lab2srgb = function(lab) {
    return M.colors.xyz2srgb(M.colors.lab2xyz(lab));
};

M.colors.clamp1 = function(c) {
    return [
        Math.max(0, Math.min(1, c[0])),
        Math.max(0, Math.min(1, c[1])),
        Math.max(0, Math.min(1, c[2])),
    ];
};