function lerp(x, a, b) {
    return a + x*(b - a);
};

class Gradient {
    constructor(rgb_f) {
        this.points = [];
        this.rgb_f = rgb_f;
    }
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    paint() {
        var pixel = this.ctx.getImageData(0, 0, this.canvas.width, 1);
        var data = pixel.data;
        var points = this.points.slice(0).sort((a, b) => { return (a.x > b.x) ? 1: -1; });
        var pi = 0;
        for (var i = 0; i < this.canvas.width; i++) {
            var fract = i/this.canvas.width;
            while (pi < points.length - 1 && points[pi + 1].x < fract) {
                pi++;
            }
            var color;
            if (pi == points.length - 1 || points[pi].x > fract) {
                color = [
                    points[pi].color[0],
                    points[pi].color[1],
                    points[pi].color[2],
                ];
            } else {
                var factor = (fract - points[pi].x)/(points[pi + 1].x - points[pi].x);
                color = [
                    lerp(factor, points[pi].color[0], points[pi + 1].color[0]),
                    lerp(factor, points[pi].color[1], points[pi + 1].color[1]),
                    lerp(factor, points[pi].color[2], points[pi + 1].color[2]),
                ];
            }
            var rgb = this.rgb_f(color);
            data[i*4] = Math.floor(255*rgb[0]);
            data[i*4 + 1] = Math.floor(255*rgb[1]);
            data[i*4 + 2] = Math.floor(255*rgb[2]);
            data[i*4 + 3] = 255;
        }
        this.ctx.putImageData(pixel, 0, 0);
    }
};

var activeController = null;
var gradientControllersMouseMove = function(e) {
    if (!activeController) {
        return;
    }
    
    var c = activeController;
    if (e.buttons == 1) {
        console.log('out');
        if (c.grab != null) {
            var location = c._normalizeCanvasCoords(c.ctx, e);
            c.grab.point.x = (location.x - c.grab.x) / c.canvas.width;
            c.grab.point.x = Math.max(0, Math.min(1, c.grab.point.x));
            c.paint();
            c.receiver();
        }
    }
};

var gradientControllersMouseUp = function(e) {
    if (e.buttons % 2 == 0) {
        activeController = null;
        console.log('up');
    }
};

//https://codepen.io/andyranged/pen/KyMKEB
class GradientController {
    constructor(receiver, insertionAllowed) {
        this.points = [];
        this.grab = null; //{
        //    x: null,
        //    y: null,
        //    point: null,
        //};
        this.receiver = receiver;
        this.highlightedPoint = null;
        this.selectedPoint = null;
        this.insertionAllowed = insertionAllowed;
        this.pendingInsertion = null;
    }
    
    add_point(x, payload) {
        this.points.push({x: x, payload: payload});
    }
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    //todo mouse leave event
        canvas.addEventListener("mousemove", e => { this.mousemove(e); });
        canvas.addEventListener("mousedown", e => { this.mousedown(e); });
    }

    _normalizeCanvasCoords(ctx, e) {
        var cw = ctx.canvas.width;
        var ch = ctx.canvas.height;
        var boundingBox = ctx.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - boundingBox.left) * (cw / boundingBox.width),
            y: (e.clientY - boundingBox.top) * (ch / boundingBox.height)
        }
    }
    
    _locate_point(e, strict) {
        var h = this.canvas.height;
        var w = this.canvas.width;
        var location = this._normalizeCanvasCoords(this.ctx, e);
        var x = location.x/w;
        var min = {
            p: null,
            distance: 0xFFFF,
        };
        for (var i = 0; i < this.points.length; i++) {
            var p = this.points[i];
            var distance = Math.abs(p.x - x);
            if (min.distance > distance) {
                min.distance = distance;
                min.p = p;
            }
        }
        if (strict && min.distance*w > h/2) {
            return null;
        } else {
            return min.p;
        }
    }
    
    mousemove(e) {
        if (e.buttons == 1) {
            return;
        }
        this.highlightedPoint = this._locate_point(e);
        this.paint();
        console.log('in');
    }
        
    mousedown(e) {
        if (e.buttons != 1) {
            return;
        }
        var p = this._locate_point(e, this.insertionAllowed);
        
        var location = this._normalizeCanvasCoords(this.ctx, e);
        if (p == null) {
            if (!this.insertionAllowed) {
                return;
            }
            p = {
                x: location.x/this.canvas.width,
                payload: null,
            };
            this.points.push(p);
            this.pendingInsertion = p;
            this.paint();
        }
        this.grab = {
            x: (!this.insertionAllowed) ? 0 : location.x - p.x * this.canvas.width,
            point: p,
        };
        this.selectedPoint = p;
        activeController = this;
        this.receiver();
    }
    
    _paint_point(ctx, p, canvas_width, canvas_height) {
        ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        var x = Math.floor(canvas_width * p.x);
        ctx.fillRect(x - canvas_height/2, 0, canvas_height, canvas_height);
        
        var hl = (p == this.highlightedPoint || p == this.selectedPoint);
        ctx.strokeStyle = (hl) ? `rgb(0,0,0)` : `rgb(255,255,255)`;
        ctx.strokeRect(x - canvas_height/2 + 1.5, 1.5, canvas_height - 3, canvas_height - 3);
        ctx.strokeStyle = (!hl) ? `rgb(0,0,0)` : `rgb(255,255,255)`;
        ctx.strokeRect(x - canvas_height/2 + 0.5, 0 + 0.5, canvas_height - 1, canvas_height - 1);
    }
    
    paint() {
        var canvas = this.canvas;
        resizeCanvasToDisplaySize(canvas);
        var ctx = this.ctx;
        ctx.lineWidth = 1;
        //var bbox = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < this.points.length; i++) {
            var p = this.points[i];
            this._paint_point(ctx, p, canvas.width, canvas.height);
        }
    }
};


