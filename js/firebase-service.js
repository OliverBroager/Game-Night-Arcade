window.ArcadeCloud = (() => {
  const ADMIN_ROOM_KEY = "game-night-arcade-admin-room-v1";
  const SDK = window.ARCADE_FIREBASE_SDK_VERSION || "12.18.0";
  const appUrl = `https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`;
  const authUrl = `https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`;
  const dbUrl = `https://www.gstatic.com/firebasejs/${SDK}/firebase-database.js`;

  let modulesPromise = null;
  let app = null;
  let auth = null;
  let db = null;
  let currentRoom = null;
  let currentUid = null;
  let persistenceReady = false;

  function configured() {
    const cfg = window.FIREBASE_CONFIG || {};
    return Boolean(cfg.apiKey && cfg.projectId && cfg.databaseURL && !String(cfg.apiKey).includes("PASTE_") && !String(cfg.projectId).includes("PASTE_"));
  }

  async function modules() {
    if (!configured()) throw new Error("FIREBASE_NOT_CONFIGURED");
    if (!modulesPromise) {
      modulesPromise = Promise.all([import(appUrl), import(authUrl), import(dbUrl)]).then(([appMod, authMod, dbMod]) => {
        app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(window.FIREBASE_CONFIG);
        auth = authMod.getAuth(app);
        db = dbMod.getDatabase(app);
        return { appMod, authMod, dbMod };
      });
    }
    return modulesPromise;
  }

  async function ensureAnonymous() {
    const { authMod } = await modules();
    if (!persistenceReady) {
      await authMod.setPersistence(auth, authMod.browserLocalPersistence);
      persistenceReady = true;
    }
    if (auth.currentUser) {
      currentUid = auth.currentUser.uid;
      return auth.currentUser;
    }
    const credential = await authMod.signInAnonymously(auth);
    currentUid = credential.user.uid;
    return credential.user;
  }

  function code() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return [...bytes].map(value => alphabet[value % alphabet.length]).join("");
  }

  function cleanCode(value) {
    return String(value || "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 8);
  }

  function emojiKey(emoji) {
    return [...String(emoji || "")].map(char => char.codePointAt(0).toString(16)).join("-");
  }

  async function adminBootstrap(initialPublicState = null) {
    const { dbMod } = await modules();
    const user = await ensureAnonymous();
    let roomCode = cleanCode(localStorage.getItem(ADMIN_ROOM_KEY));
    let room = null;

    if (roomCode) {
      const snap = await dbMod.get(dbMod.ref(db, `rooms/${roomCode}`));
      if (snap.exists() && snap.val()?.meta?.adminUid === user.uid) room = snap.val();
      else roomCode = "";
    }

    if (!roomCode) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const candidate = code();
        const roomRef = dbMod.ref(db, `rooms/${candidate}`);
        const exists = await dbMod.get(roomRef);
        if (exists.exists()) continue;
        const now = Date.now();
        const seed = {
          meta: {
            code: candidate,
            adminUid: user.uid,
            createdAt: now,
            nightStartedAt: now,
            status: "active",
            nightNumber: 1
          },
          publicState: initialPublicState || null,
          members: {},
          uidToMember: {},
          emojiClaims: {},
          liveEvent: null,
          soundEvents: {},
          history: {}
        };
        await dbMod.set(roomRef, seed);
        roomCode = candidate;
        room = seed;
        localStorage.setItem(ADMIN_ROOM_KEY, roomCode);
        break;
      }
    }

    if (!roomCode) throw new Error("ROOM_CREATE_FAILED");
    currentRoom = roomCode;
    currentUid = user.uid;
    return { roomCode, uid: user.uid, room };
  }

  async function joinRoom(roomCode) {
    const { dbMod } = await modules();
    const user = await ensureAnonymous();
    const cleaned = cleanCode(roomCode);
    if (!cleaned) throw new Error("ROOM_NOT_FOUND");
    const snap = await dbMod.get(dbMod.ref(db, `rooms/${cleaned}`));
    if (!snap.exists()) throw new Error("ROOM_NOT_FOUND");
    currentRoom = cleaned;
    currentUid = user.uid;
    return { roomCode: cleaned, uid: user.uid, room: snap.val() };
  }

  async function getOwnMember(roomCode = currentRoom) {
    const { dbMod } = await modules();
    await ensureAnonymous();
    const memberSnap = await dbMod.get(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/uidToMember/${currentUid}`));
    return memberSnap.exists() ? memberSnap.val() : null;
  }

  async function subscribeRoom(roomCode, callback) {
    const { dbMod } = await modules();
    const roomRef = dbMod.ref(db, `rooms/${cleanCode(roomCode)}`);
    return dbMod.onValue(roomRef, snap => callback(snap.exists() ? snap.val() : null));
  }

  async function savePublicState(publicState, roomCode = currentRoom) {
    const { dbMod } = await modules();
    await dbMod.set(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/publicState`), publicState);
    await dbMod.update(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/meta`), { updatedAt: Date.now() });
  }

  function memberIdFor(name, index) {
    let hash = 2166136261;
    for (const char of String(name).toLowerCase()) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return `p${index + 1}-${(hash >>> 0).toString(36)}`;
  }

  async function syncRoster(names, roomCode = currentRoom) {
    const { dbMod } = await modules();
    const cleaned = cleanCode(roomCode);
    const roomSnap = await dbMod.get(dbMod.ref(db, `rooms/${cleaned}`));
    const room = roomSnap.val() || {};
    const existing = room.members || {};
    const byName = new Map(Object.entries(existing).map(([id, member]) => [String(member.name || "").trim().toLowerCase(), { id, member }]));
    const members = {};
    names.forEach((name, index) => {
      const found = byName.get(String(name).trim().toLowerCase());
      const id = found?.id || memberIdFor(name, index);
      members[id] = found ? { ...found.member, name } : { name, uid: null, emoji: null, emojiKey: null, drinks: 0, claimedAt: null };
    });

    const uidToMember = {};
    const emojiClaims = {};
    Object.entries(members).forEach(([id, member]) => {
      if (member.uid) uidToMember[member.uid] = id;
      if (member.uid && member.emoji) {
        const eKey = member.emojiKey || emojiKey(member.emoji);
        member.emojiKey = eKey;
        emojiClaims[eKey] = { uid: member.uid, memberId: id, emoji: member.emoji };
      }
    });

    await dbMod.update(dbMod.ref(db, `rooms/${cleaned}`), { members, uidToMember, emojiClaims });
    return members;
  }

  async function releaseMember(memberId, roomCode = currentRoom) {
    const { dbMod } = await modules();
    const cleaned = cleanCode(roomCode);
    const memberRef = dbMod.ref(db, `rooms/${cleaned}/members/${memberId}`);
    const snap = await dbMod.get(memberRef);
    if (!snap.exists()) return;
    const member = snap.val();
    const updates = {};
    updates[`members/${memberId}/uid`] = null;
    updates[`members/${memberId}/emoji`] = null;
    updates[`members/${memberId}/emojiKey`] = null;
    updates[`members/${memberId}/claimedAt`] = null;
    if (member.uid) updates[`uidToMember/${member.uid}`] = null;
    if (member.emojiKey) updates[`emojiClaims/${member.emojiKey}`] = null;
    await dbMod.update(dbMod.ref(db, `rooms/${cleaned}`), updates);
  }

  async function claimMember(roomCode, memberId, emoji) {
    const { dbMod } = await modules();
    await ensureAnonymous();
    const cleaned = cleanCode(roomCode);
    const eKey = emojiKey(emoji);
    const emojiRef = dbMod.ref(db, `rooms/${cleaned}/emojiClaims/${eKey}`);
    const emojiResult = await dbMod.runTransaction(emojiRef, current => {
      if (current && current.uid !== currentUid) return;
      return { uid: currentUid, memberId, emoji, at: Date.now() };
    }, { applyLocally: false });
    if (!emojiResult.committed || emojiResult.snapshot.val()?.uid !== currentUid) throw new Error("EMOJI_TAKEN");

    const memberRef = dbMod.ref(db, `rooms/${cleaned}/members/${memberId}`);
    const memberResult = await dbMod.runTransaction(memberRef, current => {
      if (!current) return;
      if (current.uid && current.uid !== currentUid) return;
      return { ...current, uid: currentUid, emoji, emojiKey: eKey, claimedAt: current.claimedAt || Date.now() };
    }, { applyLocally: false });

    if (!memberResult.committed || memberResult.snapshot.val()?.uid !== currentUid) {
      const own = await dbMod.get(emojiRef);
      if (own.val()?.uid === currentUid) await dbMod.remove(emojiRef);
      throw new Error("PLAYER_TAKEN");
    }

    await dbMod.set(dbMod.ref(db, `rooms/${cleaned}/uidToMember/${currentUid}`), memberId);
    return memberResult.snapshot.val();
  }

  async function changeOwnDrinks(roomCode, memberId, delta) {
    const { dbMod } = await modules();
    await ensureAnonymous();
    const drinksRef = dbMod.ref(db, `rooms/${cleanCode(roomCode)}/members/${memberId}/drinks`);
    const result = await dbMod.runTransaction(drinksRef, value => Math.max(0, Math.min(999, (Number(value) || 0) + Number(delta || 0))));
    return result.snapshot.val();
  }

  async function setMemberDrinks(memberId, value, roomCode = currentRoom) {
    const { dbMod } = await modules();
    await dbMod.set(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/members/${memberId}/drinks`), Math.max(0, Math.min(999, Math.round(Number(value) || 0))));
  }

  async function sendSound(roomCode, memberId, soundId) {
    const { dbMod } = await modules();
    await ensureAnonymous();
    const event = { memberId, soundId, at: Date.now() };
    await dbMod.set(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/soundEvents/${currentUid}`), event);
    return event;
  }

  async function broadcastLiveEvent(event, roomCode = currentRoom) {
    const { dbMod } = await modules();
    const payload = { ...event, id: event.id || `evt-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, at: Date.now() };
    await dbMod.set(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/liveEvent`), payload);
    return payload;
  }

  async function archiveNight(summary, roomCode = currentRoom) {
    const { dbMod } = await modules();
    const id = summary.id || `night-${Date.now()}`;
    const payload = { ...summary, id, endedAt: summary.endedAt || Date.now() };
    await dbMod.set(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/history/${id}`), payload);
    await dbMod.update(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/meta`), { status: "ended", endedAt: payload.endedAt });
    return payload;
  }

  async function setHistoryNight(nightId, night, roomCode = currentRoom) {
    const { dbMod } = await modules();
    await dbMod.set(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/history/${nightId}`), night);
  }

  async function deleteHistoryNight(nightId, roomCode = currentRoom) {
    const { dbMod } = await modules();
    await dbMod.remove(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/history/${nightId}`));
  }

  async function deleteHistoryMatch(nightId, roundId, roomCode = currentRoom) {
    const { dbMod } = await modules();
    await dbMod.remove(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/history/${nightId}/matches/${roundId}`));
  }

  async function setRoomMeta(values, roomCode = currentRoom) {
    const { dbMod } = await modules();
    await dbMod.update(dbMod.ref(db, `rooms/${cleanCode(roomCode)}/meta`), values);
  }

  function room() { return currentRoom; }
  function uid() { return currentUid; }
  function adminRoomFromStorage() { return cleanCode(localStorage.getItem(ADMIN_ROOM_KEY)); }
  function clearAdminRoom() { localStorage.removeItem(ADMIN_ROOM_KEY); }

  return {
    configured, cleanCode, emojiKey, ensureAnonymous, adminBootstrap, joinRoom, getOwnMember,
    subscribeRoom, savePublicState, syncRoster, releaseMember, claimMember, changeOwnDrinks,
    setMemberDrinks, sendSound, broadcastLiveEvent, archiveNight, setHistoryNight, deleteHistoryNight,
    deleteHistoryMatch, setRoomMeta, room, uid, adminRoomFromStorage, clearAdminRoom
  };
})();
