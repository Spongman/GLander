///<reference path="webgl.ts"/>
///<reference path="Math.ts"/>
///<reference path="Util.ts"/>

///<reference path="Model.ts"/>
///<reference path="Particle.ts"/>
///<reference path="Level.ts"/>
///<reference path="Terrain.ts"/>
///<reference path="Actor.ts"/>
///<reference path="ContentManager.ts"/>
//<reference path="Entity.ts"/>
//<reference path="Scores.ts"/>
///<reference path="Player.ts"/>


class Game {
	private _content = new ContentManager();

	// TODO:
	private _terrain: Terrain = null!;
	private _player: Player = null!;
	private _actors: Actors = null!;

	//private _vbTerrain: WebGLBuffer = null;
	private _mxProj: Mat4 = Mat4.I;
	private _mxView: Mat4 = Mat4.I;

	private _mxProjShadow: Mat4 = Mat4.I;
	private _mxViewShadow: Mat4 = Mat4.I;

	private _mxWorld: Mat4 = Mat4.I;
	private _sizeCull: Size = new Size(13, 13);
	//private _sizeTerrain: Size = 0;

	private _particles: Particles = new Particles();
	private _factory = new ActorFactory();
	private _levels = new GameLevels();
	/**
	private _scores: ScoreTags = null;
	private _font: SpriteFont = null;
	private _batchFont: SpriteBatch = null;
	private _keyboardPrev: KeyboardState = null;
	*/

	private _shadowRenderer: WebGLFramebuffer;
	private _shadowTexture: WebGLTexture;
	//private _shadowRenderBuffer: WebGLRenderbuffer;

	private _models = new TerrainModels();
	private _viewRot = 20;

	private _iLevel = 1;
	private _iWave = 1;

	private _shadowSize = 1024;

	constructor(canvas: HTMLCanvasElement, private _mouse: Mouse, private _keys: Keys) {

		const cVertexTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
		//console.log(cVertexTextureUnits + ' vertex texture units found');
		if (!(cVertexTextureUnits > 0))
			alert('no vertex texture units');

		const width = canvas.clientWidth;
		const height = canvas.clientHeight;

		canvas.width = width;
		canvas.height = height;

		gl.viewport(0, 0, canvas.width, canvas.height);

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		//gl.clearDepth(0.0);

		gl.disable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
		gl.frontFace(gl.CCW);

		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		gl.depthFunc(gl.LESS);

		// shadow renderbuffer/texture

		// shadow texture
		this._shadowTexture = createTexture(0, gl.LINEAR);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this._shadowSize, this._shadowSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);


		// shadow render buffer
		this._shadowRenderer = notNull(gl.createFramebuffer());
		gl.bindFramebuffer(gl.FRAMEBUFFER, this._shadowRenderer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._shadowTexture, 0);

		// shadow depth buffer
		/*
		this._shadowRenderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, this._shadowRenderBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this._shadowSize, this._shadowSize);\
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._shadowRenderBuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		*/

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	private _fPaused = false;
	private _timePaused: number = 0;
	private _timeStart: number = 0;

	Pause(fPause: boolean) {
		if (this._fPaused === fPause)
			return;

		this._fPaused = fPause;

		const timeNow = Date.now();
		if (fPause)
			this._timePaused = timeNow;
		else {
			this._timeStart -= timeNow - this._timePaused;

			const update = () => {
				if (this._fPaused)
					return;

				const timeNow = Date.now();
				const gameTime = timeNow - this._timeStart;

				this.Update(timeNow / 1000);
				this.Draw(timeNow / 1000);

				requestAnimationFrame(update);
			};

			update();
		}
	}

	Resize() {
		/// TODO: resize context
		this.UpdateViewport();
	}

	private Run() {
		this.UpdateCull();

		this._timeStart = Date.now();
		this._timePaused = Date.now();
		this._fPaused = true;

		this.Pause(false);
	}

