#ifdef GL_ES
    precision highp float;
#endif

attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;

varying vec2 uv;

void main(void) {
  gl_Position = worldViewProjection * vec4(position, 1.0);

  uv = vec2(0.0);
  if (normal.y > 0.0) {
    uv.x = mod(position.x, 2.0);
    uv.y = mod(position.z, 2.0) == 0.0 ? 0.0 : 0.3333;
  }
  else if (normal.y < 0.0) {
    uv.x = mod(position.x, 2.0);
    uv.y = mod(position.z, 2.0) == 0.0 ? 0.6666 : 1.0;
  }
  else if (normal.z != 0.0) {
    uv.x = mod(position.x, 2.0);
    uv.y = mod(position.y, 2.0) == 0.0 ? 0.3333 : 0.6666;
  }
  else {
    uv.x = mod(position.z, 2.0);
    uv.y = mod(position.y, 2.0) == 0.0 ? 0.3333 : 0.6666;
  }
}