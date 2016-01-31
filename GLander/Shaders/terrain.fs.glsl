precision highp float;

uniform sampler2D xShadowMapTexture;
uniform sampler2D xTerrainTexture;
uniform sampler2D xHeightTexture;
uniform vec2 xCullSize;

varying vec3 vColor;
varying vec2 vShadowCoord;
varying vec2 vWorldPos;

void main(void)
{
	if (abs(vWorldPos.x) > xCullSize.x / 2.0 - 0.5)
		discard;
	if (abs(vWorldPos.y) > xCullSize.y / 2.0 - 0.5)
		discard;

	vec4 shadow = texture2D(xShadowMapTexture, vShadowCoord);
	float fog = min((1.0 - vShadowCoord.y) * 3.0, 1.0);
	//gl_FragColor = vColor * shadow.b * fog;
	//gl_FragColor = vec4(vColor * shadow.b, 1.0);

	gl_FragColor = vec4(vColor * (1.0 - shadow.a * .8) * fog, 0);
}