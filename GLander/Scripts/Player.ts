///<reference path="Math.ts"/>
///<reference path="Util.ts"/>
///<reference path="Entity.ts"/>
///<reference path="Terrain.ts"/>
///<reference path="Actor.ts"/>

class Mouse
{
	Offset = new Vec2(0, 0);
	private _rgPressed = new Array<boolean>(4);

	Move(dx:number, dy:number)
	{
		this.Offset.x += dx;
		this.Offset.y += dy;
	}
	Reset()
	{
		//console.log('Mouse.Reset');
		this.Offset = new Vec2(0, 0);
		this._rgPressed = new Array<boolean>(4);
	}
	Button(which: number, pressed: boolean)
	{
		this._rgPressed[which] = pressed;
	}
	IsPressed(which: number): boolean
	{
		return this._rgPressed[which];
	}
}

class Keys
{
	_rgKeys = new Array<boolean>();
	keyDown(key: number)
	{
		this._rgKeys[key] = true;
	}
	keyUp(key: number)
	{
		this._rgKeys[key] = false;
	}
	reset()
	{
		this._rgKeys = new Array<boolean>();
	}

	isPressed(key: number)
	{
		return this._rgKeys[key] === true;
	}
}

class Player extends Actor
{
	private static cx = 400;
	private static cz = 400;
	constructor(terrain: Terrain, actorType: ActorType, private _mouse:Mouse, private _keys:Keys)
	{
		super(terrain, actorType);
		this._position = new Vec3(128, 2.9, 128);

		//this._position.x = 211;
		//this._position.z = 6;

		this._mouse.Reset();
	}
	Update(gameTime: number, terrain: Terrain, particles: Particles, actors: Actors): void
	{
		const mouse = this._mouse;

		const state = mouse.Offset;

		/*
		const dx = state.x;
		const dy = state.y;

		const yaw = Math.atan2(-dy, dx) + Math.PI / 2;

		const r = 200;

		const d = Math.sqrt(dx * dx + dy * dy);
		if (d > r)
		{
			dx = dx * r / d;
			dy = dy * r / d;
			d = r;

			mouse.Offset.x = dx;
			mouse.Offset.y = dy;
		}

		const pitch = (d / r) * Math.PI;
		//const pitch = 0;
		$("#playerAtt").text(Math.round(dx, 2) + ", " + Math.round(dy, 2) + ", " + Math.round(yaw, 2));
		*/



		/*
		const mx = state.x - 200;
		const my = state.y - 200;
		const md = Math.sqrt(mx * mx + my * my);
		if (md > 300)
		{
			mx = ((mx * 300) / md);
			my = ((my * 300) / md);
			md = 300;
			state.x = mx + 200;
			state.y = my + 200;
			//mouse.Reset();
		}
		if (md < 20)
			this._pitch = 0;
		else
			this._pitch = -(md - 20) * Math.PI / 280;
		this._yaw = Math.atan2(my, mx);
		*/

		//$("#playerAtt").text(Math.round(state.x, 2) + ", " + Math.round(state.y, 2));
		
		state.y = Util.Limit(state.y, -Math.PI * 100, 0);
		const pitch = -state.y / 100;
		const yaw = -state.x / 100;

		//$("#playerAtt").text(Math.round(pitch, 2) + ", " + Math.round(yaw, 2));


		/*
		//this._yaw = Math.PI / 4;
		//this._pitch = -Math.PI / 4;

		this._rotation = Mat4.createRotationY(this._yaw).mul(Mat4.createRotationX(this._pitch));
		this._velocity = this._velocity.scale(this.Type.Momentum);
		*/

		const fThrust = mouse.IsPressed(1);
		const fFire = mouse.IsPressed(3);
		const fLaunch = this._keys.isPressed(32);

		const dPitch = pitch - this._pitch;
		const dYaw = yaw - this._yaw;

		//$("#playerAtt").text(Math.round(dPitch, 2) + ", " + Math.round(dYaw, 2));


		/*
		if (this.Type.EngineType === EngineTypes.Engine0)
			this._velocity.y = this._velocity.y - 0.003;
		this._position = terrain.Wrap(this._position.add(this._velocity));
		const height = terrain.HeightAtExact(this._position.x, this._position.z);
		if (this._position.y < height)
		{
			this._position.y = height;
			this._velocity.y = -this._velocity.y * 0.5;
		}
		if (flag)
			particles.AddParticles(ParticleTypes.Thrust, this._position, new Vec3(0, -0.5, 0), this._velocity, this.Rotation, 3);

		if (mouse.IsPressed(3))
			particles.AddParticles(ParticleTypes.Bullet, this._position, new Vec3(0, 0, 0.25), this._velocity, this.Rotation, 1, CollidesWith.Enemy);
		*/

		this.InnerUpdate(
			terrain, particles, actors, gameTime,
			fFire, fThrust, fLaunch,
			-dPitch, dYaw
			);

		//this.Position.y = 10;
	}
}