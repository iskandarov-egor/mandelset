
var Mouse = {
}

Mouse.canvas_wheel = function(event) {}

var canvas = document.querySelector("#canvas");
canvas.addEventListener("wheel", event => {
    Mouse.wheel(event);
    event.preventDefault();
});
