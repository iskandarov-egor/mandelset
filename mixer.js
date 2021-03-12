class Mixer {
    constructor(gl, computer1, bufParam, multisampling_passes) {
        this.computer1 = computer1;
        this.bufParam = bufParam;
        this.mixTexture = M.gl_util.createUnderlayTexture(gl, bufParam.w, bufParam.h);
        this.mixTextureSwap = M.gl_util.createUnderlayTexture(gl, bufParam.w, bufParam.h);
        this.fbuffer = gl.createFramebuffer();
        this.program = M.game_gl.createProgramColorizer();
        this.drawingEye = Game.eye; //todo aaa
        
        var compArg = {
            gl: gl,
            eye: Game.eye, //todo aaa
            buffer: {
                w: bufParam.w,
                h: bufParam.h,
            },
            frameBuffer: gl.createFramebuffer(), // todo
        };
        this.computer2 = new M.Computer(compArg);
        this.computer2.init(); // todo not here
        this.multisampling_pass = 1;
        this.multisampling_passes = multisampling_passes;
        this.resultTexture = null;
    }
    
    reset(newEye) {
        this.computer1.reset(newEye);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.mixTexture, 0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		gl.clearColor(0, 1, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.mixTextureSwap, 0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		gl.clearColor(0, 1, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.drawingEye = this.computer1.getDrawingEye();
        this._update(this.computer1.getTexture());
        this.multisampling_pass = 1;
    }
    
    _update(texture) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.mixTexture, 0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.mixTextureSwap);
		gl.useProgram(this.program);
		//gl.clearColor(0, 1, 0, 1);
        //gl.clear(gl.COLOR_BUFFER_BIT);
		gl.uniform1i(gl.getUniformLocation(this.program, "computer"), 1);
        gl.uniform1i(gl.getUniformLocation(this.program, "prev"), 2);
        gl.uniform1i(gl.getUniformLocation(this.program, "multisampling_pass"), this.multisampling_pass);
        gl.uniform1f(gl.getUniformLocation(this.program, "screenAspectRatio"), this.bufParam.w/this.bufParam.h);
        //gl.uniform1i(gl.getUniformLocation(this.program, "prev"), 2);
		
		gl.viewport(0, 0, this.bufParam.w, this.bufParam.h);
		
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
                if (that.computer1.state >= 3) {
                    that._update(that.computer1.getTexture());
                    that.drawingEye = that.computer1.getDrawingEye();
                }
            } else {
                if (that.computer2.state >= 3) {
                    that._update(that.computer2.getTexture());
                    that.drawingEye = that.computer1.getDrawingEye();
                }
            }
            if (done && that.multisampling_pass < that.multisampling_passes) {
                var eye = cloneEye(that.computer1.getDrawingEye());
                //eye.offsetY = ns.mul(ns.init(-1), eye.offsetY);
                that.computer2.reset(eye, that.multisampling_pass);
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

M.Mixer = Mixer;