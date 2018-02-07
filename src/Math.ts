
interface Array<T> {
	checkIndex(i: number): void;
	mapConcat(callback: any, thisArg: any): any[];
	removeAt(i: number): T;
	swapOut(i: number): T;
}
interface Math {
	round(value: number, digits: number): number;
	mod(a: number, b: number): number;
	barycentric(value1: number, value2: number, value3: number, amount1: number, amount2: number): number;
	toRadians(val: number): number;
}
(function (Math: any, Array: any) {
	const _round = Math.round;
	const _rgPowers: number[] = [];

	Math.round = function (value: number, digits: number) {
		if (typeof digits === 'undefined')
			return _round(value);

		if (digits >= 0 || digits < 10) {
			let scale = _rgPowers[digits];
			if (!scale)
				scale = _rgPowers[digits] = Math.pow(10, digits);
			return _round(value * scale) / scale;
		}
		else {
			throw new Error(`invalid precision: ${digits}`);
		}
	}
	Math.mod = function (a: number, b: number) {
		return a - b * Math.floor(a / b);
	}

	Math.barycentric = function (value1: number, value2: number, value3: number, amount1: number, amount2: number): number {
		return value1 + (value2 - value1) * amount1 + (value3 - value1) * amount2;
	}

	Math.toRadians = function (val: number): number {
		return val * Util.TwoPI / 360;
	}


})(Math, Array);

Array.prototype.mapConcat = function (callback: any, thisArg: any): any[] {
	const rg: any[] = [];
	const push = Array.prototype.push;
	for (let i = 0; i < this.length; ++i)
		push.apply(rg, callback.call(thisArg, this[i], i, this));
	return rg;
}
Array.prototype.checkIndex = function (i: number) {
	if (i < 0 || i >= this.length)
		throw new Error(`index out of range: ${i}`);
}
Array.prototype.removeAt = function (i: number) {
	this.checkIndex(i);
	const old = this[i];
	this.splice(i, 1);
	return old;
}
Array.prototype.swapOut = function (i: number): any {
	this.checkIndex(i);
	const old = this[i];
	const other = this.pop();
	if (this.length)
		this[i] = other;
	return old;
}
function Array_iterate(count: number, callback: (i: number) => any) {
	const rg: any[] = [];
	for (let i = 0; i < count; ++i) {
		const value = callback(i);
		if (typeof value !== 'undefined')
			rg.push(value);
	}
	return rg;
}
const __unique = 1;


function fix(v: number) { return v / 65536; }
function fix2(v: number) { return v / 256; }

class Vec2 {
	constructor(public x: number, public y: number) {
		if (isNaN(x) || isNaN(y))
			throw new Error("invalid value");
	}
	add(v: Vec2) {
		return new Vec2(this.x + v.x, this.y + v.y);
	}
	addScale(v: Vec2, scale: number) {
		return new Vec2(this.x + v.x * scale, this.y + v.y * scale);
	}
	sub(v: Vec2) {
		return new Vec2(this.x - v.x, this.y - v.y);
	}
	scale(s: number) {
		if (s === 0)
			return Vec2.Zero;
		if (s === 1)
			return this;
		return new Vec2(this.x * s, this.y * s);
	}
	unit() {
		const len = this.len2();
		if (len === 1)
			return this;
		return this.scale(1 / Math.sqrt(len));
	}
	len2() {
		return this.x * this.x + this.y * this.y;
	}
	len() {
		return Math.sqrt(this.len2());
	}
	dot(v: Vec2) {
		return this.x * v.x + this.y * v.y;
	}
	projectOnTo(n: Vec2) {
		return n.scale(n.dot(this) / n.len());
	}
	pushTo(array: number[]) {
		array.push(this.x, this.y);
	}
	writeTo(array: Float32Array, index: number) {
		index *= 2;
		array[index++] = this.x;
		array[index++] = this.y;
	}

	private _flattened: number[] | undefined;
	flatten() {
		let flattened = this._flattened;
		if (!flattened)
			flattened = this._flattened = [this.x, this.y];
		return flattened;
	}

