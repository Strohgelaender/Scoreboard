import readline from 'readline';

export class Keyboard {
	constructor(eventEmitter) {
		this.eventEmitter = eventEmitter;
		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		this.rl.on('line', (input) => {
			input = input.trim().toUpperCase();
			this.handleInput(input);
		});
	}

	handleInput(input) {
		if (typeof this.eventEmitter !== 'function') {
			return;
		}

		switch (input) {
			case 'HOME':
				this.eventEmitter('HOME');
				break;
			case 'AWAY':
				this.eventEmitter('AWAY');
				break;
			case 'GOAL':
				this.eventEmitter('GOAL');
				break;
			case 'OWN GOAL':
			case 'OWN_GOAL':
			case 'REMOVE GOAL':
			case 'REMOVE_GOAL':
			case 'DELETE GOAL':
			case 'DELETE_GOAL':
				this.eventEmitter('OWN_GOAL');
				break;
			case 'FOUL':
				this.eventEmitter('FOUL');
				break;
			case 'REMOVE FOUL':
			case 'REMOVE_FOUL':
				this.eventEmitter('REMOVE_FOUL');
				break;
			case 'RED':
			case 'RED_CARD':
			case 'RED CARD':
				this.eventEmitter('RED_CARD');
				break;
			case 'CLEAR':
			case 'CLEAR_FOULS':
			case 'CLEAR FOULS':
				this.eventEmitter('CLEAR_FOULS');
				return;
			case 'SHOW FOULS':
			case 'SHOW_FOULS':
				this.eventEmitter('SHOW_FOULS');
				return;
			case 'LINEUP':
				this.eventEmitter('LINEUP');
				return;
			case 'REFEREES':
			case 'REF':
			case 'REFS':
				this.eventEmitter('SHOW_REFEREES');
				return;
			case 'SCOREBOARD':
			case 'TOGGLE_SCOREBOARD':
			case 'TOGGLE':
				this.eventEmitter('TOGGLE_SCOREBOARD');
				return;
			case 'BOTTOM':
			case 'BOTTOM_SCOREBOARD':
			case 'BIG':
				this.eventEmitter('SHOW_BOTTOM_SCOREBOARD');
				return;
			case 'CASTER':
			case 'LOWER':
				this.eventEmitter('CASTER');
				return;
			case 'START':
			case 'START_TIMER':
				this.eventEmitter('START_TIMER');
				return;
			case 'RESET':
			case 'RESET_TIMER':
				this.eventEmitter('RESET_TIMER');
				return;
			case 'TABLE':
				this.eventEmitter('TABLE');
				return;
			case 'MATCHES':
			case 'MATCHDAY':
				this.eventEmitter('MATCHDAY');
				return;
			case 'NEXT MATCHES':
			case 'NEXT MATCHDAY':
			case 'NEXT_MATCHES':
			case 'NEXT_MATCHDAY':
				this.eventEmitter('NEXT_MATCHDAY');
				return;
			case 'REFRESH':
				this.eventEmitter('REFRESH');
				return;
			case 'LIVE_TABLE':
			case 'LIVE TABLE':
				this.eventEmitter('LIVE_TABLE');
				return;
			case 'LIVE MATCHES':
			case 'LIVE MATCHDAY':
			case 'LIVE_MATCHES':
			case 'LIVE_MATCHDAY':
				this.eventEmitter('LIVE_MATCHDAY');
				return;
		}
	}
}
