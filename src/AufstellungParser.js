import axios from 'axios';
import { parse } from 'node-html-parser';

// BFV overview page: https://www.bfv.de/spiele/02Q0SKPLG0000000VS5489B3VU5PPGUO
// same id used as by fussball.de

// IMPORTANT: Always update there two URLs before starting the prod server
// Jahn Regensburg: 02Q0SKPLG0000000VS5489B3VU5PPGUO

const matchId = '02Q0SKPM3K000000VS5489B3VU5PPGUO';

const otherMatches = ['02Q0SKPM6O000000VS5489B3VU5PPGUO', '02Q0SKPM24000000VS5489B3VU5PPGUO', '02Q0SKPM58000000VS5489B3VU5PPGUO', '02Q0SKPM88000000VS5489B3VU5PPGUO'];

const matchUrl = 'https://www.fussball.de/ajax.liveticker/-/spiel/';
// const overviewUrl = 'https://datencenter.dfb.de/datencenter/futsal-bundesliga/2024-2025/spieltag/beton-boys-muenchen-futsal-sv-pars-neu-isenburg-2388070';
const overviewUrl = 'https://datencenter.dfb.de/datencenter/futsal-bundesliga/2024-2025/spieltag/2388080';
const tableUrl =
	'https://www.fussball.de/spieltagsuebersicht/futsal-bundesliga-deutschland-futsal-bundesliga-herren-saison2425-deutschland/-/staffel/02P0KQ4NU4000000VS5489B3VU9BAIPM-C#!/';
const matchdayUrl = 'https://datencenter.dfb.de//competitions/futsal-bundesliga/seasons/2024-2025/matchday/spieltag/7-spieltag';

const game = axios.create({ baseURL: matchUrl });
const overview = axios.create({ baseURL: overviewUrl });
const table = axios.create({ baseURL: tableUrl });
const matchday = axios.create({ baseURL: matchdayUrl });

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
	try {
		const response = await overview.get('');
		const root = parse(response.data);
		let result = [];
		for (const table of root.querySelectorAll('.m-MatchDetails-referees-list')) {
			const referees = table.querySelectorAll('a');
			result = referees.map((referee) => referee.text);
		}
		if (result.length === 0) {
			result = ['Tobias Szombati', 'Alexander Schkarlat', 'Marijo Kraljic', 'Farras Fathi'];
		}
		return result;
	} catch (e) {
		console.error(e);
		return [];
	}
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
			return '/images/HSV_Raute_4c-_1_.jpg';
		case 'HOT 05 Futsal':
			return '/images/VfL05 neues Logo 2019 - mehrfarbig - 1000x1000px.jpg';
		case 'TSV Weilimdorf':
			return '/images/TSV Weilimdorf_Original.gif';
		case 'MCH Futsal Club Bielefeld':
			return '/images/MCH-Wappen-Bielefeld.png';
		case 'Futsal Panthers Köln':
			return '/images/logo-futsal-panthers-black.png';
		case 'FC Liria Futsal':
			return '/images/liria.png';
		case 'Beton Boys München':
			return '/images/Vereinlogo BB cut.png';
		case 'Fortuna Düsseldorf':
			return '/images/F95_Logo_rgb_Standard.png';
		case 'Jahn Regensburg Futsal':
			return '/images/logo_jahn_futsal_weiss.png';
		case 'SV Pars Neu-Isenburg':
			return '/images/VereinslogoSV.png';
	}
}

export async function readMatchday() {
	let result;
	try {
		result = await parseDFBMatchdayOverview();
	} catch (e) {
		console.error(e);
		return [];
	}

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
			match.score = score;
			match.isLive = root.live;
			console.log('Match found:', homeTeam, guestTeam, score, match.isLive);
		} else {
			console.warn('Match not found:', homeTeam, guestTeam);
		}
	}

	// console.log(result);
	return result;
}

async function parseDFBMatchdayOverview() {
	const response = await matchday.get('');
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

function convertToConsistentName(team) {
	switch (team) {
		case 'Hamburger SV (Futsal)':
			return 'Hamburger SV';
		case 'TSV Weilimdorf (Futsal)':
			return 'TSV Weilimdorf';
		case 'FC Liria':
		case 'FC Liria  Berlin':
			return 'FC Liria Futsal';
		case 'Beton Boys München (Futsal)':
			return 'Beton Boys München';
	}
	return team;
}
