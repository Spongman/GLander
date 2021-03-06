﻿/// <reference path="Math.ts" />
/// <reference types="jquery" />

declare class WebGLDebugUtils {
	static makeDebugContext(gl: WebGLRenderingContext): WebGLRenderingContext;
}

interface WebGLObject {
	[index: string]: any;
}

let gl: WebGLRenderingContext;
function initGL(canvas: HTMLCanvasElement) {
	try {
		const params = { alpha: false };
		return <WebGLRenderingContext>canvas.getContext("experimental-webgl", params);
	}
	catch (e) {
		throw new Error(`Could not initialise WebGL: ${e}`);
	}
}


function createProgram(name: string, attrs: string[], uniforms: string[]) {
	function getShader(id: string) {
		const shaderScript = <HTMLScriptElement>document.getElementById(id);
		if (!shaderScript)
			return;

		let str = "";
		for (let k = shaderScript.firstChild; k; k = k.nextSibling)
			if (k.nodeType === 3)
				str += k.textContent;

		if (shaderScript.type === "x-shader/x-fragment")
			return compileShader(gl.FRAGMENT_SHADER, str);

		if (shaderScript.type === "x-shader/x-vertex")
			return compileShader(gl.VERTEX_SHADER, str);

		throw new Error(`unknown shader type: ${shaderScript.type}`);
	}

	function compileShader(shaderType: number, str: string) {
		const shader = notNull(gl.createShader(shaderType));
		gl.shaderSource(shader, str);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const error = gl.getShaderInfoLog(shader);
			throw new Error(`Error compiling ${shaderType}:\n${error}`);
		}

		return shader;
	}

	return $.when(
		$.get(`assets/glsl/${name}.vs.glsl`),
		$.get(`assets/glsl/${name}.fs.glsl`)
	).then((vsArgs: any[], fsArgs: any[]) => {
		const program = notNull(gl.createProgram());
		gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsArgs[0]));
		gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsArgs[0]));
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS))
			alert("LINK: Could not initialise shaders");

		useProgram(program);

		$.each(attrs, function (i: number, e: string): void {
			const loc = gl.getAttribLocation(program, e);
			if (!(loc >= 0))
				throw new Error(`${name}: attribute '${e}' not found!`);
			program[e] = loc;
			//console.log(vs + " ATTR " + e + " = " + loc);
			//gl.enableVertexAttribArray(loc);
		});

		$.each(uniforms, function (i: number, e: string): void {
			const loc = gl.getUniformLocation(program, e);
			if (!loc)
				throw new Error(`${name}: uniform '${e}' not found!`);
			program[e] = loc;
		});

		return program;
	})

}

let programDouble: WebGLProgram;
let programSingle: WebGLProgram;
let programFlat: WebGLProgram;
let programBillboard: WebGLProgram;
let programBillboardX: WebGLProgram;
let programLit: WebGLProgram;

let rgPrograms: WebGLProgram[];

