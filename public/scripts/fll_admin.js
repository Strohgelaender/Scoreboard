'use strict';
let allTeams = [];
let currentTeamToChange = null;
document.addEventListener('DOMContentLoaded', () => {
	setupEventListeners();
	loadTeamsData();
});

function setupEventListeners() {
	document.getElementById('setRoundBtn').addEventListener('click', setRound);
	document.getElementById('changeTeamABtn').addEventListener('click', () => openTeamSelection('a'));
	document.getElementById('changeTeamBBtn').addEventListener('click', () => openTeamSelection('b'));
	document.getElementById('nextMatchBtn').addEventListener('click', nextMatch);
	document.getElementById('closeModalBtn').addEventListener('click', closeModal);
	document.getElementById('teamSearchInput').addEventListener('input', filterTeams);
	document.getElementById('teamSelectionModal').addEventListener('click', (e) => {
		if (e.target.id === 'teamSelectionModal') {
			closeModal();
		}
	});
}

async function loadTeamsData() {
	try {
		const response = await fetch('/api/fll/teams');
		if (!response.ok) {
			console.error('Failed to load teams data');
			return;
		}
		allTeams = await response.json();
		updateTeamsDisplay();
		updateNextMatches();
	} catch (error) {
		console.error('Error loading teams:', error);
	}
}

function updateTeamsDisplay() {
	fetchCurrentTeams();
}

async function fetchCurrentTeams() {
	try {
		const response = await fetch('/api/fll/current');
		if (!response.ok) return;
		const data = await response.json();
		displayTeam('A', data.teamA);
		displayTeam('B', data.teamB);
	} catch (error) {
		console.error('Error fetching current teams:', error);
	}
}

function displayTeam(position, team) {
	if (!team) {
		document.getElementById(`team${position}Name`).textContent = '-';
		document.getElementById(`team${position}Institution`).textContent = '-';
		document.getElementById(`team${position}Id`).textContent = '-';
		document.getElementById(`team${position}Location`).textContent = '-';
		return;
	}
	document.getElementById(`team${position}Name`).textContent = team.name || '-';
	document.getElementById(`team${position}Institution`).textContent = team.institution || '-';
	document.getElementById(`team${position}Id`).textContent = team.id || '-';
	document.getElementById(`team${position}Location`).textContent = team.location || '-';
}

async function setRound() {
	const roundSelect = document.getElementById('roundSelect');
	const roundValue = roundSelect.value;
	try {
		const response = await fetch('/round', {
			method: 'PUT',
			headers: {
				'Content-Type': 'text/plain'
			},
			body: roundValue
		});
		if (response.ok) {
			console.log('Round set to:', roundValue);
			updateTeamsDisplay();
			updateNextMatches();
		} else {
			console.error('Failed to set round');
		}
	} catch (error) {
		console.error('Error setting round:', error);
	}
}

async function nextMatch() {
	try {
		const response = await fetch('/next', {
			method: 'PUT'
		});
		if (response.ok) {
			console.log('Moved to next match');
			updateTeamsDisplay();
			updateNextMatches();
		} else {
			console.error('Failed to move to next match');
		}
	} catch (error) {
		console.error('Error moving to next match:', error);
	}
}

function openTeamSelection(position) {
	currentTeamToChange = position;
	renderTeamsList();
	document.getElementById('teamSelectionModal').style.display = 'flex';
}

function closeModal() {
	document.getElementById('teamSelectionModal').style.display = 'none';
	document.getElementById('teamSearchInput').value = '';
	currentTeamToChange = null;
}

function renderTeamsList(teamsToRender = allTeams) {
	const teamsList = document.getElementById('teamsList');
	teamsList.innerHTML = '';
	teamsToRender.forEach((team) => {
		const item = document.createElement('div');
		item.className = 'team-list-item';
		item.innerHTML = `
<strong>${team.name}</strong>
<small>${team.institution}</small>
<small><span class="team-id">ID: ${team.id}</span></small>
`;
		item.addEventListener('click', () => selectTeam(team));
		teamsList.appendChild(item);
	});
}

function filterTeams() {
	const searchInput = document.getElementById('teamSearchInput');
	const query = searchInput.value.trim();
	if (!query) {
		renderTeamsList(allTeams);
		return;
	}
	const filtered = allTeams.filter((team) => {
		const nameMatch = team.name.toLowerCase().includes(query.toLowerCase());
		const idMatch = team.id.toString().includes(query);
		const institutionMatch = team.institution.toLowerCase().includes(query.toLowerCase());
		return nameMatch || idMatch || institutionMatch;
	});
	renderTeamsList(filtered);
}

async function selectTeam(team) {
	if (!currentTeamToChange) return;
	try {
		const endpoint = currentTeamToChange === 'a' ? '/teamA' : '/teamB';
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(team)
		});
		if (response.ok) {
			displayTeam(currentTeamToChange.toUpperCase(), team);
			closeModal();
			updateNextMatches();
		} else {
			console.error('Failed to select team');
		}
	} catch (error) {
		console.error('Error selecting team:', error);
	}
}

async function updateNextMatches() {
	try {
		const response = await fetch('/api/fll/upcoming');
		if (!response.ok) return;
		const upcomingMatches = await response.json();
		const matchesContainer = document.getElementById('nextMatchesList');
		matchesContainer.innerHTML = '';
		upcomingMatches.forEach((match, index) => {
			const card = document.createElement('div');
			card.className = 'match-card';
			// Only show as bye if BOTH teams are null
			// Show as normal match even if one team is missing
			card.innerHTML = `
					<h4>Paarung ${index + 1}</h4>
					<p><strong>${match.teamA?.name || '-'}</strong></p>
					<p>vs</p>
					<p><strong>${match.teamB?.name || '-'}</strong></p>
				`;
			matchesContainer.appendChild(card);
		});
	} catch (error) {
		console.error('Error updating next matches:', error);
	}
}

setInterval(fetchCurrentTeams, 10_000);
