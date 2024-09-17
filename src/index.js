//TODO lokales jquery, lädt sonst nicht offline!
import express from 'express';
import { tinyws } from 'tinyws';
import fs from 'fs';
import { OBSWebSocket } from 'obs-websocket-js';
import { readLineup, readReferees } from './AufstellungParser.js';

const debug = true;

const PORT = process.env.PORT || 1860;
const OBS_PASSWORD = process.env.OBS_PASSWORD || '';

const HOME_PATH = 'data/home.json';
const AWAY_PATH = 'data/away.json';

let homeTeam;
let awayTeam;
let referees = [];

(async () => {
    homeTeam = JSON.parse(fs.readFileSync(HOME_PATH, 'utf-8'));
    awayTeam = JSON.parse(fs.readFileSync(AWAY_PATH, 'utf-8'));
})();

let scoreHome = 0;
let scoreAway = 0;
let foulsHome = 0;
let foulsAway = 0;

const eventWS = [];

const app = express();
const obs = new OBSWebSocket();

(async () => {
    try {
       await obs.connect('ws://localhost:4455',  OBS_PASSWORD);
       console.log('OBS connected');
    } catch (error) {
        console.log('OBS not connected', error);
    }
})();

process.on('exit', async function() {
    await obs.disconnect();
});

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

app.get('/matchday/:day', ((req, res) => {
	res.redirect(`/html/matchday.html?day=${req.params.day}`);
}));

app.use('/events', tinyws(), async (req, res) => {
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
       "home": homeTeam, "away": awayTeam
   };
    res.send(data);
});

app.get('/scores', (req, res) => {
	res.send({scoreHome, scoreAway, foulsHome, foulsAway});
});

app.get('/matchdayData/:day', (async (req, res) => {
	//res.send(await createMatchdayData(req.params.day));
}));

export async function updateLineup(){
    const lineup = await readLineup();
    homeTeam.players = lineup.home;
    awayTeam.players = lineup.away;
    console.log('Lineup updated');
    console.log(homeTeam.players);
    // saveData();
};

export async function saveReferees() {
    referees = await readReferees();
}

export function sendEvent(event) {

	const team = getTeam(event.team);
	event.playerData = team?.players[event.number];

	handleEventInternal(event);

    if (event.eventType === 'LINEUP') {
        event.playerData = team.players;
    } else if (event.eventType === 'REFEREES') {
        event.playerData = referees;
    }

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

function handleEventInternal(event) {
    getObsTimestamp();
	if (event.eventType === "GOAL") {
		addScore(event.team === 'HOME');
	} else if (event.eventType === "OWN_GOAL") {
		reduceScore(event.team === 'HOME');
	}

    if (event.eventType === "FOUL") {
        addFoul(event.team === 'HOME');
    } else if (event.eventType === "REMOVE_FOUL") {
        reduceFoul(event.team === 'HOME');
    } else if (event.eventType === "CLEAR_FOULS") {
        foulsHome = foulsAway = 0;
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
			if (!event.playerData.hasOwnProperty('gameYellowCard')) {
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
	if (player.hasOwnProperty(property)) {
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
        recording: streamStatus.outputTimecode
    };
}

function saveData() {
	// fs.writeFile(HOME_PATH, JSON.stringify(homeTeam));
	// fs.writeFile(AWAY_PATH, JSON.stringify(awayTeam));
}
