var ns = M.ns.ns;
// 2162819005114
// 76619

var canvas = document.getElementById("canvas");
var canvas1 = document.getElementById("canvas1");

var prefMVC = {
    eye: {
        iterations: 100,
        offsetX: ns.init(0),
        offsetY: ns.init(0),
        scale: 1,
        samples: 9,
        width: 0,
        height: 0,
        aggressiveness: 5,
    },
    eyeElements: {
        iterations: document.getElementById("input_iter"),
        offsetX: document.getElementById("input_x"),
        offsetY: document.getElementById("input_y"),
        scale: document.getElementById("input_scale"),
        samples: document.getElementById("input_samples"),
        width: document.getElementById("input_width"),
        height: document.getElementById("input_height"),
        aggressiveness: document.getElementById("input_aggressiveness"),
        orbit: document.getElementById('checkbox_orbit'),
    },
    colors: {
        mainGradientPoints: [
            {
                x: 0,
                color: [0, 1, 1],
            }, {
                x: 1,
                color: [0, 0, 0],
            }
        ],
        interiorColor: [0, 0, 0],
        scale: 0.5,
        offset: 0,
        mirror: false,
        repeat: true,
        offset2: 0,
        scale2: 0,
        mirror2: false,
        repeat2: true,
        shade3d: false,
        scaleInvariant: false,
        paintMode: 'gradient', // 'gradient' or 'custom_image'
        distanceMode: 'iterations', // 'iterations' or 'distance'
        direction: false, // two possible directions as bool
    },
    colorElements: {
        mirror: document.getElementById('checkbox_mirror'),
        repeat: document.getElementById('checkbox_repeat'),
        mirror2: document.getElementById('checkbox_mirror2'),
        repeat2: document.getElementById('checkbox_repeat2'),
        shade3d: document.getElementById('checkbox_3d'),
        scaleInvariant: document.getElementById('checkbox_scale_invariant'),
        distanceModeSelector: function() {
            return document.querySelector('input[name="distance_mode"]:checked');
        },
        paintModeSelector: function() {
            return document.querySelector('input[name="paint_mode"]:checked');
        },
        direction: document.getElementById('button_direction'),
    },    
    getPreferencesMode: function() {
        return document.querySelector('input[name="preference_switch"]:checked').value;
    },
};

prefMVC.eyeElements.orbit.addEventListener('change', () => {game.toggleRefOrbit();});
prefMVC.colorElements.mirror.addEventListener('change', updateGradientTexture);
prefMVC.colorElements.repeat.addEventListener('change', updateGradientTexture);
prefMVC.colorElements.mirror2.addEventListener('change', updateGradientTexture);
prefMVC.colorElements.repeat2.addEventListener('change', updateGradientTexture);
prefMVC.colorElements.shade3d.addEventListener('change', updateGradientTexture);
prefMVC.colorElements.scaleInvariant.addEventListener('change', updateGradientTexture);
document.getElementById('preference_switch_eye').addEventListener('change', updateElementVisibility);
document.getElementById('preference_switch_color').addEventListener('change', updateElementVisibility);
document.getElementsByName('paint_mode')
    .forEach((x) => { x.addEventListener('change', paintModeListener); });
document.getElementsByName('distance_mode')
    .forEach((x) => { x.addEventListener('change', paintModeListener); });
prefMVC.colorElements.direction.addEventListener('click', toggleDirectionListener);


/*
function getPaintMode() {
    return document.querySelector('input[name="paint_mode"]:checked').value;
}

function getDistanceMode() {
    return document.querySelector('input[name="distance_mode"]:checked').value;
}

function getPreferencesMode() {
    return document.querySelector('input[name="preference_switch"]:checked').value;
}
*/

prefMVC.eyeReadFromElements = function() {
    var elements = prefMVC.eyeElements;
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
    var ok = true;
    for (var key in values) {
        if (values.hasOwnProperty(key) && Number.isNaN(values[key])) {
            elements[key].classList.add('invalid_input');
            ok = false;
        } else {
            elements[key].classList.remove('invalid_input');
        }
    }
    values.iterations = Math.min(Math.max(values.iterations, 1), 1e6);
    values.aggressiveness = Math.min(Math.max(values.aggressiveness, 1), 10);
    
    if (ok) {
        prefMVC.eye = values;
    }
    return ok;
};

