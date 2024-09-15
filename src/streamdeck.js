import {listStreamDecks, openStreamDeck} from "@elgato-stream-deck/node";
import path from "path";
import sharp from "sharp";
import Canvas from "canvas";
import { fileURLToPath } from 'url';
import {updateLineup, saveReferees, sendEvent} from "./index.js";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

let streamDeck;

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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', input => {
    // TODO other events
    input = input.trim().toUpperCase();
    if (input === 'REFEREES' || input === 'REF') {
        saveReferees().then(() => {
            event.eventType = 'REFEREES';
            sendAndReset(event);
        });
        return;
    }
});


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
                sendEvent({
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
                        updateLineup().then(() => {
                            event.eventType = 'LINEUP';
                            sendAndReset(event);
                        });
                        return;
                    case SHOW_REFEREES_KEY:
                        saveReferees().then(() => {
                            event.eventType = 'REFEREES';
                            sendAndReset(event);
                        });
                        return;
                    case SCOREBOARD_VISIBILITY_KEY:
                        sendEvent({
                            eventType: 'TOGGLE_SCOREBOARD'
                        });
                        break;
                }
            }

            if (event.eventType && event.team) {
                sendAndReset(event);
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

function sendAndReset(e) {
    sendEvent(e);
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
    loadImage(0, '1.png');
    loadImage(1, '2.png');
    loadImage(2, '3.png');
    loadImage(8, '4.png');
    loadImage(9, '5.png');
    loadImage(10, '6.png');
    loadImage(16, '7.png');
    loadImage(17, '8.png');
    loadImage(18, '9.png');
    loadImage(25, '0.png');
    loadImage(24, 'cancel.png');
    loadImage(24, 'cancel.png');
    loadImage(HOME_TEAM_KEY,'homeTeam.png');
    loadImage(AWAY_TEAM_KEY, 'awayTeam.png');
    loadImage(FOUL_KEY, 'whistle.png');
    loadImage(REMOVE_FOUL_KEY, 'whistle_red.png');
    loadImage(CLEAR_FOULS_KEY,'whistle_all.png');
    loadImage(GOAL_KEY, 'football.webp');
    loadImage(OWN_GOAL_KEY, 'owngoal.png');
    loadImage(SCOREBOARD_VISIBILITY_KEY,'eye.png');
}

async function loadImage(index, imageName) {
    streamDeck.fillKeyBuffer(index, await createImageBuffer(index, imageName));
}

function createImageBuffer(index, imageName) {
    return sharp(path.resolve(__dirname, '..', 'icons', imageName))
        .flatten() // Eliminate alpha channel, if any.
        .resize(streamDeck.CONTROLS[index].pixelSize.width, streamDeck.CONTROLS[index].pixelSize.height) // Scale up/down to the right size, cropping if necessary.
        .raw() // Give us uncompressed RGB.
        .toBuffer();
}
