import { tinyws } from 'tinyws';

export class Companion {
	constructor(eventEmitter, app) {
		this.eventEmitter = eventEmitter;
		app.use('/companion', tinyws(), async (req) => {
			if (req.ws) {
				const ws = await req.ws();
				ws.on('message', (msg) => {
					const message = msg.toString().toUpperCase();
					if (message === 'HOME') {
						this.eventEmitter('HOME');
					} else if (message === 'AWAY') {
						this.eventEmitter('AWAY');
					} else {
						this.eventEmitter(message);
					}
				});
			}
		});
	}
}
