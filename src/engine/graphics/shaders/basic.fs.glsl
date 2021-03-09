#version 300 es
#ifdef GL_ES
  precision highp float;
#endif

uniform vec4 color;

out vec4 outColor;

void main() {
  outColor = color;
}
