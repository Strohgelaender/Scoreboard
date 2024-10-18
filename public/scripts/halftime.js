'use strict';

function handleEventInternal(event) {}

function updateScoreboardInternal() {
	if (scoreHome >= 10) {
		$('#homeScore').css('left', '580px');
	}
}

function updateTimerFromServer() {
	createWebsocket('time/half', (value) => {
		const time = value.data;
		if (time === '00:00') {
			$('#time').text('');
		} else {
			$('#time').text(time.length ? time : '');
		}
	});
}

$(() => {
	updateTimerFromServer();
});
