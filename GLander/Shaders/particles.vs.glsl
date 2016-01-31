precision highp float;

uniform mat4 xWorldView;
uniform mat4 xProj;

attribute vec3 aPosition;
attribute vec4 aColor;
attribute vec2 aTextureCoords;
attribute float aSize;

varying vec4 vColor;

void main(void)
{
	vec4 vCenter = xWorldView * vec4(aPosition, 1.0);
	vec4 vCorner = vCenter + vec4(aTextureCoords.xy * aSize, 0, 0);
	gl_Position = xProj * vCorner;
	vColor = aColor;
}