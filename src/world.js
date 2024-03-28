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

	serialize() {
		return JSON.stringify([this.width, this.height, Array.from(this.data)]);
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

	/**
	 *
	 * @param {string} json
	 * @returns {World}
	 */
	static Deserialize(json) {
		const data = JSON.parse(json);
		const ret = new World(data[0], data[1]);
		ret.data = new Uint8Array(data[2]);
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
