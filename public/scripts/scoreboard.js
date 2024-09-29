'use strict';

let showingLineup = false;
let showingRefs = false;
let showingSmallScoreboard = true;
let showingBigScoreboard = false;
let showingLowerThird = false;
let fullNames;
let teamImages;

$(() => {
	loadTeams();
	setInterval(() => {
		updateTimerFromServer();
	}, 1000);
});

function loadTeams() {
	$.ajax({
		method: 'GET',
		url: `/data/info`,
	})
		.done((value) => {
			const home = value.home;
			const away = value.away;

			fullNames = [home.fullName, away.fullName];
			teamImages = [home.imagePath, away.imagePath];

			$('#homeName').text(home.name);
			$('#awayName').text(away.name);
			$('#homeTimeName').text(home.name);
			$('#awayTimeName').text(away.name);

			$('#bigHomeName').text(home.fullName);
			$('#bigAwayName').text(away.fullName);

			$(`#homeShirtLine`).css('background-color', home.shirtColor);
			$(`#awayShirtLine`).css('background-color', away.shirtColor);
			$(`#homeTimeShirtLine`).css('background-color', home.shirtColor);
			$(`#awayTimeShirtLine`).css('background-color', away.shirtColor);
		})
		.catch((error) => {
			console.log(error);
		});
}

function updateTimerFromServer() {
	$.ajax({
		method: 'GET',
		url: `/time`,
	}).done((value) => {
		$('#time').text(value.length ? value : '20:00');
	}).catch((error) => {
		console.log(error);
	});
}

function handleEventInternal(event) {
	switch (event.eventType) {
		case 'GOAL':
		case 'OWN_GOAL':
			if (event.hasOwnProperty('playerData')) {
				//showLowerThirds(event);
			}
			updateScoreboardInternal();
			break;
		case 'TOGGLE_SCOREBOARD':
			toggleScoreboard();
			break;
		case 'SHOW_BOTTOM_SCOREBOARD':
			toggleBigScoreboard();
			break;
		case 'SHOW_NAMES':
			showLowerThirds('.blendNames');
			break;
		case 'SHOW_RIGHT':
			showLowerThirds('.blendRight');
			break;
		case 'SHOW_LEFT':
			showLowerThirds('.blendLeft');
			break;
		case 'SHOW_EXTRA':
			if (event.text) showExtra(event.text, 10000);
			break;
		case 'LINEUP':
			animateLineup(event.team === 'HOME' ? 0 : 1, event.playerData);
			break;
		case 'REFEREES':
			if (!showingRefs) {
				updateRefText(event.playerData);
			}
			animateReferees();
			break;
		case 'CASTER':
			toggleLowerThird();
			break;
		case 'FOUL':
		case 'REMOVE_FOUL':
		case 'CLEAR_FOULS':
			updateFouls();
			break;
	}
}

