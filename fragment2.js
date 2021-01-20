var fragmentShaderSource2 = `#version 300 es
precision highp float;

out vec4 outColor;
in vec2 clipCoord;

uniform float eyeX;
uniform float eyeY;
uniform float canvasOffsetX;
uniform float canvasOffsetY;
uniform float scale;
uniform float canvasScale;
uniform float screenAspectRatio;

uniform sampler2D parentCanvas;
uniform sampler2D canvas;

void main() {
	float spaceX = eyeX + scale*clipCoord.x;
	float spaceY = eyeY + scale*clipCoord.y;
	float canvasSizeX = canvasScale * screenAspectRatio * 2.0;
	float canvasSizeY = canvasScale * 2.0;
	float canvasX = (spaceX - canvasOffsetX) / canvasSizeX + 0.5;
	float canvasY = (spaceY - canvasOffsetY) / canvasSizeY + 0.5;
	// float spaceX = canvasX * canvasSizeX + canvasOffsetX - canvasSizeX / 2.0;
	// float spaceX = (canvasX - 0.5) * canvasSizeX + canvasOffsetX;
	// => canvasX = (spaceX - canvasOffsetX) / canvasSizeX + 0.5;
	//outColor = texture(canvas, vec2(0.5*(clipCoord.x/screenAspectRatio + 1.0), 0.5*(clipCoord.y + 1.0)));
	//outColor = vec4(0.5*(clipCoord.x/screenAspectRatio + 1.0), 0.5*(clipCoord.y + 1.0), 0, 1);
	//outColor = vec4(clipCoord.x, 0.0*0.5*(clipCoord.y + 1.0), 0, 1);
	if (canvasX >= 0.0 && canvasX < 1.0 && canvasY >= 0.0 && canvasY < 1.0) {
		outColor = texture(canvas, vec2(canvasX, canvasY));
		if (outColor == vec4(1, 0, 1, 1)) {
			//outColor = vec4(0, 1, 0, 1);
		}
	} else {
		outColor = vec4(1, 1, 0, 1);
	}
}

`;
