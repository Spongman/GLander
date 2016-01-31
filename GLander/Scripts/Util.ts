class Util
{
	static TwoPI = 2 * Math.PI;
	static Gravity = 0.003;

	static Rand(max: number): number;
	static Rand(min: number, max: number): number;
	static Rand(min: any, max?: any): number
	{
		if (arguments.length === 1)
			return Math.random() * min;

		return Util.mix(min, max, Math.random());
	}

	static Wrap(value: number, max: number): number;
	static Wrap(value: number, min: number, max: number): number;
	static Wrap(value: any, min: any, max?: any): number
	{
		if (arguments.length === 2)
		{
			if (value < 0)
				return min - ((-value) % min);
			else
				return value % min;
		}

		return min + Util.Wrap(value - min, max - min);
	}

	static WrapAngle(value: number)
	{
		return Util.Wrap(value, -Math.PI, Math.PI);
	}

	static Limit(value: number, min: number, max: number): number
	{
		if (value < min)
			return min;
		else if (value > max)
			return max;
		return value;
	}

	static mix(min: number, max: number, value: number): number
	{
		return min + (max - min) * Util.Limit(value, 0, 1);
	}

	static Swap<T>(t1: T[], t2: T[]): void
	{
		const t3 = t1[0];
		t1[0] = t2[0];
		t2[0] = t3;
	}

	static Sign(val: number): number
	{
		if (val < 0)
			return -1;
		if (val > 0)
			return 1;
		return 0;
	}

	static ToRadians(val: number): number
	{
		return val * Util.TwoPI / 360;
	}

	static LoadImage(url: string)
	{
		var deferred = $.Deferred<HTMLImageElement>();
		var image = new Image();
		deferred.always(() => { image.onload = image.onerror = image.onabort = null; });
		image.onload = $.proxy(deferred.resolve, null, image);
		image.onerror = image.onabort = $.proxy(deferred.reject, null, image);
		image.src = url;
		return deferred.promise();
	};

	static LoadImageData(url: string)
	{
		return Util.LoadImage(url).then(img =>
		{
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0);
			return ctx.getImageData(0, 0, canvas.width, canvas.height);
		});
	}
}



class Color
{
	constructor(public R: number, public G: number, public B: number, public A = 255)
	{
	}

	static Transparent = new Color(0, 0, 0, 0);
	static Black = new Color(0, 0, 0);
	static White = new Color(255, 255, 255);
	static Red = new Color(255, 0, 0);
	static BlueViolet = new Color(0x8a, 0x2b, 0xe2);

	static FromNonPremultiplied(r: number, g: number, b: number, a: number): Color 
	{
		const pa = a / 255;
		return new Color(r * pa, g * pa, b * pa, a);
	}

	static FromArray(array: number[], index: number): Color
	{
		if (!index)
			index = 0;

		return new Color(array[index], array[index + 1], array[index + 2]);
	}

	pushFloat4To(array: number[])
	{
		array.push(
			this.R / 255,
			this.G / 255,
			this.B / 255,
			this.A / 255
		);
	}
	pushFloat3To(array: number[])
	{
		array.push(
			this.R / 255,
			this.G / 255,
			this.B / 255
		);
	}

	writeRGBATo(array: UInt8Array, index: number)
	{
		index *= 4;
		array[index++] = this.R;
		array[index++] = this.G;
		array[index++] = this.B;
		array[index++] = this.A;
	}
	writeFloatTo(array: Float32Array, index: number)
	{
		index *= 4;
		array[index++] = this.R / 255;
		array[index++] = this.G / 255;
		array[index++] = this.B / 255;
		array[index++] = this.A / 255;
	}

}





interface TypedArray extends ArrayBufferView
{
	/**
	 * The size in bytes of each element in the array. 
	 */
    BYTES_PER_ELEMENT: number;

    /**
      * The length of the array.
      */
    length: number;

    [index: number]: number;

    /**
      * Gets the element at the specified index.
      * @param index The index at which to get the element of the array.
      */
    get(index: number): number;

    /**
      * Sets a value or an array of values.
      * @param index The index of the location to set.
      * @param value The value to set.
      */
    set(index: number, value: number): void;
}

interface UInt8Array extends TypedArray { }
interface Float32Array extends TypedArray { }