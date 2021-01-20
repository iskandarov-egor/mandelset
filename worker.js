console.log("AAAAAA");

onmessage = function (e) {
  if (e.data.canvas) {
    console.log("BBBBBB");
    var gl = e.data.canvas.getContext('webgl2');
    console.log("BBBBBBC", gl.getParameter(gl.MAX_CLIENT_WAIT_TIMEOUT_WEBGL));
  }
};
