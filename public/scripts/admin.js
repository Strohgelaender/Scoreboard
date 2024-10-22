$(() => {
	loadTeams();
	document.getElementById('addHome').addEventListener('click', addPlayerRow.bind(this, '#homeBody'));
	document.getElementById('addAway').addEventListener('click', addPlayerRow.bind(this, '#awayBody'));
	document.getElementById('saveBtn').addEventListener('click', postLineup);
});

document.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' && e.target.type === 'checkbox') {
		//e.target.checked = !e.target.checked;
		e.target.click();
	}
});

function loadTeams() {
	$.ajax({
		method: 'GET',
		url: `/data/info`,
	})
		.done((value) => {
			const home = value.home;
			const away = value.away;

			$('#homeName').text(home.name);
			$('#awayName').text(away.name);
		})
		.catch((error) => console.log(error));
}

function addPlayerRow(tbody) {
	const table = $(tbody);
	const row = $('<tr>');
	row.append($('<td>').append('<input type="number" min="1" name="number" class="form-control">'));
	row.append($('<td>').append('<input type="text" name="firstName" class="form-control">'));
	row.append($('<td>').append('<input type="text" name="lastName" class="form-control">'));
	row.append($('<td>').append('<input type="checkbox" name="is_keeper" class="form-check-input">'));
	row.append($('<td>').append('<input type="checkbox" name="is_captain" class="form-check-input">'));
	row.append($('<td>').append('<input type="checkbox" name="is_starting" class="form-check-input">'));
	table.append(row);
}

function postLineup() {
	const result = {
		home: [],
		away: [],
	};
	collectPlayers($('#homeBody'), result.home);
	collectPlayers($('#awayBody'), result.away);

	$.ajax({
		method: 'POST',
		url: `/lineup`,
		contentType: 'application/json',
		data: JSON.stringify(result),
	})
		.done(() => console.log('Lineup saved'))
		.catch((error) => console.log(error));
}

function collectPlayers(table, result) {
	for (const tr of table.children()) {
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
