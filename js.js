var ns = M.ns.ns;
// 2162819005114
// 76619

var canvas = document.getElementById("canvas");
var canvas1 = document.getElementById("canvas1");

M.prefMVC.callbacks.eyeChanged = function() {
    applyEyePreferences(M.prefMVC.eye);
    game.setRefOrbitDisplay(M.prefMVC.eye.refOrbit);
};

M.prefMVC.callbacks.colorsChanged = function() {
    applyColorPreferences(M.prefMVC.colors);
};

function resizeMainCanvasElement(width, height) {
    canvas.width = width;
    canvas.height = height;
    if (canvas.drawingBufferWidth < canvas.width || canvas.drawingBufferHeight < canvas.height) {
        canvas.width = canvas.drawingBufferWidth;
        canvas.height = canvas.drawingBufferHeight;
    }
    
    var container = {
        width: Math.floor(document.getElementById("main_stack").clientWidth*window.devicePixelRatio),
        height: Math.floor(document.getElementById("main_stack").clientHeight*window.devicePixelRatio),
    };
    if (container.width/container.height > canvas.width/canvas.height) {
        canvas.style.removeProperty("width");
        canvas.style.height = "100%";
    } else {
        canvas.style.removeProperty("height");
        canvas.style.width = "100%";
    }
    
    canvas1.width = canvas.width;
    canvas1.height = canvas.height;
    canvas1.style.width = canvas.style.width;
    canvas1.style.height = canvas.style.height;
    
    setTimeout(function() {
        var rect = canvas.getBoundingClientRect();
        if (rect.width*window.devicePixelRatio >= canvas.width) {
            canvas.style.imageRendering = 'pixelated';
        } else {
            canvas.style.removeProperty("image-rendering");
        }
    }, 1);
}

function applyEyePreferences(values) {
    var eye = new M.mandel.Eye({
        iterations: values.iterations,
        offsetX: values.offsetX,
        offsetY: values.offsetY,
        scale: values.scale,
        samples: values.samples,
    });
    
    if (canvas.width != values.width || canvas.height != values.height) {
        resizeMainCanvasElement(values.width, values.height);
        game.initBuffer();
    }
    
    game.aggressiveness = values.aggressiveness;
    game.setEye(eye);
    game.requestDraw();
}

canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const dir = Math.sign(e.deltaY);
    var ratio = canvas.width/canvas.height;
    var x = e.offsetX / canvas.clientHeight * 2 - ratio;
    var y = e.offsetY / canvas.clientHeight * -2 + 1;
    var factor = Math.pow(1.1, dir);
    
    // :: var cx = x * game.eye.scale + game.eye.offsetX;
    // :: game.eye.offsetX = cx + (game.eye.offsetX - cx) * factor;
    // :: game.eye.offsetX = x * game.eye.scale + game.eye.offsetX + (-x * game.eye.scale) * factor;
    // :: game.eye.offsetX = x * game.eye.scale*(1 - factor) + game.eye.offsetX;
    M.prefMVC.eye.offsetX = ns.add(ns.init(x * M.prefMVC.eye.scale*(1 - factor)), M.prefMVC.eye.offsetX);
    M.prefMVC.eye.offsetY = ns.add(ns.init(y * M.prefMVC.eye.scale*(1 - factor)), M.prefMVC.eye.offsetY);
    M.prefMVC.eye.scale *= factor;
    M.prefMVC.eyeUpdateElements();
    applyEyePreferences(M.prefMVC.eye);
});

function normalizeCanvasCoords(canvas, x, y) {
    var boundingBox = canvas.getBoundingClientRect();
    return {
        x: (x - boundingBox.left) / (boundingBox.width),
        y: (y - boundingBox.top) / (boundingBox.height)
    }
}

var canvasGrab = null;

canvas.addEventListener("mousedown", e => {
    if (e.buttons % 2 == 0) {
        return;
    }
    canvasGrab = {
        p: normalizeCanvasCoords(canvas, e.clientX, e.clientY),
        eye: game.eye.clone(),
    };
});


document.addEventListener("mousedown", e => {
    document.getElementById("help").classList.add('hide');
});

document.addEventListener("mouseup", e => {
    if (e.button == 0) {
        canvasGrab = null;
    }
});

document.addEventListener("mouseleave", e => {
    canvasGrab = null;
});

canvas.addEventListener("mousemove", e => {
    if (e.buttons % 2 == 0 || canvasGrab == null) {
        return;
    }
    var p = normalizeCanvasCoords(canvas, e.clientX, e.clientY);
    M.prefMVC.eye.offsetX = ns.sub(
        canvasGrab.eye.offsetX,
        ns.mul(ns.init((p.x - canvasGrab.p.x)*2*canvas.width/canvas.height), ns.init(M.prefMVC.eye.scale)),
    );
    M.prefMVC.eye.offsetY = ns.add(
        canvasGrab.eye.offsetY,
        ns.mul(ns.init((p.y - canvasGrab.p.y)*2), ns.init(M.prefMVC.eye.scale)),
    );
        
    M.prefMVC.eyeUpdateElements();
    applyEyePreferences(M.prefMVC.eye);
});


var lc_ext = null;
function myclick() {
    if (lc_ext) {
        lc_ext.restoreContext();
        lc_ext = null;
    } else {
        lc_ext = gl.getExtension('WEBGL_lose_context');
        lc_ext.loseContext();
    }
}

