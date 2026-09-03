# Firebase setup for Game Night Arcade

You only need to do this once. The website itself stays on GitHub Pages; Firebase is used only to synchronize the live game-night room between the admin computer and player phones.

The project is designed for Firebase's **Spark** plan (no-cost tier). Do not upgrade to Blaze for this project unless you intentionally want paid usage.

## 1. Create a Firebase project

1. Go to the Firebase Console.
2. Choose **Create a project**.
3. Give it any name, for example `game-night-arcade`.
4. Google Analytics is not required for this website, so you can leave it disabled.
5. Make sure the project is on the **Spark / no-cost** plan.

## 2. Register the website

1. From the Firebase project overview, click the **Web** icon (`</>`).
2. Give the web app a nickname such as `Game Night Web`.
3. You do **not** need Firebase Hosting; GitHub Pages will host the site.
4. Click **Register app**.
5. Firebase shows a `firebaseConfig` object. Keep that page open; you will paste these values later.

It normally contains values similar to:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

The arcade additionally needs the Realtime Database URL, which you create in step 4.

## 3. Enable Anonymous Authentication

1. In Firebase, open **Authentication**.
2. Open **Sign-in method**.
3. Enable **Anonymous**.
4. Save.

No player creates an account. Firebase silently assigns each browser an anonymous identity. The arcade explicitly uses local browser persistence, so closing and reopening the browser on the same device keeps the player's claim and keeps the admin browser as the admin.

## 4. Create Realtime Database

1. Open **Build → Realtime Database**.
2. Click **Create Database**.
3. Pick a nearby database location.
4. You may start in **Locked mode** because you will immediately install the supplied rules.
5. After creation, copy the database URL. It will look similar to one of these:

```text
https://your-project-default-rtdb.firebaseio.com
```

or

```text
https://your-project-default-rtdb.europe-west1.firebasedatabase.app
```

## 5. Add your Firebase configuration

Open:

```text
js/firebase-config.js
```

Replace the placeholder values:

```js
window.FIREBASE_CONFIG = {
  apiKey: "PASTE_API_KEY_HERE",
  authDomain: "PASTE_PROJECT.firebaseapp.com",
  databaseURL: "https://PASTE_DATABASE_URL.firebasedatabase.app",
  projectId: "PASTE_PROJECT_ID",
  appId: "PASTE_APP_ID"
};
```

with your real values. For example:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "my-game-night.firebaseapp.com",
  databaseURL: "https://my-game-night-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-game-night",
  appId: "1:123456789:web:abcdef123456"
};
```

You can leave this line unchanged:

```js
window.ARCADE_FIREBASE_SDK_VERSION = "12.18.0";
```

The Firebase web configuration is client configuration, not an admin password. Access is controlled by Authentication and the database security rules below.

## 6. Install the database security rules

Open this file from the project:

```text
firebase.rules.json
```

Copy everything inside it.

Then in Firebase:

1. Open **Realtime Database → Rules**.
2. Replace the existing rules with the contents of `firebase.rules.json`.
3. Click **Publish**.

These rules are important. They enforce the intended split:

- the admin identity can control the room;
- authenticated player browsers can read the room;
- a player can claim one available player slot and emoji;
- a player can change only their own drink count;
- a player cannot change scores, teams, games, history or other players' counters;
- each player device can submit a soundboard event only once every 30 seconds.

Do not leave Realtime Database in public test mode.

## 7. Put the project on GitHub Pages

Upload the **contents** of `game-night-arcade` to a GitHub repository so these files are at the repository root:

```text
index.html
admin.html
play.html
FIREBASE_SETUP.md
firebase.rules.json
css/
js/
images/
sounds/
```

Then:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your main branch.
5. Select `/ (root)`.
6. Save.

Your landing page will be something like:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

## 8. First game night

Open `admin.html` from your GitHub Pages site.

On the first successful Firebase connection, the admin browser automatically creates a persistent six-character room code such as:

```text
K7R9PX
```

Press the **📡 ROOM** button to see:

- the room code;
- the player join link;
- a QR code when the QR helper has loaded;
- which player slots have been claimed.

The player URL is automatically generated from the deployed GitHub Pages address, for example:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/play.html?room=K7R9PX
```

Players can scan the QR code or open that URL.

## 9. How player identity persistence works

The admin enters the names participating in the night. Each player then opens the player website and claims:

1. their name;
2. one unused emoji.

That browser's anonymous Firebase identity is linked to the claimed player. Closing and reopening the site on the **same browser/device and same GitHub Pages domain** restores the claim automatically.

If somebody changes phone, changes browser, clears site data, or uses private/incognito mode, the admin can open **📡 ROOM** and press **RELEASE** beside that player. The player can then claim the name again on the new device.

The same principle applies to the admin identity: normal page/browser closing is fine. Avoid clearing browser site data for the GitHub Pages site on the admin machine during an active room, because the anonymous admin identity is intentionally tied to that browser profile for simplicity and security.

## 10. Add your soundboard clips

Edit:

```text
js/soundboard.js
```

Each item looks like:

```js
{
  id: "airhorn",
  name: "Air Horn",
  emoji: "📣",
  file: "sounds/soundboard/airhorn.mp3"
}
```

Then place the matching downloaded/licensed file in:

```text
sounds/soundboard/
```

You can add, remove or rename soundboard entries freely. Keep every `id` unique.

Every player gets a **30-second personal cooldown** after triggering a clip. The cooldown is also checked by the Firebase rules, not just by the button UI.

Browsers do not allow websites to autoplay sound until the user has interacted with the page. On the player screen, pressing **Enable sounds** once enables live soundboard playback on that device.

## 11. What is saved where

### Live Firebase room

Firebase stores the shared state needed by all devices:

- current game and rules;
- selected arcade mode;
- teams;
- scores and winners;
- drink counters;
- player emoji claims;
- live game/player/coin/modifier events;
- soundboard events;
- completed-night archive.

### Admin local backup

The admin page also keeps a local browser copy of current controller state using `localStorage`. This provides a useful fallback for the controller interface.

### Completed-night history

When the admin presses **End Game Night**, the important results are copied to the persistent Firebase history:

- date/time;
- players and emojis;
- final drink totals;
- wins leaderboard;
- scored and scoreless matches;
- winners and saved scores.

The admin History/Archive section can delete an incorrect individual archived match or delete an entire archived night. Player pages can view the archive but cannot edit it.

## 12. Free-tier expectations

A normal private game night with a handful of phones uses a very small amount of Realtime Database data. Firebase's Spark tier currently lists 100 simultaneous Realtime Database connections, 1 GB stored data and 10 GB/month downloads. That is substantially above the needs of a normal 6–16-player room.

You do not need Firebase Hosting, Cloud Functions, Cloud Storage, or a paid Blaze plan for the design in this project.

## Quick deployment checklist

Before game night, verify:

- [ ] `js/firebase-config.js` contains your real Firebase values.
- [ ] Anonymous Authentication is enabled.
- [ ] Realtime Database exists.
- [ ] `firebase.rules.json` has been published in Realtime Database Rules.
- [ ] GitHub Pages is enabled.
- [ ] `admin.html` shows a six-character live room code rather than `LOCAL`.
- [ ] One phone can join `play.html`, claim a name and emoji, and survive a page refresh.
- [ ] The phone can change only its own drink counter.
- [ ] A game roll appears as the same type of animation on the phone.
- [ ] **Enable sounds** has been tapped on player phones if you want soundboard broadcasts.
