var vertexShaderSource3 = `#version 300 es

precision highp float;

in vec4 a_position;
out vec2 clipCoord;
 
void main() {
  clipCoord.x = a_position.x;
  clipCoord.y = a_position.y;
  gl_Position.y = a_position.y;
  gl_Position.x = a_position.x;
  gl_Position.z = 0.0;
  gl_Position.w = 1.0;
}
`;

