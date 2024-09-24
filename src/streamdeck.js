import {listStreamDecks, openStreamDeck} from "@elgato-stream-deck/node";
import path from "path";
import sharp from "sharp";
import Canvas from "canvas";
import {fileURLToPath} from 'url';
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
    // TODO less duplication via objects?
    input = input.trim().toUpperCase();

    switch (input) {
        case 'HOME':
            event.team = 'HOME';
            break;
        case 'AWAY':
            event.team = 'AWAY';
            break;
        case 'GOAL':
            event.eventType = 'GOAL';
            break;
        case 'OWN GOAL':
        case 'OWN_GOAL':
            event.eventType = 'OWN_GOAL';
            break;
        case 'FOUL':
            event.eventType = 'FOUL';
            break;
        case 'LINEUP':
            showLineup();
            return;
        case 'REFEREES':
        case 'REF':
            showReferees();
            return;
    }

    if (event.eventType && event.team) {
        sendAndReset(event);
    }
});

const EVENT_MAPPING = {
    [GOAL_KEY]: 'GOAL',
    [OWN_GOAL_KEY]: 'OWN_GOAL',
    [FOUL_KEY]: 'FOUL',
    [REMOVE_FOUL_KEY]: 'REMOVE_FOUL',
};


async function main() {
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
                if (EVENT_MAPPING.hasOwnProperty(keyIndex)) {
                    event.eventType = EVENT_MAPPING[keyIndex];
                }

                switch (keyIndex) {
                    case HOME_TEAM_KEY:
                        event.team = 'HOME';
                        break;
                    case AWAY_TEAM_KEY:
                        event.team = 'AWAY';
                        break;
                    case SHOW_LINEUP_KEY:
                        showLineup();
                        return;
                    case SHOW_REFEREES_KEY:
                        showReferees();
                        return;
                    case SCOREBOARD_VISIBILITY_KEY:
                        sendEvent({
                            eventType: 'TOGGLE_SCOREBOARD'
                        });
                        return;
                    case CLEAR_FOULS_KEY:
                        sendEvent({
                            eventType: 'CLEAR_FOULS'
                        });
                        return;
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
}

main().then();

function showLineup() {
    updateLineup().then(() => {
        event.eventType = 'LINEUP';
        sendAndReset(event);
    });
}

function showReferees() {
    saveReferees().then(() => {
        event.eventType = 'REFEREES';
        sendAndReset(event);
    });
}

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

const IMAGES = {
    0: '1.png',
    1: '2.png',
    2: '3.png',
    8: '4.png',
    9: '5.png',
    10: '6.png',
    16: '7.png',
    17: '8.png',
    18: '9.png',
    25: '0.png',
    24: 'cancel.png',
    [HOME_TEAM_KEY]: 'homeTeam.png',
    [AWAY_TEAM_KEY]: 'awayTeam.png',
    [FOUL_KEY]: 'whistle.png',
    [REMOVE_FOUL_KEY]: 'whistle_red.png',
    [CLEAR_FOULS_KEY]: 'whistle_all.png',
    [GOAL_KEY]: 'football.webp',
    [OWN_GOAL_KEY]: 'owngoal.png',
    [SCOREBOARD_VISIBILITY_KEY]: 'eye.png',
    [SHOW_REFEREES_KEY]: 'dfb-picto-schiriansetzung-rgb-white.png',
};

async function loadKeyImages() {
    for (const key in IMAGES) {
        loadImage(+key, IMAGES[key]);
    }
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
