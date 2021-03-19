#version 300 es

#define HIGHLIGHT 1

precision highp float;
precision highp sampler2DArray;

uniform sampler2D diffuse;
uniform float fogStart;
uniform float fogEnd;
uniform vec3 fogColor;
uniform float alphaCutoff;
uniform int flags;

in vec2 v_uv;
in float viewDistance;

out vec4 outColor;

void main(void) {
  vec4 color = texture(diffuse, v_uv);

  if (color.a < alphaCutoff) {
    discard;
  }

  if ((flags & HIGHLIGHT) > 0) {
    color += vec4(0.1, 0.1, 0.1, 0);
  }

  float fog = clamp((viewDistance - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
  color.rgb = (1.0 - fog) * color.rgb + fog * fogColor;

  outColor = color;
}