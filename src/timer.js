export class Timer {
	constructor(defaultTime, stepFunction = undefined, callback = undefined, team = undefined) {
		this.defaultTime = defaultTime;
		this.endtime = null;
		this.totaltime = null;
		this.startDate = null;
		this.stepper = null;
		this.timeText = null;
		this.section = 1;
		this.team = team;
		this.callback = callback;
		this.stepFunction = stepFunction;
		this.onPause = null;
	}

	handleTimerEvent(event) {
		switch (event.eventType) {
			case 'START_TIMER':
				this.toggleTimer();
				return true;
			case 'RESET_TIMER':
				this.resetTimer();
				return true;
			case 'ADD_TIME':
				this.addTime(event.time);
				return true;
		}
		return false;
	}

	addTime(time) {
		const now = Date.now();
		this.totaltime += time * 1000;
		if (this.isRunning()) {
			this.endtime += time * 1000;
		} else {
			this.endtime = now + this.totaltime;
		}
		this.displayTime(this.endtime - now);
	}

	toggleTimer() {
		if (!this.isRunning()) {
			this.startTimer();
		} else {
			this.pauseTimer();
		}
	}

	displayTime(d) {
		let min = 0,
			sec = 0;

		if (d > 0) {
			const dd = d;

			d = Math.floor(d / 1000);
			sec = d % 60;
			d = Math.floor(d / 60);
			min = d;

			d = dd;
		}

		let text = '';
		text = (min < 10 ? '0' : '') + min + ':';
		text += (sec < 10 ? '0' : '') + sec;

		if (this.timeText !== text) {
			this.timeText = text;
			this.stepFunction?.(text);
		}

		if (d <= 0) {
			if (this.callback) {
				this.callback();
			}
			this.section++;
			this.clear();
		}
	}

	getTimeText() {
		return this.timeText;
	}

	isFirstHalfDone() {
		return this.section === 2;
	}

	getSection() {
		return this.section;
	}

	getTeam() {
		return this.team;
	}

	startTimer() {
		if (this.totaltime === null) {
			this.totaltime = this.defaultTime;
		}
		this.startDate = Date.now();
		this.endtime = this.startDate + this.totaltime;
		this.stepper = setInterval(() => {
			this.displayTime(Date.now() - this.startDate);
		}, 100);
		if (this.onPause) {
			this.onPause(this.isRunning());
		}
	}

	resetTimer(time = this.defaultTime, totalTime = this.defaultTime) {
		this.totaltime = totalTime;
		this.endtime = null;
		this.displayTime(time);
		this.clear();
		if (this.onPause) {
			this.onPause(this.isRunning());
		}
	}

	pauseTimer() {
		this.totaltime = this.endtime - Date.now();
		clearInterval(this.stepper);
		this.stepper = null;
		if (this.onPause) {
			this.onPause(this.isRunning());
		}
	}

	clear() {
		this.endtime = null;
		this.totaltime = null;
		clearInterval(this.stepper);
		this.stepper = null;
	}

	isRunning() {
		return this.stepper !== null;
	}
}
