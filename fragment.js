var fragmentShaderSource1 = `#version 300 es
precision highp float;

out vec4 outColor;
in vec2 clipCoord;
in vec2 realCoord;

uniform float scale;
uniform float one;
uniform vec2 offsetX;
uniform vec2 offsetY;
uniform float screenAspectRatio;
uniform int iterations;
uniform sampler2D refOrbit;
uniform sampler2D parent;
uniform bool haveParent;
uniform bool onlyTransfer;
uniform int refOrbitLen;

#include <ff_math>
#include <mandel>
#include <debug>

vec4 shade(float iter) {
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

void ff_main() {
    vec2 ffx = vec2(0.0, clipCoord.x);
    vec2 ffy = vec2(0.0, clipCoord.y);
    vec2 ffs = vec2(0.0, scale);
    vec2 ffa = vec2(0.0, screenAspectRatio);
    vec2 ffox = offsetX;
    vec2 ffoy = offsetY;
    ffx = ff_mul(ffs, ffx);
    ffx = ff_mul(ffa, ffx);
    ffy = ff_mul(ffs, ffy);
    ffx = ff_add(ffox, ffx);
    ffy = ff_add(ffoy, ffy);
    outColor = shade(mandel_ff(vec2(0, 0), vec2(0, 0), ffx, ffy, iterations));
    //outColor = floatColor(coord.x);
}

void f_main() {
    vec2 coord = clipCoord;
    coord *= scale;
    //coord.x *= screenAspectRatio;
    coord.x += offsetX[1];
    coord.y += offsetY[1];
    outColor = shade(mandel(coord.x, coord.y, iterations));
}

void delta_main() {
    float dx = scale*screenAspectRatio*clipCoord.x;
    float dy = scale*clipCoord.y;
    float m = mandel_delta_sim(offsetX[1], offsetY[1], dx, dy, iterations);
    outColor = shade(m);
}

void texture_test_main() {
    outColor = texelFetch(refOrbit, ivec2(int(1023.0*((clipCoord.y+1.0)/2.0)), 0), 0);
}

void texture_main() {
    float dx = scale*screenAspectRatio*clipCoord.x;
    float dy = scale*clipCoord.y;
    float m = mandel_delta(dx, dy, iterations);
    outColor = shade(m);
}

void mip_main() {
    vec2 pixCoord = (vec2(gl_FragCoord) - vec2(1.5, 1.5));
    vec2 parentCoord = pixCoord / 3.0;
    if (onlyTransfer) {
        outColor = texelFetch(parent, ivec2(parentCoord), 0);
        //outColor = vec4(0, 1, 0, 1);
        return;
    }
    if (haveParent && vec2(ivec2(parentCoord)) == parentCoord) {
        //parentCoord.x *= 0.5;
        outColor = texelFetch(parent, ivec2(parentCoord), 0);
        //outColor = vec4(0, 1, 0, 1);
    } else  {
        f_main();
        //outColor = vec4(1, 0, 1, 1);
    }
}

void main() {
    mip_main();
    
}

`;
