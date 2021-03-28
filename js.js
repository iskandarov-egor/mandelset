var ns = M.ns.ns;
// 2162819005114
// 76619

function updateEyeControlElements() {
    document.getElementById("input_scale").value = 1/game.eye.scale;
    document.getElementById("input_x").value = ns.number(game.eye.offsetX).toFixed(30);
    document.getElementById("input_y").value = ns.number(game.eye.offsetY).toFixed(30);
    document.getElementById("input_iter").value = game.eye.iterations;
}

function loadFromEyeControlElements() {
    var values = {
        iterations: parseFloat(document.getElementById("input_iter").value),
        offsetX: parseFloat(document.getElementById("input_x").value),
        offsetY: parseFloat(document.getElementById("input_y").value),
        scale: parseFloat(document.getElementById("input_scale").value),
    };
    
    if (isNaN(values.iterations) || isNaN(values.offsetX) || isNaN(values.offsetY) || isNaN(values.scale)) {
        return;
    }
    var eye = new M.mandel.Eye({
        iterations: values.iterations,
        offsetX: ns.init(values.offsetX),
        offsetY: ns.init(values.offsetY),
        scale: 1/values.scale,
    });
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
    game.eye.offsetX = ns.add(ns.init(x * game.eye.scale*(1 - factor)), game.eye.offsetX);
    game.eye.offsetY = ns.add(ns.init(y * game.eye.scale*(1 - factor)), game.eye.offsetY);
    game.eye.scale *= factor;
    updateEyeControlElements();
    game.setEye(game.eye);
    game.requestDraw();
});

var acc = 0;

canvas.addEventListener("mousemove", e => {
    if (e.buttons % 2 == 0) {
        return;
    }
    // todo test when page is zoomed
    //var canvasX = 
    game.eye.offsetX = ns.sub(
        game.eye.offsetX,
        ns.mul(ns.init(e.movementX*2/canvas.clientHeight), ns.init(game.eye.scale)),
    );
    game.eye.offsetY = ns.add(
        game.eye.offsetY,
        ns.mul(ns.init(e.movementY*2/canvas.clientHeight), ns.init(game.eye.scale)),
    );
        
    updateEyeControlElements();
    game.setEye(game.eye);
    game.requestDraw();
});

function getPaintMode() {
    return document.querySelector('input[name="paint_mode"]:checked').value;
}

function getDistanceMode() {
    return document.querySelector('input[name="distance_mode"]:checked').value;
}

function getPreferencesMode() {
    return document.querySelector('input[name="preference_switch"]:checked').value;
}

function updateElementVisibility() {
    var mode = getPaintMode();
    
    var colorMode = (getPreferencesMode() == 'color');
    document.getElementById('eye_preferences').style.display = !colorMode ? 'flex' : 'none';
    document.getElementById('color_preferences').style.display = colorMode ? 'flex' : 'none';
    if (colorMode) {
        mainGradient.paint();
        palette.paint();
        offsetControl.paint();
        scaleControl.paint();
    }
    
    for (const element of document.getElementsByClassName('main_gradient_cell')) {
        element.style.display = (mode == 'gradient' || mode == '2_gradients') ? 'flex' : 'none';
    }
    
    document.getElementById('palette_cell').style.display = (mode == 'gradient' || mode == '2_gradients') ? 'flex' : 'none';
    //document.getElementById('second_gradient').style.display = (mode == '2_gradients') ? 'flex' : 'none';
    document.getElementById('custom_image_cell').style.display = (mode == 'custom_image') ? 'flex' : 'none';
    document.getElementById('distance_mode').style.display = (game.theme.direction == 0) ? 'flex' : 'none';
    document.getElementById('scale_invariance_control').style.visibility = (getDistanceMode() == 'distance') ? 'visible' : 'hidden';
    
    for (const element of document.getElementsByClassName('distance_factor_modifier')) {
        element.style.display = (mode != 'gradient' || game.theme.direction == 0) ? 'flex' : 'none';
    }
    for (const element of document.getElementsByClassName('normal_factor_modifier')) {
        element.style.display = (mode != 'gradient' || game.theme.direction == 1) ? 'flex' : 'none';
    }
    
    paintControls();
}

function paintModeListener() {
    updateElementVisibility();
    updateGradientTexture();
}

function toggleDirectionListener() {
    game.theme.direction = (game.theme.direction == 0) ? 1 : 0;
    updateElementVisibility();
    updateGradientTexture();
};

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

