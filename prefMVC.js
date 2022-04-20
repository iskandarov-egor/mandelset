M.prefMVC = {
    eye: {
        iterations: 100,
        offsetX: ns.init(0),
        offsetY: ns.init(0),
        scale: 1,
        samples: 9,
        width: 0,
        height: 0,
        aggressiveness: 5,
        refOrbit: false,
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
        customImage: new Image(),
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
    callbacks: {
        eyeChanged: function() {},
        colorsChanged: function() {},
    },
};

M.prefMVC._colorsUpdateCallback = function() {
    M.prefMVC.colorsReadFromElements();
    M.prefMVC.callbacks.colorsChanged();
};

M.prefMVC._updateElementVisibility = function() {
    var mode = M.prefMVC.colors.paintMode;
    
    function hideIff(cond, element) {
        if (cond) {
            element.classList.add('hide');
        } else {
            element.classList.remove('hide');
        }
    }
    
    var colorMode = (M.prefMVC.getPreferencesMode() == 'color');
    for (const element of document.getElementsByClassName('color_preferences')) {
        hideIff(!colorMode, element);
    }
    for (const element of document.getElementsByClassName('eye_preferences')) {
        hideIff(colorMode, element);
    }
    if (colorMode) {
        M.prefMVC._mainGradient.paint();
        M.prefMVC._palette.paint();
        M.prefMVC._offsetControl.paint();
        M.prefMVC._scaleControl.paint();
    }
    
    for (const element of document.getElementsByClassName('main_gradient_cell')) {
        element.style.display = (mode == 'gradient' || mode == '2_gradients') ? 'flex' : 'none';
    }
    
    document.getElementById('palette_cell').style.display = (mode == 'gradient') ? 'flex' : 'none';
    document.getElementById('custom_image_cell').style.display = (mode == 'custom_image') ? 'flex' : 'none';
    document.getElementById('distance_mode').style.display = (!M.prefMVC.colors.direction) ? 'flex' : 'none';
    document.getElementById('scale_invariance_control').style.visibility =
        (!M.prefMVC.colors.direction && M.prefMVC.colorElements.distanceModeSelector().value == 'distance')
        ? 'visible' : 'hidden';
    
    for (const element of document.getElementsByClassName('distance_factor_modifier')) {
        element.style.display = (mode != 'gradient' || !M.prefMVC.colors.direction) ? 'flex' : 'none';
    }
    for (const element of document.getElementsByClassName('normal_factor_modifier')) {
        element.style.display = (mode != 'gradient' || M.prefMVC.colors.direction) ? 'flex' : 'none';
    }
    
    /*hideIff(
        mode != 'custom_image' || M.prefMVC.colors.customImage.width > 0,
        M.prefMVC.colorElements.selectImageHint
    );*/
        
    M.prefMVC._mainGradient.paint();
    M.prefMVC._interiorGradient.paint();
    M.prefMVC._palette.paint();
    M.prefMVC._offsetControl.paint();
    M.prefMVC._scaleControl.paint();
    M.prefMVC._offsetControl2.paint();
    M.prefMVC._scaleControl2.paint();
}

M.prefMVC.eyeReadFromElements = function() {
    var elements = M.prefMVC.eyeElements;
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
        M.prefMVC.eye = values;
    }
    return ok;
};

M.prefMVC.eyeUpdateElements = function() {
    M.prefMVC.eyeElements.scale.value = M.prefMVC.eye.scale.toExponential(5);
    M.prefMVC.eyeElements.offsetY.value = ns.tostring(M.prefMVC.eye.offsetY);
    M.prefMVC.eyeElements.offsetX.value = ns.tostring(M.prefMVC.eye.offsetX);
    M.prefMVC.eyeElements.iterations.value = M.prefMVC.eye.iterations;
    M.prefMVC.eyeElements.samples.value = M.prefMVC.eye.samples;
    M.prefMVC.eyeElements.width.value = M.prefMVC.eye.width;
    M.prefMVC.eyeElements.height.value = M.prefMVC.eye.height;
    M.prefMVC.eyeElements.aggressiveness.value = M.prefMVC.eye.aggressiveness;
    
    for (const element of document.getElementsByTagName('input')) {
        element.classList.remove('invalid_input');
    }
};

