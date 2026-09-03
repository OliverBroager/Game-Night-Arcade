(() => {
  let state = window.ArcadeStorage.load();
  let pendingWinner = null;
  let selectedModeInModal = state.mode;
  let playerSetupIsStartup = false;
  let playerDraft = [];
  let toastTimer = null;
  let cloudReady = false;
  let cloudRoomCode = "";
  let cloudRoomData = null;
  let cloudMembers = {};
  let cloudArchives = {};
  let cloudMeta = {};
  let cloudUnsubscribe = null;
  let cloudSaveTimer = null;
  let firstCloudSnapshot = true;
  const lastSoundSeen = new Map();

  const $ = id => document.getElementById(id);
  const els = Object.fromEntries([
    "body","modeModal","winnerModal","settingsModal","playerSetupModal","gameDrawer","drawerBackdrop",
    "nightDrawer","nightBackdrop","roomModal","cloudSetupModal","chaosModal","roomBtn","roomCodeTop",
    "playerBtn","nightBtn","modeBtn","soundBtn","settingsBtn","openGameDrawerBtn","closeGameDrawerBtn",
    "enterArcadeBtn","editPoolBtn","modeTitle","remainingCount","removedCount","removeAfterAcceptToggle",
    "settingsRemoveToggle","displayLogoBtn","displayNameBtn","soundToggle","volumeRange","volumeValue",
    "reducedMotionToggle","editPlayersSettingsBtn","gameSearchInput","gameList","selectAllBtn","selectNoneBtn",
    "restoreRemovedBtn","resetEverythingBtn","rulesPanel","rulesWaiting","rulesContent","chosenGameLogo",
    "chosenGameName","chosenGameMeta","teamRandomizer","teamSummary","teamCountSelect","randomizeTeamsBtn",
    "editPlayersInlineBtn","teamGrid","scorekeeper","scoreStatus","scoreModeSelect","scoreDirectionSelect",
    "scoreEntryList","saveScoreBtn","markScorelessBtn","openNightInlineBtn","ruleSections","winnerLogo",
    "winnerTitle","winnerKicker","winnerSubtitle","rerollBtn","acceptBtn","historyText","toast",
    "closeNightDrawerBtn","nightSummary","drinkPlayerList","leaderboardList","randomPlayerBtn","coinFlipBtn",
    "modifierBtn","extraResult","matchHistoryList","adminArchiveList","endNightBtn","startNewNightBtn",
    "playerCountInput","decreasePlayerCountBtn","increasePlayerCountBtn","playerNameList","playerSetupError",
    "savePlayersBtn","cancelPlayerSetupBtn","roomCodeLarge","cloudStatusText","roomQr","playerJoinUrl",
    "copyPlayerLinkBtn","openPlayerViewBtn","roomRosterList","continueLocalBtn","closeChaosBtn","chaosKicker",
    "chaosTitle","chaosSubtitle","chaosSmall","chaosEmoji","coinStage","arcadeCoin"
  ].map(id => [id, id === "body" ? document.body : $(id)]));

  const modeMeta = {
    wheel: { title: "Prize Wheel", icon: "🎡", kicker: "JACKPOT!" },
    case: { title: "Case Opening", icon: "📦", kicker: "RARE DROP!" },
    slot: { title: "Slot Machine", icon: "🎰", kicker: "JACKPOT 777!" },
    shuffle: { title: "Arcade Shuffle", icon: "⚡", kicker: "LOCKED IN!" }
  };
  const playerAccents = ["#5cf5ff","#ff4ed8","#8b5cff","#ffd84c","#53f58c","#ff6b70","#ff8b3d","#78a5ff"];

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  }
  function playerKey(name) { return window.ArcadeSession.key(name); }
  function getGame(id) { return window.GAMES.find(game => game.id === id); }
  function getActiveRound() { return state.matchHistory.find(round => round.id === state.activeRoundId) || null; }
  function enabledSet() { return new Set(state.enabledGameIds); }
  function removedSet() { return new Set(state.removedGameIds); }
  function getPool() {
    const enabled = enabledSet(); const removed = removedSet();
    return window.GAMES.filter(game => enabled.has(game.id) && !removed.has(game.id));
  }
  function playerEmoji(name) { return state.playerEmojis[playerKey(name)] || "🎮"; }

  function publicStateForCloud() {
    return {
      mode: state.mode,
      display: state.display,
      removeAfterAccept: state.removeAfterAccept,
      enabledGameIds: state.enabledGameIds,
      removedGameIds: state.removedGameIds,
      history: state.history,
      acceptedGameId: state.acceptedGameId,
      players: state.players,
      matchHistory: state.matchHistory,
      activeRoundId: state.activeRoundId,
      teamCountByGame: state.teamCountByGame,
      teamResult: state.teamResult,
      currentModifier: state.currentModifier || null,
      nightStartedAt: state.nightStartedAt || null,
      nightEnded: Boolean(state.nightEnded)
    };
  }

  function save() {
    window.ArcadeStorage.save(state);
    if (!cloudReady) return;
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => {
      window.ArcadeCloud.savePublicState(publicStateForCloud(), cloudRoomCode).catch(error => console.warn("Cloud save failed", error));
    }, 80);
  }

  function showToast(message, ms = 2500) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), ms);
  }

  function updateModeUI() {
    const meta = modeMeta[state.mode] || modeMeta.wheel;
    document.body.dataset.mode = state.mode;
    els.modeTitle.textContent = meta.title;
    els.modeBtn.innerHTML = `${meta.icon} <span>${meta.title}</span>`;
    document.querySelectorAll(".mode-layer").forEach(layer => layer.classList.remove("active"));
    const active = $(`${state.mode}Mode`); if (active) active.classList.add("active");
    els.selectorViewport = $("selectorViewport");
    if (els.selectorViewport) els.selectorViewport.className = `selector-viewport mode-${state.mode}`;
    document.querySelectorAll(".mode-card").forEach(card => card.classList.toggle("selected", card.dataset.mode === selectedModeInModal));
  }

  function updateSettingsUI() {
    els.removeAfterAcceptToggle.checked = state.removeAfterAccept;
    els.settingsRemoveToggle.checked = state.removeAfterAccept;
    els.soundToggle.checked = state.soundEnabled !== false;
    els.volumeRange.value = state.volume;
    els.volumeValue.textContent = `${Math.round(Number(state.volume || 0) * 100)}%`;
    els.reducedMotionToggle.checked = Boolean(state.reducedMotion);
    document.body.classList.toggle("reduced-motion", Boolean(state.reducedMotion));
    els.soundBtn.innerHTML = `${state.soundEnabled !== false ? "🔊" : "🔇"} <span>${state.soundEnabled !== false ? "Sound" : "Muted"}</span>`;
    els.displayLogoBtn.classList.toggle("active", state.display === "logo");
    els.displayNameBtn.classList.toggle("active", state.display === "name");
    els.playerBtn.innerHTML = `👥 <span>${state.players.length ? `${state.players.length} Players` : "Players"}</span>`;
    window.ArcadeAudio.setup(state);
  }

  function refreshPoolUI() {
    const pool = getPool();
    els.remainingCount.textContent = pool.length;
    els.removedCount.textContent = state.removedGameIds.length;
    window.ArcadeModes.setPool(pool, state.display);
    renderGameList(els.gameSearchInput.value);
  }

  function renderGameList(filter = "") {
    const query = String(filter).trim().toLowerCase();
    const enabled = enabledSet(); const removed = removedSet();
    els.gameList.innerHTML = window.GAMES.filter(game => game.name.toLowerCase().includes(query)).map(game => `
      <label class="game-list-item ${removed.has(game.id) ? "eliminated" : ""}">
        <img src="${game.logo}" alt="${escapeHtml(game.name)} logo">
        <span><strong>${escapeHtml(game.name)}</strong><small>${removed.has(game.id) ? "ELIMINATED · " : ""}${escapeHtml(game.players || "Party game")} · ${escapeHtml(game.price || "")}</small></span>
        <input class="game-check" type="checkbox" data-game-id="${game.id}" ${enabled.has(game.id) ? "checked" : ""}>
      </label>`).join("");
  }

  function updateHistoryText() {
    const recent = state.history.slice(-3).reverse().map(getGame).filter(Boolean);
    els.historyText.textContent = recent.length ? `Recent: ${recent.map(game => game.name).join(" → ")}` : "No prizes accepted yet.";
  }

  function syncStateFromMembers(members = {}) {
    cloudMembers = members || {};
    const emojiMap = {}; const drinks = {};
    const byName = new Map(Object.values(cloudMembers).map(member => [playerKey(member.name), member]));
    state.players.forEach((name, index) => {
      const member = byName.get(playerKey(name));
      emojiMap[playerKey(name)] = member?.emoji || state.playerEmojis[playerKey(name)] || window.ArcadeSession.EMOJIS[index % 16];
      drinks[playerKey(name)] = Math.max(0, Number(member?.drinks ?? state.drinkCounts[playerKey(name)] ?? 0));
    });
    state.playerEmojis = emojiMap;
    state.drinkCounts = drinks;
    window.ArcadeStorage.save(state);
  }

  function memberForName(name) {
    return Object.entries(cloudMembers).find(([,member]) => playerKey(member.name) === playerKey(name)) || null;
  }

  function renderRules(game, options = {}) {
    if (!game) {
      els.rulesPanel.classList.add("waiting"); els.rulesWaiting.classList.remove("hidden"); els.rulesContent.classList.add("hidden");
      els.teamRandomizer.classList.add("hidden"); els.scorekeeper.classList.add("hidden"); return;
    }
    els.rulesPanel.classList.remove("waiting"); els.rulesWaiting.classList.add("hidden"); els.rulesContent.classList.remove("hidden");
    els.chosenGameLogo.src = game.logo; els.chosenGameLogo.alt = `${game.name} logo`; els.chosenGameName.textContent = game.name;
    els.chosenGameMeta.textContent = [game.players, game.price, game.note].filter(Boolean).join(" · ");
    renderTeamRandomizer(game, Boolean(options.forceNewTeams));
    renderScorekeeper(game);
    const types = window.ARCADE_CONFIG.ruleTypes;
    els.ruleSections.innerHTML = ["red","yellow","green"].map(type => {
      const rules = game.rules?.[type] || []; const info = types[type];
      return `<section class="rule-group ${type}"><div class="rule-group-title"><span>${info.icon} ${info.label}</span><span>${rules.length} RULE${rules.length === 1 ? "" : "S"}</span></div><ul class="rule-list">${rules.map(rule => `<li>${escapeHtml(rule)}</li>`).join("")}</ul></section>`;
    }).join("");
  }

  function renderTeamCountOptions(game, requested) {
    const maximum = Math.min(8, state.players.length);
    const count = window.ArcadeTeams.clampTeamCount(state.players.length, requested);
    els.teamCountSelect.innerHTML = Array.from({length: Math.max(0, maximum - 1)}, (_,i) => i + 2).map(value => `<option value="${value}" ${value === count ? "selected" : ""}>${value} teams</option>`).join("");
    return count;
  }

  function renderTeamResult(result) {
    if (!result?.teams?.length) { els.teamGrid.innerHTML = ""; return; }
    const sizes = result.teams.map(team => team.players.length);
    els.teamSummary.textContent = Math.max(...sizes) === Math.min(...sizes) ? `${state.players.length} players · ${result.teamCount} equal teams` : `${state.players.length} players · balanced ${sizes.join(" / ")}`;
    els.teamGrid.innerHTML = result.teams.map((team,index) => `<article class="team-card team-style-${index%8}"><div class="team-card-heading"><span class="team-number">${String(index+1).padStart(2,"0")}</span><div><small>TEAM</small><h4>${escapeHtml(team.name)}</h4></div><strong>${team.players.length}</strong></div><ol class="team-player-list">${team.players.map(player => `<li><span class="player-emoji-mini">${playerEmoji(player)}</span>${escapeHtml(player)}</li>`).join("")}</ol></article>`).join("");
  }

  function randomizeTeams(game, requested, announce = true) {
    if (!game || state.players.length < 2) return;
    const result = window.ArcadeTeams.createTeams(state.players, requested, game);
    state.teamCountByGame[game.id] = result.teamCount;
    state.teamResult = { gameId: game.id, playerKey: window.ArcadeTeams.playerKey(state.players), teamCount: result.teamCount, teams: result.teams };
    save(); renderTeamCountOptions(game,result.teamCount); renderTeamResult(state.teamResult); renderScorekeeper(game);
    if (announce) showToast(`Teams rerandomized for ${game.name}.`);
  }

  function renderTeamRandomizer(game, forceNew = false) {
    if (state.players.length < 2) { els.teamRandomizer.classList.add("hidden"); return; }
    els.teamRandomizer.classList.remove("hidden");
    const preferred = state.teamCountByGame[game.id] || window.ArcadeTeams.recommendedTeamCount(game,state.players.length);
    const count = renderTeamCountOptions(game,preferred);
    const valid = window.ArcadeTeams.isSavedResultValid(state.teamResult,game.id,state.players) && state.teamResult.teamCount === count;
    if (forceNew || !valid) randomizeTeams(game,count,false); else renderTeamResult(state.teamResult);
  }

  function scoreEntriesFor(mode) {
    if (mode === "teams" && state.teamResult?.teams?.length) return state.teamResult.teams.map(team => ({label:team.name,players:[...team.players]}));
    return state.players.map(name => ({label:name,players:[name]}));
  }

  function renderScorekeeper(game) {
    const round = getActiveRound();
    if (!game || !round || round.gameId !== game.id || state.players.length < 2) { els.scorekeeper.classList.add("hidden"); return; }
    els.scorekeeper.classList.remove("hidden");
    const teamAvailable = Boolean(state.teamResult?.teams?.length);
    const mode = round.scoreMode || (game.teamSetup && teamAvailable ? "teams" : "players");
    const direction = round.scoreDirection || game.scoreSetup?.direction || "high";
    els.scoreModeSelect.querySelector('option[value="teams"]').disabled = !teamAvailable;
    els.scoreModeSelect.value = mode === "teams" && teamAvailable ? "teams" : "players";
    els.scoreDirectionSelect.value = direction;
    const saved = new Map((round.scores || []).map(entry => [entry.label,entry.score]));
    els.scoreEntryList.innerHTML = scoreEntriesFor(els.scoreModeSelect.value).map((entry,index) => `<label class="score-entry-row"><span class="score-entry-rank">${String(index+1).padStart(2,"0")}</span><span class="score-entry-name"><strong>${escapeHtml(entry.label)}</strong><small>${entry.players.map(name => `${playerEmoji(name)} ${escapeHtml(name)}`).join(" · ")}</small></span><input data-score-index="${index}" type="number" step="any" inputmode="decimal" value="${saved.has(entry.label) ? saved.get(entry.label) : ""}" placeholder="—"></label>`).join("");
    els.scoreStatus.textContent = round.scoreless ? ((round.scores||[]).length ? "Marked scoreless." : "No score recorded yet — leaving it empty keeps the game scoreless.") : `Winner${round.winners.length===1?"":"s"}: ${round.winners.map(name=>`${playerEmoji(name)} ${name}`).join(", ")}`;
  }

  function saveScoreResult(forceScoreless=false) {
    const round=getActiveRound(); const game=getGame(state.acceptedGameId); if(!round||!game)return;
    const mode=els.scoreModeSelect.value; const direction=els.scoreDirectionSelect.value; const templates=scoreEntriesFor(mode);
    const raw=templates.map((entry,index)=>{const value=els.scoreEntryList.querySelector(`[data-score-index="${index}"]`)?.value?.trim();return {...entry,score:value===""?NaN:Number(value)}});
    const result=forceScoreless?{scores:[],winners:[],scoreless:true}:window.ArcadeSession.calculateResult(raw,direction);
    round.scoreMode=mode; round.scoreDirection=direction; round.scores=result.scores; round.winners=result.winners; round.scoreless=result.scoreless; save();
    renderScorekeeper(game); renderNightDashboard();
    if (cloudReady) window.ArcadeCloud.broadcastLiveEvent({type:"score",gameId:game.id,winners:result.winners,scoreless:result.scoreless},cloudRoomCode).catch(()=>{});
    showToast(result.scoreless?`${game.name} saved as scoreless.`:`Result saved — ${result.winners.join(" & ")} ${result.winners.length===1?"wins":"win"}!`);
  }

  function setPlayerCount(next) {
    const count=Math.max(2,Math.min(16,parseInt(next,10)||2)); while(playerDraft.length<count)playerDraft.push(""); playerDraft=playerDraft.slice(0,count); els.playerCountInput.value=count; renderPlayerInputs();
  }
  function renderPlayerInputs() {
    els.playerNameList.innerHTML=playerDraft.map((name,index)=>`<label class="player-name-row admin-name-only"><span class="player-number">${String(index+1).padStart(2,"0")}</span><input type="text" data-player-index="${index}" value="${escapeHtml(name)}" maxlength="28" placeholder="Player ${index+1}" autocomplete="off"><span class="claim-preview">${memberForName(name)?.[1]?.emoji || "○"}</span></label>`).join("");
  }
  function openPlayerSetup(startup=false){playerSetupIsStartup=startup;playerDraft=state.players.length?[...state.players]:Array.from({length:8},()=>"");els.playerSetupError.classList.add("hidden");els.cancelPlayerSetupBtn.classList.toggle("hidden",startup||!state.players.length);els.savePlayersBtn.textContent=startup?"SAVE PLAYERS & CHOOSE MODE":"SAVE PLAYERS";els.playerSetupModal.classList.remove("hidden");setPlayerCount(playerDraft.length||8);setTimeout(()=>els.playerNameList.querySelector("input")?.focus(),50);}
  function closePlayerSetup(){if(playerSetupIsStartup&&!state.players.length)return;els.playerSetupModal.classList.add("hidden");}
  async function savePlayers(){
    const names=playerDraft.map(n=>String(n).trim()); if(names.some(n=>!n)){els.playerSetupError.textContent="Enter a name for every player.";els.playerSetupError.classList.remove("hidden");return;} if(new Set(names.map(playerKey)).size!==names.length){els.playerSetupError.textContent="Every player needs a unique name.";els.playerSetupError.classList.remove("hidden");return;}
    state.players=names; state.teamResult=null; state.playerEmojis=window.ArcadeSession.assignUniqueEmojis(names,state.playerEmojis); state.drinkCounts=window.ArcadeSession.normalizeDrinkCounts(names,state.drinkCounts); if(!state.nightStartedAt)state.nightStartedAt=Date.now(); save();
    if(cloudReady){try{cloudMembers=await window.ArcadeCloud.syncRoster(names,cloudRoomCode);syncStateFromMembers(cloudMembers);save();}catch(error){showToast("Players saved locally, but room sync failed.");}}
    updateSettingsUI(); renderNightDashboard(); renderRoomRoster(); els.playerSetupModal.classList.add("hidden");
    const game=getGame(state.acceptedGameId);if(game)renderRules(game,{forceNewTeams:true}); if(playerSetupIsStartup)openModeMenu(); else showToast(`${names.length} players saved.`);
  }

  function pickWinner(pool){if(!pool.length)return null;const a=new Uint32Array(1);crypto.getRandomValues(a);return pool[a[0]%pool.length];}
  async function spin(){
    if(window.ArcadeModes.isBusy()||!els.winnerModal.classList.contains("hidden")||!els.playerSetupModal.classList.contains("hidden")||!els.modeModal.classList.contains("hidden"))return;
    const pool=getPool();if(!pool.length){showToast("No games available.");openGameDrawer();return;}pendingWinner=pickWinner(pool);window.ArcadeAudio.play("button",{volume:.5});
    if(cloudReady)window.ArcadeCloud.broadcastLiveEvent({type:"gameRoll",mode:state.mode,winnerId:pendingWinner.id,candidateIds:pool.map(g=>g.id)},cloudRoomCode).catch(()=>{});
    window.ArcadeModes.spin(state.mode,pool,state.display,pendingWinner,state.reducedMotion,revealWinner);
  }
  function revealWinner(){if(!pendingWinner)return;els.winnerLogo.src=pendingWinner.logo;els.winnerLogo.alt=`${pendingWinner.name} logo`;els.winnerTitle.textContent=pendingWinner.name;els.winnerKicker.textContent=modeMeta[state.mode].kicker;els.winnerSubtitle.textContent=state.removeAfterAccept?"Accept it to reveal the rules and remove it from future spins.":"Accept it to reveal the rules, or tempt fate again.";els.winnerModal.classList.remove("hidden");window.ArcadeAudio.play("winner",{volume:.85});}
  function closeWinner(){els.winnerModal.classList.add("hidden");}
  function acceptWinner(){if(!pendingWinner)return;const accepted=pendingWinner;state.acceptedGameId=accepted.id;state.history=[...state.history,accepted.id].slice(-30);const round=window.ArcadeSession.createRound(accepted.id,state.players);state.matchHistory=[...state.matchHistory,round].slice(-100);state.activeRoundId=round.id;if(state.removeAfterAccept&&!state.removedGameIds.includes(accepted.id))state.removedGameIds.push(accepted.id);save();closeWinner();renderRules(accepted,{forceNewTeams:true});updateHistoryText();refreshPoolUI();renderNightDashboard();if(cloudReady)window.ArcadeCloud.broadcastLiveEvent({type:"gameAccepted",gameId:accepted.id},cloudRoomCode).catch(()=>{});showToast(`${accepted.name} accepted${state.removeAfterAccept?" and removed from future spins":""}.`);pendingWinner=null;}
  function reroll(){if(!pendingWinner)return;closeWinner();pendingWinner=null;window.ArcadeAudio.play("reroll",{volume:.65});setTimeout(spin,state.reducedMotion?80:260);}

  function renderNightDashboard(){
    const board=window.ArcadeSession.leaderboard(state.players,state.matchHistory,state.drinkCounts);const scored=state.matchHistory.filter(r=>!r.scoreless).length;const totalDrinks=board.reduce((s,r)=>s+r.drinks,0);const leader=board[0]?.wins>0?board[0]:null;
    els.nightSummary.innerHTML=`<div><strong>${state.matchHistory.length}</strong><span>GAMES</span></div><div><strong>${scored}</strong><span>SCORED</span></div><div><strong>${totalDrinks}</strong><span>DRINKS</span></div><div><strong>${leader?`${playerEmoji(leader.name)} ${leader.wins}`:"—"}</strong><span>WIN LEADER</span></div>`;
    els.drinkPlayerList.innerHTML=state.players.map((name,index)=>`<div class="drink-player-row"><span class="dashboard-player-emoji">${playerEmoji(name)}</span><span class="dashboard-player-name">${escapeHtml(name)}</span><button class="counter-btn" data-drink-index="${index}" data-drink-delta="-1">−</button><strong>${Math.max(0,Number(state.drinkCounts[playerKey(name)])||0)}</strong><button class="counter-btn plus" data-drink-index="${index}" data-drink-delta="1">+</button></div>`).join("")||`<p class="empty-dashboard">Set up players first.</p>`;
    els.leaderboardList.innerHTML=board.map((row,index)=>`<div class="leaderboard-row ${index===0&&row.wins>0?"leader":""}"><span class="leader-rank">${index+1}</span><span class="dashboard-player-emoji">${playerEmoji(row.name)}</span><span class="leader-name"><strong>${escapeHtml(row.name)}</strong><small>${row.scoredGames} scored · ${row.games} played · ${row.drinks} drinks</small></span><strong class="wins-badge">${row.wins}W</strong></div>`).join("")||`<p class="empty-dashboard">No players yet.</p>`;
    els.matchHistoryList.innerHTML=[...state.matchHistory].reverse().slice(0,20).map(round=>{const game=getGame(round.gameId);if(!game)return"";const outcome=round.scoreless?"SCORELESS":`WIN: ${(round.winners||[]).map(n=>`${playerEmoji(n)} ${escapeHtml(n)}`).join(" + ")}`;const scores=(round.scores||[]).length?round.scores.map(e=>`${escapeHtml(e.label)} ${e.score}`).join(" · "):"No score entered";return`<article class="match-log-row ${round.scoreless?"scoreless":""}"><img src="${game.logo}" alt=""><span><strong>${escapeHtml(game.name)}</strong><small>${outcome}</small><em>${scores}</em></span></article>`}).join("")||`<p class="empty-dashboard">Accepted games appear here.</p>`;
    renderAdminArchive();
    els.endNightBtn.classList.toggle("hidden",Boolean(state.nightEnded));els.startNewNightBtn.classList.toggle("hidden",!state.nightEnded);
  }

  function renderAdminArchive(){
    const nights=Object.values(cloudArchives||{}).sort((a,b)=>(b.endedAt||0)-(a.endedAt||0));
    els.adminArchiveList.innerHTML=nights.map(night=>{const matches=Object.values(night.matches||{});return`<details class="archive-night"><summary><span><strong>${escapeHtml(night.title||`Game Night ${night.nightNumber||""}`)}</strong><small>${new Date(night.endedAt||Date.now()).toLocaleDateString()} · ${matches.length} games</small></span><button class="archive-delete" data-delete-night="${night.id}" type="button">DELETE</button></summary><div class="archive-match-list">${matches.map(round=>{const game=getGame(round.gameId);return`<div class="archive-match"><span><strong>${escapeHtml(game?.name||round.gameId)}</strong><small>${round.scoreless?"Scoreless":`Winner: ${(round.winners||[]).join(", ")}`}</small></span><button data-delete-match="${round.id}" data-night-id="${night.id}" type="button">×</button></div>`}).join("")||`<p class="empty-dashboard">No archived matches.</p>`}</div></details>`}).join("")||`<p class="empty-dashboard">End a game night to create the first archive.</p>`;
  }

  function playerItems(){return state.players.map((name,index)=>({id:`player-${index}`,name,emoji:playerEmoji(name),accent:playerAccents[index%playerAccents.length]}));}
  function showChaos({kicker="ARCADE CHAOS",title="",subtitle="",emoji=null,coin=false}){els.chaosKicker.textContent=kicker;els.chaosTitle.textContent=title;els.chaosSubtitle.textContent=subtitle||"";els.coinStage.classList.toggle("hidden",!coin);els.chaosEmoji.classList.toggle("hidden",!emoji);els.chaosEmoji.textContent=emoji||"";els.chaosModal.classList.remove("hidden");}
  function closeChaos(){els.chaosModal.classList.add("hidden");els.arcadeCoin.className="arcade-coin";}
  function animateCoin(result){
    closeNightDrawer();showChaos({kicker:"COIN FLIP",title:"FLIPPING…",subtitle:"Fate is in the air.",coin:true});void els.arcadeCoin.offsetWidth;els.arcadeCoin.classList.add(result==="HEADS"?"flip-heads":"flip-tails");window.ArcadeAudio.play("reel",{volume:.5});setTimeout(()=>{els.chaosTitle.textContent=result;els.chaosSubtitle.textContent=result==="HEADS"?"Heads takes it.":"Tails takes it.";window.ArcadeAudio.play("winner",{volume:.55});},state.reducedMotion?500:2400);
  }
  function runRandomPlayer(){
    if(state.players.length<2){showToast("Set up players first.");return;}const items=playerItems();const winner=pickWinner(items);closeNightDrawer();window.ArcadeModes.setPool(items,"logo");if(cloudReady)window.ArcadeCloud.broadcastLiveEvent({type:"playerRoll",mode:state.mode,winnerName:winner.name,winnerEmoji:winner.emoji,candidates:items.map(({id,name,emoji,accent})=>({id,name,emoji,accent}))},cloudRoomCode).catch(()=>{});window.ArcadeModes.spin(state.mode,items,"logo",winner,state.reducedMotion,()=>{refreshPoolUI();els.extraResult.innerHTML=`<strong>${winner.emoji} ${escapeHtml(winner.name)}</strong><span>FATE HAS SPOKEN</span>`;showChaos({kicker:"PLAYER SELECTED",title:winner.name,subtitle:"Fate has spoken.",emoji:winner.emoji});});
  }

  async function endNight(){
    if(!state.matchHistory.length&&!confirm("No games have been accepted yet. End the night anyway?"))return;if(state.matchHistory.length&&!confirm("End this game night and save it to the permanent room history?"))return;
    const board=window.ArcadeSession.leaderboard(state.players,state.matchHistory,state.drinkCounts);const id=`night-${Date.now()}`;const archive={id,title:`Game Night ${cloudMeta.nightNumber||1}`,nightNumber:cloudMeta.nightNumber||1,startedAt:state.nightStartedAt||cloudMeta.nightStartedAt||Date.now(),endedAt:Date.now(),players:state.players.map(name=>({name,emoji:playerEmoji(name),drinks:Number(state.drinkCounts[playerKey(name)])||0,wins:board.find(r=>r.name===name)?.wins||0})),leaderboard:board,matches:Object.fromEntries(state.matchHistory.map(round=>[round.id,round]))};
    if(cloudReady){try{await window.ArcadeCloud.archiveNight(archive,cloudRoomCode);await window.ArcadeCloud.broadcastLiveEvent({type:"nightEnded",podium:board.slice(0,3)},cloudRoomCode);}catch(error){showToast("Could not save the archive to Firebase.");return;}}
    state.nightEnded=true;save();renderNightDashboard();closeNightDrawer();const podium=board.slice(0,3).map((r,i)=>`${["🥇","🥈","🥉"][i]} ${playerEmoji(r.name)} ${r.name} — ${r.wins}W`).join(" · ");showChaos({kicker:"GAME NIGHT COMPLETE",title:board[0]?.wins?`${playerEmoji(board[0].name)} ${board[0].name}`:"NIGHT SAVED",subtitle:podium||"No scored games tonight.",emoji:board[0]?.wins?"🏆":null});
  }

  async function startNewNight(){
    if(!confirm("Start a fresh night? Previous nights stay in the archive."))return;state.matchHistory=[];state.activeRoundId=null;state.acceptedGameId=null;state.history=[];state.removedGameIds=[];state.teamResult=null;state.currentModifier=null;state.nightEnded=false;state.nightStartedAt=Date.now();state.drinkCounts=Object.fromEntries(state.players.map(n=>[playerKey(n),0]));save();if(cloudReady){await window.ArcadeCloud.setRoomMeta({status:"active",nightNumber:(cloudMeta.nightNumber||1)+1,nightStartedAt:state.nightStartedAt,endedAt:null},cloudRoomCode).catch(()=>{});for(const [id] of Object.entries(cloudMembers))await window.ArcadeCloud.setMemberDrinks(id,0,cloudRoomCode).catch(()=>{});}refreshPoolUI();renderRules(null);renderNightDashboard();openPlayerSetup(false);showToast("Fresh night started — archive preserved.");
  }

  function openGameDrawer(){closeNightDrawer();els.gameDrawer.classList.add("open");els.drawerBackdrop.classList.remove("hidden");}
  function closeGameDrawer(){els.gameDrawer.classList.remove("open");els.drawerBackdrop.classList.add("hidden");}
  function openNightDrawer(){closeGameDrawer();renderNightDashboard();els.nightDrawer.classList.add("open");els.nightBackdrop.classList.remove("hidden");}
  function closeNightDrawer(){els.nightDrawer.classList.remove("open");els.nightBackdrop.classList.add("hidden");}
  function openModeMenu(){selectedModeInModal=state.mode;document.querySelectorAll(".mode-card").forEach(card=>card.classList.toggle("selected",card.dataset.mode===selectedModeInModal));els.modeModal.classList.remove("hidden");}
  function openSettings(){els.settingsModal.classList.remove("hidden");}

  function playerJoinLink(){const url=new URL("play.html",location.href);if(cloudRoomCode)url.searchParams.set("room",cloudRoomCode);return url.href;}
  function renderRoomShare(){els.roomCodeTop.textContent=cloudRoomCode||"LOCAL";els.roomCodeLarge.textContent=cloudRoomCode||"LOCAL";els.cloudStatusText.textContent=cloudReady?"LIVE · FIREBASE":"LOCAL ONLY";const link=cloudReady?playerJoinLink():"Configure Firebase first";els.playerJoinUrl.value=link;els.openPlayerViewBtn.href=cloudReady?link:"#";els.roomQr.innerHTML="";if(cloudReady&&window.QRCode){new QRCode(els.roomQr,{text:link,width:180,height:180,colorDark:"#080b13",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});}renderRoomRoster();}
  function renderRoomRoster(){
    const entries=Object.entries(cloudMembers||{});els.roomRosterList.innerHTML=entries.map(([id,member])=>`<div class="room-roster-row"><span class="dashboard-player-emoji">${member.emoji||"○"}</span><span><strong>${escapeHtml(member.name)}</strong><small>${member.uid?"CONNECTED":"WAITING TO CLAIM"}</small></span>${member.uid?`<button data-release-member="${id}" class="secondary-btn" type="button">RELEASE</button>`:"<em>OPEN</em>"}</div>`).join("")||`<p class="empty-dashboard">Save tonight's player names to create claim slots.</p>`;
  }
  function openRoomModal(){renderRoomShare();els.roomModal.classList.remove("hidden");}

  function playNewSoundEvents(soundEvents={}){
    Object.entries(soundEvents).forEach(([uid,event])=>{const at=Number(event?.at)||0;const previous=lastSoundSeen.get(uid)||0;if(firstCloudSnapshot){lastSoundSeen.set(uid,at);return;}if(at<=previous)return;lastSoundSeen.set(uid,at);const sound=(window.ARCADE_SOUNDBOARD||[]).find(item=>item.id===event.soundId);if(!sound)return;const member=cloudMembers[event.memberId];window.ArcadeAudio.playFile(sound.file,{volume:.9}).then(ok=>{if(!ok)showToast(`🔊 ${member?.name||"Player"}: ${sound.name} — tap the page once if sound is blocked.`)});showToast(`${member?.emoji||"🔊"} ${member?.name||"Player"} played ${sound.name}`);});
  }

  function applyCloudRoom(room){
    if(!room)return;cloudRoomData=room;cloudMeta=room.meta||{};cloudArchives=room.history||{};syncStateFromMembers(room.members||{});renderRoomRoster();renderNightDashboard();const game=getGame(state.acceptedGameId);if(game)renderRules(game);playNewSoundEvents(room.soundEvents||{});firstCloudSnapshot=false;
  }

  async function initializeCloud(){
    if(!window.ArcadeCloud.configured()){els.cloudSetupModal.classList.remove("hidden");renderRoomShare();return false;}
    try{
      const boot=await window.ArcadeCloud.adminBootstrap(publicStateForCloud());cloudRoomCode=boot.roomCode;cloudRoomData=boot.room;cloudMeta=boot.room?.meta||{};cloudArchives=boot.room?.history||{};
      if(boot.room?.publicState){const localPrefs={soundEnabled:state.soundEnabled,volume:state.volume,reducedMotion:state.reducedMotion};state={...window.ArcadeStorage.defaults(),...state,...boot.room.publicState,...localPrefs};window.ArcadeStorage.save(state);}cloudReady=true;
      if(state.players.length)cloudMembers=await window.ArcadeCloud.syncRoster(state.players,cloudRoomCode);syncStateFromMembers(cloudMembers);save();renderAll();renderRoomShare();cloudUnsubscribe=await window.ArcadeCloud.subscribeRoom(cloudRoomCode,applyCloudRoom);showToast(`Room ${cloudRoomCode} is live.`);return true;
    }catch(error){console.error(error);els.cloudSetupModal.classList.remove("hidden");els.cloudStatusText.textContent="CONNECTION FAILED";return false;}
  }

  function renderAll(){updateModeUI();updateSettingsUI();refreshPoolUI();updateHistoryText();renderRules(getGame(state.acceptedGameId));renderNightDashboard();}

  function bindEvents(){
    document.addEventListener("pointerdown",()=>window.ArcadeAudio.unlock(),{once:true});
    els.openGameDrawerBtn.addEventListener("click",openGameDrawer);els.closeGameDrawerBtn.addEventListener("click",closeGameDrawer);els.drawerBackdrop.addEventListener("click",closeGameDrawer);
    els.nightBtn.addEventListener("click",openNightDrawer);els.openNightInlineBtn.addEventListener("click",openNightDrawer);els.closeNightDrawerBtn.addEventListener("click",closeNightDrawer);els.nightBackdrop.addEventListener("click",closeNightDrawer);
    els.roomBtn.addEventListener("click",openRoomModal);els.settingsBtn.addEventListener("click",openSettings);els.modeBtn.addEventListener("click",openModeMenu);els.playerBtn.addEventListener("click",()=>openPlayerSetup(false));els.editPlayersInlineBtn.addEventListener("click",()=>openPlayerSetup(false));els.editPlayersSettingsBtn.addEventListener("click",()=>{els.settingsModal.classList.add("hidden");openPlayerSetup(false)});
    document.querySelectorAll("[data-close-modal]").forEach(button=>button.addEventListener("click",()=>$(button.dataset.closeModal).classList.add("hidden")));
    els.continueLocalBtn.addEventListener("click",()=>{els.cloudSetupModal.classList.add("hidden");if(!state.players.length)openPlayerSetup(true)});els.closeChaosBtn.addEventListener("click",closeChaos);
    els.copyPlayerLinkBtn.addEventListener("click",async()=>{if(!cloudReady)return showToast("Configure Firebase first.");try{await navigator.clipboard.writeText(playerJoinLink());showToast("Player link copied.");}catch{els.playerJoinUrl.select();document.execCommand("copy");showToast("Player link copied.");}});
    document.querySelectorAll(".mode-card").forEach(card=>card.addEventListener("click",()=>{selectedModeInModal=card.dataset.mode;document.querySelectorAll(".mode-card").forEach(item=>item.classList.toggle("selected",item===card));window.ArcadeAudio.play("button",{volume:.35})}));
    els.enterArcadeBtn.addEventListener("click",()=>{state.mode=selectedModeInModal;save();updateModeUI();refreshPoolUI();els.modeModal.classList.add("hidden")});els.editPoolBtn.addEventListener("click",openGameDrawer);
    [$("wheelSpinButton"),$("caseSpinButton"),$("slotSpinButton"),$("shuffleSpinButton")].forEach(button=>button.addEventListener("click",spin));els.acceptBtn.addEventListener("click",acceptWinner);els.rerollBtn.addEventListener("click",reroll);
    els.displayLogoBtn.addEventListener("click",()=>{state.display="logo";save();updateSettingsUI();refreshPoolUI()});els.displayNameBtn.addEventListener("click",()=>{state.display="name";save();updateSettingsUI();refreshPoolUI()});
    const setRemove=value=>{state.removeAfterAccept=Boolean(value);save();updateSettingsUI()};els.removeAfterAcceptToggle.addEventListener("change",e=>setRemove(e.target.checked));els.settingsRemoveToggle.addEventListener("change",e=>setRemove(e.target.checked));
    els.soundBtn.addEventListener("click",()=>{state.soundEnabled=!state.soundEnabled;window.ArcadeAudio.setEnabled(state.soundEnabled);save();updateSettingsUI()});els.soundToggle.addEventListener("change",e=>{state.soundEnabled=e.target.checked;window.ArcadeAudio.setEnabled(state.soundEnabled);save();updateSettingsUI()});els.volumeRange.addEventListener("input",e=>{state.volume=Number(e.target.value);window.ArcadeAudio.setVolume(state.volume);save();updateSettingsUI()});els.reducedMotionToggle.addEventListener("change",e=>{state.reducedMotion=e.target.checked;save();updateSettingsUI()});
    els.gameSearchInput.addEventListener("input",e=>renderGameList(e.target.value));els.gameList.addEventListener("change",e=>{if(!e.target.matches("[data-game-id]"))return;const ids=new Set(state.enabledGameIds);e.target.checked?ids.add(e.target.dataset.gameId):ids.delete(e.target.dataset.gameId);state.enabledGameIds=[...ids];save();refreshPoolUI()});els.selectAllBtn.addEventListener("click",()=>{state.enabledGameIds=window.GAMES.map(g=>g.id);save();refreshPoolUI()});els.selectNoneBtn.addEventListener("click",()=>{state.enabledGameIds=[];save();refreshPoolUI()});els.restoreRemovedBtn.addEventListener("click",()=>{state.removedGameIds=[];save();refreshPoolUI()});
    els.decreasePlayerCountBtn.addEventListener("click",()=>setPlayerCount(Number(els.playerCountInput.value)-1));els.increasePlayerCountBtn.addEventListener("click",()=>setPlayerCount(Number(els.playerCountInput.value)+1));els.playerCountInput.addEventListener("change",e=>setPlayerCount(e.target.value));els.playerNameList.addEventListener("input",e=>{if(e.target.matches("[data-player-index]")){playerDraft[Number(e.target.dataset.playerIndex)]=e.target.value;els.playerSetupError.classList.add("hidden")}});els.savePlayersBtn.addEventListener("click",savePlayers);els.cancelPlayerSetupBtn.addEventListener("click",closePlayerSetup);
    els.randomizeTeamsBtn.addEventListener("click",()=>{const game=getGame(state.acceptedGameId);if(game)randomizeTeams(game,els.teamCountSelect.value,true)});els.teamCountSelect.addEventListener("change",e=>{const game=getGame(state.acceptedGameId);if(game)randomizeTeams(game,e.target.value,true)});
    els.scoreModeSelect.addEventListener("change",()=>{const round=getActiveRound();if(round){round.scoreMode=els.scoreModeSelect.value;round.scores=[];round.winners=[];round.scoreless=true;save()}renderScorekeeper(getGame(state.acceptedGameId))});els.scoreDirectionSelect.addEventListener("change",()=>{const round=getActiveRound();if(round){round.scoreDirection=els.scoreDirectionSelect.value;save()}});els.saveScoreBtn.addEventListener("click",()=>saveScoreResult(false));els.markScorelessBtn.addEventListener("click",()=>saveScoreResult(true));
    els.drinkPlayerList.addEventListener("click",async e=>{const button=e.target.closest("[data-drink-index]");if(!button)return;const name=state.players[Number(button.dataset.drinkIndex)];if(!name)return;const key=playerKey(name);const next=Math.max(0,(Number(state.drinkCounts[key])||0)+Number(button.dataset.drinkDelta||0));state.drinkCounts[key]=next;window.ArcadeStorage.save(state);const member=memberForName(name);if(cloudReady&&member)await window.ArcadeCloud.setMemberDrinks(member[0],next,cloudRoomCode).catch(()=>{});renderNightDashboard()});
    els.randomPlayerBtn.addEventListener("click",runRandomPlayer);els.coinFlipBtn.addEventListener("click",()=>{const result=window.ArcadeSession.coinFlip();if(cloudReady)window.ArcadeCloud.broadcastLiveEvent({type:"coinFlip",result},cloudRoomCode).catch(()=>{});els.extraResult.innerHTML=`<strong>🪙 ${result}</strong><span>COIN FLIP</span>`;animateCoin(result)});els.modifierBtn.addEventListener("click",()=>{const modifier=window.ArcadeSession.randomModifier();state.currentModifier=modifier;save();els.extraResult.innerHTML=`<strong>⚡ HOUSE MODIFIER</strong><span>${escapeHtml(modifier)}</span>`;if(cloudReady)window.ArcadeCloud.broadcastLiveEvent({type:"modifier",text:modifier},cloudRoomCode).catch(()=>{});showToast("Modifier broadcast to everyone.")});
    els.endNightBtn.addEventListener("click",endNight);els.startNewNightBtn.addEventListener("click",startNewNight);
    els.adminArchiveList.addEventListener("click",async e=>{
      const nightButton=e.target.closest("[data-delete-night]");
      const matchButton=e.target.closest("[data-delete-match]");
      if(nightButton){
        e.preventDefault();
        if(confirm("Delete this archived night permanently?")) await window.ArcadeCloud.deleteHistoryNight(nightButton.dataset.deleteNight,cloudRoomCode);
      }else if(matchButton){
        e.preventDefault();
        if(!confirm("Remove this match from the archived night and recalculate its leaderboard?"))return;
        const nightId=matchButton.dataset.nightId;
        const roundId=matchButton.dataset.deleteMatch;
        const night=cloudArchives[nightId];
        if(!night)return;
        const matches={...(night.matches||{})};
        delete matches[roundId];
        const names=(night.players||[]).map(player=>player.name);
        const drinkMap=Object.fromEntries((night.players||[]).map(player=>[playerKey(player.name),Number(player.drinks)||0]));
        const leaderboard=window.ArcadeSession.leaderboard(names,Object.values(matches),drinkMap);
        const players=(night.players||[]).map(player=>({...player,wins:leaderboard.find(row=>playerKey(row.name)===playerKey(player.name))?.wins||0}));
        await window.ArcadeCloud.setHistoryNight(nightId,{...night,matches,leaderboard,players},cloudRoomCode);
        showToast("Archived match removed and leaderboard recalculated.");
      }
    });
    els.roomRosterList.addEventListener("click",async e=>{const button=e.target.closest("[data-release-member]");if(!button)return;if(confirm("Release this player's phone/browser claim? They can claim the name again afterwards.")){await window.ArcadeCloud.releaseMember(button.dataset.releaseMember,cloudRoomCode);showToast("Player claim released.")}});
    els.resetEverythingBtn.addEventListener("click",async()=>{
      if(!confirm("Reset the CURRENT night? Permanent archived nights will stay saved."))return;
      const fresh=window.ArcadeStorage.defaults();
      state={...fresh,soundEnabled:state.soundEnabled,volume:state.volume,reducedMotion:state.reducedMotion,players:state.players,playerEmojis:state.playerEmojis,drinkCounts:Object.fromEntries(state.players.map(n=>[playerKey(n),0])),nightStartedAt:Date.now()};
      save();
      if(cloudReady){
        await window.ArcadeCloud.setRoomMeta({status:"active",nightStartedAt:state.nightStartedAt,endedAt:null},cloudRoomCode).catch(()=>{});
        for(const [id] of Object.entries(cloudMembers)) await window.ArcadeCloud.setMemberDrinks(id,0,cloudRoomCode).catch(()=>{});
      }
      refreshPoolUI();renderRules(null);renderNightDashboard();showToast("Current night reset. Archive preserved.");
    });
    window.addEventListener("keydown",e=>{if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||""))return;if(e.code==="Space"){e.preventDefault();spin()}else if(e.key.toLowerCase()==="p")openPlayerSetup(false);else if(e.key.toLowerCase()==="n")openNightDrawer();else if(e.key.toLowerCase()==="m")openModeMenu();else if(e.key.toLowerCase()==="g")openGameDrawer();else if(e.key==="Escape"){closeGameDrawer();closeNightDrawer();els.settingsModal.classList.add("hidden");closeChaos();closePlayerSetup()}});
    window.addEventListener("resize",()=>window.ArcadeModes.setPool(getPool(),state.display));
    window.addEventListener("qrcode-ready",()=>{if(cloudReady)renderRoomShare();});
  }

  async function init(){
    if(!state.playerEmojis)state.playerEmojis={};if(!state.drinkCounts)state.drinkCounts={};if(!state.matchHistory)state.matchHistory=[];if(!state.teamCountByGame)state.teamCountByGame={};
    renderAll();bindEvents();const cloudOk=await initializeCloud();if(cloudOk&&!state.players.length)openPlayerSetup(true);
  }
  init();
})();