///var utexture = M.gl_util.createRenderTexture(gl, renderW, renderH);

function myclick2() {

    //underlay.take(comp2.getDrawingEye(), comp2.getTexture());
    underlay.combine(comp2.getDrawingEye(), comp2.getTexture(), renderW, renderH);
    visualizeBuffer(comp2.getTexture());
}

function myclick3() {
    underlay.combine(comp2.getDrawingEye(), comp2.getTexture(), renderW, renderH);
    visualizeBuffer(comp2.getTexture());
}

var gradientArray = new Uint8Array(1024*1*4);
function updateGradientTexture() {
    function paintCb(i, color) {
        var rgb = M.colors.clamp1(color);
        gradientArray[i*4] = 255*rgb[0];
        gradientArray[i*4 + 1] = 255*rgb[1];
        gradientArray[i*4 + 2] = 255*rgb[2];
        gradientArray[i*4 + 3] = 255;
    }
    M.palette.paintGradient(mainGradient.controller.points, 1024, paintCb);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, game.theme.gradientTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 1, gl.RGBA, gl.UNSIGNED_BYTE, gradientArray);
    
    if (getPaintMode() == '2_gradients') {
        M.palette.paintGradient(mainGradient2.controller.points, 1024, paintCb);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, game.theme.gradientTexture2);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 1, gl.RGBA, gl.UNSIGNED_BYTE, gradientArray);
    
    game.theme.offset = offsetControl.get();
    game.theme.scale = scaleControl.get();
    
    game.theme.mirror = document.getElementById('checkbox_mirror').checked;
    game.theme.repeat = document.getElementById('checkbox_repeat').checked;
    
    game.theme.offset2 = offsetControl2.get();
    game.theme.scale2 = scaleControl2.get();
    
    game.theme.mirror2 = document.getElementById('checkbox_mirror2').checked;
    game.theme.repeat2 = document.getElementById('checkbox_repeat2').checked;
    
    game.theme.shade3d = document.getElementById('checkbox_3d').checked && game.theme.direction == 0;
    game.theme.scale_invariant = document.getElementById('checkbox_scale_invariant').checked;
    
    game.theme.mode = (getPaintMode() == 'custom_image') ? 1 : 0;
    game.theme.distance_mode = (getPaintMode() == 'custom_image' || getDistanceMode() == 'distance') ? 1 : 0;
    
    game.updateTheme();
}

var customImage = new Image();
customImage.onload = function () {
    M.gl_util.loadHTMLImage2Texture(game.gl, customImage, game.theme.customImageTexture);
    updateGradientTexture();
}

document.getElementById('file_input').onchange = function (evt) {
    var tgt = evt.target;
    var files = tgt.files;

    if (files && files.length) {
        var fr = new FileReader();
        fr.onload = function () {
            customImage.src = fr.result;
        }
        fr.readAsDataURL(files[0]);
    }
}

var lastSelectedGradientPoint = null;
function gradientUpdateCallback(gradient, pendingInsertion) {
    if (pendingInsertion) {
        pendingInsertion.color = (lastSelectedGradientPoint) ? lastSelectedGradientPoint.color : [1, 0, 0];
    }
    if (gradient.controller.selectedPoint) {
        var hsl = M.colors.srgb2hsl(gradient.controller.selectedPoint.color);
        hsl = M.colors.clamp1(hsl);
        palette.h.points[0].x = hsl[0];
        palette.s.points[0].x = hsl[1];
        palette.l.points[0].x = hsl[2];
        palette.paint();
        
        var other = (gradient != mainGradient) ? mainGradient : mainGradient2;
        other.controller.selectedPoint = null;
        other.paint();
        lastSelectedGradientPoint = gradient.controller.selectedPoint;
    }
    updateGradientTexture();
}

function paletteUpdateCallback(palette) {
    var gradient = (mainGradient.controller.selectedPoint) ? mainGradient : mainGradient2;
    if (gradient.controller.selectedPoint) {
        var hsl = [
            palette.h.points[0].x,
            palette.s.points[0].x,
            palette.l.points[0].x,
        ];
        gradient.controller.selectedPoint.color = M.colors.hsl2srgb(hsl);
        gradient.paint();
        updateGradientTexture();
    }
}

var mainGradient = new M.palette.MainGradient(
    document.getElementById('gradient_canvas'),
    document.getElementById('gradient_canvas_control'),
    gradientUpdateCallback,
);

