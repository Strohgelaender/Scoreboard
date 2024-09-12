'use strict';

$(() => {
    loadTeams();
});

function loadTeams() {
    $.ajax({
        method: 'GET',
        url: `/data/info`
    }).done(value => {
        const home = value.home;
        const away = value.away;
        $('#homeName').text(home.name);
        $('#awayName').text(away.name);
        $(`#homeShirtLine`).css('background-color', home.shirtColor);
        $(`#awayShirtLine`).css('background-color', away.shirtColor);
    }).catch(error => {
        console.log(error);
    });
}

function handleEventInternal(event) {
    switch (event.eventType) {
        case 'GOAL':
            if (event.hasOwnProperty('playerData')) {
                //showLowerThirds(event);
            }
            break;
        case 'OWN_GOAL':
            if (event.hasOwnProperty('playerData')) {
                //showLowerThirds(event);
            }
            break;
        case 'TOGGLE_SCOREBOARD':
            $('#scoreboard').fadeToggle(1000, "swing");
            break;
        case 'SHOW_NAMES':
            showLowerThirds('.blendNames');
            break;
        case 'SHOW_RIGHT':
            showLowerThirds('.blendRight');
            break;
        case 'SHOW_LEFT':
            showLowerThirds('.blendLeft');
            break;
        case 'SHOW_EXTRA':
            if (event.text)
                showExtra(event.text, 10000);
            break;
        case "FOUL":
        case "REMOVE_FOUL":
            updateFouls();
            break;
    }
}

function updateFouls() {
    updateFoulsContent($('#homeFoulsBox'), $('#homeFouls'), foulsHome);
    updateFoulsContent($('#awayFoulsBox'), $('#awayFouls'), foulsAway);
}

function updateFoulsContent(foulsBox, foulsText, fouls) {
    if (fouls > 0 && foulsBox.css('display') === 'none') {
        foulsBox.fadeIn(1000);
    } else if (foulsHome === 0) {
       foulsBox.fadeOut(1000);
    }
    foulsText?.text(foulsToText(foulsHome));
}

function foulsToText(fouls) {
    let result = "";
    while (fouls >= 5) {
        result += "V";
        fouls -= 5;
    }
    result += "|".repeat(fouls);
    return result;
}

function showLowerThirds(selectorName) {
    const elems = $(selectorName);
    blendWatermark(5000);
    elems.fadeIn(1000);
    setTimeout(() => {
        elems.fadeOut(1000);
    }, 5000);
}

const FONT_SIZE = 40;

function showExtra(text, timeout) {
    const content = $('#tiesExtraContent');
    content.text(text);
    let newSize = parseInt(content.css('font-size'), 10);
    while (content.width() >= 1450) {
        content.css('font-size', --newSize);
        if (newSize < 10)
            break;
    }
    blendWatermark(timeout);
    const extra = $('.blendExtra');
    extra.fadeIn(1000);
    setTimeout(() => extra.fadeOut(1000, () => content.css('font-size', FONT_SIZE)), timeout);
}

function blendWatermark(timeout) {
    const watermark = $('#watermark');
    watermark.animate({opacity: '1.0'}, 1000);
    setTimeout(() => watermark.animate({opacity: '0.2'}, 1000), timeout);

}

function buildLowerThirdsText(event) {
    if (!event.playerData)
        return;

    switch (event.eventType) {
        case 'GOAL':
            return event.playerData.goals + '. Saison-Tor';
        case 'OWN_GOAL':
            return event.playerData.ownGoals + '. Saison-Eigentor';
        case 'YELLOW_CARD':
            return event.playerData.yellowCards + '. gelbe Karte';
        case 'RED_CARD':
            return event.playerData.redCards + '. Platzverweis';
    }
}