	toFloat32Array() {
		return new Float32Array(this.flatten());
	}

	toString() {
		return "(" + Math.round(this.x, 3) + ", " + Math.round(this.y, 3) + ")";
	}
	static Zero = new Vec2(0, 0);
	static One = new Vec2(1, 1);
	static UnitX = new Vec2(1, 0);
	static UnitY = new Vec2(0, 1);
}
class Vec3 {
	constructor(public x: number, public y: number, public z: number) {
		if (isNaN(x) || isNaN(y) || isNaN(z))
			throw new Error("invalid value");
	}
	static fromArray(array: number[], index: number = 0) {
		return new Vec3(array[index++], array[index++], array[index++]);
	}
	add(v: Vec3) {
		return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
	}
	addScale(v: Vec3, scale: number) {
		return new Vec3(this.x + v.x * scale, this.y + v.y * scale, this.z + v.z * scale);
	}
	sub(v: Vec3) {
		return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
	}
	scale(s: number) {
		if (s === 0)
			return Vec3.Zero;
		if (s === 1)
			return this;
		return new Vec3(this.x * s, this.y * s, this.z * s);
	}
	unit() {
		const len = this.len2();
		if (len === 1)
			return this;
		return this.scale(1 / Math.sqrt(len));
	}
	len2() {
		return this.x * this.x + this.y * this.y + this.z * this.z;
	}
	private _len: number | undefined;
	len() {
		let len = this._len;
		if (!len)
			len = this._len = Math.sqrt(this.len2());
		return len;
	}
	dot(v: Vec3) {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	}
	neg() {
		return new Vec3(-this.x, -this.y, -this.z);
	}
	cross(v: Vec3) {
		return new Vec3(
			this.y * v.z - v.y * this.z,
			this.z * v.x - v.z * this.x,
			this.x * v.y - v.x * this.y
		);
	}
	projectOnTo(n: Vec3) {
		return n.scale(n.dot(this) / n.len());
	}
	projectOnToPlane(normal: Vec3) {
		return this.sub(this.projectOnTo(normal));
	}
	planeNormal(p1: Vec3, p2: Vec3) {
		const v1 = p1.sub(this);
		const v2 = p2.sub(this);
		return v1.cross(v2).unit();
	}
	distanceTo(p: Vec3) {
		return Math.sqrt(this.distanceTo2(p));
	}
	distanceTo2(p: Vec3) {
		const dx = this.x - p.x;
		const dy = this.y - p.y;
		const dz = this.z - p.z;
		return dx * dx + dy * dy + dz * dz;
	}
	distanceToPlane(p: Vec3, n: Vec3) {
		return this.sub(p).dot(n);
	}
	pushTo(array: number[]) {
		array.push(this.x, this.y, this.z);
	}
	writeTo(array: Float32Array, index: number) {
		index *= 3;
		array[index++] = this.x;
		array[index++] = this.y;
		array[index++] = this.z;
	}
	private _flattened: number[] | undefined;
	flatten() {
		let flattened = this._flattened;
		if (!flattened)
			flattened = this._flattened = [this.x, this.y, this.z];
		return flattened;
	}
	toFloat32Array() {
		return new Float32Array(this.flatten());
	}

	/*
	toV3()
	{
		return $V([this.x, this.y, this.z]);
	}
	toV4()
	{
		return $V([this.x, this.y, this.z, 1]);
	}
	*/

	toString() {
		return "(" + Math.round(this.x, 3) + ", " + Math.round(this.y, 3) + ", " + Math.round(this.z, 3) + ")";
	}
	static Zero = new Vec3(0, 0, 0);
	static One = new Vec3(1, 1, 1);
	static UnitX = new Vec3(1, 0, 0);
	static UnitY = new Vec3(0, 1, 0);
	static UnitZ = new Vec3(0, 0, 1);

