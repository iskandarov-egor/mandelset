class Mixer {
    constructor(gl, computer1, bufParam) {
        this.computer1 = computer1;
        this.bufParam = bufParam;
        this.mixTexture = M.gl_util.createUnderlayTexture(gl, bufParam.w, bufParam.h);
        this.mixTextureSwap = M.gl_util.createUnderlayTexture(gl, bufParam.w, bufParam.h);
        this.fbuffer = gl.createFramebuffer();
        this.program = M.game_gl.createProgramColorizer();
        this.drawingEye = Game.eye; //todo aaa
    }
    
    reset(newEye) {
        this.computer1.reset(newEye);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.mixTexture, 0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
        this.drawingEye = this.computer1.getDrawingEye();
        this._update(this.computer1.getTexture());
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
		gl.uniform1i(gl.getUniformLocation(this.program, "computer"), 1);
        gl.uniform1f(gl.getUniformLocation(this.program, "screenAspectRatio"), this.bufParam.w/this.bufParam.h);
        //gl.uniform1i(gl.getUniformLocation(this.program, "prev"), 2);
		
		gl.viewport(0, 0, this.bufParam.w, this.bufParam.h);
		
		gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
	getDrawingEye() {
        return this.drawingEye;
	}
    
    getTexture() {
        return this.mixTexture;
    }
    
    computeSome(cb) {
        var that = this;
        function _cb(done) {
            that._update(that.computer1.getTexture());
            that.drawingEye = that.computer1.getDrawingEye();
            cb(done);
        };
        this.computer1.computeSome(_cb);
    }
};

M.Mixer = Mixer;