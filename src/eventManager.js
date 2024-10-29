// This file is supposed to be the middle point between input devices (e.g. streamdeck, keyboard, comapanion)
// and the index.js server. It handles event creation, resets, and loading data.

import { loadMatchday, loadNextMatchday, loadTable, reloadTeamFiles, saveReferees, sendEvent } from './index.js';

let event = {};

const STANDALONE_EVENTS = [
	'TOGGLE_SCOREBOARD',
	'SHOW_BOTTOM_SCOREBOARD',
	'SHOW_FOULS',
	'CASTER',
	'START_TIMER',
	'HALFTIME_TIMER',
	'LIVE_TABLE',
	'LIVE_MATCHDAY',
	'LINEUP',
	'NEXT_MATCHDAY',
];

const EVENT_ACTIONS = {
	['TABLE']: showTable,
	['SHOW_REFEREES']: showReferees,
	['MATCHDAY']: showMatchday,
	['NEXT_MATCHDAY']: showNextMatchday,
	['REFRESH']: refresh,
};

export function onInput(input, options) {
	input = input.toUpperCase().trim();

	if (input === 'ADD_TIME') {
		changeTime(options);
		return;
	}

	if (input === 'HOME') {
		event.team = 'HOME';
	} else if (input === 'AWAY') {
		event.team = 'AWAY';
	} else {
		event.eventType = input;
	}

	if (EVENT_ACTIONS[input]) {
		EVENT_ACTIONS[input]();
		return;
	}

	if (STANDALONE_EVENTS.includes(input)) {
		sendEvent(event);
		event = {};
		return;
	}

	if (event.eventType && event.team) {
		sendEvent(event);
		event = {};
	}
}

function showTable() {
	loadTable().then(() => {
		sendStandaloneEvent('TABLE');
	});
}

function showReferees() {
	saveReferees().then(() => {
		sendStandaloneEvent('REFEREES');
	});
}

function showMatchday() {
	loadMatchday().then(() => {
		sendStandaloneEvent('MATCHDAY');
	});
}

function showNextMatchday() {
	loadNextMatchday().then(() => {
		sendStandaloneEvent('NEXT_MATCHDAY');
	});
}

function refresh() {
	reloadTeamFiles();
	loadMatchday(true);
	loadTable(true);
	saveReferees(true);
	// updateLineup(true);
	sendStandaloneEvent('REFRESH');
}

function changeTime(time) {
	sendEvent({
		eventType: 'ADD_TIME',
		time,
	});
}

function sendStandaloneEvent(type) {
	sendEvent({
		eventType: type,
	});
}
