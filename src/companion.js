import WebSocket from 'ws';

const PORT = +process.env.PORT + 1 || 1861;
const wss = new WebSocket.Server({ port: PORT });

export class Companion {
	constructor(eventEmitter) {
		this.eventEmitter = eventEmitter;
		this.sockets = [];
		this.pingTimers = [];
		wss.on('connection', (ws) => {
			console.log('Connection established');
			this.sockets.push(ws);
			const pingInterval = setInterval(() => {
				ws.ping();
			}, 10_000);
			this.pingTimers.push(pingInterval);

			ws.on('message', (msg) => {
				const message = msg.toString().toUpperCase();
				console.log('Received message:', message);
				if (message.startsWith('ADD_TIME') || message.startsWith('NUMBER')) {
					const parts = message.split(' ');
					const time = parseInt(parts[1]);
					this.eventEmitter(parts[0], time);
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
		});
	}

	sendFeedback(feedback) {
		this.send(JSON.stringify(feedback));
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
