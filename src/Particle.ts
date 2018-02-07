///<reference path="webgl.ts"/>
///<reference path="Math.ts"/>
///<reference path="Util.ts"/>
///<reference path="Model.ts"/>
///<reference path="Terrain.ts"/>
///<reference path="Actor.ts"/>

let _programParticles: WebGLProgram;

const enum ParticleTypes {
	Thrust,	// 0
	Bullet,	// 1
	MissileTrail,	// 2
	GroundObjectSmoke,	// 3
	WaterHit,	// 4
	BeachHit,	// 5
	GroundHit,	// 6
	LandingPadHit,	// 7
	AlienBuildingHit,	// 8
	Rain,	// 9
	TreeInfection,	// 10
	Infected,	// 11
	Bombs,	// 12
	Explosion,	// 13
	Spark,	// 14
	Tractor,	// 15
	Star,	// 16
	TooHigh,	// 17
	CruiserThrust,	// 18
	Firework,	// 19
	FireworkExplode,	// 20
	Radar	// 21
}
const enum CollidesWith {
	None,
	Friendly,
	Enemy
}
const enum ParticleAlpha {
	None,
	Fade,
	Glow
}
class ParticleType {
	private _sizeMin = 0;
	private _sizeMax = 0;
	static _rgParticleTypes: ParticleType[] = [
		/*  0 */new ParticleType(5, ParticleAlpha.Fade, new Color(250, 50, 0), new Color(250, 250, 50), new Vec2(1, 2), new Vec3(-0.075, -0.05, -0.075), new Vec3(0.075, -0.35, 0.075), 1, 0.025),
		/*  1 */new ParticleType(10, ParticleAlpha.None, new Color(255, 255, 255), new Color(255, 255, 255), new Vec2(2, 2), new Vec3(0, 0, 0.5), new Vec3(0, 0, 0.5), 0, 0.025),
		/*  2 */new ParticleType(5, ParticleAlpha.Fade, new Color(50, 50, 50), new Color(100, 100, 100), new Vec2(1, 2), new Vec3(-0.075, -0.075, -0.15), new Vec3(0.075, 0.075, -0.05), 0.5, 0.025),
		/*  3 */new ParticleType(0, ParticleAlpha.Fade, new Color(50, 50, 50), new Color(100, 100, 100), new Vec2(1, 2), new Vec3(-0.025, 0.04, -0.025), new Vec3(0.025, 0.08, 0.025), 0, 0.005),
		/*  4 */new ParticleType(0, ParticleAlpha.Fade, new Color(50, 125, 250), new Color(50, 250, 250), new Vec2(1, 2), new Vec3(-0.07, 0.1, -0.07), new Vec3(0.07, 0.125, 0.07), 0.5, 0.025),
		/*  5 */new ParticleType(0, ParticleAlpha.Fade, new Color(125, 125, 75), new Color(250, 250, 150), new Vec2(1, 2), new Vec3(-0.06, 0.075, -0.06), new Vec3(0.06, 0.1, 0.06), 0.5, 0.025),
		/*  6 */new ParticleType(0, ParticleAlpha.Fade, new Color(75, 125, 75), new Color(150, 250, 150), new Vec2(1, 2), new Vec3(-0.07, 0.075, -0.07), new Vec3(0.07, 0.1, 0.07), 0.5, 0.025),
		/*  7 */new ParticleType(0, ParticleAlpha.Fade, new Color(125, 125, 125), new Color(250, 250, 250), new Vec2(1, 2), new Vec3(-0.08, 0.05, -0.08), new Vec3(0.08, 0.075, 0.08), 0.5, 0.025),
		/*  8 */new ParticleType(0, ParticleAlpha.Fade, new Color(250, 0, 250), new Color(250, 250, 250), new Vec2(1, 2), new Vec3(-0.08, 0.05, -0.08), new Vec3(0.08, 0.075, 0.08), 0.5, 0.025),
		/*  9 */new ParticleType(3, ParticleAlpha.Fade, new Color(25, 100, 200), new Color(25, 200, 200), new Vec2(1, 2), new Vec3(-0.025, -0.4, -0.025), new Vec3(0.025, -0.4, 0.025), 0.5, 0.01),
		/* 10 */new ParticleType(0, ParticleAlpha.Fade, new Color(250, 50, 0), new Color(250, 100, 50), new Vec2(1.5, 3), new Vec3(-0.15, 0.1, -0.15), new Vec3(0.15, 0.2, 0.15), 2, 0.01),
		/* 11 */new ParticleType(0, ParticleAlpha.Fade, new Color(250, 50, 0), new Color(250, 100, 50), new Vec2(1.5, 3), new Vec3(-0.1, 0.08, -0.1), new Vec3(0.1, 0.15, 0.1), 2, 0.01),
		/* 12 */new ParticleType(10, ParticleAlpha.None, new Color(255, 255, 255), new Color(255, 255, 255), new Vec2(3, 3), new Vec3(0, -0.2, 0), new Vec3(0, -0.2, 0), 0, 0.01),
		/* 13 */new ParticleType(5, ParticleAlpha.Fade, new Color(250, 0, 0), new Color(250, 250, 250), new Vec2(1.5, 3), new Vec3(-0.15, 0.25, -0.15), new Vec3(0.15, 0.4, 0.15), 4, 0.001),
		/* 14 */new ParticleType(0, ParticleAlpha.Fade, new Color(75, 75, 75), new Color(125, 125, 125), new Vec2(1.5, 3), new Vec3(-0.1, 0, -0.1), new Vec3(0.1, 0.1, 0.1), 0, 0.01),
		/* 15 */new ParticleType(0, ParticleAlpha.Fade, new Color(250, 0, 250), new Color(250, 250, 250), new Vec2(1, 2.5), new Vec3(-0.075, -0.075, -0.05), new Vec3(0.075, 0.075, -0.01), 0, 0.05),
		/* 16 */new ParticleType(0, ParticleAlpha.Glow, new Color(100, 100, 100), new Color(200, 200, 200), new Vec2(2, 2), Vec3.Zero, Vec3.Zero, 0, 0.01),
		/* 17 */new ParticleType(0, ParticleAlpha.Glow, new Color(150, 50, 150), new Color(250, 150, 250), new Vec2(2, 2), Vec3.Zero, Vec3.Zero, 0, 0.01),
		/* 18 */new ParticleType(0, ParticleAlpha.Fade, new Color(250, 0, 250), new Color(250, 250, 250), new Vec2(2, 4), new Vec3(-0.25, -0.25, -0.5), new Vec3(0.25, 0.25, -0.3), 0, 0.05),
		/* 19 */new ParticleType(0, ParticleAlpha.None, new Color(128, 128, 128), new Color(250, 250, 250), new Vec2(1.5, 1.5), new Vec3(-0.1, 0.3, -0.1), new Vec3(0.1, 0.5, 0.1), 3, 0.05),
		/* 20 */new ParticleType(3, ParticleAlpha.Fade, new Color(250, 0, 0), new Color(250, 250, 250), new Vec2(1.5, 3), new Vec3(-0.1, -0.1, -0.1), new Vec3(0.1, 0.1, 0.1), 1, 0.025),
		/* 21 */new ParticleType(0, ParticleAlpha.Fade, new Color(0, 250, 0), new Color(250, 250, 250), new Vec2(2, 4), new Vec3(-0.01, -0.01, 0.2), new Vec3(0.01, 0.01, 0.2), 0, 0.05)
	];
	constructor(
		public Splash: number,
		public Alpha: ParticleAlpha,
		private _colorMin: Color,
		private _colorMax: Color,
		size: Vec2,
		private _velocityMin: Vec3,
		private _velocityMax: Vec3,
		public Weight: number,
		public Fade: number) {
		this._sizeMin = size.x;
		this._sizeMax = size.y;
	}
	static Get(idType: ParticleTypes): ParticleType {
		if (idType < ParticleTypes.Thrust || idType >= <ParticleTypes>ParticleType._rgParticleTypes.length)
			throw new Error();
		return ParticleType._rgParticleTypes[idType];
	}
	CreateColor(): Color {
		const fade = Math.random();
		//return new Color(Util.Rand(this._colorMin.R, this._colorMax.R),Util.Rand(this._colorMin.G, this._colorMax.G),Util.Rand(this._colorMin.B, this._colorMax.B));
		return new Color(
			Util.mix(this._colorMin.R, this._colorMax.R, fade),
			Util.mix(this._colorMin.G, this._colorMax.G, fade),
			Util.mix(this._colorMin.B, this._colorMax.B, fade)
		);
	}
	CreateVelocity(): Vec3 {
		const vx = Util.Rand(this._velocityMin.x, this._velocityMax.x);
		const vy = Util.Rand(this._velocityMin.y, this._velocityMax.y);
		const vz = Util.Rand(this._velocityMin.z, this._velocityMax.z);
		return new Vec3(vx, vy, vz);
	}
	CreateSize(): number {
		return Util.Rand(this._sizeMin, this._sizeMax);
	}
}

