'use strict';

let scoreHome = 0;
let scoreAway = 0;
let foulsHome = 0;
let foulsAway = 0;

let socket;

$(() => {
    const loc = window.location;
    const new_uri = `${(loc.protocol === "https:") ? "wss:" : "ws:"}//${loc.host}/events`;

    console.log(new_uri);

    socket = new WebSocket(new_uri);
    socket.onmessage = handleWebsocketMessageCommon;

    loadInitialScores();
});

function loadInitialScores() {
    $.ajax({
        method: "GET",
        url: `/scores`
    }).done(value => {
        console.log(value);
        scoreHome = value.scoreHome;
        scoreAway = value.scoreAway;
        foulsHome = value.foulsHome;
        foulsAway = value.foulsAway;
        updateScoreboard();
    }).catch(error => {
        console.log(error);
    });
}

function handleWebsocketMessageCommon(msg) {
    msg = JSON.parse(msg.data);
    console.log(msg);

    switch (msg.eventType) {
        case "GOAL":
            addScore(msg.team === 'HOME');
            break;
        case "OWN_GOAL":
            decreaseScore(msg.team === 'HOME');
            break;
        case "FOUL":
            addFoul(msg.team === 'HOME');
            break;
        case "REMOVE_FOUL":
            decreaseFoul(msg.team === 'HOME');
            break;
    }

    handleEventInternal(msg);
}


function addScore(homeTeam) {
    if (homeTeam) {
        scoreHome += 1;
    } else {
        scoreAway += 1;
    }
    updateScoreboard();
}

function decreaseScore(homeTeam) {
    if (homeTeam) {
        if (scoreHome > 0) {
            scoreHome -= 1;
        }
    } else {
        if (scoreAway > 0) {
            scoreAway -= 1;
        }
    }
    updateScoreboard();
}

function addFoul(homeTeam) {
    if (homeTeam) {
        foulsHome += 1;
    } else {
        foulsAway += 1;
    }
    updateScoreboard();
}

function decreaseFoul(homeTeam) {
    if (homeTeam) {
        if (foulsHome > 0) {
            foulsHome -= 1;
        }
    } else {
        if (foulsAway > 0) {
            foulsAway -= 1;
        }
    }
    updateScoreboard();
}

function updateScoreboard() {
    //TODO animations
    $('#homeScore').text(scoreHome);
    $('#awayScore').text(scoreAway);
}
