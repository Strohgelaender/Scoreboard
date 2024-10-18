'use strict';

let gameTimeSocket;

let showingLineup = false;
let showingRefs = false;
let showingSmallScoreboard = true;
let showingBigScoreboard = false;
let showingLowerThird = false;
let showingTable = false;
let showingMatchday = false;
let foulsTimeout;
let fullNames;
let teamImages;

$(() => {
	loadTeams();
	updateTimerFromServer();
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

			if (value.firstHalfDone) {
				updateHalfIndicator();
			}
			updateFouls();
		})
		.catch((error) => {
			console.log(error);
		});
}

function updateTimerFromServer() {
	gameTimeSocket = updateTime('time/game', (value) => {
		return $('#time').text(value?.data?.length ? value.data : '20:00');
	});
}

function updateTime(endpoint, callback) {
	const loc = window.location;
	const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
	const new_uri = `${protocol}//${loc.host}/${endpoint}`;

	const socket = new WebSocket(new_uri);
	socket.onmessage = callback;
	return socket;
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
			bigContentSafeguard(showingBigScoreboard, toggleBigScoreboard);
			break;
		case 'LINEUP':
			bigContentSafeguard(showingLineup, () => animateLineup(event.team === 'HOME' ? 0 : 1, event.playerData));
			break;
		case 'REFEREES':
			if (!showingRefs) {
				updateRefText(event.playerData);
			}
			bigContentSafeguard(showingRefs, animateReferees);
			break;
		case 'CASTER':
			bigContentSafeguard(showingLowerThird, toggleLowerThird);
			break;
		case 'FOUL':
		case 'REMOVE_FOUL':
		case 'CLEAR_FOULS':
			updateFouls();
			break;
		case 'TABLE':
			bigContentSafeguard(showingTable, () => showTable(event.table));
			break;
		case 'MATCHDAY':
			bigContentSafeguard(showingMatchday, () => showMatchday(event.matchday));
			break;
		case 'SECOND_HALF':
			updateHalfIndicator();
			break;
		case 'REFRESH':
			loadTeams();
			break;
		case 'RED_CARD':
			showRedCardTimer(event.team);
			break;
		case 'CLEAR_RED_CARD':
			clearRedCardTimer(event.team);
			break;
	}
}

function updateHalfIndicator() {
	$('#halfIndicator').text('2');
	$('#halfSup').text('nd');
}

