import { updateLookupFunction } from "./lookup_compiler.js";
import { World } from "./world.js";

/** @type {HTMLInputElement} */
let w_input;
/** @type {HTMLInputElement} */
let h_input;
/** @type {HTMLDivElement} */
let dialog;

/** @type {HTMLButtonElement} */
let playPauseBtn;

let width = 0;
let height = 0;

/** @type {import('./world').World} */
export let world;

let runner = -1;

/** @type {import("./world").Lookup} */
let lastLookup;

export function init() {
	updatePosition();

	w_input = /** @type {HTMLInputElement} */ (document.getElementById("cl_w"));
	h_input = /** @type {HTMLInputElement} */ (document.getElementById("cl_h"));
	dialog = /** @type {HTMLDivElement} */ (document.getElementById("dialog"));
	playPauseBtn = /** @type {HTMLButtonElement} */ (document.getElementById("cl_playPause"));

	width = +w_input.value;
	height = +h_input.value;

	world = World.Alternating(width, height);
	CL.display.draw(world);

	const topOverflow = /** @type {HTMLInputElement} */ (document.getElementById("cl_o_t"));
	const bottomOverflow = /** @type {HTMLInputElement} */ (document.getElementById("cl_o_b"));
	const leftOverflow = /** @type {HTMLInputElement} */ (document.getElementById("cl_o_l"));
	const rightOverflow = /** @type {HTMLInputElement} */ (document.getElementById("cl_o_r"));

	w_input.addEventListener("change", () => {
		width = +w_input.value;
	});
	h_input.addEventListener("change", () => {
		height = +h_input.value;
	});

	const updateLookup = () => {
		lastLookup = updateLookupFunction(
			/** @type {import('./lookup_compiler').BorderTypes} */ (topOverflow.value),
			/** @type {import('./lookup_compiler').BorderTypes} */ (bottomOverflow.value),
			/** @type {import('./lookup_compiler').BorderTypes} */ (leftOverflow.value),
			/** @type {import('./lookup_compiler').BorderTypes} */ (rightOverflow.value),
		);
	};

	for (const ele of [topOverflow, bottomOverflow, leftOverflow, rightOverflow]) {
		ele.addEventListener("change", updateLookup);
	}
	updateLookup();
}

/**
 * @returns {number}
 */
export function getWidth() {
	return width;
}

/**
 * @param {number} w
 */
export function setWidth(w) {
	width = w;
	w_input.value = `${w}`;
}

/**
 * @returns {number}
 */
export function getHeight() {
	return height;
}

/**
 * @param {number} h
 */
export function setHeight(h) {
	height = h;
	h_input.value = `${h}`;
}

function updatePosition() {}

export function step() {
	pause();
	world = world.step(+w_input.value, +h_input.value, lastLookup);
	CL.display.draw(world);
}

/**
 * @param {HTMLButtonElement} element
 */
export function playPause(element) {
	if (runner !== -1) {
		pause();
	} else {
		play();
	}
}

export function pause() {
	cancelAnimationFrame(runner);
	runner = -1;

	playPauseBtn.innerText = "▶️";
	playPauseBtn.title = "Play";
}

export function play() {
	const exec = () => {
		runner = requestAnimationFrame(exec);
		world = world.step(+w_input.value, +h_input.value, lastLookup);
		CL.display.draw(world);
	};
	exec();

	playPauseBtn.innerText = "⏸️";
	playPauseBtn.title = "Pause";
}

export function clear() {
	world = new World(world.width, world.height);
	CL.display.draw(world);
}

export function alternating() {
	world = World.Alternating(world.width, world.height);
	CL.display.draw(world);
}
