import axios from 'axios';
import { parse } from 'node-html-parser';

// BFV overview page: https://www.bfv.de/spiele/02Q0SKPLG0000000VS5489B3VU5PPGUO
// same id used as by fussball.de

// IMPORTANT: Always update there two URLs before starting the prod server

const matchdayNumber = +process.env.MATCHDAY || 10;

const matchId = '02Q0SKPNQK000000VS5489B3VU5PPGUO';

const otherMatches = ['02Q0SKPNSG000000VS5489B3VU5PPGUO', '02Q0SKPO0G000000VS5489B3VU5PPGUO', '02Q0SKPO2G000000VS5489B3VU5PPGUO', '02Q0SKPNUO000000VS5489B3VU5PPGUO'];

const matchUrl = 'https://www.fussball.de/ajax.liveticker/-/spiel/';
// const overviewUrl = 'https://datencenter.dfb.de/datencenter/futsal-bundesliga/2024-2025/spieltag/beton-boys-muenchen-futsal-sv-pars-neu-isenburg-2388070';
const overviewUrl = 'https://datencenter.dfb.de/datencenter/futsal-bundesliga/2024-2025/spieltag/2388080';
const tableUrl =
	'https://www.fussball.de/spieltagsuebersicht/futsal-bundesliga-deutschland-futsal-bundesliga-herren-saison2425-deutschland/-/staffel/02P0KQ4NU4000000VS5489B3VU9BAIPM-C#!/';
const matchdayUrl = 'https://datencenter.dfb.de//competitions/futsal-bundesliga/seasons/2024-2025/matchday/spieltag/';
const awayTeamPlayersUrl = 'https://datencenter.dfb.de/competitions/futsal-bundesliga/seasons/2024-2025/teams/hamburger-sv-futsal';

const game = axios.create({ baseURL: matchUrl });
const overview = axios.create({ baseURL: overviewUrl });
const table = axios.create({ baseURL: tableUrl });
const matchday = axios.create({ baseURL: matchdayUrl });
const awayTeamPlayers = axios.create({ baseURL: awayTeamPlayersUrl });

export async function readLineup() {
	try {
		const response = await game.get(matchId + '/ticker-id/selectedTickerId');
		const root = response.data;
		const home = parsePlayers(root.home_team);
		const away = parsePlayers(root.guest_team);
		return { home, away };
	} catch (e) {
		console.error(e);
		return {};
	}
}

function parsePlayers(team) {
	const members = team?.members;
	const players = [];
	for (const key in members) {
		const player = members[key];
		const result = {
			firstName: player.firstname,
			lastName: player.name,
			number: player.jersey_nr,
			is_captain: player.is_captain,
			is_keeper: player.is_keeper,
			is_starting: player.is_starting,
		};
		players.push(result);
	}
	return players;
}

export async function readReferees() {
	/*try {
		const response = await overview.get('');
		const root = parse(response.data);
		let result = [];
		for (const table of root.querySelectorAll('.m-MatchDetails-referees-list')) {
			const referees = table.querySelectorAll('a');
			result = referees.map((referee) => referee.text);
		}
		if (result.length > 0) {
			return result;
		}
		return result;
	} catch (e) {
		console.error(e);
	}*/
	return ['Jacob Pawlowski', 'Fatih Sava', 'Tobias Szombati', 'Farras Fathi'];
}

export async function readTable() {
	try {
		const response = await table.get('');
		const root = parse(response.data);
		let result = [];
		const htmlTable = root.querySelector('.fixtures-matchplan-tournaments-group-table');
		const body = htmlTable.querySelector('tbody');
		const rows = body.querySelectorAll('tr');
		for (const element of rows) {
			const row = element;
			const rank = row.querySelector('.column-rank').text.trim();
			const team = row.querySelector('.club-name').text.trim();
			const teamLogo = getTeamLogo(team);
			const games = row
				.querySelectorAll('td')
				.filter((cell) => cell.classNames.length === 0)[0]
				.text.trim();
			const goalDiff = row.querySelector('.hidden-small').text.trim();
			const points = row.querySelector('.column-points').text.trim();
			result.push({ rank, team, teamLogo, games, goalDiff, points });
		}
		return result;
	} catch (e) {
		console.error(e);
		return [];
	}
}

function getTeamLogo(teamName) {
	switch (teamName) {
		case 'Hamburger SV':
			return '/images/small/HSV.png';
		case 'HOT 05 Futsal':
			return '/images/small/HOT 05.png';
		case 'TSV Weilimdorf':
			return '/images/small/TSV Weilimdorf.png';
		case 'MCH Futsal Club Bielefeld':
			return '/images/small/MCH-Wappen-Bielefeld.png';
		case 'Futsal Panthers Köln':
			return '/images/small/futsal-panthers.png';
		case 'FC Liria Futsal':
			return '/images/small/liria.png';
		case 'Beton Boys München':
			return '/images/small/BB.png';
		case 'Fortuna Düsseldorf':
			return '/images/small/F95.png';
		case 'Jahn Regensburg Futsal':
			return '/images/small/jahn_futsal.png';
		case 'SV Pars Neu-Isenburg':
			return '/images/small/SV.png';
	}
}

