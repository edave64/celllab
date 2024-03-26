/**
 * The types of borders
 * @typedef {'off' | 'on' | 'loop' | 'mirror0' | 'mirror1' | 'mobius' | 'fold'} BorderTypes
 */

/**
 * These are the border types that might flip an out-of-bounds access into the other border.
 * Therefore, if there are very large out of bounds accesses, it might need to flip again, so we
 * need to add a while loop.
 *
 * @type {BorderTypes[]}
 */
const loopingTypes = ["mirror0", "mirror1", "fold"];

const lookupXunderflow = {
	loop: "x = ((x % width) + width) % width;\n",
	mirror0: "x = -x - 1;\n",
	mirror1: "x = -x;\n",
	fold: "x = -x - 1;\ny = height - y - 1;\n",
	mobius: "x = ((x % width) + width) % width;\ny = height - y - 1;\n",
};

const lookupXoverflow = {
	loop: "x = x % width;\n",
	mirror0: "x = width - (x - width) - 1;\n",
	mirror1: "x = width - (x - width) - 2;\n",
	fold: "x = width - (x - width) - 1;\ny = height - y - 1;\n",
	mobius: "x = x % width;\n\ny = height - y - 1;\n",
};

/**
 *
 * @param {BorderTypes} topOverflow
 * @param {BorderTypes} bottomOverflow
 * @param {BorderTypes} leftOverflow
 * @param {BorderTypes} rightOverflow
 * @return {import('./world.js').Lookup}
 */
export function updateLookupFunction(topOverflow, bottomOverflow, leftOverflow, rightOverflow) {
	let fnBody = "const width = world.width; const height = world.height;";

	const xNeedsLoop = loopingTypes.includes(leftOverflow) || loopingTypes.includes(rightOverflow);
	if (xNeedsLoop) {
		fnBody += "while (x < 0 || x >= width) {\n";
	}
	fnBody += "if (x < 0) {\n";
	switch (leftOverflow) {
		case "off":
		case "on":
			fnBody += `return ${leftOverflow === "on" ? "1" : "0"}\n`;
			break;
		default:
			fnBody += lookupXunderflow[leftOverflow];
			break;
	}
	fnBody += "}\n";
	fnBody += "if (x >= width) {\n";
	switch (rightOverflow) {
		case "off":
		case "on":
			fnBody += `return ${rightOverflow === "on" ? "1" : "0"}\n`;
			break;
		default:
			fnBody += lookupXoverflow[rightOverflow];
			break;
	}
	if (xNeedsLoop) {
		fnBody += "}\n";
	}
	fnBody += "}\n";
	const yNeedsLoop = loopingTypes.includes(topOverflow) || loopingTypes.includes(bottomOverflow);
	if (yNeedsLoop) {
		fnBody += "while (y < 0 || y >= height) {;\n";
	}

	fnBody += "if (y < 0) {\n";
	switch (topOverflow) {
		case "off":
		case "on":
			fnBody += `return ${topOverflow === "on" ? "1" : "0"}\n`;
			break;
		default:
			fnBody += xySwapper(lookupXunderflow[topOverflow]);
			break;
	}
	fnBody += "}\n";
	fnBody += "if (y >= height) {\n";
	switch (bottomOverflow) {
		case "off":
		case "on":
			fnBody += `return ${bottomOverflow === "on" ? "1" : "0"}\n`;
			break;
		default:
			fnBody += xySwapper(lookupXoverflow[bottomOverflow]);
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
        const chunkData = world.data[chunk];
        return +!!(chunkData & (1 << pos));`;

	return /** @type {(world: import('./world.js').World, x: number, y: number) => number} */ (
		new Function("world", "x", "y", fnBody)
	);
}

/**
 * @param {string} str
 * @returns {string}
 */
function xySwapper(str) {
	return str.replace(/(x|y|width|height)/g, (v) => {
		if (v === "x") return "y";
		if (v === "y") return "x";
		if (v === "width") return "height";
		if (v === "height") return "width";
		return "";
	});
}
