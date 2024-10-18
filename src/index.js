import 'dotenv/config';
import express from 'express';
import { tinyws } from 'tinyws';
import fs from 'fs';
import { OBSWebSocket } from 'obs-websocket-js';
import { readLineup, readReferees, readTable, readMatchday } from './AufstellungParser.js';
import { Timer } from './timer.js';

const debug = true;

const PORT = process.env.PORT || 1860;
const OBS_PASSWORD = process.env.OBS_PASSWORD || '';

const HOME_PATH = 'data/home.json';
const AWAY_PATH = 'data/away.json';
const EVENT_FILE = `data/${new Date().toISOString().replace(/:/g, '-')}.txt`;

let homeTeam = JSON.parse(fs.readFileSync(HOME_PATH, 'utf-8'));
let awayTeam = JSON.parse(fs.readFileSync(AWAY_PATH, 'utf-8'));
let referees = [];
let table;
let matchday;

let matchTimer = new Timer(20 * 60 * 1000, () => {
	setTimeout(() => {
		sendEvent({ eventType: 'SECOND_HALF' });
		matchTimer.resetTimer();
	}, 10000);
});

let halftimeTimer = new Timer(14 * 60 * 1000);

let scoreHome = 0;
let scoreAway = 0;
let foulsHome = 0;
let foulsAway = 0;

// TODO: Keep this in sync with client
let showingScoreboard = true;

const eventWS = [];

const app = express();
const obs = new OBSWebSocket();

(async () => {
	try {
		await obs.connect('ws://localhost:4455', OBS_PASSWORD);
		console.log('OBS connected');
	} catch {
		console.error('OBS not connected');
	}
})().then();

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
//process.on('SIGKILL', cleanup);

async function cleanup() {
	console.log('cleanup');
	for (const ws of eventWS) {
		ws.close();
	}
	await obs.disconnect();
	process.exit(0);
}

app.listen(PORT, () => console.log(`Server started at port ${PORT}`));

app.use(express.static('public'));

app.get('/', (req, res) => {
	res.send('The Server is up and running');
});

app.get('/scoreboard', (req, res) => {
	res.redirect('/html/scoreboard.html');
});

app.get('/halftime', (req, res) => {
	res.redirect('/html/halftime.html');
});

app.get('/fulltime', (req, res) => {
	res.redirect('/html/fulltime.html');
});

app.get('/matchday/:day', (req, res) => {
	res.redirect(`/html/matchday.html?day=${req.params.day}`);
});

app.use('/events', tinyws(), async (req) => {
	if (req.ws) {
		const ws = await req.ws();
		eventWS.push(ws);
	}
});

//Data Endpoints
app.get('/image/:team', (req, res) => {
	const team = getTeam(req.params.team.toUpperCase());
	res.redirect(team.imagePath);
});

app.get('/data/:team/:param', (req, res) => {
	const team = getTeam(req.params.team.toUpperCase());
	res.send(team[req.params.param]);
});

app.get('/data/info', (req, res) => {
	const data = {
		home: homeTeam,
		away: awayTeam,
		firstHalfDone: matchTimer.isFirstHalfDone(),
	};
	res.send(data);
});

app.get('/scores', (req, res) => {
	res.send({ scoreHome, scoreAway, foulsHome, foulsAway });
});

app.get('/time/game', (req, res) => {
	res.send(matchTimer.getTimeText());
});

app.get('/time/half', (req, res) => {
	res.send(halftimeTimer.getTimeText());
});

export async function updateLineup(force = false) {
	if (force || !homeTeam.players?.length || !awayTeam.players?.length) {
		const lineup = await readLineup();
		homeTeam.players = lineup.home;
		awayTeam.players = lineup.away;
		console.log('Lineup updated');
		console.log(homeTeam.players);
	}
}

export async function saveReferees(force = false) {
	if (force || !referees?.length) {
		referees = await readReferees();
	}
}

export async function loadTable(force = false) {
	if (force || !table) {
		table = await readTable();
	}
}

export async function loadMatchday(force = false) {
	if (force || !matchday) {
		matchday = await readMatchday();
	}
}

export function reloadTeamFiles() {
	homeTeam = JSON.parse(fs.readFileSync(HOME_PATH, 'utf-8'));
	awayTeam = JSON.parse(fs.readFileSync(AWAY_PATH, 'utf-8'));
}

export function sendEvent(event) {
	const team = getTeam(event.team);
	event.playerData = team?.players[event.number];

	if (matchTimer.handleTimerEvent(event)) {
		// true if event got picked up by timer
		return;
	} else if (event.eventType === 'HALFTIME_TIMER') {
		halftimeTimer.startTimer();
		return;
	}

	handleEventInternal(event);
	addEventData(event, team);

	if (eventWS.length === 0) {
		console.log('Websocket not active yet');
		return;
	}
	for (const ws of eventWS) {
		if (ws.readyState === ws.OPEN) {
			ws.send(JSON.stringify(event));
		}
	}
}