/**
function initShaders()
{
	programDouble = createProgram(
		"shader-vs-double",
		"shader-fs-double",
		[
			"aVertexPosition",
			"aVertexTextureCoord",
			"aVertexLight",
			"aVertexBrightness",
		],
		[
			"matProjection",
			"matModelView",
			"slide",
			"alpha",
			"sampPalette",

			"matOrientTex2",
			"sampTexture1",
			"sampTexture2",
			//"sampVertexPositions",
			//"matTriView",
			//"xMin", "xMax", "yMin", "yMax",
		]
	);

	gl.uniform1i(programDouble['sampPalette'], 0);
	gl.uniform1i(programDouble['sampTexture1'], 1);
	gl.uniform1i(programDouble['sampTexture2'], 2);
	gl.uniform1f(programDouble['alpha'], 1);

	programSingle = createProgram(
		"shader-vs-single",
		"shader-fs-single",
		[
			"aVertexPosition",
			"aVertexTextureCoord",
			"aVertexLight",
			"aVertexBrightness",
		],
		[
			"matProjection",
			"matModelView",
			"sampPalette",
			"slide",
			"alpha",

			"sampTexture",

			//"leftPlaneAnchor", "leftPlaneNormal",
			//"rightPlaneAnchor", "rightPlaneNormal",
			//"bottomPlaneAnchor", "bottomPlaneNormal",
			//"topPlaneAnchor", "topPlaneNormal",
		]
	);

	gl.uniform1i(programSingle['sampPalette'], 0);
	gl.uniform1i(programSingle['sampTexture'], 1);
	gl.uniform1f(programSingle['alpha'], 1);


	programLit = createProgram(
		"shader-vs-lit",
		"shader-fs-lit",
		[
			"aVertexPosition",
			"aVertexTextureCoord",
		],
		[
			"matProjection",
			"matModelView",
			"sampTexture",
			"sampPalette",
			"light",
		]
	);

	gl.uniform1i(programLit['sampPalette'], 0);
	gl.uniform1i(programLit['sampTexture'], 1);


	programFlat = createProgram(
		"shader-vs-flat",
		"shader-fs-flat",
		[
			"aVertexPosition",
			"aVertexColor",
		],
		[
			"matProjection",
			"matModelView",
			"light",
		]
	);


	programBillboard = createProgram(
		"shader-vs-billboard",
		"shader-fs-billboard",
		[
			"aVertexPosition",
		], [
			"matProjection",
			"matModelView",
			"sampTexture",
			"sampPalette",
			"sizeTexture",
			"scale",
			//"alpha",
			"pos",
		]
	);

	gl.uniform1i(programBillboard['sampPalette'], 0);
	gl.uniform1i(programBillboard['sampTexture'], 1);

	const rgBillboardVertexPositions:Vec2[] = [
		new Vec2(0, 0),
		new Vec2(0, 1),
		new Vec2(1, 1),
		new Vec2(1, 0),
	];

	programBillboard['bufferVertexPosition'] = createBuffer(Array.prototype.concat.apply([], rgBillboardVertexPositions.map(function (v) { return v.flatten(); })), 2);
	loadAttribBuffer(programBillboard['aVertexPosition'], programBillboard['bufferVertexPosition']);



	programBillboardX = createProgram(
		"shader-vs-billboard-x",
		"shader-fs-billboard",
		[
			"aVertexPosition",
		], [
			"matProjection",
			"matModelView",
			"sampTexture",
			"sampPalette",
			"sizeTexture",
			"scale",
			//"alpha",
			"pos",
			"eye",
		]
	);

	gl.uniform1i(programBillboardX['sampPalette'], 0);
	gl.uniform1i(programBillboardX['sampTexture'], 1);

	programBillboardX['bufferVertexPosition'] = createBuffer(Array.prototype.concat.apply([], rgBillboardVertexPositions.map(function (v) { return v.flatten(); })), 2);
	loadAttribBuffer(programBillboardX['aVertexPosition'], programBillboardX['bufferVertexPosition']);

	rgPrograms =
	[
		programDouble,
		programSingle,
		programLit,
		programFlat,
		programBillboard,
		programBillboardX,
	];
}
*/

let _activeTexture: number;
function bindTexture(iUnit: number, tex: WebGLTexture | null) {
	if (_activeTexture !== iUnit) {
		_activeTexture = iUnit;
		gl.activeTexture(gl.TEXTURE0 + iUnit);
	}
	gl.bindTexture(gl.TEXTURE_2D, tex);
}

// create an image from an array of single-byte values
function createTexture(iUnit: number, filter?: number) {
	const texImage = notNull(gl.createTexture());
	bindTexture(iUnit || 0, texImage);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter || gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter || gl.NEAREST);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	//gl.generateMipmap(gl.TEXTURE_2D);
	return texImage;
}

function createBuffer(items: TypedArray, cValuesPerItem: number, flags?: number) {
	if (!items)
		throw new Error("invalid item array");

	const cItems = <number>(items.length);
	if (!cItems || (cItems % cValuesPerItem) !== 0)
		throw new Error("invalid #items");

	if (typeof (flags) === "undefined")
		flags = gl.STATIC_DRAW;

	const buffer = notNull(gl.createBuffer());
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, items, flags);
	buffer['itemSize'] = cValuesPerItem;
	buffer['numItems'] = cItems / cValuesPerItem;
	buffer['items'] = items;
	return buffer;
}

function createDynamicBuffer(rgItems: TypedArray, cValuesPerItem: number) {
	return createBuffer(rgItems, cValuesPerItem, gl.DYNAMIC_DRAW);
}

function updateDynamicBuffer(buffer: WebGLBuffer, offset: number, items: Float32Array) {
	if (!buffer)
		throw new Error("buffer");

	if (typeof offset === 'undefined')
		offset = 0;

	if (!items)
		throw new Error("invalid buffer items");

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, offset, items);
}

