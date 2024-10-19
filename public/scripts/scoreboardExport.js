'use strict';

$(() => {
	loadTeams();
});

function loadTeams() {
	$.ajax({
		method: 'GET',
		url: `/data/info`,
	})
		.done((value) => {
			const home = value.home;
			const away = value.away;

			$('#homeName').text(home.name);
			$('#awayName').text(away.name);

			$(`#homeShirtLine`).css('background-color', home.shirtColor);
			$(`#awayShirtLine`).css('background-color', away.shirtColor);
		})
		.catch(error => console.log(error));
}

function handleEventInternal(event) {
	switch (event.eventType) {
		case 'GOAL':
		case 'OWN_GOAL':
			saveScoreboardScreenshot();
			break;
	}
}

function saveScoreboardScreenshot() {
	const scoreboard = document.getElementById("scoreboard");
	const scale = 4;
	domtoimage.toPng(scoreboard, {
		width: scoreboard.clientWidth * scale,
		height: scoreboard.clientHeight * scale,
		style: {
			display: 'inherit',
			transform: 'scale('+scale+')',
			transformOrigin: 'top left'
		}}).then(dataUrl => {
		saveImageOnServer(dataUrl);
	})
		.catch(error => console.error('oops, something went wrong!', error));
}

function saveImageOnServer(dataUrl) {
	$.ajax({
		method: 'POST',
		url: `/saveScoreboard`,
		contentType: 'application/json',
		data: JSON.stringify({dataUrl}),
	})
		.done(console.log)
		.catch((error) => {
			console.log(error);
		});
}

function updateScoreboardInternal() {
	if (scoreHome >= 10) {
		// TODO
		// $('#homeScore').css('left', '580px');
	}
}
