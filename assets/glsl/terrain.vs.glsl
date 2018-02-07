precision highp float;

#define PI 3.141592653589793238462643383279

uniform mat4 xWorldView;
uniform mat4 xProj;

uniform vec2 xCullSize;
uniform vec2 xTerrainSize;
uniform vec2 xPos;
uniform float xRipple;

uniform sampler2D xShadowMapTexture;
uniform sampler2D xTerrainTexture;
uniform sampler2D xHeightTexture;

attribute vec2 aPosition;
attribute vec2 aTexture1;
attribute vec2 aTexture2;

varying vec3 vColor;
varying vec2 vShadowCoord;
varying vec2 vWorldPos;


void main(void)
{
	vec2 pp = floor(xPos);
	vec2 uv = pp;

	float height = texture2D(xHeightTexture, (aTexture1 + uv) / xTerrainSize).a * 255.0;
	if (height < 3.0)
		height += (3.0 - height) * cos (xRipple + PI * 2.0 * 32.0 * length (mod(aTexture1 + uv, 256.0)) / 256.0);

	vec4 pos = vec4(aPosition.x + pp.x, height * 1.5 / 20.0, aPosition.y + pp.y, 1.0);

	gl_Position = xProj * xWorldView * pos;
	vWorldPos = aPosition - fract (xPos);
	vShadowCoord = vWorldPos / xCullSize + 0.5;
	vShadowCoord.y = 1.0 - vShadowCoord.y;

	vec3 color = texture2D(xTerrainTexture, (aTexture2 + uv) / xTerrainSize).xyz;
	//float tilePos = fract(xPos.y);
	//color *= (aTexture1.v * xTerrainSize.y - tilePos) / xCullSize.y + 0.75;
	vColor = color;
}