/*
  DRINKING NIGHT GAME LIST

  Required fields:
    id       - unique, URL-safe identifier
    name     - display name
    logo     - relative path to a PNG/WebP/SVG image
    accent   - any CSS color; used for wheel/case styling
    rules    - red/yellow/green arrays

  Rule colors:
    red      - SHOTS you take
    yellow   - DRINKS you take
    green    - DRINKS you may give to other players

  Optional metadata (players, price, note) is shown in the accepted-game panel.
  Optional teamSetup: { defaultTeams: 2, teamNames: ["Blue", "Red"] }
  Optional scoreSetup: { direction: "low" } for games where the lowest score wins.

  Prices were checked in September 2026 and use the normal EU list price,
  not the current sale price. Non-Steam games show their normal platform instead.

  Games are grouped by type so similar games appear together in the selector.
*/

window.GAMES = [
  // ===========================================================================
  // CREATIVE / PARTY / MINI-GAMES
  // ===========================================================================
  {
    id: "tee-ko",
    name: "Jackbox 3: Tee K.O.",
    logo: "images/Tee-ko-logo.png",
    accent: "#c4273b",
    players: "3–8",
    price: "€24.99 (Steam - Jackbox Party Pack 3; only the host needs it)",
    note: "Drawing / party game",
    rules: {
      red: [
        "If one of your shirts gets zero votes twice in the same game: take 1 shot."
      ],
      yellow: [
        "Your design loses a matchup: take 1 drink.",
        "Your T-shirt gets zero votes: take 1 drink.",
        "If you laugh so much that you miss what is happening: take 1 drink. This one is self-policed."
      ],
      green: [
        "Your T-shirt wins a matchup: give 3 drinks.",
        "Win the final gauntlet: give 5 drinks total."
      ]
    }
  },
  {
    id: "trivia-murder",
    name: "Jackbox 3: Trivia Murder Party",
    logo: "images/Trivia_Murder_Party.png",
    accent: "#790010",
    players: "3–8",
    price: "€24.99 (Steam - Jackbox Party Pack 3; only the host needs it)",
    note: "Trivia / party game",
    rules: {
      red: [
        "If you are the only player to get a question wrong and then die on the Killing Floor: take 1 shot."
      ],
      yellow: [
        "Answer a trivia question incorrectly: take 1 drink.",
        "Die on the Killing Floor: take 2 drinks.",
        "Get overtaken in the final escape after being in first place: take 2 drinks."
      ],
      green: [
        "Survive a Killing Floor challenge: give 1 drink.",
        "Win the game: give 5 drinks total."
      ]
    }
  },
  {
    id: "talking-points",
    name: "Jackbox 7: Talking Points",
    logo: "images/Talking_Points.png",
    accent: "#fcdc2b",
    players: "3–8",
    price: "€29.99 (Steam - Jackbox Party Pack 7; only the host needs it)",
    note: "Improvised presentation / party game",
    rules: {
      red: [
        "Freeze completely for 10 seconds or more during your presentation: take 1 shot."
      ],
      yellow: [
        "Break character because you start laughing during your own presentation: take 1 drink.",
        "Finish with the lowest presentation score: take 2 drinks."
      ],
      green: [
        "Finish with the highest presentation score: give 3 drinks.",
        "If the room agrees you had the funniest single slide: give 2 drinks."
      ]
    }
  },
  {
    id: "champd-up",
    name: "Jackbox 7: Champ'd Up",
    logo: "images/champd_up.png",
    accent: "#a66cff",
    players: "3–8",
    price: "€29.99 (Steam - Jackbox Party Pack 7; only the host needs it)",
    note: "Drawing / party game",
    rules: {
      red: [
        "Your champion gets zero votes in a matchup: take 1 shot."
      ],
      yellow: [
        "Your champion loses a matchup: take 1 drink.",
        "Nobody understands what your drawing is supposed to be: take 1 drink."
      ],
      green: [
        "Win a matchup: give 2 drinks.",
        "Win the entire game: give 5 drinks total."
      ]
    }
  },
  {
    id: "gartic-phone",
    name: "Gartic Phone",
    logo: "images/gartic-phone.png",
    accent: "#70e0a4",
    players: "4–30",
    price: "Free (Gartic Phone website - browser game, not Steam)",
    note: "Browser drawing / telephone party game",
    rules: {
      red: [
        "If the group agrees that your contribution completely destroyed an otherwise understandable chain: take 1 shot."
      ],
      yellow: [
        "Your drawing makes no sense to the group during the reveal: take 1 drink.",
        "You clearly guess the previous drawing incorrectly or draw the previous sentence incorrectly: take 1 drink."
      ],
      green: [
        "A chain returns to exactly the original message at the end: the original writer gives 3 drinks.",
        "Your contribution gets the biggest laugh of the reveal: give 2 drinks."
      ]
    }
  },
  {
    id: "uno",
    name: "UNO",
    logo: "images/uno.png",
    accent: "#ff0000",
    players: "2–4",
    price: "€9.99 (Steam)",
    note: "Card game - intentionally only one drinking rule",
    rules: {
      red: [],
      yellow: [
        "Every time you draw cards, take 1 drink for each card drawn."
      ],
      green: []
    }
  },
  {
    id: "pummel-party",
    name: "Pummel Party",
    logo: "images/pummel-party.png",
    accent: "#ff6d4a",
    players: "4–8",
    price: "€14.79 (Steam)",
    note: "Board game + mini-games",
    rules: {
      red: [
        "Lose a Goblet because another player steals it from you: take 1 shot."
      ],
      yellow: [
        "Finish last in a mini-game: take 2 drinks.",
        "Get hit by an item immediately after bragging about your position: take 1 drink.",
        "Lose 10 or more keys from a single attack or event: take 2 drinks."
      ],
      green: [
        "Win a mini-game: give 2 drinks.",
        "Buy or steal a Goblet: give 3 drinks."
      ]
    }
  },
  {
    id: "machine-party",
    name: "Machine Party",
    logo: "images/machine-party.jpg",
    accent: "#ff67bd",
    players: "2–4",
    price: "€7.49 (Steam)",
    note: "High-stakes party mini-games",
    rules: {
      red: [
        "Be the first player eliminated in two mini-games in a row: take 1 shot."
      ],
      yellow: [
        "Lose a mini-game: take 1 drink.",
        "Eliminate yourself through an obvious mistake: take 2 drinks."
      ],
      green: [
        "Win a mini-game: give 2 drinks.",
        "Win a mini-game without taking a hit or penalty: give 3 drinks."
      ]
    }
  },

  // ===========================================================================
  // PARTY COMPETITION / PHYSICS / FIGHTING
  // ===========================================================================
  {
    id: "golf-with-your-friends",
    name: "Golf With Your Friends",
    logo: "images/golf-with-friends.jpg",
    accent: "#57d98b",
    players: "Up to 12",
    price: "€14.99 (Steam)",
    note: "Party mini-golf",
    scoreSetup: { direction: "low" },
    rules: {
      red: [
        "Take 10 or more strokes on a single hole: take 1 shot."
      ],
      yellow: [
        "Fall off the map: take 1 drink.",
        "At the end of a hole, take 1 drink for every stroke you are behind the player directly ahead of you, capped at 3 drinks.",
        "Finish the course in last place: take 3 drinks."
      ],
      green: [
        "Get a hole-in-one: give 3 drinks.",
        "Win a hole by 3 or more strokes: give 2 drinks."
      ]
    }
  },
  {
    id: "super-battle-golf",
    name: "Super Battle Golf",
    logo: "images/super-battle-golf.png",
    accent: "#ff4f4f",
    players: "1–8",
    price: "€12.49 (Steam)",
    note: "Simultaneous PvP golf / racing party game",
    rules: {
      red: [
        "Get knocked off the course by another player and still finish last on that hole: take 1 shot."
      ],
      yellow: [
        "Get hit by another player's attack: take 1 drink.",
        "Finish a hole in last place: take 2 drinks."
      ],
      green: [
        "Finish a hole first: give 2 drinks.",
        "Get a hole-in-one: give 3 drinks."
      ]
    }
  },
  {
    id: "ultimate-chicken-horse",
    name: "Ultimate Chicken Horse",
    logo: "images/ultimate-chicken-horse.png",
    accent: "#ffb347",
    players: "2–4",
    price: "€12.99 (Steam)",
    note: "Competitive platformer / trap-building party game",
    rules: {
      red: [
        "Die to a trap that you placed yourself: take 1 shot."
      ],
      yellow: [
        "Die before reaching the goal: take 1 drink.",
        "Score zero points in a round where someone else scores: take 2 drinks."
      ],
      green: [
        "Your trap eliminates another player: give 1 drink.",
        "Be the only player to reach the goal in a round: give 3 drinks."
      ]
    }
  },
  {
    id: "stick-fight-the-game",
    name: "Stick Fight: The Game",
    logo: "images/stick-fight-the-game.png",
    accent: "#f15a24",
    players: "2–4",
    price: "€4.75 (Steam)",
    note: "Physics platform fighter",
    rules: {
      red: [
        "Eliminate yourself with your own weapon or an obvious environmental mistake: take 1 shot."
      ],
      yellow: [
        "Be the first player to die in a round: take 1 drink.",
        "Die to a snake: take 2 drinks."
      ],
      green: [
        "Win a round: give 1 drink.",
        "Win 3 rounds in a row: give 3 drinks."
      ]
    }
  },
  {
    id: "gang-beasts",
    name: "Gang Beasts",
    logo: "images/gang-beasts.png",
    accent: "#ff6d4a",
    players: "Up to 8",
    price: "€18.99 (Steam)",
    note: "Physics fighting party game",
    rules: {
      red: [
        "Eliminate yourself without another player touching you: take 1 shot."
      ],
      yellow: [
        "Be the first player eliminated in a round: take 1 drink.",
        "Climb back from the edge and then immediately get thrown out anyway: take 2 drinks."
      ],
      green: [
        "Win a round: give 2 drinks.",
        "Knock out two different opponents within 10 seconds: give 2 drinks."
      ]
    }
  },
  {
    id: "party-animals",
    name: "Party Animals",
    logo: "images/Party_Animals.png",
    accent: "#ff6d4a",
    players: "Up to 8",
    price: "€17.99 (Steam)",
    note: "Physics brawler / team party game",
    rules: {
      red: [
        "Score an own goal or cause the decisive loss for your team with an obvious mistake: take 1 shot."
      ],
      yellow: [
        "Be the first player knocked out of the playable area: take 1 drink.",
        "Get knocked out three times in the same round: take 2 drinks."
      ],
      green: [
        "Win a round: give 2 drinks.",
        "Score or secure the deciding objective for your team: give 3 drinks."
      ]
    }
  },
  {
    id: "brawlhalla",
    name: "Brawlhalla",
    logo: "images/brawlhalla.jpg",
    accent: "#60b7ff",
    players: "Up to 8",
    price: "Free (Steam)",
    note: "Platform fighter / free-for-all",
    rules: {
      red: [
        "Self-destruct without an opponent touching you: take 1 shot."
      ],
      yellow: [
        "Lose your first stock within 15 seconds: take 2 drinks.",
        "Finish last in a free-for-all match: take 2 drinks."
      ],
      green: [
        "Win the match: give 2 drinks.",
        "Win with 2 or more stocks remaining: give 3 drinks."
      ]
    }
  },

  // ===========================================================================
  // DECEPTION / SOCIAL DEDUCTION / HIDE-AND-SEEK
  // ===========================================================================
  {
    id: "liars-bar",
    name: "Liar's Bar",
    logo: "images/liars-bar.png",
    accent: "#b8472b",
    players: "2–4",
    price: "€6.89 (Steam)",
    note: "Bluffing / deception party game",
    rules: {
      red: [
        "Be the first player eliminated from the table: take 1 shot."
      ],
      yellow: [
        "Get caught lying: take 2 drinks.",
        "Call another player a liar and be wrong: take 2 drinks."
      ],
      green: [
        "Correctly call another player's lie: give 2 drinks.",
        "Win the table: give 4 drinks total."
      ]
    }
  },
  {
    id: "among-us",
    name: "Among Us",
    logo: "images/among-us.png",
    accent: "#ff5364",
    players: "4–15",
    price: "€4.49 (Steam)",
    note: "Social deduction",
    rules: {
      red: [
        "Get caught venting and then voted out in the same meeting: take 1 shot."
      ],
      yellow: [
        "Get voted out while innocent: take 2 drinks.",
        "Call an emergency meeting, accuse someone with confidence, and be wrong: take 1 drink."
      ],
      green: [
        "As a crewmate, lead a successful vote onto an impostor: give 2 drinks.",
        "As an impostor, win without receiving a single vote: give 4 drinks total."
      ]
    }
  },
  {
    id: "goose-goose-duck",
    name: "Goose Goose Duck",
    logo: "images/goose-goose-duck.jpg",
    accent: "#f2c94c",
    players: "Up to 16",
    price: "Free (Steam)",
    note: "Social deduction",
    rules: {
      red: [
        "Get voted out as a Duck in the first meeting: take 1 shot."
      ],
      yellow: [
        "Get voted out while innocent: take 2 drinks.",
        "Confidently accuse an innocent player and get them voted out: take 1 drink."
      ],
      green: [
        "Correctly identify a Duck and get them voted out: give 2 drinks.",
        "Win with a neutral role: give 4 drinks total."
      ]
    }
  },
  {
    id: "gmod-murder",
    name: "GMod Murder",
    logo: "images/g-mod-murder.jpg",
    accent: "#4da2ff",
    players: "6–8+ recommended",
    price: "€9.99 (Steam - requires Garry's Mod)",
    note: "Murder / deduction game mode",
    rules: {
      red: [
        "As an armed bystander, shoot an innocent player: take 1 shot."
      ],
      yellow: [
        "Die before the murderer has been correctly identified: take 1 drink.",
        "Accuse the wrong player and directly get them killed: take 2 drinks."
      ],
      green: [
        "Kill the murderer as a bystander: give 3 drinks.",
        "Win the round as the murderer: give 4 drinks total."
      ]
    }
  },
  {
    id: "gmod-ttt",
    name: "GMod Trouble in Terrorist Town",
    logo: "images/ttt-gmod.png",
    accent: "#4da2ff",
    players: "6–8+ recommended",
    price: "€9.99 (Steam - requires Garry's Mod)",
    note: "Hidden-role / deduction game mode",
    rules: {
      red: [
        "RDM a confirmed innocent player: take 1 shot."
      ],
      yellow: [
        "Be the first innocent player to die in a round: take 1 drink.",
        "Say 'trust me' and die within the next 30 seconds: take 2 drinks."
      ],
      green: [
        "As Detective, correctly kill or expose a Traitor: give 2 drinks.",
        "As a Traitor, survive a winning round: give 3 drinks."
      ]
    }
  },
  {
    id: "gmod-prop-hunt",
    name: "GMod Prop Hunt",
    logo: "images/gmod-prop-hunt.png",
    accent: "#4da2ff",
    players: "6–8+ recommended",
    price: "€9.99 (Steam - requires Garry's Mod)",
    note: "Hide-and-seek game mode",
    rules: {
      red: [
        "Hide outside the intended map or in a place the Hunters cannot physically reach: take 1 shot."
      ],
      yellow: [
        "Be the first Prop found in a round: take 1 drink.",
        "Lose the round: every player on the losing team takes 1 drink."
      ],
      green: [
        "Make a Prop taunt or sound and survive for at least 10 seconds afterwards: give 1 drink. Spam does not count.",
        "Survive the full round as a Prop: give 2 drinks."
      ]
    }
  },
  {
    id: "meccha-chameleon",
    name: "MECCHA CHAMELEON",
    logo: "images/meccha-chameleon.jpg",
    accent: "#50f1b8",
    players: "2–10 recommended",
    price: "€6.15 (Steam)",
    note: "Team hide-and-seek / camouflage party game",
    rules: {
      red: [
        "Be the first Hider found within the first 20 seconds: take 1 shot."
      ],
      yellow: [
        "Be the first Hider found in a round: take 2 drinks.",
        "Get found while you are still painting or adjusting your hiding spot: take 1 drink."
      ],
      green: [
        "As a Seeker, give 1 drink for every Hider you personally find.",
        "Survive the entire round as a Hider: give 2 drinks."
      ]
    }
  },

  // ===========================================================================
  // CO-OP / SURVIVAL / PVE
  // ===========================================================================
  {
    id: "pico-park-2",
    name: "PICO PARK 2",
    logo: "images/pico-park-2.png",
    accent: "#f4df52",
    players: "2–8",
    price: "€7.49 (Steam)",
    note: "Co-op action puzzle",
    rules: {
      red: [
        "Be the obvious cause of a full-team reset three attempts in a row: take 1 shot."
      ],
      yellow: [
        "Obviously cause a full-team reset: take 1 drink.",
        "Be the last player to make a jump after everyone else is already waiting: take 1 drink."
      ],
      green: [
        "Make a save that keeps the attempt alive: give 1 drink.",
        "Clear a difficult stage on the first attempt: give 2 drinks total."
      ]
    }
  },
  {
    id: "far-far-west",
    name: "Far Far West",
    logo: "images/far-far-west.jpg",
    accent: "#00fd61",
    players: "1–4 co-op",
    price: "€19.99 (Steam)",
    note: "Co-op western extraction shooter",
    rules: {
      red: [
        "Get downed while carrying the bounty or the main extraction objective: take 1 shot."
      ],
      yellow: [
        "Get downed: take 1 drink.",
        "Fail the mission or extraction: everyone takes 2 drinks."
      ],
      green: [
        "Revive two teammates during the same mission: give 2 drinks.",
        "Complete a bounty without anyone getting downed: every surviving player may give 1 drink."
      ]
    }
  },
  {
    id: "lort",
    name: "LORT",
    logo: "images/lort.jpg",
    accent: "#ff0090",
    players: "1–8 co-op",
    price: "€14.99 (Steam)",
    note: "Co-op action roguelite / looter",
    rules: {
      red: [
        "Start a major fight alone and directly cause the team to wipe: take 1 shot."
      ],
      yellow: [
        "Get downed: take 1 drink.",
        "Need to be revived twice during the same encounter: take 2 drinks.",
        "Lose the run: everyone takes 2 drinks."
      ],
      green: [
        "Revive a teammate: give 1 drink.",
        "Defeat a boss without anyone getting downed: every surviving player may give 1 drink."
      ]
    }
  },
  {
    id: "left-4-dead-2",
    name: "Left 4 Dead 2",
    logo: "images/Left4Dead-2.png",
    accent: "#801900",
    players: "1–4 co-op / up to 8 in Versus",
    price: "€9.75 (Steam)",
    note: "Zombie co-op shooter",
    rules: {
      red: [
        "Startle a Witch and then get incapacitated by her: take 1 shot."
      ],
      yellow: [
        "Be the first survivor incapacitated: take 1 drink.",
        "Get pinned by a Special Infected until a teammate has to free you: take 1 drink.",
        "Die before reaching the safe room: take 2 drinks."
      ],
      green: [
        "Kill a Tank without anyone being incapacitated: give 3 drinks.",
        "Reach the safe room with the most health on the team: give 2 drinks."
      ]
    }
  },

  // ===========================================================================
  // TEAM SHOOTERS / MOBAS / COMPETITIVE GAMES
  // ===========================================================================
  {
    id: "deadlock",
    name: "Deadlock",
    logo: "images/deadlock.png",
    accent: "#54f793",
    players: "6v6",
    price: "Free playtest (Steam)",
    note: "Team shooter / MOBA",
    teamSetup: {
      defaultTeams: 2,
      teamNames: ["Archmother", "The Hidden King"]
    },
    rules: {
      red: [
        "Die while carrying the Urn: take 1 shot."
      ],
      yellow: [
        "Every time you die: take 1 drink.",
        "Whenever your team loses a Guardian or Walker, or the enemy delivers the Urn: everyone on your team takes 1 drink.",
        "Lose the match: everyone on the losing team takes 3 drinks."
      ],
      green: [
        "Deliver the Urn: give 3 drinks.",
        "Win a team fight without anyone on your team dying: your team gives 3 drinks total."
      ]
    }
  },
  {
    id: "league-of-legends",
    name: "League of Legends: ARAM Mayhem",
    logo: "images/league-of-legends.jpg",
    accent: "#2676ec",
    players: "5v5 + spectators / rotations",
    price: "Free (Riot Games - not Steam)",
    note: "ARAM Mayhem / MOBA",
    teamSetup: {
      defaultTeams: 2,
      teamNames: ["Blue Side", "Red Side"]
    },
    rules: {
      red: [
        "Be the first player in the match to get hooked: take 1 shot."
      ],
      yellow: [
        "Every time you die: take 1 drink.",
        "Every time you reach another 5 kills: take 1 drink."
      ],
      green: [
        "Every time you reach another 5 assists: give 1 drink.",
        "Get a pentakill: give 5 drinks total."
      ]
    }
  },
  {
    id: "smite2",
    name: "SMITE 2",
    logo: "images/smite-2.png",
    accent: "#c98200",
    players: "5v5",
    price: "Free (Steam)",
    note: "Third-person MOBA",
    teamSetup: {
      defaultTeams: 2,
      teamNames: ["Order", "Chaos"]
    },
    rules: {
      red: [
        "Die to a tower or Phoenix without an enemy god getting the kill: take 1 shot."
      ],
      yellow: [
        "Be the first player on your team to die: take 1 drink.",
        "Die while your team has a major objective buff: take 2 drinks."
      ],
      green: [
        "Steal a major neutral objective from the enemy team: give 3 drinks.",
        "Get a triple kill or better: give 3 drinks."
      ]
    }
  },
  {
    id: "counter-strike",
    name: "Counter-Strike 2",
    logo: "images/counter-strike-2.png",
    accent: "#eca03c",
    players: "5v5 + rotations",
    price: "Free (Steam)",
    note: "Competitive tactical shooter",
    teamSetup: {
      defaultTeams: 2,
      teamNames: ["Counter-Terrorists", "Terrorists"]
    },
    rules: {
      red: [
        "Get killed with a knife: take 1 shot."
      ],
      yellow: [
        "Be the first player on your team to die in a round: take 1 drink.",
        "Lose a clutch situation where you are the last player alive: take 2 drinks.",
        "Lose a pistol round: everyone on the losing team takes 1 drink.",
        "Lose an AWP: take 2 drinks."
      ],
      green: [
        "Clutch a 1v2 or harder: give 3 drinks. If the round is also an ace, give 5 instead."
      ]
    }
  },
  {
    id: "tf2",
    name: "Team Fortress 2",
    logo: "images/tf2.png",
    accent: "#ff9305",
    players: "Up to 16v16 depending on server",
    price: "Free (Steam)",
    note: "Class-based team shooter",
    teamSetup: {
      defaultTeams: 2,
      teamNames: ["RED", "BLU"]
    },
    rules: {
      red: [
        "Get backstabbed while you are carrying an ÜberCharge or another important team push: take 1 shot."
      ],
      yellow: [
        "Be the first player on your team to die after a round begins: take 1 drink.",
        "Die to an environmental hazard: take 2 drinks.",
        "Get dominated by another player: take 1 drink."
      ],
      green: [
        "Get revenge on a player dominating you: give 1 drink.",
        "Finish the round at the top of your team's scoreboard: give 3 drinks."
      ]
    }
  },
  {
    id: "overwatch",
    name: "Overwatch",
    logo: "images/overwatch.svg",
    accent: "#fa9600",
    players: "5v5 / 6v6 depending on mode",
    price: "Free (Steam / Battle.net)",
    note: "Hero shooter",
    teamSetup: {
      defaultTeams: 2,
      teamNames: ["Team One", "Team Two"]
    },
    rules: {
      red: [
        "Die during your own ultimate without getting any meaningful value from it: take 1 shot."
      ],
      yellow: [
        "Every time you die: take 1 drink.",
        "Die to the map or an environmental elimination: take 2 drinks.",
        "Your team gets completely wiped: everyone on your team takes 1 drink."
      ],
      green: [
        "Get Play of the Game: give 5 drinks total."
      ]
    }
  },
  {
    id: "fortnite",
    name: "Fortnite",
    logo: "images/fortnite.png",
    accent: "#62c6ff",
    players: "Squads / custom games",
    price: "Free (Epic Games Store - not Steam)",
    note: "Battle royale / creative",
    teamSetup: {
      defaultTeams: 2,
      teamNames: ["Squad Alpha", "Squad Bravo"]
    },
    rules: {
      red: [
        "Die to fall damage caused by your own build or movement mistake: take 1 shot."
      ],
      yellow: [
        "Be the first player in your squad eliminated: take 1 drink.",
        "Get knocked and finished before your team can revive you: take 1 drink.",
        "Your entire squad gets wiped: everyone takes 2 drinks."
      ],
      green: [
        "Get a Victory Royale: give 5 drinks total.",
        "Revive or reboot two teammates in the same match: give 2 drinks."
      ]
    }
  }
];