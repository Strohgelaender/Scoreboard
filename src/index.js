import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { tinyws } from 'tinyws';
import fs from 'fs';
import { readLineup } from './AufstellungParser.js';
import { GameService } from './gameService.js';
import { ObsService } from './obsService.js';

const PORT = process.env.PORT || 1860;

const eventWS = [];
const timerWS = {
	game: [],
	half: [],
	redhome: [],
	redaway: [],
};

let game = new GameService(sendEvent, sendTime);
let obs = new ObsService();

const app = express();

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

export function getMatchTimer() {
	return game.matchTimer;
}

app.listen(PORT, () => console.log(`Server started at port ${PORT}`));

app.use(express.static('public'));
app.use(bodyParser.json({ limit: '50mb' }));

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
		setupCloseListener(ws, eventWS);
		eventWS.push(ws);
	}
});

//Data Endpoints
app.get('/image/:team', (req, res) => {
	const team = game.getTeam(req.params.team.toUpperCase());
	res.redirect(team.imagePath);
});

// TODO deprecated, is this used anywhere?
app.get('/data/:team/:param', (req, res) => {
	const team = game.getTeam(req.params.team.toUpperCase());
	res.send(team[req.params.param]);
});

app.get('/data/info', (req, res) => {
	const data = {
		home: game.homeTeam,
		away: game.awayTeam,
		section: game.matchTimer.getSection(),
		matchday: process.env.MATCHDAY,
	};
	res.send(data);
});

app.get('/scores', (req, res) => {
	res.send({ scoreHome: game.scoreHome, scoreAway: game.scoreAway, foulsHome: game.foulsHome, foulsAway: game.foulsAway });
});

app.get('/players', (req, res) => {
	res.send({ home: game.homeTeam.players, away: game.awayTeam.players });
});

app.get('/time/game', tinyws(), async (req) => {
	if (req.ws) {
		const ws = await req.ws();
		setupCloseListener(ws, timerWS.game);
		timerWS.game.push(ws);
		ws.send(game.matchTimer.getTimeText());
	}
});

app.get('/time/half', tinyws(), async (req) => {
	if (req.ws) {
		const ws = await req.ws();
		setupCloseListener(ws, timerWS.half);
		timerWS.half.push(ws);
		ws.send(game.halftimeTimer.getTimeText());
	}
});

// TODO: Should we support multiple red card timers per team?
// This should be super super rare and I don't think it's worth the effort
app.get('/time/red/:team', tinyws(), async (req) => {
	const team = req.params.team.toLowerCase();
	if (team !== 'home' && team !== 'away') {
		return;
	}
	if (req.ws) {
		const ws = await req.ws();
		const team = req.params.team.toLowerCase();
		timerWS[`red${team}`].push(ws);
		setupCloseListener(ws, timerWS[`red${team}`]);
		const timer = game.redCardTimers.find((timer) => timer.getTeam() === team);
		if (timer) {
			ws.send(timer.getTimeText());
		}
	}
});

app.post('/saveScoreboard', express.json(), (req, res) => {
	let body = req.body.dataUrl;
	body = body.replace(/^data:image\/png;base64,/, '');
	fs.writeFileSync(`data/scorboard-${game.scoreHome}-${game.scoreAway}.png`, body, 'base64');
	console.log('Scoreboard saved');
	res.status(200).send('OK');
});

app.post('/lineup', express.json(), (req, res) => {
	let body = req.body;
	let home = body.home;
	let away = body.away;
	if (home?.length) {
		console.log('Home:', home);
		game.homeTeam.players = home;
	}
	if (away?.length) {
		console.log('Away:', away);
		game.awayTeam.players = away;
	}
	console.log('Lineup saved from admin view');
	res.status(200).send();
});

app.get('/goalEvents', (req, res) => {
	res.send(game.goalEvents);
});

app.post('/goalEvents', express.json(), (req, res) => {
	let body = req.body;
	// TODO some merging?
	game.goalEvents = body;
	res.status(200).send();
});

// TODO improve location of this function
async function updateLineup(force = false) {
	if (force || !game.homeTeam.players?.length || !game.awayTeam.players?.length) {
		const lineup = await readLineup();
		if (lineup.home?.length) {
			game.homeTeam.players = lineup.home;
		}
		if (lineup.away?.length) {
			game.awayTeam.players = lineup.away;
		}
		console.log('Lineup updated');
	}
}

export function sendEvent(event) {
	const team = game.getTeam(event.team);

	if (game.handleEvent(event)) {
		// returns true if the event got handled completely (timer)
		// and should not be further send to other clients
		return;
	}
	obs.handleEvent(event);

	if (eventWS.length === 0) {
		console.log('Websocket not active yet');
		return;
	}
	sendWS(eventWS, JSON.stringify(event));
}

function sendTime(type, data) {
	sendWS(timerWS[type], data);
}

function sendWS(sockets, data) {
	for (const ws of sockets) {
		if (ws.readyState === ws.OPEN) {
			ws.send(data);
		}
	}
}

function setupCloseListener(ws, wsArray) {
	ws.on('close', () => {
		const index = wsArray.indexOf(ws);
		wsArray.splice(index, 1);
	});
}