	private initShaders() {
		return $.when(
			createProgram(
				"terrain",
				[
					"aPosition",
					"aTexture1",
					"aTexture2",
				],
				[
					"xWorldView",
					"xProj",

					"xTerrainSize",
					"xCullSize",
					"xPos",
					"xRipple",

					"xTerrainTexture",
					"xHeightTexture",
					"xShadowMapTexture",
				]
			).then((program: WebGLProgram) => {
				_programTerrain = program;
				gl.uniform1i(_programTerrain['xShadowMapTexture'], 0);
				gl.uniform1i(_programTerrain['xHeightTexture'], 1);
				gl.uniform1i(_programTerrain['xTerrainTexture'], 2);
			}),

			createProgram(
				"particles",
				[
					"aPosition",
					"aColor",
					"aTextureCoords",
					"aSize",
				],
				[
					"xWorldView",
					"xProj",
				]
			).then((program: WebGLProgram) => {
				_programParticles = program;
			}),

			createProgram(
				"model",
				[
					"aPosition",
					"aNormal",
					"aColor",
				],
				[
					"xWorldView",
					"xProj",
					"xNormal",
					"xLightDirection",
					"xAlpha",
				]
			).then((program: WebGLProgram) => {
				_programModel = program;
				gl.uniform3f(_programModel['xLightDirection'], 0, -1, -1);
				gl.uniform1f(_programModel['xAlpha'], 1);
			}),

			createProgram(
				"map",
				[
					"aPosition",
				],
				[
					//"xProj",
					//"xTerrainSize",
					"xPos",
					"xTerrainTexture",
				]
			).then((program: WebGLProgram) => {
				_programMap = program;
				gl.uniform1i(_programMap['xTerrainTexture'], 0);
			})
		);
	}

	private Initialize() {
		return this.initShaders().then(() => {
			//console.log('Game.Initialize');

			this.UpdateViewport();

			/**
			this._content.LoadFont("assets/Arial", font => { this._font = font; });
			this._scores = new ScoreTags(this._graphics.WebGLRenderingContext, this._font);
			*/

			this.StartWave(0, 0);
		});
	}

	private StartWave(iLevel: number, iWave: number) {
		const level = this._levels.Levels[iLevel];

		level.LoadTerrain(this._models).done(terrain => {
			this._terrain = terrain;
			const wave = level.Waves[iWave];

			this._player = new Player(terrain, this._factory.GetActorType(ActorTypes.Hoverplane), this._mouse, this._keys);

			this._actors = new Actors(this._factory);
			this._actors.AddActor(this._player);
			this._actors.AddActors(wave.GetActors(this._terrain, this._factory));

			this.Run();
		});
	}

	private LoadContent() {
		/**
		this._batchFont = new SpriteBatch(this._graphics.WebGLRenderingContext);
		this._targetShadow = new RenderTarget2D(this._graphics.WebGLRenderingContext, this._shadowSize, this._shadowSize, false, 0, 0);
		*/
		this.UpdateCull();
	}

	private UpdateViewport() {
		const canvas = gl.canvas;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;

		canvas.width = width;
		canvas.height = height;

		gl.viewport(0, 0, width, height);

		this._mxProj = Mat4.createPerspective(Util.ToRadians(37), (width / height), 1, 1000);

		//this._mxProjMap = Mat4.createOrthographic2(100, 100, 200, 200, 1, 1000);
	}

	public setFov(fov: number) {
		const canvas = gl.canvas;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		this._mxProj = Mat4.createPerspective(Util.ToRadians(fov), (width / height), 1, 1000);
	}

	private SetProjection(mxProj: Mat4) {
		const elements = mxProj.flatten();

		useProgram(_programParticles)
		gl.uniformMatrix4fv(_programParticles["xProj"], false, elements);

		useProgram(_programTerrain)
		gl.uniformMatrix4fv(_programTerrain["xProj"], false, elements);

		useProgram(_programModel)
		gl.uniformMatrix4fv(_programModel["xProj"], false, elements);
	}

	_probRain: number = 0;
	_probStars: number = 0;

