var _programTerrain: WebGLProgram;
var _programMap: WebGLProgram;


const enum TerrainTypes
{
	Sea,
	Beach,
	Land,
	LandingPad,
	AlienBuilding
}

enum TerrainEntityTypes
{
	None,	// 0
	Bush,	// 1
	Tree1,	// 2
	Tree2,	// 3
	Tree3,	// 4
	House1,	// 5
	House2,	// 6
	House3,	// 7
	Radar,	// 8
	Mill,	// 9
	Rocket,	// 10
	Crate	// 11
}

const enum EntityStatus
{
	Normal,
	Infected,
	Destroyed,
};

class TerrainEntity
{
	public Status: EntityStatus = EntityStatus.Normal;

	private _mxTransform: Mat4 = null;
	get Transform(): Mat4
	{
		return this._mxTransform;
	}
	constructor(public Type: TerrainEntityTypes, public Model: TerrainModel, yaw: number)
	{
		this._mxTransform = Mat4.createRotationY(yaw);
	}
}

class TerrainSquare
{
	private _fInfected = false;
	constructor(public Type: TerrainTypes, public Height: number, public Color: Color, public Entity: TerrainEntity)
	{
		if (this.Height < 0)
			this.Height = 0;

		if (this.Type === TerrainTypes.Sea)
			this._fInfected = true;
	}
	RemoveEntity(): void
	{
		this.Entity = null;
	}
	Infect(): boolean
	{
		if (this._fInfected)
			return false;

		if (this.Entity)
		{
			if (this.Entity.Status === EntityStatus.Normal)
				this.Entity.Status = EntityStatus.Infected;
		}

		this._fInfected = true;
		if (this.Type !== TerrainTypes.Sea)
			this.Color = new Color((this.Color.R + 250) * 0.4, (this.Color.G + 50) * 0.4, (this.Color.B + 100) * 0.4);
		return true;
	}
}

class TerrainModel extends BaseModel
{
	//private _rgModels: Model[];

	public Height: number;
	constructor(type: TerrainEntityTypes)
	{
		super(TerrainEntityTypes[type]);

		var zMax = Number.MIN_VALUE;
		/*
		for (var iMesh = 0; iMesh < model.Meshes.length; ++iMesh)
		{
			const current = model.Meshes[iMesh];
			const boundingSphere = current.BoundingSphere;
			const z = boundingSphere.Center.y + boundingSphere.Radius;
			if (zMax < z)
				zMax = z;
		}
		*/
		zMax = this.Model.Meshes[0].BoundingSphere.Center.y + this.Model.Meshes[0].BoundingSphere.Radius;
		this.Height = zMax;// + 0.5;

		//this._rgModels = [
	}
}

class TerrainModels
{
	private _rgModels: TerrainModel[];
	get Models(): TerrainModel[]
	{
		const rgModels = new Array<TerrainModel>();
		for (var iModel = this._rgModels.length; iModel--;)
		{
			const model = this._rgModels[iModel];
			if (model)
				rgModels.push(model);
		}
		return rgModels;
	}
	constructor()
	{
		var nMaxValue = Number.MIN_VALUE;
		for (var val in TerrainEntityTypes)
		{
			if (isNaN(val))
				continue;
			if (nMaxValue < val)
				nMaxValue = val;
		}

		this._rgModels = new Array<TerrainModel>(nMaxValue + 1);

		for (var val in TerrainEntityTypes)
		{
			if (isNaN(val) || val <= 0)
				continue;

			const name = TerrainEntityTypes[val];
			if (name)
				this._rgModels[val] = new TerrainModel(val);
		}
	}
	GetModel(model: TerrainEntityTypes): TerrainModel
	{
		console.assert(!!this._rgModels[model]);
		return this._rgModels[model];
	}
}

class Terrain
{
	static MaxHeight = 150;
	private _width = 0;
	private _depth = 0;
	private _rgSquares: TerrainSquare[];
	private _fTerrainDirty = true;
	private _rgPixelsTerrain: Uint8Array;
	private _texTerrain: WebGLTexture;
	private _texHeights: WebGLTexture;

	private _ibTerrain: WebGLBuffer;

	private _vbPosition: WebGLBuffer;
	private _vbTexture1: WebGLBuffer;
	private _vbTexture2: WebGLBuffer;

	private _vbMapPosition: WebGLBuffer;

	Size: Size;

