var ns = M.ns.ns;

M.game = {};

var zeroEye = new M.mandel.Eye({
    scale: 1,
    offsetX: ns.init(0),
    offsetY: ns.init(0),
    iterations: 100,
    samples: 1,
});

var tante = new M.mandel.Eye({    
    scale: 1/1244664094013.3586,
    offsetX: ns.init(-0.774680610626900745252498836635),
    offsetY: ns.init(0.137416885603786620428934384108),
    iterations: 4000,
    samples: 1,
});
var ddLimitEye = new M.mandel.Eye({
    offsetX: ns.init(-1.6331395811715201),
    offsetY: ns.init(0),
    scale: 1/1.361052241705286e+30,
    iterations: 1000,
    samples: 1,
});

class Game {
    constructor(gl, overlayCanvas) {
        this.states = {
            idle: 0,
            loop: 1,
        };
        this.gl = gl;
        this.eye = zeroEye;
        this.eye_dirty = false;
        this.theme = {
            customImageTexture: gl.createTexture(),
            gradientTexture: M.gl_resources.createGradientTexture(gl, 1024, 1), // todo try RGB instead of RGBA
            gradientTexture2: M.gl_resources.createGradientTexture(gl, 1024, 1), // todo try RGB instead of RGBA
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
        this.globalOverlay = new M.CanvasOverlay(overlayCanvas);
        this.overlayCanvas = overlayCanvas;
        this.screenDirty = true;
        this.theme.customImageTexture = gl.createTexture();
        this.theme.gradientTexture = M.gl_resources.createGradientTexture(gl, 1024, 1); // todo try RGB instead of RGBA
        this.theme.gradientTexture2= M.gl_resources.createGradientTexture(gl, 1024, 1); // todo try RGB instead of RGBA
        this.program = M.gl_resources.createProgramCompositor(gl);
        this.state = this.states.idle;
        this.showRefOrbit = false;
    }
    
    initBuffer() {
        var gl = this.gl;
        
        var compArg = {
            gl: gl,
            eye: this.eye,
            buffer: {
                w: gl.drawingBufferWidth,
                h: gl.drawingBufferHeight,
            },
            frameBuffer: gl.createFramebuffer(),
            nLevels: 3,
            //_orbitLenLimit: 2,
        };
        var comp = new M.Computer(compArg);
        //var comp = new M.PyramidComputer(compArg);
        comp.init();
        this.mixer = new M.Mixer(gl, comp, compArg.buffer, this.theme);
        //this.mixer.reset(this.eye);
        this.setEye(this.eye);
        this.underlay = new Underlay(gl, this.program, gl.drawingBufferWidth, gl.drawingBufferHeight);
        this.compOverlays = comp.getOverlays();
    }
    
    setEye(eye) {
        this.eye = eye;
        this.eye_dirty = true;
        this.screenDirty = true;
    }
    
    toggleRefOrbit() {
        this.showRefOrbit = !this.showRefOrbit;
        this.screenDirty = true;
    }
    
    _visualizeBuffer(texture) {
        var gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.useProgram(this.program);
        //gl.clearColor(0, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        var drawingEye = this.mixer.getDrawingEye();
        gl.uniform1i(gl.getUniformLocation(this.program, "fgTexture"), 1);
        gl.uniform1f(gl.getUniformLocation(this.program, "screenAspectRatio"), gl.canvas.width/gl.canvas.height);
        gl.uniform1f(gl.getUniformLocation(this.program, "eyeX"), 0);
        gl.uniform1f(gl.getUniformLocation(this.program, "eyeY"), 0);
        gl.uniform1f(gl.getUniformLocation(this.program, "scale"), this.eye.scale);
        gl.uniform1f(gl.getUniformLocation(this.program, "fgEyeX"), ns.number(ns.sub(drawingEye.offsetX, this.eye.offsetX)));
        gl.uniform1f(gl.getUniformLocation(this.program, "fgEyeY"), ns.number(ns.sub(drawingEye.offsetY, this.eye.offsetY)));
        gl.uniform1f(gl.getUniformLocation(this.program, "fgScale"), drawingEye.scale);
                
        gl.activeTexture(gl.TEXTURE2);
        gl.uniform1i(gl.getUniformLocation(this.program, "bgTexture"), 2);
        
        gl.bindTexture(gl.TEXTURE_2D, this.underlay.texture);
        if (this.underlay.eye){ // todo is true ok?
            gl.uniform1f(gl.getUniformLocation(this.program, "bgEyeX"), ns.number(ns.sub(this.underlay.eye.offsetX, this.eye.offsetX)));
            gl.uniform1f(gl.getUniformLocation(this.program, "bgEyeY"), ns.number(ns.sub(this.underlay.eye.offsetY, this.eye.offsetY)));
            gl.uniform1f(gl.getUniformLocation(this.program, "bgScale"), this.underlay.eye.scale);
        }
        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        var overlayCtx = this.overlayCanvas.getContext('2d');
        overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        if (this.showRefOrbit) {
            this.compOverlays.forEach(o => o.draw(this.eye));
            this.globalOverlay.draw(this.eye);
        }
    }
    
    requestDraw() {
        if (this.state == this.states.idle) {
            this._mainLoop();
        }
    }
    
    updateTheme = function() {
        this.mixer.themeReset();
        this.requestDraw();
    };
    
    _mainLoop(game) {
        this.state = this.states.loop;
        var startTime0 = performance.now();
        var startTime = performance.now();
        var sleep2workRatio = 0.2;
        var that = this;
        
        function timer() {
            if (that.eye_dirty) {
                trace('loop', 'dirty eye2');
                if (!that.mixer.isTextureDirty()) {
                    that.underlay.combine(that.mixer.getDrawingEye(), that.mixer.getTexture());
                }
                that.mixer.reset(that.eye);
                that.eye_dirty = false;
            }
            var now = performance.now();
            startTime = now;
            trace('loop', 'timer');
            that.mixer.computeSome(cb);
        }
        
        function cb(done) {
            that.screenDirty = true;
            if (that.eye_dirty) {
                trace('loop', 'dirty eye');
                if (!that.mixer.isTextureDirty()) {
                    that.underlay.combine(that.mixer.getDrawingEye(), that.mixer.getTexture());
                }
                that.mixer.reset(that.eye);
                
                done = false;
                that.eye_dirty = false;
            }
            var now = performance.now();
            if (done) {
                trace('loop', 'all done', now - startTime0);
                that.state = that.states.idle;
            } else {
                var workTime = now - startTime;
                trace('loop', 'sleep for', workTime * sleep2workRatio);
                setTimeout(timer, workTime * sleep2workRatio);
            }
        }
        
        timer();
    }
    
    raf() {
        if (this.screenDirty && this.mixer.getDrawingEye()) {
            trace('raf', '<raf>');
            this._visualizeBuffer(this.mixer.getTexture());
            this.screenDirty = false;
        }
    }
};

M.game.Game = Game;

//var lt = new M.LoadTester(gl); // for debugging


// underlay is the image that contains combined rendering results of the previous views.
// this image will be used as a background so that the user has something to look at
// while the current view is being rendered.
class Underlay {
    constructor(gl, compositorProgram, w, h){
        this.w = w;
        this.h = h;
        this.gl = gl;
        this.texture = M.gl_resources.createUnderlayTexture(gl, w, h);
        this.texture2 = M.gl_resources.createUnderlayTexture(gl, w, h);
        this.eye = null;
        this.fbuffer1 = gl.createFramebuffer();
        this.fbuffer2 = gl.createFramebuffer();
        this.program = compositorProgram;
    }
    
