'use strict';

let createdPlayers = 0;

addEventListener('DOMContentLoaded', () => {
	loadTeams();
	loadPlayers();
	document.getElementById('addHome').addEventListener('click', addPlayerRow.bind(this, 'homeBody'));
	document.getElementById('addAway').addEventListener('click', addPlayerRow.bind(this, 'awayBody'));
	document.getElementById('saveBtn').addEventListener('click', postLineup);
});

document.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' && e.target.type === 'checkbox') {
		//e.target.checked = !e.target.checked;
		e.target.click();
	}
});

function loadTeams() {
	fetch('/data/info', { method: 'GET' })
		.then((response) => response.json())
		.then((value) => {
			const home = value.home;
			const away = value.away;

			document.getElementById('homeName').textContent = home.name;
			document.getElementById('awayName').textContent = away.name;
		}).catch((console.error));
}

function loadPlayers() {
	fetch('/players', { method: 'GET' })
		.then((response) => response.json())
		.then((value) => {
			if (value.home?.length) {
				const homeBody = document.getElementById('homeBody');
				for (const player of value.home) {
					addPlayerRowToTable(homeBody, player);
				}
			}
			if (value.away?.length) {
				const awayBody = document.getElementById('awayBody');
				for (const player of value.away) {
					addPlayerRowToTable(awayBody, player);
				}
			}
		}).catch((console.error));
}

function addPlayerRow(tableId, player) {
	const table = document.getElementById(tableId);
	addPlayerRowToTable(table, player);
}

function addPlayerRowToTable(table, player) {
	const players = table.children?.length;
	const starting = (players < 5 && !player) || player.is_starting;
	const id = 'player' + ++createdPlayers;
	const row =  document.createElement("tr");
	row.id = id;

	row.innerHTML = `
        <td><input type="number" min="1" name="number" class="form-control" ${player?.number ? `value="${player.number}"` : ""}></td>
        <td><input type="text" name="firstName" class="form-control" ${player?.firstName ? `value="${player.firstName}"` : ""}></td>
        <td><input type="text" name="lastName" class="form-control" ${player?.lastName ? `value="${player.lastName}"` : ""}></td>
        <td><input type="checkbox" name="is_keeper" class="form-check-input" ${player?.is_keeper ? "checked" : ""}></td>
        <td><input type="checkbox" name="is_captain" class="form-check-input" ${player?.is_captain ? "checked" : ""}></td>
        <td><input type="checkbox" name="is_starting" class="form-check-input" ${starting ? "checked" : ""}></td>
        <td><button class="btn btn-secondary">-</button></td>
    `;

	row.querySelector("button").addEventListener("click", () => {
		console.log("remove", id);
		table.removeChild(row);
	});
	table.appendChild(row);
}

function postLineup() {
	const result = {
		home: [],
		away: [],
	};
	collectPlayers(document.getElementById('homeBody'), result.home);
	collectPlayers(document.getElementById('awayBody'), result.away);

	fetch('/lineup', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(result),
	})
		.then(() => console.log('Lineup saved'))
		.catch(console.error);
}

function collectPlayers(table, result) {
	for (const tr of table.children) {
		const player = {};
		for (const td of tr.children) {
			const input = td.children[0];
			if (input.type === 'checkbox') {
				player[input.name] = input.checked;
			} else {
				player[input.name] = input.value;
			}
		}
		result.push(player);
	}
}
