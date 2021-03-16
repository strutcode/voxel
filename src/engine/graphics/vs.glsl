#version 300 es
#ifdef GL_ES
  precision highp float;
#endif

in uvec3 position;
in uvec2 uv;
in uint shade;
in uint texInd;
uniform mat4 world;
uniform mat4 viewProjection;
uniform vec3 viewPosition;

out float viewDistance;
out vec2 v_uv;
out float v_ti;
out float v_col;

void main(void) {
  vec4 modelPosition = vec4(float(position.x), float(position.y), float(position.z), 1.0);
  mat4 worldViewProjection = viewProjection * world;
  vec4 worldPosition = world * modelPosition;
  viewDistance = distance(viewPosition, worldPosition.xyz);
  gl_Position = worldViewProjection * modelPosition;

  v_uv = vec2(uv);
  v_ti = float(texInd);
  v_col = float(shade) / 255.0;
}