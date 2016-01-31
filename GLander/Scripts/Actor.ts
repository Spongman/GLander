///<reference path="Math.ts"/>
///<reference path="Util.ts"/>
///<reference path="Model.ts"/>
///<reference path="Terrain.ts"/>
///<reference path="Particle.ts"/>
///<reference path="ContentManager.ts"/>

const enum ActorTypes
{
	Hoverplane,	// 0
	Seeder,	// 1
	Bomber,	// 2
	Pest,	// 3
	Drone,	// 4
	Mutant,	// 5
	Fighter,	// 6
	Destroyer,	// 7
	Attractor,	// 8
	Repulsor,	// 9
	Mystery,	// 10
	DroneGenerator,	// 11
	MutantGenerator,	// 12
	FighterGenerator,	// 13
	DestroyerGenerator,	// 14
	Cruiser,	// 15
	Elite,	// 16
	Monster,	// 17
	Ally,	// 18
	Spore,	// 19
	Missile	// 20
}
const enum EngineTypes
{
	Engine0,
	Engine1,
	Engine2,
	Engine3
}


class ActorType extends BaseModel
{
	SpinRate = 0;
	MinPitch = 0;
	MaxPitch = 0;
	TurnRate = 0;
	ThrustRate = 0;
	Radius = 0;
	IsFriendly = false;
	constructor(
		public Type: ActorTypes,
		modelName: string,
		private _cPoints: number,
		public Thrust: number,
		public Momentum: number,
		public FireRate: number,
		public LaunchRate: number,
		public Damage: number,
		rateSpin: number,
		public EngineType: EngineTypes,
		pitchMin: number,
		pitchMax: number,
		rateTurn: number,
		public Range: number,
		public MapColor: Color,
		public CruiseHeight: number,
		public ChildType: ActorTypes = null)
	{
		super(modelName);

		this.SpinRate = Math.toRadians(rateSpin);
		this.MinPitch = Math.toRadians(pitchMin);
		this.MaxPitch = Math.toRadians(pitchMax);
		this.TurnRate = Math.toRadians(rateTurn);

		var boundingSphere: Sphere = this.Model.Meshes[0].BoundingSphere;

		/*
		for (var iMesh = 0; iMesh < this.Model.Meshes.length; ++iMesh)
		{
			const current = this.Model.Meshes[iMesh];
			if (boundingSphere)
				boundingSphere = boundingSphere.add(current.BoundingSphere);
			else
				boundingSphere = current.BoundingSphere;
		}
		*/

		this.Radius = boundingSphere.Radius * 1.5;
		const actorType = this.Type;
		if (actorType !== ActorTypes.Hoverplane && actorType !== ActorTypes.Missile && actorType !== ActorTypes.Cruiser)
			this.ThrustRate = 5;
		this.IsFriendly = (actorType === ActorTypes.Hoverplane || actorType === ActorTypes.Ally);
	}
}
class ActorFactory
{
	private _rgActorTypes: ActorType[];
	private _mapActorTypes: { [type: string]: ActorType } = {};
	get Types(): ActorType[]
	{
		return this._rgActorTypes;
	}
	constructor()
	{
		var rgActorTypes: ActorType[] = [
			/*  0 */ new ActorType(ActorTypes.Hoverplane, "Hoverplane", 0, 0.02, 0.9925, 3, 15, 100, 0, EngineTypes.Engine0, 0, 180, 5, 128, Color.White, 5, ActorTypes.Missile),
			/*  1 */ new ActorType(ActorTypes.Seeder, "Seeder", 100, 0.001, 0.99, 3, 0, 500, 5, EngineTypes.Engine1, 0, 0, 5, 0, new Color(0, 255, 255), 4),
			/*  2 */ new ActorType(ActorTypes.Bomber, "Bomber", 800, 0.002, 0.99, 20, 0, 500, 0, EngineTypes.Engine1, 0, 0, 5, 0, new Color(96, 96, 255), 8),
			/*  3 */ new ActorType(ActorTypes.Pest, "Pest", 400, 0.05, 0.9, 2, 0, 500, 10, EngineTypes.Engine2, -75, 75, 5, 0, new Color(128, 128, 128), 20),
			/*  4 */ new ActorType(ActorTypes.Drone, "Drone", 300, 0.015, 0.98, 15, 0, 500, 0, EngineTypes.Engine0, 0, 90, 2, 48, new Color(160, 80, 40), 20),
			/*  5 */ new ActorType(ActorTypes.Mutant, "Mutant", 500, 0.015, 0.98, 12, 0, 500, 0, EngineTypes.Engine0, 0, 90, 3, 48, new Color(255, 0, 255), 20),
			/*  6 */ new ActorType(ActorTypes.Fighter, "Fighter", 750, 0.015, 0.98, 9, 0, 250, 0, EngineTypes.Engine0, 0, 90, 4, 64, new Color(255, 160, 0), 20),
			/*  7 */ new ActorType(ActorTypes.Destroyer, "Destroyer", 2000, 0.0175, 0.98, 9, 0, 50, 0, EngineTypes.Engine0, 0, 90, 5, 80, new Color(255, 96, 96), 20),
			/*  8 */ new ActorType(ActorTypes.Attractor, "Attractor", 1000, 0.0015, 0.99, 2, 0, 100, 5, EngineTypes.Engine1, 0, 0, 5, 12, new Color(255, 255, 0), 5),
			/*  9 */ new ActorType(ActorTypes.Repulsor, "Repulsor", 1000, 0.0025, 0.99, 9, 0, 100, 15, EngineTypes.Engine1, 0, 0, 5, 15, new Color(96, 255, 96), 7.5),
			/* 10 */ new ActorType(ActorTypes.Mystery, "Mystery", 2000, 0.0015, 0.99, 2, 150, 20, 0, EngineTypes.Engine1, 0, 0, 5, 20, Color.Black, 25, ActorTypes.Spore),
			/* 11 */ new ActorType(ActorTypes.DroneGenerator, "Generator", 2000, 1E-06, 0, 3, 300, 10, 2, EngineTypes.Engine1, 0, 0, 5, 64, new Color(160, 80, 40), 30, ActorTypes.Drone),
			/* 12 */ new ActorType(ActorTypes.MutantGenerator, "Generator", 2000, 1E-06, 0, 3, 150, 10, 2, EngineTypes.Engine1, 0, 0, 5, 64, new Color(255, 0, 255), 30, ActorTypes.Mutant),
			/* 13 */ new ActorType(ActorTypes.FighterGenerator, "Generator", 2000, 1E-06, 0, 3, 150, 10, 2, EngineTypes.Engine1, 0, 0, 5, 64, new Color(255, 160, 0), 30, ActorTypes.Fighter),
			/* 14 */ new ActorType(ActorTypes.DestroyerGenerator, "Generator", 2000, 1E-06, 0, 3, 150, 10, 2, EngineTypes.Engine1, 0, 0, 5, 64, new Color(255, 96, 96), 30, ActorTypes.Destroyer),
			/* 15 */ new ActorType(ActorTypes.Cruiser, "Cruiser", 5000, 0.004, 0.99, 3, 150, 5, 0, EngineTypes.Engine3, 0, 0, 20, 64, new Color(192, 64, 255), 50, ActorTypes.Elite),
			/* 16 */ new ActorType(ActorTypes.Elite, "Elite", 2500, 0.02, 0.9925, 6, 90, 25, 0, EngineTypes.Engine0, 0, 90, 5, 128, new Color(192, 64, 255), 40, ActorTypes.Spore),
			/* 17 */ new ActorType(ActorTypes.Monster, "Monster", 2000, 1E-05, 0, 2, 0, 500, 1, EngineTypes.Engine1, 0, 0, 3, 32, new Color(255, 255, 255), 0),
			/* 18 */ new ActorType(ActorTypes.Ally, "Ally", 0, 0.02, 0.9925, 3, 15, 25, 0, EngineTypes.Engine0, 0, 180, 5, 128, new Color(255, 255, 255), 20),
			/* 19 */ new ActorType(ActorTypes.Spore, "Spore", 150, 0.03, 0.9, 2, 0, 500, 20, EngineTypes.Engine2, -75, 75, 5, 0, Color.Black, 20),
			/* 20 */ new ActorType(ActorTypes.Missile, "Missile", 0, 0.04, 0.925, 2, 0, 500, 0, EngineTypes.Engine2, -90, 90, 5, 1000, Color.White, 30)
		];
		for (var iActorType = rgActorTypes.length; iActorType--;)
		{
			const actorType = rgActorTypes[iActorType];
			this._mapActorTypes[actorType.Type] = actorType;
		}
		this._rgActorTypes = rgActorTypes;
	}
	CreateActor(terrain: Terrain, actorType: ActorTypes): Actor
	{
		const factory = this.GetActorType(actorType);
		return new Actor(terrain, factory);
	}
	GetActorType(actorType: ActorTypes): ActorType
	{
		return this._mapActorTypes[actorType];
	}
}
class Actor
{
	protected _rotation: Mat4;
	private _spin = 0;
	private _fuel = 500;
	protected _fFiring = true;
	private _target: Actor;
	private _cChildren: number;