function toggleScoreboard() {
	if (!showingSmallScoreboard) {
		$('#scoreboardTime').css('animation', 'revealCenter 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#scoreboardSpielfeldCircle').css('animation', 'ScoreboardSpielfeldIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#homeTimeImage').css('animation', 'growImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#awayTimeImage').css('animation', 'growImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#time').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#homeTimeName').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#awayTimeName').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#homeTimeScore').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#awayTimeScore').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
	} else {
		$('#scoreboardTime').css('animation', 'revealCenterOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#scoreboardSpielfeldCircle').css('animation', 'ScoreboardSpielfeldOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#homeTimeImage').css('animation', 'hideImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#awayTimeImage').css('animation', 'hideImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#time').css('animation', 'opacityOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#homeTimeName').css('animation', 'opacityOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#awayTimeName').css('animation', 'opacityOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#homeTimeScore').css('animation', 'opacityOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#awayTimeScore').css('animation', 'opacityOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
	}
	showingSmallScoreboard = !showingSmallScoreboard;
}

function toggleBigScoreboard() {
	console.log('toggleBigScoreboard');
	if (!showingBigScoreboard) {
		$('#bottomScore').css('animation', 'revealCenter 2s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bottomSpielfeldCircle').css('animation', 'spielfeldBottom 2s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		setTimeout(() => {
			$('#bigHomeImage').css('animation', 'growImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#bigAwayImage').css('animation', 'growImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#bigHomeName').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#bigAwayName').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#bigHomeScore').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#bigAwayScore').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		}, 300);
	} else {
		$('#bottomScore').css('animation', 'revealCenterOut 1.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigHomeImage').css('animation', 'hideImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigAwayImage').css('animation', 'hideImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigHomeName').css('animation', 'opacityOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigAwayName').css('animation', 'opacityOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigHomeScore').css('animation', 'opacityOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigAwayScore').css('animation', 'opacityOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bottomSpielfeldCircle').css('animation', 'spielfeldBottomOut 1.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
	}
	showingBigScoreboard = !showingBigScoreboard;
}

function toggleLowerThird() {
	if (!showingLowerThird) {
		$('#lowerMainContent').css('animation', 'revealCenter 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#lowerMainText').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		setTimeout(() => {
			$('#lowerSubAdditionalBackground').css('animation', 'revealDown 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#lowerSubContent').css('animation', 'revealDown 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		}, 500);
	} else {
		$('#lowerSubContent').css('animation', 'revealDownOut 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		setTimeout(() => {
			$('#lowerSubAdditionalBackground').css('animation', 'revealDownOut 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		}, 200);
		setTimeout(() => {
			$('#lowerMainContent').css('animation', 'revealCenterOut 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#lowerMainText').css('animation', 'opacityOut 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		}, 600);
	}
	showingLowerThird = !showingLowerThird;
}

function updateScoreboardInternal() {
	updateScore();
	updateFouls();
	doubleDigitAdjustments();
}

function updateScore() {
	$('#bigHomeScore').text(scoreHome);
	$('#bigAwayScore').text(scoreAway);
	$('#homeTimeScore').text(scoreHome);
	$('#awayTimeScore').text(scoreAway);
}

function doubleDigitAdjustments() {
	if (scoreHome >= 10) {
		$('#bigHomeScore').css('left', '600px');
		$('#homeScore').css('left', '355px');
		// TODO time score
	}
	if (scoreAway >= 10) {
		$('#bigAwayScore').css('left', '695px');
		$('#awayScore').css('left', '390px');
		// TODO time score
	}
}

function updateFouls() {
	updateFoulsContent($('#homeTimeFoulsBox'), $('#homeTimeFouls'), foulsHome);
	updateFoulsContent($('#awayTimeFoulsBox'), $('#awayTimeFouls'), foulsAway);
}

function updateFoulsContent(foulsBox, foulsText, fouls) {
	if (fouls > 0 && foulsBox.css('display') === 'none') {
		foulsBox.fadeIn(1000);
		foulsText?.text(foulsToText(fouls));
	} else if (fouls === 0) {
		foulsBox.fadeOut(1000, () => foulsText?.text(''));
	} else {
		foulsText?.text(foulsToText(fouls));
	}
}

function foulsToText(fouls) {
	let result = '';
	while (fouls >= 5) {
		result += 'V';
		fouls -= 5;
	}
	result += '|'.repeat(fouls);
	return result;
}

function animateLineup(team, players) {
	const startingPlayersTable = $('#startingPlayers');
	const substitutePlayersTable = $('#substitutePlayers');

	if (!showingLineup) {
		$('#aufstellungTeamname').text(fullNames[team]);
		const logo = $('#aufstellungLogo');
		logo.attr('src', teamImages[team]);

		players = players.sort((a, b) => +a.number - +b.number);
		for (const player of players) {
			createPlayerRow(player, player.is_starting ? startingPlayersTable : substitutePlayersTable);
		}

		showingLineup = true;
		$('#aufstellungSpielfeldCircle').css('animation', 'drawCircleIn 1.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#aufstellungSpielfeldLine').css('animation', 'drawLineIn 1.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#aufstellungGoalline').css('animation', 'drawLineIn 1.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#aufstellungBox').css('animation', 'revealToLeft 1.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		logo.css('animation', 'growImage 1.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		setTimeout(() => {
			$('#aufstellungSpielfeld').css('object-position', '0 0').css('animation', 'none');
			$('#aufstellungSpielfeldCircle').css('stroke-dashoffset', '0').css('animation', 'none');
			$('#aufstellungGoalline').css('stroke-dashoffset', '0').css('animation', 'none');
			$('#aufstellungSpielfeldLine').css('stroke-dashoffset', '0').css('animation', 'none');
			$('#aufstellungLogo').css('transform', 'scale(1)').css('opacity', '1').css('animation', 'none');
		}, 2000);
	} else {
		showingLineup = false;

		// Reversed bezier curve via https://codepen.io/michellebarker/pen/jQpwKq
		$('#aufstellungSpielfeldLine').css('animation', 'drawLineOut 1.5s cubic-bezier(0.88, 0.00, 0.84, 1.00) 1 normal forwards');
		$('#aufstellungGoalline').css('animation', 'drawLineOut 1.5s cubic-bezier(0.88, 0.00, 0.84, 1.00) 1 normal forwards');
		$('#aufstellungSpielfeldCircle').css('animation', 'drawCircleOut 1.5s  cubic-bezier(0.88, 0.00, 0.84, 1.00) 1 normal forwards');
		$('#aufstellungBox').css('animation', 'revealToLeftOut 1.5s cubic-bezier(0.88, 0.00, 0.84, 1.00) 1 normal forwards');
		$('#aufstellungLogo').css('animation', 'hideImage 1s cubic-bezier(0.88, 0.00, 0.84, 1.00) 1 normal forwards');
		setTimeout(() => {
			$('#aufstellungSpielfeldCircle').css('stroke-dashoffset', '1257').css('animation', 'none');
			$('#aufstellungSpielfeldLine').css('stroke-dashoffset', '1200').css('animation', 'none');
			$('#aufstellungGoalline').css('stroke-dashoffset', '1200').css('animation', 'none');
			$('#aufstellungLogo').css('transform', 'scale(0)').css('opacity', '0').css('animation', 'none');
			startingPlayersTable.empty();
			substitutePlayersTable.empty();
		}, 2000);
	}
}

function createPlayerRow(player, table) {
	const row = $('<tr>');
	row.append($('<td>').text(getPlayerRoleText(player)));
	row.append($('<td>').text(player.number));
	row.append($('<td>').text(player.firstName).addClass('playerFirstName'));
	row.append($('<td>').text(player.lastName).addClass('playerLastName'));
	table.append(row);
}

function getPlayerRoleText(player) {
	let result = '';
	if (player.is_captain) {
		result = 'C ';
	}

	if (player.is_keeper) {
		if (player.is_starting) {
			result += 'TW';
		} else {
			result += 'ETW';
		}
	}

	return result.trim();
}

function animateReferees() {
	if (showingRefs) {
		$('#refSubContent').css('animation', 'revealDownOut 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#refAdditionalContent').css('animation', 'revealUpOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		setTimeout(() => {
			$('#lowerRefAdditionalBackground').css('animation', 'revealDownOut 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#refUpAdditionalBackground').css('animation', 'revealUpOut 0.8s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		}, 250);
		setTimeout(() => {
			$('#referee1Box').css('animation', 'revealCenterOut 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		}, 1000);
	} else {
		$('#referee1Box').css('animation', 'revealCenter 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		setTimeout(() => {
			$('#lowerRefAdditionalBackground').css('animation', 'revealDown 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#refSubContent').css('animation', 'revealDown 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		}, 300);
		setTimeout(() => {
			$('#refUpAdditionalBackground').css('animation', 'revealUp 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#refAdditionalContent').css('animation', 'revealUp 0.8s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		}, 700);
	}
	showingRefs = !showingRefs;
}

function updateRefText(referees) {
	for (let i = 1; i <= 4; i++) {
		$(`#referee${i}Text`).text(referees[i - 1] || '');
	}
}

function showLowerThirds(selectorName) {
	const elems = $(selectorName);
	blendWatermark(5000);
	elems.fadeIn(1000);
	setTimeout(() => {
		elems.fadeOut(1000);
	}, 5000);
}

const FONT_SIZE = 40;

function showExtra(text, timeout) {
	const content = $('#tiesExtraContent');
	content.text(text);
	let newSize = parseInt(content.css('font-size'), 10);
	while (content.width() >= 1450) {
		content.css('font-size', --newSize);
		if (newSize < 10) break;
	}
	blendWatermark(timeout);
	const extra = $('.blendExtra');
	extra.fadeIn(1000);
	setTimeout(() => extra.fadeOut(1000, () => content.css('font-size', FONT_SIZE)), timeout);
}

function blendWatermark(timeout) {
	const watermark = $('#watermark');
	watermark.animate({ opacity: '1.0' }, 1000);
	setTimeout(() => watermark.animate({ opacity: '0.2' }, 1000), timeout);
}

function buildLowerThirdsText(event) {
	if (!event.playerData) return;

	switch (event.eventType) {
		case 'GOAL':
			return event.playerData.goals + '. Saison-Tor';
		case 'OWN_GOAL':
			return event.playerData.ownGoals + '. Saison-Eigentor';
		case 'YELLOW_CARD':
			return event.playerData.yellowCards + '. gelbe Karte';
		case 'RED_CARD':
			return event.playerData.redCards + '. Platzverweis';
	}
}
