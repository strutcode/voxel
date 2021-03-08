#version 300 es

#ifdef GL_ES
  precision highp float;
  precision highp sampler2DArray;
#endif

uniform sampler2DArray tiles;
uniform float fogStart;
uniform float fogEnd;
uniform vec3 fogColor;

in vec2 v_uv;
in float v_ti;
in float v_col;
in float viewDistance;

out vec4 outColor;

void main(void) {
  vec4 color = vec4(v_uv.x, v_uv.y, 0.0, 1.0);

  color = texture(tiles, vec3(v_uv.x, v_uv.y, v_ti));
  color *= vec4(v_col, v_col, v_col, 1.0);

  float fog = clamp((viewDistance - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
  color.rgb = (1.0 - fog) * color.rgb + fog * fogColor;

  outColor = color;
}