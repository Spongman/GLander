precision highp float;

uniform mat4 xWorldView;
uniform mat4 xProj;
uniform mat4 xNormal;
uniform vec3 xLightDirection;
uniform float xAlpha;

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;

//const AmbientLightColor = vec3(0.3, 0.3, 0.3);

varying vec4 vColor;

void main(void)
{
	gl_Position = xProj * xWorldView * vec4(aPosition, 1.0);

	vec3 normal = normalize(xNormal * vec4(aNormal, 1.0)).xyz;

	float dotValue = clamp(dot(normal, -xLightDirection) + 0.5, 0.0, 1.0);

	vColor = vec4(aColor * dotValue, xAlpha);
}
