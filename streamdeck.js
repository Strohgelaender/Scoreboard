const {openStreamDeck} = require('elgato-stream-deck');
const path = require('path');
const sharp = require('sharp');
const Canvas = require('canvas');
const {Image} = Canvas;

const server = require('./index');
let streamDeck;

const HOME_TEAM_KEY = 3;
const AWAY_TEAM_KEY = 4;
const YELLOW_CARD_KEY = 11;
const RED_CARD_KEY = 12;
const GOAL_KEY = 26;
const OWN_GOAL_KEY = 27;
const SCOREBOARD_VISIBILITY_KEY = 19; //TODO really own key?

//TODO public constants (wie hier und auch im Browser verwenden?)

//TODO Paging

//TODO kominierte Keys Overlay + OBS (z.B. Replay mit einegem Overlay)

const DEFAULT_EVENT = {
	number: '',
};

let resetTime;
let event = {...DEFAULT_EVENT};

try {
    streamDeck = openStreamDeck();
    streamDeck.on('down', keyIndex => {
        console.log('key %d down', keyIndex);
        if (isNumberInput(keyIndex)) {
            //Numpad Handler
            const val = getNumberValue(keyIndex);
            if (val !== -1) {
                event.number += val;
            } else {
                event = {...DEFAULT_EVENT};
                if (resetTime && Math.abs(new Date() - resetTime) <= 200) {
                    //reset Tile Images
                    loadKeyImages();
                }
                resetTime = new Date();
            }
        } else {
            switch (keyIndex) {
                case HOME_TEAM_KEY:
                    event.team = 'HOME';
                    break;
                case AWAY_TEAM_KEY:
                    event.team = 'AWAY';
                    break;
                case YELLOW_CARD_KEY:
                    event.eventType = 'YELLOW_CARD';
                    break;
                case RED_CARD_KEY:
                    event.eventType = 'RED_CARD';
                    break;
                case GOAL_KEY:
                    event.eventType = 'GOAL';
                    break;
                case OWN_GOAL_KEY:
                    event.eventType = 'OWN_GOAL';
                    break;
                case SCOREBOARD_VISIBILITY_KEY:
                    server.sendEvent({
                        eventType: 'TOGGLE_SCOREBOARD'
                    });
                    break;
            }
        }

        //Send Event
        if (event.eventType && event.team && event.number !== '') {
            server.sendEvent(event);
            event = {...DEFAULT_EVENT};
        }
    });

    streamDeck.on('up', keyIndex => {
        console.log('key %d up', keyIndex);
    });

    streamDeck.on('error', error => {
        console.error(error);
    });
    loadKeyImages();
} catch (error) {
    console.error(error);
    console.error('Could not find a Stream Deck.');
}


function isNumberInput(keyIndex) {
	return keyIndex % 8 >= 0 && keyIndex % 8 <= 2 && keyIndex !== 26;
}

function getNumberValue(keyIndex) {
	if (keyIndex === 24)
		return -1;
	else if (keyIndex === 25)
		return 0;
	return Math.floor(keyIndex / 8) * 3 + keyIndex % 8 + 1;
}

function setKeyText() {
	const canvas = new Canvas(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE);
	const ctx = canvas.getContext('2d');


}

async function loadKeyImages() {
	//streamDeck.clearAllKeys();
	streamDeck.fillImage(0, await createImageBuffer('1.png'));
	streamDeck.fillImage(1, await createImageBuffer('2.png'));
	streamDeck.fillImage(2, await createImageBuffer('3.png'));
	streamDeck.fillImage(8, await createImageBuffer('4.png'));
	streamDeck.fillImage(9, await createImageBuffer('5.png'));
	streamDeck.fillImage(10, await createImageBuffer('6.png'));
	streamDeck.fillImage(16, await createImageBuffer('7.png'));
	streamDeck.fillImage(17, await createImageBuffer('8.png'));
	streamDeck.fillImage(18, await createImageBuffer('9.png'));
	streamDeck.fillImage(25, await createImageBuffer('0.png'));
	streamDeck.fillImage(24, await createImageBuffer('cancel.png'));
	streamDeck.fillImage(24, await createImageBuffer('cancel.png'));
	streamDeck.fillImage(HOME_TEAM_KEY, await createImageBuffer('homeTeam.png'));
	streamDeck.fillImage(AWAY_TEAM_KEY, await createImageBuffer('awayTeam.png'));
	streamDeck.fillImage(YELLOW_CARD_KEY, await createImageBuffer('yellow.png'));
	streamDeck.fillImage(RED_CARD_KEY, await createImageBuffer('red.png'));
	streamDeck.fillImage(GOAL_KEY, await createImageBuffer('football.webp'));
	streamDeck.fillImage(OWN_GOAL_KEY, await createImageBuffer('owngoal.png'));
}

function createImageBuffer(imageName) {
	return sharp(path.resolve(__dirname, 'icons', imageName))
		.flatten() // Eliminate alpha channel, if any.
		.resize(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE) // Scale up/down to the right size, cropping if necessary.
		.raw() // Give us uncompressed RGB.
		.toBuffer();
}
