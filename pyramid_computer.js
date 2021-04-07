class PyramidComputer {
    constructor(args) {
        this.nLevels = args.nLevels;
        this.computers = [];
        this.gl = args.gl;
        this.buffer = {
            w: args.buffer.w,
            h: args.buffer.h,
        }
        this.fbuffer = args.frameBuffer;
        this.refOrbitFinder = new M.mandel.OrbitFinder(1);
        this.program = M.gl_resources.createProgramPyramid(this.gl);
        this.pass_hint = 1;
    }
    
    _nActiveLayers() {
        var total_iterations = this.eye.iterations * this.buffer.w * this.buffer.h;
        var threshold = 1000 * 2560 * 1440;
        return (this.pass_hint > 1 || total_iterations < threshold) ? 1 : this.computers.length;
    }
    
    reset(newEye, sampleShift, opts) {
        this.eye = newEye.clone();
        this.pass_hint = opts.pass;
        console.log(this._nActiveLayers());
        for (var i = 0; i < this._nActiveLayers(); i++) {
            if (i > 0) {
                var c = this.computers[i].bufParam;
                var parent = this.computers[i - 1].bufParam;
                // if parent buffer size is not divisible by 3, we should make an extra shift
                // to align the sample points. it's sufficient to align the top-left and bottom-left
                // points of parent and child in the normalized buffer space, i.e. find a shift that
                // satisfies these equalities:
                // 1: (-parent.w/parent.h, -1) =
                //  = (0*shift.scale + shift.x - c.w/2, 0*shift.scale + shift.y - c.h/2)*2/c.h
                // 2: (-parent.w/parent.h, -1 + 2*(3*c.h/parent.h)) =
                //  = (0*shift.scale + shift.x - c.w/2, c.h*shift.scale + shift.y - c.h/2)*2/c.h
                var shift = {
                    x: (c.w - parent.w*c.h/parent.h)/2,
                    y: 0,
                    scale: (3*c.h)/parent.h,
                };
                
                // apply the parent shift as well. scale2*(scale*x + offset) + offset2
                var parentShift = this.computers[i - 1].sampleShift;
                shift = {
                    x: parentShift.scale*shift.x + parentShift.x/3,
                    y: parentShift.scale*shift.y + parentShift.y/3,
                    scale: parentShift.scale*shift.scale,
                };
                this.computers[i].reset(newEye, shift, {isPyramidLayer: (i != this._nActiveLayers() - 1)});
            } else {
                this.computers[i].reset(newEye, sampleShift, {isPyramidLayer: (i != this._nActiveLayers() - 1)});
            }
        }
    }
    
    init() {
        var gl = this.gl;
        this.computers = [];
        var buffer = {
            w: this.buffer.w,
            h: this.buffer.h,
        };
        for (var i = 0; i < this.nLevels; i++) {
            var compArg = {
                gl: gl,
                frameBuffer: this.fbuffer,
                buffer: {
                    w: buffer.w,
                    h: buffer.h,
                },
                refOrbitFinder: this.refOrbitFinder,
            }
            buffer.w = Math.floor((buffer.w + 1) / 3);
            buffer.h = Math.floor((buffer.h + 1) / 3);
            if (i < this.nLevels - 1) {
                //compArg.isPyramidLayer = true;
            }
            
            var comp = new M.Computer(compArg);
            
            comp.init();
            this.computers.push(comp);
        }
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
        
        for (i = this._nActiveLayers() - 1; i >= 0; i--) {
            if (!this.computers[i].isDone()) {
                trace('b', '  comp layer', i);
                this.computers[i].computeSome(cb);
                return;
            }
        }
        callback(true);
    }
    
    getTexture() {
        for (var i = this._nActiveLayers() - 1; i >= 1; i--) {
            if (this.computers[i - 1].isTextureDirty()) {
                console.log(i, this.computers[i]);
                return this.computers[i].getTexture();
            }
        }
        return this.computers[0].getTexture();
    }
    
    isTextureDirty() {
        return this.computers[this._nActiveLayers() - 1].isTextureDirty();
    }
    
    getDrawingEye() {
        return this.drawingEye;
    }
    
    parentTransfer(texture, parentTexture) {
        var gl = this.gl;
        gl.useProgram(this.program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, parentTexture);
        gl.viewport(0, 0, this.buffer.w, this.buffer.h);

        gl.uniform1i(gl.getUniformLocation(this.program, "parent"), 1);
        gl.uniform4f(gl.getUniformLocation(this.program, "viewport"),
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