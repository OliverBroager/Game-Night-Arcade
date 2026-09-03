/*
  Global cabinet configuration.
  You normally do not need to touch the app code. Change game content in games.js.
*/
window.ARCADE_CONFIG = {
  storageKey: "game-night-arcade-v1",
  defaultMode: "wheel",
  defaultDisplay: "logo", // "logo" or "name"
  defaultRemoveAfterAccept: true,
  defaultSoundEnabled: true,
  defaultVolume: 0.7,
  animation: {
    wheelMs: 8307, // Matches the bundled spin.mp3 duration (8.307 seconds)
    caseMs: 6100,
    slotMs: 4600,
    shuffleMs: 3600
  },
  sounds: {
    button: "sounds/button.mp3",
    tick: "sounds/tick.mp3",
    spin: "sounds/spin.mp3",
    caseClick: "sounds/case-click.mp3",
    reel: "sounds/reel.mp3",
    winner: "sounds/winner.mp3",
    accept: "sounds/accept.mp3",
    reroll: "sounds/reroll.mp3"
  },
  ruleTypes: {
    red: { label: "DRINK", icon: "▼", description: "You drink" },
    yellow: { label: "CHALLENGE", icon: "★", description: "A special challenge or restriction" },
    green: { label: "GIVE", icon: "▲", description: "Give drinks to somebody else" }
  }
};