export async function readMatchday() {
	return await parseMatchday(matchdayNumber, true);
}

export async function readNextMatchday() {
	const matches = await parseMatchday(matchdayNumber + 1);
	return { matches, number: matchdayNumber + 1 };
}

export async function readLastMatchday() {
	const matches = await parseMatchday(matchdayNumber - 1);
	return { matches, number: matchdayNumber - 1 };
}

async function parseMatchday(number, addLiveScores = false) {
	let result;
	try {
		result = await parseDFBMatchdayOverview(number);
	} catch (e) {
		console.error(e);
		return [];
	}

	if (addLiveScores) {
		await addLiveScoresToMatchday(result);
	}
	return result;
}

async function parseDFBMatchdayOverview(number) {
	const response = await matchday.get(number + '-spieltag');
	const root = parse(response.data);
	const matchdayHtml = root.querySelector('.c-MatchTable-body');
	let result = [];
	for (const match of matchdayHtml.querySelectorAll('.c-MatchTable-row')) {
		let homeTeam = match.querySelector('.c-MatchTable-team--home').querySelector('a').text.trim();
		homeTeam = convertToConsistentName(homeTeam);
		const homeImage = getTeamLogo(homeTeam);
		let awayTeam = match.querySelector('.c-MatchTable-team--away').querySelector('a').text.trim();
		awayTeam = convertToConsistentName(awayTeam);
		const awayImage = getTeamLogo(awayTeam);
		const score = match.querySelector('.c-MatchTable-score')?.text?.trim();
		const isLive = !!match.querySelector('.c-MatchTable-live');
		const date = match.querySelector('.c-MatchTable-description').querySelector('p').text.trim();
		result.push({ homeTeam, homeImage, awayTeam, awayImage, score, date, isLive });
	}
	return result;
}

async function addLiveScoresToMatchday(result) {
	// Use ticker by fussball.de for live scores if available:
	for (const matchId of otherMatches) {
		const response = await game.get(matchId + '/ticker-id/selectedTickerId');
		const root = response.data;
		if (!root || root.live === undefined) {
			continue;
		}
		const score = root.score;
		const homeTeam = convertToConsistentName(root.home_team.name);
		const guestTeam = convertToConsistentName(root.guest_team.name);
		// use or to reduce potential error sources, as the team names are not always consistent
		const match = result.find((m) => m.homeTeam === homeTeam || m.awayTeam === guestTeam);
		if (match) {
			match.originalScore = match.score;
			match.score = score;
			match.isLive = root.live;
			console.log('Match found:', homeTeam, guestTeam, score, match.isLive);
		} else {
			console.warn('Match not found:', homeTeam, guestTeam);
		}
	}
}

function convertToConsistentName(team) {
	switch (team) {
		case 'Hamburger SV (Futsal)':
			return 'Hamburger SV';
		case 'TSV Weilimdorf (Futsal)':
			return 'TSV Weilimdorf';
		case 'FC Liria':
		case 'FC Liria  Berlin':
		case 'FC Liria Berlin':
			return 'FC Liria Futsal';
		case 'Beton Boys München (Futsal)':
			return 'Beton Boys München';
		case 'Jahn Regensburg (Futsal)':
			return 'Jahn Regensburg Futsal';
	}
	return team;
}

export async function parseKaderList() {
	try {
		const response = await awayTeamPlayers.get('');
		const root = parse(response.data);
		const playersTable = root.querySelector('.dfb-Table-tableContainer');
		if (!playersTable) {
			return [];
		}
		const result = [];
		const nested = playersTable.querySelector('.c-Table-nested').querySelectorAll('table');
		// Skip first table (coach)
		for (let i = 1; i < nested.length; i++) {
			const table = nested[i];
			const title = table.querySelector('th')?.text?.trim();
			const is_keeper = title === 'Torwart';
			const rows = table.querySelector('tbody').querySelectorAll('.c-Table-body-row');
			for (const player of rows) {
				const nameLink = player.querySelector('a');
				let name = nameLink ? nameLink.text : player.querySelectorAll('td')[1]?.text;
				name = name.trim();
				const sep = name.lastIndexOf(' ');
				const firstName = name.substring(0, sep);
				const lastName = name.substring(sep + 1);
				result.push({ firstName, lastName, is_keeper });
			}
		}
		return result;
	} catch (e) {
		console.error(e);
		return [];
	}
}
