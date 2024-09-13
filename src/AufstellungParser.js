const axios = require('axios');

const matchUrl = 'https://www.fussball.de/ajax.liveticker/-/spiel/02Q0SKPL4K000000VS5489B3VU5PPGUO/ticker-id/selectedTickerId';
const game = axios.create({
    baseURL: matchUrl
});

async function readLineup() {
    const response = await game.get('');
    const root = response.data;
    const home = parsePlayers(root.home_team);
    const away = parsePlayers(root.guest_team);
    return {home, away};
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

module.exports.readLineup = readLineup;
