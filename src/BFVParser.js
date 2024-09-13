import axios from "axios";
import {parse} from "node-html-parser";

//http://www.fussball.de/ajax.fixtures.tournament/-/action/OPEN/staffel/02C96CGFVK000001VS5489B4VSC3ER83-G
const games = axios.create({
	baseURL: 'https://www.bfv.de/partial/wettbewerb/spieltag/02C96CGFVK000001VS5489B4VSC3ER83-G'
});

const table = axios.create({
	baseURL: 'https://www.bfv.de/partial/wettbewerb/tabelle/02C96CGFVK000001VS5489B4VSC3ER83-G/tabelle'
});

const goalgetterTable = axios.create({
	baseURL: 'https://apiwrapper.bfv.de/wettbewerb/02C96CGFVK000001VS5489B4VSC3ER83-G/torschuetzen'
});

const gameDetails = axios.create({
	baseURL: 'https://www.bfv.de/partial/spieldetail/aufstellung'
});

//https://www.bfv.de/partial/spieldetail/aufstellung/02C96UVFTS000000VS5489B3VU44J0GP
//TODO Match-ID!

//TODO eigene einheitliche Struktur erstellen
//TODO Daten zusammenführen
//TODO Presentation layer

//TODO auch Nord parsen
async function createMatchdayData(day) {
	const result = [];
	const response = await games.get(`/${day}`);

	const root = parse(response.data);

	for (const entry of root.querySelectorAll('.bfv-spieltag-eintrag')) {
		const game = {};
		const dateNode = entry.querySelector('.bfv-matchday-date-time');
		let dateText = '';
		if (dateNode) {
			for (const dateSpan of dateNode.querySelectorAll('span')) {
				dateText += trim(dateSpan.text) + ' ';
			}
		}
		game.date = dateText.replace(/\s+\//, ' ').trim();

		const homeTeamNode = entry.querySelector('.bfv-matchdata-result__team-name--team0');
		game.homeTeam = trim(homeTeamNode.text);

		const awayTeamNode = entry.querySelector('.bfv-matchdata-result__team-name--team1');
		game.awayTeam = trim(awayTeamNode.text);

		const scoreHomeNode = entry.querySelector('.bfv-matchdata-result__goals--team0');
		//This code assumes that always the same font is used
		//check if this is always the case
		if (scoreHomeNode && scoreHomeNode.hasAttribute('data-font-url')) {
			game.font = scoreHomeNode.getAttribute('data-font-url');
			game.className = scoreHomeNode.getAttribute('data-class-name');
			game.scoreHome = trim(scoreHomeNode.text);
		} else {
			game.scoreHome = '-';
		}

		const scoreAwayNode = entry.querySelector('.bfv-matchdata-result__goals--team1');
		game.scoreAway = scoreAwayNode ? trim(scoreAwayNode.text) : '-';

		result.push(game);
	}
	return result;
}

exports.createMatchdayData = createMatchdayData;

async function createTableData() {
	const result = [];
	const response = (await table.get('')).data;
	const data = parse(response);

	for (const entry of data.querySelectorAll('.bfv-table-entry--data')) {
		const teamData = {};
		teamData.rank = trim(entry.querySelector('.bfv-table-entry__cell--position').text);
		teamData.team = trim(entry.querySelector('.bfv-table-entry__cell--team').querySelector('a').text);
		teamData.games = trim(entry.querySelector('.bfv-table-entry__cell--matches').text);
		teamData.score = trim(entry.querySelector('.bfv-table-entry__cell--score').text);
		result.push(teamData);
	}
	return result;
}

exports.createTableData = createTableData;

exports.createGoalgetterTable = async () => (await goalgetterTable.get('')).data.results;

async function createPlayers(gameId) {
	const result = {
		homeTeam: {},
		awayTeam: {}
	};
	const response = (await gameDetails.get('/'+gameId)).data;
	const data = parse(response);

	for (const compositionPart of data.querySelectorAll('.bfv-composition__composition-wrapper')) {
		const partName = trim(compositionPart.querySelector('.bfv-composition__headline').querySelector('h5').text);
		let attributeName;
		switch (partName) {
			case 'Startaufstellung':
				attributeName = 'starting';
				break;
			case 'Ersatzbank':
				attributeName = 'change';
				break;
			case 'Trainer':
				attributeName = 'coach';
				break;
			default:
				attributeName = partName;
				break;
		}

		let homeTeam = true;
		for (const team of compositionPart.querySelectorAll('.bfv-composition__team')) {
			let teamName;
			const players = [];
			for (const entry of team.querySelectorAll('.bfv-composition-entry')) {
				const teamNameData = entry.querySelector('.bfv-composition-entry__team-name');
				if (teamNameData) {
					teamName = trim(teamNameData.text);
				} else {
					const player = {};
					player.name = trim(entry.querySelector('.bfv-composition-entry__name').text);
					player.number = trim(entry.querySelector('.bfv-composition-entry__player-number').text);
					if (entry.querySelector('.bfv-composition-entry--isCaptain')) {
						player.isCaptain = true;
					}
					if (entry.querySelector('.bfv-composition-entry--isGoalkeeper')) {
						player.isGoalkeeper = true;
					}
					players.push(player);
				}
			}
			const resultTeam = result[homeTeam ? 'homeTeam' : 'awayTeam'];
			if (!resultTeam.name && teamName)
				resultTeam.name = teamName;

			resultTeam[attributeName] = players;
			homeTeam = false;
		}
	}

	return result;
}

createPlayers('02C96UVFTS000000VS5489B3VU44J0GP');

function trim(input) {
	return input.replace(/\n/g, '').trim();
}
