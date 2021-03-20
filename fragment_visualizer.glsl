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

uniform sampler2D fgTexture;
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

void main() {
    //vec2 txtCoord2 = eye2CanvasSpace(eyeX, eyeY, scale, bgEyeX, bgEyeY, bgScale);
    //outColor = vec4(eyeX - bgEyeX, 0, 0, 1);
    //return;
    vec2 txtCoord = eye2CanvasSpace(eyeX, eyeY, scale, fgEyeX, fgEyeY, fgScale);

    if (isWithinUnit(txtCoord)) {
        vec4 pixel = texture(fgTexture, txtCoord);
        
        if (pixel[3] < 1.0) {
            txtCoord = eye2CanvasSpace(eyeX, eyeY, scale, bgEyeX, bgEyeY, bgScale);
            if (isWithinUnit(txtCoord)) {
                outColor = texture(bgTexture, txtCoord);
                //outColor = vec4(1, 1, 1, 1);
            } else {
                outColor = vec4(1, 0, 1, 1);
            }
        } else {
            
            outColor = pixel;
            return;
        }
        
    } else {
        outColor = vec4(1, 1, 0, 1);
        return;
    }
}