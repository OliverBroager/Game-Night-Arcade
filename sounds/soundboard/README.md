# Player soundboard clips

Put the sound clips you choose in this folder and list them in `js/soundboard.js`.

Example:

```js
{ id: "airhorn", name: "Air Horn", emoji: "📣", file: "sounds/soundboard/airhorn.mp3" }
```

Use short clips where possible (roughly 0.2–5 seconds works best). The app does not ship copyrighted meme audio; you choose and add the files you have permission to use.

Players can trigger one sound every 30 seconds. The Firebase rules also enforce the cooldown, not only the button UI.