M.prefMVC.colorsReadFromElements = function() {
    M.prefMVC.colors = {
        mainGradientPoints: M.prefMVC._mainGradient.controller.points,
        interiorColor: M.prefMVC._interiorGradient.controller.points[0].color,
        scale: M.prefMVC._scaleControl.get(),
        offset: M.prefMVC._offsetControl.get(),
        mirror: M.prefMVC.colorElements.mirror.checked,
        repeat: M.prefMVC.colorElements.repeat.checked,
        offset2: M.prefMVC._offsetControl2.get(),
        scale2: M.prefMVC._scaleControl2.get(),
        mirror2: M.prefMVC.colorElements.mirror2.checked,
        repeat2: M.prefMVC.colorElements.repeat2.checked,
        shade3d: M.prefMVC.colorElements.shade3d.checked,
        scaleInvariant: M.prefMVC.colorElements.scaleInvariant.checked,
        paintMode: M.prefMVC.colorElements.paintModeSelector().value,
        distanceMode: M.prefMVC.colorElements.distanceModeSelector().value,
        direction: M.prefMVC.colors.direction, // direction is a toggle, can't read it from the elements
        customImage: M.prefMVC.colors.customImage,
    };
};

M.prefMVC.colorsUpdateElements = function() {
    M.prefMVC._mainGradient.reset_points(M.prefMVC.colors.mainGradientPoints);
    M.prefMVC._mainGradient.paint();
    
    M.prefMVC._offsetControl.reset(M.prefMVC.colors.offset);
    M.prefMVC._offsetControl.paint();
    M.prefMVC._offsetControl2.reset(M.prefMVC.colors.offset2);
    M.prefMVC._offsetControl2.paint();
    M.prefMVC._scaleControl.reset(M.prefMVC.colors.scale);
    M.prefMVC._scaleControl.paint();
    M.prefMVC._scaleControl2.reset(M.prefMVC.colors.scale2);
    M.prefMVC._scaleControl2.paint();
    M.prefMVC._interiorGradient.reset_points([{
        x: 0.5, color: M.prefMVC.colors.interiorColor,
    }]);
    M.prefMVC._interiorGradient.paint();
    
    M.prefMVC.colorElements.mirror.checked = M.prefMVC.colors.mirror;
    M.prefMVC.colorElements.mirror2.checked = M.prefMVC.colors.mirror2;
    M.prefMVC.colorElements.repeat.checked = M.prefMVC.colors.repeat;
    M.prefMVC.colorElements.repeat2.checked = M.prefMVC.colors.repeat2;
    M.prefMVC.colorElements.scaleInvariant.checked = M.prefMVC.colors.scaleInvariant;
    M.prefMVC.colorElements.shade3d.checked = M.prefMVC.colors.shade3d;
    
    if (M.prefMVC.colors.distanceMode == 'distance') {
        document.querySelector('input[name="distance_mode"][value="distance"]').checked = true;
    } else {
        document.querySelector('input[name="distance_mode"][value="iterations"]').checked = true;
    }
    
    if (M.prefMVC.colors.paintMode == 'custom_image') {
        document.querySelector('input[name="paint_mode"][value="custom_image"]').checked = true;
    } else {
        document.querySelector('input[name="paint_mode"][value="gradient"]').checked = true;
    }
    
    M.prefMVC._updateElementVisibility();
};

M.prefMVC._saveViewClickListener = function() {
    var ok = M.prefMVC.eyeReadFromElements();
    if (!ok) {
        return;
    }
    
    var js = Object.assign({}, M.prefMVC.eye);
    
    js.offsetY = ns.tostring(js.offsetY);
    js.offsetX = ns.tostring(js.offsetX);
    
    M.utils.download("mandelbrot_view.txt", M.prefMVC._newlines2crlf(JSON.stringify(js, null, 2)));
};

M.prefMVC._saveColorsClickListener = function() {
    M.prefMVC.colorsReadFromElements();
    
    M.utils.download("mandelbrot_colors.txt",
        M.prefMVC._newlines2crlf(JSON.stringify(M.prefMVC.colors, null, 2)));
};

M.prefMVC._loadViewClickListener = function() {
    document.getElementById("load_view_input").click();
};

M.prefMVC._loadColorsClickListener = function() {
    document.getElementById("load_colors_input").click();
};

