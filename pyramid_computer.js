class PyramidComputer {
    constructor(args) {
        this.nLevels = args.nLevels;
        this.computers = [];
        this.gl = args.gl;
        this.eye = args.eye.clone();
        this.buffer = {
            w: args.buffer.w,
            h: args.buffer.h,
        }
        this.fbuffer = args.frameBuffer;
        this.refOrbitFinder = new M.mandel.OrbitFinder(1);
        this.drawingEye = game.eye; // todo aaa
    }
    
    reset(newEye) {
        for (var i = 0; i < this.computers.length; i++) {
            this.computers[i].reset(newEye);
        }
        this.eye = newEye.clone();
    }
    
    init() {    
        var gl = this.gl;
        for (var i = 0; i < this.nLevels; i++) {
            var level = this.nLevels - i - 1;
            var compArg = {
                gl: gl,
                frameBuffer: this.fbuffer,
                buffer: {
                    w: Math.floor(this.buffer.w / Math.pow(3, level)),
                    h: Math.floor(this.buffer.h / Math.pow(3, level)),
                },
                eye: this.eye,
                refOrbitFinder: this.refOrbitFinder,
            }
            if (i > 0) {
                compArg.isPyramidLayer = true;
            }
            
            var comp = new M.Computer(compArg);
            
            comp.init();
            this.computers.push(comp);
        }
        this.program2 = M.game_gl.createProgramPyramid(gl);
        this.computers.reverse();
    }
    
    computeSome(callback) {
        var i = 0;
        var that = this;
        function cb(done) {
            if (done && i != 0) {
                trace('b', '  trans', i);
                that.parentTransfer(that.computers[i - 1].getTexture(), that.computers[i].getTexture());
                //that.computers[i - 1].drawingEye = that.computers[i].getDrawingEye();
            }
            
            that.drawingEye = that.computers[i].getDrawingEye();
            callback(done && i == 0);
        }
        for (i = this.computers.length - 1; i >= 0; i--) {
            if (!this.computers[i].isDone()) {
                this.computers[i].computeSome(cb);
                return;
            }
        }
        callback(true);
    }
    
    getTexture() {
        for (var i = this.computers.length - 1; i >= 0; i--) {
            /*
            if (!this.computers[i].isDone()) {
                if (this.computers[i].state >= 3) {
                    return this.computers[i].getTexture();
                } else if (i < this.computers.length - 1 && this.computers[i + 1].state >= 3) {
                    return this.computers[i + 1].getTexture();
                } else {
                    return null;
                }
            }
            */
            if (!this.computers[i].isDone()) {
                trace('b', 'ret', i);
                return this.computers[i].getTexture();
            }
        }
        //return null;
                trace('b', 'ret', 0);
        return this.computers[0].getTexture();
    }
    
    getDrawingEye() {
        return this.drawingEye;
    }
    
    parentTransfer(texture, parentTexture) {
        var gl = this.gl;
        gl.useProgram(this.program2);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, parentTexture);
        gl.viewport(0, 0, this.buffer.w, this.buffer.h);

        gl.uniform1i(gl.getUniformLocation(this.program2, "parent"), 1);
        gl.uniform4f(gl.getUniformLocation(this.program2, "viewport"),
            -this.buffer.w/this.buffer.h,
            -1,
            2,
            2
        );

        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
    }
    
    getOverlays() {
        var list = [];
        for (var i = 0; i < this.computers.length; i++) {
            list = list.concat(this.computers[i].getOverlays());
        }
        return list;
    }
}

M.PyramidComputer = PyramidComputer;