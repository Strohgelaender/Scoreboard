$(() => {
	loadTeams();
	document.getElementById('addHome').addEventListener('click', addPlayerRow.bind(this, '#homeBody'));
	document.getElementById('addAway').addEventListener('click', addPlayerRow.bind(this, '#awayBody'));
	document.getElementById('saveBtn').addEventListener('click', postLineup);
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
	row.append($('<td>').append('<input type="number" min="1" name="number">'))
	row.append($('<td>').append('<input type="text" name="firstName">'))
	row.append($('<td>').append('<input type="text" name="lastName">'))
	row.append($('<td>').append('<input type="checkbox" name="is_keeper">'))
	row.append($('<td>').append('<input type="checkbox" name="is_starting">'))
	table.append(row);
}

function postLineup() {
	const result = {
		home: [],
		away: []
	};
	collectPlayers($('#homeBody'), result.home);
	collectPlayers($('#awyBody'), result.away);

	$.ajax({
		method: 'POST',
		url: `/lineup`,
		contentType: 'application/json',
		data: JSON.stringify(result),
	})
		.done((value) => {
			console.log('lineup updated');
		})
		.catch((error) => console.log(error));
}

function collectPlayers(table, result) {
	for (const tr of table.children()) {
		const player = {};
		for (const td of tr.children) {
			const input = td.children[0];
			console.log(input.name, input);
			// TODO how to deal with boolean inputs (always "on")
			player[input.name] = input.value;
		}
		result.push(player);
	}
}