import { tinyws } from 'tinyws';

export class Companion {
	constructor(eventEmitter, app) {
		this.eventEmitter = eventEmitter;
		this.sockets = [];
		this.pingTimers = [];
		app.use('/companion', tinyws({
			perMessageDeflate: false,
		}), async (req) => {
			if (req.ws) {
				console.log('Connection established');
				const ws = await req.ws();
				this.sockets.push(ws);
				this.pingTimers.push(setInterval(() => {
					ws.ping();
				}, 10_000));

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

				ws.on('close', () => {
					console.log('Connection closed');
					const index = this.sockets.indexOf(ws);
					this.sockets.splice(index, 1);
					clearInterval(this.pingTimers[index]);
					this.pingTimers.splice(index, 1);
				});

				ws.on('error', (err) => {
					console.error(err);
				});
			}
		});
	}

	sendFeedback(team) {
		this.send(JSON.stringify({ team }));
	}

	sendPause(isTimerRunning) {
		this.send(JSON.stringify({ isTimerRunning }));
	}

	send(data) {
		for (const ws of this.sockets) {
			if (ws.readyState === ws.OPEN) {
				ws.send(data);
			}
		}
	}
}
