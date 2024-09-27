const defaultTime = 20 * 60 * 1000;
let endtime = null;
let totaltime = null;
let startDate = null;
let stepper = null;

function handleTimerEvent(event) {
	switch (event.eventType) {
		case 'START_TIMER':
			if (stepper === null) {
				startTimer();
			} else {
				pauseTimer();
			}
			break;
		case 'RESET_TIMER':
			resetTimer(defaultTime, defaultTime);
			break;
		case 'ADD_TIME':
			endtime += event.time;
			break;
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
	$('#time').text(text);

	if (d <= 0) {
		clear();
	}
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

function resetTimer(time, totalTime) {
	totaltime = totalTime;
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
