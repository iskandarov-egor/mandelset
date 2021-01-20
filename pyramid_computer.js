function newPyramidComputer(args) {
var nLevels = args.nLevels;
var c = {};
var computers = [];
var gl = args.gl;
var eye = {
	offsetX: args.eye.offsetX,
	offsetY: args.eye.offsetY,
	scale: args.eye.scale,
	iterations: args.eye.iterations,
};
c.eye = eye;
var buffer = {
	w: args.buffer.w,
	h: args.buffer.h,
}
var fbuffer = args.frameBuffer;
var program;

c.reset = function(newEye) {
	for (var i = 0; i < computers.length; i++) {
		computers[i].reset(newEye);
	}
	c.eye = {
		offsetX: newEye.offsetX,
		offsetY: newEye.offsetY,
		scale: newEye.scale,
		iterations: newEye.iterations,
	};
}

c.init = function() {	
	for (var i = 0; i < nLevels; i++) {
		var level = nLevels - i - 1;
		var compArg = {
			gl: gl,
			frameBuffer: fbuffer,
			buffer: {
				w: buffer.w / Math.pow(3, level),
				h: buffer.h / Math.pow(3, level),
			},
			eye: eye,
		}
		if (i > 0) {
			//compArg.parentTexture = computers[i - 1].getTexture();
		}
		var comp = newComputer(compArg);
		
		if (Math.floor(compArg.buffer.w) != compArg.buffer.w || Math.floor(compArg.buffer.h) != compArg.buffer.h) {
			alert('aaa 3');
		}
		comp.init();
		computers.push(comp);
		program = createProgram1();
	}
	computers.reverse();
}

c.computeSome = function(callback) {
	var i = 0;
	function cb(done) {
		if (done && i != 0) {
			parentTransfer(computers[i - 1].getTexture(), computers[i].getTexture());
		}
		callback(done && i == 0);
	}
	for (i = computers.length - 1; i >= 0; i--) {
		if (!computers[i].isDone()) {
			computers[i].computeSome(cb);
			return;
		}
	}
	callback(true);
}

c.getTexture = function() {
	for (var i = computers.length - 1; i >= 0; i--) {
		if (!computers[i].isDone()) {
			return computers[i].getTexture();
		}
	}
	return computers[0].getTexture();
}

c.getDrawingEye = function() {
	for (var i = computers.length - 1; i >= 0; i--) {
		if (!computers[i].isDone()) {
			return computers[i].getDrawingEye();
		}
	}
	return computers[0].getDrawingEye();
}

function parentTransfer(texture, parentTexture) {
	console.log('trans');
	gl.useProgram(program);
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, parentTexture);
	gl.viewport(0, 0, buffer.w, buffer.h);

	gl.uniform1i(gl.getUniformLocation(program, "onlyTransfer"), 1);
	//gl.uniform1i(gl.getUniformLocation(program, "haveParent"), 1);
	gl.uniform1i(gl.getUniformLocation(program, "parent"), 1);
	gl.uniform4f(gl.getUniformLocation(program, "viewport"),
		-buffer.w/buffer.h,
		-1,
		2,
		2
	);

	var primitiveType = gl.TRIANGLES;
	var offset = 0;
	var count = 6;
	gl.drawArrays(primitiveType, offset, count);
	gl.uniform1i(gl.getUniformLocation(program, "onlyTransfer"), 0);
}

return c;
}
