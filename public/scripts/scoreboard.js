'use strict';

let gameTimeSocket;

const LINEUP = 'LINEUP';
const REFEREES = 'REFEREES';
const BIG_SCOREBOARD = 'BIG_SCOREBOARD';
const CASTER = 'CASTER';
const LOWER_THIRD = 'LOWER_THIRD';
const TABLE = 'TABLE';
const MATCHDAY = 'MATCHDAY';
const LIVE_TABLE = 'LIVE_TABLE';
const LIVE_MATCHDAY = 'LIVE_MATCHDAY';
const NEXT_MATCHDAY = 'NEXT_MATCHDAY';
const LAST_MATCHDAY = 'LAST_MATCHDAY';

const transitions = {
	[LINEUP]: animateLineup.bind(this, 0, []),
	[REFEREES]: animateReferees,
	[BIG_SCOREBOARD]: toggleBigScoreboard,
	[CASTER]: showCaster,
	[LOWER_THIRD]: toggleLowerThird,
	[TABLE]: showTable.bind(this, []),
	[MATCHDAY]: showMatchday.bind(this, []),
	[LIVE_TABLE]: showLiveTable.bind(this, []),
	[LIVE_MATCHDAY]: showLiveMatchday.bind(this, []),
	[NEXT_MATCHDAY]: showNextMatchday.bind(this, []),
	[LAST_MATCHDAY]: showLastMatchday.bind(this, []),
};

let currentContent;

let showingSmallScoreboard = true;
let foulsTimeout;

let fullNames;
let teamImages;
let coaches;

let time;
let firstHalfDone = false;
let secondHalfDone = false;
let matchdayNumber;

document.addEventListener('DOMContentLoaded', () => {
	loadTeams();
	updateTimerFromServer();
});

function loadTeams() {
	const foulsHomePre = foulsHome;
	const foulsAwayPre = foulsAway;
	fetch('/data/info', { method: 'GET' })
		.then((response) => response.json())
		.then((value) => {
			const home = value.home;
			const away = value.away;

			fullNames = [home.fullName, away.fullName];
			teamImages = [home.imagePath, away.imagePath];
			coaches = [home.coach, away.coach];

			setText('homeTimeName', home.name);
			setText('awayTimeName', away.name);

			setText('bigHomeName', home.fullName);
			setText('bigAwayName', away.fullName);

			document.getElementById('homeTimeShirtLine').style.backgroundColor = home.shirtColor;
			document.getElementById('awayTimeShirtLine').style.backgroundColor = away.shirtColor;

			matchdayNumber = value.matchday;
			firstHalfDone = value.firstHalfDone;
			if (firstHalfDone) {
				updateHalfIndicator();
			}
			if (foulsHomePre !== foulsHome || foulsAwayPre !== foulsAway) {
				updateFouls();
			}
		})
		.catch(console.log);
}

function updateTimerFromServer() {
	gameTimeSocket = createWebsocket('time/game', (value) => {
		const newTime = value?.data?.length ? value.data : '20:00';
		document.getElementById('time').textContent = newTime;
		time = newTime;
	});
}