var mainGradient2 = new M.palette.MainGradient(
    document.getElementById('gradient_canvas2'),
    document.getElementById('gradient_canvas2_control'),
    gradientUpdateCallback,
);

var palette = new M.palette.HSLPalette(
    document.getElementById('canvas_hsv_h'),
    document.getElementById('canvas_hsv_h_control'),
    document.getElementById('canvas_hsv_s'),
    document.getElementById('canvas_hsv_s_control'),
    document.getElementById('canvas_hsv_l'),
    document.getElementById('canvas_hsv_l_control'),
    paletteUpdateCallback
);

var offsetControl = new M.palette.GrayPalette(
    document.getElementById('canvas_offset'),
    document.getElementById('canvas_offset_control'),
    0,
    updateGradientTexture,
);

var scaleControl = new M.palette.GrayPalette(
    document.getElementById('canvas_scale'),
    document.getElementById('canvas_scale_control'),
    0.5,
    updateGradientTexture,
);

var offsetControl2 = new M.palette.GrayPalette(
    document.getElementById('canvas_offset2'),
    document.getElementById('canvas_offset2_control'),
    0,
    updateGradientTexture,
);

var scaleControl2 = new M.palette.GrayPalette(
    document.getElementById('canvas_scale2'),
    document.getElementById('canvas_scale2_control'),
    0,
    updateGradientTexture,
);

function paintControls() {
    mainGradient.paint();
    mainGradient2.paint();
    palette.paint();
    offsetControl.paint();
    scaleControl.paint();
    offsetControl2.paint();
    scaleControl2.paint();
}

document.getElementById('checkbox_mirror').addEventListener('change', updateGradientTexture);
document.getElementById('checkbox_repeat').addEventListener('change', updateGradientTexture);
document.getElementById('checkbox_mirror2').addEventListener('change', updateGradientTexture);
document.getElementById('checkbox_repeat2').addEventListener('change', updateGradientTexture);
document.getElementById('checkbox_3d').addEventListener('change', updateGradientTexture);
document.getElementById('checkbox_scale_invariant').addEventListener('change', updateGradientTexture);
document.getElementById('preference_switch_eye').addEventListener('change', updateElementVisibility);
document.getElementById('preference_switch_color').addEventListener('change', updateElementVisibility);
document.getElementsByName('paint_mode').forEach((x) => { x.addEventListener('change', paintModeListener); });
document.getElementsByName('distance_mode').forEach((x) => { x.addEventListener('change', paintModeListener); });
document.getElementById('button_direction').addEventListener('click', toggleDirectionListener);
for (const element of document.getElementById('eye_preferences').getElementsByTagName('input')) {
    element.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
            loadFromEyeControlElements();
        }
    });
}

var canvas0 = document.getElementById("canvas");
M.gl_util.resizeCanvas(canvas, 1); // todo
M.gl_util.resizeCanvas(canvas1, 1);
canvas0.width = canvas0.width - (canvas0.width % 3); // todo
canvas0.height = canvas0.height - (canvas0.height % 3);

var gl = canvas.getContext("webgl2", {antialias: false});
if (!gl) {
    alert("no webgl2 for you!"); //todo
}
var game;

function startWithNewGLContext() {
    M.game_gl.createPositionVAO(gl);
    game = new M.game.Game(gl, document.getElementById("canvas1"));
    game.init(gl.canvas.width, gl.canvas.height);
    if (customImage.width > 0) {
        M.gl_util.loadHTMLImage2Texture(game.gl, customImage, game.theme.customImageTexture);
    }
    updateGradientTexture();
    game.requestDraw();
}

startWithNewGLContext();

setInterval(function() {
  document.getElementById("lblTiming").innerText = 'Timing: ' + M.Stat.Computer.lastTiming;
  document.getElementById("lblGLTimer").innerText = 'GL Timer: ' + M.Stat.Computer.GLTimer;
}, 500);

function raf() {
    game.raf();
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

mainGradient.controller.selectedPoint = mainGradient.controller.points[0];
updateGradientTexture();
gradientUpdateCallback(mainGradient);
updateEyeControlElements();
updateElementVisibility();

canvas.addEventListener("webglcontextlost", function(event) {
    event.preventDefault();
    console.log('lost');
}, false);

canvas.addEventListener("webglcontextrestored", function() {
    console.log('restored');
    startWithNewGLContext();
}, false);