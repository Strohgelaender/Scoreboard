'use strict';

let teamA = null;
let teamB = null;

let socketTeamA;
let socketTeamB;

document.addEventListener('DOMContentLoaded', () => {
	socketTeamA = createWebsocket('teamA', handleTeamAMessage);
	socketTeamB = createWebsocket('teamB', handleTeamBMessage);
});

function createWebsocket(endpoint, handler) {
	const loc = window.location;
	const new_uri = `${loc.protocol === 'https:' ? 'wss:' : 'ws:'}//${loc.host}/${endpoint}`;

	let socket = new WebSocket(new_uri);
	socket.onmessage = handler;
	return socket;
}

function handleTeamAMessage(msg) {
	const data = JSON.parse(msg.data);
	console.log('Team A:', data);
	teamA = data;
	updateTeamDisplay('a', teamA);
}

function handleTeamBMessage(msg) {
	const data = JSON.parse(msg.data);
	console.log('Team B:', data);
	teamB = data;
	updateTeamDisplay('b', teamB);
}

function updateTeamDisplay(position, team) {
	const boxElement = document.getElementById(`${position}TeamBox`);
	const nameElement = document.getElementById(`${position}TeamName`);
	const institutionElement = document.getElementById(`${position}TeamInstitution`);
	const logoElement = document.getElementById(`${position}TeamLogo`);

	if (!team) {
		if (boxElement) {
			boxElement.style.display = 'none';
		}
		return;
	}

	// Show the box when team data is available
	if (boxElement) {
		boxElement.style.display = 'flex';
	}

	if (nameElement) {
		nameElement.textContent = team.name || '';
	}

	if (institutionElement) {
		institutionElement.textContent = team.institution || '';
	}

	// Handle logo
	if (logoElement) {
		if (team.logo && team.logo.trim() !== '') {
			logoElement.src = team.logo;
			logoElement.style.display = 'block';
		} else {
			logoElement.style.display = 'none';
		}
	}
}
