#version 300 es
precision highp float;

out vec4 outColor;
in vec2 clipCoord;

uniform float eyeX;
uniform float eyeY;
uniform float scale;
uniform float fgEyeX;
uniform float fgEyeY;
uniform float fgScale;
uniform float bgEyeX;
uniform float bgEyeY;
uniform float bgScale;
uniform float screenAspectRatio;

uniform highp usampler2D fgTexture;
uniform sampler2D bgTexture;

#define PI 3.1415926538

vec2 eye2CanvasSpace(float eyeX, float eyeY, float scale, float canvasEyeX, float canvasEyeY, float canvasScale) {
	// :: float spaceX = eyeX + scale*clipCoord.x;
	// :: float spaceY = eyeY + scale*clipCoord.y;
	// :: float spaceX = canvasX * canvasSizeX + canvasEyeX - canvasSizeX / 2.0;
	// :: float spaceX = (canvasX - 0.5) * canvasSizeX + canvasEyeX;
	// => canvasX = (spaceX - canvasEyeX) / canvasSizeX + 0.5;
	float canvasSizeX = canvasScale * screenAspectRatio * 2.0;
	float canvasSizeY = canvasScale * 2.0;
	float eyeDiffX = eyeX - canvasEyeX;
	float eyeDiffY = eyeY - canvasEyeY;
	float canvasX = (eyeDiffX + scale*clipCoord.x) / canvasSizeX + 0.5;
	float canvasY = (eyeDiffY + scale*clipCoord.y) / canvasSizeY + 0.5;
	return vec2(canvasX, canvasY);
}

bool isWithinUnit(vec2 v) {
	return v.x >= 0.0 && v.x < 1.0 && v.y >= 0.0 && v.y < 1.0;
}

vec4 u4(uvec4 x) {
	return vec4(uintBitsToFloat(x[0]), uintBitsToFloat(x[1]), uintBitsToFloat(x[2]), uintBitsToFloat(x[3]));
}

float seamless(float x) {
    return abs(x*2.0 - 1.0);
}

float cycle(float x, float len) {
    return mod(x, len)/len;
}

vec4 shade(float iterations, float normal_atan, float distance) {
    if (iterations == -1.0) {
		return vec4(0, 1, 0, 1);
	}
	iterations = iterations - float(int(iterations));
    if (iterations < 0.0) {
		return vec4(1, 0, iterations, 1); // todo why?
	} else {
        float normal_factor = fract((PI + normal_atan)/(2.0*PI));
        //normal_factor = 1.0 - abs(normal_factor*2.0 - 1.0);
        //normal_factor = normal_factor/1.5 + 0.333333;
        
        float distance_factor = seamless(cycle(-log(distance), 8.0));
        iterations = 1.0;
        
        float v = 1.0;
        v *= normal_factor;
        //v *= distance_factor;
        
		return vec4(0, 0, v, 1);
	}
}

vec4 number_inspector(float x) {
    if (isinf(x)) {
        if (x > 0.0) {
            return vec4(1.0, 0, 0, 1);
        } else {
            return vec4(0, 0, 0, 1);
        }
    }
    if (isnan(x)) {
        return vec4(1, 0, 1, 1);
    }
    if (x > 0.0) {
        if (x > 1000000.0) {
            return vec4(0.0, 0.0, 1.0, 1);
        }
        if (x < 0.0001) {
            return vec4(0, 0.0, 0.25, 1);
        }
        return vec4(0.0, 0, 0.5, 1);
    }
    if (x == 0.0) {
        return vec4(1, 1, 1, 1);
    }
    if (x < 0.0) {
        if (x < -1000000.0) {
            return vec4(0, 1.0, 0.0, 1);
        }
        if (x > -0.0001) {
            return vec4(0, 0.25, 0, 1);
        }
        return vec4(0, 0.5, 0, 1);
    }
}

void main() {
	//vec2 txtCoord2 = eye2CanvasSpace(eyeX, eyeY, scale, bgEyeX, bgEyeY, bgScale);
	//outColor = vec4(eyeX - bgEyeX, 0, 0, 1);
	//return;
	vec2 txtCoord = eye2CanvasSpace(eyeX, eyeY, scale, fgEyeX, fgEyeY, fgScale);

	if (isWithinUnit(txtCoord)) {
		uvec4 pixel = texture(fgTexture, txtCoord);
		
		if (pixel[3] < 1u) {
			txtCoord = eye2CanvasSpace(eyeX, eyeY, scale, bgEyeX, bgEyeY, bgScale);
			if (isWithinUnit(txtCoord)) {
				outColor = texture(bgTexture, txtCoord);
			} else {
				outColor = vec4(1, 0, 1, 1);
			}
		} else {
			outColor = shade(uintBitsToFloat(pixel[0]), uintBitsToFloat(pixel[1]), uintBitsToFloat(pixel[2]));
            return;
            float m = uintBitsToFloat(pixel[2]);
            outColor = number_inspector(m);
		}
		
	} else {
		outColor = vec4(1, 1, 0, 1);
		return;
	}
}