prefMVC.eyeUpdateElements = function() {
    prefMVC.eyeElements.scale.value = prefMVC.eye.scale.toExponential(5);
    prefMVC.eyeElements.offsetY.value = ns.tostring(prefMVC.eye.offsetY);
    prefMVC.eyeElements.offsetX.value = ns.tostring(prefMVC.eye.offsetX);
    prefMVC.eyeElements.iterations.value = prefMVC.eye.iterations;
    prefMVC.eyeElements.samples.value = prefMVC.eye.samples;
    prefMVC.eyeElements.width.value = prefMVC.eye.width;
    prefMVC.eyeElements.height.value = prefMVC.eye.height;
    prefMVC.eyeElements.aggressiveness.value = prefMVC.eye.aggressiveness;
    
    for (const element of document.getElementsByTagName('input')) {
        element.classList.remove('invalid_input');
    }
};

prefMVC.colorsReadFromElements = function() {
    prefMVC.colors = {
        mainGradientPoints: mainGradient.controller.points,
        interiorColor: interiorGradient.controller.points[0].color,
        scale: scaleControl.get(),
        offset: offsetControl.get(),
        mirror: prefMVC.colorElements.mirror.checked,
        repeat: prefMVC.colorElements.repeat.checked,
        offset2: offsetControl2.get(),
        scale2: scaleControl2.get(),
        mirror2: prefMVC.colorElements.mirror2.checked,
        repeat2: prefMVC.colorElements.repeat2.checked,
        shade3d: prefMVC.colorElements.shade3d.checked,
        scaleInvariant: prefMVC.colorElements.scaleInvariant.checked,
        paintMode: prefMVC.colorElements.paintModeSelector().value,
        distanceMode: prefMVC.colorElements.distanceModeSelector().value,
        direction: prefMVC.colors.direction, // direction is a toggle, can't read it from the elements
    };
};

prefMVC.colorsUpdateElements = function() {
//function updateColorControlElements(values) {
    mainGradient.reset_points(prefMVC.colors.mainGradientPoints);
    mainGradient.paint();
    
    offsetControl.reset(prefMVC.colors.offset);
    offsetControl.paint();
    offsetControl2.reset(prefMVC.colors.offset2);
    offsetControl2.paint();
    scaleControl.reset(prefMVC.colors.scale);
    scaleControl.paint();
    scaleControl2.reset(prefMVC.colors.scale2);
    scaleControl2.paint();
    interiorGradient.reset_points([{
        x: 0.5, color: prefMVC.colors.interiorColor,
    }]);
    interiorGradient.paint();
    
    prefMVC.colorElements.mirror.checked = prefMVC.colors.mirror;
    prefMVC.colorElements.mirror2.checked = prefMVC.colors.mirror2;
    prefMVC.colorElements.repeat.checked = prefMVC.colors.repeat;
    prefMVC.colorElements.repeat2.checked = prefMVC.colors.repeat2;
    prefMVC.colorElements.scaleInvariant.checked = prefMVC.colors.scaleInvariant;
    prefMVC.colorElements.shade3d.checked = prefMVC.colors.shade3d;
    
    if (values.distanceMode == 'distance') {
        document.querySelector('input[name="distance_mode"][value="distance"]').checked = true;
    } else {
        document.querySelector('input[name="distance_mode"][value="iterations"]').checked = true;
    }
    
    updateElementVisibility();
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
    prefMVC.eyeUpdateElements();
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
    prefMVC.eye.offsetX = ns.add(ns.init(x * prefMVC.eye.scale*(1 - factor)), prefMVC.eye.offsetX);
    prefMVC.eye.offsetY = ns.add(ns.init(y * prefMVC.eye.scale*(1 - factor)), prefMVC.eye.offsetY);
    prefMVC.eye.scale *= factor;
    prefMVC.eyeUpdateElements();
    applyEyePreferences(prefMVC.eye);
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
    prefMVC.eye.offsetX = ns.sub(
        canvasGrab.eye.offsetX,
        ns.mul(ns.init((p.x - canvasGrab.p.x)*2*canvas.width/canvas.height), ns.init(prefMVC.eye.scale)),
    );
    prefMVC.eye.offsetY = ns.add(
        canvasGrab.eye.offsetY,
        ns.mul(ns.init((p.y - canvasGrab.p.y)*2), ns.init(prefMVC.eye.scale)),
    );
        
    prefMVC.eyeUpdateElements();
    applyEyePreferences(prefMVC.eye);
});

