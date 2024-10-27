'use strict';

let scoreHome = 0;
let scoreAway = 0;
let foulsHome = 0;
let foulsAway = 0;

let socket;

document.addEventListener("DOMContentLoaded", () => {
	socket = createWebsocket('events', handleWebsocketMessageCommon);
	loadInitialScores();
});

function createWebsocket(endpoint, handler) {
	const loc = window.location;
	const new_uri = `${loc.protocol === 'https:' ? 'wss:' : 'ws:'}//${loc.host}/${endpoint}`;

	let socket = new WebSocket(new_uri);
	socket.onmessage = handler;
	return socket;
}

function loadInitialScores() {
	fetch('/scores', { method: 'GET' })
		.then((response) => response.json())
		.then((value) => {
			scoreHome = value.scoreHome;
			scoreAway = value.scoreAway;
			foulsHome = value.foulsHome;
			foulsAway = value.foulsAway;
			updateScoreboard();
		})
		.catch((error) => {
			console.log(error);
		});
}

function handleWebsocketMessageCommon(msg) {
	msg = JSON.parse(msg.data);
	console.log(msg);

	switch (msg.eventType) {
		case 'GOAL':
			addScore(msg.team === 'HOME');
			break;
		case 'OWN_GOAL':
			decreaseScore(msg.team === 'HOME');
			break;
		case 'FOUL':
			addFoul(msg.team === 'HOME');
			break;
		case 'REMOVE_FOUL':
			decreaseFoul(msg.team === 'HOME');
			break;
		case 'CLEAR_FOULS':
			foulsHome = foulsAway = 0;
			break;
	}

	handleEventInternal(msg);
}

function addScore(homeTeam) {
	if (homeTeam) {
		scoreHome += 1;
	} else {
		scoreAway += 1;
	}
	updateScoreboard();
}

function decreaseScore(homeTeam) {
	if (homeTeam) {
		if (scoreHome > 0) {
			scoreHome -= 1;
		}
	} else {
		if (scoreAway > 0) {
			scoreAway -= 1;
		}
	}
	updateScoreboard();
}

function addFoul(homeTeam) {
	if (homeTeam) {
		foulsHome += 1;
	} else {
		foulsAway += 1;
	}
	updateScoreboard();
}

function decreaseFoul(homeTeam) {
	if (homeTeam) {
		if (foulsHome > 0) {
			foulsHome -= 1;
		}
	} else {
		if (foulsAway > 0) {
			foulsAway -= 1;
		}
	}
	updateScoreboard();
}

function updateScoreboard() {
	document.getElementById("homeScore").textContent = scoreHome;
	document.getElementById("awayScore").textContent = scoreAway;
	if (typeof updateScoreboardInternal === 'function') {
		updateScoreboardInternal();
	}
}
