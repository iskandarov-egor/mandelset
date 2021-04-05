M.gl_resources = {};

var fragmentShaderSource = `#include <fragment_computer>`;
fragmentShaderSource = M.gl_util.preprocess(fragmentShaderSource);

var fragmentShaderSourcePyramid = `#include <fragment_pyramid>`;
fragmentShaderSourcePyramid = M.gl_util.preprocess(fragmentShaderSourcePyramid);

var fragmentShaderSourceCompositor = `#include <fragment_compositor>`;
fragmentShaderSourceCompositor = M.gl_util.preprocess(fragmentShaderSourceCompositor);

var fragmentShaderSourceColorizer = `#include <fragment_colorizer>`;
fragmentShaderSourceColorizer = M.gl_util.preprocess(fragmentShaderSourceColorizer);

vertexShaderSource = M.gl_util.preprocess(vertexShaderSource);

M.gl_resources.createProgram1 = function (gl) {
    return M.gl_util.createProgram(
        gl,
        M.gl_util.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
        M.gl_util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    );
}

M.gl_resources.createProgramPyramid = function (gl) {
    return M.gl_util.createProgram(
        gl,
        M.gl_util.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
        M.gl_util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourcePyramid)
    );
}

M.gl_resources.createProgramCompositor = function (gl) {
    return M.gl_util.createProgram(
        gl,
        M.gl_util.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource2),
        M.gl_util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceCompositor)
    );
}

M.gl_resources.createProgramColorizer = function (gl) {
    return M.gl_util.createProgram(
        gl,
        M.gl_util.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource2),
        M.gl_util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceColorizer)
    );
}


M.gl_resources.createRenderTexture = function (gl, w, h) {
    var texture = gl.createTexture();
    {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        const level = 0;
        const internalFormat = gl.RGBA32UI;
        const border = 0;
        const format = gl.RGBA_INTEGER;
        const type = gl.UNSIGNED_INT;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    w, h, border,
                    format, type, data);
        
    }
    return texture;
}

M.gl_resources.createUnderlayTexture = function (gl, w, h) {
    var texture = gl.createTexture();
    {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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

M.gl_resources.createGradientTexture = function (gl, w, h) {
    var texture = gl.createTexture();
    {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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

M.gl_resources.createPositionVAO = function (gl) {
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