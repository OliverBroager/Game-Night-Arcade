(() => {
  let roomCode = "";
  let roomData = null;
  let memberId = null;
  let selectedMemberId = null;
  let selectedEmoji = null;
  let unsubscribe = null;
  let firstSnapshot = true;
  let lastLiveAt = 0;
  const lastSoundSeen = new Map();
  let noticeTimer = null;
  let cooldownTimer = null;
  let gameInfoHideTimer = null;
  let activeGameInfoId = null;
  let gameInfoPinned = false;
  let overlayWindow = null;
  let overlayKind = null;
  let liveResultReady = false;
  let leaderboardMode = "wins";
  const PLAYER_AUDIO_KEY = "game-night-player-audio-v1";
  let playerAudio = { enabled: true, volume: 0.8 };

  const $ = id => document.getElementById(id);
  const els = Object.fromEntries([
    "playerApp","connectionDot","playerRoomCode","enableLiveSoundBtn","endedBanner","endedTitle","endedPodium",
    "liveGameName","liveGameLogo","liveGameMeta","liveModifier","playerTeams","liveScore","playerRules","myEmoji",
    "myName","myTeam","myDrinkMinus","myDrinkCount","myDrinkPlus","openSoundboardBtn","soundCooldownText",
    "playerLeaderboard","drinkLeaderboard","playerCurrentHistory","playerArchiveList","allPlayersGrid","playerJoinModal",
    "joinHelp","roomCodeField","roomCodeInput","joinRoomBtn","joinError","claimSection","claimNameList","claimEmojiGrid",
    "claimPlayerBtn","soundboardModal","closeSoundboardBtn","soundboardGrid","soundboardCooldown","liveAnimationModal",
    "liveAnimationHeading","liveAnimationResult","liveResultEmoji","liveResultTitle","liveResultSubtitle","closeLiveAnimationBtn",
    "chaosModal","chaosKicker","chaosTitle","chaosSubtitle","chaosEmoji","coinStage","arcadeCoin","closeChaosBtn","liveNotice",
    "selectorViewport","gameQueueList","queueProgress","gameInfoPopover","closeGameInfoBtn","gameInfoLogo",
    "gameInfoStatus","gameInfoTitle","gameInfoMeta","gameInfoScore","gameInfoRules",
    "openGameOverlayBtn","overlaySupportText","inlineSoundboardGrid","playerVolumeRange","playerVolumeValue","liveResultLogo",
    "leaderboardModes","leaderboardTitle"
  ].map(id => [id,$(id)]));

  const modeNames = {wheel:"Prize Wheel",case:"Case Opening",slot:"Slot Machine",coinDrop:"Coin Drop",shuffle:"Coin Drop"};

  function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
  function key(name){return window.ArcadeSession.key(name);}
  function publicState(){return roomData?.publicState || {};}
  function members(){return roomData?.members || {};}
  function me(){return memberId ? members()[memberId] || null : null;}
  function game(id){return window.GAMES.find(item=>item.id===id);}
  function emojiForName(name){const found=Object.values(members()).find(member=>key(member.name)===key(name));return found?.emoji||"🎮";}
  function drinksMap(){return Object.fromEntries(Object.values(members()).map(member=>[key(member.name),Number(member.drinks)||0]));}
  function emojiMap(){return Object.fromEntries(Object.values(members()).map(member=>[key(member.name),member.emoji||"🎮"]));}

  function showError(message){els.joinError.textContent=message;els.joinError.classList.remove("hidden");}
  function clearError(){els.joinError.classList.add("hidden");els.joinError.textContent="";}
  function showNotice(message,ms=3500){clearTimeout(noticeTimer);els.liveNotice.innerHTML=message;els.liveNotice.classList.add("show");noticeTimer=setTimeout(()=>els.liveNotice.classList.remove("show"),ms);}

  function setConnected(on){els.connectionDot.classList.toggle("online",Boolean(on));els.playerRoomCode.textContent=roomCode||"------";}

  function loadPlayerAudio(){
    try{const saved=JSON.parse(localStorage.getItem(PLAYER_AUDIO_KEY)||"null");if(saved&&typeof saved==="object"){playerAudio.enabled=saved.enabled!==false;const volume=Number(saved.volume);if(Number.isFinite(volume))playerAudio.volume=Math.max(0,Math.min(1,volume));}}catch(_){}
  }
  function savePlayerAudio(){try{localStorage.setItem(PLAYER_AUDIO_KEY,JSON.stringify(playerAudio));}catch(_){}}
  function applyPlayerAudio(){
    window.ArcadeAudio.setEnabled(playerAudio.enabled);window.ArcadeAudio.setVolume(playerAudio.volume);
    els.playerVolumeRange.value=String(playerAudio.volume);els.playerVolumeValue.textContent=`${Math.round(playerAudio.volume*100)}%`;
    els.enableLiveSoundBtn.innerHTML=`${playerAudio.enabled?"🔊":"🔇"} <span>${playerAudio.enabled?"SOUND":"MUTED"}</span>`;
    els.enableLiveSoundBtn.classList.toggle("muted",!playerAudio.enabled);
  }

  async function join(codeValue){
    clearError(); if(!window.ArcadeCloud.configured())return showError("Firebase is not configured yet. Ask the admin to finish FIREBASE_SETUP.md.");
    const cleaned=window.ArcadeCloud.cleanCode(codeValue);if(!cleaned)return showError("Enter the room code shown on the admin screen.");
    els.joinRoomBtn.disabled=true;els.joinRoomBtn.textContent="CONNECTING…";
    try{
      const joined=await window.ArcadeCloud.joinRoom(cleaned);roomCode=joined.roomCode;localStorage.setItem("game-night-player-room-v1",roomCode);roomData=joined.room;setConnected(true);els.roomCodeInput.value=roomCode;
      if(unsubscribe)unsubscribe();unsubscribe=await window.ArcadeCloud.subscribeRoom(roomCode,onRoom);const own=await window.ArcadeCloud.getOwnMember(roomCode);if(own)memberId=own;handleIdentity();
    }catch(error){console.error(error);showError(error.message==="ROOM_NOT_FOUND"?"That room code does not exist.":"Could not connect to the room. Check Firebase setup and your connection.");}
    finally{els.joinRoomBtn.disabled=false;els.joinRoomBtn.textContent="JOIN ROOM";}
  }

  function handleIdentity(){
    const uid=window.ArcadeCloud.uid();const mapped=roomData?.uidToMember?.[uid];if(mapped&&members()[mapped])memberId=mapped;
    if(memberId&&members()[memberId]){els.playerJoinModal.classList.add("hidden");els.playerApp.classList.remove("hidden");window.ArcadeAudio.unlock();renderAll();}
    else{memberId=null;els.playerApp.classList.add("hidden");els.playerJoinModal.classList.remove("hidden");els.roomCodeField.classList.add("hidden");els.joinRoomBtn.classList.add("hidden");els.joinHelp.textContent="Choose your name and one of the remaining unique emojis. This browser will remember you.";els.claimSection.classList.remove("hidden");renderClaimChoices();}
  }

  function renderClaimChoices(){
    const uid=window.ArcadeCloud.uid();const entries=Object.entries(members());
    if(!entries.length){els.claimNameList.innerHTML='<p class="empty-dashboard">The admin has not saved the player list yet.</p>';els.claimEmojiGrid.innerHTML="";els.claimPlayerBtn.disabled=true;return;}
    els.claimNameList.innerHTML=entries.map(([id,member])=>{const mine=member.uid===uid;const taken=Boolean(member.uid&&!mine);return `<button type="button" data-claim-name="${id}" class="claim-name ${selectedMemberId===id?"selected":""}" ${taken?"disabled":""}><span>${member.emoji||"○"}</span><strong>${escapeHtml(member.name)}</strong><small>${taken?"CLAIMED":mine?"YOUR PLAYER":"AVAILABLE"}</small></button>`}).join("");
    const claims=roomData?.emojiClaims||{};els.claimEmojiGrid.innerHTML=window.ArcadeSession.EMOJIS.map(emoji=>{const eKey=window.ArcadeCloud.emojiKey(emoji);const claim=claims[eKey];const taken=claim&&claim.uid!==uid;return `<button type="button" class="claim-emoji ${selectedEmoji===emoji?"selected":""}" data-claim-emoji="${emoji}" ${taken?"disabled":""}>${emoji}</button>`}).join("");
    els.claimPlayerBtn.disabled=!(selectedMemberId&&selectedEmoji);
  }

  async function claimPlayer(){
    if(!selectedMemberId||!selectedEmoji)return;els.claimPlayerBtn.disabled=true;els.claimPlayerBtn.textContent="CLAIMING…";
    try{await window.ArcadeCloud.claimMember(roomCode,selectedMemberId,selectedEmoji);memberId=selectedMemberId;window.ArcadeAudio.unlock();showNotice(`${selectedEmoji} Player claimed — welcome!`);}
    catch(error){console.error(error);showError(error.message==="EMOJI_TAKEN"?"That emoji was just taken. Choose another one.":error.message==="PLAYER_TAKEN"?"That player was just claimed on another device.":"Could not claim the player. Try again.");selectedEmoji=null;selectedMemberId=null;renderClaimChoices();}
    finally{els.claimPlayerBtn.textContent="CLAIM & ENTER";els.claimPlayerBtn.disabled=!(selectedMemberId&&selectedEmoji);}
  }


  function compactRoundScore(round){
    if(!round)return "";
    if(round.scoreless || !(round.scores||[]).length)return "—";
    const scores=round.scores||[];
    if(scores.length<=2)return scores.map(entry=>String(entry.score)).join("–");
    const direction=round.scoreDirection||"high";
    const numeric=scores.map(entry=>Number(entry.score)).filter(Number.isFinite);
    if(!numeric.length)return "✓";
    const winning=direction==="low"?Math.min(...numeric):Math.max(...numeric);
    return String(winning);
  }

  function compactRoundResult(round){
    if(!round)return "UPCOMING";
    if(round.scoreless)return "SCORELESS";
    const winners=round.winners||[];
    if(!winners.length)return "SCORED";
    return winners.length===1?`🏆 ${winners[0]}`:`🏆 ${winners.length} winners`;
  }

  function renderGameQueue(){
    const ps=publicState();
    const enabled=new Set(Array.isArray(ps.enabledGameIds)?ps.enabledGameIds:window.GAMES.map(item=>item.id));
    const rounds=ps.matchHistory||[];
    const roundIds=new Set(rounds.map(round=>round.gameId));
    const queueGames=window.GAMES.filter(item=>enabled.has(item.id)||roundIds.has(item.id));
    const activeRoundId=ps.activeRoundId;
    const currentGameId=ps.acceptedGameId;
    const ended=roomData?.meta?.status==="ended"||ps.nightEnded;
    let completed=0;

    els.gameQueueList.innerHTML=queueGames.map((item,index)=>{
      const gameRounds=rounds.filter(round=>round.gameId===item.id);
      const latest=gameRounds[gameRounds.length-1]||null;
      const isCurrent=item.id===currentGameId&&!ended;
      const isPlayed=Boolean(latest)&&(ended||latest.id!==activeRoundId);
      if(isPlayed)completed+=1;
      const score=latest?compactRoundScore(latest):"";
      const status=isCurrent?"NOW PLAYING":isPlayed?compactRoundResult(latest):"UPCOMING";
      return `<article class="game-queue-item ${isCurrent?"current":""} ${isPlayed?"played":""}" tabindex="0" data-game-info-id="${item.id}" aria-label="${escapeHtml(item.name)} — ${escapeHtml(status)}. Show game information" aria-haspopup="dialog">
        <span class="queue-number">${String(index+1).padStart(2,"0")}</span>
        <span class="queue-logo-wrap"><img src="${item.logo}" alt="${escapeHtml(item.name)} logo"></span>
        <span class="queue-game-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(status)}</small></span>
        <span class="queue-score ${score?"has-score":""}">${escapeHtml(score||"·")}</span>
      </article>`;
    }).join("")||'<p class="empty-dashboard">The admin has not enabled any games yet.</p>';

    els.queueProgress.textContent=`${completed} / ${queueGames.length}`;
  }

  function latestRoundForGame(gameId){
    const rounds=(publicState().matchHistory||[]).filter(round=>round.gameId===gameId);
    return rounds[rounds.length-1]||null;
  }

  function gameQueueStatus(item){
    const ps=publicState();
    const latest=latestRoundForGame(item.id);
    const ended=roomData?.meta?.status==="ended"||ps.nightEnded;
    const isCurrent=item.id===ps.acceptedGameId&&!ended;
    const isPlayed=Boolean(latest)&&(ended||latest.id!==ps.activeRoundId);
    return {
      latest,
      isCurrent,
      isPlayed,
      label:isCurrent?"NOW PLAYING":isPlayed?compactRoundResult(latest):"UPCOMING",
      compactScore:latest?compactRoundScore(latest):""
    };
  }

  function detailedRoundText(round){
    if(!round)return "";
    if(round.scoreless)return "This game was saved as scoreless.";
    const scores=(round.scores||[]).map(entry=>`${entry.label}: ${entry.score}`).join(" · ");
    const winners=(round.winners||[]).length?`Winner${round.winners.length===1?"":"s"}: ${round.winners.join(", ")}`:"Result saved";
    return scores?`${winners} · ${scores}`:winners;
  }

  function positionGameInfoPopover(anchor){
    if(!anchor||els.gameInfoPopover.classList.contains("hidden"))return;
    if(window.matchMedia("(max-width: 980px)").matches){
      els.gameInfoPopover.style.left="";
      els.gameInfoPopover.style.top="";
      els.gameInfoPopover.style.width="";
      return;
    }
    const rect=anchor.getBoundingClientRect();
    const pop=els.gameInfoPopover;
    const width=Math.min(420,window.innerWidth-24);
    pop.style.width=`${width}px`;
    const popHeight=Math.min(pop.scrollHeight,window.innerHeight-24);
    let left=rect.left-width-12;
    if(left<12)left=Math.min(window.innerWidth-width-12,rect.right+12);
    let top=rect.top+(rect.height/2)-(popHeight/2);
    top=Math.max(12,Math.min(window.innerHeight-popHeight-12,top));
    pop.style.left=`${Math.round(left)}px`;
    pop.style.top=`${Math.round(top)}px`;
  }

  function showGameInfo(gameId,anchor,{pin=false}={}){
    const item=game(gameId);if(!item)return;
    clearTimeout(gameInfoHideTimer);
    activeGameInfoId=gameId;
    gameInfoPinned=pin;
    const status=gameQueueStatus(item);
    els.gameInfoLogo.src=item.logo;
    els.gameInfoLogo.alt=`${item.name} logo`;
    els.gameInfoStatus.textContent=status.label;
    els.gameInfoStatus.className=`game-info-status ${status.isCurrent?"current":status.isPlayed?"played":"upcoming"}`;
    els.gameInfoTitle.textContent=item.name;
    els.gameInfoMeta.textContent=[item.players,item.price,item.note].filter(Boolean).join(" · ")||"Game night title";

    const result=status.latest&&(!status.isCurrent||!status.latest.scoreless||(status.latest.scores||[]).length)
      ? detailedRoundText(status.latest)
      : "";
    if(result){
      els.gameInfoScore.innerHTML=`<span>${status.isPlayed?"SAVED RESULT":"CURRENT RESULT"}</span><strong>${escapeHtml(result)}</strong>`;
      els.gameInfoScore.classList.remove("hidden");
    }else{
      els.gameInfoScore.classList.add("hidden");
      els.gameInfoScore.innerHTML="";
    }

    const types=window.ARCADE_CONFIG.ruleTypes;
    els.gameInfoRules.innerHTML=["red","yellow","green"].map(type=>{
      const rules=item.rules?.[type]||[];
      const info=types[type];
      return `<section class="game-info-rule-group ${type}">
        <div class="game-info-rule-title"><span>${info.icon} ${escapeHtml(info.label)}</span><small>${rules.length}</small></div>
        ${rules.length?`<ul>${rules.map(rule=>`<li>${escapeHtml(window.ArcadeSession.simpleRule(rule))}</li>`).join("")}</ul>`:`<p>No ${escapeHtml(info.label.toLowerCase())} rules.</p>`}
      </section>`;
    }).join("");

    els.gameInfoPopover.classList.remove("hidden");
    document.querySelectorAll(".game-queue-item.info-active").forEach(row=>row.classList.remove("info-active"));
    anchor?.classList.add("info-active");
    requestAnimationFrame(()=>positionGameInfoPopover(anchor));
  }

  function hideGameInfo({force=false}={}){
    if(gameInfoPinned&&!force)return;
    clearTimeout(gameInfoHideTimer);
    els.gameInfoPopover.classList.add("hidden");
    document.querySelectorAll(".game-queue-item.info-active").forEach(row=>row.classList.remove("info-active"));
    activeGameInfoId=null;
    gameInfoPinned=false;
  }

  function scheduleGameInfoHide(){
    clearTimeout(gameInfoHideTimer);
    gameInfoHideTimer=setTimeout(()=>hideGameInfo(),450);
  }

  function renderCurrentGame(){
    const ps=publicState();
    els.liveModifier.innerHTML=`<span>HOUSE MODIFIER</span><strong>${escapeHtml(ps.currentModifier || "NONE ACTIVE")}</strong>`;
    els.liveModifier.classList.toggle("active",Boolean(ps.currentModifier));
    const current=game(ps.acceptedGameId);if(!current){els.liveGameName.textContent="Waiting for the first game…";els.liveGameLogo.classList.add("hidden");els.liveGameMeta.textContent="The admin controls the arcade. This page updates automatically.";els.playerRules.innerHTML="";els.playerTeams.innerHTML="";els.liveScore.innerHTML="";return;}
    els.liveGameName.textContent=current.name;els.liveGameLogo.src=current.logo;els.liveGameLogo.alt=`${current.name} logo`;els.liveGameLogo.classList.remove("hidden");els.liveGameMeta.textContent=[current.players,current.price,current.note].filter(Boolean).join(" · ");
    const teamResult=ps.teamResult;if(teamResult?.gameId===current.id&&teamResult.teams?.length){els.playerTeams.innerHTML=teamResult.teams.map((team,index)=>`<article class="team-card team-style-${index%8}"><div class="team-card-heading"><span class="team-number">${String(index+1).padStart(2,"0")}</span><div><small>TEAM</small><h4>${escapeHtml(team.name)}</h4></div><strong>${team.players.length}</strong></div><ol class="team-player-list">${team.players.map(name=>`<li class="${me()?.name===name?"is-me":""}"><span class="player-emoji-mini">${emojiForName(name)}</span>${escapeHtml(name)}</li>`).join("")}</ol></article>`).join("");}else els.playerTeams.innerHTML="";
    const round=(ps.matchHistory||[]).find(r=>r.id===ps.activeRoundId);if(round&&!round.scoreless){els.liveScore.innerHTML=`<span class="eyebrow">CURRENT RESULT</span><strong>${(round.winners||[]).map(name=>`${emojiForName(name)} ${escapeHtml(name)}`).join(" + ")} ${round.winners?.length===1?"LEADS / WINS":"WIN"}</strong><small>${(round.scores||[]).map(entry=>`${escapeHtml(entry.label)} ${entry.score}`).join(" · ")}</small>`;}else els.liveScore.innerHTML='<span class="eyebrow">MATCH RESULT</span><strong>Scoreless / not entered yet</strong>';
    const types=window.ARCADE_CONFIG.ruleTypes;els.playerRules.innerHTML=["red","yellow","green"].map(type=>`<section class="rule-group ${type}"><div class="rule-group-title"><span>${types[type].icon} ${types[type].label}</span></div><ul class="rule-list">${(current.rules?.[type]||[]).map(rule=>`<li>${escapeHtml(window.ArcadeSession.simpleRule(rule))}</li>`).join("")}</ul></section>`).join("");
  }

  function renderMyCard(){const member=me();if(!member)return;els.myEmoji.textContent=member.emoji||"🎮";els.myName.textContent=member.name;els.myDrinkCount.textContent=Math.max(0,Number(member.drinks)||0);const team=publicState().teamResult?.teams?.find(team=>team.players?.includes(member.name));els.myTeam.textContent=team?team.name:"No team assigned yet";const ended=roomData?.meta?.status==="ended"||publicState().nightEnded;els.myDrinkMinus.disabled=ended;els.myDrinkPlus.disabled=ended;}


  /* This CSS is injected into the separate PiP/pop-out document, not the player page.
     Use the overlay document's OWN width (cqw) so resizing the floating box scales
     typography, padding and columns together. Height stays scrollable if needed. */
  const overlayCss=`
    :root { color-scheme: dark; --red:#ffadb3; --yellow:#f6d991; --green:#a6e9c1; --cyan:#b0e4eb; --text:#f6f8fb; --muted:#c2cedd; }
    * { box-sizing: border-box; }
    html, body { margin:0; min-height:100%; background:transparent !important; color:var(--text); font-family: system-ui,-apple-system,'Segoe UI',Arial,sans-serif; -webkit-font-smoothing:antialiased; }
    body { padding:clamp(4px,1.5vw,10px); overflow:auto; }
    #overlayRoot { width:100%; container-type:inline-size; }
    .hud {
      --hud-body:clamp(13px,3.45cqw,19px);
      --hud-small:clamp(11px,2.9cqw,15px);
      --hud-title:clamp(17px,4.4cqw,25px);
      --hud-pad:clamp(9px,2.1cqw,15px);
      --hud-gap:clamp(6px,1.7cqw,11px);
      display:grid; gap:var(--hud-gap); min-width:0; font-size:var(--hud-body); line-height:1.43;
      text-shadow:0 1px 2px rgba(0,0,0,.9);
    }
    .hud-top { display:flex; align-items:flex-start; gap:8px; justify-content:space-between; padding:var(--hud-pad); border:1px solid rgba(179,199,212,.32); border-left:3px solid var(--cyan); border-radius:8px; background:rgba(9,14,20,.48); }
    .hud-top > div { min-width:0; flex:1; }
    .hud-top strong { display:block; font-size:var(--hud-title); font-weight:750; letter-spacing:-.03em; line-height:1.15; overflow-wrap:anywhere; }
    .hud-top small { display:block; margin-top:5px; color:var(--muted); font-size:var(--hud-small); letter-spacing:.02em; }
    .hud-close { display:grid; place-items:center; flex:none; width:31px; height:31px; border:1px solid rgba(201,218,228,.42); border-radius:7px; background:rgba(15,22,30,.72); color:#f5f8fa; font:500 22px/1 system-ui,sans-serif; cursor:pointer; }
    .hud-close:hover,.hud-close:focus-visible { border-color:var(--cyan); outline-color:var(--cyan); }
    .hud-teams { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--hud-gap); }
    .hud-team { min-width:0; padding:var(--hud-pad); border:1px solid rgba(178,203,220,.24); border-radius:8px; background:rgba(9,14,20,.38); }
    .hud-team.mine { border-color:rgba(127,216,227,.7); background:rgba(17,43,49,.48); }
    .hud-team h3 { margin:0 0 8px; font-size:var(--hud-body); line-height:1.2; font-weight:730; letter-spacing:-.015em; overflow-wrap:anywhere; color:#eef6f8; }
    .hud-player { display:inline-block; max-width:100%; margin:1px 5px 5px 0; padding:3px 6px; border:1px solid rgba(203,220,226,.13); border-radius:5px; background:rgba(0,0,0,.29); font-size:var(--hud-small); line-height:1.4; overflow-wrap:anywhere; }
    .hud-player.me { border-color:rgba(132,221,229,.75); }
    .hud-rules { display:grid; gap:var(--hud-gap); }
    .hud-rule { display:grid; grid-template-columns:clamp(60px,19cqw,108px) minmax(0,1fr); gap:var(--hud-gap); align-items:start; padding:var(--hud-pad); border:1px solid rgba(178,203,220,.22); border-left:3px solid currentColor; border-radius:8px; background:rgba(9,14,20,.44); }
    .hud-rule.red { color:var(--red); }
    .hud-rule.yellow { color:var(--yellow); }
    .hud-rule.green { color:var(--green); }
    .hud-rule h3 { margin:2px 0 0; font-size:var(--hud-small); font-weight:760; line-height:1.25; letter-spacing:.035em; }
    .hud-rule ul { min-width:0; margin:0; padding:0 0 0 1.05em; color:var(--text); }
    .hud-rule li { margin:0 0 6px; font-size:var(--hud-body); font-weight:480; line-height:1.45; overflow-wrap:anywhere; }
    .hud-rule li:last-child { margin:0; }
    .hud-empty { padding:14px; border-radius:8px; background:rgba(9,14,20,.44); color:var(--muted); font-size:var(--hud-body); text-align:center; }
    @container (max-width:370px) {
      .hud-teams { grid-template-columns:1fr; }
      .hud-rule { grid-template-columns:1fr; gap:6px; }
      .hud-rule h3 { font-size:var(--hud-body); }
    }
    @media (max-height:370px) { .hud-top small { display:none; } .hud-rule li { margin-bottom:3px; } }
  `;
  function overlayIsOpen(){return Boolean(overlayWindow&&!overlayWindow.closed&&overlayWindow.document);}

  function renderOverlay(){
    if(!overlayIsOpen())return;
    const doc=overlayWindow.document;const root=doc.getElementById("overlayRoot");if(!root)return;
    const ps=publicState();const current=game(ps.acceptedGameId);const member=me();
    if(!member){root.innerHTML='<div class="hud-empty">Player identity unavailable.</div>';return;}
    const allTeams=ps.teamResult?.gameId===current?.id?(ps.teamResult?.teams||[]):[];const types=window.ARCADE_CONFIG.ruleTypes;
    const rules=current?["red","yellow","green"].map(type=>{const list=current.rules?.[type]||[];if(!list.length)return "";return `<section class="hud-rule ${type}"><h3>${escapeHtml(types[type].label)}</h3><ul>${list.map(rule=>`<li>${escapeHtml(window.ArcadeSession.simpleRule(rule))}</li>`).join("")}</ul></section>`;}).join(""):"";
    const teamHtml=allTeams.map(team=>`<section class="hud-team ${team.players?.includes(member.name)?"mine":""}"><h3>${escapeHtml(team.name)}</h3><div>${(team.players||[]).map(name=>`<span class="hud-player ${name===member.name?"me":""}">${emojiForName(name)} ${escapeHtml(name)}</span>`).join("")}</div></section>`).join("");
    root.innerHTML=`<div class="hud"><header class="hud-top"><div><strong>${escapeHtml(current?.name||"Waiting for game…")}</strong><small>TEAMS + DRINKING RULES · LIVE</small></div><button class="hud-close" data-overlay-close type="button">×</button></header>${teamHtml?`<div class="hud-teams">${teamHtml}</div>`:""}${rules?`<div class="hud-rules">${rules}</div>`:'<div class="hud-empty">Rules appear when a game is selected.</div>'}</div>`;
    root.querySelector("[data-overlay-close]")?.addEventListener("click",closeGameOverlay);
  }

  function prepareOverlayDocument(win){const doc=win.document;doc.title="Game Night Rules";doc.head.innerHTML=`<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${overlayCss}</style>`;doc.body.innerHTML='<main id="overlayRoot"><div class="hud-empty">Loading…</div></main>';win.addEventListener("pagehide",()=>{if(overlayWindow===win){overlayWindow=null;overlayKind=null;updateOverlayButton();}},{once:true});win.addEventListener("beforeunload",()=>{if(overlayWindow===win){overlayWindow=null;overlayKind=null;updateOverlayButton();}},{once:true});}
  function updateOverlayButton(){const open=overlayIsOpen();els.openGameOverlayBtn.textContent=open?"✓ OVERLAY OPEN":"▣ GAME OVERLAY";els.openGameOverlayBtn.classList.toggle("active",open);if(open)els.overlaySupportText.textContent=overlayKind==="pip"?"Transparent teams + rules overlay is running.":"Compact teams + rules window is open.";else if("documentPictureInPicture" in window&&window.isSecureContext)els.overlaySupportText.textContent="Always-on-top teams + rules overlay.";else els.overlaySupportText.textContent="Opens teams + rules in a compact pop-out.";}
  async function openGameOverlay(){window.ArcadeAudio.unlock();if(overlayIsOpen()){try{overlayWindow.focus();}catch(_){}renderOverlay();return;}if("documentPictureInPicture" in window&&window.isSecureContext){try{const pip=await window.documentPictureInPicture.requestWindow({width:440,height:560});overlayWindow=pip;overlayKind="pip";prepareOverlayDocument(pip);renderOverlay();updateOverlayButton();return;}catch(error){console.warn("Document Picture-in-Picture unavailable",error);}}const popup=window.open("","gameNightOverlay","popup=yes,width=440,height=560,resizable=yes,scrollbars=yes");if(!popup){showNotice("Pop-up blocked. Allow pop-ups for the overlay.",5000);return;}overlayWindow=popup;overlayKind="popup";prepareOverlayDocument(popup);renderOverlay();updateOverlayButton();}
  function closeGameOverlay(){if(overlayIsOpen())try{overlayWindow.close();}catch(_){}overlayWindow=null;overlayKind=null;updateOverlayButton();}

  function renderRankings(){
    const ps=publicState();const players=ps.players||Object.values(members()).map(m=>m.name);const base=window.ArcadeSession.leaderboard(players,ps.matchHistory||[],drinksMap());
    let rows=[...base], title="Most wins", badge=row=>`${row.wins}W`, detail=row=>`${row.scoredGames} scored · ${row.games} played`;
    if(leaderboardMode==="drinks"){rows.sort((a,b)=>b.drinks-a.drinks||b.wins-a.wins||a.name.localeCompare(b.name));title="Most drinks";badge=row=>`${row.drinks}`;detail=row=>`${row.wins} wins · ${row.games} games`;}
    else if(leaderboardMode==="games"){rows.sort((a,b)=>b.games-a.games||b.wins-a.wins||a.name.localeCompare(b.name));title="Games played";badge=row=>`${row.games}`;detail=row=>`${row.wins} wins · ${row.scoredGames} scored`;}
    els.leaderboardTitle.textContent=title;
    els.leaderboardModes.querySelectorAll("[data-leaderboard-mode]").forEach(button=>button.classList.toggle("active",button.dataset.leaderboardMode===leaderboardMode));
    els.playerLeaderboard.innerHTML=rows.map((row,index)=>`<div class="leaderboard-row ${index===0?"leader":""}"><span class="leader-rank">${index+1}</span><span class="dashboard-player-emoji">${emojiForName(row.name)}</span><span class="leader-name"><strong>${escapeHtml(row.name)}</strong><small>${detail(row)}</small></span><strong class="wins-badge">${badge(row)}</strong></div>`).join("")||'<p class="empty-dashboard">No players yet.</p>';
    els.drinkLeaderboard.innerHTML="";
  }

  function renderHistory(){
    const ps=publicState();els.playerCurrentHistory.innerHTML=[...(ps.matchHistory||[])].reverse().map(round=>{const g=game(round.gameId);return`<article class="match-log-row ${round.scoreless?"scoreless":""}"><img src="${g?.logo||""}" alt=""><span><strong>${escapeHtml(g?.name||round.gameId)}</strong><small>${round.scoreless?"SCORELESS":`WIN: ${(round.winners||[]).map(name=>`${emojiForName(name)} ${escapeHtml(name)}`).join(" + ")}`}</small><em>${(round.scores||[]).length?round.scores.map(entry=>`${escapeHtml(entry.label)} ${entry.score}`).join(" · "):"No score entered"}</em></span></article>`}).join("")||'<p class="empty-dashboard">No games yet tonight.</p>';
    const nights=Object.values(roomData?.history||{}).sort((a,b)=>(b.endedAt||0)-(a.endedAt||0));els.playerArchiveList.innerHTML=nights.map(night=>{const matches=Object.values(night.matches||{});const top=(night.leaderboard||[])[0];return`<details class="archive-night"><summary><span><strong>${escapeHtml(night.title||"Game Night")}</strong><small>${new Date(night.endedAt||Date.now()).toLocaleDateString()} · ${matches.length} games${top?` · 🏆 ${escapeHtml(top.name)}`:""}</small></span></summary><div class="archive-match-list">${matches.map(round=>{const g=game(round.gameId);return`<div class="archive-match"><span><strong>${escapeHtml(g?.name||round.gameId)}</strong><small>${round.scoreless?"Scoreless":`Winner: ${(round.winners||[]).join(", ")}`}</small></span></div>`}).join("")}</div></details>`}).join("")||'<p class="empty-dashboard">No previous nights saved yet.</p>';
  }

  function renderPlayers(){els.allPlayersGrid.innerHTML=Object.values(members()).map(member=>`<article class="all-player-card ${memberId&&me()?.name===member.name?"is-me":""}"><span>${member.emoji||"○"}</span><strong>${escapeHtml(member.name)}</strong><small>${member.uid?"CONNECTED":"NOT CLAIMED"}</small><em>${Number(member.drinks)||0} drinks</em></article>`).join("");}

  function renderEnded(){const ended=roomData?.meta?.status==="ended"||publicState().nightEnded;els.endedBanner.classList.toggle("hidden",!ended);if(!ended)return;const players=publicState().players||[];const board=window.ArcadeSession.leaderboard(players,publicState().matchHistory||[],drinksMap());els.endedTitle.textContent=board[0]?.wins?`${emojiForName(board[0].name)} ${board[0].name} wins the night!`:"Game night archived";els.endedPodium.innerHTML=board.slice(0,3).map((row,index)=>`<div><span>${["🥇","🥈","🥉"][index]}</span><strong>${emojiForName(row.name)} ${escapeHtml(row.name)}</strong><small>${row.wins} wins</small></div>`).join("");}

  function renderSoundboard(){
    const uid=window.ArcadeCloud.uid();const last=Number(roomData?.soundEvents?.[uid]?.at)||0;const remain=Math.max(0,(window.ARCADE_SOUND_COOLDOWN_MS||30000)-(Date.now()-last));const ended=roomData?.meta?.status==="ended"||publicState().nightEnded;const ready=!ended&&remain<=0;
    const sounds=window.ARCADE_SOUNDBOARD||[];const make=sound=>`<button type="button" data-sound-id="${sound.id}" ${ready?"":"disabled"}><span>${sound.emoji||"🔊"}</span><strong>${escapeHtml(sound.name)}</strong></button>`;
    els.soundboardGrid.innerHTML=sounds.map(make).join("");els.inlineSoundboardGrid.innerHTML=sounds.slice(0,8).map(make).join("");
    const text=ended?"Night ended":ready?"Ready":`Wait ${Math.ceil(remain/1000)}s`;els.soundboardCooldown.textContent=text;els.soundCooldownText.textContent=text;els.openSoundboardBtn.disabled=ended;
  }
  function renderAll(){if(!memberId||!me())return;renderCurrentGame();renderMyCard();renderGameQueue();renderRankings();renderHistory();renderPlayers();renderEnded();renderSoundboard();renderOverlay();updateOverlayButton();}

  function setLiveMode(mode){const normalized=mode==="shuffle"?"coinDrop":mode;document.body.dataset.mode=normalized;document.querySelectorAll("#liveAnimationModal .mode-layer").forEach(layer=>layer.classList.remove("active"));$(`${normalized}Mode`)?.classList.add("active");els.selectorViewport.className=`selector-viewport mode-${normalized} spectator-selector`;}
  function showLiveResult({emoji="",logo="",title,subtitle}){liveResultReady=true;els.liveResultEmoji.textContent=emoji;els.liveResultEmoji.classList.toggle("hidden",!emoji);if(logo){els.liveResultLogo.src=logo;els.liveResultLogo.alt=`${title} logo`;els.liveResultLogo.classList.remove("hidden");}else els.liveResultLogo.classList.add("hidden");els.liveResultTitle.textContent=title;els.liveResultSubtitle.textContent=subtitle||"";els.liveAnimationResult.classList.remove("hidden");window.ArcadeAudio.play("winner",{volume:.7});}
  function runMachineEvent(event){let pool=[];let winner=null;let title="The machine is rolling…";if(event.type==="gameRoll"){pool=(event.candidateIds||[]).map(game).filter(Boolean);winner=game(event.winnerId);title=`${modeNames[event.mode]||"Arcade"} is choosing the game…`;}else if(event.type==="playerRoll"){pool=(event.candidates||[]).map(item=>({...item}));winner=pool.find(item=>item.name===event.winnerName)||{id:"winner",name:event.winnerName,emoji:event.winnerEmoji,accent:"#ffd84c"};title=`${modeNames[event.mode]||"Arcade"} is choosing a player…`;}if(!pool.length||!winner)return;liveResultReady=false;els.liveAnimationHeading.textContent=title;els.liveAnimationResult.classList.add("hidden");els.liveAnimationModal.classList.remove("hidden");const liveMode=event.mode==="shuffle"?"coinDrop":(event.mode||"wheel");setLiveMode(liveMode);window.ArcadeModes.setPool(pool,"logo");const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;window.ArcadeModes.spin(liveMode,pool,"logo",winner,Boolean(reduce),()=>showLiveResult({emoji:event.type==="playerRoll"?winner.emoji:"",logo:event.type==="gameRoll"?winner.logo:"",title:winner.name,subtitle:event.type==="playerRoll"?"PLAYER SELECTED":"GAME SELECTED"}));}


  function animateCoin(result){els.chaosKicker.textContent="LIVE COIN FLIP";els.chaosTitle.textContent="FLIPPING…";els.chaosSubtitle.textContent="";els.chaosEmoji.classList.add("hidden");els.coinStage.classList.remove("hidden");els.chaosModal.classList.remove("hidden");els.arcadeCoin.className="arcade-coin";void els.arcadeCoin.offsetWidth;els.arcadeCoin.classList.add(result==="HEADS"?"flip-heads":"flip-tails");const finish=()=>{els.chaosTitle.textContent=result;els.chaosSubtitle.textContent=result==="HEADS"?"HEADS WINS":"TAILS WINS";window.ArcadeAudio.play("winner",{volume:.55});};if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)setTimeout(finish,420);else els.arcadeCoin.addEventListener("animationend",finish,{once:true});}

  function processLiveEvent(event){if(!event)return;const at=Number(event.at)||0;if(firstSnapshot){lastLiveAt=at;return;}if(at<=lastLiveAt)return;lastLiveAt=at;if(event.type==="gameRoll"){showNotice(`🎡 ${modeNames[event.mode]||"Arcade"} is rolling a game!`,5000);runMachineEvent(event);}else if(event.type==="playerRoll"){showNotice(`🎯 ${modeNames[event.mode]||"Arcade"} is choosing a player!`,5000);runMachineEvent(event);}else if(event.type==="coinFlip"){showNotice("🪙 Live coin flip!",3000);animateCoin(event.result);}else if(event.type==="modifier"){showNotice(`⚡ ${escapeHtml(event.text)}`,6000);}else if(event.type==="modifierCleared"){showNotice("⚡ House modifier cleared.",3500);}else if(event.type==="gameAccepted"){const g=game(event.gameId);showNotice(`🎮 ${g?.name||"Game"} selected!`,4000);}else if(event.type==="score"){showNotice(event.scoreless?"📝 Game saved as scoreless.":`🏆 ${(event.winners||[]).join(" + ")} wins!`,5000);}else if(event.type==="nightEnded"){showNotice("🏁 Game night finished — final results are in!",7000);}}

  function processSounds(soundEvents={}){const current=new Map(Object.entries(soundEvents).map(([uid,event])=>[uid,Number(event?.at)||0]));if(firstSnapshot){current.forEach((at,uid)=>lastSoundSeen.set(uid,at));return;}Object.entries(soundEvents).forEach(([uid,event])=>{const at=Number(event?.at)||0;if(at<=(lastSoundSeen.get(uid)||0))return;lastSoundSeen.set(uid,at);const sound=(window.ARCADE_SOUNDBOARD||[]).find(item=>item.id===event.soundId);const sender=members()[event.memberId];if(sound){window.ArcadeAudio.playFile(sound.file,{volume:.9}).then(ok=>{if(!ok)showNotice(`🔇 Tap “Enable sounds” so live clips can play.`,5000)});showNotice(`${sender?.emoji||"🔊"} ${escapeHtml(sender?.name||"Player")} played ${sound.name}`,3500);}});}

  function onRoom(room){if(!room){setConnected(false);showError("This room no longer exists.");return;}roomData=room;setConnected(true);const uid=window.ArcadeCloud.uid();const mapped=room.uidToMember?.[uid];if(mapped&&members()[mapped])memberId=mapped;else if(memberId&&!members()[memberId])memberId=null;processSounds(room.soundEvents||{});processLiveEvent(room.liveEvent);handleIdentity();firstSnapshot=false;}

  async function changeDrink(delta){if(!memberId||roomData?.meta?.status==="ended"||publicState().nightEnded)return;try{await window.ArcadeCloud.changeOwnDrinks(roomCode,memberId,delta);}catch(error){console.error(error);showNotice("Could not update the counter.");}}
  async function playSound(soundId){if(!memberId)return;window.ArcadeAudio.unlock();try{await window.ArcadeCloud.sendSound(roomCode,memberId,soundId);els.soundboardModal.classList.add("hidden");}catch(error){console.error(error);showNotice("Sound is still on cooldown — wait a moment.",3500);}}

  function bind(){
    document.addEventListener("pointerdown",()=>window.ArcadeAudio.unlock(),{once:true});
    els.joinRoomBtn.addEventListener("click",()=>join(els.roomCodeInput.value));els.roomCodeInput.addEventListener("keydown",e=>{if(e.key==="Enter")join(els.roomCodeInput.value)});
    els.claimNameList.addEventListener("click",e=>{const button=e.target.closest("[data-claim-name]");if(!button||button.disabled)return;selectedMemberId=button.dataset.claimName;renderClaimChoices()});els.claimEmojiGrid.addEventListener("click",e=>{const button=e.target.closest("[data-claim-emoji]");if(!button||button.disabled)return;selectedEmoji=button.dataset.claimEmoji;renderClaimChoices()});els.claimPlayerBtn.addEventListener("click",claimPlayer);
    els.myDrinkMinus.addEventListener("click",()=>changeDrink(-1));els.myDrinkPlus.addEventListener("click",()=>changeDrink(1));
    els.openGameOverlayBtn.addEventListener("click",openGameOverlay);
    els.enableLiveSoundBtn.addEventListener("click",()=>{window.ArcadeAudio.unlock();playerAudio.enabled=!playerAudio.enabled;savePlayerAudio();applyPlayerAudio();if(playerAudio.enabled)window.ArcadeAudio.play("button",{volume:.35});});
    els.playerVolumeRange.addEventListener("input",event=>{window.ArcadeAudio.unlock();playerAudio.volume=Math.max(0,Math.min(1,Number(event.target.value)||0));if(playerAudio.volume>0)playerAudio.enabled=true;savePlayerAudio();applyPlayerAudio();});
    els.openSoundboardBtn.addEventListener("click",()=>{renderSoundboard();els.soundboardModal.classList.remove("hidden")});els.closeSoundboardBtn.addEventListener("click",()=>els.soundboardModal.classList.add("hidden"));
    const soundClick=e=>{const button=e.target.closest("[data-sound-id]");if(button&&!button.disabled)playSound(button.dataset.soundId)};els.soundboardGrid.addEventListener("click",soundClick);els.inlineSoundboardGrid.addEventListener("click",soundClick);
    document.querySelectorAll(".player-tab").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".player-tab").forEach(b=>b.classList.toggle("active",b===button));document.querySelectorAll(".player-tab-panel").forEach(panel=>panel.classList.remove("active"));$(`tab${button.dataset.tab[0].toUpperCase()}${button.dataset.tab.slice(1)}`).classList.add("active")}));
    els.leaderboardModes.addEventListener("click",event=>{const button=event.target.closest("[data-leaderboard-mode]");if(!button)return;leaderboardMode=button.dataset.leaderboardMode;renderRankings();});

    // Game queue info: a real mouse hover always opens the card.
    // Do not depend on CSS `(hover: hover)` because hybrid laptops/tablets can
    // report that incorrectly even while a mouse is being used. Touch still
    // uses the click handler below to pin the card open.
    els.gameQueueList.addEventListener("mouseover",event=>{
      const row=event.target.closest("[data-game-info-id]");
      if(!row||row.contains(event.relatedTarget))return;
      showGameInfo(row.dataset.gameInfoId,row,{pin:false});
    });
    els.gameQueueList.addEventListener("mouseout",event=>{
      const row=event.target.closest("[data-game-info-id]");
      if(!row||row.contains(event.relatedTarget))return;
      scheduleGameInfoHide();
    });
    els.gameQueueList.addEventListener("focusin",event=>{
      const row=event.target.closest("[data-game-info-id]");
      if(row)showGameInfo(row.dataset.gameInfoId,row,{pin:false});
    });
    els.gameQueueList.addEventListener("focusout",event=>{
      const row=event.target.closest("[data-game-info-id]");
      if(row&&!els.gameInfoPopover.contains(event.relatedTarget))scheduleGameInfoHide();
    });
    els.gameQueueList.addEventListener("click",event=>{
      const row=event.target.closest("[data-game-info-id]");
      if(!row)return;
      const same=activeGameInfoId===row.dataset.gameInfoId&&!els.gameInfoPopover.classList.contains("hidden");
      if(same&&gameInfoPinned){hideGameInfo({force:true});return;}
      showGameInfo(row.dataset.gameInfoId,row,{pin:true});
    });
    els.gameInfoPopover.addEventListener("pointerenter",()=>clearTimeout(gameInfoHideTimer));
    els.gameInfoPopover.addEventListener("pointerleave",()=>{if(!gameInfoPinned)scheduleGameInfoHide();});
    els.closeGameInfoBtn.addEventListener("click",()=>hideGameInfo({force:true}));
    document.addEventListener("pointerdown",event=>{
      if(els.gameInfoPopover.classList.contains("hidden"))return;
      if(els.gameInfoPopover.contains(event.target)||event.target.closest("[data-game-info-id]"))return;
      hideGameInfo({force:true});
    });

    const dismissLiveAnimation=()=>{if(!liveResultReady)return;els.liveAnimationModal.classList.add("hidden");liveResultReady=false;};
    els.closeLiveAnimationBtn.addEventListener("click",dismissLiveAnimation);els.liveAnimationModal.addEventListener("pointerdown",dismissLiveAnimation);
    els.closeChaosBtn.addEventListener("click",()=>{els.chaosModal.classList.add("hidden");els.arcadeCoin.className="arcade-coin"});
    window.addEventListener("resize",()=>{const row=activeGameInfoId?els.gameQueueList.querySelector(`[data-game-info-id="${activeGameInfoId}"]`):null;if(row)positionGameInfoPopover(row);});
    cooldownTimer=setInterval(()=>{if(memberId&&roomData)renderSoundboard()},500);
  }

  async function init(){loadPlayerAudio();window.ArcadeAudio.setup({soundEnabled:playerAudio.enabled,volume:playerAudio.volume});bind();applyPlayerAudio();updateOverlayButton();const query=new URLSearchParams(location.search).get("room");const saved=localStorage.getItem("game-night-player-room-v1");const initial=window.ArcadeCloud.cleanCode(query||saved||"");els.roomCodeInput.value=initial;if(initial)join(initial);}
  init();
})();