	private _timeLastFire = 0;
	private _timeLastLaunch = 0;
	private _timeLastThrust = 0;

	get IsAlive(): boolean
	{
		return this._fuel > 0;
	}
	get Position(): Vec3
	{
		return this._position;
	}
	get Velocity(): Vec3
	{
		return this._velocity;
	}
	get Rotation(): Mat4
	{
		return this._rotation;
	}
	constructor(
		terrain: Terrain,
		public Type: ActorType,
		protected _position: Vec3 = null,
		protected _velocity: Vec3 = new Vec3(0, 0, 0),
		protected _pitch = 0,
		protected _yaw = Util.Rand(Util.TwoPI))
	{
		if (!this._position)
		{
			const x = Util.Rand(terrain.Size.Width);
			const y = Util.Rand(terrain.Size.Height);
			//x = 128-4;
			//y = 128;
			this._position = new Vec3(x, terrain.HeightAt(x, y) + this.Type.CruiseHeight, y);
		}

		if (this.Type.ChildType !== null)
			this._cChildren = 3;

		const matrix = Mat4.createRotationY(this._yaw).mul(Mat4.createRotationX(this._pitch));
		this._rotation = matrix.mul(Mat4.createRotationY(this._spin));
	}

	private chase(target: Actor, terrain: Terrain): Vec2
	{
		const pos = this._position;
		const tpos = target.Position;

		const dx = Util.Wrap(tpos.x - pos.x, -terrain.Size.Width / 2, terrain.Size.Width / 2);
		const dz = Util.Wrap(tpos.z - pos.z, -terrain.Size.Height / 2, terrain.Size.Height / 2);
		const dh = Math.sqrt(dx * dx + dz * dz);
		const dy = tpos.y - pos.y;

		const dPitch = Math.atan2(dy, dh) - this._pitch;
		const dYaw = Math.atan2(dx, dz) - this._yaw;
		return new Vec2(dPitch, dYaw);
	}