function updateElementVisibility() {
    var mode = prefMVC.colorElements.paintModeSelector().value;
    
    var colorMode = (prefMVC.getPreferencesMode() == 'color');
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
    document.getElementById('custom_image_cell').style.display = (mode == 'custom_image') ? 'flex' : 'none';
    document.getElementById('distance_mode').style.display = (!prefMVC.colors.direction) ? 'flex' : 'none';
    document.getElementById('scale_invariance_control').style.visibility =
        (prefMVC.colorElements.distanceModeSelector().value == 'distance') ? 'visible' : 'hidden';
    
    for (const element of document.getElementsByClassName('distance_factor_modifier')) {
        element.style.display = (mode != 'gradient' || !prefMVC.colors.direction) ? 'flex' : 'none';
    }
    for (const element of document.getElementsByClassName('normal_factor_modifier')) {
        element.style.display = (mode != 'gradient' || prefMVC.colors.direction) ? 'flex' : 'none';
    }
    
    paintControls();
}

function paintModeListener() {
    updateElementVisibility();
    updateGradientTexture();
}

function toggleDirectionListener() {
    prefMVC.colors.direction = !prefMVC.colors.direction;
    updateElementVisibility();
    updateGradientTexture();
};

function download(filename, text) { // browser programming is hard
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function newlines2crlf(s) { // i dont like browser programming
    if (s.includes('\n') && !s.includes('\r\n')) {
        return s.replaceAll('\n', '\r\n');
    } else {
        return s;
    }
}

function saveViewClickListener() {
    var values = loadEyePreferencesFromControlElements();
    if (values == null) {
        return;
    }
    
    values.offsetX = ns.tostring(values.offsetX);
    values.offsetY = ns.tostring(values.offsetY);
    
    download("mandelbrot_view.txt", newlines2crlf(JSON.stringify(values, null, 2)));
};

function loadViewInputOnChange(evt) {
    var tgt = evt.target;
    var files = tgt.files;

    if (files && files.length) {
        var fr = new FileReader();
        fr.onload = function (e) {
            var values = JSON.parse(e.target.result);
        
            var types = {
                iterations: 'number',
                offsetX: 'string',
                offsetY: 'string',
                scale: 'number',
                samples: 'number',
                width: 'number',
                height: 'number',
                aggressiveness: 'number',
            };
            
            for (var k in types) {
                if (typeof(values[k]) != types[k]) {
                    return;
                }
            }
            
            values.offsetX = ns.fromstring(values.offsetX);
            values.offsetY = ns.fromstring(values.offsetY);
            
            applyEyePreferences(values);
        }
        fr.readAsText(files[0]);
    }
}

function loadColorsInputOnChange(evt) {
    var tgt = evt.target;
    var files = tgt.files;

    if (files && files.length) {
        var fr = new FileReader();
        fr.onload = function (e) {
            var values = JSON.parse(e.target.result);
        
            var types = {                
                mainGradientPoints: 'object',//
                interiorColor: 'object',//
                scale: 'number',//
                offset: 'number',//
                mirror: 'boolean',//
                repeat: 'boolean',//
                offset2: 'number',//
                scale2: 'number',//
                mirror2: 'boolean',//
                repeat2: 'boolean',//
                shade3d: 'boolean',//
                scaleInvariant: 'boolean',//
                paintMode: 'string',
                distanceMode: 'string',
            };
            
            for (var k in types) {
                if (typeof(values[k]) != types[k]) {
                    return;
                }
            }
            
            applyColorPreferences(values);
            prefMVC.eyeUpdateElements();
            mainGradient.controller.selectionGroup.selectedPoint = mainGradient.controller.points[0];
            gradientUpdateCallback(mainGradient);
            
        }
        fr.readAsText(files[0]);
    }
}

function loadViewClickListener() {
    document.getElementById("load_view_input").click();
};

function loadColorsClickListener() {
    document.getElementById("load_colors_input").click();
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
    
    game.updateTheme();
}

function updateGradientTexture() {
    prefMVC.colorsReadFromElements();
    applyColorPreferences(prefMVC.colors);
}

function saveColorsClickListener() {
    prefMVC.colorsReadFromElements();
    
    download("mandelbrot_colors.txt", newlines2crlf(JSON.stringify(prefMVC.colors, null, 2)));
};

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

document.getElementById('load_view_input').onchange = loadViewInputOnChange;
document.getElementById('load_colors_input').onchange = loadColorsInputOnChange;

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
    true, prefMVC.colors.mainGradientPoints,
);

