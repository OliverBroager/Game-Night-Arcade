/*
  Team randomizer helpers.
  The module has no UI code, so team logic can be changed independently from app.js.
*/
window.ArcadeTeams = (() => {
  const GENERIC_TEAM_NAMES = [
    "Neon Tigers",
    "Turbo Comets",
    "Pixel Pirates",
    "Arcade Royals",
    "Laser Sharks",
    "Glitch Squad",
    "Bonus Stage",
    "Final Boss"
  ];

  function randomIndex(max) {
    if (!Number.isInteger(max) || max <= 0) return 0;
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function shuffle(players) {
    const result = [...players];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = randomIndex(index + 1);
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function clampTeamCount(playerCount, requestedCount) {
    const maximum = Math.max(2, Math.min(8, Number(playerCount) || 2));
    const requested = Number.parseInt(requestedCount, 10);
    if (!Number.isFinite(requested)) return 2;
    return Math.max(2, Math.min(maximum, requested));
  }

  function recommendedTeamCount(game, playerCount) {
    return clampTeamCount(playerCount, game?.teamSetup?.defaultTeams || 2);
  }

  function getTeamNames(game, teamCount) {
    const custom = Array.isArray(game?.teamSetup?.teamNames) ? game.teamSetup.teamNames : [];
    return Array.from({ length: teamCount }, (_, index) => (
      custom[index] || GENERIC_TEAM_NAMES[index] || `Team ${index + 1}`
    ));
  }

  function createTeams(players, requestedCount, game) {
    const cleanPlayers = players.map(name => String(name).trim()).filter(Boolean);
    const teamCount = clampTeamCount(cleanPlayers.length, requestedCount);
    const names = getTeamNames(game, teamCount);
    const randomized = shuffle(cleanPlayers);
    const teams = Array.from({ length: teamCount }, (_, index) => ({
      name: names[index],
      players: []
    }));

    // Round-robin distribution guarantees that team sizes differ by no more than one.
    randomized.forEach((player, index) => {
      teams[index % teamCount].players.push(player);
    });

    return { teamCount, teams };
  }

  function playerKey(players) {
    return players.map(name => String(name).trim().toLowerCase()).join("|");
  }

  function isSavedResultValid(result, gameId, players) {
    if (!result || result.gameId !== gameId) return false;
    if (result.playerKey !== playerKey(players)) return false;
    if (!Array.isArray(result.teams) || result.teams.length !== result.teamCount) return false;
    const assigned = result.teams.flatMap(team => team.players || []);
    return assigned.length === players.length;
  }

  return {
    clampTeamCount,
    recommendedTeamCount,
    createTeams,
    playerKey,
    isSavedResultValid
  };
})();
