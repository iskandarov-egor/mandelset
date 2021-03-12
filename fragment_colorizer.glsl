#version 300 es
precision highp float;

out vec4 outColor;
in vec2 clipCoord;

uniform highp usampler2D computer;
uniform float screenAspectRatio;
uniform sampler2D prev;
uniform int multisampling_pass;

#define PI 3.1415926538

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
        return vec4(0, 0, 0, 1);
    }
    iterations = iterations - float(int(iterations));
    if (iterations < 0.0) { vec4(1, 0, iterations, 1); // todo why?
    } else {
        float normal_factor = fract((PI + normal_atan)/(2.0*PI));
        //normal_factor = 1.0 - abs(normal_factor*2.0 - 1.0);
        //normal_factor = normal_factor/1.5 + 0.333333;
        
        float distance_factor = seamless(cycle(-log(distance), 8.0));
        //iterations = 1.0;
        
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
    float canvasX = (clipCoord.x) / (screenAspectRatio * 2.0) + 0.5;
    float canvasY = (clipCoord.y) / 2.0 + 0.5;
    vec2 txtCoord = vec2(canvasX, canvasY);

    uvec4 pixel = texture(computer, txtCoord);
    
    if (pixel[3] < 1u) {
        if (multisampling_pass == 1) {
            outColor = vec4(0, 0, 0, 0);
        } else {
            outColor = texture(prev, txtCoord);
            //outColor = vec4(0, 1, 1, 1);
        }
    } else {
        outColor = shade(uintBitsToFloat(pixel[0]), uintBitsToFloat(pixel[1]), uintBitsToFloat(pixel[2]));
        if (multisampling_pass > 1) {
            vec4 prev_color = texture(prev, txtCoord);
            outColor = (float(multisampling_pass - 1) * prev_color + outColor) / float(multisampling_pass);
        }
    }
}