	private UpdateCull() {
		this._probRain = Math.sqrt(this._sizeCull.Width * this._sizeCull.Height) / 4;
		this._probStars = Math.sqrt(this._sizeCull.Width * this._sizeCull.Height) / 10;

		if (this._terrain)
			this._terrain.UpdateCull(this._sizeCull);

		/**
		const models: Model[] = (<BaseModel[]>this._factory.Types).concat(<BaseModel[]>this._terrain.Models.Models);
		for (let iModel = 0; iModel < models.length; ++iModel)
		{
			const model = models[iModel];
			const effects = model.Effects;
			for (let iEffect = 0; iEffect < effects.length; ++iEffect)
			{
				const effect = effects[iEffect];
				effect.FogStart = (2 * this._sizeCull.Height / 3 + 5);
				effect.FogEnd = (this._sizeCull.Height + 5);
				effect.Projection = this._mxProj;
			}
		}*/

		this._mxProjShadow = Mat4.createOrthographic(this._sizeCull.Width, this._sizeCull.Height, 1, 100);
	}

	private Update(gameTime: number) {
		const pp = this._player.Position.add(this._player.Velocity);
		this._player.Position = pp;

		$("#playerPos").text(Math.round(pp.x, 2) + ", " + Math.round(pp.y, 2) + ", " + Math.round(pp.z, 2));


		/**
		if (GamePad.GetState(0).Buttons.Back === 1)
			super.Exit();
		const state = Keyboard.GetState();
		if (state.IsKeyDown(121) && !this._keyboardPrev.IsKeyDown(121))
		{
			this._sizeCull.Width += 2;
			this._sizeCull.Height += 2;
			this.UpdateCull();
		}
		else
		{
			if (state.IsKeyDown(120) && !this._keyboardPrev.IsKeyDown(120))
			{
				if (this._sizeCull.Height > 5)
				{
					this._sizeCull.Width -= 2;
					this._sizeCull.Height -= 2;
					this.UpdateCull();
				}
			}
		}
		if (state.IsKeyDown(65) && !this._keyboardPrev.IsKeyDown(65))
			++this._viewRot;
		if (state.IsKeyDown(90) && !this._keyboardPrev.IsKeyDown(90))
			--this._viewRot;
		this._keyboardPrev = state;
		*/
		const position = this._player.Position;
		const velocity = this._player.Velocity;
		if (position.y + velocity.y * 30 > 60) {
			for (let probStars = Util.Rand(this._probStars); probStars > 0; --probStars) {
				if (probStars < 1 && probStars < Math.random())
					break;
				const pt = (position.y < 150) ? ParticleTypes.Star : ParticleTypes.TooHigh;
				const position2 = new Vec3(position.x + velocity.x * 30 + Util.Rand(-0.5, 0.5) * this._sizeCull.Width, position.y + velocity.y * 20 + Util.Rand(-0.5, 0.5) * this._sizeCull.Width, position.z + velocity.z * 30 + Util.Rand(-0.5, 0.5) * this._sizeCull.Height);
				this._particles.AddParticles(pt, position2);
			}
		}
		else if (position.y + velocity.y * 30 < 35) {
			const weather = (1 - Math.cos(gameTime / 20)) / 2;
			for (let probRain = Util.Rand(this._probRain * weather); probRain > 0; --probRain) {
				if (probRain < 1 && probRain < Math.random())
					break;
				const position3 = new Vec3(position.x + velocity.x * 30 + Util.Rand(-0.5, 0.5) * this._sizeCull.Width, position.y + Util.Rand(10, 25), position.z + velocity.z * 30 + Util.Rand(-0.5, 0.5) * this._sizeCull.Height);
				this._particles.AddParticles(ParticleTypes.Rain, position3, null, Vec3.Down.scale(0.2));
			}
		}

		this._particles.Update(this._terrain, this._actors);
		this._actors.Update(gameTime, this._terrain, this._particles);

		/*
		this._scores.Update(this._terrain, this._actors);
		*/

		const models = this._terrain.Models;

		const modelRadar = models.GetModel(TerrainEntityTypes.Radar);
		const rotateRadar = gameTime % Util.TwoPI;
		modelRadar.Model.Meshes[1].Transformation = Mat4.createTranslation(new Vec3(0, .6, 0)).mul(Mat4.createRotationY(-rotateRadar));

		const modelMill = models.GetModel(TerrainEntityTypes.Mill);
		const rotateMill = gameTime * 2.5 % Util.TwoPI;
		modelMill.Model.Meshes[1].Transformation = Mat4.createTranslation(new Vec3(0, 1.4, 0)).mul(Mat4.createRotationZ(-rotateMill));
	}


