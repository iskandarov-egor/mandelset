var vertexShaderSource2 = `#version 300 es

precision highp float;

in vec4 a_position;
uniform float screenAspectRatio;

out vec2 clipCoord;
 
void main() {
  clipCoord.x = a_position.x * screenAspectRatio;
  clipCoord.y = a_position.y;
  gl_Position.y = a_position.y;
  gl_Position.x = a_position.x;
  gl_Position.z = 0.0;
  gl_Position.w = 1.0;
}
`;


/// -1 1 -> x1 x2
