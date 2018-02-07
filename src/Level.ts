///<reference path="Math.ts"/>
///<reference path="Actor.ts"/>
///<reference path="Model.ts"/>
///<reference path="Terrain.ts"/>
///<reference path="ContentManager.ts"/>

class Wave {
	constructor(private _rgcActors: number[]) {
	}
	GetActors(terrain: Terrain, factory: ActorFactory): Actor[] {
		const rgActors = new Array<Actor>();
		for (let iActorType = this._rgcActors.length; iActorType--;) {
			const actorType = <ActorTypes>iActorType;
			const cActors = this._rgcActors[iActorType];
			for (let iActor = cActors; iActor--;)
				rgActors.push(factory.CreateActor(terrain, actorType));
		}
		return rgActors;
	}
}

class Level {
	get Waves(): Wave[] {
		return this._rgWaves;
	}
	get Name(): string {
		return this._strMapName;
	}
	constructor(private _strMapName: string, private _rgWaves: Wave[]) {
	}
	LoadTerrain(models: TerrainModels) {
		return Util.LoadImageData(`assets/maps/${this._strMapName}.png`).then(imageData => {
			return new Terrain(imageData, models);
		});
	}
}

class GameLevels {
	Levels: Level[] = [
		new Level("Level1", [
			//new Wave([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
			//new Wave([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
			//new Wave([0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
			new Wave([1, 2, 0, 10, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
			new Wave([1, 3, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
			new Wave([1, 4, 2, 3, 2, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
			new Wave([1, 5, 2, 4, 2, 2, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0])
		]),

		new Level("Level2", [
			new Wave([1, 5, 3, 5, 3, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
			new Wave([1, 7, 3, 6, 3, 3, 2, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 1, 0]),
			new Wave([1, 8, 4, 5, 4, 3, 3, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 1, 0]),
			new Wave([1, 9, 4, 4, 4, 4, 3, 2, 2, 3, 2, 0, 0, 0, 0, 0, 0, 1, 0])
		]),

		new Level("Level3", [
			new Wave([1, 8, 5, 3, 5, 4, 4, 3, 3, 3, 2, 0, 0, 0, 0, 0, 0, 1, 0]),
			new Wave([1, 7, 5, 2, 5, 5, 4, 3, 3, 4, 3, 1, 0, 0, 0, 0, 0, 1, 0]),
			new Wave([1, 6, 4, 1, 0, 5, 5, 4, 4, 4, 3, 1, 0, 0, 0, 0, 0, 2, 0]),
			new Wave([1, 5, 3, 1, 0, 0, 5, 4, 4, 3, 4, 2, 1, 0, 0, 0, 0, 3, 0])
		]),

		new Level("Level4", [
			new Wave([1, 4, 2, 1, 0, 0, 0, 5, 3, 2, 4, 2, 1, 1, 0, 0, 1, 2, 2]),
			new Wave([1, 3, 1, 1, 0, 0, 0, 5, 2, 1, 3, 3, 2, 1, 0, 0, 2, 1, 0]),
			new Wave([1, 2, 1, 1, 0, 0, 0, 0, 1, 0, 3, 3, 2, 2, 1, 0, 3, 1, 0]),
			new Wave([1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 1, 3, 2, 1, 0, 4, 1, 0])
		]),

		new Level("Level5", [
			new Wave([1, 1, 1, 2, 0, 0, 0, 0, 0, 0, 2, 1, 3, 3, 2, 1, 0, 1, 4]),
			new Wave([1, 1, 1, 2, 0, 0, 0, 0, 0, 0, 1, 1, 1, 3, 2, 1, 0, 1, 0]),
			new Wave([1, 1, 1, 2, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 3, 2, 0, 1, 0]),
			new Wave([1, 1, 1, 2, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 2, 0, 1, 0])
		]),

		new Level("Level6", [
			new Wave([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 4, 0, 1, 8]),
			new Wave([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0])
		]),
	];
}