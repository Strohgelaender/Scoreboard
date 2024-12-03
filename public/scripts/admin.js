'use strict';

let createdPlayers = 0;

addEventListener('DOMContentLoaded', () => {
	loadTeams();
	loadPlayers();
	loadGoalEvents();
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
		})
		.catch(console.error);
}

function loadPlayers() {
	fetch('/players', { method: 'GET' })
		.then((response) => response.json())
		.then((value) => {
			if (value.home?.length) {
				const homeBody = document.getElementById('homeBody');
				addAllPlayers(homeBody, value.home);
			}
			if (value.away?.length) {
				const awayBody = document.getElementById('awayBody');
				addAllPlayers(awayBody, value.away);
			}
		})
		.catch(console.error);
}

function loadGoalEvents() {
	fetch('/goalEvents0', {method: 'GET'})
		.then((r) => r.json())
		.then((events) => {
			for (const event of events) {
				addGoalEvent(event);
			}
		})
		.catch(console.error);
}

function addAllPlayers(body, players) {
	players = players.sort((p1, p2) => {
		if (p1.number && p2.number) {
			return +p1.number - +p2.number;
		} else if (p1.number) {
			return -1;
		} else if (p2.number) {
			return 1;
		}
		return 0;
	});
	for (const player of players) {
		addPlayerRowToTable(body, player);
	}
}

function addPlayerRow(tableId, player) {
	const table = document.getElementById(tableId);
	addPlayerRowToTable(table, player);
}

function addPlayerRowToTable(table, player) {
	const players = table.children?.length;
	const starting = (players < 5 && !player) || player.is_starting;
	const id = 'player' + ++createdPlayers;
	const row = document.createElement('tr');
	row.id = id;

	row.innerHTML = `
        <td><input type="number" min="1" name="number" class="form-control" ${player?.number ? `value="${player.number}"` : ''}></td>
        <td><input type="text" name="firstName" class="form-control" ${player?.firstName ? `value="${player.firstName}"` : ''}></td>
        <td><input type="text" name="lastName" class="form-control" ${player?.lastName ? `value="${player.lastName}"` : ''}></td>
        <td><input type="checkbox" name="is_keeper" class="form-check-input" ${player?.is_keeper ? 'checked' : ''}></td>
        <td><input type="checkbox" name="is_captain" class="form-check-input" ${player?.is_captain ? 'checked' : ''}></td>
        <td><input type="checkbox" name="is_starting" class="form-check-input" ${starting ? 'checked' : ''}></td>
        <td><input type="text" name="goals" class="form-control-plaintext form-control-sm" disabled readonly value="${player?.goals ? player.goals : 0}"></td>
        <td><input type="text" name="yellowCards" class="form-control-plaintext form-control-sm" disabled readonly value="${player?.yellowCards ? player.yellowCards : 0}"></td>
        <td><button class="btn btn-secondary">-</button></td>
    `;

	row.querySelector('button').addEventListener('click', () => {
		console.log('remove', id);
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
			if (!input?.name) {
				continue;
			}
			if (input.type === 'checkbox') {
				player[input.name] = input.checked;
			} else {
				player[input.name] = input.value;
			}
		}
		result.push(player);
	}
}

function addGoalEvent(event) {
	const tbody = document.getElementById('goalEventBody');
	const row = document.createElement('tr');

	// TODO Team Input combobox
	row.innerHTML = `
        <td><input type="number" min="1" max="20" name="minute" class="form-control" value="${event.minute}"></td>
        <td><input type="text" name="team" class="form-control" value="${event.team}"></td>
        <td><input type="number" min="1" name="number" class="form-control" value="${event.player.number}"></td>
		<td>${event.player.firstName} ${event.player.lastName}</td>
	`;

	tbody.appendChild(row);
}

// TODO update goal event table
function handleEventInternal(event) {
	if (event.eventType === 'SHOW_BOTTOM_SCOREBOARD') {
		const goalEvents = event.goalEvents;
	}
}