    combine(eye, texture) {
        var gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer1);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture2, 0);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.useProgram(this.program);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1i(gl.getUniformLocation(this.program, "fgTexture"), 1);
        gl.uniform1f(gl.getUniformLocation(this.program, "screenAspectRatio"), gl.canvas.width/gl.canvas.height);
        gl.uniform1f(gl.getUniformLocation(this.program, "eyeX"), 0);
        gl.uniform1f(gl.getUniformLocation(this.program, "eyeY"), 0);
        gl.uniform1f(gl.getUniformLocation(this.program, "scale"), eye.scale);
        gl.uniform1f(gl.getUniformLocation(this.program, "fgEyeX"), 0);
        gl.uniform1f(gl.getUniformLocation(this.program, "fgEyeY"), 0);
        gl.uniform1f(gl.getUniformLocation(this.program, "fgScale"), eye.scale);
                
        gl.activeTexture(gl.TEXTURE2);
        gl.uniform1i(gl.getUniformLocation(this.program, "bgTexture"), 2);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        if (this.eye){
            gl.uniform1f(gl.getUniformLocation(this.program, "bgEyeX"), ns.number(ns.sub(this.eye.offsetX, eye.offsetX)));
            gl.uniform1f(gl.getUniformLocation(this.program, "bgEyeY"), ns.number(ns.sub(this.eye.offsetY, eye.offsetY)));
            gl.uniform1f(gl.getUniformLocation(this.program, "bgScale"), this.eye.scale);
        } else {
            gl.uniform1f(gl.getUniformLocation(this.program, "bgEyeX"), 0);
            gl.uniform1f(gl.getUniformLocation(this.program, "bgEyeY"), 0);
            gl.uniform1f(gl.getUniformLocation(this.program, "bgScale"), 1);
        }
                
        gl.viewport(0, 0, this.w, this.h);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        var tmp = this.texture;
        this.texture = this.texture2;
        this.texture2 = tmp;
        this.eye = eye.clone();
    }
    
};

if (false) {
Game.draw = function() {
    mixer.reset(eye);
    comp2.computeAll();
    //comp1.computeAll();
    
    //visualizeBuffer(pyramid.textureL1);
}
Game.resizeCanvas = function() {
    resizeCanvas(canvas, 1/Game.eye.previewScale);
}
}