	Update(gameTime: number, terrain: Terrain, particles: Particles, actors: Actors): void
	{
		const type = this.Type;
		const pos = this._position;

		var fLaunch = false;
		var fFire = false;
		var fThrust = true;

		var dYaw = 0;
		var dPitch = 0;
		var thrust = type.Thrust;
		var pitchMax = 0;
		const heightGround = terrain.HeightAtExact(pos.x, pos.z);
		const heightCruise = type.CruiseHeight + heightGround;
		const attackHeight = 5;

		if (this._target && !this._target.IsAlive)
			this._target = null;

		switch (type.EngineType)
		{
			case EngineTypes.Engine0:
				const range2 = type.Range * type.Range;

				if (!this._target || terrain.Distance2(pos, this._target.Position) > range2)
				{
					this._target = this.FindTarget(terrain, actors, !type.IsFriendly);
					//this._target = actors.ActorList[0];
				}

				if (this._target)
				{
					const attAdj = this.chase(this._target, terrain);
					dPitch = attAdj.x;
					dYaw = attAdj.y;

					//if (Math.abs(dYaw) > Math.toRadians(30) && IsPlayer)
					//	thrust = 0;

					if (Math.abs(dYaw) > Math.toRadians(30))
						fThrust = false;

					const distance2 = terrain.Distance2(pos, this._target.Position);
					fFire = (distance2 < 15 * 15 && Math.abs(dPitch) < Math.toRadians(90));

					pitchMax = Util.ToRadians(10.0 + 45.0) * distance2 / range2;

					fLaunch = (type.Type === ActorTypes.Elite && distance2 < 20 * 20);
				}
				else
				{
					dYaw = Math.toRadians(Util.Rand(-0.25, 0.25));
					pitchMax = Math.toRadians(Util.Rand(10, 45));
				}

				if (!fFire)
					dPitch = -(pitchMax - this._pitch);

				if (pos.y > heightCruise + attackHeight / 2)
					fThrust = false;

				if (pos.y < Terrain.MaxHeight && (pos.y < heightCruise || this._velocity.y < -0.25))
				{
					dPitch = this._pitch - Math.toRadians(Util.Rand(10, 45));
					fThrust = true;
				}

				const clearance = pos.y - heightGround;
				if (clearance <= 10)
				{
					dPitch = this._pitch - Math.toRadians(Util.Rand(5, 4.5 * clearance));
					fThrust = true;
				}

				//$("#playerAtt").text(Math.round(dPitch, 2) + ", " + Math.round(dYaw, 2));
				//fThrust = false;
				break;

			case EngineTypes.Engine1:
			case EngineTypes.Engine3:
				pos.y += (heightCruise - pos.y) * 0.025;
				dYaw = Math.toRadians(Util.Rand(-0.25, 0.25));
				switch (type.Type)
				{
					case ActorTypes.Seeder:
						fFire = true;
						break;
					case ActorTypes.Mystery:
					case ActorTypes.DroneGenerator:
					case ActorTypes.MutantGenerator:
					case ActorTypes.FighterGenerator:
					case ActorTypes.DestroyerGenerator:
					case ActorTypes.Cruiser:
						this._target = this.FindTarget(terrain, actors, !type.IsFriendly);
						if (this._target)
							fLaunch = true;
						break;
				}
				break;

			case EngineTypes.Engine2:
				const actorType = type.Type;
				switch (actorType)
				{
					case ActorTypes.Missile:
						if (this._fuel === 500)
						{
							thrust = thrust * 10;
						}
						else if (this._fuel < 490)
						{
							if (!this._target)
								this._target = this.FindTarget(terrain, actors, false);

							if (this._target)
							{
								const attAdj = this.chase(this._target, terrain);
								dPitch = attAdj.x;
								dYaw = attAdj.y;
								dYaw = 10;
							}
						}
						this._fuel--;
						break;

					case ActorTypes.Spore:
					case ActorTypes.Pest:

						if (!this._target)
							this._target = this.FindTarget(terrain, actors, true);

						if (this._target)
						{
							const attAdj = this.chase(this._target, terrain);
							dPitch = attAdj.x;
							dYaw = attAdj.y;
						}

						if (pos.y < heightCruise)
							dPitch = Math.toRadians(2);
						if (pos.y > Terrain.MaxHeight)
							dPitch = Math.toRadians(-2);
						break;
				}
		}

		this.InnerUpdate(
			terrain, particles, actors, gameTime,
			fFire, fThrust, fLaunch,
			type.TurnRate * Util.Limit(Util.WrapAngle(dPitch), -1, 1),
			type.TurnRate * Util.Limit(Util.WrapAngle(dYaw), -1, 1),
			heightGround
		);
	}

