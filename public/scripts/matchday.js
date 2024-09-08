'use strict';

$(() => {
	const urlParams = new URLSearchParams(window.location.search);
	$.ajax({
		method: "GET",
		url: `/matchdayData/${urlParams.get('day')}`
	}).done(value => {
		//TODO
		for (const game of value) {
			const span = $(`<span> ${game.scoreHome} - ${game.scoreAway} </span>`);
			if (game.font) {
				$('head').append(`<link rel="stylesheet" href="${game.font}" type="text/css" />`);
				span.addClass(game.className);
			}
			$('body').append(span);
		}
	}).catch(error => {
		console.log(error);
	});
});