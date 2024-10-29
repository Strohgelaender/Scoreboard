import { Timer } from './timer.js';
import fs from 'fs';

const HOME_PATH = 'data/home.json';
const AWAY_PATH = 'data/away.json';

const debug = true;

export class GameService {
	constructor(sendEvent, sendWS) {
		this.sendEvent = sendEvent;
		this.sendWS = sendWS;
		this.homeTeam = JSON.parse(fs.readFileSync(HOME_PATH, 'utf-8'));
		this.awayTeam = JSON.parse(fs.readFileSync(AWAY_PATH, 'utf-8'));
		this.halftimeTimer = new Timer(14 * 60 * 1000, (text) => {
			this.sendWS('half', text);
		});

		this.redCardTimers = [];
		this.scoreHome = 0;
		this.scoreAway = 0;
		this.foulsHome = 0;
		this.foulsAway = 0;
		this.matchTimer = new Timer(
			20 * 60 * 1000,
			(text) => {
				this.sendWS('game', text);
			},
			() => {
				// TODO is this true?
				/*for (const timer of redCardTimers) {
					timer.resetTimer();
				}
				redCardTimers = [];*/

				setTimeout(() => {
					this.sendEvent({ eventType: 'SECOND_HALF' });
					this.sendEvent({ eventType: 'CLEAR_FOULS' });
					this.matchTimer.resetTimer();
				}, 10000);
			},
		);
	}

	reloadTeamFiles() {
		this.homeTeam = JSON.parse(fs.readFileSync(HOME_PATH, 'utf-8'));
		this.awayTeam = JSON.parse(fs.readFileSync(AWAY_PATH, 'utf-8'));
	}

	getTeam(specifier) {
		return specifier === 'HOME' ? this.homeTeam : this.awayTeam;
	}

	handleEvent(event) {
		if (this.matchTimer.handleTimerEvent(event)) {
			// true if event got picked up by timer
			for (const timer of this.redCardTimers) {
				timer.handleTimerEvent(event);
			}
			return true;
		} else if (event.eventType === 'HALFTIME_TIMER') {
			this.halftimeTimer.startTimer();
			return true;
		}

		if (event.eventType === 'GOAL') {
			this.addScore(event.team === 'HOME');
			this.handleRedCardGoal(event);
		} else if (event.eventType === 'OWN_GOAL') {
			this.reduceScore(event.team === 'HOME');
		}

		if (event.eventType === 'FOUL') {
			this.addFoul(event.team === 'HOME');
		} else if (event.eventType === 'REMOVE_FOUL') {
			this.reduceFoul(event.team === 'HOME');
		} else if (event.eventType === 'CLEAR_FOULS') {
			this.foulsHome = this.foulsAway = 0;
		}

		if (event.eventType === 'RED_CARD') {
			this.addRedCardTimer(event);
		}

		if (event.eventType === 'REFRESH') {
			this.reloadTeamFiles();
		}

		if (debug) {
			console.log(event);
		}
		return false;
	}

	handleRedCardGoal(event) {
		if (this.redCardTimers.length === 1) {
			// We do not support multiple red cards per team yet.
			// 1 timer means only one team with a red card -> goal could change that
			// 2 timers -> both teams with red card -> goal does not change anything
			const timer = this.redCardTimers[0];
			if (timer.getTeam() !== event.team) {
				this.sendEvent({
					eventType: 'CLEAR_RED_CARD',
					team: timer.getTeam(),
				});
				timer.resetTimer();
				this.redCardTimers = [];
			}
		}
	}

	addRedCardTimer(event) {
		const timer = new Timer(
			2 * 60 * 1000,
			(text) => {
				this.sendWS(`red${event.team.toLowerCase()}`, text);
			},
			() => {
				// remove timer from list on finish
				this.redCardTimers.splice(this.redCardTimers.indexOf(timer), 1);
			},
			event.team,
		);
		if (this.matchTimer.isRunning()) {
			timer.startTimer();
		}
		this.redCardTimers.push(timer);
	}

	addScore(homeTeam) {
		if (homeTeam) {
			this.scoreHome += 1;
		} else {
			this.scoreAway += 1;
		}
	}

	reduceScore(homeTeam) {
		if (homeTeam) {
			if (this.scoreHome > 0) {
				this.scoreHome -= 1;
			}
		} else {
			if (this.scoreAway > 0) {
				this.scoreAway -= 1;
			}
		}
	}

	addFoul(homeTeam) {
		if (homeTeam) {
			this.foulsHome += 1;
		} else {
			this.foulsAway += 1;
		}
	}

	reduceFoul(homeTeam) {
		if (homeTeam) {
			if (this.foulsHome > 0) {
				this.foulsHome -= 1;
			}
		} else {
			if (this.foulsAway > 0) {
				this.foulsAway -= 1;
			}
		}
	}
}