	protected InnerUpdate(
		terrain: Terrain,
		particles: Particles,
		actors:Actors,

		gameTime: number,

		fFire:boolean,
		fThrust: boolean,
		fLaunch: boolean,

		dPitch: number,
		dYaw: number,

		heightGround?: number
	)
	{
		const type = this.Type;
		var pos = this._position;

		if (typeof heightGround === 'undefined')
			heightGround = terrain.HeightAtExact(pos.x, pos.z);

		//thrust = 0;
		//this._velocity = Vec3.Zero;

		this._spin = Util.Wrap(this._spin + type.SpinRate, 2 * Math.PI);
		this._pitch = Util.Limit(this._pitch - dPitch, type.MinPitch, type.MaxPitch);
		this._yaw = Util.Wrap(this._yaw + dYaw, Util.TwoPI);
		const matrix = Mat4.createRotationY(this._yaw).mul(Mat4.createRotationX(this._pitch));

		this._velocity = this._velocity.scale(type.Momentum);

		if (type.EngineType === EngineTypes.Engine0)
			this._velocity.y -= Particle.Gravity;

		if (pos.y > Terrain.MaxHeight)
			this._velocity.y -= Particle.Gravity;

		if (fThrust)
		{
			const thrustVec = type.EngineType === EngineTypes.Engine0 ? matrix.Up : matrix.Forward;
			this._velocity = this._velocity.add(thrustVec.scale(type.Thrust));
		}

		this._position = pos = terrain.Wrap(pos.add(this._velocity));
		this._rotation = matrix.mul(Mat4.createRotationY(this._spin));

		if (pos.y < heightGround + .5)
		{
			pos.y = heightGround + .5;

			if ((type.Type === ActorTypes.Hoverplane) &&
				this._velocity.y > -.1 &&
				this._pitch < Math.toRadians(6) &&
				terrain.SquareAt(pos.x, pos.z).Type === TerrainTypes.LandingPad)
			{
				this._pitch = 0;
				this._fuel = Util.Limit(this._fuel + 1.5, 0, 500);
				this._velocity.x *= .75;
				this._velocity.y = -this._velocity.y / 2;
				this._velocity.z *= .75;
			}
			else
			{
				this._fuel = 0;
			}
		}
		else
		{
			if (terrain.Collide(pos, type.Radius))
			{
				this._fuel = 0;
			}
		}

		if (type.EngineType !== EngineTypes.Engine2 && this._fuel <= 100 && Math.random() < 1 / 3)
			particles.AddParticles(ParticleTypes.Spark, pos, this._velocity, null, this._rotation, 2);

		if (fThrust && (gameTime - this._timeLastThrust) > type.ThrustRate / 15)
		{
			this._timeLastThrust = gameTime;

			switch (type.EngineType)
			{
				case EngineTypes.Engine0:
					particles.AddParticles(ParticleTypes.Thrust, pos, new Vec3(0, -0.5, 0), this._velocity, this._rotation, 3);
					break;
				case EngineTypes.Engine2:
					particles.AddParticles(ParticleTypes.MissileTrail, pos, new Vec3(0, 0, -1), this._velocity, this._rotation);
					break;
				case EngineTypes.Engine3:
					particles.AddParticles(ParticleTypes.CruiserThrust, pos, new Vec3(0, 0, 6), this._velocity, this._rotation, 3, CollidesWith.Friendly);
					break;
			}
		}

		if (fFire && (gameTime - this._timeLastFire) > type.FireRate / 30)
		{
			this._timeLastFire = gameTime;

			switch (type.Type)
			{
				case ActorTypes.Seeder:
					particles.AddParticles(ParticleTypes.Infected, pos, new Vec3(0, 0.5, 0), this._velocity, this._rotation);
					break;
				case ActorTypes.Bomber:
					particles.AddParticles(ParticleTypes.Bombs, pos, new Vec3(0, -0.5, 0), this._velocity, this._rotation, 1, CollidesWith.Friendly);
					break;
				default:
					particles.AddParticles(ParticleTypes.Bullet, pos, new Vec3(0, 0, .25), this._velocity.scale(.5), this._rotation, 1, type.IsFriendly ? CollidesWith.Enemy : CollidesWith.Friendly);
					break;
			}
		}

		if (fLaunch && this._cChildren > 0 && (gameTime - this._timeLastLaunch) > type.LaunchRate / 30)
		{
			this._timeLastLaunch = gameTime;

			this._cChildren--;

			const childType = actors.Factory.GetActorType(type.ChildType);
			const childVelocity = matrix.Forward;
			const childOffset = type.Radius + childType.Radius / 4;

			const child = new Actor(
				terrain,
				childType,
				pos.addScale(childVelocity, childOffset),
				childVelocity,
				this._pitch,
				this._yaw + this._spin
				);
			actors.AddActor(child);
		}
	}
	private FindTarget(terrain: Terrain, actors: Actors, fFriendly: boolean): Actor
	{
		return actors.FindNearestActor(terrain, this._position, this.Type.Range, fFriendly);
	}
	HitTest(terrain: Terrain, position: Vec3): boolean
	{
		const radius = this.Type.Radius;
		return terrain.Distance2(this._position, position) < (radius * radius);
	}
	Damage(): boolean
	{
		this._fuel = this._fuel - this.Type.Damage;
		var result: boolean;
		if (this._fuel > 0)
		{
			result = false;
		}
		else
		{
			this._fuel = 0;
			result = true;
		}
		return result;
	}
}