M.prefMVC.eyeElements.orbit.addEventListener('change', () => {
    M.prefMVC.eye.refOrbit = M.prefMVC.eyeElements.orbit.checked;
    M.prefMVC.callbacks.eyeChanged();
});

document.getElementsByName('paint_mode').forEach((x) => {
    x.addEventListener('change', function() {
        M.prefMVC.colorsReadFromElements();
        M.prefMVC._updateElementVisibility();
        M.prefMVC._colorsUpdateCallback();
    })
});
document.getElementsByName('distance_mode').forEach((x) => {
    x.addEventListener('change', function() {
        M.prefMVC.colorsReadFromElements();
        M.prefMVC._updateElementVisibility();
        M.prefMVC._colorsUpdateCallback();
    })
});

M.prefMVC.colorElements.direction.addEventListener('click', function() {
    M.prefMVC.colors.direction = !M.prefMVC.colors.direction;
    M.prefMVC._updateElementVisibility();
    M.prefMVC._colorsUpdateCallback();
});

M.prefMVC._lastSelectedGradientPoint = null;
M.prefMVC._gradientUpdateCallback = function(gradient, pendingInsertion) {
    if (pendingInsertion) {
        pendingInsertion.color =
            M.prefMVC._lastSelectedGradientPoint ? M.prefMVC._lastSelectedGradientPoint.color : [1, 0, 0];
    }
    if (gradient.controller.selectionGroup.selectedPoint) {
        var hsl = M.colors.srgb2hsl(gradient.controller.selectionGroup.selectedPoint.color);
        hsl = M.colors.clamp1(hsl);
        M.prefMVC._palette.h.points[0].x = hsl[0];
        M.prefMVC._palette.s.points[0].x = hsl[1];
        M.prefMVC._palette.l.points[0].x = hsl[2];
        M.prefMVC._palette.paint();
        
        M.prefMVC._lastSelectedGradientPoint = gradient.controller.selectionGroup.selectedPoint;
    }
    M.prefMVC._colorsUpdateCallback();
};

M.prefMVC._gradientSelectionGroup = new M.palette.SelectionGroup();

M.prefMVC._mainGradient = new M.palette.Gradient(
    document.getElementById('gradient_canvas'),
    document.getElementById('gradient_canvas_control'),
    M.prefMVC._gradientUpdateCallback,
    M.prefMVC._gradientSelectionGroup,
    true,
    true, M.prefMVC.colors.mainGradientPoints,
);

M.prefMVC._interiorGradient = new M.palette.Gradient(
    document.getElementById('interior_gradient_canvas'),
    document.getElementById('interior_gradient_canvas_control'),
    M.prefMVC._gradientUpdateCallback,
    M.prefMVC._gradientSelectionGroup,
    false,
    false, [{
        x: 0.5,
        color: M.prefMVC.colors.interiorColor,
    }]
);

M.prefMVC._paletteUpdateCallback = function(palette) {
    if (M.prefMVC._mainGradient.controller.selectionGroup.selectedPoint) {
        var hsl = [
            palette.h.points[0].x,
            palette.s.points[0].x,
            palette.l.points[0].x,
        ];
        M.prefMVC._mainGradient.controller.selectionGroup.selectedPoint.color = M.colors.hsl2srgb(hsl);
        M.prefMVC._mainGradient.paint();
        M.prefMVC._interiorGradient.paint();
        M.prefMVC._colorsUpdateCallback();
    }
};

M.prefMVC._palette = new M.palette.HSLPalette(
    document.getElementById('canvas_hsv_h'),
    document.getElementById('canvas_hsv_h_control'),
    document.getElementById('canvas_hsv_s'),
    document.getElementById('canvas_hsv_s_control'),
    document.getElementById('canvas_hsv_l'),
    document.getElementById('canvas_hsv_l_control'),
    M.prefMVC._paletteUpdateCallback
);

M.prefMVC._offsetControl = new M.palette.Slider(
    document.getElementById('canvas_offset'),
    document.getElementById('canvas_offset_control'),
    M.prefMVC.colors.offset,
    M.prefMVC._colorsUpdateCallback,
);

