// This file is supposed to be the middle point between input devices (e.g. streamdeck, keyboard, comapanion)
// and the index.js server. It handles event creation, resets, and loading data.

import { sendEvent } from './index.js';
import { readMatchday, readNextMatchday, readReferees, readTable } from './AufstellungParser.js';

const DEFAULT_EVENT = { number: '' };

let event = { ...DEFAULT_EVENT };

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
	'INTERVIEW'
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

const NUMBER_EVENTS = ['SHOW_GOAL', 'SHOW_YELLOW_CARD', 'SHOW_RED_CARD', 'SHOW_OWN_GOAL'];

export function addListener(listener) {
	listeners.push(listener);
}

export async function onInput(input, options) {
	input = input.toUpperCase().trim();

	if (input === 'ADD_TIME') {
		changeTime(options);
		return;
	}

	if (input === 'HOME' || input === 'AWAY') {
		if (input === 'HOME') {
			event.team = 'HOME';
		} else {
			event.team = 'AWAY';
		}
		for (const listener of listeners) {
			listener({ team: event.team ?? '' });
		}
	} else if (input === 'NUMBER') {
		event.number += options;
		for (const listener of listeners) {
			listener({ number: event.number ?? '' });
		}
		// This return is needed to prevent sending events too early with double-digint numbers
		return;
	} else if (input === 'CLEAR_NUMBER') {
		event.number = '';
		for (const listener of listeners) {
			listener({ number: event.number ?? '' });
		}
		return;
	} else {
		event.eventType = input;
	}

	if (EVENT_ACTIONS[input]) {
		await EVENT_ACTIONS[input]();
	}

	if (STANDALONE_EVENTS.includes(input)) {
		sendAndReset();
		return;
	}

	// For events that need numbers (goal, cards) wait until team + number is there
	if (event.eventType && event.team) {
		if (NUMBER_EVENTS.includes(event.eventType) && !event.number) {
			return;
		}
		sendAndReset();
	}
}

function sendAndReset() {
	addEventData(event);
	sendEvent(event);
	const originalEvent = event;
	if (event.eventType === 'GOAL') {
		// Keep team info to make following show goal easier
		event = { ...DEFAULT_EVENT, team: originalEvent.team };
	} else if (!event.eventType.startsWith('SHOW')) {
		event = { ...DEFAULT_EVENT, number: originalEvent.number };
	} else {
		event = { ...DEFAULT_EVENT };
	}
	for (const listener of listeners) {
		listener({ team: '', number: '' });
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
