var ns = M.ns.ns;
// 2162819005114
// 76619

var canvas = document.getElementById("canvas");
var canvas1 = document.getElementById("canvas1");

function updateEyeControlElements() {
    document.getElementById("input_scale").value = game.eye.scale.toExponential(5);
    document.getElementById("input_x").value = ns.tostring(game.eye.offsetX);
    document.getElementById("input_y").value = ns.tostring(game.eye.offsetY);
    document.getElementById("input_iter").value = game.eye.iterations;
    document.getElementById("input_samples").value = game.eye.samples;
    document.getElementById("input_width").value = canvas.width;
    document.getElementById("input_height").value = canvas.height;
    document.getElementById("input_aggressiveness").value = game.aggressiveness;
    
    for (const element of document.getElementsByTagName('input')) {
        element.classList.remove('invalid_input');
    }
}

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

function loadFromEyeControlElements() {
    var elements = {
        iterations: document.getElementById("input_iter"),
        offsetX: document.getElementById("input_x"),
        offsetY: document.getElementById("input_y"),
        scale: document.getElementById("input_scale"),
        samples: document.getElementById("input_samples"),
        width: document.getElementById("input_width"),
        height: document.getElementById("input_height"),
        aggressiveness: document.getElementById("input_aggressiveness"),
    };
    var values = {
        iterations: parseFloat(elements.iterations.value),
        offsetX: ns.fromstring(elements.offsetX.value),
        offsetY: ns.fromstring(elements.offsetY.value),
        scale: parseFloat(elements.scale.value),
        samples: parseFloat(elements.samples.value),
        width: parseInt(elements.width.value),
        height: parseInt(elements.height.value),
        aggressiveness: parseInt(elements.aggressiveness.value),
    };
    var abort = false;
    for (var key in values) {
        if (values.hasOwnProperty(key) && Number.isNaN(values[key])) {
            elements[key].classList.add('invalid_input');
            abort = true;
        } else {
            elements[key].classList.remove('invalid_input');
        }
    }
    values.iterations = Math.min(Math.max(values.iterations, 1), 1e6);
    values.aggressiveness = Math.min(Math.max(values.aggressiveness, 1), 10);
    if (abort) {
        return;
    }
    
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
    updateEyeControlElements();
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
    game.eye.offsetX = ns.sub(
        canvasGrab.eye.offsetX,
        ns.mul(ns.init((p.x - canvasGrab.p.x)*2*canvas.width/canvas.height), ns.init(game.eye.scale)),
    );
    game.eye.offsetY = ns.add(
        canvasGrab.eye.offsetY,
        ns.mul(ns.init((p.y - canvasGrab.p.y)*2), ns.init(game.eye.scale)),
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
    for (const element of document.getElementsByClassName('color_preferences')) {
        if (colorMode) {
            element.classList.remove('hide');
        } else {
            element.classList.add('hide');
        }
    }
    for (const element of document.getElementsByClassName('eye_preferences')) {
        if (!colorMode) {
            element.classList.remove('hide');
        } else {
            element.classList.add('hide');
        }
    }
    if (colorMode) {
        mainGradient.paint();
        palette.paint();
        offsetControl.paint();
        scaleControl.paint();
    }
    
    for (const element of document.getElementsByClassName('main_gradient_cell')) {
        element.style.display = (mode == 'gradient' || mode == '2_gradients') ? 'flex' : 'none';
    }
    
    document.getElementById('palette_cell').style.display = (mode == 'gradient') ? 'flex' : 'none';
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
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, game.theme.gradientTexture2);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 1, gl.RGBA, gl.UNSIGNED_BYTE, gradientArray);
    
    game.theme.interiorColor = interiorGradient.controller.points[0].color;
    
    game.theme.offset = offsetControl.get();
    game.theme.scale = scaleControl.get();
    
    game.theme.mirror = document.getElementById('checkbox_mirror').checked;
    game.theme.repeat = document.getElementById('checkbox_repeat').checked;
    
    game.theme.offset2 = offsetControl2.get();
    game.theme.scale2 = scaleControl2.get();
    
    game.theme.mirror2 = document.getElementById('checkbox_mirror2').checked;
    game.theme.repeat2 = document.getElementById('checkbox_repeat2').checked;
    
    game.theme.shade3d = document.getElementById('checkbox_3d').checked;
    game.theme.scaleInvariant = document.getElementById('checkbox_scale_invariant').checked;
    
    game.theme.mode = (getPaintMode() == 'custom_image') ? 1 : 0;
    game.theme.distance_mode = (getDistanceMode() == 'distance') ? 1 : 0;
    
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
    if (gradient.controller.selectionGroup.selectedPoint) {
        var hsl = M.colors.srgb2hsl(gradient.controller.selectionGroup.selectedPoint.color);
        hsl = M.colors.clamp1(hsl);
        palette.h.points[0].x = hsl[0];
        palette.s.points[0].x = hsl[1];
        palette.l.points[0].x = hsl[2];
        palette.paint();
        
        lastSelectedGradientPoint = gradient.controller.selectionGroup.selectedPoint;
    }
    updateGradientTexture();
}

