#version 300 es
precision highp float;

out uvec4 outColor;
uniform highp usampler2D parent;

in vec2 clipCoord;
in vec2 realCoord;

void main() {
    vec2 parentCoord = gl_FragCoord.xy / 3.0;
    outColor = texelFetch(parent, ivec2(parentCoord), 0);
    //outColor = uvec4(255, 128, 0, 255);
    //outColor = uvec4(floatBitsToUint(-2.0), floatBitsToUint(0.0), floatBitsToUint(0.0), 1);
    
    //outColor = texture(parent, vec2(clipCoord.x/2.0, clipCoord.y/2.0 + 0.5));
}