class Particle {
	static Gravity = 0.004;
	private _id: ParticleTypes;
	private _type: ParticleType;
	private _size: number;
	private _position: Vec3;
	private _velocity: Vec3;
	private _color: Color;
	private _life: number;
	private _cw: CollidesWith;
	get ID(): ParticleTypes {
		return this._id;
	}
	get Type(): ParticleType {
		return this._type;
	}
	get Size(): number {
		return this._size;
	}
	get Position(): Vec3 {
		return this._position;
	}
	get Velocity(): Vec3 {
		return this._velocity;
	}
	get Color(): Color {
		return Color.FromNonPremultiplied(this._color.R, this._color.G, this._color.B, 255 * this.Alpha);
	}
	get Alpha(): number {
		switch (this.Type.Alpha) {
			case ParticleAlpha.Fade:
				return 0.75 * this._life;
			case ParticleAlpha.Glow:
				return 1 - 2 * Math.abs(this._life - 0.5);
			default:
				return 1;
		}
	}
	constructor(pt: ParticleTypes, position: Vec3, offset: Vec3, velocity: Vec3, rotation: Mat4, cw: CollidesWith) {
		this._id = pt;
		this._type = ParticleType.Get(pt);
		this._color = this.Type.CreateColor();
		this._velocity = rotation.transform(this.Type.CreateVelocity()).add(velocity);
		this._size = this.Type.CreateSize();
		this._position = position.add(rotation.transform(offset));
		this._cw = cw;
		this._life = 1;
	}
	Initialize(pt: ParticleTypes, position: Vec3, offset: Vec3, velocity: Vec3, rotation: Mat4, cw: CollidesWith) {
		this._id = pt;
		this._type = ParticleType.Get(pt);
		this._color = this.Type.CreateColor();
		this._velocity = rotation.transform(this.Type.CreateVelocity()).add(velocity);
		this._size = this.Type.CreateSize();
		this._position = position.add(rotation.transform(offset));
		this._cw = cw;
		this._life = 1;
	}
	Update(terrain: Terrain, actors: Actors): ParticleEvent {
		this._life -= this.Type.Fade;
		if (this._life <= 0)
			return ParticleEvent.Die;

		this._velocity.y -= Particle.Gravity * this.Type.Weight;
		this._position = terrain.Wrap(this._position.add(this._velocity));
		const y = this._position.y;
		if (y < 15) {
			const terrainSquare = terrain.SquareAt(this.Position.x, this.Position.z);
			const height = terrainSquare.Height;
			if (y < height) {
				this._position.y = height;
				this._velocity.x /= 2;
				this._velocity.y /= -2;
				this._velocity.z /= 2;
				return ParticleEvent.Bounce;
			}

			const entity = terrainSquare.Entity;
			if (entity && entity.Model && entity.Status != EntityStatus.Destroyed) {
				const height2 = entity.Model.Height;
				if (y < height + height2)
					return ParticleEvent.EntityCollision;
			}
		}
		if (this._cw !== CollidesWith.None) {
			if (actors.Collide(terrain, this._position, this._cw === CollidesWith.Friendly))
				return ParticleEvent.ActorCollision;
		}
		return ParticleEvent.None;
	}
}

