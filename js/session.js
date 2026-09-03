/*
  Player identity, scorekeeping and game-night helpers.
  Kept separate from app.js so the session features are easy to customize.
*/
window.ArcadeSession = (() => {
  const EMOJIS = [
    "🐸", "🦊", "🐼", "🐵",
    "🐯", "🦁", "🐙", "👽",
    "🤖", "👻", "💀", "🦄",
    "🐲", "🦖", "🐧", "🦝"
  ];

  const MODIFIERS = [
    "NO TILT ROUND — nobody is allowed to complain until the round ends.",
    "COMMENTATOR MODE — the first eliminated player commentates until the round ends.",
    "CAPTAIN'S CALL — a random player chooses the next map, mode or lobby setting.",
    "HYPE MAN — everyone must compliment one good play they notice this round.",
    "SILENT START — no talking for the first 30 seconds of the next round.",
    "DRAMATIC COMMS — important callouts must be delivered like a movie trailer.",
    "UNDERDOG BUFF — the player with the fewest wins chooses one harmless house rule for the next round.",
    "MVP TAX — the current wins leader must use the group's chosen cosmetic/character if the game allows it.",
    "RIVALRY ROUND — randomly pick two players; bragging rights go to whichever finishes higher.",
    "SPORTSCASTER — one volunteer narrates the first minute like a live tournament broadcast."
  ];

  function key(name) {
    return String(name || "").trim().toLowerCase();
  }

  function randomIndex(max) {
    if (!Number.isInteger(max) || max <= 0) return 0;
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function assignUniqueEmojis(players, saved = {}) {
    const used = new Set();
    const result = {};
    players.forEach((name, index) => {
      const savedEmoji = saved[key(name)];
      const preferred = EMOJIS.includes(savedEmoji) && !used.has(savedEmoji)
        ? savedEmoji
        : EMOJIS.find(emoji => !used.has(emoji)) || EMOJIS[index % EMOJIS.length];
      result[key(name)] = preferred;
      used.add(preferred);
    });
    return result;
  }

  function normalizeDrinkCounts(players, saved = {}) {
    return Object.fromEntries(players.map(name => {
      const value = Number.parseInt(saved[key(name)], 10);
      return [key(name), Number.isFinite(value) ? Math.max(0, value) : 0];
    }));
  }

  function emojiFor(name, map = {}) {
    return map[key(name)] || "🎮";
  }

  function createRound(gameId, players) {
    const stamp = Date.now();
    return {
      id: `round-${stamp}-${Math.floor(Math.random() * 100000)}`,
      gameId,
      createdAt: stamp,
      participants: [...players],
      scoreMode: null,
      scoreDirection: null,
      scores: [],
      winners: [],
      scoreless: true
    };
  }

  function calculateResult(entries, direction = "high") {
    const valid = entries
      .map(entry => ({ ...entry, score: Number(entry.score) }))
      .filter(entry => Number.isFinite(entry.score));

    if (!valid.length) {
      return { scores: [], winners: [], scoreless: true };
    }

    const target = direction === "low"
      ? Math.min(...valid.map(entry => entry.score))
      : Math.max(...valid.map(entry => entry.score));

    const winningEntries = valid.filter(entry => entry.score === target);
    const winners = [...new Set(winningEntries.flatMap(entry => entry.players || []))];
    return { scores: valid, winners, scoreless: false };
  }

  function leaderboard(players, rounds = [], drinkCounts = {}) {
    const rows = players.map(name => ({
      name,
      wins: 0,
      scoredGames: 0,
      games: 0,
      drinks: Math.max(0, Number.parseInt(drinkCounts[key(name)], 10) || 0)
    }));
    const byKey = new Map(rows.map(row => [key(row.name), row]));

    rounds.forEach(round => {
      (round.participants || []).forEach(name => {
        const row = byKey.get(key(name));
        if (row) row.games += 1;
      });
      if (!round.scoreless) {
        (round.participants || []).forEach(name => {
          const row = byKey.get(key(name));
          if (row) row.scoredGames += 1;
        });
      }
      (round.winners || []).forEach(name => {
        const row = byKey.get(key(name));
        if (row) row.wins += 1;
      });
    });

    return rows.sort((a, b) => b.wins - a.wins || b.scoredGames - a.scoredGames || a.name.localeCompare(b.name));
  }

  function randomPlayer(players) {
    return players.length ? players[randomIndex(players.length)] : null;
  }

  function coinFlip() {
    return randomIndex(2) === 0 ? "HEADS" : "TAILS";
  }

  function randomModifier() {
    return MODIFIERS[randomIndex(MODIFIERS.length)];
  }

  return {
    EMOJIS,
    MODIFIERS,
    key,
    assignUniqueEmojis,
    normalizeDrinkCounts,
    emojiFor,
    createRound,
    calculateResult,
    leaderboard,
    randomPlayer,
    coinFlip,
    randomModifier
  };
})();
