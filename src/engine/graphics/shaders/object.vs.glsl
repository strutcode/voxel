#version 300 es
#ifdef GL_ES
  precision highp float;
#endif

in vec3 position;
in vec3 normal;
in vec2 texcoord;

uniform mat4 world;
uniform mat4 viewProjection;
uniform vec3 viewPosition;

out float viewDistance;
out vec2 v_uv;

void main(void) {
  vec4 modelPosition = vec4(position, 1.0);
  mat4 worldViewProjection = viewProjection * world;
  vec4 worldPosition = world * modelPosition;
  viewDistance = distance(viewPosition, worldPosition.xyz);
  gl_Position = worldViewProjection * modelPosition;

  v_uv = texcoord;
}