# Game Night Arcade — Live Edition

A zero-build arcade-style game-night controller designed for **GitHub Pages**. One computer acts as the admin/controller while everybody else can open the player dashboard on their phones. Live state is synchronized with Firebase Realtime Database.

## Pages

- `index.html` — simple Admin / Player landing page.
- `admin.html` — full controller: selector modes, game pool, teams, scores, night controls and archive editing.
- `play.html?room=ABC123` — player dashboard: current game, teams, rules, rankings, history, own drink counter and soundboard.

## What the admin controls

- Prize Wheel, CS-style Case Opening, Slot Machine and Arcade Shuffle.
- Game pool and remove-after-accept behavior.
- Player-name roster.
- Team count and rerandomization.
- Game score/results and scoreless games.
- All drink counters.
- Random player, animated coin flip and random modifier.
- End Night / Start New Night.
- Permanent night archive, including deleting an incorrect archived match or full archived night.
- Releasing a player's device claim if they change phone/browser.

## What players can do

Players can see the important live information:

- current game, logo and rules;
- current teams and their own team;
- current score/results;
- rankings and drink totals;
- tonight's match log;
- completed-night history;
- connected player list;
- live game/player/coin/modifier notifications and animations.

A player can change **only their own drink counter**. They can also trigger one configured soundboard clip every 30 seconds; it is broadcast to the admin and all connected player screens.

## Live arcade broadcasts

When the admin rolls a game, the player screens receive the selected mode before the result and run the corresponding animation locally:

- Wheel → live wheel spin.
- Case → live horizontal case roll.
- Slot → independent reels ending on the same winner.
- Shuffle → live arcade tile shuffle.

**Pick a Player** reuses the currently selected machine but replaces game logos with each player's unique emoji identity.

The coin flip uses a dedicated 3D coin animation and broadcasts the same Heads/Tails result to everyone.

## Persistence

The room is persistent rather than disposable. The admin browser gets one room code and reuses it. Player claims use Firebase Anonymous Authentication with local persistence, so closing/reopening the page on the same browser/device resumes that identity.

Completed nights are stored separately from the current session. Starting or resetting the current night does not remove the permanent archive.

## Firebase setup

See **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)**. It is a one-time setup using Firebase's no-cost Spark tier.

The project intentionally does not require npm, a server, Firebase Hosting, Cloud Functions or a build step.

## Project structure

```text
game-night-arcade/
├── index.html                  # landing page
├── admin.html                  # controller
├── play.html                   # player dashboard
├── README.md
├── FIREBASE_SETUP.md
├── firebase.rules.json         # Realtime Database security rules
├── css/
│   ├── styles.css              # admin + shared arcade visuals
│   ├── landing.css
│   └── player.css
├── js/
│   ├── config.js               # arcade timings + local sound paths
│   ├── games.js                # game definitions + drinking rules
│   ├── storage.js              # admin local backup
│   ├── audio.js
│   ├── modes.js                # wheel / case / slots / shuffle
│   ├── teams.js
│   ├── session.js              # scoring, emojis, leaderboard, chaos helpers
│   ├── soundboard.js           # EDIT THIS to add player-triggered sounds
│   ├── firebase-config.js      # PASTE FIREBASE CONFIG HERE
│   ├── firebase-service.js     # room/auth/realtime API
│   ├── app.js                  # admin controller
│   └── player.js               # player dashboard
├── images/
└── sounds/
    ├── spin.mp3
    └── soundboard/
```

## Adding/editing games

Edit only `js/games.js` for normal game content:

```js
{
  id: "my-game",
  name: "My Game",
  logo: "images/my-game.png",
  accent: "#5cf5ff",
  players: "6–8",
  price: "Free",
  note: "Party game",
  teamSetup: {
    defaultTeams: 2,
    teamNames: ["Blue", "Red"]
  },
  rules: {
    red: ["Take 1 sip when ..."],
    yellow: ["Special challenge when ..."],
    green: ["Give 1 sip when ..."]
  }
}
```

`teamSetup` is optional. Without it, the accepted-game panel can still randomize players into a chosen number of balanced teams.

For a low-score-wins game such as golf, add:

```js
scoreSetup: { direction: "low" }
```

Otherwise the scorekeeper defaults to highest score wins.

## Player emojis

The session supports 16 unique emoji identities. The admin enters names; each player claims their own name and one unused emoji from the player website. An emoji can be held by only one player at a time.

## Scoring

Every accepted game creates a match entry. Until the admin enters scores it remains **scoreless**, so it appears in the log but gives nobody a win.

The admin can score by team or by player, and can choose highest-score-wins or lowest-score-wins. Tied winning scores award a win to all tied winners. Team scoring awards a win to every player on the winning team.

## Team randomizer

After accepting a game, the admin can choose the number of teams and rerandomize. Team sizes are distributed as evenly as possible, differing by at most one player when the player count is not divisible evenly.

Example game defaults already exist for Deadlock, League of Legends, Counter Strike, Overwatch, Fortnite and Brawlhalla.

## Soundboard

Edit `js/soundboard.js` and add matching downloaded/licensed audio files to `sounds/soundboard/`:

```js
{ id: "airhorn", name: "Air Horn", emoji: "📣", file: "sounds/soundboard/airhorn.mp3" }
```

Every `id` must be unique. Missing audio files do not break the page, but naturally produce no sound.

## Normal arcade sounds

`js/config.js` references:

```text
sounds/button.mp3
sounds/tick.mp3
sounds/spin.mp3
sounds/case-click.mp3
sounds/reel.mp3
sounds/winner.mp3
sounds/accept.mp3
sounds/reroll.mp3
```

The supplied `spin.mp3` is 8.307 seconds long, and Wheel Mode is set to 8,307 ms so its movement ends with that clip.

## GitHub Pages

There is no build step. Upload the project files, enable **Settings → Pages → Deploy from a branch → main → /(root)**, and open the resulting `index.html`.

## Safety note

The drink counter is intentionally just a generic numeric counter. Drinking-game rules can be replaced with water, soft drinks, points or any other harmless forfeit. Keep rules optional and skip anything a player does not want to do.