	get HeightTexture(): WebGLTexture
	{
		return this._texHeights;
	}
	constructor(imageData: ImageData, public Models: TerrainModels)
	{
		useProgram(_programTerrain);

		const width = this._width = imageData.width;
		const depth = this._depth = imageData.height;

		this.Size = new Size(width, depth);

		this._rgSquares = new Array<TerrainSquare>(width * depth);

		this._texTerrain = createTexture(2);
		this._rgPixelsTerrain = new Uint8Array(width * depth * 4);

		const rgHeights = new Uint8Array(width * depth);

		for (var x = width; x--;)
		{
			const x2 = Util.Wrap(x + 1, width);

			for (var z = depth; z--;)
			{
				const z2 = Util.Wrap(z + 1, depth);

				const color = Color.FromArray(<any>(imageData.data), 4 * (x + z * width));
				const y = color.G;

				rgHeights[x + z * width] = y;

				const colorAdjacent = Color.FromArray(<any>(imageData.data), 4 * (x2 + z2 * width));
				const yAdjacent = colorAdjacent.G;
				const yCenter = (y + yAdjacent) / 2;

				const terrainType = Math.floor((color.B + 20) / 50);
				var terrainColor = Color.BlueViolet;
				switch (terrainType)
				{
					case TerrainTypes.Sea:
						//terrainColor = new Color(Util.Rand(60, 100), Util.Rand(60, 100), Util.Rand(150 + yCenter, 190 + yCenter));
						terrainColor = new Color(32, 32, Util.Rand(150 + yCenter, 190 + yCenter));
						break;
					case TerrainTypes.Beach:
						terrainColor = new Color(yCenter * 10 + 60, yCenter * 10 + 60, Util.Rand(200 - yCenter * 10, 240 - yCenter * 10));
						break;
					case TerrainTypes.Land:
						terrainColor = new Color(Util.Rand(yCenter, yCenter + 60), Util.Rand(60 + yCenter, 120 + yCenter), Util.Rand(yCenter, yCenter + 60));
						break;
					case TerrainTypes.LandingPad:
						var b: number;
						if ((z > 125 && z < 131 && (x === 125 || x === 129)) || (x > 125 && x < 129 && z === 128))
							b = 255;
						else
							b = Util.Rand(100, 200);
						terrainColor = new Color(b, b, b);
						break;
					case TerrainTypes.AlienBuilding:
						terrainColor = new Color(Math.min(yCenter + 128, 250),Math.min(yCenter + Util.Rand(32, 128), 250),Math.min(yCenter + 128, 250));
						break;
				}

				var entity: TerrainEntity = null;
				const terrainEntityTypes = Math.floor((color.R + TerrainEntityTypes.Rocket) / 20);
				if (terrainEntityTypes !== TerrainEntityTypes.None)
				{
					const model = this.Models.GetModel(terrainEntityTypes);
					const yaw = (terrainEntityTypes === TerrainEntityTypes.Rocket) ? 0 : Util.Rand(Util.TwoPI);
					entity = new TerrainEntity(terrainEntityTypes, model, yaw);
				}
				const terrainSquare = new TerrainSquare(terrainType, y * 1.5 / 20, terrainColor, entity);
				this._rgSquares[x + z * width] = terrainSquare;

				this.SetMapColor(x, z, terrainSquare.Color);

				this._rgPixelsTerrain[4 * (x + z * this._width) + 3] = 255;
			}
		}

		this._texHeights = createTexture(1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, width, depth, 0, gl.ALPHA, gl.UNSIGNED_BYTE, <ArrayBufferView>rgHeights);

		useProgram(_programMap);
		const rgFMapPositions = new Float32Array([
			0, 0,
			0, 1,
			1, 0,
			1, 1,
		]);

		this._vbMapPosition = createBuffer(rgFMapPositions, 2);
	}

