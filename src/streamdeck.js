const {openStreamDeck, listStreamDecks} = require('@elgato-stream-deck/node');
const path = require('path');
const sharp = require('sharp');
const Canvas = require('canvas');
const {Image} = Canvas;

const server = require('./index');
let streamDeck;

const ICON_SIZE = 96;

const HOME_TEAM_KEY = 3;
const AWAY_TEAM_KEY = 4;
const FOUL_KEY = 11;
const REMOVE_FOUL_KEY = 12;
const CLEAR_FOULS_KEY = 13;
const SHOW_LINEUP_KEY = 19;
const SHOW_REFEREES_KEY = 20;
const GOAL_KEY = 26;
const OWN_GOAL_KEY = 27;
const SCOREBOARD_VISIBILITY_KEY = 28;

//TODO public constants (wie hier und auch im Browser verwenden?)
//TODO Paging?
//TODO kominierte Keys Overlay + OBS (z.B. Replay mit eigenem Overlay)

const DEFAULT_EVENT = {
    number: '',
};

let resetTime;
let event = {...DEFAULT_EVENT};

;(async () => {
    try {
        const devices = await listStreamDecks();
        if (devices.length === 0) {
            console.error('No Stream Deck found');
            return;
        }
        streamDeck = await openStreamDeck(devices[0].path);
        streamDeck.on('down', control => {
            if (control.type !== 'button') {
                return;
            }
            const keyIndex = control.index;
            console.log('key %d down', keyIndex);

            if (keyIndex === CLEAR_FOULS_KEY) {
                server.sendEvent({
                    eventType: 'CLEAR_FOULS'
                });
                return;
            }

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
                    case GOAL_KEY:
                        event.eventType = 'GOAL';
                        break;
                    case OWN_GOAL_KEY:
                        event.eventType = 'OWN_GOAL';
                        break;
                    case FOUL_KEY:
                        event.eventType = 'FOUL';
                        break;
                    case REMOVE_FOUL_KEY:
                        event.eventType = 'REMOVE_FOUL';
                        break;
                    case SHOW_LINEUP_KEY:
                        server.updateLineup().then(() => {
                            event.eventType = 'LINEUP';
                            sendEvent(event);
                        });
                        return;
                    case SHOW_REFEREES_KEY:
                        server.readReferees().then(() => {
                            event.eventType = 'REFEREES';
                            sendEvent(event);
                        });
                        return;
                    case SCOREBOARD_VISIBILITY_KEY:
                        server.sendEvent({
                            eventType: 'TOGGLE_SCOREBOARD'
                        });
                        break;
                }
            }

            if (event.eventType && event.team) {
                sendEvent(event);
            }
        });

        streamDeck.on('error', error => {
            console.error(error);
        });
        loadKeyImages();
    } catch (error) {
        console.error(error);
        console.error('Could not find a Stream Deck.');
    }
})();

function sendEvent(e) {
    server.sendEvent(e);
    event = {...DEFAULT_EVENT};
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
    const canvas = new Canvas(ICON_SIZE, ICON_SIZE);
    const ctx = canvas.getContext('2d');
}

async function loadKeyImages() {
    //streamDeck.clearAllKeys();
    streamDeck.fillKeyBuffer(0, await createImageBuffer('1.png'));
    streamDeck.fillKeyBuffer(1, await createImageBuffer('2.png'));
    streamDeck.fillKeyBuffer(2, await createImageBuffer('3.png'));
    streamDeck.fillKeyBuffer(8, await createImageBuffer('4.png'));
    streamDeck.fillKeyBuffer(9, await createImageBuffer('5.png'));
    streamDeck.fillKeyBuffer(10, await createImageBuffer('6.png'));
    streamDeck.fillKeyBuffer(16, await createImageBuffer('7.png'));
    streamDeck.fillKeyBuffer(17, await createImageBuffer('8.png'));
    streamDeck.fillKeyBuffer(18, await createImageBuffer('9.png'));
    streamDeck.fillKeyBuffer(25, await createImageBuffer('0.png'));
    streamDeck.fillKeyBuffer(24, await createImageBuffer('cancel.png'));
    streamDeck.fillKeyBuffer(24, await createImageBuffer('cancel.png'));
    streamDeck.fillKeyBuffer(HOME_TEAM_KEY, await createImageBuffer('homeTeam.png'));
    streamDeck.fillKeyBuffer(AWAY_TEAM_KEY, await createImageBuffer('awayTeam.png'));
    streamDeck.fillKeyBuffer(FOUL_KEY, await createImageBuffer('whistle.png'));
    streamDeck.fillKeyBuffer(REMOVE_FOUL_KEY, await createImageBuffer('whistle_red.png'));
    streamDeck.fillKeyBuffer(CLEAR_FOULS_KEY, await createImageBuffer('whistle_all.png'));
    streamDeck.fillKeyBuffer(GOAL_KEY, await createImageBuffer('football.webp'));
    streamDeck.fillKeyBuffer(OWN_GOAL_KEY, await createImageBuffer('owngoal.png'));
    streamDeck.fillKeyBuffer(SCOREBOARD_VISIBILITY_KEY, await createImageBuffer('eye.png'));
}

function createImageBuffer(imageName) {
    return sharp(path.resolve(__dirname, '..', 'icons', imageName))
        .flatten() // Eliminate alpha channel, if any.
        .resize(ICON_SIZE, ICON_SIZE) // Scale up/down to the right size, cropping if necessary.
        .raw() // Give us uncompressed RGB.
        .toBuffer();
}