	/*
	public zOffsetCamera = 7;
	public yOffsetCamera = 1.86;
	public yOffsetView = 3.18;
	*/

	public zOffsetCamera = 12.57;
	public yOffsetCamera = 2.24;
	public yOffsetView = 3.61;

	private Draw(gameTime: number) {
		const width = this._terrain.Size.Width;
		const depth = this._terrain.Size.Height;
		const position = this._player.Position;
		const minX = position.x - (this._sizeCull.Width / 2) - 1;
		const maxX = minX + this._sizeCull.Width + 2;
		const minZ = position.z - (this._sizeCull.Height / 2) - 1;
		const maxZ = minZ + this._sizeCull.Height + 2;

		const px = Math.floor(position.x);
		const pz = Math.floor(position.z);
		//this._mxWorld = Mat4.createTranslation(new Vec3(px, 0, pz));
		this._mxWorld = Mat4.I;



		const shadow = true;
		if (shadow) {
			this.SetProjection(this._mxProjShadow);
			const mxViewShadow = Mat4.createLookAt(new Vec3(position.x, 100, position.z), new Vec3(position.x, 0, position.z), Vec3.Forward);

			gl.bindFramebuffer(gl.FRAMEBUFFER, this._shadowRenderer);

			gl.viewport(0, 0, this._shadowSize, this._shadowSize);
			gl.clearColor(1, 1, 1, 0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.disable(gl.DEPTH_TEST);
			gl.depthMask(false);

			//this._terrain.Draw(position, gameTime, this._sizeCull, this._mxWorld, mxViewShadow);
			this._terrain.DrawModels(this._sizeCull, mxViewShadow, gameTime, position);
			this._actors.Draw(position, this._sizeCull, this._terrain.Size, mxViewShadow);
			this._particles.Draw(position, this._sizeCull, this._terrain.Size, mxViewShadow);

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}


		this.SetProjection(this._mxProj);

		const viewY = Util.Limit(position.y - 3, this.yOffsetView, 2000);
		const cameraY = viewY + this.yOffsetCamera;
		const cameraMinY = this._terrain.HeightAtExact(position.x, position.z + this._sizeCull.Height / 2) + 5;
		const cameraPos = new Vec3(position.x, Math.max(cameraY, cameraMinY), position.z + this._sizeCull.Height / 2 + this.zOffsetCamera);
		const viewPos = new Vec3(position.x, viewY, position.z);
		const mxView = Mat4.createLookAt(cameraPos, viewPos, Vec3.Up);

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);

		useProgram(_programTerrain);
		bindTexture(0, this._shadowTexture);

		this._terrain.Draw(position, gameTime, this._sizeCull, this._mxWorld, mxView);
		bindTexture(0, null);

		this._terrain.DrawModels(this._sizeCull, mxView, gameTime, position);

		const sizeCullExtra = new Size(this._sizeCull.Width + 6, this._sizeCull.Height + 6);
		this._actors.Draw(position, sizeCullExtra, this._terrain.Size, mxView);
		this._particles.Draw(position, sizeCullExtra, this._terrain.Size, mxView);


		const rgMapBackup: any[] = [];
		for (let iActor = this._actors.ActorList.length; iActor--;) {
			const actor = this._actors.ActorList[iActor];
			const actorType = actor.Type;
			const actorPos = actor.Position;
			rgMapBackup.push({
				pos: actorPos,
				color: this._terrain.GetMapColor(actorPos.x, actorPos.z)
			});
			this._terrain.SetMapColor(actorPos.x, actorPos.z, actorType.MapColor);
		}

		this._terrain.DrawMap(position);

		for (let iBackup = rgMapBackup.length; iBackup--;) {
			const backup = rgMapBackup[iBackup];
			this._terrain.SetMapColor(backup.pos.x, backup.pos.z, backup.color);
		}

		/**
		const spriteBatch = new SpriteBatch(gl);
		spriteBatch.Begin(1, BlendState.Opaque);
		this._terrain.DrawMap(spriteBatch, this._player.Position);
		spriteBatch.End();
		*/

		//bindTexture(2, null);
	}
}
