//TODO really really bad idea, just copied
//TODO DELTE THIS !!!!

const {openStreamDeck} = require('elgato-stream-deck');
const path = require('path');
const sharp = require('sharp');
const Canvas = require('canvas');
const {Image} = Canvas;
const readline = require("readline");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const server = require('./index');

const streamDeck = openStreamDeck();

const SHOW_EDIN = 0;
const SHOW_BERNHARD = 1;
const SHOW_BOTH = 2;

streamDeck.on('down', keyIndex => {
	console.log('key %d down', keyIndex);
		switch (keyIndex) {
			case SHOW_EDIN:
				server.sendEvent({
					eventType: 'SHOW_LEFT'
				});
				break;
			case SHOW_BERNHARD:
				server.sendEvent({
					eventType: 'SHOW_RIGHT'
				});
				break;
			case SHOW_BOTH:
				server.sendEvent({
					eventType: 'SHOW_NAMES'
				});
				break;
		}
});

streamDeck.on('up', keyIndex => {
	console.log('key %d up', keyIndex);
});

streamDeck.on('error', error => {
	console.error(error);
});

rl.on('line', input => {
	server.sendEvent({
		eventType: 'SHOW_EXTRA',
		text: input
	});
});

loadKeyImages();

async function loadKeyImages() {
	//streamDeck.clearAllKeys();
	streamDeck.fillImage(SHOW_EDIN, await createImageBuffer('1860_watermark.png'));
	streamDeck.fillImage(SHOW_BERNHARD, await createImageBuffer('errea_watermark.png'));
	streamDeck.fillImage(SHOW_BOTH, await createImageBuffer('2.png'));
}

function createImageBuffer(imageName) {
	return sharp(path.resolve(__dirname, 'icons', imageName))
		.flatten() // Eliminate alpha channel, if any.
		.resize(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE) // Scale up/down to the right size, cropping if necessary.
		.raw() // Give us uncompressed RGB.
		.toBuffer();
}
