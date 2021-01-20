
function createRenderPyramid(gl, w, h) {
	var fbuffer = gl.createFramebuffer();
	var texture0 = gl.createTexture();
	var texture1 = gl.createTexture();
	{
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture0);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		const level = 0;
		const internalFormat = gl.RGBA;
		const border = 0;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;
		const data = null;
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
					w, h, border,
					format, type, data);
		
		gl.bindTexture(gl.TEXTURE_2D, texture1);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
					Math.floor(w / 3), Math.floor(h / 3), border,
					format, type, data);
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbuffer);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture1, level);
		
	}
	return {
		fbuffer: fbuffer,
		textureL0: texture0,
		textureL1: texture1,
	};
}

function createPositionVAO(gl) {
	var positionLocation = 0; //gl.getAttribLocation(program, "a_position");

	var positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	// three 2d points
	var positions = [
	  -1, 1,
	  -1, -1,
	  1, -1,
	  -1, 1,
	  1, 1,
	  1, -1,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	var vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	gl.enableVertexAttribArray(positionLocation);

	var size = 2;          // 2 components per iteration
	var type = gl.FLOAT;   // the data is 32bit floats
	var normalize = false; // don't normalize the data
	var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	var offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);
	return vao;
}


function createRenderTexture(gl, w, h) {
	var texture = gl.createTexture();
	{
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		const level = 0;
		const internalFormat = gl.RGBA;
		const border = 0;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;
		const data = null;
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
					w, h, border,
					format, type, data);
		
	}
	return texture;
}



var includes = {
	'ff_math': loadFile('ff_math.glsl'),
	'mandel': loadFile('mandel.glsl'),
	'debug': loadFile('debug.glsl'),
}
fragmentShaderSource = preprocess(fragmentShaderSource, includes);

function createProgram1() {
	return createProgram(
		gl,
		createShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
		createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
	);
}
