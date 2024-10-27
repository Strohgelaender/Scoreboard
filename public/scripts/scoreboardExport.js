'use strict';

document.addEventListener("DOMContentLoaded", () => {
	loadTeams();
});

function loadTeams() {
	fetch('/data/info', { method: 'GET' })
		.then((response) => response.json())
		.then((value) => {
			const home = value.home;
			const away = value.away;

			setText('homeName', home.name);
			setText('awayName', away.name);

			document.getElementById('homeShirtLine').style.backgroundColor = home.shirtColor;
			document.getElementById('awayShirtLine').style.backgroundColor = away.shirtColor;
		}).catch((console.error));
}

function handleEventInternal(event) {
	switch (event.eventType) {
		case 'GOAL':
		case 'OWN_GOAL':
			saveScoreboardScreenshot();
			break;
		case 'REFRESH':
			loadTeams();
			break;
	}
}

function saveScoreboardScreenshot() {
	const scoreboard = document.getElementById('scoreboard');
	const scale = 4;
	domtoimage
		.toPng(scoreboard, {
			width: scoreboard.clientWidth * scale,
			height: scoreboard.clientHeight * scale,
			style: {
				display: 'inherit',
				transform: 'scale(' + scale + ')',
				transformOrigin: 'top left',
			},
		})
		.then((dataUrl) => {
			saveImageOnServer(dataUrl);
		})
		.catch((error) => console.error('oops, something went wrong!', error));
}

function saveImageOnServer(dataUrl) {
	fetch('/saveScoreboard', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ dataUrl }),
	})
		.then(console.log)
		.catch(console.error);
}

function updateScoreboardInternal() {
	if (scoreHome >= 10) {
		document.getElementById("homeScore").style.left = "380px";
	}
}
