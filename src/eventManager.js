// This file is supposed to be the middle point between input devices (e.g. streamdeck, keyboard, comapanion)
// and the index.js server. It handles event creation, resets, and loading data.

import { sendEvent } from './index.js';
import { readMatchday, readNextMatchday, readReferees, readTable } from './AufstellungParser.js';

let event = {};

let referees = [];
let table;
let matchday;
let nextMatchday;

let listeners = [];

const STANDALONE_EVENTS = [
	'TOGGLE_SCOREBOARD',
	'SHOW_BOTTOM_SCOREBOARD',
	'SHOW_FOULS',
	'CASTER',
	'START_TIMER',
	'HALFTIME_TIMER',
	'TABLE',
	'LIVE_TABLE',
	'LIVE_MATCHDAY',
	'NEXT_MATCHDAY',
	'MATCHDAY',
	'LINEUP',
	'SHOW_REFEREES',
	'CLEAR_FOULS',
];

const EVENT_ACTIONS = {
	['SHOW_REFEREES']: saveReferees,
	['TABLE']: loadTable,
	['LIVE_TABLE']: loadTable,
	['MATCHDAY']: loadMatchday,
	['LIVE_MATCHDAY']: loadMatchday,
	['NEXT_MATCHDAY']: loadNextMatchday,
	['REFRESH']: refresh,
};

export function addListener(listener) {
	listeners.push(listener);
}

export async function onInput(input, options) {
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

	for (const listener of listeners) {
		listener(event.team ?? '');
	}

	if (EVENT_ACTIONS[input]) {
		await EVENT_ACTIONS[input]();
	}

	if (STANDALONE_EVENTS.includes(input)) {
		sendAndReset();
		return;
	}

	if (event.eventType && event.team) {
		sendAndReset();
	}
}

function sendAndReset() {
	addEventData(event);
	sendEvent(event);
	event = {};
	for (const listener of listeners) {
		listener('');
	}
}

function addEventData(event) {
	if (event.eventType === 'SHOW_REFEREES') {
		event.referees = referees;
	} else if (event.eventType === 'TABLE') {
		event.table = table;
	} else if (event.eventType === 'MATCHDAY' || event.eventType === 'LIVE_MATCHDAY') {
		event.matchday = matchday;
	} else if (event.eventType === 'LIVE_TABLE') {
		event.table = table;
		event.matchday = matchday;
	} else if (event.eventType === 'NEXT_MATCHDAY') {
		event.matchday = nextMatchday;
	}
}

async function refresh() {
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
	event = { eventType: type };
	addEventData(event);
	sendAndReset();
}

async function saveReferees(force = false) {
	if (force || !referees?.length) {
		referees = await readReferees();
	}
}

async function loadTable(force = false) {
	if (force || !table) {
		table = await readTable();
	}
}

async function loadMatchday(force = false) {
	if (force || !matchday) {
		matchday = await readMatchday();
	}
}

async function loadNextMatchday(force = false) {
	if (force || !nextMatchday) {
		nextMatchday = await readNextMatchday();
	}
}
