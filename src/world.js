export class World {
	/**
	 * @param {number} width
	 * @param {number} height
	 */
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.data = new Uint8Array(Math.ceil((width * height) / 8));
	}

	/**
	 * @param {number} newWidth
	 * @param {number} newHeight
	 * @param {Lookup} lookupFunction
	 * @returns
	 */
	step(newWidth, newHeight, lookupFunction) {
		const newWorld = new World(newWidth, newHeight);
		const lookup = lookupFunction.bind(null, this);

		for (let x = 0; x < newWidth; ++x) {
			for (let y = 0; y < newHeight; ++y) {
				let own = lookup(x, y);
				const neighbors =
					lookup(x - 1, y - 1) +
					lookup(x, y - 1) +
					lookup(x + 1, y - 1) +
					lookup(x - 1, y) +
					lookup(x + 1, y) +
					lookup(x - 1, y + 1) +
					lookup(x, y + 1) +
					lookup(x + 1, y + 1);

				if (own === 0) {
					if (neighbors === 3) own = 1;
				} else {
					if (neighbors < 2 || neighbors > 3) own = 0;
				}

				if (own) {
					newWorld.setTrue(x, y);
				}
			}
		}

		return newWorld;
	}

	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 * @returns {number}
	 */
	lookup(x, y) {
		const idx = x + y * this.width;
		const chunk = Math.floor(idx / 8);
		const pos = 7 - (idx - chunk * 8);
		const chunkData = this.data[chunk];
		return +!!(chunkData & (1 << pos));
	}

	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 */
	setTrue(x, y) {
		const idx = x + y * this.width;
		const chunk = Math.floor(idx / 8);
		const pos = 7 - (idx - chunk * 8);
		this.data[chunk] |= 1 << pos;
	}

	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 */
	setFalse(x, y) {
		const idx = x + y * this.width;
		const chunk = Math.floor(idx / 8);
		const pos = 7 - (idx - chunk * 8);
		this.data[chunk] &= ~(1 << pos);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {boolean} value
	 */
	set(x, y, value) {
		if (value) {
			this.setTrue(x, y);
		} else {
			this.setFalse(x, y);
		}
	}

	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 */
	invert(x, y) {
		const idx = x + y * this.width;
		const chunk = Math.floor(idx / 8);
		const pos = 7 - (idx - chunk * 8);
		this.data[chunk] ^= 1 << pos;
	}

	invertAll() {
		const ret = new World(this.width, this.height);
		for (let i = 0; i < ret.data.length; ++i) {
			ret.data[i] = this.data[i] ^ 0xff;
		}
		return ret;
	}

	/**
	 * @param {number} h
	 * @param {number} w
	 * @returns {World}
	 */
	static Alternating(h, w) {
		const ret = new World(h, w);
		for (let i = 0; i < ret.data.length; i++) {
			ret.data[i] = 0b01010101;
		}
		return ret;
	}

	/**
	 * @param {number} h
	 * @param {number} w
	 * @returns {World}
	 */
	static Random(h, w) {
		const ret = new World(h, w);
		for (let i = 0; i < ret.data.length; i++) {
			ret.data[i] = 255 * Math.random();
		}
		return ret;
	}
}

/**
 * @callback Translate
 * @param {World} world
 * @param {DOMPointReadOnly} location
 * @return {DOMPointReadOnly}
 */

/**
 * @callback Lookup
 * @param {World} world
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */

/**
 * @callback Automaton
 * @param {World} oldWorld
 * @param {number} newWidth
 * @param {number} newHeight
 * @param {Lookup} lookupFunction
 * @return {World}
 */
