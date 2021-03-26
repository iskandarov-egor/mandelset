var ns = M.ns.ns;

var Game = {
    state: {
        name: 'idle',
    },
    screenDirty: true,
};


var zeroEye = new M.mandel.Eye({
    scale: 1,
    offsetX: ns.init(0),
    offsetY: ns.init(0),
    iterations: 100,
});

var tante = new M.mandel.Eye({    
    scale: 1/1244664094013.3586,
    offsetX: ns.init(-0.774680610626900745252498836635),
    offsetY: ns.init(0.137416885603736660392826252064),
    iterations: 4000,
});

Game.eye = zeroEye;
//Game.eye = tante;
Game.eye.dirty = false;

document.querySelector("#canvas");
document.querySelector("#canvas1");
var overlayCtx = canvas1.getContext('2d');
var gl = canvas.getContext("webgl2", {antialias: false});
if (!gl) {
    alert("no webgl2 for you!");
}

M.game_gl.init();

//canvas.onselectstart = function () { return false; }
//canvas1.onselectstart = function () { return false; }

M.gl_util.resizeCanvas(canvas, 1);
M.gl_util.resizeCanvas(canvas1, 1);

gl.canvas.width = gl.canvas.width - (gl.canvas.width % 3);
gl.canvas.height = gl.canvas.height - (gl.canvas.height % 3);
var renderW = gl.canvas.width/1;
var renderH = gl.canvas.height/1;


var postitionVao = M.game_gl.createPositionVAO(gl);
var fbuffer = gl.createFramebuffer();


Game.theme = {
    customImageTexture: gl.createTexture(),
    gradientTexture: M.gl_util.createGradientTexture(gl, 1024, 1), // todo try RGB instead of RGBA
    gradientTexture2: M.gl_util.createGradientTexture(gl, 1024, 1), // todo try RGB instead of RGBA
    offset: 0,
    scale: 0.0,
    repeat: false,
    mirror: false,
    offset2: 0,
    scale2: 0.0,
    repeat2: false,
    mirror2: false,
    shade3d: false,
    scale_invariant: false,
    direction: 0,
    mode: 0, // 0 - gradients, 1 - image texture
    distance_mode: 0, // 0 - iteration count, 1 - distance estimation
};

var swapTexture;

var compArg2 = {
    gl: gl,
    eye: Game.eye,
    buffer: {
        w: renderW,
        h: renderH,
    },
    frameBuffer: fbuffer,
    nLevels: 3,
    //_orbitLenLimit: 2,
};


var globalOverlay = new M.CanvasOverlay(canvas1);

var comp2 = new M.Computer(compArg2);
//var comp2 = new M.PyramidComputer(compArg2);
comp2.init();

var mixer = new M.Mixer(gl, comp2, compArg2.buffer, 2, Game.theme);
var compOverlays = comp2.getOverlays();

var program2 = M.gl_util.createProgram(
    gl,
    M.gl_util.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource2),
    M.gl_util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource2)
);

Game.gl = function() {
    return gl;
}

program2 = M.game_gl.createProgramVisualizer();

//var lt = new M.LoadTester(gl); // for debugging

