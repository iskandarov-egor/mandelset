var vertexShaderSource = `#version 300 es

precision highp float;

in vec4 a_position;

uniform vec2 offsetX;
uniform vec2 offsetY;
uniform float scale;
uniform float screenAspectRatio;
uniform vec4 viewport;
uniform float one;

out vec2 clipCoord;
// high precision xy clip coords
out vec2 clipCoordX;
out vec2 clipCoordY;

#include <ff_math>
 
void main() {
  gl_Position.y = a_position.y;
  gl_Position.x = a_position.x;
  gl_Position.z = 0.0;
  gl_Position.w = 1.0;
  //clipCoord.x = a_position.x;
  //clipCoord.y = a_position.y;
  
  clipCoordX = vec2(0.0, a_position.x);
  clipCoordY = vec2(0.0, a_position.y);
  
  clipCoordX = ff_add(clipCoordX, vec2(0.0, 1.0));
  clipCoordY = ff_add(clipCoordY, vec2(0.0, 1.0));
  
  clipCoordX = ff_mul(clipCoordX, vec2(0.0, 0.5));
  clipCoordY = ff_mul(clipCoordY, vec2(0.0, 0.5));
  
  clipCoordX = ff_mul(clipCoordX, vec2(0.0, viewport.z));
  clipCoordY = ff_mul(clipCoordY, vec2(0.0, viewport.w));
  
  clipCoordX = ff_add(clipCoordX, vec2(0.0, viewport.x));
  clipCoordY = ff_add(clipCoordY, vec2(0.0, viewport.y));
  
  clipCoord.x = viewport.x + (viewport.z)*(1.0 + a_position.x)/2.0;
  clipCoord.y = viewport.y + (viewport.w)*(1.0 + a_position.y)/2.0;
  /*
  realCoord = clipCoord*scale;
  realCoord.x *= screenAspectRatio;
  realCoord.x += offsetX;
  realCoord.y += offsetY;
  */
}
`;

/// -1 1 -> x1 x2