M.prefMVC._scaleControl = new M.palette.Slider(
    document.getElementById('canvas_scale'),
    document.getElementById('canvas_scale_control'),
    M.prefMVC.colors.scale,
    M.prefMVC._colorsUpdateCallback,
);

M.prefMVC._offsetControl2 = new M.palette.Slider(
    document.getElementById('canvas_offset2'),
    document.getElementById('canvas_offset2_control'),
    M.prefMVC.colors.offset2,
    M.prefMVC._colorsUpdateCallback,
);

M.prefMVC._scaleControl2 = new M.palette.Slider(
    document.getElementById('canvas_scale2'),
    document.getElementById('canvas_scale2_control'),
    M.prefMVC.colors.scale2,
    M.prefMVC._colorsUpdateCallback,
);

M.prefMVC._newlines2crlf = function(s) {
    // aaaaa
    if (s.includes('\n') && !s.includes('\r\n')) {
        return s.replaceAll('\n', '\r\n');
    } else {
        return s;
    }
}

M.prefMVC._loadViewInputOnChange = function(evt) {
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
            
            Object.assign(M.prefMVC.eye, values);
            M.prefMVC.callbacks.eyeChanged();
            M.prefMVC.eyeUpdateElements();
        }
        fr.readAsText(files[0]);
    }
}

M.prefMVC._loadColorsInputOnChange = function(evt) {
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
            
            values.customImage = M.prefMVC.colors.customImage;
            M.prefMVC.colors = values;
            M.prefMVC.colorsUpdateElements();
            M.prefMVC._colorsUpdateCallback();
            M.prefMVC.eyeUpdateElements();
            M.prefMVC._mainGradient.controller.selectionGroup.selectedPoint
                = M.prefMVC._mainGradient.controller.points[0];
            M.prefMVC._gradientUpdateCallback(M.prefMVC._mainGradient);
            
        }
        fr.readAsText(files[0]);
    }
}

M.prefMVC.colors.customImage.onload = function () {
    M.prefMVC._colorsUpdateCallback();
}

M.prefMVC.colorElements.mirror.addEventListener('change', M.prefMVC._colorsUpdateCallback);
M.prefMVC.colorElements.repeat.addEventListener('change', M.prefMVC._colorsUpdateCallback);
M.prefMVC.colorElements.mirror2.addEventListener('change', M.prefMVC._colorsUpdateCallback);
M.prefMVC.colorElements.repeat2.addEventListener('change', M.prefMVC._colorsUpdateCallback);
M.prefMVC.colorElements.shade3d.addEventListener('change', M.prefMVC._colorsUpdateCallback);
M.prefMVC.colorElements.scaleInvariant.addEventListener('change', M.prefMVC._colorsUpdateCallback);
document.getElementById('preference_switch_eye').addEventListener('change', M.prefMVC._updateElementVisibility);
document.getElementById('preference_switch_color').addEventListener('change', function() {
    M.utils.usage_ping("color-prefs");
    M.prefMVC._updateElementVisibility();
});

document.getElementById('load_view_input').onchange = M.prefMVC._loadViewInputOnChange;
document.getElementById('load_colors_input').onchange = M.prefMVC._loadColorsInputOnChange;
document.getElementById('button_save_view').addEventListener('click', M.prefMVC._saveViewClickListener);
document.getElementById('button_load_view').addEventListener('click', M.prefMVC._loadViewClickListener);

document.getElementById('button_save_colors').addEventListener('click', M.prefMVC._saveColorsClickListener);
document.getElementById('button_load_colors').addEventListener('click', M.prefMVC._loadColorsClickListener);

document.getElementById('file_input').onchange = function (evt) {
    var tgt = evt.target;
    var files = tgt.files;

    if (files && files.length) {
        var fr = new FileReader();
        fr.onload = function () {
            M.prefMVC.colors.customImage.src = fr.result;
        }
        fr.readAsDataURL(files[0]);
    }
}

for (const element of document.getElementsByTagName('input')) {
    element.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
            if (M.prefMVC.eyeReadFromElements()) {
                M.prefMVC.callbacks.eyeChanged();
            }
        }
    });
}

M.prefMVC.eyeUpdateElements();

M.prefMVC.colorsUpdateElements();
M.prefMVC._gradientUpdateCallback(M.prefMVC._mainGradient);
M.prefMVC._updateElementVisibility();