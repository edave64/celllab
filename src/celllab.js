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

	clear() {
		this.world = new World(this.world.width, this.world.height);
		CL.display.draw(this.world);
	},

	alternating() {
		this.world = World.Alternating(this.world.width, this.world.height);
		CL.display.draw(this.world);
	},

	ui: {
		/** @type {HTMLInputElement} */
		w_input: null,
		/** @type {HTMLInputElement} */
		h_input: null,
		/** @type {HTMLDivElement} */
		dialog: null,

		/**  */
		lookupFunction: null,

		init() {
			this.updatePosition();

			this.w_input = document.getElementById("cl_w");
			this.h_input = document.getElementById("cl_h");
			this.dialog = document.getElementById("dialog");

			this.w_input.value = CL.world.width;
			this.h_input.value = CL.world.height;

			const topOverflow = document.getElementById("cl_o_t");
			const bottomOverflow = document.getElementById("cl_o_b");
			const leftOverflow = document.getElementById("cl_o_l");
			const rightOverflow = document.getElementById("cl_o_r");

			const updateLookup = () => {
				this.updateLookupFunction(
					topOverflow.value,
					bottomOverflow.value,
					leftOverflow.value,
					rightOverflow.value,
				);
			};

			for (const ele of [topOverflow, bottomOverflow, leftOverflow, rightOverflow]) {
				ele.addEventListener("change", updateLookup);
			}
			updateLookup();
		},

		/**
		 * The types of borders
		 * @typedef {'off' | 'on' | 'loop' | 'mirror0' | 'mirror1' | 'mobius' | 'fold'} BorderTypes
		 */

		/**
		 *
		 * @param {BorderTypes} topOverflow
		 * @param {BorderTypes} bottomOverflow
		 * @param {BorderTypes} leftOverflow
		 * @param {BorderTypes} rightOverflow
		 */
		updateLookupFunction(topOverflow, bottomOverflow, leftOverflow, rightOverflow) {
			let fnBody = "const width = this.width; const height = this.height;";
			/** @type {BorderTypes[]} */
			const loopingTypes = ["mirror0", "mirror1", "fold"];
			const xNeedsLoop =
				loopingTypes.includes(leftOverflow) || loopingTypes.includes(rightOverflow);
			if (xNeedsLoop) {
				fnBody += "while (x < 0 || x >= width) {\n";
			}
			fnBody += "if (x < 0) {\n";
			switch (leftOverflow) {
				case "off":
				case "on":
					fnBody += `return ${leftOverflow === "on" ? "1" : "0"}\n`;
					break;
				case "loop":
					fnBody += "x = ((x % width) + width) % width;\n";
					break;
				case "mirror0":
					fnBody += "x = -x - 1;\n";
					break;
				case "mirror1":
					fnBody += "x = -x;\n";
					break;
				case "fold":
					fnBody += "x = -x - 1;\n";
					fnBody += "y = height - y - 1;";
					break;
				case "mobius":
					fnBody += "x = ((x % width) + width) % width;\n";
					fnBody += "y = height - y - 1;";
					break;
			}
			fnBody += "}\n";
			fnBody += "if (x >= width) {\n";
			switch (rightOverflow) {
				case "off":
				case "on":
					fnBody += `return ${rightOverflow === "on" ? "1" : "0"}\n`;
					break;
				case "loop":
					fnBody += "x = x % width;\n";
					break;
				case "mirror0":
					fnBody += "x = width - (x - width) - 1;\n";
					break;
				case "mirror1":
					fnBody += "x = width - (x - width) - 2;\n";
					break;
				case "fold":
					fnBody += "x = width - (x - width) - 1;\n";
					fnBody += "y = height - y - 1;";
					break;
				case "mobius":
					fnBody += "x = x % width;\n";
					fnBody += "y = height - y - 1;";
					break;
			}
			if (xNeedsLoop) {
				fnBody += "}\n";
			}
			fnBody += "}\n";
			const yNeedsLoop =
				loopingTypes.includes(topOverflow) || loopingTypes.includes(bottomOverflow);
			if (yNeedsLoop) {
				fnBody += "while (y < 0 || y >= height) {;\n";
			}

			fnBody += "if (y < 0) {\n";
			switch (topOverflow) {
				case "off":
				case "on":
					fnBody += `return ${topOverflow === "on" ? "1" : "0"}\n`;
					break;
				case "loop":
					fnBody += "y = ((y % height) + height) % height;\n";
					break;
				case "mirror0":
					fnBody += "y = -y - 1;\n";
					break;
				case "mirror1":
					fnBody += "y = -y;\n";
					break;
				case "fold":
					fnBody += "y = -y - 1;\n";
					fnBody += "x = width - x - 1;\n";
					break;
				case "mobius":
					fnBody += "y = ((y % height) + height) % height;\n";
					fnBody += "x = width - x - 1;\n";
					break;
			}
			fnBody += "}\n";
			fnBody += "if (y >= height) {\n";
			switch (bottomOverflow) {
				case "off":
				case "on":
					fnBody += `return ${bottomOverflow === "on" ? "1" : "0"}\n`;
					break;
				case "loop":
					fnBody += "y = y % height;\n";
					break;
				case "mirror0":
					fnBody += "y = height - (y - height) - 1;\n";
					break;
				case "mirror1":
					fnBody += "y = height - (y - height) - 2;\n";
					break;
				case "fold":
					fnBody += "y = height - (y - height) - 1;\n";
					fnBody += "x = width - x - 1;\n";
					break;
				case "mobius":
					fnBody += "y = y % height;\n";
					fnBody += "x = width - x - 1;\n";
					break;
			}
			if (yNeedsLoop) {
				fnBody += "}\n";
			}
			fnBody += "}\n";
			fnBody += `
			const idx = x + y * width;
			const chunk = Math.floor(idx / 8);
			const pos = 7 - (idx - chunk * 8);
			const chunkData = this.data[chunk];
			return +!!(chunkData & (1 << pos));`;

			this.lookupFunction = new Function("x", "y", fnBody);
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

		lastWidth: null,
		lastHeight: null,

		/**
		 * @param {World} world
		 */
		async draw(world) {
			const canvas = CL.display.canvas;
			const ctx = canvas.getContext("2d");
			if (this.lastWidth !== world.width || this.lastHeight !== world.height) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				this.lastWidth = world.width;
				this.lastHeight = world.height;
			}
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
		const newWidth = +CL.ui.w_input.value;
		const newHeight = +CL.ui.h_input.value;
		const newWorld = new World(newWidth, newHeight);
		const lookup = CL.ui.lookupFunction.bind(this);

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
		return CL.ui.lookupFunction.call(this, x, y);
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
