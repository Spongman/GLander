///<reference path="Math.ts"/>

class Entity {
	get X(): number {
		return this.Position.x;
	}
	get Y(): number {
		return this.Position.y;
	}
	get Z(): number {
		return this.Position.z;
	}
	constructor(public Position: Vec3) {
	}
}