#version 300 es
precision highp float;

//out vec4 outColor;
out uvec4 outColor;

uniform float scale;
uniform float one;
uniform vec2 offsetX;
uniform vec2 offsetY;
uniform float bufferAspectRatio;
uniform float bufferW;
uniform float bufferH;
uniform int iterations;
uniform sampler2D refOrbit;
uniform sampler2D parent;
uniform int refOrbitLen;
uniform float refOrbitEyeOffsetX;
uniform float refOrbitEyeOffsetY;
uniform float sampleShiftX;
uniform float sampleShiftY;
uniform float sampleShiftScale;
uniform bool isPyramidLayer;

uniform int samplingSeed;

#include <ff_math>
#include <mandel>
#include <debug>

vec4 shade2(float iter) {
    if (iter == -1.0) {
        return vec4(0, 1, 0, 1);
    }
    iter = iter - float(int(iter));
    if (iter < 0.0) {
        return vec4(1, 0, iter, 1);
    } else {
        return vec4(0, 0, iter, 1);
    }
}

uvec4 shade(float x) {
    vec4 s = shade2(x);
    return uvec4(floatBitsToUint(s[0]), floatBitsToUint(s[1]), floatBitsToUint(s[2]), floatBitsToUint(s[3]));
}

vec2 compute_normal(float zx, float zy, float derivative_x, float derivative_y) {
    // sometimes the derivative is so big it messes up calculations. example:
    // {scale: 1/371727914934102.25, x: -0.710631357018485121379569591227, y: 0.289388796050924990144181947471, iterations: 1000}
    // let's decrease it's magnitude since we don't care about it anyway.
    float ds = max(abs(derivative_x), abs(derivative_y));
    if (ds == 0.0) {
        ds = 1.0;
    }
    
    cp_div(zx, zy, derivative_x/ds, derivative_y/ds);
    return vec2(zx, zy);
}

float compute_distance(float zx, float zy, float derivative_x, float derivative_y) {
    float zlength = length(vec2(zx, zy));
    //return 2.0 * (zlength * log(zlength)) / (length(vec2(derivative_x, derivative_y)));
    float ds = max(abs(derivative_x), abs(derivative_y));
    if (ds == 0.0) {
        ds = 1.0;
    }
    derivative_x /= ds;
    derivative_y /= ds;
    return 2.0 * (zlength * log(zlength) / ds) / (length(vec2(derivative_x, derivative_y)));
}

vec4 computer_texture(vec2 bufferSpaceCoord) {
    float x = scale*bufferSpaceCoord.x;
    float y = scale*bufferSpaceCoord.y;
    
    float dx = x + refOrbitEyeOffsetX;
    float dy = y + refOrbitEyeOffsetY;
    
    /*
    float a = (4.5-423.0)/201.0;
    float b = (13.5-1269.0)/603.0;
    if (abs((gl_FragCoord.x - bufferW/2.0)/(bufferH/2.0) - a) < 0.00001) {
        
        return vec4(1, 0, 0, 1);
    }
    vec4 c = mantissaColor(bufferSpaceCoord.x);
    return vec4(c.x, c.y, c.z, 1);
    */
    vec2 derivative;
    vec2 z;
    float m = mandel_delta(dx, dy, iterations, derivative, z);
    
    vec2 normal = compute_normal(z.x, z.y, derivative.x, derivative.y);
    float distance = compute_distance(z.x, z.y, derivative.x, derivative.y);
    return vec4(m, atan(normal.x, normal.y), distance, 1);
}

void main() {
    if (isPyramidLayer) {
        vec2 pixCoord = (vec2(gl_FragCoord) - vec2(1.5, 1.5));
        vec2 parentCoord = pixCoord / 3.0;
        if (vec2(ivec2(parentCoord)) == parentCoord) {
            //outColor = uvec4(floatBitsToUint(0.0), floatBitsToUint(1.0), floatBitsToUint(0.0), 1);
            discard;
            return;
        } else {
            //outColor = uvec4(floatBitsToUint(0.0), floatBitsToUint(0.0), floatBitsToUint(1.0), 1);
        }
    }
    vec2 bufferCenter = vec2(bufferW, bufferH)/2.0;
    vec2 bufferSpaceCoord = (sampleShiftScale*gl_FragCoord.xy + vec2(sampleShiftX, sampleShiftY) - bufferCenter)/bufferCenter.yy;

    vec4 result = computer_texture(bufferSpaceCoord);
    outColor = uvec4(floatBitsToUint(result[0]), floatBitsToUint(result[1]), floatBitsToUint(result[2]), 1);
}

