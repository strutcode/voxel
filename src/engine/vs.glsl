#ifdef GL_ES
    precision highp float;
#endif

attribute vec3 position;
attribute vec2 uv;
attribute float shade;
attribute float texInd;
uniform mat4 world;
uniform mat4 view;
uniform mat4 worldViewProjection;
uniform vec3 viewPosition;

varying float screenDepth;
varying float viewDistance;
varying vec2 v_uv;
varying float v_ti;
varying float v_col;

void main(void) {
  vec4 worldPosition = world * vec4(position, 1.0);
  screenDepth = (view * worldPosition).z;
  viewDistance = distance(viewPosition, worldPosition.xyz);
  gl_Position = worldViewProjection * vec4(position, 1.0);

  v_uv = uv;
  v_ti = texInd;
  v_col = shade / 255.0;
}