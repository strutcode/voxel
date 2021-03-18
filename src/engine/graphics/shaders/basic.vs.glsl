#version 300 es
precision highp float;

in vec3 position;

uniform mat4 world;
uniform mat4 viewProjection;

void main(void) {
  mat4 worldViewProjection = viewProjection * world;
  gl_Position = worldViewProjection * vec4(position, 1.0);
}