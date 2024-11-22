import { OBSWebSocket } from 'obs-websocket-js';
import fs from 'fs';

const OBS_PASSWORD = process.env.OBS_PASSWORD || '';
const EVENT_FILE = `data/${new Date().toISOString().replace(/:/g, '-')}.txt`;

export class ObsService {
	constructor() {
		this.obs = new OBSWebSocket();
		// TODO: Keep this in sync with client
		this.showingScoreboard = true;

		(async () => {
			try {
				await this.obs.connect('ws://localhost:4455', OBS_PASSWORD);
				console.log('OBS connected');
			} catch {
				console.error('OBS not connected');
			}
		})().then();
	}

	handleEvent(event) {
		if (event.eventType === 'GOAL') {
			this.logEvent(event);
		}
		if (event.eventType === 'TOGGLE_SCOREBOARD') {
			this.toggleScoreboardVideo();
		}
	}

	async getObsTimestamp() {
		const streamStatus = await this.obs.call('GetStreamStatus');
		console.log(streamStatus);
		const recordingStatus = await this.obs.call('GetRecordStatus');
		console.log(recordingStatus);
		return {
			stream: streamStatus.outputTimecode,
			recording: streamStatus.outputTimecode,
		};
	}

	async logEvent(event) {
		try {
			const timestamp = await this.getObsTimestamp();
			let eventString = `${event.eventType}:${event.team}\t${timestamp.stream}\t${timestamp.recording}\n`;
			if (fs.existsSync(EVENT_FILE)) {
				fs.appendFileSync(EVENT_FILE, eventString);
			} else {
				eventString = 'Event\tStream\tRecording\n' + eventString;
				fs.writeFileSync(EVENT_FILE, eventString);
			}
		} catch (e) {
			console.error(e.message);
		}
	}

	toggleScoreboardVideo() {
		if (this.showingScoreboard) {
			this.obs
				.call('SetSceneItemEnabled', {
					sceneName: 'Overlay',
					sceneItemId: 3,
					sceneItemEnabled: false,
				})
				.catch((e) => console.error(e.message));
		} else {
			this.obs
				.call('TriggerMediaInputAction', {
					inputName: 'Logo',
					inputUuid: 3,
					mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART',
				})
				.then(() => {
					this.obs
						.call('SetSceneItemEnabled', {
							sceneName: 'Overlay',
							sceneItemId: 3,
							sceneItemEnabled: true,
						})
						.catch((e) => console.error(e.message));
				})
				.catch((e) => console.error(e.message));
		}
		this.showingScoreboard = !this.showingScoreboard;
	}

	disconnect() {
		return this.obs.disconnect();
	}
}