class MainGradient {
    constructor(displayCanvas, controlCanvas) {
        this.gradient = new Gradient(M.colors.lab2srgb);
        this.gradient.points = [
            {
                x: 0.3,
                color: [1, 0, 0],
            }, {
                x: 0.6,
                color: [0, 0, 1],
            }, {
                x: 1,
                color: [1, 1, 0],
            }
        ];
        for (var i = 0; i < this.gradient.points.length; i++) {
            this.gradient.points[i].color = M.colors.srgb2lab(this.gradient.points[i].color);
        }
        var that = this;
        function receiver() {
            if (that.controller.pendingInsertion) {
                var p = {
                    x: that.controller.pendingInsertion.x,
                    color: M.colors.srgb2lab([0, 1, 0]), //todo
                };
                that.gradient.points.push(p);
                that.controller.pendingInsertion.payload = p;
                that.controller.pendingInsertion = null;
            }
            for (var i = 0; i < that.controller.points.length; i++) {
                console.log(i);
                that.controller.points[i].payload.x = that.controller.points[i].x;
            }
            that.gradient.paint();
            if (that.controller.selectedPoint) {
                var hsl = M.colors.lab2hsl(that.controller.selectedPoint.payload.color);
                hsl = M.colors.clamp1(hsl);
                paletteControllers.h.points[0].x = hsl[0];
                paletteControllers.s.points[0].x = hsl[1];
                paletteControllers.l.points[0].x = hsl[2];
                paletteControllers.l.receiver();
            }
        }
        this.controller = new GradientController(receiver, true);
        this.gradient.init(displayCanvas);
        this.controller.init(controlCanvas);
        for (var i = 0; i < this.gradient.points.length; i++) {
            this.controller.add_point(this.gradient.points[i].x, this.gradient.points[i]);
        }
        this.controller.paint();
        this.gradient.paint();
    }
}

function setUpPaletteGradients(displayCanvasH, controlCanvasH, displayCanvasS, controlCanvasS, displayCanvasL, controlCanvasL) {
    var gh = new Gradient(M.colors.hsl2srgb);
    var gs = new Gradient(M.colors.hsl2srgb);
    var gl = new Gradient(M.colors.hsl2srgb);
    gh.points = [{x: 0, color: [0, 1, 0.5]}, {x: 1, color: [1, 1, 0.5]}];
    gs.points = [{x: 0, color: [0, 0, 0]}, {x: 1, color: [0, 1, 0]}];
    gl.points = [{x: 0, color: [0, 0, 0]}, {x: 1, color: [0, 0, 1]}];
    function receiver() {
        var h = ch.points[0].x;
        var s = cs.points[0].x;
        var l = cl.points[0].x;
        gh.points = [{x: 0, color: [0, s, l]}, {x: 1, color: [1, s, l]}];
        gs.points = [{x: 0, color: [h, 0, l]}, {x: 1, color: [h, 1, l]}];
        gl.points = [{x: 0, color: [h, s, 0]}, {x: 1, color: [h, s, 1]}];
        if (mainGradient.controller.selectedPoint) {
            var hsl = [
                ch.points[0].x,
                cs.points[0].x,
                cl.points[0].x,
            ];
            mainGradient.controller.selectedPoint.payload.color = M.colors.hsl2lab(hsl);
            mainGradient.controller.paint();
            mainGradient.gradient.paint();
        }
        ch.paint();
        cs.paint();
        cl.paint();
        gh.paint();
        gs.paint();
        gl.paint();
    }
    var ch = new GradientController(receiver);
    var cs = new GradientController(receiver);
    var cl = new GradientController(receiver);
    gh.init(displayCanvasH);
    gs.init(displayCanvasS);
    gl.init(displayCanvasL);
    ch.init(controlCanvasH);
    cs.init(controlCanvasS);
    cl.init(controlCanvasL);
    ch.add_point(0.5, null);
    cs.add_point(1, null);
    cl.add_point(0.5, null);
    ch.paint();
    cs.paint();
    cl.paint();
    gh.paint();
    gs.paint();
    gl.paint();
    return {
        h: ch,
        s: cs,
        l: cl,
    };
};

function resizeCanvasToDisplaySize(canvas) {
    canvas.width  = (window.devicePixelRatio * canvas.clientWidth);
    canvas.height = (window.devicePixelRatio * canvas.clientHeight);
}

var canvas = document.getElementById('canvas');
//var canvas1 = document.getElementById('canvas1');
var mainGradient = new MainGradient(
    document.getElementById('canvas'),
    document.getElementById('canvas1')
);

var paletteControllers = setUpPaletteGradients(
    document.getElementById('canvas_hsv_h'),
    document.getElementById('canvas_hsv_h_control'),
    document.getElementById('canvas_hsv_s'),
    document.getElementById('canvas_hsv_s_control'),
    document.getElementById('canvas_hsv_l'),
    document.getElementById('canvas_hsv_l_control'),
);

document.addEventListener("mousemove", e => gradientControllersMouseMove(e));
document.addEventListener("mouseup", e => gradientControllersMouseUp(e));
//g_h.init(canvas_h);
//g_h_c.init(canvas_hc);