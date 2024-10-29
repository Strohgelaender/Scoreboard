import { listStreamDecks, openStreamDeck } from '@elgato-stream-deck/node';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const HOME_TEAM_KEY = 3;
const AWAY_TEAM_KEY = 4;
const FOUL_KEY = 11;
const REMOVE_FOUL_KEY = 12;
const SHOW_FOULS_KEY = -1;
const SHOW_LINEUP_KEY = 19;
const SHOW_REFEREES_KEY = 20;
const SHOW_BOTTOM_SCOREBOARD_KEY = 21;
const GOAL_KEY = 26;
const OWN_GOAL_KEY = 27;
const SCOREBOARD_VISIBILITY_KEY = 28;
const CASTER_KEY = 29;
const TABLE_KEY = 18;
const MATCHDAY_KEY = 17;
const REFRESH_KEY = 25;
const RED_CARD_KEY = 13;
const LIVE_MATCHES_KEY = 16;
const LIVE_TABLE_KEY = 24;

const PAUSE_KEY = 0;
const ADD_5_KEY = 1;
const ADD_10_KEY = 2;
const MINUS_5_KEY = 9;
const MINUS_10_KEY = 10;
const HALFTIME_TIMER_KEY = 8;

const EVENT_MAPPING = {
	[GOAL_KEY]: 'GOAL',
	[OWN_GOAL_KEY]: 'OWN_GOAL',
	[FOUL_KEY]: 'FOUL',
	[REMOVE_FOUL_KEY]: 'REMOVE_FOUL',
	[RED_CARD_KEY]: 'RED_CARD',
};

const STANDALONE_EVENT_MAPPING = {
	[SCOREBOARD_VISIBILITY_KEY]: 'TOGGLE_SCOREBOARD',
	[SHOW_BOTTOM_SCOREBOARD_KEY]: 'SHOW_BOTTOM_SCOREBOARD',
	[SHOW_FOULS_KEY]: 'SHOW_FOULS',
	[CASTER_KEY]: 'CASTER',
	[PAUSE_KEY]: 'START_TIMER',
	[HALFTIME_TIMER_KEY]: 'HALFTIME_TIMER',
	[LIVE_TABLE_KEY]: 'LIVE_TABLE',
	[LIVE_MATCHES_KEY]: 'LIVE_MATCHDAY',
};

const IMAGES = {
	[HOME_TEAM_KEY]: 'homeTeam.png',
	[AWAY_TEAM_KEY]: 'awayTeam.png',
	[FOUL_KEY]: 'whistle.png',
	[REMOVE_FOUL_KEY]: 'whistle_red.png',
	[SHOW_FOULS_KEY]: 'whistle_down.png',
	[GOAL_KEY]: 'football.webp',
	[OWN_GOAL_KEY]: 'owngoal.png',
	[SCOREBOARD_VISIBILITY_KEY]: 'eye.png',
	[SHOW_BOTTOM_SCOREBOARD_KEY]: 'eye.png',
	[SHOW_REFEREES_KEY]: 'dfb-picto-schiriansetzung-rgb-white.png',
	[SHOW_LINEUP_KEY]: 'lineup.png',
	[CASTER_KEY]: 'microphone-342.png',
	[PAUSE_KEY]: 'play.png',
	[TABLE_KEY]: 'table.png',
	[MATCHDAY_KEY]: 'calendar-249-256.png',
	[REFRESH_KEY]: 'cancel.png',
	[RED_CARD_KEY]: 'red.png',
};

const TEXTS = {
	[ADD_5_KEY]: '+5',
	[ADD_10_KEY]: '+10',
	[MINUS_5_KEY]: '-5',
	[MINUS_10_KEY]: '-10',
	[HALFTIME_TIMER_KEY]: '15:00',
	[LIVE_TABLE_KEY]: '⚡tbl',
	[LIVE_MATCHES_KEY]: '⚡mtch',
};

let playImageBuffer;
let pauseImageBuffer;

export class Streamdeck {
	constructor(eventEmitter) {
		this.eventEmitter = eventEmitter;
		this.connectToStreamDeck().then(() => {
			console.log('Streamdeck connected');
		});
	}