const _cHits = 0;
const _cCalls = 0;
const _mapAttribBuffers = new Array<WebGLBuffer>();
function loadAttribBuffer(attrib: number, buffer: WebGLBuffer, itemType: number = gl.FLOAT) {
	if (typeof attrib === 'undefined')
		throw new Error("invalid attibute");
	if (!buffer)
		throw new Error("invalid buffer");

	/*
	if (_mapAttribBuffers[attrib] === buffer)
	{
		_cHits++;
		return;
	}
	_cCalls++;

	_mapAttribBuffers[attrib] = buffer;
	*/
	if (typeof attrib === 'undefined')
		throw new Error("invalid item array");

	if (typeof buffer === 'undefined')
		throw new Error("invalid item array");

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(attrib, buffer['itemSize'], itemType, false, 0, 0);
	gl.enableVertexAttribArray(attrib);
}

function updateViewport() {
	if (!gl)
		return;

	const canvas = gl.canvas;
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;

	canvas.width = 800;
	canvas.height = 600;

	canvas.width = width;
	canvas.height = height;

	gl.viewport(0, 0, canvas.width, canvas.height);

	/**
	const matProjection = Mat4.createPerspective(59, width / height, .01, 5000).flatten();

	for (let i = rgPrograms.length; i--;)
	{
		const program = rgPrograms[i];
		gl.useProgram(program);
		gl.uniformMatrix4fv(program['matProjection'], false, matProjection);
	}
	*/
	_programLast = rgPrograms[0];
}

let matModelView: Mat4;
const rgMatrices: Mat4[] = [];

/*
function beginScene(position: Vec3, orient: Mat3)
{
	const or4 = orient.toMat4();

	matModelView = or4.mul(Mat4.createTranslation(Vec3.Zero.sub(position)));
	//matModelView = Mat4.I;
	rgMatrices.length = 0;

	updateMatModelView(matModelView);

	useProgram(programBillboardX);
	gl.uniform3f(programBillboardX['eye'], position.x, position.y, position.z);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function createAngleMatrix(angles: Vec3, pos: Vec3)
{
	const mat: Mat4 = pos ? Mat4.createTranslation(pos) : null;

	if (angles)
	{
		const matOrient = Mat3.createRotation(angles).toMat4();
		if (mat)
			mat = mat.mul(matOrient);
		else
			mat = matOrient;
	}

	return mat;
}
function pushInstanceMatrix(m: Mat4)
{
	if (!(m instanceof Mat4))
		throw new Error("invalid argument: m");
	pushMatrix(matModelView.mul(m));
}

function pushMatrix(m: Mat4)
{
	if (!(m instanceof Mat4))
		throw new Error("invalid argument: m");

	rgMatrices.push(matModelView);
	updateMatModelView(m);
}

function pushAnglesMatrix(angles: Vec3, pos?: Vec3)
{
	if (!(angles instanceof Vec3))
		throw new Error("invalid argument: angles");

	const matOrient = Mat3.fromEuler(angles.x, angles.y, angles.z);
	pushOrientMatrix(matOrient, pos);
}

function pushTranslateMatrix(pos: Vec3)
{
	if (!(pos instanceof Vec3))
		throw new Error("invalid argument: pos");

	const matPos = Mat4.createTranslation(pos);
	pushInstanceMatrix(matPos);
}

function pushOrientMatrix(matOrient: Mat3, pos?: Vec3)
{
	if (!(matOrient instanceof Mat3))
		throw new Error("invalid argument: matOrient");

	const mat = matOrient.transpose().toMat4();

	if (pos)
	{
		if (!(pos instanceof Vec3))
			throw new Error("invalid vector: pos");
		const matPos = Mat4.createTranslation(pos);
		mat = matPos.mul(mat);
	}

	pushInstanceMatrix(mat);
}
function popMatrix()
{
	updateMatModelView(matModelView = rgMatrices.pop());
	return matModelView;
}
*/

let _programLast: WebGLProgram;
function useProgram(program: WebGLProgram) {
	if (_programLast === program)
		return;

	_programLast = program;
	gl.useProgram(program);

	/*
	if (program['mmv'] !== matModelView)
	{
		program['mmv'] = matModelView;
		gl.uniformMatrix4fv(program['matModelView'], false, matModelView.flatten());
	}
	*/
}

/*
function updateMatModelView(m: Mat4)
{
	if (!m)
		throw new Error("invalid matrix");

	matModelView = m;

	if (_programLast)
	{
		_programLast['mmv'] = matModelView;
		gl.uniformMatrix4fv(_programLast['matModelView'], false, matModelView.flatten());
	}
}
*/