function getTeam(specifier) {
	return specifier === 'HOME' ? homeTeam : awayTeam;
}

function addEventData(event, team) {
	if (event.eventType === 'LINEUP') {
		event.playerData = team.players;
	} else if (event.eventType === 'REFEREES') {
		event.playerData = referees;
	} else if (event.eventType === 'TABLE') {
		event.table = table;
	} else if (event.eventType === 'MATCHDAY') {
		event.matchday = matchday;
	}
}

function handleEventInternal(event) {
	if (event.eventType === 'GOAL') {
		addScore(event.team === 'HOME');
		logEvent(event);
	} else if (event.eventType === 'OWN_GOAL') {
		reduceScore(event.team === 'HOME');
	}

	if (event.eventType === 'FOUL') {
		addFoul(event.team === 'HOME');
	} else if (event.eventType === 'REMOVE_FOUL') {
		reduceFoul(event.team === 'HOME');
	} else if (event.eventType === 'CLEAR_FOULS') {
		foulsHome = foulsAway = 0;
	} else if (event.eventType === 'TOGGLE_SCOREBOARD') {
		toggleScoreboardVideo();
	}

	if (event.playerData === undefined) {
		//Player Input wrong or not included
		//still handle event (e.g update score on goal)
		//but no lower thirds
		// console.log('Player not found. Please update Event Data manually:', event);
	} else {
		const property = getPropertyOfEvent(event);
		updatePlayerProperty(event.playerData, property);

		if (event.eventType === 'YELLOW_CARD') {
			if (!('gameYellowCard' in event.playerData)) {
				event.playerData.gameYellowCard = true;
			} else {
				//Gelb-Rote Karte
				event.eventType = 'YELLOW_RED_CARD';
				//redCards = Platzverweise (Rote Karten + Gelb-Rot)
				updatePlayerProperty(event.playerData, 'redCards');
			}
		}
	}

	if (debug) {
		console.log(event);
	} else {
		saveData();
	}
}

function updatePlayerProperty(player, property) {
	if (property in player) {
		player[property] += 1;
	} else {
		player[property] = 1;
	}
}

function addScore(homeTeam) {
	if (homeTeam) {
		scoreHome += 1;
	} else {
		scoreAway += 1;
	}
}

function reduceScore(homeTeam) {
	if (homeTeam) {
		if (scoreHome > 0) {
			scoreHome -= 1;
		}
	} else {
		if (scoreAway > 0) {
			scoreAway -= 1;
		}
	}
}

function addFoul(homeTeam) {
	if (homeTeam) {
		foulsHome += 1;
	} else {
		foulsAway += 1;
	}
}

function reduceFoul(homeTeam) {
	if (homeTeam) {
		if (foulsHome > 0) {
			foulsHome -= 1;
		}
	} else {
		if (foulsAway > 0) {
			foulsAway -= 1;
		}
	}
}

function getPropertyOfEvent(event) {
	switch (event.eventType) {
		case 'GOAL':
			return 'goals';
		case 'OWN_GOAL':
			return 'ownGoals';
		case 'RED_CARD':
			return 'redCards';
		case 'YELLOW_CARD':
			return 'yellowCards';
	}
}

async function getObsTimestamp() {
	const streamStatus = await obs.call('GetStreamStatus');
	console.log(streamStatus);
	const recordingStatus = await obs.call('GetRecordStatus');
	console.log(recordingStatus);
	return {
		stream: streamStatus.outputTimecode,
		recording: streamStatus.outputTimecode,
	};
}

function toggleScoreboardVideo() {
	if (showingScoreboard) {
		obs.call('SetSceneItemEnabled', {
			sceneName: 'Main',
			sceneItemId: 12,
			sceneItemEnabled: false,
		}).catch((e) => console.error(e.message));
	} else {
		obs.call('TriggerMediaInputAction', {
			inputName: 'Logo',
			inputUuid: 12,
			mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART',
		})
			.then(() => {
				obs.call('SetSceneItemEnabled', {
					sceneName: 'Main',
					sceneItemId: 12,
					sceneItemEnabled: true,
				}).catch((e) => console.error(e));
			})
			.catch((e) => console.error(e.message));
	}
	showingScoreboard = !showingScoreboard;
}

async function logEvent(event) {
	try {
		const timestamp = await getObsTimestamp();
		let eventString = `${event.eventType}:${event.team}\t${timestamp.stream}\t${timestamp.recording}\n`;
		if (fs.existsSync(EVENT_FILE)) {
			fs.appendFileSync(EVENT_FILE, eventString);
		} else {
			eventString = 'Event\tStream\tRecording\n' + eventString;
			fs.writeFileSync(EVENT_FILE, eventString);
		}
	} catch (e) {
		console.error(e.message);
	}
}

function saveData() {
	// fs.writeFile(HOME_PATH, JSON.stringify(homeTeam));
	// fs.writeFile(AWAY_PATH, JSON.stringify(awayTeam));
}
