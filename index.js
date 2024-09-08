//TODO lokales node.js, lädt sonst nicht offline!
const fs = require('fs');
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

const debug = true;

const PORT = process.env.PORT || 1860;

const HOME_PATH = './data/home.json';
const AWAY_PATH = './data/away.json';

const homeTeam = require(HOME_PATH);
const awayTeam = require(AWAY_PATH);

let scoreHome = 0;
let scoreAway = 0;

const eventWS = [];

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

app.ws('/events', (ws, req) => {
	eventWS.push(ws);
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
	res.send({scoreHome, scoreAway});
});

app.get('/matchdayData/:day', (async (req, res) => {
	//res.send(await createMatchdayData(req.params.day));
}));

exports.sendEvent = event => {

	const team = getTeam(event.team);
	event.playerData = team.players[event.number];

	handleEventInternal(event);

	if (eventWS.length === 0) {
		console.log('Websocket not active yet');
		return;
	}
	for (const ws of eventWS) {
		if (ws.readyState === ws.OPEN) {
			ws.send(JSON.stringify(event));
		}
	}
};

function getTeam(specifier) {
	return specifier === 'HOME' ? homeTeam : awayTeam;
}

function handleEventInternal(event) {
	if (event.eventType === "GOAL") {
		addScore(event.team === 'HOME');
	} else if (event.eventType === "OWN_GOAL") {
		reduceScore(event.team === 'HOME');
	}

	if (event.playerData === undefined) {
		//Player Input wrong or not included
		//still handle event (e.g update score on goal)
		//but no lower thirds
		console.log('Player not found. Please update Event Data manually:', event);
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

function saveData() {
	fs.writeFile(HOME_PATH, JSON.stringify(homeTeam));
	fs.writeFile(AWAY_PATH, JSON.stringify(awayTeam));
}
