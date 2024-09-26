'use strict';

$(() => {
	const loc = window.location;
	const new_uri = `${loc.protocol === 'https:' ? 'wss:' : 'ws:'}//${loc.host}/ws`;

	console.log(new_uri);

	const socket = new WebSocket(new_uri);
	socket.onmessage = (msg) => {
		const data = JSON.parse(msg.data);
		console.log(data);
		if (data.current) {
		}

		if (data.next) {
			$('#team').text(data.next.team);
			$('#time').text(data.next.time);
		}
	};
});
