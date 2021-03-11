#version 300 es
precision highp float;

//out vec4 outColor;
out uvec4 outColor;
in vec2 clipCoord;
in vec2 clipCoordX;
in vec2 clipCoordY;

uniform float scale;
uniform float one;
uniform vec2 offsetX;
uniform vec2 offsetY;
uniform float bufferAspectRatio;
uniform float pixelW;
uniform int iterations;
uniform sampler2D refOrbit;
uniform sampler2D parent;
uniform int refOrbitLen;
uniform float refOrbitEyeOffsetX;
uniform float refOrbitEyeOffsetY;
uniform bool isPyramidLayer;

uniform int multisampling_pass;
uniform highp usampler2D multisampling_prev;

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

vec4 float_color(float x) {
    return vec4(0, 1, 0, 1);
    float r, g, b;
    if (x < 0.0) {
        x = -x;
        r = 0.0;
    } else {
        r = 0.0;
    }
    while (x > 1.0) {
        x /= 2.0;
    }
    while (float(int(x)) != x) {
        x *= 2.0;
    }
    g = float(int(x) % 255)/255.0;
    b = float((int(x) / 255) % 255)/255.0;
    return vec4(r, 1, b, 1);
}


void ff_main() {
    //vec2 ffx = vec2(0.0, clipCoord.x);
    //vec2 ffy = vec2(0.0, clipCoord.y);
    vec2 ffx = split_ff(clipCoord.x);
    vec2 ffy = split_ff(clipCoord.y);
    //outColor = mantissaColor(clipCoord.x);
    //return;
    //vec2 ffs = vec2(0.0, scale);
    vec2 ffs = split_ff(scale);
    //vec2 ffa = vec2(0.0, screenAspectRatio);
    
    vec2 ffox = offsetX;
    vec2 ffoy = offsetY;
    //ffox = vec2(0.0, offsetX[1]);
    //ffoy = vec2(0.0, offsetY[1]);
    ffx = ff_mul(ffs, ffx);
    //ffx = ff_mul(ffa, ffx);
    ffy = ff_mul(ffs, ffy);
    ffx = ff_add(ffox, ffx);
    ffy = ff_add(ffoy, ffy);
    ///outColor = vec4((mantissa(ffx[0])+mantissa(ffx[1])) % 2, 0, 0, 1);
    vec2 derivative_x = vec2(0, 0);
    vec2 derivative_y = vec2(0, 0);
    vec2 zx = vec2(0, 0);
    vec2 zy = vec2(0, 0);
    float m = mandel_ff(zx, zy, ffx, ffy, iterations, derivative_x, derivative_y);
    float distance = compute_distance(zx[1], zy[1], derivative_x[1], derivative_y[1]);
    vec2 normal = compute_normal(zx[1], zy[1], derivative_x[1], derivative_y[1]);
    outColor = uvec4(floatBitsToUint(m), floatBitsToUint(atan(normal.x, normal.y)), floatBitsToUint(distance), 1);
    ///outColor = shade(mandel(ffx.y, ffy.y, iterations));
    ///outColor = floatColor(ffx);
}

void f_main() {
    vec2 coord = clipCoord;
    coord *= scale;
    //coord.x *= screenAspectRatio;
    coord.x += offsetX[1];
    coord.y += offsetY[1];
    //outColor = mantissaColor(coord.x);
    vec2 der;
    float m = mandel_der(coord.x, coord.y, iterations, der);
    
    outColor = uvec4(floatBitsToUint(m), floatBitsToUint(atan(der.x, der.y)), 0, 1);
}

void delta_main() {
    float dx = scale*clipCoord.x;
    float dy = scale*clipCoord.y;
    float m = mandel_delta_sim(offsetX[1], offsetY[1], dx, dy, iterations);
    outColor = shade(m);
}

void texture_test_main() {
    //outColor = texelFetch(refOrbit, ivec2(int(1023.0*((clipCoord.y+1.0)/2.0)), 0), 0);
}

vec4 computer_texture(vec2 clipCoord) {
    float x = scale*clipCoord.x;
    float y = scale*clipCoord.y;
    
    float dx = x + refOrbitEyeOffsetX;
    float dy = y + refOrbitEyeOffsetY;
    vec2 derivative;
    vec2 z;
    float m = mandel_delta(dx, dy, iterations, derivative, z);
    
    vec2 normal = compute_normal(z.x, z.y, derivative.x, derivative.y);
    float distance = compute_distance(z.x, z.y, derivative.x, derivative.y);
    return vec4(m, atan(normal.x, normal.y), distance, 1);
    //outColor = uvec4(floatBitsToUint(m), floatBitsToUint(normal.x), floatBitsToUint(normal.y), 1);
}

void texture_main_ff() {
    //float dx = scale*clipCoord.x;
    //float dy = scale*clipCoord.y;
    vec2 dx = split_ff(clipCoord.x);
    vec2 dy = split_ff(clipCoord.y);
    vec2 s = split_ff(scale);
    dx = ff_mul(s, dx);
    dy = ff_mul(s, dy);
    //float m = mandel_delta(dx, dy, iterations);
    float m = mandel_delta_ff(dx, dy, iterations);
    outColor = shade(m);
}

/*void mip_main() {
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
}*/

float rand(vec2 co) {
  return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    if (isPyramidLayer && multisampling_pass == 1) {
        vec2 pixCoord = (vec2(gl_FragCoord) - vec2(1.5, 1.5));
        vec2 parentCoord = pixCoord / 3.0;
        if (vec2(ivec2(parentCoord)) == parentCoord) {
            //outColor = uvec4(0, 0, 0, 0);
            discard;
        }
    }
    
    vec2 sampleCoord = clipCoord;
    if (multisampling_pass > 1) {
        sampleCoord += (rand(clipCoord + vec2(0, float(multisampling_pass))) - vec2(0.5, 0.5)) * vec2(pixelW, pixelW);
    };
    
    //ff_main();
    //grid_main();
    vec4 result = computer_texture(sampleCoord);
    if (multisampling_pass > 1) {
        vec2 prev_pixel = clipCoord;
        prev_pixel.x /= bufferAspectRatio;
        prev_pixel = (prev_pixel + vec2(1.0, 1.0)) / 2.0;
        
        uvec4 prev_u = texture(multisampling_prev, prev_pixel);
        vec4 prev = vec4(uintBitsToFloat(prev_u[0]), uintBitsToFloat(prev_u[1]), uintBitsToFloat(prev_u[2]), 1);
        result = (float(multisampling_pass - 1) * prev + result) / float(multisampling_pass);
    }
    outColor = uvec4(floatBitsToUint(result[0]), floatBitsToUint(result[1]), floatBitsToUint(result[2]), 1);
    //f_main();
}

