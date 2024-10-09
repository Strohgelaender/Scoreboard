const defaultTime = 20 * 60 * 1000;
let endtime = null;
let totaltime = null;
let startDate = null;
let stepper = null;
let timeText = null;

export default {
	getTimeText,
	handleTimerEvent,
	resetTimer,
	toggleTimer,
	pauseTimer,
	isRunning,
};

function handleTimerEvent(event) {
	switch (event.eventType) {
		case 'START_TIMER':
			toggleTimer();
			return true;
		case 'RESET_TIMER':
			resetTimer();
			return true;
		case 'ADD_TIME':
			addTime(event.time);
			return true;
	}
	return false;
}

function addTime(time) {
	const now = Date.now();
	totaltime += time * 1000;
	if (isRunning()) {
		endtime += time * 1000;
	} else {
		endtime = now + totaltime;
	}
	displayTime(endtime - now);
}

function toggleTimer() {
	if (!isRunning()) {
		startTimer();
	} else {
		pauseTimer();
	}
}

function displayTime(d) {
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
	timeText = text;

	if (d <= 0) {
		clear();
	}
}

function getTimeText() {
	return timeText;
}

function startTimer() {
	if (totaltime === null) {
		totaltime = defaultTime;
	}
	startDate = Date.now();
	endtime = startDate + totaltime;
	stepper = setInterval(function () {
		displayTime(endtime - Date.now());
	}, 100);
}

function resetTimer(time = defaultTime, totalTime = defaultTime) {
	totaltime = totalTime;
	endtime = null;
	displayTime(time);
	clear();
}

function pauseTimer() {
	totaltime = endtime - Date.now();
	clearInterval(stepper);
	stepper = null;
}

function clear() {
	endtime = null;
	totaltime = null;
	clearInterval(stepper);
	stepper = null;
}

function isRunning() {
	return stepper !== null;
}
