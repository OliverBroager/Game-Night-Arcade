/*
  FIREBASE SETUP
  1. Create a free Firebase project.
  2. Add a Web App.
  3. Enable Authentication -> Anonymous.
  4. Create Realtime Database.
  5. Paste your Web App config below.
  6. Paste firebase.rules.json into Realtime Database -> Rules.

  The Firebase web config is intentionally public client configuration; access is
  protected by Authentication + Realtime Database Security Rules.
*/
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBWvN7uEGfWI-1r_q0euDH42okVMf3o8LU",
  authDomain: "game-night-arcade-b6d48.firebaseapp.com",
  databaseURL: "https://game-night-arcade-b6d48-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "game-night-arcade-b6d48",
  appId: "1:1027022940049:web:b130a492832317d26bdc30"
};
window.ARCADE_FIREBASE_SDK_VERSION = "12.18.0";