	async connectToStreamDeck() {
		try {
			const devices = await listStreamDecks();
			if (devices.length === 0) {
				console.error('No Stream Deck found');
				return;
			}
			this.streamDeck = await openStreamDeck(devices[0].path);

			playImageBuffer = await this.createImageBuffer(PAUSE_KEY, 'play.png');
			pauseImageBuffer = await this.createImageBuffer(PAUSE_KEY, 'Basic_Element_15-30_(580).jpg');

			this.streamDeck.on('down', this.handleKeyDown.bind(this));

			this.streamDeck.on('error', (error) => {
				console.error(error);
			});
			this.loadKeyImages();
		} catch (error) {
			console.error(error);
			console.error('Could not find a Stream Deck.');
		}
	}

	handleKeyDown(control) {
		if (control.type !== 'button') {
			return;
		}
		const keyIndex = control.index;
		console.log('key %d down', keyIndex);

		if (keyIndex in EVENT_MAPPING) {
			this.eventEmitter(EVENT_MAPPING[keyIndex]);
		}

		if (keyIndex in STANDALONE_EVENT_MAPPING) {
			this.eventEmitter(STANDALONE_EVENT_MAPPING[keyIndex]);
			return;
		}

		switch (keyIndex) {
			case HOME_TEAM_KEY:
				this.eventEmitter('HOME');
				break;
			case AWAY_TEAM_KEY:
				this.eventEmitter('AWAY');
				break;
			case SHOW_LINEUP_KEY:
				this.eventEmitter('LINEUP');
				return;
			case SHOW_REFEREES_KEY:
				this.eventEmitter('SHOW_REFEREES');
				return;
			case TABLE_KEY:
				this.eventEmitter('TABLE');
				return;
			case MATCHDAY_KEY:
				this.eventEmitter('MATCHDAY');
				return;
			case REFRESH_KEY:
				this.eventEmitter('REFRESH');
				return;
			case ADD_5_KEY:
				this.eventEmitter('ADD_TIME', 5);
				return;
			case ADD_10_KEY:
				this.eventEmitter('ADD_TIME', 10);
				return;
			case MINUS_5_KEY:
				this.eventEmitter('ADD_TIME', -5);
				return;
			case MINUS_10_KEY:
				this.eventEmitter('ADD_TIME', -10);
				return;
		}
	}

	loadKeyImages() {
		for (const key in IMAGES) {
			if (+key >= 0) {
				this.loadImage(+key, IMAGES[key]);
			}
		}
		for (const key in TEXTS) {
			if (+key >= 0) {
				this.fillText(+key, TEXTS[key]);
			}
		}
	}

	async fillText(index, text) {
		this.streamDeck.fillKeyBuffer(index, await this.createText(1, text));
	}

	async loadImage(index, imageName) {
		this.streamDeck.fillKeyBuffer(index, await this.createImageBuffer(index, imageName));
	}

	createImageBuffer(index, imageName) {
		const pixelSize = this.streamDeck.CONTROLS[index].pixelSize;
		return sharp(path.resolve(__dirname, '..', 'icons', imageName))
			.flatten() // Eliminate alpha channel, if any.
			.resize(pixelSize.width, pixelSize.height) // Scale up/down to the right size, cropping if necessary.
			.raw() // Give us uncompressed RGB.
			.toBuffer();
	}

	createText(index, text) {
		const pixelSize = this.streamDeck.CONTROLS[index].pixelSize;
		const svgData = `<svg viewBox="0 0 ${pixelSize.width} ${pixelSize.height}">
                        <text
                            font-family="'sans-serif'"
                            font-size="30px"
							font-weight="bold"
                            x="${pixelSize.width / 2}"
                            y="${pixelSize.height / 2}"
                            fill="#fff"
                            text-anchor="middle"
							stroke="#666"
                            >${text}</text>
                    </svg>`;
		return sharp(new Buffer.from(svgData))
			.flatten() // Eliminate alpha channel, if any.
			.resize(this.streamDeck.CONTROLS[index].pixelSize.width, this.streamDeck.CONTROLS[index].pixelSize.height) // Scale up/down to the right size, cropping if necessary.
			.raw() // Give us uncompressed RGB.
			.toBuffer();
	}

	updateTimerImage(running) {
		if (!this.streamDeck) {
			// No active streamdeck connection
			return;
		}
		if (running) {
			this.streamDeck.fillKeyBuffer(PAUSE_KEY, pauseImageBuffer);
		} else {
			this.streamDeck.fillKeyBuffer(PAUSE_KEY, playImageBuffer);
		}
	}
}
