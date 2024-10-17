'use strict';

function handleEventInternal(event) {}

function updateScoreboardInternal() {
	if (scoreHome >= 10) {
		$('#homeScore').css('left', '580px');
	}
}

function updateTimerFromServer() {
	$.ajax({
		method: 'GET',
		url: `/time/half`,
	})
		.done((value) => {
			if (value === '00:00') {
				$('#time').text('');
			} else {
				$('#time').text(value.length ? value : '');
			}
		})
		.catch((error) => {
			console.log(error);
		});
}

$(() => {
	setInterval(() => {
		updateTimerFromServer();
	}, 500);
});
