#version 300 es
#ifdef GL_ES
  precision highp float;
#endif

in vec3 position;
in vec2 uv;
in float shade;
in float texInd;
uniform mat4 world;
uniform mat4 viewProjection;
uniform vec3 viewPosition;

out float viewDistance;
out vec2 v_uv;
out float v_ti;
out float v_col;

void main(void) {
  mat4 worldViewProjection = viewProjection * world;
  vec4 worldPosition = world * vec4(position, 1.0);
  viewDistance = distance(viewPosition, worldPosition.xyz);
  gl_Position = worldViewProjection * vec4(position, 1.0);

  v_uv = uv;
  v_ti = texInd;
  v_col = shade / 255.0;
}