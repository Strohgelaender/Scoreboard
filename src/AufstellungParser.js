import axios from 'axios';
import { parse } from 'node-html-parser';

// IMPORTANT: Always update there two URLs before starting the prod server
const matchUrl = 'https://www.fussball.de/ajax.liveticker/-/spiel/02Q0SKPL4K000000VS5489B3VU5PPGUO/ticker-id/selectedTickerId';
// const overviewUrl = 'https://datencenter.dfb.de/datencenter/futsal-bundesliga/2024-2025/spieltag/hot-05-futsal-beton-boys-muenchen-futsal-2388072';
const overviewUrl = 'https://datencenter.dfb.de/datencenter/futsal-bundesliga/2024-2025/spieltag/beton-boys-muenchen-futsal-sv-pars-neu-isenburg-2388070';
const tableUrl =
	'https://www.fussball.de/spieltagsuebersicht/futsal-bundesliga-deutschland-futsal-bundesliga-herren-saison2425-deutschland/-/staffel/02P0KQ4NU4000000VS5489B3VU9BAIPM-C#!/';
// TODO Coaches

const game = axios.create({ baseURL: matchUrl });
const overview = axios.create({ baseURL: overviewUrl });
const table = axios.create({ baseURL: tableUrl });

export async function readLineup() {
	const response = await game.get('');
	const root = response.data;
	const home = parsePlayers(root.home_team);
	const away = parsePlayers(root.guest_team);
	return { home, away };
}

function parsePlayers(team) {
	const members = team.members;
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
	const response = await overview.get('');
	const root = parse(response.data);
	let result = [];
	for (const table of root.querySelectorAll('.m-MatchDetails-referees-list')) {
		const referees = table.querySelectorAll('a');
		result = referees.map((referee) => referee.text);
	}
	return result;
}

export async function readTable() {
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
		const games = row
			.querySelectorAll('td')
			.filter((cell) => cell.classNames.length === 0)[0]
			.text.trim();
		const goalDiff = row.querySelector('.hidden-small').text.trim();
		const points = row.querySelector('.column-points').text.trim();
		result.push({ rank, team, games, goalDiff, points });
	}
	console.log(result);
	return result;
}
