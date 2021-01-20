function createShader(gl, type, source) {
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


function createProgram(gl, vertexShader, fragmentShader) {
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


function resizeCanvas(canvas, scale) {
  // Lookup the size the browser is displaying the canvas.
  var displayWidth  = canvas.clientWidth;
  var displayHeight = canvas.clientHeight;
  
  var targetWidth = displayWidth * scale;
  var targetHeight = displayHeight * scale;
  targetWidth = 1881;
 
  // Check if the canvas is not the same size.
  if (canvas.width  !== targetWidth ||
      canvas.height !== targetHeight) {
 
    // Make the canvas the same size
    canvas.width  = targetWidth;
    canvas.height = targetHeight;
  }
}

function preprocess(source, includes) {
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
		if (!includes.hasOwnProperty(dep)) {
			throw new Error("unknown include " + dep);
		}
		source = source.replace(re, `\$1${includes[dep]}\$3`);
	}
	return source;
}

function glUniformD(loc, value) {
	var f32 = new Float32Array(2);
	splitDouble(value, f32);
	gl.uniform2fv(loc, f32);
}
