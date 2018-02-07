precision highp float;

uniform vec2 xPos;

attribute vec2 aPosition;

varying vec2 vPos;

void main(void)
{
	vPos = 0.5 + aPosition + xPos;
	gl_Position = vec4(vec2(aPosition.x, 1.0 - aPosition.y) * 2.0 - 1.0, 0, 1.0);
}