	UpdateCull(sizeCull: Size): void
	{
		useProgram(_programTerrain);

		const cxCull = sizeCull.Width;
		const czCull = sizeCull.Height;

		const cVerticesTerrain = cxCull * czCull * 4;

		const rgfPosition = new Float32Array(cVerticesTerrain * 2);
		const rgfTexture1 = new Float32Array(cVerticesTerrain * 2);
		const rgfTexture2 = new Float32Array(cVerticesTerrain * 2);

		var iQuad = 0;
		for (var oz = 0; oz < czCull; ++oz)
		{
			const z = oz - Math.floor(czCull / 2);
			const v1 = (z + 0.5);// / this._depth;
			const v2 = (z + 1.5);// / this._depth;
			for (var ox = 0; ox < cxCull; ++ox)
			{
				const x = ox - Math.floor(cxCull / 2);
				const u1 = (x + 0.5);// / this._width;
				const u2 = (x + 1.5);// / this._width;

				new Vec2(x - 0, z - 0).writeTo(rgfPosition, iQuad * 4 + 0); 
				new Vec2(x - 0, z + 1).writeTo(rgfPosition, iQuad * 4 + 1); 
				new Vec2(x + 1, z - 0).writeTo(rgfPosition, iQuad * 4 + 2); 
				new Vec2(x + 1, z + 1).writeTo(rgfPosition, iQuad * 4 + 3); 
				
				new Vec2(u1, v1).writeTo(rgfTexture1, iQuad * 4 + 0);
				new Vec2(u1, v2).writeTo(rgfTexture1, iQuad * 4 + 1);
				new Vec2(u2, v1).writeTo(rgfTexture1, iQuad * 4 + 2);
				new Vec2(u2, v2).writeTo(rgfTexture1, iQuad * 4 + 3);

				new Vec2(u1, v1).writeTo(rgfTexture2, iQuad * 4 + 0);
				new Vec2(u1, v1).writeTo(rgfTexture2, iQuad * 4 + 1);
				new Vec2(u1, v1).writeTo(rgfTexture2, iQuad * 4 + 2);
				new Vec2(u1, v1).writeTo(rgfTexture2, iQuad * 4 + 3);

				++iQuad;
			}
		}

		if (this._vbPosition)
			gl.deleteBuffer(this._vbPosition);
		if (this._vbTexture1)
			gl.deleteBuffer(this._vbTexture1);
		if (this._vbTexture2)
			gl.deleteBuffer(this._vbTexture2);

		this._vbPosition = createBuffer(rgfPosition, 2);
		this._vbTexture1 = createBuffer(rgfTexture1, 2);
		this._vbTexture2 = createBuffer(rgfTexture2, 2);


		const rgIndices = new Uint16Array(cxCull * czCull * 6);
		var iIndex2 = 0;
		for (var x = 0; x < cxCull; ++x)
		{
			for (var z = 0; z < czCull; ++z)
			{
				const iVertex = (x + z * cxCull) * 4;
				rgIndices[iIndex2++] = iVertex;
				rgIndices[iIndex2++] = (iVertex + 2);
				rgIndices[iIndex2++] = (iVertex + 1);
				rgIndices[iIndex2++] = (iVertex + 1);
				rgIndices[iIndex2++] = (iVertex + 2);
				rgIndices[iIndex2++] = (iVertex + 3);
			}
		}

		if (this._ibTerrain)
			gl.deleteBuffer(this._ibTerrain);
		this._ibTerrain = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibTerrain);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rgIndices, gl.STATIC_DRAW);

		gl.uniform2f(_programTerrain["xTerrainSize"], this._width, this._depth);
		gl.uniform2f(_programTerrain["xCullSize"], cxCull, czCull);
	}

	DrawMap(position: Vec3): void
	{
		useProgram(_programMap);

		gl.disable(gl.DEPTH_TEST);
		gl.depthMask(false);

		gl.disable(gl.CULL_FACE);
		gl.disable(gl.BLEND);

		gl.viewport(0, gl.canvas.height - 128, 128, 128);

		loadAttribBuffer(_programMap["aPosition"], this._vbMapPosition);

		bindTexture(0, this.GetTerrainTexture());
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this._width, this._depth, 0, gl.RGBA, gl.UNSIGNED_BYTE, <ArrayBufferView>this._rgPixelsTerrain);

		//gl.uniform2f(_programMap["xTerrainSize"], this._width, this._depth);
		gl.uniform2f(_programMap["xPos"], position.x / this._width, position.z / this._depth);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	}

	Draw(position: Vec3, gameTime: number, sizeCull: Size, matWorld: Mat4, matView: Mat4): void
	{
		useProgram(_programTerrain);

		const cxCull = sizeCull.Width;
		const czCull = sizeCull.Height;

		gl.disable(gl.CULL_FACE);
		//gl.enable(gl.CULL_FACE);
		//gl.frontFace(gl.CW);
		gl.disable(gl.BLEND);

		loadAttribBuffer(_programTerrain["aPosition"], this._vbPosition);
		loadAttribBuffer(_programTerrain["aTexture1"], this._vbTexture1);
		loadAttribBuffer(_programTerrain["aTexture2"], this._vbTexture2);

		const matWorldView = matWorld.mul(matView);
		gl.uniformMatrix4fv(_programTerrain["xWorldView"], false, matWorldView.flatten());

		bindTexture(2, this.GetTerrainTexture());
		bindTexture(1, this._texHeights);
		//bindTexture(2, this._targetShadow);

		gl.uniform2f(_programTerrain["xPos"], position.x, position.z);
		gl.uniform2f(_programTerrain["xTerrainSize"], this._width, this._depth);

		const ripple = gameTime * 1 % (Util.TwoPI);
		gl.uniform1f(_programTerrain["xRipple"], ripple);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibTerrain);
		gl.drawElements(gl.TRIANGLES, cxCull * czCull * 6, gl.UNSIGNED_SHORT, 0);

		gl.disableVertexAttribArray(_programTerrain["aPosition"]);
		gl.disableVertexAttribArray(_programTerrain["aTexture1"]);
		gl.disableVertexAttribArray(_programTerrain["aTexture2"]);

		//bindTexture(2, null);
		//bindTexture(1, null);
	}


	DrawModels(sizeCull: Size, mxView: Mat4, gameTime: number, pos: Vec3): void
	{
		useProgram(_programModel);

		gl.enable(gl.CULL_FACE);
		gl.frontFace(gl.CCW);

		gl.enable(gl.BLEND);

		const px = Math.floor(pos.x);
		const pz = Math.floor(pos.z);
		const dx = pos.x - px;
		const dz = pos.z - pz;
		for (var ox = sizeCull.Width + 1; ox--;)
		{
			const x = px + ox - Math.floor(sizeCull.Width / 2);
			for (var oz = sizeCull.Height + 1; oz--;)
			{
				const z = pz + oz - Math.floor(sizeCull.Height / 2);
				const terrainSquare = this.SquareAt(x, z);
				const entity = terrainSquare.Entity;
				if (!entity)
					continue;

				if (entity.Status === EntityStatus.Destroyed)
					continue;	// TODO: render destroyed state

				var alpha = 1;
				if (ox === 0)
					alpha = 1 - dx;
				else if (ox === sizeCull.Width)
					alpha = dx;

				if (oz === 0)
					alpha *= (1 - dz);
				else if (oz === sizeCull.Height)
					alpha *= dz;

				var matrix = entity.Transform;
				const terrainEntityType = entity.Type;
				switch (terrainEntityType)
				{
					case TerrainEntityTypes.Bush:
					case TerrainEntityTypes.Tree1:
					case TerrainEntityTypes.Tree2:
					case TerrainEntityTypes.Tree3:
						const rotateTree = gameTime * 2.0 % Util.TwoPI;
						const angleTree = Math.sin(rotateTree + x + z) * 5.0 * Util.TwoPI / 360.0;
						matrix = matrix.mul(Mat4.createRotationX(angleTree));
						break;
					case TerrainEntityTypes.Crate:
						const rotateCrate = gameTime % Util.TwoPI;
						matrix = matrix.mul(Mat4.createRotationY(rotateCrate));
						break;
				}
				const pos2 = new Vec3(x, terrainSquare.Height, z);
				const model = entity.Model;
				model.Draw(mxView, pos2, matrix, alpha);
			}
		}
	}


	SetMapColor(x: number, z: number, color: Color): void
	{
		x = Math.floor(x);
		z = Math.floor(z);

		var ip = 4 * (x + z * this._width);
		this._rgPixelsTerrain[ip++] = color.R;
		this._rgPixelsTerrain[ip++] = color.G;
		this._rgPixelsTerrain[ip++] = color.B;
		//this._rgPixelsTerrain[ip++] = color.A;

		this._fTerrainDirty = true;
	}

	GetMapColor(x: number, z: number): Color
	{
		x = Math.floor(x);
		z = Math.floor(z);

		var ip = 4 * (x + z * this._width);
		return new Color(
			this._rgPixelsTerrain[ip++],
			this._rgPixelsTerrain[ip++],
			this._rgPixelsTerrain[ip++]
		);
	}

	GetTerrainTexture(): WebGLTexture
	{
		if (this._fTerrainDirty)
		{
			bindTexture(2, this._texTerrain);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this._width, this._depth, 0, gl.RGBA, gl.UNSIGNED_BYTE, <ArrayBufferView>this._rgPixelsTerrain);
			this._fTerrainDirty = false;
		}
		return this._texTerrain;
	}
	/*
	DrawMap(batch: SpriteBatch, pos: Vec3): void
	{
		const mapTexture = this.GetTerrainTexture();
		const gl = batch.WebGLRenderingContext;
		const samplerState = gl.SamplerStates[0];
		gl.SamplerStates[0] = this._state;
		batch.Draw(mapTexture, new Rectangle(0, 0, gl.Viewport.Height / 4, gl.Viewport.Height / 4), new Rectangle(Math.round((pos.x + (this._width / 2))), Math.round((pos.z + (this._depth / 2))), this._width, this._depth), Color.White, 0, Vec2.Zero, 0, 0);
		gl.SamplerStates[0] = samplerState;
	}
	*/
	Infect(x: number, z: number, range?: number): void
	{
		if (typeof (range) === 'undefined')
		{
			if (Math.random() < .5)
				return;
			x = Util.Wrap(x, this._width);
			z = Util.Wrap(z, this._depth);
			const terrainSquare = this.SquareAt(x, z);
			if (terrainSquare.Infect())
				this.SetMapColor(x, z, terrainSquare.Color);
		}
		else
		{
			for (var ox = x - range; ox <= x + range; ++ox)
				for (var oz = z - range; oz <= z + range; ++oz)
					this.Infect(ox, oz);
		}
	}

	HideRadar(x: number, z: number): void
	{
		x = Math.floor(x);
		z = Math.floor(z);

		for (var dx = -15; dx <= 15; ++dx)
		{
			const wx = Util.Wrap(x + dx, this._width);
			for (var dz = -15; dz <= 15; ++dz)
			{
				const wz = Util.Wrap(z + dz, this._depth);

				this._rgPixelsTerrain[4 * (wx + wz * this._width) + 3] = 0;
			}
		}
	}

	SquareAt(x: number, z: number): TerrainSquare
	{
		x = Util.Wrap(Math.floor(x), this._width);
		z = Util.Wrap(Math.floor(z), this._depth);
		return this._rgSquares[x + z * this._width];
	}

	HeightAt(x: any, z: any): number
	{
		return this.SquareAt(x, z).Height;
	}

	HeightAtExact(x: number, z: number): number
	{
		const x1 = Math.floor(x);
		const z1 = Math.floor(z);
		const dx = x - x1;
		const dz = z - z1;
		const y1 = this.HeightAt(x1, z1);
		const x2 = x1 + 1;
		const z2 = z1 + 1;
		const y2 = this.HeightAt(x2, z2);

		if (dx > dz)
		{
			const height = this.HeightAt(x2, z1);
			return Math.barycentric(height, y1, y2, 1 - dx, dz);
		}
		else
		{
			const height = this.HeightAt(x1, z2);
			return Math.barycentric(height, y1, y2, 1 - dz, dx);
		}
	}

	Wrap(position: Vec3): Vec3
	{
		return new Vec3(Util.Wrap(position.x, this._width), position.y, Util.Wrap(position.z, this._depth));
	}
	Distance2(pos1: Vec3, pos2: Vec3): number
	{
		var dx = pos1.x - pos2.x;
		var dy = pos1.y - pos2.y;
		var dz = pos1.z - pos2.z;

		if (dx < 0)
			dx = -dx;
		if (dx > (this._width / 2))
			dx = this._width - dx;

		if (dz < 0)
			dz = -dz;
		if (dz > (this._depth / 2))
			dz = this._depth - dz;

		return dx * dx + dy * dy + dz * dz;
	}

	Collide(pos: Vec3, radius:number = 0): boolean
	{
		const terrainSquare = this.SquareAt(pos.x + .5, pos.z + .5);	// offset because entities are aligned with corner, not center of square
		const entity = terrainSquare.Entity;
		if (entity && entity.Model && entity.Status !== EntityStatus.Destroyed)
		{
			const groundHeight = terrainSquare.Height;
			const entityHeight = entity.Model.Height;
			if (pos.y - radius < groundHeight + entityHeight)
			{
				if (entity.Type === TerrainEntityTypes.Radar)
					this.HideRadar(pos.x, pos.z);

				// TODO: render destroyed entities
				entity.Status = EntityStatus.Destroyed;

				return true;
			}
		}

		return false;
	}
}