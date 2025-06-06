import axios from 'axios';
import { parse } from 'node-html-parser';

// BFV overview page: https://www.bfv.de/spiele/02Q0SKPLG0000000VS5489B3VU5PPGUO
// same id used as by fussball.de

// IMPORTANT: Always update there two URLs before starting the prod server

const matchdayNumber = +process.env.MATCHDAY || 10;

const matchId = '02SK0R87NK000000VS5489B4VVT7BD1S';

const otherMatches = ['02SK0QTUCG000000VS5489B4VVT7BD1S', '02SK0RK914000000VS5489B4VVT7BD1S', '02SK0RU7OS000000VS5489B4VVT7BD1S'];

const matchUrl = 'https://www.fussball.de/ajax.liveticker/-/spiel/';
const overviewUrl = 'https://datencenter.dfb.de/datencenter/futsal-bundesliga/2024-2025/spieltag/fc-liria-jahn-regensburg-futsal-2388171';
const tableUrl =
	// 'https://www.fussball.de/spieltagsuebersicht/futsal-bundesliga-deutschland-futsal-bundesliga-herren-saison2425-deutschland/-/staffel/02P0KQ4NU4000000VS5489B3VU9BAIPM-C#!/';
	'https://www.fussball.de/ajax.fixtures.tournament/-/action/OPEN/staffel/02Q0HO9U98000002VS5489B4VVE5FNTJ-G';
const matchdayUrl = 'https://datencenter.dfb.de//competitions/futsal-bundesliga/seasons/2024-2025/matchday/spieltag/';
const matchdayUrlQF = 'https://datencenter.dfb.de//de/competitions/futsal-bundesliga/seasons/2024-2025/matchday/viertelfinale';
const awayTeamPlayersUrl = 'https://datencenter.dfb.de/competitions/futsal-bundesliga/seasons/2024-2025/teams/hamburger-sv-futsal';

const beachsoccerMatchdayUrl =
	'https://datencenter.dfb.de//competitions/deutsche-beachsoccer-liga/seasons/2025/matchday/spieltagswochenenden-1-3/1-spieltag?utf8=%E2%9C%93&path=/competitions/deutsche-beachsoccer-liga/seasons/2025/matchday/spieltagswochenenden-1-3/1-spieltag?datacenter_name=datencenter';

const game = axios.create({ baseURL: matchUrl });
const overview = axios.create({ baseURL: overviewUrl });
const table = axios.create({ baseURL: tableUrl });
const matchday = axios.create({ baseURL: matchdayUrl });
const beachsoccerMatchday = axios.create({ baseURL: beachsoccerMatchdayUrl });
const matchdayQF = axios.create({ baseURL: matchdayUrlQF });
const awayTeamPlayers = axios.create({ baseURL: awayTeamPlayersUrl });

/*
export const playoffMatches = [
	{
		homeTeam: 'FCL',
		homeImage: getTeamLogo('FC Liria Futsal'),
		awayTeam: 'TSV',
		awayImage: getTeamLogo('TSV Weilimdorf'),
		scores: [
			{ home: '-', away: '-' },
			{ home: '-', away: '-' },
			{ home: '-', away: '-' },
		],
	},
	{
		homeTeam: 'BBM',
		homeImage: getTeamLogo('Beton Boys München'),
		awayTeam: 'HSV',
		awayImage: getTeamLogo('Hamburger SV'),
		scores: [
			{ home: '-', away: '-' },
			{ home: '-', away: '-' },
			{ home: '-', away: '-' },
		],
	},
	{
		homeTeam: 'MCH',
		homeImage: getTeamLogo('MCH Futsal Club Bielefeld'),
		awayTeam: 'SSV',
		awayImage: getTeamLogo('Jahn Regensburg Futsal'),
		scores: [
			{ home: '-', away: '-' },
			{ home: '-', away: '-' },
			{ home: '-', away: '-' },
		],
	},
	{
		homeTeam: 'F95',
		homeImage: getTeamLogo('Fortuna Düsseldorf'),
		awayTeam: 'HOT',
		awayImage: getTeamLogo('HOT 05 Futsal'),
		scores: [
			{ home: '-', away: '-' },
			{ home: '-', away: '-' },
			{ home: '-', away: '-' },
		],
	},
];*/

