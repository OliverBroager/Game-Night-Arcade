window.ArcadeStorage = (() => {
  const KEY = window.ARCADE_CONFIG.storageKey;

  function defaults() {
    return {
      mode: window.ARCADE_CONFIG.defaultMode,
      display: window.ARCADE_CONFIG.defaultDisplay,
      removeAfterAccept: window.ARCADE_CONFIG.defaultRemoveAfterAccept,
      soundEnabled: window.ARCADE_CONFIG.defaultSoundEnabled,
      volume: window.ARCADE_CONFIG.defaultVolume,
      reducedMotion: false,
      enabledGameIds: window.GAMES.map(game => game.id),
      removedGameIds: [],
      history: [],
      acceptedGameId: null,
      players: [],
      playerEmojis: {},
      drinkCounts: {},
      matchHistory: [],
      activeRoundId: null,
      teamCountByGame: {},
      teamResult: null,
      currentModifier: null,
      nightStartedAt: null,
      nightEnded: false
    };
  }

  function load() {
    const base = defaults();
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!saved) return base;
      const validIds = new Set(window.GAMES.map(g => g.id));
      return {
        ...base,
        ...saved,
        enabledGameIds: (saved.enabledGameIds || base.enabledGameIds).filter(id => validIds.has(id)),
        removedGameIds: (saved.removedGameIds || []).filter(id => validIds.has(id)),
        history: (saved.history || []).filter(id => validIds.has(id)).slice(-30),
        acceptedGameId: validIds.has(saved.acceptedGameId) ? saved.acceptedGameId : null,
        players: Array.isArray(saved.players) ? saved.players.map(String).map(v => v.trim()).filter(Boolean).slice(0,16) : [],
        playerEmojis: saved.playerEmojis && typeof saved.playerEmojis === "object" ? saved.playerEmojis : {},
        drinkCounts: saved.drinkCounts && typeof saved.drinkCounts === "object" ? saved.drinkCounts : {},
        matchHistory: Array.isArray(saved.matchHistory) ? saved.matchHistory.filter(round => round && validIds.has(round.gameId)).slice(-100) : [],
        activeRoundId: typeof saved.activeRoundId === "string" ? saved.activeRoundId : null,
        teamCountByGame: saved.teamCountByGame && typeof saved.teamCountByGame === "object" ? saved.teamCountByGame : {},
        teamResult: saved.teamResult || null
      };
    } catch (error) {
      console.warn("Could not load saved arcade state.", error);
      return base;
    }
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (error) { console.warn("Could not save arcade state.", error); }
  }

  function clear() { localStorage.removeItem(KEY); }
  return { defaults, load, save, clear };
})();
