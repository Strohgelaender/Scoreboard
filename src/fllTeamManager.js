const teams = [
	// Schweiz - Jura
	{
		id: 1,
		name: 'mindfactory',
		institution: 'JuFoTec',
		location: 'Baden',
	},
	{
		id: 2,
		name: 'E-Arts',
		institution: 'Privat',
		location: 'Arnex sur Orbe',
	},
	{
		id: 3,
		name: 'Capricorns',
		institution: 'Bündner Kantonsschule Chur',
		location: 'Chur',
	},
	// Aachen
	{
		id: 4,
		name: 'Theobots',
		institution: 'Gymnasium Theodorianum',
		location: 'Paderborn',
	},
	{
		id: 5,
		name: 'GSG Robots',
		institution: 'Geschwister-Scholl-Gymnasium',
		location: 'Ludwigshafen am Rhein',
	},
	{
		id: 6,
		name: 'tASG force',
		institution: 'Städt. Albert Schweizer Gymnasium Plettenberg',
		location: 'Plettenberg',
	},
	// Heidelberg
	{
		id: 7,
		name: 'Here We GO',
		institution: 'Gymnasium Ottobrunn',
		location: 'Ottobrunn',
	},
	{
		id: 8,
		name: 'GarsControl Senior',
		institution: 'Gymnasium Gars',
		location: 'Gars am Inn',
	},
	{
		id: 10,
		name: 'RoHoKi',
		institution: 'Staatliches Gymnasium Holzkirchen',
		location: 'Holzkirchen',
	},
	// Braunschweig
	{
		id: 11,
		name: 'Robotigers',
		institution: 'KGS Ronnenberg',
		location: 'Ronnenberg',
	},
	{
		id: 12,
		name: 'rhsRobotX',
		institution: 'Ricarda-Huch-Schule',
		location: 'Braunschweig',
	},
	{
		id: 13,
		name: 'We aRe oNe Black',
		institution: 'We aRe oNe Robotics e.V.',
		location: 'Büchen',
	},
	// Wildau
	{
		id: 14,
		name: 'MANOSapiens',
		institution: 'Martin-Andersen-Nexö-Gymnasium',
		location: 'Dresden',
	},
	{
		id: 15,
		name: 'PhoenixRobotics',
		institution: 'Gerhart-Hauptmann-Gymnasium',
		location: 'Wismar',
	},
	{
		id: 16,
		name: 'Experience',
		institution: 'Sensys GmbH',
		location: 'Bad Saarow',
	},
	// Siegen
	{
		id: 17,
		name: 'Robonauten',
		institution: 'privat',
		location: 'Neunkirchen-Seelscheid',
	},
	{
		id: 18,
		name: '1337.exe',
		institution: 'Rabanus-Maurus-Schule',
		location: 'Fulda',
	},
	{
		id: 19,
		name: 'RoboGeeks',
		institution: 'Johann-Philipp-von-Schönborn Gymnasium',
		location: 'Münnerstadt',
	},
	// Österreich - Tiorl
	{
		id: 20,
		name: 'TEAMRemint',
		institution: 'MS Stainz',
		location: 'Stainz',
	},
	{
		id: 21,
		name: 'BWS',
		institution: 'Bezauer WirtschaftsSchulen',
		location: 'Bezau',
	},
	{
		id: 22,
		name: 'Intelligente Enten',
		institution: 'privat',
		location: 'Wien',
	},
	// Rockenhausen
	{
		id: 23,
		name: 'Strg+R(obotics)',
		institution: 'Bunsen-Gymnasium Heidelberg',
		location: 'Heidelberg',
	},
];

const testroundOrder = [1, 2, 3, 4, 5, 6, 7];
const round1Order = [1, 2, 3, 4, 5, 6, 7];
const round2Order = [3, 4, 1, 5, 2, 6, 7];
const round3Order = [1, 7, 2, 6, 3, 5, 4];

const orderMapping = {
	tr: testroundOrder,
	vr1: round1Order,
	vr2: round2Order,
	vr3: round3Order,
};

export class FllTeamManager {
	currentRound = 'tr';
	teamA = null;
	teamB = null;
	i = 0;
	sortedTeams = [];

	constructor() {
		this.setRound(this.currentRound);
	}

	handleEvent(event) {
		if (event.eventType === 'NEXT_MATCH') {
			this.nextTeam();
			return this;
		}

		if (event.eventType === 'SET_ROUND') {
			this.setRound(event.round);
			return this;
		}
	}

	setRound(newRound) {
		if (orderMapping.hasOwnProperty(newRound)) {
			this.currentRound = newRound;
			const order = orderMapping[newRound];
			this.i = 0;

			const orderMap = new Map(order.map((id, index) => [id, index]));
			this.sortedTeams = teams.sort((teamA, teamB) => {
				const posA = orderMap.get(teamA.id) ?? Infinity;
				const posB = orderMap.get(teamB.id) ?? Infinity;
				return posA - posB;
			});
			this.teamA = this.sortedTeams[0] ?? null;
			this.teamB = this.sortedTeams[1] ?? null;
			console.log(this.sortedTeams);
		}
	}

	nextTeam() {
		console.log('next team', this.i, this.sortedTeams, this.currentRound);
		if (this.i < this.sortedTeams?.length) {
			this.teamA = this.sortedTeams[this.i + 2] ?? null;
			this.teamB = this.sortedTeams[this.i + 3] ?? null;
			this.i = this.i + 2;
		}
	}
}
