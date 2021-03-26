var canvas = document.querySelector("#canvas");

var ns = M.ns.ns;
// 2162819005114
// 76619

function loadLabels() {
    document.getElementById("input_scale").value = 1/Game.eye.scale;
    document.getElementById("input_x").value = ns.number(Game.eye.offsetX).toFixed(30);
    document.getElementById("input_y").value = ns.number(Game.eye.offsetY).toFixed(30);
    document.getElementById("input_iter").value = Game.eye.iterations;
}

function saveLabels() {
    Game.eye.iterations = parseFloat(document.getElementById("input_iter").value);
    //Game.eye.previewScale = parseFloat(document.getElementById("preview").value);
    Game.eye.offsetX = ns.init(parseFloat(document.getElementById("input_x").value));
    Game.eye.offsetY = ns.init(parseFloat(document.getElementById("input_y").value));
    Game.eye.scale = 1/parseFloat(document.getElementById("input_scale").value);
    Game.setEye(Game.eye);
}

canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const dir = Math.sign(e.deltaY);
    var ratio = canvas.width/canvas.height;
    var x = e.offsetX / canvas.clientHeight * 2 - ratio;
    var y = e.offsetY / canvas.clientHeight * -2 + 1;
    var factor = Math.pow(1.1, dir);
    
    // :: var cx = x * Game.eye.scale + Game.eye.offsetX;
    // :: Game.eye.offsetX = cx + (Game.eye.offsetX - cx) * factor;
    // :: Game.eye.offsetX = x * Game.eye.scale + Game.eye.offsetX + (-x * Game.eye.scale) * factor;
    // :: Game.eye.offsetX = x * Game.eye.scale*(1 - factor) + Game.eye.offsetX;
    Game.eye.offsetX = ns.add(ns.init(x * Game.eye.scale*(1 - factor)), Game.eye.offsetX);
    Game.eye.offsetY = ns.add(ns.init(y * Game.eye.scale*(1 - factor)), Game.eye.offsetY);
    Game.eye.scale *= factor;
    loadLabels();
    Game.setEye(Game.eye);
    Game.requestDraw();
});

var acc = 0;

canvas.addEventListener("mousemove", e => {
    if (e.buttons % 2 == 0) {
        return;
    }
    // todo test when page is zoomed
    //var canvasX = 
    Game.eye.offsetX = ns.sub(
        Game.eye.offsetX,
        ns.mul(ns.init(e.movementX*2/canvas.clientHeight), ns.init(Game.eye.scale)),
    );
    Game.eye.offsetY = ns.add(
        Game.eye.offsetY,
        ns.mul(ns.init(e.movementY*2/canvas.clientHeight), ns.init(Game.eye.scale)),
    );
        
    loadLabels();
    Game.setEye(Game.eye);
    Game.requestDraw();
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
    document.getElementById('distance_mode').style.display = (Game.theme.direction == 0) ? 'flex' : 'none';
    document.getElementById('scale_invariance_control').style.visibility = (getDistanceMode() == 'distance') ? 'visible' : 'hidden';
    
    for (const element of document.getElementsByClassName('distance_factor_modifier')) {
        element.style.display = (mode != 'gradient' || Game.theme.direction == 0) ? 'flex' : 'none';
    }
    for (const element of document.getElementsByClassName('normal_factor_modifier')) {
        element.style.display = (mode != 'gradient' || Game.theme.direction == 1) ? 'flex' : 'none';
    }
    
    paintControls();
}

function paintModeListener() {
    updateElementVisibility();
    updateGradientTexture();
}

function toggleDirectionListener() {
    Game.theme.direction = (Game.theme.direction == 0) ? 1 : 0;
    updateElementVisibility();
    updateGradientTexture();
};

function myclick() {
    saveLabels();
    
    Game.requestDraw();
    
}

var utexture = M.gl_util.createRenderTexture(gl, renderW, renderH);

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
    gl.bindTexture(gl.TEXTURE_2D, Game.theme.gradientTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 1, gl.RGBA, gl.UNSIGNED_BYTE, gradientArray);
    
    if (getPaintMode() == '2_gradients') {
        M.palette.paintGradient(mainGradient2.controller.points, 1024, paintCb);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, Game.theme.gradientTexture2);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 1, gl.RGBA, gl.UNSIGNED_BYTE, gradientArray);
    
    Game.theme.offset = offsetControl.get();
    Game.theme.scale = scaleControl.get();
    
    Game.theme.mirror = document.getElementById('checkbox_mirror').checked;
    Game.theme.repeat = document.getElementById('checkbox_repeat').checked;
    
    Game.theme.offset2 = offsetControl2.get();
    Game.theme.scale2 = scaleControl2.get();
    
    Game.theme.mirror2 = document.getElementById('checkbox_mirror2').checked;
    Game.theme.repeat2 = document.getElementById('checkbox_repeat2').checked;
    
    Game.theme.shade3d = document.getElementById('checkbox_3d').checked && Game.theme.direction == 0;
    Game.theme.scale_invariant = document.getElementById('checkbox_scale_invariant').checked;
    
    Game.theme.mode = (getPaintMode() == 'custom_image') ? 1 : 0;
    Game.theme.distance_mode = (getPaintMode() == 'custom_image' || getDistanceMode() == 'distance') ? 1 : 0;
    
    Game.updateGradient();
}

var customImage = new Image();
customImage.onload = function () {
    console.log('onload');
    M.gl_util.loadHTMLImage2Texture(Game.gl(), customImage, Game.theme.customImageTexture);
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


updateElementVisibility();
updateGradientTexture();
loadLabels();
Game.requestDraw();

setInterval(function() {
  document.getElementById("lblTiming").innerText = 'Timing: ' + M.Stat.Computer.lastTiming;
  document.getElementById("lblGLTimer").innerText = 'GL Timer: ' + M.Stat.Computer.GLTimer;
}, 500);



