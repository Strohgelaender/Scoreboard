const fs = require('fs');
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

const {openStreamDeck} = require('elgato-stream-deck');

const PORT = process.env.PORT || 5000;

const timetable = [
	{
		time: '11:34',
		round: 2,
		team: 'Otto-Hahn-Robots'
	}, {
		time: '11:38',
		round: 2,
		team: 'SGB'
	}, {
		time: '11:42',
		round: 2,
		team: 'RobotIKG'
	}, {
		time: '11:46',
		round: 2,
		team: 'Team Würzenbach'
	}, {
		time: '11:50',
		round: 2,
		team: 'RoboTigersHSG'
	},
	{
		time: '11:54',
		round: 2,
		team: 'Die Produktativen'
	}, {
		time: '11:58',
		round: 2,
		team: 'roboGHOst'
	}, {
		time: '12:02',
		round: 2,
		team: 'PaRaMeRoS'
	}, {
		time: '12:06',
		round: 2,
		team: 'AKRobotics'
	}, {
		time: '12:10',
		round: 2,
		team: 'MPG IT Girls'
	}, {
		time: '12:14',
		round: 2,
		team: 'GO ROBOT'
	}, {
		time: '12:18',
		round: 2,
		team: 'NEEDS NO NAME'
	}, {
		time: '12:26',
		round: 2,
		team: 'MPG Roboboys',
	}, {
		time: '13:26',
		round: 3,
		team: 'Team Würzenbach'
	}, {
		time: '13:30',
		round: 3,
		team: 'RoboTigersHSG'
	}, {
		time: '13:34',
		round: 3,
		team: 'Die Produktativen'
	}, {
		time: '13:38',
		round: 3,
		team: 'roboGHOst'
	}, {
		time: '13:42',
		round: 3,
		team: 'PaRaMeRoS'
	}, {
		time: '13:46',
		round: 3,
		team: 'AKRobotics'
	}, {
		time: '13:50',
		round: 3,
		team: 'MPG IT Girls'
	}, {
		time: '13:54',
		round: 3,
		team: 'GO ROBOT'
	}, {
		time: '13:58',
		round: 3,
		team: 'NEEDS NO NAME'
	}, {
		time: '14:06',
		round: 3,
		team: 'MPG Roboboys'
	}, {
		time: '14:14',
		round: 3,
		team: 'Otto-Hahn-Robots'
	}, {
		time: '14:18',
		round: 3,
		team: 'SGB'
	}, {
		time: '14:22',
		round: 3,
		team: 'RobotIKG'
	}
];
let currentTeam = -1;

const webSockets = [];

app.listen(PORT, () => console.log(`Server started at port ${PORT}`));

app.get('/', (req, res) => {
	res.send('The Server is up and running');
});


app.get('/', (req, res) => {
	res.send('The Server is up and running');
});

app.get('/nextGame', (req, res) => {
	res.redirect('/html/nextGame.html');
});

app.ws('/ws', (ws, req) => webSockets.push(ws));

function sendTeam() {
	const event = {};
	if (currentTeam >= 0)
		event.current = timetable[currentTeam];
	if (currentTeam + 1 < timetable.length)
		event.next = timetable[currentTeam + 1];

	for (const ws of webSockets) {
		if (ws.readyState === ws.OPEN) {
			const string = JSON.stringify(event);
			console.log(string);
			ws.send(string);
		}
	}
}

const NEXT_BUTTON = 12;
const BACK_BUTTON = 11;


const streamDeck = openStreamDeck();

app.use(express.static('public'));

streamDeck.on('down', keyIndex => {
	console.log(keyIndex);
	if (keyIndex === NEXT_BUTTON) {
		currentTeam++;
		sendTeam();
	} else if (keyIndex === BACK_BUTTON) {
		currentTeam--;
		sendTeam();
	}
});
