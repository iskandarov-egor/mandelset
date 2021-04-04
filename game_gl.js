M.game_gl = {};

var includes = {
    'ff_math': loadFile('ff_math.glsl'),
    'mandel': loadFile('mandel.glsl'),
    'debug': loadFile('debug.glsl'),
    'fragment_computer': loadFile('fragment_computer.glsl'),
    'fragment_pyramid': loadFile('fragment_pyramid.glsl'),
    'fragment_compositor': loadFile('fragment_compositor.glsl'),
    'fragment_colorizer': loadFile('fragment_colorizer.glsl'),
};

var fragmentShaderSource = `#include <fragment_computer>`;
fragmentShaderSource = M.gl_util.preprocess(fragmentShaderSource, includes);

var fragmentShaderSourcePyramid = `#include <fragment_pyramid>`;
fragmentShaderSourcePyramid = M.gl_util.preprocess(fragmentShaderSourcePyramid, includes);

var fragmentShaderSourceCompositor = `#include <fragment_compositor>`;
fragmentShaderSourceCompositor = M.gl_util.preprocess(fragmentShaderSourceCompositor, includes);

var fragmentShaderSourceColorizer = `#include <fragment_colorizer>`;
fragmentShaderSourceColorizer = M.gl_util.preprocess(fragmentShaderSourceColorizer, includes);

vertexShaderSource = M.gl_util.preprocess(vertexShaderSource, includes);

M.game_gl.createProgram1 = function (gl) {
    return M.gl_util.createProgram(
        gl,
        M.gl_util.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
        M.gl_util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    );
}

M.game_gl.createProgramPyramid = function (gl) {
    return M.gl_util.createProgram(
        gl,
        M.gl_util.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
        M.gl_util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourcePyramid)
    );
}

M.game_gl.createProgramCompositor = function (gl) {
    return M.gl_util.createProgram(
        gl,
        M.gl_util.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource2),
        M.gl_util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceCompositor)
    );
}

M.game_gl.createProgramColorizer = function (gl) {
    return M.gl_util.createProgram(
        gl,
        M.gl_util.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource2),
        M.gl_util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceColorizer)
    );
}

M.game_gl.createPositionVAO = function (gl) {
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