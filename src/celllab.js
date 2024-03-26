import * as ui from "./ui.js";
import * as display from "./display.js";

globalThis.CL = {
	init() {
		CL.display.init();
		CL.ui.init();
	},

	display,

	ui,
};
