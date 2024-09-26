import axios from 'axios';
import { parse } from 'node-html-parser';

// IMPORTANT: Always update there two URLs before starting the prod server
const matchUrl = 'https://www.fussball.de/ajax.liveticker/-/spiel/02Q0SKPL4K000000VS5489B3VU5PPGUO/ticker-id/selectedTickerId';
// const overviewUrl = 'https://datencenter.dfb.de/datencenter/futsal-bundesliga/2024-2025/spieltag/hot-05-futsal-beton-boys-muenchen-futsal-2388072';
const overviewUrl = 'https://datencenter.dfb.de/datencenter/futsal-bundesliga/2024-2025/spieltag/beton-boys-muenchen-futsal-sv-pars-neu-isenburg-2388070';
// TODO Referees, Coach

const game = axios.create({ baseURL: matchUrl });
const overview = axios.create({ baseURL: overviewUrl });

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
