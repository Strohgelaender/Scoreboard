import { onInput } from './eventManager.js';
import { Keyboard } from './keyboard.js';
import { Streamdeck } from './streamdeck.js';
import { getMatchTimer } from './index.js';

const keyboard = new Keyboard(onInput);
const streamdeck = new Streamdeck(onInput);
getMatchTimer().onPause = streamdeck.updateTimerImage.bind(streamdeck);
