#ifdef GL_ES
    precision mediump float;
#endif

uniform sampler2D blockTex[3];
uniform float fogStart;
uniform float fogEnd;
uniform vec3 fogColor;

varying vec2 v_uv;
varying float v_ti;
varying float screenDepth;
varying float viewDistance;

void main(void) {
  vec4 color;

  if (v_ti < 0.9) {
    color = texture2D(blockTex[0], v_uv);
  }
  else if (v_ti < 1.9) {
    color = texture2D(blockTex[1], v_uv);
  }
  else if (v_ti < 2.9) {
    color = texture2D(blockTex[2], v_uv);
  }
  else {
    color = vec4(1.0, 0.0, 1.0, 1.0);
  }

  float fog = clamp((viewDistance - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
  color.rgb = (1.0 - fog) * color.rgb + fog * fogColor;

  gl_FragColor = color;
}