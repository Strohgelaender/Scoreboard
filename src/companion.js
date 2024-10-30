import { tinyws } from 'tinyws';

export class Companion {
	constructor(eventEmitter, app) {
		this.eventEmitter = eventEmitter;
		this.sockets = [];
		app.use('/companion', tinyws(), async (req) => {
			if (req.ws) {
				const ws = await req.ws();
				this.sockets.push(ws);
				ws.on('message', (msg) => {
					const message = msg.toString().toUpperCase();
					console.log('Received message:', message);
					if (message.startsWith('ADD_TIME')) {
						const time = parseInt(message.split(' ')[1]);
						this.eventEmitter('ADD_TIME', time);
					} else {
						this.eventEmitter(message);
					}
				});
			}
		});
	}

	sendFeedback(team) {
		for (const socket of this.sockets) {
			socket.send(JSON.stringify({ team }));
		}
	}

	sendPause(isTimerRunning) {
		for (const socket of this.sockets) {
			socket.send(JSON.stringify({ isTimerRunning }));
		}
	}
}
