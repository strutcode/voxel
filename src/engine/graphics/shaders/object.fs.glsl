#version 300 es

#ifdef GL_ES
  precision highp float;
  precision highp sampler2DArray;
#endif

uniform sampler2D diffuse;
uniform float fogStart;
uniform float fogEnd;
uniform vec3 fogColor;
uniform float alphaCutoff;

in vec2 v_uv;
in float viewDistance;

out vec4 outColor;

void main(void) {
  vec4 color = texture(diffuse, v_uv);

  if (color.a < alphaCutoff) {
    discard;
  }

  float fog = clamp((viewDistance - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
  color.rgb = (1.0 - fog) * color.rgb + fog * fogColor;

  outColor = color;
}