class Actors
{
	private _rgActors = new Array<Actor>();

	get ActorList(): Actor[]
	{
		return this._rgActors;
	}
	constructor(public Factory:ActorFactory)
	{
	}

	AddActor(actor: Actor): number
	{
		this._rgActors.push(actor);
		return this._rgActors.length - 1;
	}
	AddActors(actors: Actor[])
	{
		this._rgActors.push.apply(this._rgActors, actors);
	}

	RemoveActorAt(iActor: number): void
	{
		console.assert(iActor >= 0 && iActor < this._rgActors.length);
		const last = this._rgActors.pop();
		if (iActor < this._rgActors.length)
			this._rgActors[iActor] = last;
	}
	FindNearestActor(terrain: Terrain, position: Vec3, range: number, fFriendly: boolean): Actor
	{
		const range2 = range * range;
		var actorClosest:Actor = null;
		var distance2Min = Number.MAX_VALUE;

		for (var iActor = this._rgActors.length; iActor--;)
		{
			const current = this._rgActors[iActor];

			console.assert(current.IsAlive);

			const actorType = current.Type;
			const actorTypes = actorType.Type;

			switch (actorTypes)
			{
				case ActorTypes.Monster:
				case ActorTypes.Missile:
					continue;
				case ActorTypes.Ally:
				case ActorTypes.Hoverplane:
					if (!fFriendly)
						continue;
					break;
				default:
					if (fFriendly)
						continue;
					break;
			}

			const distance2 = terrain.Distance2(position, current.Position);
			if (range && distance2 < range2)
			{
				if (distance2Min > distance2)
				{
					distance2Min = distance2;
					actorClosest = current;
				}
			}
		}
		return actorClosest;
	}
	private FindActorAt(terrain: Terrain, position: Vec3, fFriendly: boolean): number
	{
		var result: number;
		for (var iActor = this._rgActors.length; iActor--;)
		{
			const actor = this._rgActors[iActor];
			console.assert(actor.IsAlive);
			const actorType = actor.Type;
			const type2 = actorType.Type;
			if ((type2 === ActorTypes.Hoverplane || type2 === ActorTypes.Ally) === fFriendly)
			{
				if (actor.HitTest(terrain, position))
				{
					result = iActor;
					return result;
				}
			}
		}
		result = -1;
		return result;
	}
	Update(gameTime:number, terrain: Terrain, particles: Particles): void
	{
		for (var iActor = this._rgActors.length; iActor--;)
		{
			const actor = this._rgActors[iActor];
			actor.Update(gameTime, terrain, particles, this);
			if (!actor.IsAlive)
			{
				particles.AddParticles(ParticleTypes.Explosion, actor.Position, new Vec3(0, 0, 0), null, null, 40 * actor.Type.Radius);
				particles.AddParticles(ParticleTypes.GroundObjectSmoke, actor.Position, new Vec3(0, 0, 0), null, null, 10);

				this.RemoveActorAt(iActor);
			}
		}
	}
	Collide(terrain: Terrain, position: Vec3, fFriendly: boolean): boolean
	{
		const iActor = this.FindActorAt(terrain, position, fFriendly);
		var result: boolean;
		if (iActor < 0)
		{
			result = false;
		}
		else
		{
			const actor = this._rgActors[iActor];
			console.assert(actor.IsAlive);
			actor.Damage();
			//if (actor.Damage())
			//	this.RemoveActorAt(iActor);
			result = true;
		}
		return result;
	}
	Draw(pos: Vec3, sizeCull: Size, sizeTerrain: Size, mxView: Mat4): void
	{
		useProgram(_programModel);

		gl.enable(gl.CULL_FACE);
		gl.frontFace(gl.CCW);

		const width = sizeTerrain.Width;
		const depth = sizeTerrain.Height;
		const minX = pos.x - (sizeCull.Width / 2) - 1;
		const maxX = minX + sizeCull.Width + 2;
		const minZ = pos.z - (sizeCull.Height / 2) - 1;
		const maxZ = minZ + sizeCull.Height + 2;
		for (var iActor = this._rgActors.length; iActor--;)
		{
			const actor = this._rgActors[iActor];
			const position = actor.Position;
			const x = Util.Wrap(position.x, minX, minX + width);
			const z = Util.Wrap(position.z, minZ, minZ + depth);
			if (x <= maxX && z <= maxZ)
			{
				const actorType = actor.Type;
				actorType.Model.Draw(mxView, new Vec3(x, position.y, z), actor.Rotation, 1);
			}
		}
	}
}