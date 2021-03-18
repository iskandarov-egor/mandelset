function lerp(x, a, b) {
    return a + x*(b - a);
};

  
function paintGradient(points, width, callback) {
    var points = points.slice(0).sort((a, b) => { return (a.x > b.x) ? 1: -1; });
    var pi = 0;
    for (var i = 0; i < width; i++) {
        var fract = i/width;
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
        callback(i, color);
    }
}

class GradientPainter {
    constructor(canvas, rgb_f) {
        this.rgb_f = rgb_f;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    paint(points) {
        var pixel = this.ctx.getImageData(0, 0, this.canvas.width, 1);
        var data = pixel.data;
        var that = this;
        function callback(i, color) {
            var rgb = that.rgb_f(color);
            data[i*4] = Math.floor(255*rgb[0]);
            data[i*4 + 1] = Math.floor(255*rgb[1]);
            data[i*4 + 2] = Math.floor(255*rgb[2]);
            data[i*4 + 3] = 255;
        }
        paintGradient(points, this.canvas.width, callback);
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
    }
};

//https://codepen.io/andyranged/pen/KyMKEB
class GradientController {
    constructor(receiver, modificationAllowed) {
        this.points = [];
        this.grab = null;
        this.receiver = receiver;
        this.highlightedPoint = null;
        this.selectedPoint = null;
        this.modificationAllowed = modificationAllowed;
    }
    
    add_point(p) {
        this.points.push(p);
    }
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    //todo mouse leave event
        canvas.addEventListener("mousemove", e => { this.mousemove(e); });
        canvas.addEventListener("mousedown", e => { this.mousedown(e); });
        canvas.addEventListener("mouseup", e => { this.mouseup(e); });
        canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); }, false);
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
        this.highlightedPoint = this._locate_point(e, this.modificationAllowed);
        this.paint();
    }
        
    mousedown(e) {
        if (e.buttons != 1) {
            return;
        }
        var p = this._locate_point(e, this.modificationAllowed);
        var pendingInsertion = null;
        
        var location = this._normalizeCanvasCoords(this.ctx, e);
        if (p == null) {
            if (!this.modificationAllowed) {
                return;
            }
            p = {
                x: location.x/this.canvas.width,
                color: null,
            };
            this.points.push(p);
            pendingInsertion = p;
            this.paint();
        }
        this.grab = {
            x: (!this.modificationAllowed) ? 0 : location.x - p.x * this.canvas.width,
            point: p,
        };
        this.selectedPoint = p;
        activeController = this;
        this.receiver(pendingInsertion);
    }
    
    mouseup(e) {
        if (e.button == 2 && this.modificationAllowed && this.points.length > 1) {
            var p = this._locate_point(e, true);
            if (p) {
                this.points.splice(this.points.indexOf(p), 1);
                this.receiver(null, p);
                this.paint();
            }
        }
    }
    
    _paint_point(ctx, p, canvas_width, canvas_height) {
        var x = Math.floor(canvas_width * p.x);
                
        var hl = (p == this.highlightedPoint || p == this.selectedPoint);
        
        if (!this.modificationAllowed) {
            hl = false;
        }
        ctx.strokeStyle = (!hl) ? `rgb(0,0,0)` : `rgb(255,255,255)`;
        
        ctx.lineWidth = 1;
        
        var x1 = x - canvas_height/2 + 0.5;
        var x2 = x1 + canvas_height - 1;
        var y1 = 0.5;
        var y2 = canvas_height - 0.5;
        
        ctx.fillStyle = `rgb(192,192,192)`;
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        
        ctx.strokeStyle = (!hl) ? `rgb(223,223,223)` : `rgb(128,128,128)`;
        ctx.beginPath();
        ctx.moveTo(x1+1, y2-1);
        ctx.lineTo(x1+1, y1+1);
        ctx.lineTo(x2-1, y1+1);
        ctx.stroke();
        
        ctx.strokeStyle = (!hl) ? `rgb(128,128,128)` : `rgb(223,223,223)`;
        ctx.beginPath();
        ctx.moveTo(x2-1, y1+1);
        ctx.lineTo(x2-1, y2-1);
        ctx.lineTo(x1+1, y2-1);
        ctx.stroke();
        
        ctx.strokeStyle = (!hl) ? `rgb(255,255,255)` : `rgb(0,0,0)`;
        ctx.beginPath();
        ctx.moveTo(x1, y2);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y1);
        ctx.stroke();
        
        ctx.strokeStyle = (!hl) ? `rgb(0,0,0)` : `rgb(255,255,255)`;
        ctx.beginPath();
        ctx.moveTo(x2, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y2);
        ctx.stroke();
        
        var w = 0.4;
        ctx.clearRect(x1+(x2-x1)*(1-w)/2, y1+(y2-y1)*(1-w)/2, (x2 - x1)*w, (y2 - y1)*w);
        
        //ctx.strokeStyle = (hl) ? `rgb(223,223,223)` : `rgb(0,0,0)`;
        //ctx.strokeRect(x - canvas_height/2 + 0.5, 0.5, canvas_height - 1, canvas_height - 1);
        
        /*
        ctx.fillStyle = `rgb(192,192,192)`;
        ctx.beginPath();
        ctx.arc(x+0.5, canvas_height/2+0.5, canvas_height/2, 0, 2*Math.PI, true);
        ctx.fill();
                
        ctx.strokeStyle = (hl) ? `rgb(128,128,128)` : `rgb(255,255,255)`;
        ctx.beginPath();
        ctx.arc(x+0.5, canvas_height/2+0.5, canvas_height/2, Math.PI*0.25, Math.PI * 1.25, true);
        ctx.stroke();
        
        ctx.strokeStyle = (hl) ? `rgb(223,223,223)` : `rgb(0,0,0)`;
        ctx.beginPath();
        ctx.arc(x+0.5, canvas_height/2+0.5, canvas_height/2, Math.PI * 1.25, Math.PI * 2.25, true);
        ctx.stroke();
        */
        
        
        //ctx.strokeRect(x - canvas_height/2 + 0.5, 0 + 0.5, canvas_height - 1, canvas_height - 1);
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
        this.gradientPainter = new GradientPainter(displayCanvas, M.colors.lab2srgb);
        var points = [
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
        for (var i = 0; i < points.length; i++) {
            points[i].color = M.colors.srgb2lab(points[i].color);
        }
        var that = this;
        function receiver(pendingInsertion, pendingDeletion) {
            if (pendingInsertion) {
                pendingInsertion.color = M.colors.srgb2lab([0, 1, 0]); //todo
            }
            for (var i = 0; i < that.controller.points.length; i++) {
                that.controller.points[i].color.x = that.controller.points[i].x;
            }
            that.gradientPainter.paint(that.controller.points);
            if (that.controller.selectedPoint) {
                var hsl = M.colors.lab2hsl(that.controller.selectedPoint.color);
                hsl = M.colors.clamp1(hsl);
                palette.h.points[0].x = hsl[0];
                palette.s.points[0].x = hsl[1];
                palette.l.points[0].x = hsl[2];
                palette.paint();
            }
        }
        this.controller = new GradientController(receiver, true);
        this.controller.init(controlCanvas);
        for (var i = 0; i < points.length; i++) {
            this.controller.add_point(points[i]);
        }
        this.controller.paint();
        
        this.gradientPainter.paint(this.controller.points);
    }
    
    paintGradient() {
        this.gradientPainter.paint(this.controller.points);
    }
}

