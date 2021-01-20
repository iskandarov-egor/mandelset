var fragmentShaderSource3 = `#version 300 es
precision highp float;

out vec4 outColor;
in vec2 clipCoord;

uniform float moveX;
uniform float moveY;

uniform sampler2D source;

void main() {
	//float spaceX = eyeX + scale*clipCoord.x;
	
	//float canvasScaleX = canvasScale * screenAspectRatio;
	// float spaceX = canvasX * canvasScaleX + canvasOffsetX - canvasScaleX / 2.0;
	// float spaceX = (canvasX - 0.5) * canvasScaleX + canvasOffsetX;
	// => canvasX = (spaceX - canvasOffsetX) / canvasScaleX + 0.5;
	outColor = texture(canvas, vec2(0.5*(clipCoord.x/screenAspectRatio + 1.0), 0.5*(clipCoord.y + 1.0)));
	//outColor = vec4(0.5*(clipCoord.x/screenAspectRatio + 1.0), 0.5*(clipCoord.y + 1.0), 0, 1);
	//outColor = vec4(clipCoord.x, 0.0*0.5*(clipCoord.y + 1.0), 0, 1);
}

`;
