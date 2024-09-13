// This file ais to read scorebard data live from a webcam
// The data is send to the main storage and the to the scorebaord overlay
// The first aim is to read the clock
// but we can extend this later to automaticly check the current situation (e.g a goal happend -> extra goal transiton + additional overlay)
import Path from "path";
import NodeWebcam from "node-webcam";

var webcamOpts = {
	width: 1280,
	height: 720,
	quality: 100,
	frames: 60,
	delay: 0,
	saveShots: true,
	output: "jpeg",
	//Which camera to use
	//Use Webcam.list() for results
	//false for default device
	//TODO
	device: false,
	// [location, buffer, base64]
	// Webcam.CallbackReturnTypes
	callbackReturn: "buffer",
	//Logging
	verbose: false
};

const tesseract = require("node-tesseract-ocr");

const config = {
	//tessedit_char_whitelist: "0123456789",
	lang: "deu",
	oem: 3,
	psm: 10,
};

const webcam = NodeWebcam.create(webcamOpts);

webcam.capture('scoreboard', (err, data) => {
	if (err) {
		console.error(err);
		return;
	}
	tesseract.recognize(Path.resolve('./scoreboard.jpg'), config).then(value => {
		console.log(value);
	});
});
/*tesseract.recognize(Path.resolve('./scoreboard.png'), config).then(value => {
	console.log(value);
}); */
