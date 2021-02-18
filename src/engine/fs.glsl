#ifdef GL_ES
  precision mediump float;
  precision highp sampler2DArray;
#endif

uniform sampler2DArray tiles;
uniform float fogStart;
uniform float fogEnd;
uniform vec3 fogColor;

varying vec2 v_uv;
varying float v_ti;
varying float v_col;
varying float screenDepth;
varying float viewDistance;

void main(void) {
  vec4 color;

  color = texture(tiles, vec3(v_uv.x, v_uv.y, v_ti));
  color *= vec4(v_col, v_col, v_col, 1.0);

  float fog = clamp((viewDistance - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
  color.rgb = (1.0 - fog) * color.rgb + fog * fogColor;

  gl_FragColor = color;
}