class Mixer {
    constructor(gl, computer, bufParam, theme) {
        this.gl = gl;
        this.theme = theme;
        this.computer = computer;
        this.bufParam = bufParam;
        this.mixTexture = M.gl_resources.createUnderlayTexture(gl, bufParam.w, bufParam.h);
        this.mixTextureSwap = M.gl_resources.createUnderlayTexture(gl, bufParam.w, bufParam.h);
        this.fbuffer = gl.createFramebuffer();
        this.program = M.gl_resources.createProgramColorizer(gl);
        
        this.sampler = null;
        this.drawingEye = null;
        this.multisampling_pass = 1;
        this.resultTexture = null;
        this.firstPassTexture = M.gl_resources.createRenderTexture(gl, this.bufParam.w, this.bufParam.h);
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
        this.computer.reset(newEye, this.sampler.nextPoint(), {pass: 1});
		this._clear();
        this.drawingEye = this.computer.getDrawingEye();
        this._update(this.computer.getTexture()); // todo needed?
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
        this._update(this.firstPassTexture);
        this._swap();
        this.multisampling_pass = 2;
        this.sampler = newSubPixelSampler(1, this.drawingEye.samples);
        this.sampler.nextPoint();
        this.computer.reset(this.drawingEye, this.sampler.nextPoint(), {pass: this.multisampling_pass});
    }
    
    _saveFirstPass(texture) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.readBuffer(gl.COLOR_ATTACHMENT0);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.firstPassTexture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA32UI, 0, 0, this.bufParam.w, this.bufParam.h, 0);
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
        gl.uniform1f(gl.getUniformLocation(this.program, "scale_invariance_factor"), this.theme.scale_invariant ? this.drawingEye.scale : 0);
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
    
    isTextureDirty() {
        return this.drawingEye == null;
    }
    
    computeSome(cb) {
        var that = this;
        function _cb(done) {
            if (that.multisampling_pass == 1) {
                if (!that.computer.isTextureDirty()) {
                    that._saveFirstPass(that.computer.getTexture());
                    that._update(that.firstPassTexture);
                    that.drawingEye = that.computer.getDrawingEye();
                }
            } else {
                if (!that.computer.isTextureDirty()) {
                    that._update(that.computer.getTexture());
                    that.drawingEye = that.computer.getDrawingEye();
                }
            }
            if (that.themeResetPending) {
                that.themeResetPending = false;
                that._themeReset();
                done = false;
            }
            if (done && that.multisampling_pass < that.sampler.samples) {
                that.multisampling_pass++;
                var eye = that.getDrawingEye().clone();
                that.computer.reset(eye, that.sampler.nextPoint(), {pass: that.multisampling_pass});
                that._swap();
                done = false;
            }
            
            cb(done);
        };
        if (this.multisampling_pass == 1) {
            this.computer.computeSome(_cb);
        } else {
            this.computer.computeSome(_cb);
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