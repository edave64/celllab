import * as ui from "./ui.js";

const canvas = document.createElement("canvas");
const zoom = 16;

export function init() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	document.body.appendChild(canvas);

	/** @type {boolean | null} */
	let currentDrawValue = null;

	canvas.addEventListener("mousedown", (e) => {
		const x = Math.floor(e.clientX / zoom);
		const y = Math.floor(e.clientY / zoom);

		if (x < 0 || x >= ui.world.width || y < 0 || y >= ui.world.height) return;

		currentDrawValue = !ui.world.lookup(x, y);
		ui.world.set(x, y, currentDrawValue);
		draw(ui.world);
	});

	canvas.addEventListener("mousemove", (e) => {
		if (currentDrawValue === null) return;

		const x = Math.floor(e.clientX / zoom);
		const y = Math.floor(e.clientY / zoom);

		if (x < 0 || x >= ui.world.width || y < 0 || y >= ui.world.height) return;

		ui.world.set(x, y, currentDrawValue);
		draw(ui.world);
	});

	canvas.addEventListener("mouseup", () => {
		currentDrawValue = null;
	});
}

/** @type {number | null} */
let lastWidth = null;
/** @type {number | null} */
let lastHeight = null;
/** @type {HTMLCanvasElement} */
let nativeSizeCanvas;

/**
 * @param {import('./world').World} world
 */
export function draw(world) {
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to create painting context.");

	if (lastWidth !== world.width || lastHeight !== world.height || !nativeSizeCanvas) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		lastWidth = world.width;
		lastHeight = world.height;
		nativeSizeCanvas = document.createElement("canvas");
		nativeSizeCanvas.width = world.width;
		nativeSizeCanvas.height = world.height;
	}
	const nativeCtx = nativeSizeCanvas.getContext("2d");
	if (!nativeCtx) throw new Error("Failed to create painting context.");

	const imageData = nativeCtx.getImageData(0, 0, lastWidth, lastHeight, { colorSpace: "srgb" });
	const img32 = new Uint32Array(imageData.data.buffer);
	const bytes = Math.ceil((world.width * world.height) / 8);

	const onColor = colors.getColorOn();
	const offColor = colors.getColorOff();

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

	nativeCtx.putImageData(imageData, 0, 0);
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(nativeSizeCanvas, 0, 0, world.width * zoom, world.height * zoom);
}

const colors = {
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
		const styles = getComputedStyle(colors.onColorChecker);
		return this.convertCssColor(styles.backgroundColor);
	},

	/**
	 * @returns {number}
	 */
	getColorOff() {
		const styles = getComputedStyle(colors.offColorChecker);
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
			return byteOrder.fix32(ret);
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
			return byteOrder.fix32(ret);
		}
		throw new Error("Color format not reconginzed");
	},
};

const byteOrder = {
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
		if (byteOrder.correctEndian) return data;
		const buffer = new ArrayBuffer(4);
		const view = new DataView(buffer);
		const systemEndian = new Uint32Array(buffer);

		view.setInt32(0, data);
		return systemEndian[0];
	},
};
