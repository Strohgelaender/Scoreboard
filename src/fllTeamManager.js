const teams = [
	// Schweiz - Jura
	{
		id: 1,
		name: 'mindfactory',
		institution: 'JuFoTec',
		location: 'Baden',
		logo: "/images/fll/mindfactory.jpg"
	},
	{
		id: 2,
		name: 'E-Arts',
		institution: 'Privat',
		location: 'Arnex sur Orbe',
		logo: null,
	},
	{
		id: 3,
		name: 'Capricorns',
		institution: 'Bündner Kantonsschule Chur',
		location: 'Chur',
		logo: "/images/fll/capricorns.jpg",
	},
	// Aachen
	{
		id: 4,
		name: 'Theobots',
		institution: 'Gymnasium Theodorianum',
		location: 'Paderborn',
		logo: "/images/fll/theobots.png",
	},
	{
		id: 5,
		name: 'GSG Robots',
		institution: 'Geschwister-Scholl-Gymnasium',
		location: 'Ludwigshafen am Rhein',
		logo: null,
	},
	{
		id: 6,
		name: 'tASG force',
		institution: 'Städt. Albert Schweizer Gymnasium Plettenberg',
		location: 'Plettenberg',
		logo: null,
	},
	// Heidelberg
	{
		id: 7,
		name: 'Here We GO',
		institution: 'Gymnasium Ottobrunn',
		location: 'Ottobrunn',
		logo: null,
	},
	{
		id: 8,
		name: 'GarsControl Senior',
		institution: 'Gymnasium Gars',
		location: 'Gars am Inn',
		logo: null,
	},
	{
		id: 10,
		name: 'RoHoKi',
		institution: 'Staatliches Gymnasium Holzkirchen',
		location: 'Holzkirchen',
		logo: null,
	},
	// Braunschweig
	{
		id: 11,
		name: 'Robotigers',
		institution: 'KGS Ronnenberg',
		location: 'Ronnenberg',
		logo: null,
	},
	{
		id: 12,
		name: 'rhsRobotX',
		institution: 'Ricarda-Huch-Schule',
		location: 'Braunschweig',
		logo: null,
	},
	{
		id: 13,
		name: 'We aRe oNe Black',
		institution: 'We aRe oNe Robotics e.V.',
		location: 'Büchen',
		logo: null,
	},
	// Wildau
	{
		id: 14,
		name: 'MANOSapiens',
		institution: 'Martin-Andersen-Nexö-Gymnasium',
		location: 'Dresden',
		logo: null,
	},
	{
		id: 15,
		name: 'PhoenixRobotics',
		institution: 'Gerhart-Hauptmann-Gymnasium',
		location: 'Wismar',
		logo: null,
	},
	{
		id: 16,
		name: 'Experience',
		institution: 'Sensys GmbH',
		location: 'Bad Saarow',
		logo: null,
	},
	// Siegen
	{
		id: 17,
		name: 'Robonauten',
		institution: 'privat',
		location: 'Neunkirchen-Seelscheid',
		logo: null,
	},
	{
		id: 18,
		name: '1337.exe',
		institution: 'Rabanus-Maurus-Schule',
		location: 'Fulda',
		logo: null,
	},
	{
		id: 19,
		name: 'RoboGeeks',
		institution: 'Johann-Philipp-von-Schönborn Gymnasium',
		location: 'Münnerstadt',
		logo: null,
	},
	// Österreich - Tiorl
	{
		id: 20,
		name: 'TEAMRemint',
		institution: 'MS Stainz',
		location: 'Stainz',
		logo: null,
	},
	{
		id: 21,
		name: 'BWS',
		institution: 'Bezauer WirtschaftsSchulen',
		location: 'Bezau',
		logo: null,
	},
	{
		id: 22,
		name: 'Intelligente Enten',
		institution: 'privat',
		location: 'Wien',
		logo: null,
	},
	// Rockenhausen
	{
		id: 23,
		name: 'Strg+R(obotics)',
		institution: 'Bunsen-Gymnasium Heidelberg',
		location: 'Heidelberg',
		logo: null,
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

	/**
	 * Search for a team by ID or name
	 * @param {number|string} query - Team ID (number) or team name (string)
	 * @returns {Object|null} - Team object or null if not found
	 */
	searchTeam(query) {
		// Search by ID if query is a number
		if (typeof query === 'number') {
			return teams.find(team => team.id === query) ?? null;
		}

		// Search by name (case-insensitive exact match first)
		const queryLower = String(query).toLowerCase().trim();
		let exactMatch = teams.find(team => team.name.toLowerCase() === queryLower);
		if (exactMatch) {
			return exactMatch;
		}

		// Fuzzy search using Levenshtein distance for closest match
		let closestTeam = null;
		let closestDistance = Infinity;

		teams.forEach(team => {
			const distance = this._levenshteinDistance(queryLower, team.name.toLowerCase());
			if (distance < closestDistance) {
				closestDistance = distance;
				closestTeam = team;
			}
		});

		// Only return result if similarity is reasonable (distance <= 30% of longest string)
		const maxLength = Math.max(queryLower.length, closestTeam?.name.length || 0);
		if (closestDistance <= maxLength * 0.3) {
			return closestTeam;
		}

		return null;
	}

	/**
	 * Calculate Levenshtein distance between two strings
	 * Used for fuzzy matching team names
	 * @private
	 */
	_levenshteinDistance(str1, str2) {
		const len1 = str1.length;
		const len2 = str2.length;
		const matrix = Array(len2 + 1)
			.fill(null)
			.map(() => Array(len1 + 1).fill(0));

		for (let i = 0; i <= len1; i++) {
			matrix[0][i] = i;
		}
		for (let j = 0; j <= len2; j++) {
			matrix[j][0] = j;
		}

		for (let j = 1; j <= len2; j++) {
			for (let i = 1; i <= len1; i++) {
				const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
				matrix[j][i] = Math.min(
					matrix[j][i - 1] + 1, // deletion
					matrix[j - 1][i] + 1, // insertion
					matrix[j - 1][i - 1] + indicator // substitution
				);
			}
		}

		return matrix[len2][len1];
	}
}
