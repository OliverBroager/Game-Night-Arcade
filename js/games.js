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

  Rules are intentionally written as short trigger → action lines so they are
  easy to scan from the player view and transparent in-game overlay.

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
        "Your shirt gets 0 votes twice → SHOT"
      ],
      yellow: [
        "Lose a shirt matchup → DRINK 1",
        "Your shirt gets 0 votes → DRINK 1",
        "Miss the reveal because you're laughing → DRINK 1"
      ],
      green: [
        "Win a shirt matchup → GIVE 3",
        "Win the final gauntlet → GIVE 5"
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
        "Only one wrong + die on Killing Floor → SHOT"
      ],
      yellow: [
        "Wrong trivia answer → DRINK 1",
        "Die on Killing Floor → DRINK 2",
        "Lose first place in final escape → DRINK 2"
      ],
      green: [
        "Survive Killing Floor → GIVE 1",
        "Win the game → GIVE 5"
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
        "Freeze for 10+ seconds → SHOT"
      ],
      yellow: [
        "Break character laughing → DRINK 1",
        "Lowest presentation score → DRINK 2"
      ],
      green: [
        "Highest presentation score → GIVE 3",
        "Funniest slide (group vote) → GIVE 2"
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
        "Champion gets 0 votes → SHOT"
      ],
      yellow: [
        "Lose a matchup → DRINK 1",
        "Nobody understands your drawing → DRINK 1"
      ],
      green: [
        "Win a matchup → GIVE 2",
        "Win the game → GIVE 5"
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
        "You completely ruin a clear chain → SHOT"
      ],
      yellow: [
        "Your drawing makes no sense → DRINK 1",
        "Clearly misread the previous entry → DRINK 1"
      ],
      green: [
        "Chain returns to the original message → GIVE 3",
        "Biggest laugh of the reveal → GIVE 2"
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
        "Draw cards → DRINK 1 per card"
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
        "Someone steals your Goblet → SHOT"
      ],
      yellow: [
        "Last in a mini-game → DRINK 2",
        "Brag, then immediately get hit → DRINK 1",
        "Lose 10+ keys at once → DRINK 2"
      ],
      green: [
        "Win a mini-game → GIVE 2",
        "Buy or steal a Goblet → GIVE 3"
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
        "First eliminated twice in a row → SHOT"
      ],
      yellow: [
        "Lose a mini-game → DRINK 1",
        "Eliminate yourself by mistake → DRINK 2"
      ],
      green: [
        "Win a mini-game → GIVE 2",
        "Win without taking a hit/penalty → GIVE 3"
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
        "10+ strokes on one hole → SHOT"
      ],
      yellow: [
        "Fall off the map → DRINK 1",
        "Each stroke behind next player → DRINK 1 (max 3)",
        "Finish last overall → DRINK 3"
      ],
      green: [
        "Hole-in-one → GIVE 3",
        "Win a hole by 3+ strokes → GIVE 2"
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
    scoreSetup: { direction: "low" },
    rules: {
      red: [
        "Knocked off + finish last on hole → SHOT"
      ],
      yellow: [
        "Hit by another player → DRINK 1",
        "Last on a hole → DRINK 2"
      ],
      green: [
        "First on a hole → GIVE 2",
        "Hole-in-one → GIVE 3"
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
        "Die to your own trap → SHOT"
      ],
      yellow: [
        "Fail to reach the goal → DRINK 1",
        "Score 0 while someone scores → DRINK 2"
      ],
      green: [
        "Your trap kills someone → GIVE 1",
        "Only player to reach goal → GIVE 3"
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
        "Kill yourself with weapon/environment → SHOT"
      ],
      yellow: [
        "First to die → DRINK 1",
        "Die to a snake → DRINK 2"
      ],
      green: [
        "Win a round → GIVE 1",
        "Win 3 rounds in a row → GIVE 3"
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
        "Eliminate yourself untouched → SHOT"
      ],
      yellow: [
        "First eliminated → DRINK 1",
        "Recover, then immediately fall out → DRINK 2"
      ],
      green: [
        "Win a round → GIVE 2",
        "KO 2 players within 10 sec → GIVE 2"
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
        "Obvious own goal / throw the round → SHOT"
      ],
      yellow: [
        "First knocked out of the arena → DRINK 1",
        "KO'd 3 times in one round → DRINK 2"
      ],
      green: [
        "Win a round → GIVE 2",
        "Score the deciding objective → GIVE 3"
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
        "Self-destruct untouched → SHOT"
      ],
      yellow: [
        "Lose first stock within 15 sec → DRINK 2",
        "Finish last → DRINK 2"
      ],
      green: [
        "Win the match → GIVE 2",
        "Win with 2+ stocks left → GIVE 3"
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
        "First eliminated from the table → SHOT"
      ],
      yellow: [
        "Caught lying → DRINK 2",
        "Call liar and you're wrong → DRINK 2"
      ],
      green: [
        "Correct liar call → GIVE 2",
        "Win the table → GIVE 4"
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
        "Caught venting + voted out same meeting → SHOT"
      ],
      yellow: [
        "Voted out while innocent → DRINK 2",
        "Call meeting, accuse wrong player → DRINK 1"
      ],
      green: [
        "Lead vote onto an Impostor → GIVE 2",
        "Impostor win with 0 votes received → GIVE 4"
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
        "Duck voted out in first meeting → SHOT"
      ],
      yellow: [
        "Voted out while innocent → DRINK 2",
        "Get an innocent player voted out → DRINK 1"
      ],
      green: [
        "Get a Duck voted out → GIVE 2",
        "Win as a neutral role → GIVE 4"
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
        "Shoot an innocent as armed bystander → SHOT"
      ],
      yellow: [
        "Die before murderer is identified → DRINK 1",
        "Wrong accusation gets someone killed → DRINK 2"
      ],
      green: [
        "Kill the murderer → GIVE 3",
        "Win as murderer → GIVE 4"
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
        "RDM a confirmed innocent → SHOT"
      ],
      yellow: [
        "First innocent to die → DRINK 1",
        "Say 'trust me' then die within 30 sec → DRINK 2"
      ],
      green: [
        "Detective exposes/kills Traitor → GIVE 2",
        "Traitor survives a winning round → GIVE 3"
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
        "Use an unreachable/out-of-map hiding spot → SHOT"
      ],
      yellow: [
        "First Prop found → DRINK 1",
        "Lose the round → losing team DRINK 1"
      ],
      green: [
        "Taunt and survive 10 sec → GIVE 1",
        "Survive full round as Prop → GIVE 2"
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
        "First Hider found within 20 sec → SHOT"
      ],
      yellow: [
        "First Hider found → DRINK 2",
        "Found while still adjusting disguise → DRINK 1"
      ],
      green: [
        "Seeker finds a Hider → GIVE 1",
        "Hider survives full round → GIVE 2"
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
        "Cause 3 team resets in a row → SHOT"
      ],
      yellow: [
        "Cause a full-team reset → DRINK 1",
        "Everyone waits for your jump → DRINK 1"
      ],
      green: [
        "Save the attempt → GIVE 1",
        "Clear hard stage first try → GIVE 2"
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
        "Downed while carrying bounty/objective → SHOT"
      ],
      yellow: [
        "Get downed → DRINK 1",
        "Fail extraction → everyone DRINK 2"
      ],
      green: [
        "Revive 2 teammates in one mission → GIVE 2",
        "No downs on bounty → each survivor GIVE 1"
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
        "Start fight alone and cause wipe → SHOT"
      ],
      yellow: [
        "Get downed → DRINK 1",
        "Revived twice in one encounter → DRINK 2",
        "Lose the run → everyone DRINK 2"
      ],
      green: [
        "Revive a teammate → GIVE 1",
        "Boss with no downs → each survivor GIVE 1"
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
        "Startle Witch + she incapacitates you → SHOT"
      ],
      yellow: [
        "First survivor incapacitated → DRINK 1",
        "Pinned until teammate saves you → DRINK 1",
        "Die before safe room → DRINK 2"
      ],
      green: [
        "Kill Tank with no team downs → GIVE 3",
        "Most health at safe room → GIVE 2"
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
        "Die while carrying the Urn → SHOT"
      ],
      yellow: [
        "Die → DRINK 1",
        "Lose Guardian/Walker or enemy Urn delivery → team DRINK 1",
        "Lose match → losing team DRINK 3"
      ],
      green: [
        "Deliver the Urn → GIVE 3",
        "Win team fight with 0 deaths → team GIVE 3"
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
        "First player hooked → SHOT"
      ],
      yellow: [
        "Die → DRINK 1",
        "Every 5 kills → DRINK 1"
      ],
      green: [
        "Every 5 assists → GIVE 1",
        "Pentakill → GIVE 5"
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
        "Die to tower/Phoenix with no enemy kill → SHOT"
      ],
      yellow: [
        "First on your team to die → DRINK 1",
        "Die while team has major buff → DRINK 2"
      ],
      green: [
        "Steal major objective → GIVE 3",
        "Triple kill+ → GIVE 3"
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
        "Killed with a knife → SHOT"
      ],
      yellow: [
        "First teammate to die in round → DRINK 1",
        "Lose a clutch as last alive → DRINK 2",
        "Lose pistol round → team DRINK 1",
        "Lose an AWP → DRINK 2"
      ],
      green: [
        "Clutch 1v2+ → GIVE 3",
        "Ace clutch → GIVE 5 instead"
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
        "Backstabbed while holding Über / key push → SHOT"
      ],
      yellow: [
        "First teammate to die → DRINK 1",
        "Environmental death → DRINK 2",
        "Get dominated → DRINK 1"
      ],
      green: [
        "Get revenge → GIVE 1",
        "Top your team's scoreboard → GIVE 3"
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
        "Die during your own ult with no value → SHOT"
      ],
      yellow: [
        "Die → DRINK 1",
        "Environmental death → DRINK 2",
        "Team wipe → team DRINK 1"
      ],
      green: [
        "Play of the Game → GIVE 5"
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
        "Self-caused fall damage death → SHOT"
      ],
      yellow: [
        "First squad member eliminated → DRINK 1",
        "Knocked + finished before revive → DRINK 1",
        "Squad wiped → everyone DRINK 2"
      ],
      green: [
        "Victory Royale → GIVE 5",
        "Revive/reboot 2 teammates → GIVE 2"
      ]
    }
  }
];