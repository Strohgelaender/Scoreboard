import { addListener, onInput } from './eventManager.js';
import { Keyboard } from './keyboard.js';
import { Streamdeck } from './streamdeck.js';
import { getMatchTimer, getApp } from './index.js';
import { Companion } from './companion.js';

const keyboard = new Keyboard(onInput);
// const streamdeck = new Streamdeck(onInput);
// getMatchTimer().onPause = streamdeck.updateTimerImage.bind(streamdeck);

const companion = new Companion(onInput, getApp());
addListener(companion.sendFeedback.bind(companion));
getMatchTimer().onPause = companion.sendPause.bind(companion);