class HSLPalette {
    constructor(displayCanvasH, controlCanvasH, displayCanvasS, controlCanvasS, displayCanvasL, controlCanvasL) {
        this.gh = new GradientPainter(displayCanvasH, M.colors.hsl2srgb);
        this.gs = new GradientPainter(displayCanvasS, M.colors.hsl2srgb);
        this.gl = new GradientPainter(displayCanvasL, M.colors.hsl2srgb);
        
        var that = this;
        function receiver() {
            that._control_receiver();
        }
        this.h = new GradientController(receiver);
        this.s = new GradientController(receiver);
        this.l = new GradientController(receiver);
        this.h.init(controlCanvasH);
        this.s.init(controlCanvasS);
        this.l.init(controlCanvasL);
        this.h.add_point({x: 0.5, color: null});
        this.s.add_point({x: 1, color: null});
        this.l.add_point({x: 0.5, color: null});
        this.h.paint();
        this.s.paint();
        this.l.paint();
    }
    
    paint() {
        var h = this.h.points[0].x;
        var s = this.s.points[0].x;
        var l = this.l.points[0].x;
        var pointsH = [{x: 0, color: [0, s, l]}, {x: 1, color: [1, s, l]}];
        var pointsS = [{x: 0, color: [h, 0, l]}, {x: 1, color: [h, 1, l]}];
        var pointsL = [{x: 0, color: [h, s, 0]}, {x: 1, color: [h, s, 1]}];
        this.h.paint();
        this.s.paint();
        this.l.paint();
        this.gh.paint(pointsH);
        this.gs.paint(pointsS);
        this.gl.paint(pointsL);
    }
    
    _control_receiver() {
        if (mainGradient.controller.selectedPoint) {
            var hsl = [
                this.h.points[0].x,
                this.s.points[0].x,
                this.l.points[0].x,
            ];
            mainGradient.controller.selectedPoint.color = M.colors.hsl2lab(hsl);
            mainGradient.paintGradient();
        }
    }
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

var palette = new HSLPalette(
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