const enum ParticleEvent {
	None,
	Die,
	Bounce,
	EntityCollision,
	ActorCollision
}

class Particles {
	static _cParticlesMax = 128;
	private _cActiveParticles = 0;
	private _rgParticles: Particle[] = new Array<Particle>();
	//private _rgIndices: number[] = null;

	private _vbTextureCoords: WebGLBuffer;
	private _vbPosition: WebGLBuffer;
	private _vbColor: WebGLBuffer;
	private _vbSize: WebGLBuffer;
	private _ibTerrain: WebGLBuffer;

	constructor() {
		useProgram(_programParticles);

		const rgfTextureCoords = new Float32Array(Particles._cParticlesMax * 4 * 2);
		const rgfIndices = new Uint16Array(Particles._cParticlesMax * 6);

		const particleScale = 0.05 / 2;
		for (let iParticle = 0; iParticle < Particles._cParticlesMax; ++iParticle) {
			new Vec2(-1, -1).scale(particleScale).writeTo(rgfTextureCoords, iParticle * 4 + 0);
			new Vec2(-1, 1).scale(particleScale).writeTo(rgfTextureCoords, iParticle * 4 + 1);
			new Vec2(1, -1).scale(particleScale).writeTo(rgfTextureCoords, iParticle * 4 + 2);
			new Vec2(1, 1).scale(particleScale).writeTo(rgfTextureCoords, iParticle * 4 + 3);

			rgfIndices[iParticle * 6 + 0] = iParticle * 4 + 0;
			rgfIndices[iParticle * 6 + 1] = iParticle * 4 + 1;
			rgfIndices[iParticle * 6 + 2] = iParticle * 4 + 2;
			rgfIndices[iParticle * 6 + 3] = iParticle * 4 + 2;
			rgfIndices[iParticle * 6 + 4] = iParticle * 4 + 1;
			rgfIndices[iParticle * 6 + 5] = iParticle * 4 + 3;
		}

		this._vbTextureCoords = createBuffer(rgfTextureCoords, 2);
		this._vbPosition = createDynamicBuffer(new Float32Array(Particles._cParticlesMax * 4 * 3), 3);
		this._vbColor = createDynamicBuffer(new Float32Array(Particles._cParticlesMax * 4 * 4), 4);
		this._vbSize = createDynamicBuffer(new Float32Array(Particles._cParticlesMax * 4 * 1), 1);

		this._ibTerrain = notNull(gl.createBuffer());
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibTerrain);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rgfIndices, gl.STATIC_DRAW);
	}

	AddParticles(pt: ParticleTypes, position: Vec3, offset: Vec3 | null = Vec3.Zero, velocity: Vec3 | null = Vec3.Zero, rotation: Mat4 | null = Mat4.I, count: number = 1, cw: CollidesWith = CollidesWith.None) {
		if (!offset)
			offset = Vec3.Zero;
		if (!velocity)
			velocity = Vec3.Zero;
		if (!rotation)
			rotation = Mat4.I;

		for (let iParticle = count - 1; iParticle >= 0; --iParticle) {
			console.assert(this._cActiveParticles <= this._rgParticles.length);
			let particle: Particle;
			if (this._cActiveParticles === this._rgParticles.length)
				this._rgParticles.push(particle = new Particle(pt, position, offset, velocity, rotation, cw));
			else {

				particle = this._rgParticles[this._cActiveParticles];
				particle.Initialize(pt, position, offset, velocity, rotation, cw);
			}
			++this._cActiveParticles;
		}
	}

	RemoveAt(i: number) {
		console.assert(i >= 0);
		console.assert(i < this._cActiveParticles);
		console.assert(this._cActiveParticles > 0);
		--this._cActiveParticles;
		if (this._cActiveParticles > 0 && this._cActiveParticles !== i) {
			const value = this._rgParticles[i];
			this._rgParticles[i] = this._rgParticles[this._cActiveParticles];
			this._rgParticles[this._cActiveParticles] = value;
		}
	}
	Update(terrain: Terrain, actors: Actors) {
		for (let iParticle = this._cActiveParticles - 1; iParticle >= 0; --iParticle) {
			const particle = this._rgParticles[iParticle];
			console.assert(particle !== null);
			const event = particle.Update(terrain, actors);
			const x = particle.Position.x;
			const z = particle.Position.z;
			switch (event) {
				case ParticleEvent.Die:
					this.RemoveAt(iParticle);
					break;
				case ParticleEvent.Bounce:
					switch (particle.ID) {
						case ParticleTypes.TreeInfection:
							terrain.Infect(x, z, 1 / 2);
							break;
						case ParticleTypes.Infected:
							terrain.Infect(x, z, 2 / 2);
							break;
						case ParticleTypes.Bullet:
							//this.AddParticles(ParticleTypes.Explosion, particle.Position);
							break;
					}

					const cSplash = particle.Type.Splash;
					if (cSplash > 0) {
						let pt: ParticleTypes;
						if (particle.ID === ParticleTypes.Bombs)
							pt = ParticleTypes.Infected;
						else {
							const terrainSquare = terrain.SquareAt(x, z);
							pt = ParticleTypes.WaterHit + terrainSquare.Type;
						}
						const position = particle.Position;
						for (let iSplash = cSplash; iSplash--;)
							this.AddParticles(pt, position);
						this.RemoveAt(iParticle);
					}
					break;

				case ParticleEvent.EntityCollision:
					const iD = particle.ID;
					if (iD === ParticleTypes.Bullet) {
						const terrainSquare = terrain.SquareAt(x, z);
						const entity = terrainSquare.Entity;
						if (entity && entity.Status !== EntityStatus.Destroyed) {
							if (entity.Type === TerrainEntityTypes.Radar)
								terrain.HideRadar(x, z);

							// TODO: render destroyed entities
							entity.Status = EntityStatus.Destroyed;

							const height = entity.Model.Height;
							//terrainSquare.RemoveEntity();
							for (let iExplosion = 30; iExplosion--;) {
								const position2 = new Vec3(x + Util.Rand(1), terrainSquare.Height + Util.Rand(height), z + Util.Rand(1));
								this.AddParticles(ParticleTypes.Explosion, position2);
							}
						}
					}
					break;
				case ParticleEvent.ActorCollision:
					this.AddParticles(ParticleTypes.Explosion, particle.Position, null, null, null, 8);
					this.RemoveAt(iParticle);
					break;
			}
		}
	}

	Draw(pos: Vec3, sizeCull: Size, sizeTerrain: Size, mxView: Mat4) {
		const minX = pos.x - (sizeCull.Width / 2) - 1;
		const maxX = minX + sizeCull.Width + 2;
		const minZ = pos.z - (sizeCull.Height / 2) - 1;
		const maxZ = minZ + sizeCull.Height + 2;

		useProgram(_programParticles);

		const width = sizeTerrain.Width;
		const height = sizeTerrain.Height;

		gl.disable(gl.CULL_FACE);
		gl.enable(gl.BLEND);

		const rgfPosition = <Float32Array>this._vbPosition["items"];
		const rgfColor = <Float32Array>this._vbColor["items"];
		const rgfSize = <Float32Array>this._vbSize["items"];

		loadAttribBuffer(_programParticles["aTextureCoords"], this._vbTextureCoords);
		loadAttribBuffer(_programParticles["aPosition"], this._vbPosition);
		loadAttribBuffer(_programParticles["aColor"], this._vbColor);
		loadAttribBuffer(_programParticles["aSize"], this._vbSize);

		gl.uniformMatrix4fv(_programParticles["xWorldView"], false, mxView.flatten());

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibTerrain);

		let cv = 0;
		for (let iParticle = this._cActiveParticles; iParticle--;) {
			const particle = this._rgParticles[iParticle];
			console.assert(particle !== null);
			const x = Util.Wrap(particle.Position.x, minX, minX + width);
			if (x > maxX)
				continue;

			const z = Util.Wrap(particle.Position.z, minZ, minZ + height);
			if (z > maxZ)
				continue;

			const pos = new Vec3(x, particle.Position.y, z);
			pos.writeTo(rgfPosition, cv * 4 + 0);
			pos.writeTo(rgfPosition, cv * 4 + 1);
			pos.writeTo(rgfPosition, cv * 4 + 2);
			pos.writeTo(rgfPosition, cv * 4 + 3);

			const color = particle.Color;
			color.writeFloatTo(rgfColor, cv * 4 + 0);
			color.writeFloatTo(rgfColor, cv * 4 + 1);
			color.writeFloatTo(rgfColor, cv * 4 + 2);
			color.writeFloatTo(rgfColor, cv * 4 + 3);

			rgfSize[cv * 4 + 0] =
				rgfSize[cv * 4 + 1] =
				rgfSize[cv * 4 + 2] =
				rgfSize[cv * 4 + 3] = particle.Size;

			++cv;
			if (cv === Particles._cParticlesMax) {
				updateDynamicBuffer(this._vbPosition, 0, rgfPosition);
				updateDynamicBuffer(this._vbColor, 0, rgfColor);
				updateDynamicBuffer(this._vbSize, 0, rgfSize);
				gl.drawElements(gl.TRIANGLES, cv * 6, gl.UNSIGNED_SHORT, 0);
				cv = 0;
			}
		}

		if (cv !== 0) {
			updateDynamicBuffer(this._vbPosition, 0, rgfPosition);
			updateDynamicBuffer(this._vbColor, 0, rgfColor);
			updateDynamicBuffer(this._vbSize, 0, rgfSize);
			gl.drawElements(gl.TRIANGLES, cv * 6, gl.UNSIGNED_SHORT, 0);
		}
		gl.disableVertexAttribArray(_programParticles["aTextureCoords"]);
		gl.disableVertexAttribArray(_programParticles["aPosition"]);
		gl.disableVertexAttribArray(_programParticles["aColor"]);
		gl.disableVertexAttribArray(_programParticles["aSize"]);
	}
}
