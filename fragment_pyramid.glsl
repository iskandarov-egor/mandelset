#version 300 es
precision highp float;

out uvec4 outColor;
uniform highp usampler2D parent;

in vec2 clipCoord;
in vec2 realCoord;

void main() {
    vec2 pixCoord = (vec2(gl_FragCoord) - 0.0*vec2(1.5, 1.5));
    vec2 parentCoord = pixCoord / 3.0;
    outColor = texelFetch(parent, ivec2(parentCoord), 0);
    //outColor = uvec4(255, 128, 0, 255);
    //outColor = uvec4(floatBitsToUint(0.0), floatBitsToUint(0.0), floatBitsToUint(0.0), 1);
    
    //outColor = texture(parent, vec2(clipCoord.x/2.0, clipCoord.y/2.0 + 0.5));
}