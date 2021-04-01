class Mixer {
    constructor(gl, computer1, eye, bufParam, theme) {
        this.gl = gl;
        this.theme = theme;
        this.computer1 = computer1;
        this.bufParam = bufParam;
        this.mixTexture = M.gl_util.createUnderlayTexture(gl, bufParam.w, bufParam.h);
        this.mixTextureSwap = M.gl_util.createUnderlayTexture(gl, bufParam.w, bufParam.h);
        this.fbuffer = gl.createFramebuffer();
        this.program = M.game_gl.createProgramColorizer(gl);
        this.drawingEye = eye;
        
        var compArg = {
            gl: gl,
            eye: eye,
            buffer: {
                w: bufParam.w,
                h: bufParam.h,
            },
            frameBuffer: gl.createFramebuffer(), // todo
        };
        this.computer2 = new M.Computer(compArg);
        this.computer2.init(); // todo not here
        this.computer1.init(); // todo not here
        
        this.sampler = newSubPixelSampler(1, eye.samples);
        this.computer1.reset(eye, this.sampler.nextPoint()); // todo do not reset in init, becaus we reset here anyway
        this.multisampling_pass = 1;
        this.resultTexture = null;
    }
    
    _clear() {
        var gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.mixTexture, 0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		gl.clearColor(0, 1, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.mixTextureSwap, 0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		gl.clearColor(0, 1, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    
    reset(newEye) {
        this.sampler = newSubPixelSampler(1, newEye.samples);
        this.computer1.reset(newEye, this.sampler.nextPoint());
		this._clear();
        this.drawingEye = this.computer1.getDrawingEye();
        this._update(this.computer1.getTexture()); // todo needed?
        this.multisampling_pass = 1;
    }
    
    themeReset() {
        if (this.multisampling_pass > 1) {
            this.themeResetPending = true;
        }
    }
    
    _themeReset() {
        this._clear();
        this.multisampling_pass = 1;
        this._update(this.computer1.getTexture());
        this._swap();
        this.multisampling_pass = 2;
        this.sampler = newSubPixelSampler(1, this.drawingEye.samples);
        this.sampler.nextPoint();
        this.computer2.reset(this.drawingEye, this.sampler.nextPoint());
    }
    
    _update(texture) {
        var gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.mixTexture, 0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.mixTextureSwap);
        gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, this.theme.gradientTexture);
        gl.activeTexture(gl.TEXTURE4);
		gl.bindTexture(gl.TEXTURE_2D, this.theme.gradientTexture2);
        gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, this.theme.customImageTexture);
		gl.useProgram(this.program);
		//gl.clearColor(0, 1, 0, 1);
        //gl.clear(gl.COLOR_BUFFER_BIT);
		gl.uniform1i(gl.getUniformLocation(this.program, "computer"), 1);
        gl.uniform1i(gl.getUniformLocation(this.program, "prev"), 2);
        gl.uniform1i(gl.getUniformLocation(this.program, "gradient"), 3);
        gl.uniform1i(gl.getUniformLocation(this.program, "gradient2"), 4);
        gl.uniform1i(gl.getUniformLocation(this.program, "image"), 5);
        gl.uniform1i(gl.getUniformLocation(this.program, "multisampling_pass"), this.multisampling_pass);
        gl.uniform1f(gl.getUniformLocation(this.program, "screenAspectRatio"), this.bufParam.w/this.bufParam.h);
        gl.uniform1f(gl.getUniformLocation(this.program, "offset"), this.theme.offset);
        gl.uniform1f(gl.getUniformLocation(this.program, "scale"), this.theme.scale);
        gl.uniform1i(gl.getUniformLocation(this.program, "mirror"), this.theme.mirror ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(this.program, "repeat"), this.theme.repeat ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(this.program, "offset2"), this.theme.offset2);
        gl.uniform1f(gl.getUniformLocation(this.program, "scale2"), this.theme.scale2);
        gl.uniform1i(gl.getUniformLocation(this.program, "mirror2"), this.theme.mirror2 ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(this.program, "repeat2"), this.theme.repeat2 ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(this.program, "direction"), this.theme.direction);
        gl.uniform1i(gl.getUniformLocation(this.program, "shade3d"), this.theme.shade3d);
        gl.uniform1i(gl.getUniformLocation(this.program, "mode"), this.theme.mode);
        gl.uniform1f(gl.getUniformLocation(this.program, "eye_scale"), this.theme.scale_invariant ? this.drawingEye.scale : 1);
        gl.uniform1i(gl.getUniformLocation(this.program, "distance_mode"), this.theme.distance_mode);
		
		gl.viewport(0, 0, this.bufParam.w, this.bufParam.h);
		
        trace('b', '    mix');
		gl.drawArrays(gl.TRIANGLES, 0, 6);
        this.resultTexture = this.mixTexture;
    }
    
    _swap() {
        var t = this.mixTexture;
        this.mixTexture = this.mixTextureSwap;
        this.mixTextureSwap = t;
    }
    
	getDrawingEye() {
        return this.drawingEye;
	}
    
    getTexture() {
        return this.resultTexture;
    }
    
    computeSome(cb) {
        var that = this;
        function _cb(done) {
            if (that.multisampling_pass == 1) {
                if (!that.computer1.isTextureDirty()) {
                    that._update(that.computer1.getTexture());
                    that.drawingEye = that.computer1.getDrawingEye();
                }
            } else {
                if (!that.computer2.isTextureDirty()) {
                    that._update(that.computer2.getTexture());
                    that.drawingEye = that.computer1.getDrawingEye();
                }
            }
            if (that.themeResetPending) {
                that.themeResetPending = false;
                that._themeReset();
                done = false;
            }
            if (done && that.multisampling_pass < that.sampler.samples) {
                //eye.offsetY = ns.mul(ns.init(-1), eye.offsetY);
                //that.computer2.reset(that.getDrawingEye(), that.multisampling_pass);
                var eye = that.getDrawingEye().clone();
                that.computer2.reset(eye, that.sampler.nextPoint());
                that.multisampling_pass++;
                that._swap();
                done = false;
            }
            
            cb(done);
        };
        if (this.multisampling_pass == 1) {
            this.computer1.computeSome(_cb);
        } else {
            this.computer2.computeSome(_cb);
        }
    }
};

function newSubPixelSampler(pixelWidth, nSamples) {
    var steps = Math.ceil(Math.sqrt(nSamples));
    var stepSize = pixelWidth/steps;
    var x = -0.5;
    var y = 0.5;
    return {
        nextPoint: function() {
            if (nSamples == 0) {
                return null;
            }
            nSamples--;
            x++;
            if (x >= steps) {
                x = 0.5;
                y++;
            }
            return {
                x: x*stepSize - pixelWidth/2,
                y: y*stepSize - pixelWidth/2,
                scale: 1,
            };
        },
        samples: nSamples,
    };
};

M.Mixer = Mixer;