	static Forward = Vec3.UnitZ.neg();
	static Backward = Vec3.UnitZ;
	static Up = Vec3.UnitY;
	static Down = Vec3.UnitY.neg();
}
/*
class Line3
{
	constructor(public start: Vec3, public direction: Vec3)
	{
	}
	distanceToPlane(plane: Plane3)
	{
		const dotprod = this.direction.dot(plane.normal.unit());
		if (dotprod <= 0)
			return;	// wrong direction

		return plane.anchor.sub(this.start).dot(plane.normal) / dotprod;
	}
	intersectPlane(plane: Plane3)
	{
		const distance = this.distanceToPlane(plane);
		if (isNaN(distance))
			return;

		return this.proceed(distance);
	}
	interesctTriangle(tri: Triangle)
	{
		const pt = this.intersectPlane(tri);
		if (tri.containsPoint(pt))
			return pt;
		return null;
	}
	proceed(distance: number): Vec3
	{
		return this.start.addScale(this.direction, distance / this.direction.len());
	}

}
class LineSegment extends Line3
{
	length: number;
	end: Vec3;

	constructor(start: Vec3, end: Vec3)
	{
		const direction = end.sub(start);
		const length = direction.len();
		super(start, direction.scale(1 / length));

		this.length = length;
		this.end = end;
	}
	center()
	{
		return this.proceed(this.length / 2);
	}
	distanceToSphere(center: Vec3, radius: number): number
	{
		const c = center.sub(this.start);
		const l = this.direction;

		const A = l.dot(c);
		const B = l.dot(l);
		const Q = A * A - B * (c.dot(c) - radius * radius);

		if (Q <= 0.0)
			return NaN;

		const d = (A - Math.sqrt(Q)) / B;
		if (d <= 0.0)
			return NaN;
		return d;
	}
	private _flattened: number[];
	flatten()
	{
		const flattened = this._flattened;
		if (!flattened)
			flattened = this._flattened = [this.start.x, this.start.y, this.start.z, this.end.x, this.end.y, this.end.z];
		return flattened;
	}
	intersectPlane(plane: Plane3)
	{
		const distance = this.distanceToPlane(plane);
		if (isNaN(distance))
			return;

		if (distance > this.length)
			return;	// too far away

		return this.proceed(distance);
	}
}
*/
class Plane3 {
	constructor(public anchor: Vec3, public normal: Vec3) {
	}
	distanceTo(pt: Vec3) {
		const n = this.normal;
		const a = this.anchor;

		return n.x * (pt.x - a.x) + n.y * (pt.y - a.y) + n.z * (pt.z - a.z);
	}
	reverse() {
		return new Plane3(this.anchor, this.normal.scale(-1));
	}
	pointClosestTo(vec: Vec3) {
		return vec.addScale(this.normal, -vec.dot(this.normal));
	}
	reflectVector(vec: Vec3) {
		return vec.addScale(this.normal, -2 * vec.dot(this.normal));
	}
	reflectPoint(pt: Vec3) {
		return this.anchor.add(this.reflectVector(pt.sub(this.anchor)));
	}
	toString() {
		return `${this.anchor}/${this.normal}`;
	}
	/*
	toReflectionMat4()
	{
		const x = this.normal.x;
		const y = this.normal.y;
		const z = this.normal.z;

		return new Mat3(
			new Vec3(1 - 2 * x * x, -2 * x * y, -2 * x * z),
			new Vec3(-2 * x * y, 1 - 2 * y * y, -2 * y * z),
			new Vec3(-2 * z * x, -2 * z * y, 1 - 2 * z * z)
			);
	}
	*/
	static fromPoints(v0: Vec3, v1: Vec3, v2: Vec3) {
		const u = v1.sub(v0);
		const v = v2.sub(v0);
		const normal = u.cross(v);
		return new Plane3(v0, normal);
	}
}
/*
class Bounce extends Plane3
{
	iTri: number;
	tri: Triangle;
	perpendicularDistance: number;
	distance: number;
	cube: Cube;
	side: Side;

	getTextureCoords(): Vec2
	{
		const side = this.side;
		const rgUV = side.rgUV;

		const uv0 = rgUV[0];
		const uv1: Vec2, uv2: Vec2;
		if (this.iTri === 0)
		{
			uv1 = rgUV[1].sub(uv0);
			uv2 = rgUV[2].sub(uv0);
		}
		else
		{
			uv1 = rgUV[2].sub(uv0);
			uv2 = rgUV[3].sub(uv0);
		}

		const uv = this.tri.getParametricCoords(this.anchor);
		const v = uv0.addScale(uv1, uv.x).addScale(uv2, uv.y);
		return v;
	}
}
class Triangle extends Plane3
{
	rgPoints: Vec3[];
	u: Vec3;
	v: Vec3;
	uu: number;
	uv: number;
	vv: number;
	D: number;

	center: Vec3;

	constructor(v0: Vec3, v1: Vec3, v2: Vec3)
	{
		this.rgPoints = [v0, v1, v2];

		this.u = v1.sub(v0);
		this.v = v2.sub(v0);

		this.uu = this.u.dot(this.u);
		this.uv = this.u.dot(this.v);
		this.vv = this.v.dot(this.v);
		this.D = this.uv * this.uv - this.uu * this.vv;

		const normal = this.u.cross(this.v).unit();
		super(v0, normal);
	}
	containsPoint(pt: Vec3)
	{
		const w = pt.sub(this.anchor);
		const wu = w.dot(this.u);
		const wv = w.dot(this.v);

		// get and test parametric coords
		const s = (this.uv * wv - this.vv * wu) / this.D;
		if (s < 0.0 || s > 1.0)
			return false;

		const t = (this.uv * wu - this.uu * wv) / this.D;
		if (t < 0.0 || (s + t) > 1.0)
			return false;

		return true;
	}
	getParametricCoords(pt: Vec3)
	{
		const w = pt.sub(this.anchor);

		// Compute dot products
		const uw = this.u.dot(w);
		const vw = this.v.dot(w);

		// Compute barycentric coordinates
		const u = (this.uv * vw - this.vv * uw) / this.D;
		const v = (this.uv * uw - this.uu * vw) / this.D;

		return new Vec2(u, v);
	}
	//getProjectionMat4()
	//{
	//	const mat = Mat4.create([
	//		this.u.toV3(),
	//		this.v.projectOnTo(this.u.cross(this.normal)).toV3(),
	//		this.normal.scale(this.u.len()).toV3()
	//	]);
	//
	//	mat = mat.ensure4x4();
	//
	//	mat = mat.inverse();
	//	mat = mat.transpose();
	//
	//	const mt = Mat4.Translation(Vec3.Zero.sub(this.anchor).toV3());
	//	mat = mat.multiply(mt);
	//
	//	return mat;
	//}

	getCenter()
	{
		if (!this.center)
		{
			this.center = this.rgPoints[0]
				.add(this.rgPoints[1])
				.add(this.rgPoints[2])
				.scale(1 / 3);
		}
		return this.center;
	}
	//bounce(line: LineSegment, size: number)
	//{
	//	const dotProduct = -this.normal.dot(line.direction);
	//	if (dotProduct <= 0)
	//		return;	// triangle faces the wrong direction
	//
	//	// the perpendicular distance from the start of the line to the plane
	//	const perpendicularDistanceToStart = this.distanceTo(line.start);
	//
	//	// the distance from the start of the line to the point of collision
	//	const perpendicularDistanceToCollision = perpendicularDistanceToStart - size;
	//
	//	// the distance along the line from the start to the collision
	//	const distanceToCollision = perpendicularDistanceToCollision / dotProduct;
	//	if (distanceToCollision > line.length)
	//		return;	// too far away
	//
	//	const contactPoint = line.proceed(distanceToCollision);
	//	if (!this.containsPoint(contactPoint))
	//		return;
	//
	//	const bounce = new Bounce(contactPoint, this.normal);
	//	bounce.tri = this;
	//	bounce.perpendicularDistance = perpendicularDistanceToCollision;
	//	bounce.distance = distanceToCollision;
	//	return bounce;
	//}
}
*/

