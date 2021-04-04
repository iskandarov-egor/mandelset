#version 300 es
precision highp float;

out vec4 outColor;
in vec2 clipCoord;

uniform highp usampler2D computer;
uniform float screenAspectRatio;
uniform sampler2D prev;
uniform int multisampling_pass;

uniform float scale;
uniform float offset;
uniform float scale2;
uniform float offset2;
uniform float scale_invariance_factor;

uniform int mirror; // 0-1
uniform int repeat; // 0-1
uniform int mirror2; // 0-1
uniform int repeat2; // 0-1
uniform int direction; // 0-1
uniform int mode; // 0-1
uniform int shade3d; // 0-1
uniform int distance_mode; // 0-1

uniform sampler2D gradient;
uniform sampler2D gradient2;
uniform sampler2D image;

#define PI 3.1415926538
#define E 2.71828182845904523536028747135

vec4 u4(uvec4 x) {
    return vec4(uintBitsToFloat(x[0]), uintBitsToFloat(x[1]), uintBitsToFloat(x[2]), uintBitsToFloat(x[3]));
}

float seamless(float x) {
    return abs(x*2.0 - 1.0);
}

float cycle(float x, float len) {
    return mod(x, len)/len;
}

vec4 split_range(float x, float a, vec4 lt, vec4 gt) {
    return (a < x) ? lt : gt;
}

vec4 split_range2(float x, float y, float a, vec4 c1, vec4 c2, vec4 c3) {
    return split_range(x, a, c1, split_range(y, a, c2, c3));
}

vec4 shade(float iterations, float normal_atan, float distance) {
    if (iterations == -1.0) {
        return vec4(0, 0, 0, 1);
    }
    iterations = iterations - float(int(iterations));
    if (iterations < 0.0) { vec4(1, 0, iterations, 1); // todo why?
    } else {
        float normal_factor = fract((PI + normal_atan)/(2.0*PI));
        
        normal_factor = seamless(normal_factor);
        //normal_factor = mix(0.3, 1.0, normal_factor);
        //return split_range(0.5, normal_factor, mix(vec4(0.114,0.588,0.886), vec4(0, 1, 1, 1), normal_factor*2.0), mix(vec4(0, 1, 1, 1), vec4(0, 0, 1, 1), (normal_factor - 0.5)*2.0));
        
        vec4 a = mix(vec4(0.486,0.212,0.054, 2)/2.0, vec4(0.486,0.212,0.054, 1), normal_factor);
        vec4 b = mix(vec4(0.786,0.412,0.254, 4)/4.0, vec4(0.786,0.412,0.254, 1), normal_factor);
        
        float distance_factor = seamless(cycle(-log(distance), 8.0));
        return mix(a, b, distance_factor);
        //iterations = 1.0;
        
        float v = 1.0;
        v *= normal_factor;
        //v *= distance_factor;
        
        return vec4(0, 0, v, 1);
    }
}

float unmix(float a1, float b1, float mix1) {
    return (mix1 - a1)/(b1 - a1);
}

float srgb_gamma(float x) {
    if (x <= 0.0031308) {
        return 12.92*x;
    } else {
        return 1.055*pow(x, 1.0/2.4) - 0.055;
    }
}

float srgb_gamma_inv(float x) {
    if (x <= 0.04045) {
        return x/12.92;
    } else {
        return pow((x + 0.055)/1.055, 2.4);
    }
}

vec3 srgb2rgb(vec3 x) {
    return vec3(srgb_gamma_inv(x.x), srgb_gamma_inv(x.y), srgb_gamma_inv(x.z));
}

vec3 rgb2srgb(vec3 x) {
    return vec3(srgb_gamma(x.x), srgb_gamma(x.y), srgb_gamma(x.z));
}

vec4 gradientShade(float iterations, float normal_atan, float distance) {
    if (iterations == -1.0) {
        return vec4(0, 0, 0, 1);
    }
    float scale2_factor = pow(100.0, scale2);
    if (abs(scale2_factor - round(scale2_factor)) < 0.1) {
        scale2_factor = round(scale2_factor);
    }
    
    float distance_factor;
    if (scale_invariance_factor != 0.0) {
        distance_factor = distance/scale_invariance_factor;
        distance_factor *= pow(10.0, 2.0*scale - 1.0);
        float base = 1.0+(1000.0*E)*pow(10000.0, 2.0*(0.5-scale));
        //distance_factor = clamp(-log(1.0/base + distance/scale_invariance_factor)/log(base), 0.0001, 0.9999);
        //distance_factor = min(0.999, -log(1.0/base + 0.1*distance/scale_invariance_factor)/log(base));
        distance_factor = pow(distance/scale_invariance_factor/10.0, pow(100.0, scale-1.0));
    } else {
        float base = 1.0+(1000.0*E)*pow(10000.0, 2.0*(0.5-scale));
        distance_factor = 1.0+log(distance)/log(base);
    }
    
    float normal_factor = fract(scale2_factor*(PI + normal_atan)/(2.0*PI)); // todo fract needed?
    float iter_factor = -iterations/(pow(2000.0, mix(0.0, 1.0, scale)));
    
    if (repeat2 == 1) {
        normal_factor = abs(1.0 - 2.0*fract(normal_factor + 0.5 + offset2)); // /\/\/
    } else {
        normal_factor = fract(normal_factor + offset2);
    }
    
    if (repeat == 1) {
        //if (scale_invariance_factor == 0.0) {
            distance_factor = 1.0-abs(1.0 - mod(distance_factor + offset, 2.0));
        //}
        iter_factor = 1.0-abs(1.0 - mod(1.0+iter_factor + offset, 2.0));
    } else {
        distance_factor = fract(distance_factor + offset); // +.5 ?
        iter_factor = fract(iter_factor + offset);
    }
    
    if (mirror2 == 1) {
        normal_factor = 1.0 - normal_factor;
    }
    
    if (mirror == 1) {
        distance_factor = 1.0 - distance_factor;
        iter_factor = 1.0 - iter_factor;
    }
    
    if (distance_mode == 0) {
        distance_factor = iter_factor;
    }
    
    if (direction == 1) {
        float t = normal_factor;
        normal_factor = distance_factor;
        distance_factor = t;
    }
    
    vec3 result;
    if (mode == 0) {    
        vec4 color1 = texture(gradient, vec2(distance_factor, 0.5));
        vec4 color2 = texture(gradient2, vec2(distance_factor, 0.5));
        result = mix(color1, color2, clamp(normal_factor, 0.0, 1.0)).xyz;
    } else {
        result = texture(image, vec2(distance_factor, normal_factor)).xyz;
    }
    
    float shading_factor = 1.0;
    if (shade3d == 1) {
        vec3 light = vec3(1, 1, 1);
        vec3 normal = vec3(cos(normal_atan), sin(normal_atan), 2.0);
        shading_factor = clamp(0.1, 1.0, 0.1 + abs(dot(light, normal))/sqrt(3.0*(1.0+2.0*2.0)));
        result = (shading_factor*(result));
    }
    
    return vec4(result.xyz, 1);
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
        }
    } else {
        outColor = gradientShade(uintBitsToFloat(pixel[0]), uintBitsToFloat(pixel[1]), uintBitsToFloat(pixel[2]));
        
        if (multisampling_pass > 1) {
            vec4 prev_color = texture(prev, txtCoord);
            outColor = (float(multisampling_pass - 1) * prev_color + outColor) / float(multisampling_pass);
        } else {
        }
    }
}