function visualizeBuffer(texture) {
    if (Game.state.name != 'idle') {
        //return;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.useProgram(program2);
    //gl.clearColor(0, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var drawingEye = mixer.getDrawingEye();
    gl.uniform1i(gl.getUniformLocation(program2, "fgTexture"), 1);
    gl.uniform1f(gl.getUniformLocation(program2, "screenAspectRatio"), gl.canvas.width/gl.canvas.height);
    gl.uniform1f(gl.getUniformLocation(program2, "eyeX"), 0);
    gl.uniform1f(gl.getUniformLocation(program2, "eyeY"), 0);
    gl.uniform1f(gl.getUniformLocation(program2, "scale"), Game.eye.scale);
    gl.uniform1f(gl.getUniformLocation(program2, "fgEyeX"), ns.number(ns.sub(drawingEye.offsetX, Game.eye.offsetX)));
    gl.uniform1f(gl.getUniformLocation(program2, "fgEyeY"), ns.number(ns.sub(drawingEye.offsetY, Game.eye.offsetY)));
    gl.uniform1f(gl.getUniformLocation(program2, "fgScale"), drawingEye.scale);
    
    
    gl.activeTexture(gl.TEXTURE2);
    gl.uniform1i(gl.getUniformLocation(program2, "bgTexture"), 2);
    
    gl.bindTexture(gl.TEXTURE_2D, underlay.texture);
    if (underlay.eye){ // todo is true ok?
        gl.uniform1f(gl.getUniformLocation(program2, "bgEyeX"), ns.number(ns.sub(underlay.eye.offsetX, Game.eye.offsetX)));
        gl.uniform1f(gl.getUniformLocation(program2, "bgEyeY"), ns.number(ns.sub(underlay.eye.offsetY, Game.eye.offsetY)));
        gl.uniform1f(gl.getUniformLocation(program2, "bgScale"), underlay.eye.scale);
    } else {
        // we are required by opengl to bind some texture anyway
        //gl.bindTexture(gl.TEXTURE_2D, underlay.texture);

    }
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    overlayCtx.clearRect(0, 0, canvas1.width, canvas1.height);
    compOverlays.forEach(o => o.draw(Game.eye));
    globalOverlay.draw(Game.eye);
}

// underlay is the image that contains combined rendering results of the previous views.
// this image will be used as a background so that the user has something to look at
// while the current view is being rendered.
class Underlay {
    constructor(gl, w, h){
        this.w = w;
        this.h = h;
        this.gl = gl;
        this.texture = M.gl_util.createUnderlayTexture(gl, w, h);
        this.texture2 = M.gl_util.createUnderlayTexture(gl, w, h);
        this.eye = null;
        this.fbuffer1 = gl.createFramebuffer();
        this.fbuffer2 = gl.createFramebuffer();
    }
    
    combine(eye, texture) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer1);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture2, 0);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.useProgram(program2);
        //gl.clearColor(0, 1, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1i(gl.getUniformLocation(program2, "fgTexture"), 1);
        gl.uniform1f(gl.getUniformLocation(program2, "screenAspectRatio"), gl.canvas.width/gl.canvas.height);
        gl.uniform1f(gl.getUniformLocation(program2, "eyeX"), 0);
        gl.uniform1f(gl.getUniformLocation(program2, "eyeY"), 0);
        gl.uniform1f(gl.getUniformLocation(program2, "scale"), eye.scale);
        gl.uniform1f(gl.getUniformLocation(program2, "fgEyeX"), 0);
        gl.uniform1f(gl.getUniformLocation(program2, "fgEyeY"), 0);
        gl.uniform1f(gl.getUniformLocation(program2, "fgScale"), eye.scale);
                
        gl.activeTexture(gl.TEXTURE2);
        gl.uniform1i(gl.getUniformLocation(program2, "bgTexture"), 2);
        if (this.eye){
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1f(gl.getUniformLocation(program2, "bgEyeX"), ns.number(ns.sub(this.eye.offsetX, eye.offsetX)));
            gl.uniform1f(gl.getUniformLocation(program2, "bgEyeY"), ns.number(ns.sub(this.eye.offsetY, eye.offsetY)));
            gl.uniform1f(gl.getUniformLocation(program2, "bgScale"), this.eye.scale);
        } else {
            // we are required by opengl to bind some texture anyway
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        
        
        gl.viewport(0, 0, this.w, this.h);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        var tmp = this.texture;
        this.texture = this.texture2;
        this.texture2 = tmp;
        this.eye = eye.clone();
    }
    
};

var underlay = new Underlay(gl, renderW, renderH);

Game.draw = function() {
    
    mixer.reset(eye);
    comp2.computeAll();
    //comp1.computeAll();
    
    //visualizeBuffer(pyramid.textureL1);
}

Game.requestDraw = function() {
    if (Game.state.name == 'idle') {
        mainLoop();
    } else {
    }
}

Game.updateGradient = function() {
    mixer.gradientReset();
    Game.requestDraw();
};

Game.drawDirect = function() {
    mixer.reset(Game.eye);
    comp2.computeAll();
    Game.screenDirty = true;
}

function mainLoop() {
    Game.state = { name: 'loop'    };
    var startTime0 = performance.now();
    var startTime = performance.now();
    var sleep2workRatio = 0.2;
    
    function timer() {
        if (Game.eye.dirty) {
            trace('loop', 'dirty eye2');
            underlay.combine(mixer.getDrawingEye(), mixer.getTexture());
            mixer.reset(Game.eye);
            Game.eye.dirty = false;
        }
        var now = performance.now();
        startTime = now;
        trace('loop', 'timer');
        mixer.computeSome(cb);
    }
    
    function cb(done) {
        Game.screenDirty = true;
        if (Game.eye.dirty) {
            trace('loop', 'dirty eye');
            underlay.combine(mixer.getDrawingEye(), mixer.getTexture());
            mixer.reset(Game.eye);
            
            done = false;
            Game.eye.dirty = false;
        }
        var now = performance.now();
        if (done) {
            trace('loop', 'all done', now - startTime0);
            //visualizeBuffer(pyramid.textureL1);
            Game.state = { name: 'idle'    };
        } else {
            var workTime = now - startTime;
            trace('loop', 'sleep for', workTime * sleep2workRatio);
            setTimeout(timer, workTime * sleep2workRatio);
        }
            //visualizeBuffer(pyramid.textureL1);
    }
    
    mixer.computeSome(cb);
}

Game.setEye = function(newEye) {
    Game.eye = newEye;
    Game.eye.dirty = true;
    Game.screenDirty = true;
}

Game.resizeCanvas = function() {
    resizeCanvas(canvas, 1/Game.eye.previewScale);
}

function raf() {
    if (Game.screenDirty) {
        trace('raf', '<raf>');
        visualizeBuffer(mixer.getTexture());
        Game.screenDirty = false;
    }
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
