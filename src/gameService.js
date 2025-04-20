import { Timer } from './timer.js';
import fs from 'fs';

const HOME_PATH = 'data/home.json';
const AWAY_PATH = 'data/away.json';

const FUTSAL_MATCH_TIME = 20 * 60 * 1000; // 20 minutes
const FUTSAL_HALFTIME_TIME = (14 * 60 + 30) * 1000; // 14:30 minutes

const BEACHSOCCER_MATCH_TIME = 12 * 60 * 1000; // 12 minutes

const DEFAULT_MATCH_TIME = BEACHSOCCER_MATCH_TIME;
const HALFTIME_TIME = FUTSAL_HALFTIME_TIME; // TODO

const debug = true;

export class GameService {
	constructor(sendEvent, sendWS) {
		this.sendEvent = sendEvent;
		this.sendWS = sendWS;
		this.homeTeam = JSON.parse(fs.readFileSync(HOME_PATH, 'utf-8'));
		this.awayTeam = JSON.parse(fs.readFileSync(AWAY_PATH, 'utf-8'));
		this.halftimeTimer = new Timer(HALFTIME_TIME, (text) => {
			this.sendWS('half', text);
		});

		this.redCardTimers = [];
		this.goalEvents = [];
		this.scoreHome = 0;
		this.scoreAway = 0;
		this.foulsHome = 0;
		this.foulsAway = 0;
		this.matchTimer = new Timer(
			DEFAULT_MATCH_TIME,
			(text) => {
				this.sendWS('game', text);
			},
			() => {
				setTimeout(() => {
					this.sendEvent({ eventType: 'SECOND_HALF' });
					this.sendEvent({ eventType: 'CLEAR_FOULS' });
					// This callback is delayed and the section is already updated.
					if (this.matchTimer.getSection() === 2) {
						this.sendEvent({ eventType: 'HALFTIME_TIMER' });
					}
					this.matchTimer.resetTimer();
				}, 10_000);
			},
		);
	}

	reset() {
		this.homeTeam = JSON.parse(fs.readFileSync(HOME_PATH, 'utf-8'));
		this.awayTeam = JSON.parse(fs.readFileSync(AWAY_PATH, 'utf-8'));
		this.redCardTimers = [];
		this.goalEvents = [];
		this.scoreHome = 0;
		this.scoreAway = 0;
		this.foulsHome = 0;
		this.foulsAway = 0;
		this.matchTimer.resetTimer();
		this.halftimeTimer.resetTimer();
	}

	reloadTeamFiles() {
		const newHome = JSON.parse(fs.readFileSync(HOME_PATH, 'utf-8'));
		const newAway = JSON.parse(fs.readFileSync(AWAY_PATH, 'utf-8'));
		newHome.players = this.homeTeam.players;
		newAway.players = this.awayTeam.players;
		this.homeTeam = newHome;
		this.awayTeam = newAway;
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
			this.pauseTimer();
		} else if (event.eventType === 'OWN_GOAL') {
			this.reduceScore(event.team === 'HOME');
		}

		if (event.eventType === 'FOUL') {
			this.addFoul(event.team === 'HOME');
			this.pauseTimer();
		} else if (event.eventType === 'REMOVE_FOUL') {
			this.reduceFoul(event.team === 'HOME');
		} else if (event.eventType === 'CLEAR_FOULS') {
			this.foulsHome = this.foulsAway = 0;
		}

		if (event.eventType === 'RED_CARD') {
			this.pauseTimer();
			this.addRedCardTimer(event);
		}

		if (event.eventType === 'REFRESH') {
			this.reloadTeamFiles();
		}

		if (event.eventType === 'SHOW_GOAL' || event.eventType === 'SHOW_OWN_GOAL') {
			this.addGoalScorerAction(event);
		}

		this.addEventData(event, this.getTeam(event.team));

		if (debug) {
			console.log(event);
		}
		return false;
	}

	pauseTimer() {
		if (this.matchTimer.isRunning()) {
			this.matchTimer.pauseTimer();
			for (const timer of this.redCardTimers) {
				timer.pauseTimer();
			}
		}
	}

	addGoalScorerAction(event) {
		const player = this.findPlayer(this.getTeam(event.team).players, event.number);
		let team = event.team;
		const ownGoal = event.eventType === 'SHOW_OWN_GOAL';
		if (ownGoal) {
			// Flip team to show it on the correct side in report
			team = team === 'HOME' ? 'AWAY' : 'HOME';
		}
		if (player) {
			// 18:43
			const time = this.matchTimer.getTimeText();
			if (time) {
				// 18
				const timerMinute = +time.split(':')[0];
				// 2
				const gameMinute = 20 - timerMinute + (this.matchTimer.section === 2 ? 20 : 0);
				this.goalEvents.push({
					player: player,
					minute: gameMinute,
					team,
					scoreHome: this.scoreHome,
					scoreAway: this.scoreAway,
					ownGoal,
				});
			}
		}
	}

	addEventData(event, team) {
		if (event.eventType === 'LINEUP') {
			event.players = team.players;
		} else if (event.eventType === 'SHOW_COACH') {
			event.coach = team.coach;
		} else if (event.eventType === 'SHOW_GOAL') {
			this.increasePlayerProperty(team, event, 'goals');
		} else if (event.eventType === 'SHOW_YELLOW_CARD') {
			this.increasePlayerProperty(team, event, 'yellowCards');
		} else if (event.eventType === 'SHOW_RED_CARD') {
			event.player = this.findPlayer(team.players, event.number);
		} else if (event.eventType === 'SHOW_BOTTOM_SCOREBOARD') {
			event.goalEvents = this.goalEvents;
		} else if (event.eventType === 'SHOW_OWN_GOAL') {
			event.player = this.findPlayer(team.players, event.number);
		} else if (event.eventType === 'SHOW_INTERVIEW') {
			event.player = this.findPlayer(team.players, event.number);
		}
	}

	increasePlayerProperty(team, event, property) {
		event.player = this.findPlayer(team.players, event.number);
		if (!event.player) {
			console.warn('Player not found:', event.number);
			return;
		}
		if (event.player[property]) {
			event.player[property]++;
		} else {
			event.player[property] = 1;
		}
	}

	findPlayer(players, number) {
		return players.find((player) => player.number == number);
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
