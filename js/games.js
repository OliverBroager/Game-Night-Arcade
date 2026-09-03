/*
  ADD / EDIT GAMES HERE.

  Required fields:
    id       - unique, URL-safe identifier
    name     - display name
    logo     - relative path to a PNG/WebP/SVG image
    accent   - any CSS color; used for wheel/case styling
    rules    - red/yellow/green arrays

  Optional metadata (players, price, note) is shown in the accepted-game panel.
  Optional teamSetup: { defaultTeams: 2, teamNames: ["Blue", "Red"] }
  Optional scoreSetup: { direction: "low" } for games where the lowest score wins.
  To replace a placeholder logo, keep the same filename and overwrite the SVG in /images.
*/
window.GAMES = [
  {
    id: "deadlock",
    name: "Deadlock",
    logo: "images/deadlock.png",
    accent: "#54f793",
    players: "6-player teams",
    price: "Free",
    note: "Team shooter / MOBA",
    teamSetup: { defaultTeams: 2, teamNames: ["Hidden King", "Archmother"] },
    rules: {
      red: [
        "Take 1 sip when you are the first person on your team to die.",
        "Take 1 sip when you lose a Guardian or Walker in your lane."
      ],
      yellow: [
        "If you blame a teammate, you must compliment that same teammate before the next fight.",
        "The player with the fewest souls at the agreed checkpoint must narrate the next team fight like a sports caster."
      ],
      green: [
        "Secure a kill with an ultimate: give 1 sip.",
        "Win a team fight with nobody on your side dying: your team gives 2 sips total."
      ]
    }
  },
  {
    id: "league-of-legends",
    name: "League of Legends",
    logo: "images/league-of-legends.jpg",
    accent: "#2676ec",
    players: "5v5 + spectators/rotations",
    price: "Free",
    note: "MOBA",
    teamSetup: { defaultTeams: 2, teamNames: ["Blue Side", "Red Side"] },
    rules: {
      red: ["First blood victim takes 1 sip.", "Get solo-killed: take 1 sip."],
      yellow: ["Miss a cannon minion while everyone is watching: announce 'economy diff'.", "If you type or say 'ff', you cannot complain again for 5 minutes."],
      green: ["Steal Baron or Dragon: give 3 sips total.", "Get a triple kill or better: give 2 sips."]
    }
  },
  {
    id: "counter-strike",
    name: "Counter Strike",
    logo: "images/counter-strike-2.png",
    accent: "#eca03c",
    players: "5v5 + rotations",
    price: "Free",
    note: "Competitive shooter",
    teamSetup: { defaultTeams: 2, teamNames: ["Counter-Terrorists", "Terrorists"] },
    rules: {
      red: ["Die to a knife: take 2 sips.", "Finish a round with zero damage: take 1 sip."],
      yellow: ["Bottom fragger chooses the next buy-round team call.", "If you flash a teammate, apologize in your most formal voice."],
      green: ["Clutch a 1v2 or harder: give 2 sips.", "Get an ace: give 4 sips total."]
    }
  },
  {
    id: "overwatch",
    name: "Overwatch",
    logo: "images/overwatch.svg",
    accent: "#fa9600",
    players: "Team-based",
    price: "Free",
    note: "Hero shooter",
    teamSetup: { defaultTeams: 2, teamNames: ["Team One", "Team Two"] },
    rules: {
      red: ["Fall off the map without being pushed: take 1 sip.", "Use an ultimate and get zero value: take 1 sip."],
      yellow: ["After switching hero, explain your 'master plan' in one sentence.", "Play-of-the-game winner chooses one teammate who must use a different hero next round."],
      green: ["Environmental elimination: give 1 sip.", "Get a team kill: your side gives 3 sips total."]
    }
  },
  {
    id: "golf-with-your-friends",
    name: "Golf With Your Friends",
    logo: "images/golf-with-friends.jpg",
    accent: "#57d98b",
    players: "Up to 12",
    price: "Paid",
    note: "Party mini-golf",
    scoreSetup: { direction: "low" },
    rules: {
      red: ["Take 1 sip for every stroke over par, capped at 2 per hole.", "Fall off the course after bragging about the shot: take 1 sip."],
      yellow: ["Hole winner may choose 'bank shots only' or 'no jumping' for one willing player on the next hole.", "Last place after 9 holes must give a 10-second victory speech as if they are winning."],
      green: ["Hole-in-one: give 2 sips.", "Win a hole by 3+ strokes: give 1 sip."]
    }
  },
  {
    id: "tee-ko",
    name: "Jackbox 3: Tee K.O.",
    logo: "images/Tee-ko-logo.png",
    accent: "#c4273b",
    players: "3–8",
    price: "Host owns pack",
    note: "Drawing / party game",
    rules: {
      red: ["Your shirt loses by a landslide: take 1 sip.", "Your own slogan gets paired with a drawing you hate: take 1 sip."],
      yellow: ["If your drawing is misunderstood, you get 20 seconds to defend it in court.", "Round winner must wear the title 'Creative Director' until the next winner."],
      green: ["Win a round: give 1 sip.", "Win the final gauntlet: give 3 sips total."]
    }
  },
  {
    id: "champd-up",
    name: "Jackbox 7: Champ'd Up",
    logo: "images/champd_up.png",
    accent: "#a66cff",
    players: "3–8",
    price: "Host owns pack",
    note: "Drawing / party game",
    rules: {
      red: ["Your champion gets zero votes: take 1 sip.", "Forget what prompt you were drawing for: take 1 sip."],
      yellow: ["The losing artist has to explain their character's tragic backstory.", "If two drawings look suspiciously alike, the room holds a 20-second plagiarism trial."],
      green: ["Win a matchup unanimously: give 2 sips.", "Win the final title: give 3 sips total."]
    }
  },
  {
    id: "uno",
    name: "UNO",
    logo: "images/uno.png",
    accent: "#ff0000",
    players: "2–10 depending on version",
    price: "Low-cost",
    note: "Card game",
    rules: {
      red: ["Draw 4 cards: take 1 sip.", "Forget to call UNO and get caught: take 2 sips."],
      yellow: ["A successful challenge lets the challenger choose the speaking accent for the next turn cycle.", "Three action cards in a row means everyone must play the next turn in dramatic silence."],
      green: ["Make someone draw 4: give 1 sip.", "Win the round: give 2 sips."]
    }
  },
  {
    id: "fortnite",
    name: "Fortnite",
    logo: "images/fortnite.png",
    accent: "#62c6ff",
    players: "Squads / custom games",
    price: "Free",
    note: "Battle royale / creative",
    teamSetup: { defaultTeams: 2, teamNames: ["Squad Alpha", "Squad Bravo"] },
    rules: {
      red: ["First person in the squad eliminated takes 1 sip.", "Die to fall damage: take 1 sip."],
      yellow: ["If you get caught emoting at a bad time, you must use a different skin next game.", "Lowest damage player chooses the next landing spot and must defend the choice."],
      green: ["Win a match: give 3 sips total.", "Revive two teammates in one match: give 1 sip."]
    }
  },
  {
    id: "gartic-phone",
    name: "Gartic Phone",
    logo: "images/gartic-phone.png",
    accent: "#70e0a4",
    players: "4–30",
    price: "Free",
    note: "Browser drawing party game",
    rules: {
      red: ["If nobody can identify your drawing, take 1 sip.", "If your sentence is the one that completely derails the chain, take 1 sip."],
      yellow: ["Best drawing gets displayed again while the artist gives a 10-second museum tour.", "The group may award one 'absolute masterpiece' title per round."],
      green: ["Perfectly preserve the original prompt through a full chain: give 2 sips.", "Get the biggest laugh during reveal: give 1 sip."]
    }
  },
  {
    id: "gmod-prop-hunt",
    name: "G MOD Prop Hunt",
    logo: "images/gmod-prop-hunt.png",
    accent: "#4da2ff",
    players: "6–8+",
    price: "Low-cost base game",
    note: "Hide-and-seek sandbox mode",
    rules: {
      red: ["Get found in the first minute as a prop: take 1 sip.", "As a hunter, destroy a ridiculous number of innocent props without finding anyone: take 1 sip."],
      yellow: ["Last surviving prop must reveal one fake hint and one real hint.", "A hunter who walks past the same prop twice gets roasted by the lobby for 10 seconds."],
      green: ["Survive the full round as a prop: give 2 sips.", "Find two props within 20 seconds: give 1 sip."]
    }
  },
  {
    id: "meccha-chameleon",
    name: "MECCHA CHAMELEON",
    logo: "images/meccha-chameleon.jpg",
    accent: "#50f1b8",
    players: "Party group",
    price: "Varies",
    note: "Custom group favourite",
    rules: {
      red: ["Lose a round after confidently calling the win: take 1 sip.", "Be the first player eliminated: take 1 sip."],
      yellow: ["Round winner invents a harmless nickname for last place until the next round.", "If the whole lobby gets confused by the same moment, pause for a 15-second rules tribunal."],
      green: ["Win two rounds in a row: give 2 sips.", "Pull off the play everyone agrees was best: give 1 sip."]
    }
  },
  {
    id: "machine-party",
    name: "Machine Party",
    logo: "images/machine-party.jpg",
    accent: "#ff67bd",
    players: "Party group",
    price: "Varies",
    note: "Custom group favourite",
    rules: {
      red: ["Finish last in a mini-game: take 1 sip.", "Cause your own elimination through an obvious mistake: take 1 sip."],
      yellow: ["Mini-game winner picks the next lobby color/theme if the game allows it.", "Tie-breaker: tied players must give a five-word prediction for who wins next."],
      green: ["Win a mini-game without taking damage: give 1 sip.", "Win the overall match: give 3 sips total."]
    }
  },

  /* Extra 6–8-player-friendly recommendations */
  {
    id: "pummel-party",
    name: "Pummel Party",
    logo: "images/pummel-party.png",
    accent: "#ff6d4a",
    players: "4–8",
    price: "Paid / often discounted",
    note: "Board game + mini-games",
    rules: {
      red: ["Lose a mini-game in last place: take 1 sip.", "Get hit by an item immediately after bragging: take 1 sip."],
      yellow: ["Mini-game winner gets to narrate the next board roll like a game-show host.", "If two players target each other three times in a row, declare an official rivalry."],
      green: ["Win a mini-game: give 1 sip.", "Steal a key item or objective from another player: give 1 sip."]
    }
  },
  {
    id: "pico-park-2",
    name: "PICO PARK 2",
    logo: "images/pico-park-2.png",
    accent: "#f4df52",
    players: "2–8",
    price: "Low-cost",
    note: "Co-op action puzzle",
    rules: {
      red: ["Be the person who obviously causes a full-team reset: take 1 sip.", "Fall after everyone else has already made the jump: take 1 sip."],
      yellow: ["After three failed attempts, nominate one player as 'project manager' for the next try.", "If everyone talks at once, the next attempt must begin with five seconds of silence."],
      green: ["Make the save that keeps the run alive: give 1 sip.", "Clear a difficult stage on the first try: everyone may give 1 sip total to players of their choice."]
    }
  },
  {
    id: "goose-goose-duck",
    name: "Goose Goose Duck",
    logo: "images/goose-goose-duck.jpg",
    accent: "#f2c94c",
    players: "Up to 16",
    price: "Free",
    note: "Social deduction",
    rules: {
      red: ["Get voted out while innocent: take 1 sip.", "Accuse the wrong person with total confidence: take 1 sip."],
      yellow: ["If your argument changes the whole vote, you earn the title 'Lawyer' until next meeting.", "A tie vote requires both loudest debaters to speak in calm documentary voices next meeting."],
      green: ["Correctly identify a duck and get them voted out: give 1 sip.", "Win with a neutral role: give 2 sips."]
    }
  },
  {
    id: "brawlhalla",
    name: "Brawlhalla",
    logo: "images/brawlhalla.jpg",
    accent: "#60b7ff",
    players: "Up to 8",
    price: "Free",
    note: "Platform fighter",
    teamSetup: { defaultTeams: 4 },
    rules: {
      red: ["Self-destruct with no opponent touching you: take 1 sip.", "Lose a stock in the first 10 seconds: take 1 sip."],
      yellow: ["Match winner may ban one weapon type for themselves next round as a handicap.", "If two players KO each other simultaneously, they must fist-bump or type 'respect'."],
      green: ["Win with 2+ stocks remaining: give 2 sips.", "Land the final knockout off the bottom of the map: give 1 sip."]
    }
  },
  {
    id: "among-us",
    name: "Among Us",
    logo: "images/among-us.png",
    accent: "#ff5364",
    players: "4–15",
    price: "Low-cost",
    note: "Social deduction",
    rules: {
      red: ["Get voted out while innocent: take 1 sip.", "Call an emergency meeting and provide almost no useful information: take 1 sip."],
      yellow: ["If you say 'trust me', you must give one concrete reason within five seconds.", "The first person caught lying must use their most suspicious voice for the next meeting."],
      green: ["As crewmate, correctly lead a vote onto an impostor: give 1 sip.", "As impostor, win without receiving a vote: give 3 sips total."]
    }
  }
];
