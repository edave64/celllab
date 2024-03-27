import { World } from "./world";

/**
 * Golly/RLE format : B1357/S1357
 * MCell: 1357/1357
 *
 * @param {string} str
 * @returns {import("./world").Automaton}
 */
export function compileLifeLike(str) {
	if (!str.includes("/")) return null;
	const numbers = str.split("/");
	let born;
	let survive;
	if (str.startsWith("B")) {
		born = Array.from(numbers[0].replace(/[^\d]/g, ""));
		survive = Array.from(numbers[1].replace(/[^\d]/g, ""));
	} else {
		survive = Array.from(numbers[0].replace(/[^\d]/g, ""));
		born = Array.from(numbers[1].replace(/[^\d]/g, ""));
	}

	const bornTest = born.length === 0 ? "false" : born.map((x) => `neighbors === ${x}`).join(" || ");
	const surviveTest =
		survive.length === 0 ? "false" : survive.map((x) => `neighbors === ${x}`).join(" || ");

	return new Function(
		"World",
		"oldWorld",
		"newWidth",
		"newHeight",
		"lookupFunction",
		`
    const newWorld = new World(newWidth, newHeight);
    const lookup = lookupFunction.bind(null, oldWorld);

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
                if (${bornTest}) own = 1;
            } else {
                if (!(${surviveTest})) own = 0;
            }

            if (own) {
                newWorld.setTrue(x, y);
            }
        }
    }

    return newWorld;`,
	).bind(null, World);
}
