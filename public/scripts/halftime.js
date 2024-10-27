'use strict';

function handleEventInternal(event) {}

function updateScoreboardInternal() {
	if (scoreHome >= 10) {
		document.getElementById("homeScore").style.left = "580px";
	}
}

function updateTimerFromServer() {
	createWebsocket('time/half', (value) => {
		const time = value.data;
		const timeElement = document.getElementById("time");
		if (time === '00:00') {
			timeElement.textContent = '';
		} else {
			timeElement.textContent = time.length ? time : '';
		}
	});
}

document.addEventListener("DOMContentLoaded", () => {
	updateTimerFromServer();
});
