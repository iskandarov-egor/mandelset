M.gl_util = {};

M.gl_util.createRenderPyramid = function (gl, w, h) {
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


M.gl_util.createRenderTexture = function (gl, w, h) {
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

M.gl_util.createUnderlayTexture = function (gl, w, h) {
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

M.gl_util.createGradientTexture = function (gl, w, h) {
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


M.gl_util.resizeCanvas = function (canvas) {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;

    var scale = window.devicePixelRatio; // Change to 1 on retina screens to see blurry canvas.

    var targetWidth = displayWidth * scale;
    var targetHeight = displayHeight * scale;
    //targetWidth = targetHeight;
    //targetWidth = 1881;
    

    // Check if the canvas is not the same size.
    if (canvas.width  !== targetWidth ||
        canvas.height !== targetHeight) {

        // Make the canvas the same size
        canvas.width  = targetWidth - 100;
        canvas.height = targetHeight;
    }
}

M.gl_util.preprocess = function (source, includes) {
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

M.gl_util.glUniformD = function (gl, loc, value) {
    var f32 = new Float32Array(2);
    splitDouble(value, f32);
    gl.uniform2fv(loc, f32);
}

M.gl_util.loadHTMLImage2Texture = function(gl, img, txt) {
    console.log(img.width, img.height, txt);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, txt);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, img.width, img.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
}