var interiorGradient = new M.palette.Gradient(
    document.getElementById('interior_gradient_canvas'),
    document.getElementById('interior_gradient_canvas_control'),
    gradientUpdateCallback,
    gradientSelectionGroup,
    false,
    false, [{
        x: 0.5,
        color: prefMVC.colors.interiorColor,
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
    prefMVC.colors.offset,
    updateGradientTexture,
);

var scaleControl = new M.palette.Slider(
    document.getElementById('canvas_scale'),
    document.getElementById('canvas_scale_control'),
    prefMVC.colors.scale,
    updateGradientTexture,
);

var offsetControl2 = new M.palette.Slider(
    document.getElementById('canvas_offset2'),
    document.getElementById('canvas_offset2_control'),
    prefMVC.colors.offset2,
    updateGradientTexture,
);

var scaleControl2 = new M.palette.Slider(
    document.getElementById('canvas_scale2'),
    document.getElementById('canvas_scale2_control'),
    prefMVC.colors.scale2,
    updateGradientTexture,
);

document.getElementById('button_save_view').addEventListener('click', saveViewClickListener);
document.getElementById('button_load_view').addEventListener('click', loadViewClickListener);
document.getElementById('button_save_colors').addEventListener('click', saveColorsClickListener);
document.getElementById('button_load_colors').addEventListener('click', loadColorsClickListener);

function paintControls() {
    mainGradient.paint();
    interiorGradient.paint();
    palette.paint();
    offsetControl.paint();
    scaleControl.paint();
    offsetControl2.paint();
    scaleControl2.paint();
};

for (const element of document.getElementsByTagName('input')) {
    element.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
            if (prefMVC.eyeReadFromElements()) {
                applyEyePreferences(prefMVC.eye);
            }
        }
    });
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
    if (customImage.width > 0) {
        M.gl_util.loadHTMLImage2Texture(game.gl, customImage, game.theme.customImageTexture);
    }
    
    applyEyePreferences(prefMVC.eye);
    updateGradientTexture();
    game.requestDraw();
}

prefMVC.eye.width = window.devicePixelRatio*document.getElementById("main_stack").clientWidth;
prefMVC.eye.height = window.devicePixelRatio*document.getElementById("main_stack").clientHeight;
startWithNewGLContext();

applyEyePreferences(prefMVC.eye); //resizeMainCanvasElement(prefs.eye.width, prefs.eye.height);

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
        var hide = (compTime < 5000);
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

updateElementVisibility();

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

mainGradient.controller.selectionGroup.selectedPoint = mainGradient.controller.points[0];
updateGradientTexture();
gradientUpdateCallback(mainGradient);
prefMVC.eyeUpdateElements();

canvas.addEventListener("webglcontextlost", function(event) {
    event.preventDefault();
    console.log('lost');
}, false);

canvas.addEventListener("webglcontextrestored", function() {
    console.log('restored');
    startWithNewGLContext();
}, false);
