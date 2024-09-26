//TODO really really bad idea, just copied
//TODO DELTE THIS !!!!
import { openStreamDeck } from 'elgato-stream-deck';
import path from 'path';
import sharp from 'sharp';
import readline from 'readline';
import { sendEvent } from './index';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
const streamDeck = openStreamDeck();

const SHOW_EDIN = 0;
const SHOW_BERNHARD = 1;
const SHOW_BOTH = 2;

streamDeck.on('down', (keyIndex) => {
	console.log('key %d down', keyIndex);
	switch (keyIndex) {
		case SHOW_EDIN:
			sendEvent({
				eventType: 'SHOW_LEFT',
			});
			break;
		case SHOW_BERNHARD:
			sendEvent({
				eventType: 'SHOW_RIGHT',
			});
			break;
		case SHOW_BOTH:
			sendEvent({
				eventType: 'SHOW_NAMES',
			});
			break;
	}
});

streamDeck.on('up', (keyIndex) => {
	console.log('key %d up', keyIndex);
});

streamDeck.on('error', (error) => {
	console.error(error);
});

rl.on('line', (input) => {
	sendEvent({
		eventType: 'SHOW_EXTRA',
		text: input,
	});
});

loadKeyImages();

async function loadKeyImages() {
	//streamDeck.clearAllKeys();
	streamDeck.fillKeyBuffer(SHOW_EDIN, await createImageBuffer('1860_watermark.png'));
	streamDeck.fillKeyBuffer(SHOW_BERNHARD, await createImageBuffer('errea_watermark.png'));
	streamDeck.fillKeyBuffer(SHOW_BOTH, await createImageBuffer('2.png'));
}

function createImageBuffer(imageName) {
	return sharp(path.resolve(__dirname, 'icons', imageName))
		.flatten() // Eliminate alpha channel, if any.
		.resize(streamDeck.CONTROLS[0].pixelSize.width, streamDeck.CONTROLS[0].pixelSize.height) // Scale up/down to the right size, cropping if necessary.
		.raw() // Give us uncompressed RGB.
		.toBuffer();
}
