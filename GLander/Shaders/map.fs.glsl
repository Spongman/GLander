precision highp float;

uniform sampler2D xTerrainTexture;

varying vec2 vPos;

void main(void)
{
	vec4 tex = texture2D(xTerrainTexture, vPos);
	gl_FragColor = vec4(tex.xyz * tex.a, 1.0);
}