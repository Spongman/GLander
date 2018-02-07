///<reference path="Math.ts"/>

class Size {
	constructor(public Width: number, public Height: number) {
	}
	ToVector(): Vec2 {
		return new Vec2(this.Width, this.Height);
	}
}
