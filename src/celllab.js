const DefaultHeight = 50;
const DefaultWidth = 50;

globalThis.CL = {
	/** @type {World} */
	world: null,
	/** @type {null | number} */
	runner: null,

	init() {
		this.world = World.Alternating(DefaultWidth, DefaultHeight);
		CL.ui.init();
		CL.display.init();
		CL.display.draw(this.world);
	},

	step() {
		cancelAnimationFrame(this.runner);
		this.runner = null;
		this.world = this.world.step();
		CL.display.draw(this.world);
	},

	playPause() {
		if (this.runner) {
			cancelAnimationFrame(this.runner);
			this.runner = null;
		} else {
			const runner = () => {
				this.world = this.world.step();
				CL.display.draw(this.world);
				this.runner = requestAnimationFrame(runner);
			};
			runner();
		}
	},

	ui: {
		/** @type {HTMLInputElement} */
		w_input: null,
		/** @type {HTMLInputElement} */
		h_input: null,
		/** @type {HTMLDivElement} */
		dialog: null,

		init() {
			this.updatePosition();

			this.w_input = document.getElementById("cl_w");
			this.h_input = document.getElementById("cl_h");
			this.dialog = document.getElementById("dialog");

			this.w_input.value = CL.world.width;
			this.h_input.value = CL.world.height;
		},

		updatePosition() {},
	},

	display: {
		/** @type {HTMLCanvasElement} */
		canvas: null,
		zoom: 16,
		init() {
			this.canvas = document.createElement("canvas");
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
			document.body.appendChild(this.canvas);
			this.canvas.addEventListener("click", (e) => {
				const x = Math.floor(e.clientX / CL.display.zoom);
				const y = Math.floor(e.clientY / CL.display.zoom);
				CL.world.invert(x, y);
				CL.display.draw(CL.world);
			});
		},

		/**
		 * @param {World} world
		 */
		async draw(world) {
			const canvas = CL.display.canvas;
			const ctx = canvas.getContext("2d");
			const imageData = ctx.createImageData(world.width, world.height, {
				colorSpace: "srgb",
			});
			const img32 = new Uint32Array(imageData.data.buffer);
			const bytes = Math.ceil((world.width * world.height) / 8);

			const onColor = CL.colors.getColorOn();
			const offColor = CL.colors.getColorOff();

			for (let byteIdx = 0; byteIdx < bytes; ++byteIdx) {
				const worldByte = world.data[byteIdx];
				const pxOffset = byteIdx * 8;

				img32[pxOffset + 0] = worldByte & 0b10000000 ? onColor : offColor;
				img32[pxOffset + 1] = worldByte & 0b01000000 ? onColor : offColor;
				img32[pxOffset + 2] = worldByte & 0b00100000 ? onColor : offColor;
				img32[pxOffset + 3] = worldByte & 0b00010000 ? onColor : offColor;
				img32[pxOffset + 4] = worldByte & 0b00001000 ? onColor : offColor;
				img32[pxOffset + 5] = worldByte & 0b00000100 ? onColor : offColor;
				img32[pxOffset + 6] = worldByte & 0b00000010 ? onColor : offColor;
				img32[pxOffset + 7] = worldByte & 0b00000001 ? onColor : offColor;
			}
			const bmp = await createImageBitmap(imageData);
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(bmp, 0, 0, world.width * 16, world.height * 16);
		},
	},

	colors: {
		onColorChecker: (() => {
			const ele = document.createElement("div");
			ele.style.backgroundColor = "var(--cl-on)";
			ele.style.display = "none";
			document.documentElement.appendChild(ele);
			return ele;
		})(),

		offColorChecker: (() => {
			const ele = document.createElement("div");
			ele.style.backgroundColor = "var(--cl-off)";
			ele.style.display = "none";
			document.documentElement.appendChild(ele);
			return ele;
		})(),

		/**
		 * @returns {number}
		 */
		getColorOn() {
			const styles = getComputedStyle(CL.colors.onColorChecker);
			return this.convertCssColor(styles.backgroundColor);
		},

		/**
		 * @returns {number}
		 */
		getColorOff() {
			const styles = getComputedStyle(CL.colors.offColorChecker);
			return this.convertCssColor(styles.backgroundColor);
		},

		/**
		 * @param {string} cssColor
		 * @returns {number}
		 */
		convertCssColor(cssColor) {
			if (cssColor.startsWith("rgba(")) {
				const data = cssColor
					.substring(5, cssColor.length - 1)
					.split(",")
					.map((x) => +x);
				let ret = 0x00000000;
				ret |= data[0] << 24;
				ret |= data[1] << 16;
				ret |= data[2] << 8;
				ret |= data[3] * 255;
				return CL.byteOrder.fix32(ret);
			}
			if (cssColor.startsWith("rgb(")) {
				const data = cssColor
					.substring(4, cssColor.length - 1)
					.split(",")
					.map((x) => +x);
				let ret = 0x000000ff;
				ret |= data[0] << 24;
				ret |= data[1] << 16;
				ret |= data[2] << 8;
				return CL.byteOrder.fix32(ret);
			}
			throw new Error("Color format not reconginzed");
		},
	},

	byteOrder: {
		/**
		 * Some may also call this "Big endian"
		 */
		correctEndian: (() => {
			const arrayBuffer = new ArrayBuffer(2);
			const uint8Array = new Uint8Array(arrayBuffer);
			const uint16array = new Uint16Array(arrayBuffer);
			uint8Array[0] = 0x11;
			uint8Array[1] = 0xee;
			if (uint16array[0] === 0xee11) return false;

			// This one is obviously the correct way to order bytes. Damn hardware developers and their
			// probably reasonable arguments for not using it.
			if (uint16array[0] === 0x11ee) return true;
			console.error(
				"Your computer failed the endian-test and will be reported to the government! Also," +
					"the colors might look wrong.",
			);
			return false;
		})(),

		/**
		 * @param {number} data
		 */
		fix32(data) {
			if (CL.correctEndian) return data;
			const buffer = new ArrayBuffer(4);
			const view = new DataView(buffer);
			const systemEndian = new Uint32Array(buffer);

			view.setInt32(0, data);
			return systemEndian[0];
		},
	},
};

class World {
	/**
	 * @param {number} width
	 * @param {number} height
	 */
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.data = new Uint8Array(Math.ceil((width * height) / 8));
	}

	step() {
		const newWorld = new World(+CL.ui.w_input.value, +CL.ui.h_input.value);

		for (let x = 0; x < this.width; ++x) {
			for (let y = 0; y < this.height; ++y) {
				let own = this.lookup(x, y);
				const neighbors =
					this.lookup(x - 1, y - 1) +
					this.lookup(x, y - 1) +
					this.lookup(x + 1, y - 1) +
					this.lookup(x - 1, y) +
					this.lookup(x + 1, y) +
					this.lookup(x - 1, y + 1) +
					this.lookup(x, y + 1) +
					this.lookup(x + 1, y + 1);

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
	invert(x, y) {
		const idx = x + y * this.width;
		const chunk = Math.floor(idx / 8);
		const pos = 7 - (idx - chunk * 8);
		this.data[chunk] ^= 1 << pos;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns {number}
	 */
	lookup(x, y) {
		if (x < 0) {
			return 0;
		}
		if (x >= this.width) {
			return 0;
		}
		if (y < 0) {
			return 0;
		}
		if (y >= this.height) {
			return 0;
		}
		const idx = x + y * this.width;
		const chunk = Math.floor(idx / 8);
		const pos = 7 - (idx - chunk * 8);
		const chunkData = this.data[chunk];
		return +!!(chunkData & (1 << pos));
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
}