/*
function myclick2() {

    //underlay.take(comp2.getDrawingEye(), comp2.getTexture());
    underlay.combine(comp2.getDrawingEye(), comp2.getTexture(), renderW, renderH);
    visualizeBuffer(comp2.getTexture());
}

function myclick3() {
    underlay.combine(comp2.getDrawingEye(), comp2.getTexture(), renderW, renderH);
    visualizeBuffer(comp2.getTexture());
}
*/

var gradientArray = new Uint8Array(1024*1*4);
function applyColorPreferences(values) {
    function paintCb(i, color) {
        var rgb = M.colors.clamp1(color);
        gradientArray[i*4] = 255*rgb[0];
        gradientArray[i*4 + 1] = 255*rgb[1];
        gradientArray[i*4 + 2] = 255*rgb[2];
        gradientArray[i*4 + 3] = 255;
    }
    M.palette.paintGradient(values.mainGradientPoints, 1024, paintCb);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, game.theme.gradientTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 1, gl.RGBA, gl.UNSIGNED_BYTE, gradientArray);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, game.theme.gradientTexture2);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 1, gl.RGBA, gl.UNSIGNED_BYTE, gradientArray);
    
    game.theme.interiorColor = values.interiorColor;
    
    game.theme.offset = values.offset;
    game.theme.scale = values.scale;
    
    game.theme.mirror = values.mirror;
    game.theme.repeat = values.repeat;
    
    game.theme.offset2 = values.offset2;
    game.theme.scale2 = values.scale2;
    
    game.theme.mirror2 = values.mirror2;
    game.theme.repeat2 = values.repeat2;
    
    game.theme.shade3d = values.shade3d;
    game.theme.scaleInvariant = values.scaleInvariant;
    
    game.theme.mode = (values.paintMode == 'custom_image') ? 1 : 0;
    game.theme.distance_mode = (values.distanceMode == 'distance') ? 1 : 0;
    
    game.theme.direction = values.direction ? 1 : 0;
    
    console.log("PP", values.paintMode, values.customImage.width);
    if (values.paintMode == 'custom_image') {
        M.gl_util.loadHTMLImage2Texture(
            game.gl,
            (values.customImage.width > 0) ? values.customImage : document.getElementById('default_texture'),
            game.theme.customImageTexture
        );
    }
    
    game.updateTheme();
}

// there's a bug in older versions of firefox that results in a blank image from "save as" if
// we don't set preserveDrawingBuffer to true
var gl = canvas.getContext("webgl2", {antialias: false, preserveDrawingBuffer: true});
if (!gl) {
    alert("webgl2 not supported");
    throw new Error("webgl2 not supported");
}
var game;

function startWithNewGLContext() {
    M.gl_resources.createPositionVAO(gl);
    game = new M.game.Game(gl, document.getElementById("canvas1"));
    game.initBuffer();
    
    applyEyePreferences(M.prefMVC.eye);
    applyColorPreferences(M.prefMVC.colors);
    game.requestDraw();
}

M.prefMVC.eye.width = Math.floor(window.devicePixelRatio*document.getElementById("main_stack").clientWidth);
M.prefMVC.eye.height = Math.floor(window.devicePixelRatio*document.getElementById("main_stack").clientHeight);
M.prefMVC.eyeUpdateElements();
startWithNewGLContext();

applyEyePreferences(M.prefMVC.eye); //resizeMainCanvasElement(prefs.eye.width, prefs.eye.height);

setInterval(function() {
  //document.getElementById("lblTiming").innerText = 'Timing: ' + M.Stat.Computer.lastTiming;
  //document.getElementById("lblGLTimer").innerText = 'GL Timer: ' + M.Stat.Computer.GLTimer;
}, 500);

function newProgressWatcher(div, canvas, label) {
    var hidden = false;
    var w = {};
    var ctx = canvas.getContext("2d");
    ctx.lineWidth  = Math.max(1, canvas.width / 10);
    
    w.update = function(game) {
        var compTime = game.getComputationTime();
        var hide = (compTime < 1000);
        if (hide != hidden) {
            hidden = hide;
            if (hide) {
                div.classList.add('hide');
            } else {
                div.classList.remove('hide');
            }
        }
        var p = game.getProgress();
        var dots = Math.floor(compTime/1000) % 4;
        label.textContent = p[0] + '.'.repeat(dots) + ' '.repeat(3 - dots);
        ctx.clearRect(0, 0, canvas.width, canvas.width);
        ctx.beginPath();
        var r = canvas.width / 3;
        ctx.strokeStyle = 'rgb(128,128,128)';
        ctx.arc(canvas.width / 2, canvas.width / 2, r, Math.PI * 1.5, Math.PI * 3.5);
        ctx.stroke(); 
        ctx.beginPath();
        ctx.strokeStyle = 'rgb(225,225,225)';
        ctx.arc(canvas.width / 2, canvas.width / 2, r, Math.PI * 1.5, Math.PI * (2*p[1] + 1.5));
        ctx.stroke(); 
    };
    return w;
}

resizeCanvasToDisplaySize(document.getElementById("progress_canvas"));
var progressWatcher = newProgressWatcher(
    document.getElementById("progress"),
    document.getElementById("progress_canvas"),
    document.getElementById("progress_text"),
);

game.updateCallback = function() {
    progressWatcher.update(game);
};

function raf() {
    game.raf();
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

M.prefMVC._mainGradient.controller.selectionGroup.selectedPoint = M.prefMVC._mainGradient.controller.points[0];
//updateGradientTexture();

canvas.addEventListener("webglcontextlost", function(event) {
    event.preventDefault();
    console.log('lost');
}, false);

canvas.addEventListener("webglcontextrestored", function() {
    console.log('restored');
    startWithNewGLContext();
}, false);