function handleEventInternal(event) {
	switch (event.eventType) {
		case 'GOAL':
		case 'OWN_GOAL':
			updateScoreboardInternal();
			break;
		case 'SHOW_GOAL':
			bigContentSafeguard(LOWER_THIRD, () => showGoalScorer(event));
			break;
		case 'SHOW_OWN_GOAL':
			bigContentSafeguard(LOWER_THIRD, () => showOwnGoalScorer(event));
			break;
		case 'SHOW_COACH':
			bigContentSafeguard(LOWER_THIRD, () => showCoach(event));
			break;
		case 'SHOW_YELLOW_CARD':
			bigContentSafeguard(LOWER_THIRD, () => showYellowCard(event));
			break;
		case 'SHOW_RED_CARD':
			bigContentSafeguard(LOWER_THIRD, () => showRedCard(event));
			break;
		case 'SHOW_INTERVIEW':
			bigContentSafeguard(LOWER_THIRD, () => showPlayerInterview(event));
			break;
		case 'TOGGLE_SCOREBOARD':
			toggleScoreboard();
			break;
		case 'SHOW_BOTTOM_SCOREBOARD':
			bigContentSafeguard(BIG_SCOREBOARD, () => toggleBigScoreboard(event.goalEvents));
			break;
		case 'LINEUP':
			bigContentSafeguard(LINEUP, () => animateLineup(event.team === 'HOME' ? 0 : 1, event.players));
			break;
		case 'SHOW_REFEREES':
			if (!currentContent) {
				updateRefText(event.referees);
			}
			bigContentSafeguard(REFEREES, animateReferees);
			break;
		case 'CASTER':
			bigContentSafeguard(CASTER, () => showCaster(event.caster));
			break;
		case 'FOUL':
		case 'REMOVE_FOUL':
		case 'CLEAR_FOULS':
		case 'SHOW_FOULS':
			updateFouls();
			break;
		case 'TABLE':
			bigContentSafeguard(TABLE, () => showTable(event.table));
			break;
		case 'LIVE_TABLE':
			bigContentSafeguard(LIVE_TABLE, () => showLiveTable(calculateLiveTable(event.table, event.matchday)));
			break;
		case 'MATCHDAY':
			bigContentSafeguard(MATCHDAY, () => showMatchday(event.matchday));
			break;
		case 'LIVE_MATCHDAY':
			bigContentSafeguard(LIVE_MATCHDAY, () => showLiveMatchday(event.matchday));
			break;
		case 'NEXT_MATCHDAY':
			bigContentSafeguard(NEXT_MATCHDAY, () => showNextMatchday(event.matchday));
			break;
		case 'LAST_MATCHDAY':
			bigContentSafeguard(LAST_MATCHDAY, () => showLastMatchday(event.matchday));
			break;
		case 'SECOND_HALF':
			if (firstHalfDone) {
				secondHalfDone = true;
			}
			firstHalfDone = true;
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
	setText('halfIndicator', '2');
	setText('halfSup', 'nd');
}

function bigContentSafeguard(nextContent, callback) {
	if (currentContent === nextContent) {
		// If the content is already visible, use the callback to hide it
		callback();
		return;
	}

	if (currentContent) {
		// If another big content is visible hide it
		transitions[currentContent]();
	} else {
		callback();
	}
}

function animate(id, animation, duration = '1s', curve = 'cubic-bezier(0.16, 0, 0.12, 1)') {
	const element = document.getElementById(id);
	if (element) {
		element.style.animation = `${animation} ${duration} ${curve} 1 normal forwards`;
	}
}

function toggleScoreboard() {
	if (!showingSmallScoreboard) {
		animate('scoreboardTime', 'revealCenter');
		animate('scoreboardSpielfeldCircle', 'ScoreboardSpielfeldIn');
		setTimeout(() => {
			animate('homeTimeImage', 'growImage');
			animate('awayTimeImage', 'growImage');
			animate('time', 'opacityIn');
			animate('homeTimeName', 'opacityIn');
			animate('awayTimeName', 'opacityIn');
			animate('homeTimeScore', 'opacityIn');
			animate('awayTimeScore', 'opacityIn');
		}, 100);
	} else {
		animate('scoreboardTime', 'revealCenterOut');
		animate('scoreboardSpielfeldCircle', 'ScoreboardSpielfeldOut');
		animate('homeTimeImage', 'hideImage');
		animate('awayTimeImage', 'hideImage');
		animate('time', 'opacityOut');
		animate('homeTimeName', 'opacityOut');
		animate('awayTimeName', 'opacityOut');
		animate('homeTimeScore', 'opacityOut');
		animate('awayTimeScore', 'opacityOut');
	}
	showingSmallScoreboard = !showingSmallScoreboard;
}

let showingExtraText = false;
let showingVersus = false;

function toggleBigScoreboard(goalEvents) {
	if (!currentContent) {
		showingExtraText = setBigExtraText(goalEvents);
		showingVersus = !firstHalfDone && time === '20:00';
		animate('bottomAdditionalBackground', 'revealCenter');
		setTimeout(() => {
			animate('bottomScoreBackground', 'revealCenter');
			animate('bottomContent', 'revealCenter');
			if (!showingVersus) {
				animate('bottomSpielfeldCircle', 'spielfeldBottom');
			}
			setTimeout(() => {
				animate('bigHomeImage', 'growImage');
				animate('bigAwayImage', 'growImage');
				animate('bigHomeName', 'opacityIn');
				animate('bigAwayName', 'opacityIn');
				if (showingVersus) {
					animate('bigVersus', 'opacityIn');
				} else {
					animate('bigHomeScore', 'opacityIn');
					animate('bigAwayScore', 'opacityIn');
				}
				if (showingExtraText) {
					setTimeout(() => {
						animate('bigAdditionalText', 'opacityIn');
						animate('bigHomeGoalscorers', 'opacityIn');
						animate('bigAwayGoalscorers', 'opacityIn');
						animate('bottomMoreInfoBackground', 'revealUp');
					}, 500);
				}
			}, 200);
		}, 80);
		currentContent = BIG_SCOREBOARD;
	} else {
		if (showingExtraText) {
			animate('bigAdditionalText', 'opacityOut', '0.5s');
			animate('bigHomeGoalscorers', 'opacityOut', '0.5s');
			animate('bigAwayGoalscorers', 'opacityOut', '0.5s');
			animate('bottomMoreInfoBackground', 'revealUpOut');
			setTimeout(animateBigScoreboardOut, 800);
		} else {
			animateBigScoreboardOut();
		}
	}
}

function setBigExtraText(goalEvents) {
	let showingText = true;
	if (secondHalfDone || (firstHalfDone && time === '00:00')) {
		setText('bigAdditionalText', 'Endstand');
	} else if (!firstHalfDone && time === '20:00') {
		setText('bigAdditionalText', matchdayNumber + '. Spieltag | Städt. Thomas-Mann-Gymnasium München');
	} else if ((!firstHalfDone && time === '00:00') || (firstHalfDone && time === '20:00')) {
		setText('bigAdditionalText', 'Halbzeitstand');
	} else {
		setText('bigAdditionalText', '');
		showingText = false;
	}

	const expectedGoals = scoreHome + scoreAway;
	if (!goalEvents || expectedGoals !== goalEvents.length || expectedGoals === 0) {
		console.warn('Expected goals', expectedGoals, 'but got', goalEvents?.length);
		setText('bigHomeGoalscorers', '');
		setText('bigAwayGoalscorers', '');
		return showingText;
	}

	const homeGoals = goalEvents.filter((e) => e.team === 'HOME');
	const awayGoals = goalEvents.filter((e) => e.team === 'AWAY');
	const homeSize = setGoalScorersText(homeGoals, 'bigHomeGoalscorers');
	const awaySize = setGoalScorersText(awayGoals, 'bigAwayGoalscorers');

	const lines = Math.max(homeSize, awaySize);
	const diff = lines - Math.min(homeSize, awaySize);
	const newHeight = 40 * lines;
	const homeHeight = 40 * homeSize;
	const awayHeight = 40 * awaySize;
	const newTop = -(30 + (lines - 2) * 40);
	const homeTop = homeSize < awaySize ? diff * 40 : 0; // ?????????
	const awayTop = awaySize < homeSize ? diff * 40 : 0;

	const background = document.getElementById('bottomMoreInfoBackground');
	background.style.height = newHeight + 'px';
	background.style.top = newTop + 'px';
	const homeScorers = document.getElementById('bigHomeGoalscorers');
	homeScorers.style.height = homeHeight + 'px';
	homeScorers.style.top = homeTop + 'px';
	const awayScorers = document.getElementById('bigAwayGoalscorers');
	awayScorers.style.height = awayHeight + 'px';
	awayScorers.style.top = awayTop + 'px';
	const textBox = document.getElementById('bigAdditionalTextBox');
	textBox.style.height = newHeight + 'px';
	textBox.style.top = newTop + 'px';

	const middleText = document.getElementById('bigAdditionalText');
	if (awaySize > homeSize) {
		const newPosition = 40 * diff - 40;
		middleText.style.top = newPosition + 'px';
	} else {
		middleText.style.top = '-50px';
	}

	return true;
}

function setGoalScorersText(goals, id) {
	let playerToGoals = [];
	// TODO in welcher Reihenfolge will ich das haben?
	goals = goals.sort((a, b) => {
		return +a.minute - +b.minute;
	});
	for (const goal of goals) {
		const existing = playerToGoals.find((e) => e.number === goal.player.number && e.team === goal.team);
		if (existing) {
			existing.goals.push(goal);
		} else {
			playerToGoals.push({
				player: goal.player,
				number: goal.player.number,
				team: goal.team,
				goals: [goal],
			});
		}
	}

	let text = '';
	let i = 0;
	for (const number of playerToGoals) {
		const player = number.player;
		text += player.lastName + ' (';
		for (const goal of number.goals) {
			if (goal.ownGoal) {
				text += 'ET ';
			}
			text += `${goal.minute}', `;
		}
		text = text.slice(0, text.length - 2);
		text += ')';
		i++;
		if (i < playerToGoals.length) {
			text += '\n';
		}
	}

	setText(id, text);
	return playerToGoals.length;
}

function animateBigScoreboardOut() {
	setText('bigHomeGoalscorers', '');
	setText('bigAwayGoalscorers', '');
	animate('bottomScoreBackground', 'revealCenterOut');
	animate('bottomContent', 'revealCenterOut');
	animate('bigHomeImage', 'hideImage', '0.5s');
	animate('bigAwayImage', 'hideImage', '0.5s');
	animate('bigHomeName', 'opacityOut', '0.5s');
	animate('bigAwayName', 'opacityOut', '0.5s');
	if (showingVersus) {
		animate('bigVersus', 'opacityOut', '0.5s');
	} else {
		animate('bigHomeScore', 'opacityOut', '0.5s');
		animate('bigAwayScore', 'opacityOut', '0.5s');
		animate('bottomSpielfeldCircle', 'spielfeldBottomOut');
	}
	setTimeout(() => {
		animate('bottomAdditionalBackground', 'revealCenterOut');
	}, 80);
	currentContent = undefined;
}

function showCaster(caster) {
	if (!currentContent) {
		const element = document.getElementById('lowerMainText');
		element.innerHTML = `<span style="font-family: DFBSans-Italic, sans-serif">${caster.firstName}</span> ${caster.lastName}`;
		setText('lowerSubText', caster.title);
		lowerThirdAnimation = 'revealCenter';
	}
	toggleLowerThird();
}

let lowerThirdAnimation;
let lowerThirdImage;

function showGoalScorer(event) {
	if (!currentContent) {
		const player = event.player;
		if (!player) {
			return;
		}
		setAnimationAndImage(event);
		setPlayerName(player);
		if (player.goals !== undefined) {
			setText('lowerSubText', player.goals + '. SAISONTOR');
		} else {
			setText('lowerSubText', 'TORSCHÜTZE');
		}
	}
	toggleLowerThird();
}

function showOwnGoalScorer(event) {
	if (!currentContent) {
		const player = event.player;
		if (!player) {
			return;
		}
		setAnimationAndImage(event);
		setPlayerName(player);
		setText('lowerSubText', 'EIGENTOR');
	}
	toggleLowerThird();
}

function setPlayerName(player) {
	const element = document.getElementById('lowerMainText');
	if (player.number) {
		element.innerHTML = player.number + '&nbsp;&nbsp;&nbsp;<span style="font-family: DFBSans-Italic, sans-serif">' + player.firstName + '</span> ' + player.lastName;
	} else {
		element.innerHTML = '<span style="font-family: DFBSans-Italic, sans-serif">' + player.firstName + '</span> ' + player.lastName;
	}
}

function setAnimationAndImage(event) {
	lowerThirdImage = event.team === 'HOME' ? 'lowerThirdHome' : 'lowerThirdAway';
	lowerThirdAnimation = event.team === 'HOME' ? 'revealToRight' : 'revealToLeft';
}

function showPlayerInterview(event) {
	if (!currentContent) {
		const player = event.player;
		if (!player) {
			return;
		}
		setAnimationAndImage(event);
		setPlayerName(player);
		const teamName = fullNames[event.team === 'HOME' ? 0 : 1];
		setText('lowerSubText', teamName);
	}
	toggleLowerThird();
}

function showCoach(event) {
	if (!currentContent) {
		if (!event.coach) {
			return;
		}
		setAnimationAndImage(event);
		setPlayerName(event.coach);
		setText('lowerSubText', 'TRAINER');
	}
	toggleLowerThird();
}

function showYellowCard(event) {
	if (!currentContent) {
		const player = event.player;
		if (!player) {
			return;
		}
		setAnimationAndImage(event);
		setPlayerName(player);
		if (player.yellowCards !== undefined) {
			setText('lowerSubText', player.yellowCards + '. GELBE KARTE');
		} else {
			setText('lowerSubText', 'GELBE KARTE');
		}
		document.getElementById('lowerCard').classList.add('lowerYellowCard');
	}
	toggleLowerThird();
}

function showRedCard(event) {
	if (!currentContent) {
		const player = event.player;
		if (!player) {
			return;
		}
		setAnimationAndImage(event);
		setPlayerName(player);
		setText('lowerSubText', 'ROTE KARTE');
		document.getElementById('lowerCard').classList.add('lowerRedCard');
	}
	toggleLowerThird();
}

function toggleLowerThird() {
	if (!currentContent) {
		animate('lowerMainContent', lowerThirdAnimation, '0.5s');
		animate('lowerMainText', 'opacityIn');
		if (lowerThirdImage) {
			animate(lowerThirdImage, 'growImage');
		}
		setTimeout(() => {
			animate('lowerSubAdditionalBackground', 'revealDown', '0.5s');
			animate('lowerSubContent', 'revealDown');
		}, 500);
		currentContent = CASTER;
	} else {
		animate('lowerSubContent', 'revealDownOut', '0.5s');
		setTimeout(() => {
			animate('lowerSubAdditionalBackground', 'revealDownOut', '0.5s');
		}, 100);
		setTimeout(() => {
			document.getElementById('lowerCard').classList.remove('lowerYellowCard', 'lowerRedCard');
			if (lowerThirdImage) {
				animate(lowerThirdImage, 'hideImage');
				lowerThirdImage = undefined;
			}
			animate('lowerMainContent', lowerThirdAnimation + 'Out', '0.5s');
			animate('lowerMainText', 'opacityOut', '0.4s');
		}, 600);
		currentContent = undefined;
	}
}

function updateScoreboardInternal() {
	updateScore();
	doubleDigitAdjustments();
}

function updateScore() {
	setText('bigHomeScore', scoreHome);
	setText('bigAwayScore', scoreAway);
	setText('homeTimeScore', scoreHome);
	setText('awayTimeScore', scoreAway);
}

function doubleDigitAdjustments() {
	if (scoreHome >= 10) {
		const bigScore = document.getElementById('bigHomeScore');
		bigScore.style.left = '602px';
		bigScore.style.fontSize = '75px';
		const timeScore = document.getElementById('homeTimeScore');
		timeScore.style.left = '435px';
		timeScore.style.fontSize = '30px';
		document.getElementById('awayTimeScore').style.fontSize = '30px';
	}
	if (scoreAway >= 10) {
		const bigScore = document.getElementById('bigAwayScore');
		bigScore.style.left = '695px';
		bigScore.style.fontSize = '75px';
		const timeScore = document.getElementById('awayTimeScore');
		timeScore.style.left = '475px';
		timeScore.style.fontSize = '30px';
		document.getElementById('homeTimeScore').style.fontSize = '30px';
	}
}

function updateFouls() {
	updateFoulsBox();
	updateFoulsContent('homeTimeFouls', foulsHome);
	updateFoulsContent('awayTimeFouls', foulsAway);
}

function updateFoulsBox() {
	const foulsBox = document.getElementById('foulsContent');
	if (foulsHome > 0 || foulsAway > 0) {
		animate('foulsAdditionalBackground', 'revealDown', '0.5s');
		setTimeout(() => {
			animate('foulsContent', 'revealDown', '1s');
		}, 200);
		if (foulsTimeout) {
			clearTimeout(foulsTimeout);
		}
		// Keep fouls box visible if one team has 5 or more fouls
		if (foulsHome < 5 && foulsAway < 5) {
			// Otherwise hide it after 30 seconds
			foulsTimeout = setTimeout(animateFoulsBoxOut, 30_000);
		}
	} else if (foulsBox.style.animationName === 'revealDown') {
		animateFoulsBoxOut();
		if (foulsTimeout) {
			clearTimeout(foulsTimeout);
		}
	}
}

function animateFoulsBoxOut() {
	animate('foulsContent', 'revealDownOut', '0.5s');
	setTimeout(() => {
		animate('foulsAdditionalBackground', 'revealDownOut', '0.5s');
	}, 200);
}

function updateFoulsContent(foulsText, fouls) {
	setText(foulsText, fouls);
}

let redCardSockets = {};

function showRedCardTimer(team) {
	team = team.toLowerCase();
	animate(`${team}RedCardBox`, 'revealUp');
	let socket = createWebsocket(`time/red/${team}`, (value) => {
		const time = value?.data;
		if (time === '00:00') {
			socket.close();
			setTimeout(() => {
				animate(`${team}RedCardBox`, 'revealUpOut');
				setTimeout(() => {
					setText(`${team}RedCardTimer`, '2:00');
				}, 1000);
			}, 500);
		}
		setText(`${team}RedCardTimer`, time?.length ? time.slice(1) : '2:00');
	});
	redCardSockets[team] = socket;
}

function clearRedCardTimer(team) {
	team = team.toLowerCase();
	if (redCardSockets[team]) {
		redCardSockets[team].close();
		delete redCardSockets[team];
		animate(`${team}RedCardBox`, 'revealUpOut');
		setTimeout(() => {
			setText(`${team}RedCardTimer`, '2:00');
		}, 1100);
	}
}

function animateLineup(team, players) {
	const duration = '1.5s';
	const startingPlayersTable = document.getElementById('startingPlayers');
	const substitutePlayersTable = document.getElementById('substitutePlayers');

	if (!currentContent) {
		setText('aufstellungTeamname', fullNames[team]);
		document.getElementById('aufstellungLogo').src = teamImages[team];

		if (players?.length) {
			players = players.sort((a, b) => {
				if (a.is_keeper && !b.is_keeper) {
					return -1;
				} else if (!a.is_keeper && b.is_keeper) {
					return 1;
				}
				if (!a.number && !b.number) {
					return 0;
				} else if (a.number && !b.number) {
					return 1;
				} else if (!a.number && b.number) {
					return -1;
				}
				return +a.number - +b.number;
			});
			for (const player of players) {
				if (!player.number) {
					continue;
				}
				createPlayerRow(player, player.is_starting ? startingPlayersTable : substitutePlayersTable);
			}
		}
		const coach = coaches[team];
		setText('aufstellungCoach', coach.firstName + ' ' + coach.lastName);

		currentContent = LINEUP;
		animate('aufstellungSpielfeldCircle', 'drawCircleIn', duration);
		animate('aufstellungSpielfeldLine', 'drawLineIn', duration);
		animate('aufstellungGoalline', 'drawLineIn', duration);
		animate('aufstellungBox', 'revealToLeft', duration);
		animate('aufstellungLogo', 'growImage', duration);
	} else {
		currentContent = undefined;

		// Reversed bezier curve via https://codepen.io/michellebarker/pen/jQpwKq
		const curve = 'cubic-bezier(0.88, 0.00, 0.84, 1.00)';
		animate('aufstellungSpielfeldLine', 'drawLineOut', duration, curve);
		animate('aufstellungGoalline', 'drawLineOut', duration, curve);
		animate('aufstellungSpielfeldCircle', 'drawCircleOut', duration, curve);
		animate('aufstellungBox', 'revealToLeftOut', duration, curve);
		animate('aufstellungLogo', 'hideImage', '1s', curve);
		setTimeout(() => {
			startingPlayersTable.replaceChildren();
			substitutePlayersTable.replaceChildren();
		}, 2000);
	}
}

function createPlayerRow(player, table) {
	const row = document.createElement('tr');
	row.appendChild(createElement('td', getPlayerRoleText(player)));
	row.appendChild(createElement('td', player.number));
	row.appendChild(createElement('td', player.firstName, 'playerFirstName'));
	row.appendChild(createElement('td', player.lastName, 'playerLastName'));
	table.appendChild(row);
}

function createElement(tag, text, cls) {
	const element = document.createElement(tag);
	element.textContent = text;
	if (cls) {
		element.classList.add(cls);
	}
	return element;
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

// TODO make animation similar to caster (opacity, timing)
function animateReferees() {
	if (currentContent === REFEREES) {
		animate('refSubContent', 'revealDownOut', '0.5s');
		animate('refAdditionalContent', 'revealUpOut');
		setTimeout(() => {
			animate('lowerRefAdditionalBackground', 'revealDownOut', '0.5s');
			animate('refUpAdditionalBackground', 'revealUpOut', '0.8s');
		}, 250);
		setTimeout(() => {
			animate('referee1Box', 'revealCenterOut', '0.5s');
		}, 1000);
		currentContent = undefined;
	} else {
		animate('referee1Box', 'revealCenter', '0.5s');
		setTimeout(() => {
			animate('lowerRefAdditionalBackground', 'revealDown', '0.5s');
			animate('refSubContent', 'revealDown');
		}, 300);
		setTimeout(() => {
			animate('refUpAdditionalBackground', 'revealUp', '0.5s');
			animate('refAdditionalContent', 'revealUp', '0.8s');
		}, 700);
		currentContent = REFEREES;
	}
}

function updateRefText(referees) {
	for (let i = 1; i <= 4; i++) {
		setText(`referee${i}Text`, referees[i - 1] || '');
	}
}

function showTable(table) {
	if (currentContent === TABLE) {
		animate('tableLogo', 'hideImage');
		animate('table', 'revealToLeftOut');
		setTimeout(() => {
			const table = document.getElementById('tableTeams');
			const header = table.firstElementChild;
			table.replaceChildren(header);
		}, 1100);
		currentContent = undefined;
	} else {
		const tableContent = document.getElementById('tableTeams');
		for (let i = 0; i < table.length; i++) {
			createTableRow(table[i], tableContent, i);
		}
		animate('tableLogo', 'growImage');
		animate('table', 'revealToLeft');
		currentContent = TABLE;
	}
}

function calculateLiveTable(table, matches) {
	// Assumption: table contains all scores where live == false
	// This might not be correct if a match just ended and the table is not updated yet
	// Important: Only use that during the match where other matches are not finished yet
	if (!table || !matches) {
		return table;
	}
	table = [...table];
	for (const match of matches) {
		if (match.originalScore !== '- : -') {
			// If the original score is present on the DFB page (not -:-)
			// We then assume the result to be already included in the table
			continue;
		}
		updateTeamInTable(match, table);
	}
	// Include own result in the live table
	updateTeamInTable({ homeTeam: fullNames[0], awayTeam: fullNames[1], homeScore: scoreHome, awayScore: scoreAway }, table);
	table = sortTable(table);
	return table;
}

function updateTeamInTable(match, table) {
	const home = table.find((team) => team.team === match.homeTeam);
	const away = table.find((team) => team.team === match.awayTeam);
	if (!home || !away) {
		console.warn('Could not find teams in table', match.homeTeam, match.awayTeam);
		return;
	}
	if (match.homeScore === undefined || match.awayScore === undefined) {
		const split = match.score.split(':');
		match.homeScore = +split[0];
		match.awayScore = +split[1];
	}
	home.games = +home.games + 1;
	away.games = +away.games + 1;
	home.goalDiff = +home.goalDiff + +match.homeScore - +match.awayScore;
	away.goalDiff = +away.goalDiff + +match.awayScore - +match.homeScore;
	if (+match.homeScore > +match.awayScore) {
		home.points = +home.points + 3;
	} else if (+match.homeScore < +match.awayScore) {
		away.points = +away.points + 3;
	} else {
		home.points = +home.points + 1;
		away.points = +away.points + 1;
	}
}

function showLiveTable(table) {
	if (currentContent === LIVE_TABLE) {
		animate('liveTableContent', 'revealUpOut');
		setTimeout(() => {
			animate('liveTableAdditionalBackground', 'revealUpOut');
		}, 80);
		setTimeout(() => {
			document.getElementById('liveTableTeams').replaceChildren();
		}, 1100);
		currentContent = undefined;
	} else {
		if (!table) {
			return;
		}
		const tableContent = document.getElementById('liveTableTeams');
		for (let i = 0; i < table.length; i++) {
			createTableRow(table[i], tableContent, i, true);
		}
		animate('liveTableAdditionalBackground', 'revealUp', '0.7s');
		animate('liveTableContent', 'revealUp', '1s');
		currentContent = LIVE_TABLE;
	}
}

function sortTable(table) {
	table = table.sort((teamA, teamB) => {
		if (+teamA.points !== +teamB.points) {
			return +teamB.points - +teamA.points;
		}
		if (+teamA.goalDiff !== +teamB.goalDiff) {
			return +teamB.goalDiff - +teamA.goalDiff;
		}
		return +teamA.games - +teamB.games;
	});

	// update rank
	for (let i = 0; i < table.length; i++) {
		table[i].rank = i + 1 + '.';
	}
	return table;
}

function getShortTeamName(team) {
	switch (team) {
		case 'HOT 05 Futsal':
			return 'HOT 05';
		case 'Hamburger SV':
			return 'HSV-Futsal';
		case 'TSV Weilimdorf':
			return 'Weilimdorf';
		case 'MCH Futsal Club Bielefeld':
			return 'MHC Bielefeld';
		case 'FC Liria Futsal':
			return 'FC Liria';
		case 'Jahn Regensburg Futsal':
			return 'Jahn Futsal';
		case 'Futsal Panthers Köln':
			return 'Panthers Köln';
		case 'Fortuna Düsseldorf':
			return 'F95 Futsal';
		case 'Beton Boys München':
			return 'Beton Boys';
		case 'SV Pars Neu-Isenburg':
			return 'SV Pars';
	}
	return team;
}

function createTableRow(team, tableContent, i, short = false) {
	const row = document.createElement('tr');
	row.classList.add('tableTeamRow');

	const rank = createElement('td', team.rank);
	if (i === 8) {
		rank.classList.add('relegation');
	} else if (i === 9) {
		rank.classList.add('last');
	}
	row.appendChild(rank);

	const logoTd = document.createElement('td');
	logoTd.style.textAlign = 'center';
	const logoImage = document.createElement('img');
	logoImage.src = team.teamLogo;
	logoImage.classList.add('tableTeamLogo');

	logoTd.appendChild(logoImage);
	row.appendChild(logoTd);

	if (short) {
		row.appendChild(createElement('td', getShortTeamName(team.team), 'tableShortTeamName'));
	} else {
		row.appendChild(createElement('td', team.team, 'tableTeamName'));
	}
	row.appendChild(createElement('td', team.games));
	row.appendChild(createElement('td', team.goalDiff));
	row.appendChild(createElement('td', team.points, 'tableTeamPoints'));
	tableContent.appendChild(row);
}

function showMatchday(matchday) {
	if (currentContent === MATCHDAY) {
		animate('matchday', 'revealToLeftOut');
		setTimeout(() => {
			document.getElementById('matchesTable').replaceChildren();
		}, 1300);
		currentContent = undefined;
	} else {
		const table = document.getElementById('matchesTable');
		for (const match of matchday) {
			createMatchdayRow(match, table);
		}
		setText('matchdayTitle', matchdayNumber + '. Spieltag');
		animate('matchday', 'revealToLeft');
		currentContent = MATCHDAY;
	}
}

function createMatchdayRow(match, table, short = false, time = false, date = false) {
	const row = document.createElement('tr');
	row.classList.add('matchdayMatchRow');

	const homeLogoTd = document.createElement('td');
	homeLogoTd.style.textAlign = 'center';
	const homeLogoImage = document.createElement('img');
	homeLogoImage.src = match.homeImage;
	homeLogoImage.classList.add('tableTeamLogo');
	homeLogoTd.appendChild(homeLogoImage);
	row.appendChild(homeLogoTd);

	if (!short) {
		row.appendChild(createElement('td', match.homeTeam, 'tableTeamName'));
	}
	if (match.isLive) {
		if (match.score) {
			row.appendChild(createElement('td', match.score, 'live'));
		} else {
			row.appendChild(createElement('td', 'Live', 'live'));
		}
	} else if (time) {
		const td = document.createElement('td');
		if (date) {
			td.textContent = `${match.date.trim().substring(0, match.date.length - 4)} ${match.time}`;
		} else {
			td.textContent = match.time;
		}
		row.appendChild(td);
	} else {
		row.appendChild(createElement('td', match.score));
	}
	if (!short) {
		row.appendChild(createElement('td', match.awayTeam, 'tableTeamName'));
	}

	const awayLogoTd = document.createElement('td');
	awayLogoTd.style.textAlign = 'center';
	const awayLogoImage = document.createElement('img');
	awayLogoImage.src = match.awayImage;
	awayLogoImage.classList.add('tableTeamLogo');
	awayLogoTd.appendChild(awayLogoImage);
	row.appendChild(awayLogoTd);

	table.appendChild(row);
}

function showLiveMatchday(matches) {
	if (!matches) {
		return;
	}
	if (currentContent === LIVE_MATCHDAY) {
		animate('liveMatchesContent', 'revealUpOut');
		setTimeout(() => {
			animate('liveMatchesAdditionalBackground', 'revealUpOut');
		}, 80);
		setTimeout(() => {
			document.getElementById('liveMatchesTable').replaceChildren();
		}, 1100);
		currentContent = undefined;
	} else {
		setText('liveMatchesTitle', matchdayNumber + '. Spieltag');
		const table = document.getElementById('liveMatchesTable');
		for (const match of matches) {
			if (match.homeTeam === fullNames[0] || match.awayTeam === fullNames[1]) {
				continue;
			}
			createMatchdayRow(match, table, true);
		}
		animate('liveMatchesAdditionalBackground', 'revealUp', '0.7s');
		animate('liveMatchesContent', 'revealUp', '1s');
		currentContent = LIVE_MATCHDAY;
	}
}

function showNextMatchday(matchday) {
	if (currentContent === NEXT_MATCHDAY) {
		animate('nextMatchesContent', 'revealUpOut');
		setTimeout(() => {
			animate('nextMatchesAdditionalBackground', 'revealUpOut');
		}, 80);
		setTimeout(() => {
			document.getElementById('nextMatchesTable').replaceChildren();
		}, 1100);
		currentContent = undefined;
	} else {
		if (!matchday.matches) {
			return;
		}
		// 1) Split time into date and time
		for (const match of matchday.matches) {
			const split = match.date.split(',')[1].trim().split(' ');
			match.date = split[0];
			match.time = split[1];
		}

		// 2) Use big title if all matches on same day
		const sameDay = matchday.matches.every((match, i, arr) => i === 0 || match.date === arr[i - 1].date);
		if (sameDay) {
			setText('nextMatchesDate', matchday.matches[0].date);
		} else {
			setText('nextMatchesDate', '');
			document.getElementById('nextMatchesDate').style.display = 'none';
		}

		setText('nextMatchesTitle', matchday.number + '. Spieltag');

		const table = document.getElementById('nextMatchesTable');
		for (const match of matchday.matches) {
			createMatchdayRow(match, table, true, true, !sameDay);
		}

		animate('nextMatchesAdditionalBackground', 'revealUp', '0.7s');
		animate('nextMatchesContent', 'revealUp', '1s');
		currentContent = NEXT_MATCHDAY;
	}
}

function showLastMatchday(matchday) {
	if (currentContent === LAST_MATCHDAY) {
		animate('matchday', 'revealToLeftOut');
		setTimeout(() => {
			document.getElementById('matchesTable').replaceChildren();
		}, 1300);
		currentContent = undefined;
	} else {
		const table = document.getElementById('matchesTable');
		for (const match of matchday.matches) {
			createMatchdayRow(match, table);
		}
		setText('matchdayTitle', matchday.number + '. Spieltag');
		animate('matchday', 'revealToLeft');
		currentContent = MATCHDAY;
	}
}
