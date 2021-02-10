#ifdef GL_ES
    precision mediump float;
#endif

uniform sampler2D mainTex;

varying vec2 uv;

void main(void) {
  gl_FragColor = texture2D(mainTex, uv);
}