function bigContentSafeguard(showingContent, callback) {
	if (showingContent) {
		// If the content is already visible use the callback to hide it
		callback();
		return;
	}

	// Else first check if there is another big content visible.
	if (showingBigScoreboard) {
		toggleBigScoreboard();
	} else if (showingLowerThird) {
		toggleLowerThird();
	} else if (showingLineup) {
		animateLineup(0, []);
	} else if (showingRefs) {
		animateReferees();
	} else if (showingTable) {
		showTable([]);
	} else if (showingMatchday) {
		showMatchday([]);
	} else {
		callback();
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
	if (!showingBigScoreboard) {
		$('#bottomAdditionalBackground').css('animation', 'revealCenter 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		setTimeout(() => {
			$('#bottomScoreBackground').css('animation', 'revealCenter 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#bottomContent').css('animation', 'revealCenter 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#bottomSpielfeldCircle').css('animation', 'spielfeldBottom 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			setTimeout(() => {
				$('#bigHomeImage').css('animation', 'growImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
				$('#bigAwayImage').css('animation', 'growImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
				$('#bigHomeName').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
				$('#bigAwayName').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
				$('#bigHomeScore').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
				$('#bigAwayScore').css('animation', 'opacityIn 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			}, 200);
		}, 80);
	} else {
		$('#bottomScoreBackground').css('animation', 'revealCenterOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bottomContent').css('animation', 'revealCenterOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigHomeImage').css('animation', 'hideImage 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigAwayImage').css('animation', 'hideImage 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigHomeName').css('animation', 'opacityOut 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigAwayName').css('animation', 'opacityOut 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigHomeScore').css('animation', 'opacityOut 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bigAwayScore').css('animation', 'opacityOut 0.5s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#bottomSpielfeldCircle').css('animation', 'spielfeldBottomOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		setTimeout(() => {
			$('#bottomAdditionalBackground').css('animation', 'revealCenterOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		}, 80);
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
	updateFoulsBox();
	updateFoulsContent($('#homeTimeFouls'), foulsHome);
	updateFoulsContent($('#awayTimeFouls'), foulsAway);
}

function updateFoulsBox() {
	const foulsBox = $('#allFoulsBox');
	if (foulsHome > 0 || foulsAway > 0) {
		foulsBox.css('animation', 'revealDown 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		if (foulsTimeout) {
			clearTimeout(foulsTimeout);
		}
		// Keep fouls box visible if one team has 5 or more fouls
		if (foulsHome < 5 && foulsAway < 5) {
			// Otherwise hide it after 30 seconds
			foulsTimeout = setTimeout(() => {
				foulsBox.css('animation', 'revealDownOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			}, 30_000);
		}
	} else if (foulsBox.css('animation-name') === 'revealDown') {
		foulsBox.css('animation', 'revealDownOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		if (foulsTimeout) {
			clearTimeout(foulsTimeout);
		}
	}
}

function updateFoulsContent(foulsText, fouls) {
	foulsText?.text(fouls);
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

let redCardSockets = {};

function showRedCardTimer(team) {
	team = team.toLowerCase();
	const redCardTimer = $(`#${team}RedCardBox`);
	redCardTimer.css('animation', 'revealUp 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		let socket = updateTime(`time/red/${team}`, (value) => {
			const time = value?.data;
			if (time === '00:00') {
				socket.close();
				setTimeout(() => {
					redCardTimer.css('animation', 'revealUpOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
					setTimeout(() => {
						$(`#${team}RedCardTimer`).text('3:00');
					}, 1000);
				}, 500);
			}
			$(`#${team}RedCardTimer`).text(time?.length ? time.slice(1) : '3:00');
		});
	redCardSockets[team] = socket;
}

function clearRedCardTimer(team) {
	team = team.toLowerCase();
	if (redCardSockets[team]) {
		redCardSockets[team].close();
		delete redCardSockets[team];
		const redCardTimer = $(`#${team}RedCardBox`);
		redCardTimer.css('animation', 'revealUpOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		setTimeout(() => {
			$(`#${team}RedCardTimer`).text('3:00');
		}, 1000);
	}
}

function animateLineup(team, players) {
	const startingPlayersTable = $('#startingPlayers');
	const substitutePlayersTable = $('#substitutePlayers');

	if (!showingLineup) {
		$('#aufstellungTeamname').text(fullNames[team]);
		const logo = $('#aufstellungLogo');
		logo.attr('src', teamImages[team]);

		players = players.sort((a, b) => {
			if (a.is_keeper && !b.is_keeper) {
				return -1;
			} else if (!a.is_keeper && b.is_keeper) {
				return 1;
			}
			return +a.number - +b.number;
		});
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

function showTable(table) {
	if (showingTable) {
		$('#tableLogo').css('animation', 'hideImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		$('#table').css('animation', 'revealToLeftOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		setTimeout(() => {
			$('.tableTeamRow').remove();
		}, 1500);
	} else {
		const tableContent = $('#tableTeams');
		for (let i = 0; i < table.length; i++) {
			createTableRow(table[i], tableContent, i);
		}
		setTimeout(() => {
			$('#tableLogo').css('animation', 'growImage 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
			$('#table').css('animation', 'revealToLeft 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		}, 1000);
	}
	showingTable = !showingTable;
}

function createTableRow(team, tableContent, i) {
	const row = $('<tr class="tableTeamRow">');
	const rank = $('<td>').text(team.rank);
	if (i === 8) {
		rank.addClass('relegation');
	} else if (i === 9) {
		rank.addClass('last');
	}
	row.append(rank);
	row.append($('<td style="text-align: center;">').append($(`<img src="${team.teamLogo}" class="tableTeamLogo">`)));
	row.append($('<td class="tableTeamName">').text(team.team));
	row.append($('<td>').text(team.games));
	row.append($('<td>').text(team.goalDiff));
	row.append($('<td>').text(team.points));
	tableContent.append(row);
}

function showMatchday(matchday) {
	if (showingMatchday) {
		$('#matchday').css('animation', 'revealToLeftOut 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		setTimeout(() => {
			$('#matchesTable').empty();
		}, 1500);
	} else {
		const table = $('#matches');
		for (const match of matchday) {
			createMatchdayRow(match, table);
		}
		setTimeout(() => {
			$('#matchday').css('animation', 'revealToLeft 1s cubic-bezier(0.16, 0, 0.12, 1) 1 normal forwards');
		}, 1000);
	}
	showingMatchday = !showingMatchday;
}

function createMatchdayRow(match, table) {
	const row = $('<tr class="matchdayMatchRow">');
	// row.append($('<td>').text(match.time));
	row.append($('<td style="text-align: center;">').append($(`<img src="${match.homeImage}" class="tableTeamLogo">`)));
	row.append($('<td class="tableTeamName">').text(match.homeTeam));
	if (match.isLive) {
		row.append($('<td>').text('Live'));
	} else {
		row.append($('<td>').text(match.score));
	}
	row.append($('<td class="tableTeamName">').text(match.awayTeam));
	row.append($('<td style="text-align: center;">').append($(`<img src="${match.awayImage}" class="tableTeamLogo">`)));
	table.append(row);
}
