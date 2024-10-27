'use strict';

function handleEventInternal(event) {}

function updateScoreboardInternal() {
	if (scoreHome >= 10) {
		document.getElementById('homeScore').style.left = '580px';
	}
}

function updateTimerFromServer() {
	createWebsocket('time/half', (value) => {
		const time = value.data;
		if (time === '00:00') {
			setText('time', '');
		} else {
			setText('time', time.length ? time : '');
		}
	});
}

document.addEventListener('DOMContentLoaded', () => {
	updateTimerFromServer();
});