class Sphere {
	constructor(public Center: Vec3, public Radius: number) {
	}

	add(additional: Sphere): Sphere {
		let ocenterToaCenter = additional.Center.sub(this.Center);
		const distance = ocenterToaCenter.len();
		if (distance <= this.Radius + additional.Radius)//intersect
		{
			if (distance <= this.Radius - additional.Radius)//original contain additional
				return this;
			if (distance <= additional.Radius - this.Radius)//additional contain original
				return additional;
		}

		//else find center of new sphere and radius
		const leftRadius = Math.max(this.Radius - distance, additional.Radius);
		const Rightradius = Math.max(this.Radius + distance, additional.Radius);
		ocenterToaCenter = ocenterToaCenter.addScale(ocenterToaCenter, (leftRadius - Rightradius) / (2 * ocenterToaCenter.len()));//oCenterToResultCenter

		return new Sphere(
			this.Center.add(ocenterToaCenter),
			(leftRadius + Rightradius) / 2
		);
	}
}

/*
class Mat3
{
	_: Vec3[];

	constructor(rows: Vec3[]);
	constructor(r0: Vec3, r1: Vec3, r2: Vec3);
	constructor(r0: any, r1?: Vec3, r2?: Vec3)
	{
		if (r0 instanceof Array)
		{
			if (r0.length !== 3)
				throw new Error("wrong length: " + r0.length);
			if (typeof r1 !== 'undefined' || typeof r2 !== 'undefined')
				throw new Error("can't pass additional arguments here");
			this._ = r0;
		}
		else
		{
			this._ = [r0, r1, r2];
		}

		//Object.freeze(this);
	}
	add(other: Mat3)
	{
		return new Mat3(
			this._[0].add(other._[0]),
			this._[1].add(other._[1]),
			this._[2].add(other._[2])
			);
	}
	sub(other: Mat3)
	{
		return new Mat3(
			this._[0].sub(other._[0]),
			this._[1].sub(other._[1]),
			this._[2].sub(other._[2])
			);
	}
	scale(value: number)
	{
		return new Mat3(
			this._[0].scale(value),
			this._[1].scale(value),
			this._[2].scale(value)
			);
	}
	multiply(other: Vec3): Vec3;
	multiply(other: Mat3): Mat3;

	multiply(other: any): any
	{
		if (other instanceof Vec3)
		{
			return this._[0].scale(other.x)
				.addScale(this._[1], other.y)
				.addScale(this._[2], other.z);
		}

		const rows:Vec3[] = [];

		for (let i = 0; i < 3; ++i)
		{
			const vx =
				this._[i].x * other._[0].x +
				this._[i].y * other._[1].x +
				this._[i].z * other._[2].x;

			const vy =
				this._[i].x * other._[0].y +
				this._[i].y * other._[1].y +
				this._[i].z * other._[2].y;

			const vz =
				this._[i].x * other._[0].z +
				this._[i].y * other._[1].z +
				this._[i].z * other._[2].z;

			rows.push(new Vec3(vx, vy, vz));
		}

		return new Mat3(rows);
	}
	transpose()
	{
		return new Mat3([
			new Vec3(this._[0].x, this._[1].x, this._[2].x),
			new Vec3(this._[0].y, this._[1].y, this._[2].y),
			new Vec3(this._[0].z, this._[1].z, this._[2].z)
		]);
	}
	rotate(v: Vec3)
	{
		return new Vec3(
			this._[0].dot(v),
			this._[1].dot(v),
			this._[2].dot(v)
			);
	}
	rotate2d(angle: number)
	{
		return Mat3.createRotation2d(angle).multiply(this);
	}
	translate2d(x: number, y: number)
	{
		return Mat3.createTranslation2d(x, y).multiply(this);
	}
	private _flattened: number[];
	flatten()
	{
		const flattened = this._flattened;
		if (!flattened)
		{
			flattened = this._flattened = [];
			this._[0].pushTo(flattened);
			this._[1].pushTo(flattened);
			this._[2].pushTo(flattened);
		}
		return flattened;
	}

	toMat4(): Mat4
	{
		return new Mat4([
			this._[0].x, this._[0].y, this._[0].z, 0,
			this._[1].x, this._[1].y, this._[1].z, 0,
			this._[2].x, this._[2].y, this._[2].z, 0,
			0, 0, 0, 1,
		]);
	}
	static I = new Mat3(Vec3.UnitX, Vec3.UnitY, Vec3.UnitZ);

	static createRotation2d(angle: number)
	{
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		return new Mat3(
			new Vec3(c, -s, 0),
			new Vec3(s, c, 0),
			Vec3.UnitZ
			);
	}
	static createTranslation2d(x: Vec2): Mat3;
	static createTranslation2d(x: number, y: number): Mat3;
	static createTranslation2d(x: any, y?: number): Mat3
	{
		if (x instanceof Vec2)
		{
			y = x.y;
			x = x.x;
		}

		return new Mat3(
			new Vec3(1, 0, x),
			new Vec3(0, 1, y),
			Vec3.UnitZ
			);
	}
	static fromEuler(p: Vec3): Mat3;
	static fromEuler(p: number, h: number, b: number): Mat3;

	static fromEuler(p: any, h?: any, b?: any): Mat3
	{
		if (p instanceof Vec3)
		{
			b = p.z;
			h = p.y;
			p = p.x;
		}

		var
			sinp = Math.sin(p),
			cosp = Math.cos(p),
			sinb = Math.sin(b),
			cosb = Math.cos(b),
			sinh = Math.sin(h),
			cosh = Math.cos(h);

		const sbsh = sinb * sinh;
		const cbch = cosb * cosh;
		const cbsh = cosb * sinh;
		const sbch = sinb * cosh;

		return new Mat3(
			new Vec3(cbch + sinp * sbsh, sinb * cosp, sinp * sbch - cbsh),
			new Vec3(sinp * cbsh - sbch, cosb * cosp, sbsh + sinp * cbch),
			new Vec3(sinh * cosp, -sinp, cosh * cosp)
			);
	}
	static createLook = function (forward: Vec3, up?: Vec3, right?: Vec3)
	{
		const x: Vec3, y: Vec3, z: Vec3 = forward.unit();

		if (up)
		{
			y = up.unit();
			x = y.cross(z);
		}
		else
		{
			if (right)
				x = right.unit();
			else
				x = new Vec3(z.z, 0, -z.x).unit();
			y = z.cross(x);
		}
		return new Mat3(x, y, z);
	}
	static createRotation(angles: Vec3): Mat3
	{
		var
			sinp = Math.sin(angles.x),
			cosp = Math.cos(angles.x),
			sinb = Math.sin(angles.z),
			cosb = Math.cos(angles.z),
			sinh = Math.sin(angles.y),
			cosh = Math.cos(angles.y);

		const sbsh = sinb * sinh;
		const cbch = cosb * cosh;
		const cbsh = cosb * sinh;
		const sbch = sinb * cosh;

		return new Mat3(
			new Vec3 (cbch + sinp * sbsh, sinb * cosp, sinp * sbch - cbsh),
			new Vec3 (sinp * cbsh - sbch, cosb * cosp, sbsh + sinp * cbch),
			new Vec3 (sinh * cosp, -sinp, cosh * cosp)
		);
	}
}
*/
class Mat4 {
	elements: Float32Array;