function paletteUpdateCallback(palette) {
    if (mainGradient.controller.selectionGroup.selectedPoint) {
        var hsl = [
            palette.h.points[0].x,
            palette.s.points[0].x,
            palette.l.points[0].x,
        ];
        mainGradient.controller.selectionGroup.selectedPoint.color = M.colors.hsl2srgb(hsl);
        mainGradient.paint();
        interiorGradient.paint();
        updateGradientTexture();
    }
}

var gradientSelectionGroup = new M.palette.SelectionGroup();

var mainGradient = new M.palette.Gradient(
    document.getElementById('gradient_canvas'),
    document.getElementById('gradient_canvas_control'),
    gradientUpdateCallback,
    gradientSelectionGroup,
    true,
    true, [
        {
            x: 0,
            color: [0, 1, 1],
        }, {
            x: 1,
            color: [0, 0, 0],
        }
    ]
);

var interiorGradient = new M.palette.Gradient(
    document.getElementById('interior_gradient_canvas'),
    document.getElementById('interior_gradient_canvas_control'),
    gradientUpdateCallback,
    gradientSelectionGroup,
    false,
    false, [{
        x: 0.5,
        color: [0, 0, 0],
    }]
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

var offsetControl = new M.palette.Slider(
    document.getElementById('canvas_offset'),
    document.getElementById('canvas_offset_control'),
    0,
    updateGradientTexture,
);

var scaleControl = new M.palette.Slider(
    document.getElementById('canvas_scale'),
    document.getElementById('canvas_scale_control'),
    0.5,
    updateGradientTexture,
);

var offsetControl2 = new M.palette.Slider(
    document.getElementById('canvas_offset2'),
    document.getElementById('canvas_offset2_control'),
    0,
    updateGradientTexture,
);

var scaleControl2 = new M.palette.Slider(
    document.getElementById('canvas_scale2'),
    document.getElementById('canvas_scale2_control'),
    0,
    updateGradientTexture,
);

function paintControls() {
    mainGradient.paint();
    interiorGradient.paint();
    palette.paint();
    offsetControl.paint();
    scaleControl.paint();
    offsetControl2.paint();
    scaleControl2.paint();
}

document.getElementById('checkbox_orbit').addEventListener('change', () => {game.toggleRefOrbit();});
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
for (const element of document.getElementsByTagName('input')) {
    element.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
            loadFromEyeControlElements();
        }
    });
}

resizeMainCanvasElement(
    window.devicePixelRatio*document.getElementById("main_stack").clientWidth,
    window.devicePixelRatio*document.getElementById("main_stack").clientHeight
);

var gl = canvas.getContext("webgl2", {antialias: false});
if (!gl) {
    alert("webgl2 not supported");
    throw new Error("webgl2 not supported");
}
var game;

function startWithNewGLContext() {
    var prev = game;
    M.gl_resources.createPositionVAO(gl);
    game = new M.game.Game(gl, document.getElementById("canvas1"));
    game.initBuffer();
    if (customImage.width > 0) {
        M.gl_util.loadHTMLImage2Texture(game.gl, customImage, game.theme.customImageTexture);
    }
    if (prev) {
        game.setEye(prev.eye);
    }
    updateGradientTexture();
    game.requestDraw();
}

startWithNewGLContext();

setInterval(function() {
  //document.getElementById("lblTiming").innerText = 'Timing: ' + M.Stat.Computer.lastTiming;
  //document.getElementById("lblGLTimer").innerText = 'GL Timer: ' + M.Stat.Computer.GLTimer;
}, 500);

function raf() {
    game.raf();
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

mainGradient.controller.selectionGroup.selectedPoint = mainGradient.controller.points[0];
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