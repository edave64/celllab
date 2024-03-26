import * as ui from "./ui";
import * as display from "./display";

globalThis.CL = {
	init() {
		CL.display.init();
		CL.ui.init();
	},

	display,

	ui,
};