	constructor(elements: Float32Array);
	constructor(elements: number[]);
	constructor(elements: any) {
		if (elements instanceof Float32Array)
			this.elements = <Float32Array>elements;
		else
			this.elements = new Float32Array(<number[]>elements);
	}

	mul(m: Mat4): Mat4 {
		const out = new Float32Array(16);
		const a = this.elements;
		const b = m.elements;

		const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
			a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
			a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
			a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

		// Cache only the current line of the second matrix
		let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
		out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

		b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
		out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

		b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
		out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

		b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
		out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

		return new Mat4(out);
	}

	transform(a: Vec3): Vec3 {
		const x = a.x, y = a.y, z = a.z,
			m = this.elements;

		let w = m[3] * x + m[7] * y + m[11] * z + m[15];
		w = w || 1.0;
		return new Vec3(
			(m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
			(m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
			(m[2] * x + m[6] * y + m[10] * z + m[14]) / w
		);
	}

	flatten() { return this.elements; }

	getRow(row: number): number[] {
		return [
			this.elements[row * 4 + 0],
			this.elements[row * 4 + 1],
			this.elements[row * 4 + 2],
			this.elements[row * 4 + 3]
		];
	}

	get Up(): Vec3 {
		return new Vec3(
			this.elements[1 * 4 + 0],
			this.elements[1 * 4 + 1],
			this.elements[1 * 4 + 2]
		);
	}

	get Forward(): Vec3 {
		return new Vec3(
			this.elements[2 * 4 + 0],
			this.elements[2 * 4 + 1],
			this.elements[2 * 4 + 2]
		);
	}

	toNormalMatrix(): Mat4 {
		const mat = this.elements;
		// Cache the matrix values (makes for huge speed increases!)
		const a00 = mat[0], a01 = mat[1], a02 = mat[2];
		const a10 = mat[4], a11 = mat[5], a12 = mat[6];
		const a20 = mat[8], a21 = mat[9], a22 = mat[10];

		const b01 = a22 * a11 - a12 * a21;
		const b11 = -a22 * a10 + a12 * a20;
		const b21 = a21 * a10 - a11 * a20;

		const d = a00 * b01 + a01 * b11 + a02 * b21;
		if (!d)
			throw new Error();//return null;

		const id = 1 / d;

		return new Mat4([
			b01 * id, b11 * id, b21 * id, 0,
			(-a22 * a01 + a02 * a21) * id, (a22 * a00 - a02 * a20) * id, (-a21 * a00 + a01 * a20) * id, 0,
			(a12 * a01 - a02 * a11) * id, (-a12 * a00 + a02 * a10) * id, (a11 * a00 - a01 * a10) * id, 0,
			0, 0, 0, 1,
		]);
	}



	static I: Mat4 = new Mat4([
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	]);

	static createTranslation(t: Vec3): Mat4 {
		return new Mat4([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			t.x, t.y, t.z, 1,
		]);
	}
	// from http://en.wikibooks.org/wiki/GLSL_Programming/Vertex_Transformations
	static createFrustum(l: number, r: number, b: number, t: number, n: number, f: number): Mat4 {
		const dx = r - l;
		const dy = t - b;
		const dz = f - n;

		const X = 2 * n / dx;
		const Y = 2 * n / dy;
		const A = (r + l) / dx;
		const B = (t + b) / dy;
		const C = -(f + n) / dz;
		const D = 2 * n * f / dz;

		return new Mat4([
			X, 0, A, 0,
			0, Y, B, 0,
			0, 0, C, D,
			0, 0, 1, 0
		]);
	}

	static createPerspective2(fovy: number, aspect: number, znear: number, zfar: number): Mat4 {
		const ymax = znear * Math.tan(fovy * Math.PI / 360.0);
		const ymin = -ymax;
		const xmin = ymin * aspect;
		const xmax = ymax * aspect;

		return Mat4.createFrustum(xmin, xmax, ymin, ymax, znear, zfar);
	}


	static createPerspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
		const out = new Float32Array(16);

		const f = 1.0 / Math.tan(fovy / 2),
			nf = 1 / (near - far);

		out[0] = f / aspect;
		out[1] = 0;
		out[2] = 0;
		out[3] = 0;
		out[4] = 0;
		out[5] = f;
		out[6] = 0;
		out[7] = 0;
		out[8] = 0;
		out[9] = 0;
		out[10] = (far + near) * nf;
		out[11] = -1;
		out[12] = 0;
		out[13] = 0;
		out[14] = (2 * far * near) * nf;
		out[15] = 0;

		return new Mat4(out);
	}

	static createLookAt(cameraPosition: Vec3, cameraTarget: Vec3, cameraUpVector: Vec3): Mat4 {
		const vz = cameraPosition.sub(cameraTarget).unit();
		const vx = cameraUpVector.cross(vz).unit();
		const vy = vz.cross(vx);

		const tx = -vx.dot(cameraPosition);
		const ty = -vy.dot(cameraPosition);
		const tz = -vz.dot(cameraPosition);

		return new Mat4([
			vx.x, vy.x, vz.x, 0,
			vx.y, vy.y, vz.y, 0,
			vx.z, vy.z, vz.z, 0,
			tx, ty, tz, 1,
		]);
	}


	static createLookAt2(cameraPosition: Vec3, cameraTarget: Vec3, cameraUpVector: Vec3): Mat4 {
		const out = new Float32Array(16);
		const eyex = cameraPosition.x,
			eyey = cameraPosition.y,
			eyez = cameraPosition.z,
			upx = cameraUpVector.x,
			upy = cameraUpVector.y,
			upz = cameraUpVector.z,
			centerx = cameraTarget.x,
			centery = cameraTarget.y,
			centerz = cameraTarget.z;

		/*
		if (Math.abs(eyex - centerx) < GLMAT_EPSILON &&
			Math.abs(eyey - centery) < GLMAT_EPSILON &&
			Math.abs(eyez - centerz) < GLMAT_EPSILON)
		{
			return Mat4.I;
		}
		*/

		let z0 = eyex - centerx;
		let z1 = eyey - centery;
		let z2 = eyez - centerz;

		let len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
		z0 *= len;
		z1 *= len;
		z2 *= len;

		let x0 = upy * z2 - upz * z1;
		let x1 = upz * z0 - upx * z2;
		let x2 = upx * z1 - upy * z0;
		len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
		if (!len) {
			x0 = 0;
			x1 = 0;
			x2 = 0;
		}
		else {
			len = 1 / len;
			x0 *= len;
			x1 *= len;
			x2 *= len;
		}

		let y0 = z1 * x2 - z2 * x1;
		let y1 = z2 * x0 - z0 * x2;
		let y2 = z0 * x1 - z1 * x0;

		len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
		if (!len) {
			y0 = 0;
			y1 = 0;
			y2 = 0;
		}
		else {
			len = 1 / len;
			y0 *= len;
			y1 *= len;
			y2 *= len;
		}

		out[0] = x0;
		out[1] = y0;
		out[2] = z0;
		out[3] = 0;
		out[4] = x1;
		out[5] = y1;
		out[6] = z1;
		out[7] = 0;
		out[8] = x2;
		out[9] = y2;
		out[10] = z2;
		out[11] = 0;
		out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
		out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
		out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
		out[15] = 1;

		return new Mat4(out);
	}


	static createOrthographic(width: number, height: number, znear: number, zfar: number): Mat4 {
		const nf = 1 / (znear - zfar);

		return new Mat4([
			2 / width, 0, 0, 0,
			0, 2 / height, 0, 0,
			0, 0, nf, 0,
			0, 0, znear * nf, 1,
		]);
	}

	static createOrthographic2(l: number, r: number, t: number, b: number, n: number, f: number): Mat4 {
		const w = r - l;
		const h = b - t;
		const d = f - n;

		return new Mat4([
			2 / w, 0, 0, 0,
			0, 2 / h, 0, 0,
			0, 0, -2 / d, 0,
			-(r + l) / w, -(t + b) / h, -(f + n) / d, 1,
		]);
	}


	static createRotationX(angle: number): Mat4 {
		const s = Math.sin(angle);
		const c = Math.cos(angle);

		return new Mat4([
			1, 0, 0, 0,
			0, c, s, 0,
			0, -s, c, 0,
			0, 0, 0, 1,
		]);
	}
	static createRotationY(angle: number): Mat4 {
		const s = Math.sin(angle);
		const c = Math.cos(angle);

		return new Mat4([
			c, 0, -s, 0,
			0, 1, 0, 0,
			s, 0, c, 0,
			0, 0, 0, 1,
		]);
	}
	static createRotationZ(angle: number): Mat4 {
		const s = Math.sin(angle);
		const c = Math.cos(angle);

		return new Mat4([
			c, s, 0, 0,
			-s, c, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1,
		]);
	}
}