export const referees = ['Christian Grundler', 'Maximilian Scheibel', 'Marijo Kraljic', 'Martin Horne'];

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
	return referees;
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
		// Beachsoccer
		case 'Beach Royals Düsseldorf':
			return '/images/small/Beach_Royals_Düsseldorf.png';
		case 'Rostocker Robben':
			return '/images/small/Rostocker_Robben.png';
		case 'Bavaria Beach Bazis':
			return '/images/small/Bavaria_Beach_Bazis.png';
		case 'Hohensee United':
			return '/images/small/Hohensee_United.png';
		case 'Herta BSC':
		case 'Hertha BSC Beachsoccer':
			return '/images/small/Hertha_BSC.png';
		case 'Real Münster':
			return '/images/small/real_münster_black.png';
		case 'SV Merkur':
		case 'SV Merkur Beachsoccer':
			return '/images/small/SV_Merkur.png';
		case 'Golden Goalers Korbach':
			return '/images/small/korbach_golden_goalers.png';
		case 'Beach Boyz Waldkraiburg':
			return '/images/small/BSC-Beach-Boyz-Waldkraiburg.png';
	}
}

export async function readMatchday() {
	// return await parseMatchday(matchdayNumber, true);
	let matches = await parseDFBMatchdayOverviewWithBase(beachsoccerMatchday, '');
	matches = matches.splice(0, 5);
	await addLiveScoresToMatchday(matches);
	return matches;
}

export async function readNextMatchday() {
	//const matches = await parseMatchday(matchdayNumber + 1);
	// return { matches, number: matchdayNumber + 1 };
	const matches = await parseDFBMatchdayOverviewWithBase(matchdayQF, '');
	return { matches: matches.splice(4) };
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
	return await parseDFBMatchdayOverviewWithBase(matchday, number + '-spieltag');
}

async function parseDFBMatchdayOverviewWithBase(base, path) {
	const response = await base.get(path);
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

		const homeImage = getTeamLogo(homeTeam);
		const awayImage = getTeamLogo(guestTeam);
		// const playoffMatch = playoffMatches.find((m) => m.homeImage === homeImage || m.awayImage === awayImage);

		if (match) {
			match.originalScore = match.score;
			match.score = score;
			match.isLive = root.live;
			console.log('Match found:', homeTeam, guestTeam, score, match.isLive);
		} else {
			console.warn('Match not found:', homeTeam, guestTeam);
		}

		/*
		if (playoffMatch) {
			const scoreParts = score.split(':');
			playoffMatch.scores[0] = { home: scoreParts[0], away: scoreParts[1], live: root.live };
		}
		 */
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

export async function parseMatchEvents() {
	try {
		const response = await overview.get('');
		const root = parse(response.data);

		const result = [];

		const allLists = root.querySelectorAll('.m-MatchDetails-history');
		const matchDetailsList = allLists.find((list) => {
			const title = list.querySelector('.m-MatchDetails-history-title').text.trim();
			return title === 'Tore';
		});

		for (const item of matchDetailsList.querySelectorAll('.m-MatchDetails-history-item')) {
			let minute = item.querySelector('.m-MatchDetails-history-minute').text;
			minute = minute.trim();
			minute = parseInt(minute.replace("'", '')); // Remove '

			const events = item.querySelectorAll('.m-MatchDetails-history-event');
			const event = events.find((event) => !event.classList.contains('is-empty'));
			const team = event.classList.contains('m-MatchDetails-history-event--home') ? 'HOME' : 'AWAY';

			const segments = event.querySelectorAll('.m-MatchDetails-history-event-text-segment');
			for (const segment of segments) {
				const playerName = segment.querySelector('a')?.text;

				const event = {
					minute: minute,
					team: team,
					player: playerName,
				};

				const text = segment.text;
				if (text.includes('Eigentor')) {
					event.team = team === 'HOME' ? 'AWAY' : 'HOME';
					event.ownGoal = true;
				}

				result.push(event);
			}
		}

		return result;
	} catch (e) {
		console.error(e);
		return [];
	}
}
