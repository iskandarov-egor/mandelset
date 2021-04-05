M.gl_util = {};


M.gl_util.createShader = function (gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
 
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

M.gl_util.createProgram = function (gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
 
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

M.gl_util.preprocess = function (source) {
    let re = /^([\s\S]*)(#include <[^>]*>)([\s\S]*)$/;
    let re2 = /^#include <([^>]*)>$/;
    for (var i = 0; ; i++) {
        if (i >= 1e3) {
            throw new Error("too many includes!");
        }
        var match = source.match(re);
        if (match == null) {
            break;
        }
        var include = match[2];
        var dep = include.match(re2);
        if (dep == null) {
            throw new Error("bad include " + include);
        }
        dep = dep[1];
        dep = loadFile(dep + '.glsl');
        source = source.replace(re, `\$1${dep}\$3`);
    }
    return source;
}

M.gl_util.glUniformD = function (gl, loc, value) {
    var f32 = new Float32Array(2);
    splitDouble(value, f32);
    gl.uniform2fv(loc, f32);
}

M.gl_util.loadHTMLImage2Texture = function(gl, img, txt) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, txt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, img.width, img.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
}
