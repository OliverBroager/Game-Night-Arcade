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
    "openGameOverlayBtn","overlaySupportText"
  ].map(id => [id,$(id)]));

  const modeNames = {wheel:"Prize Wheel",case:"Case Opening",slot:"Slot Machine",shuffle:"Arcade Shuffle"};

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
        ${rules.length?`<ul>${rules.map(rule=>`<li>${escapeHtml(rule)}</li>`).join("")}</ul>`:`<p>No ${escapeHtml(info.label.toLowerCase())} rules.</p>`}
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
    const ps=publicState();const current=game(ps.acceptedGameId);if(!current){els.liveGameName.textContent="Waiting for the first game…";els.liveGameLogo.classList.add("hidden");els.liveGameMeta.textContent="The admin controls the arcade. This page updates automatically.";els.playerRules.innerHTML="";els.playerTeams.innerHTML="";els.liveScore.innerHTML="";return;}
    els.liveGameName.textContent=current.name;els.liveGameLogo.src=current.logo;els.liveGameLogo.alt=`${current.name} logo`;els.liveGameLogo.classList.remove("hidden");els.liveGameMeta.textContent=[current.players,current.price,current.note].filter(Boolean).join(" · ");
    const teamResult=ps.teamResult;if(teamResult?.gameId===current.id&&teamResult.teams?.length){els.playerTeams.innerHTML=teamResult.teams.map((team,index)=>`<article class="team-card team-style-${index%8}"><div class="team-card-heading"><span class="team-number">${String(index+1).padStart(2,"0")}</span><div><small>TEAM</small><h4>${escapeHtml(team.name)}</h4></div><strong>${team.players.length}</strong></div><ol class="team-player-list">${team.players.map(name=>`<li class="${me()?.name===name?"is-me":""}"><span class="player-emoji-mini">${emojiForName(name)}</span>${escapeHtml(name)}</li>`).join("")}</ol></article>`).join("");}else els.playerTeams.innerHTML="";
    const round=(ps.matchHistory||[]).find(r=>r.id===ps.activeRoundId);if(round&&!round.scoreless){els.liveScore.innerHTML=`<span class="eyebrow">CURRENT RESULT</span><strong>${(round.winners||[]).map(name=>`${emojiForName(name)} ${escapeHtml(name)}`).join(" + ")} ${round.winners?.length===1?"LEADS / WINS":"WIN"}</strong><small>${(round.scores||[]).map(entry=>`${escapeHtml(entry.label)} ${entry.score}`).join(" · ")}</small>`;}else els.liveScore.innerHTML='<span class="eyebrow">MATCH RESULT</span><strong>Scoreless / not entered yet</strong>';
    const types=window.ARCADE_CONFIG.ruleTypes;els.playerRules.innerHTML=["red","yellow","green"].map(type=>`<section class="rule-group ${type}"><div class="rule-group-title"><span>${types[type].icon} ${types[type].label}</span></div><ul class="rule-list">${(current.rules?.[type]||[]).map(rule=>`<li>${escapeHtml(rule)}</li>`).join("")}</ul></section>`).join("");
    if(ps.currentModifier){els.liveModifier.textContent=`⚡ ${ps.currentModifier}`;els.liveModifier.classList.remove("hidden")}else els.liveModifier.classList.add("hidden");
  }

  function renderMyCard(){const member=me();if(!member)return;els.myEmoji.textContent=member.emoji||"🎮";els.myName.textContent=member.name;els.myDrinkCount.textContent=Math.max(0,Number(member.drinks)||0);const team=publicState().teamResult?.teams?.find(team=>team.players?.includes(member.name));els.myTeam.textContent=team?team.name:"No team assigned yet";const ended=roomData?.meta?.status==="ended"||publicState().nightEnded;els.myDrinkMinus.disabled=ended;els.myDrinkPlus.disabled=ended;}


  const overlayCss=`
    :root{color-scheme:dark;--bg:#080b13;--panel:#101522;--line:rgba(255,255,255,.10);--text:#f4f6ff;--muted:#8d96aa;--cyan:#5cf5ff;--pink:#ff4ed8;--yellow:#ffd84c;--green:#53f58c;--red:#ff596d}
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:radial-gradient(circle at 20% 0,rgba(92,245,255,.08),transparent 28%),#070910;color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{padding:10px;overflow:auto}.hud{display:grid;gap:8px}.hud-head{display:grid;grid-template-columns:58px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(135deg,rgba(92,245,255,.06),rgba(139,92,255,.05)),var(--panel);box-shadow:0 18px 45px rgba(0,0,0,.30)}.hud-logo{width:58px;height:58px;object-fit:contain;padding:5px;border-radius:12px;background:#070a10;border:1px solid var(--line)}.hud-kicker{display:block;color:var(--cyan);font-size:8px;font-weight:900;letter-spacing:.16em}.hud-title{margin:2px 0 3px;font-size:20px;line-height:1;overflow-wrap:anywhere}.hud-meta{margin:0;color:var(--muted);font-size:9px;line-height:1.35}.hud-close{width:32px;height:32px;border:1px solid var(--line);border-radius:9px;background:rgba(255,255,255,.04);color:var(--text);font-size:18px;cursor:pointer}.hud-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.hud-box{min-width:0;padding:9px;border:1px solid var(--line);border-radius:13px;background:rgba(16,21,34,.92)}.hud-box>small{display:block;color:var(--muted);font-size:7px;font-weight:900;letter-spacing:.13em}.hud-me{display:flex;align-items:center;gap:7px;margin-top:5px}.hud-emoji{font-size:24px}.hud-me strong{display:block;font-size:11px}.hud-me span{display:block;color:var(--cyan);font-size:8px;margin-top:1px}.hud-score strong{display:block;margin-top:5px;font-size:12px;line-height:1.3}.hud-score span{display:block;margin-top:3px;color:var(--muted);font-size:8px;line-height:1.35}.hud-drinks{display:grid;grid-template-columns:34px 1fr 34px;gap:6px;align-items:center;margin-top:5px}.hud-drinks button{height:34px;border:1px solid var(--line);border-radius:9px;background:rgba(255,255,255,.05);color:var(--text);font-size:18px;font-weight:900;cursor:pointer}.hud-drinks button:last-child{border-color:rgba(83,245,140,.28);background:rgba(83,245,140,.08);color:#aaffc1}.hud-drinks strong{text-align:center;font-size:24px}.hud-modifier{padding:8px 10px;border:1px solid rgba(255,216,76,.22);border-radius:12px;background:rgba(255,216,76,.05);color:#ffe789;font-size:9px;font-weight:800;line-height:1.4}.hud-team{padding:9px;border:1px solid var(--line);border-radius:13px;background:rgba(16,21,34,.92)}.hud-team-head{display:flex;align-items:center;justify-content:space-between;gap:7px}.hud-team-head small{color:var(--muted);font-size:7px;font-weight:900;letter-spacing:.13em}.hud-team-head strong{font-size:11px}.hud-team-list{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.hud-player{display:flex;align-items:center;gap:4px;padding:5px 7px;border-radius:8px;background:rgba(255,255,255,.04);font-size:8px}.hud-player.me{outline:1px solid rgba(92,245,255,.45);background:rgba(92,245,255,.07)}.hud-rules{display:grid;gap:6px}.hud-rule{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:rgba(16,21,34,.92)}.hud-rule h3{margin:0;padding:6px 8px;font-size:8px;letter-spacing:.08em}.hud-rule.red h3{color:#ff9aa6;background:rgba(255,89,109,.06)}.hud-rule.yellow h3{color:#ffe789;background:rgba(255,216,76,.06)}.hud-rule.green h3{color:#aaffc1;background:rgba(83,245,140,.06)}.hud-rule ul{margin:0;padding:6px 9px 7px 23px}.hud-rule li{margin:0 0 4px;color:#dbe0ed;font-size:8px;line-height:1.35}.hud-empty{padding:20px;text-align:center;border:1px dashed var(--line);border-radius:14px;color:var(--muted);font-size:10px}.hud-footer{text-align:center;color:#657086;font-size:7px;padding:2px}.hud-status{color:#9dffbd!important}.hud-ended{color:#ff9aa6!important}@media(max-width:340px){body{padding:6px}.hud-grid{grid-template-columns:1fr}.hud-head{grid-template-columns:48px minmax(0,1fr) auto}.hud-logo{width:48px;height:48px}.hud-title{font-size:17px}}
  `;

  function overlayIsOpen(){
    return Boolean(overlayWindow && !overlayWindow.closed && overlayWindow.document);
  }

  function overlayRoundText(round){
    if(!round)return {main:"Scoreless / not entered",detail:""};
    if(round.scoreless)return {main:"Scoreless / not entered",detail:""};
    const winners=(round.winners||[]).map(name=>`${emojiForName(name)} ${name}`).join(" + ");
    const detail=(round.scores||[]).map(entry=>`${entry.label} ${entry.score}`).join(" · ");
    return {main:winners?`${winners} ${round.winners?.length===1?"leads / wins":"win"}`:"Result saved",detail};
  }

  function renderOverlay(){
    if(!overlayIsOpen())return;
    const doc=overlayWindow.document;
    const root=doc.getElementById("overlayRoot");
    if(!root)return;
    const ps=publicState();
    const current=game(ps.acceptedGameId);
    const member=me();
    const ended=roomData?.meta?.status==="ended"||ps.nightEnded;
    if(!member){root.innerHTML='<div class="hud-empty">Player identity is no longer available.</div>';return;}
    const team=ps.teamResult?.gameId===current?.id?ps.teamResult?.teams?.find(item=>item.players?.includes(member.name)):null;
    const round=(ps.matchHistory||[]).find(item=>item.id===ps.activeRoundId);
    const score=overlayRoundText(round);
    const drinks=Math.max(0,Number(member.drinks)||0);
    const logo=current?new URL(current.logo,location.href).href:"";
    const ruleTypes=window.ARCADE_CONFIG.ruleTypes;
    const rules=current?["red","yellow","green"].map(type=>{
      const list=current.rules?.[type]||[];
      if(!list.length)return "";
      return `<section class="hud-rule ${type}"><h3>${ruleTypes[type].icon} ${escapeHtml(ruleTypes[type].label)}</h3><ul>${list.map(rule=>`<li>${escapeHtml(rule)}</li>`).join("")}</ul></section>`;
    }).join(""):"";
    const teamPlayers=team?.players?.map(name=>`<span class="hud-player ${name===member.name?"me":""}">${emojiForName(name)} ${escapeHtml(name)}</span>`).join("")||"";
    root.innerHTML=`<div class="hud">
      <header class="hud-head">
        ${current?`<img class="hud-logo" src="${logo}" alt="">`:`<div class="hud-logo" style="display:grid;place-items:center;font-size:25px">🎮</div>`}
        <div><span class="hud-kicker">${ended?"GAME NIGHT COMPLETE":"LIVE GAME OVERLAY"}</span><h1 class="hud-title">${escapeHtml(current?.name||"Waiting for a game…")}</h1><p class="hud-meta">${escapeHtml(current?[current.players,current.price,current.note].filter(Boolean).join(" · "):"The admin has not selected a game yet.")}</p></div>
        <button class="hud-close" data-overlay-close type="button" aria-label="Close overlay">×</button>
      </header>
      <div class="hud-grid">
        <section class="hud-box"><small>YOU</small><div class="hud-me"><span class="hud-emoji">${member.emoji||"🎮"}</span><div><strong>${escapeHtml(member.name)}</strong><span>${escapeHtml(team?.name||"No team assigned")}</span></div></div></section>
        <section class="hud-box hud-score"><small>CURRENT RESULT</small><strong>${escapeHtml(score.main)}</strong>${score.detail?`<span>${escapeHtml(score.detail)}</span>`:""}</section>
        <section class="hud-box"><small>YOUR DRINK COUNTER</small><div class="hud-drinks"><button data-overlay-drink="-1" ${ended?"disabled":""}>−</button><strong>${drinks}</strong><button data-overlay-drink="1" ${ended?"disabled":""}>+</button></div></section>
        <section class="hud-box"><small>ROOM</small><div class="hud-me"><span class="hud-emoji">📡</span><div><strong>${escapeHtml(roomCode||"------")}</strong><span class="${ended?"hud-ended":"hud-status"}">${ended?"NIGHT ENDED":"LIVE"}</span></div></div></section>
      </div>
      ${ps.currentModifier?`<div class="hud-modifier">⚡ ${escapeHtml(ps.currentModifier)}</div>`:""}
      ${team?`<section class="hud-team"><div class="hud-team-head"><small>YOUR TEAM</small><strong>${escapeHtml(team.name)}</strong></div><div class="hud-team-list">${teamPlayers}</div></section>`:""}
      ${current?`<section class="hud-rules">${rules}</section>`:'<div class="hud-empty">Rules, team and score will appear here when the game starts.</div>'}
      <div class="hud-footer">GAME NIGHT ARCADE · updates live from Firebase</div>
    </div>`;
    root.querySelector("[data-overlay-close]")?.addEventListener("click",closeGameOverlay);
    root.querySelectorAll("[data-overlay-drink]").forEach(button=>button.addEventListener("click",()=>changeDrink(Number(button.dataset.overlayDrink))));
  }

  function prepareOverlayDocument(win){
    const doc=win.document;
    doc.title="Game Night Overlay";
    doc.head.innerHTML=`<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${overlayCss}</style>`;
    doc.body.innerHTML='<main id="overlayRoot"><div class="hud-empty">Loading game-night info…</div></main>';
    win.addEventListener("pagehide",()=>{if(overlayWindow===win){overlayWindow=null;overlayKind=null;updateOverlayButton();}},{once:true});
    win.addEventListener("beforeunload",()=>{if(overlayWindow===win){overlayWindow=null;overlayKind=null;updateOverlayButton();}},{once:true});
  }

  function updateOverlayButton(){
    const open=overlayIsOpen();
    els.openGameOverlayBtn.textContent=open?"✓ OVERLAY OPEN":"🖥 GAME OVERLAY";
    els.openGameOverlayBtn.classList.toggle("active",open);
    if(open){
      els.overlaySupportText.textContent=overlayKind==="pip"?"Always-on-top overlay is running.":"Compact overlay window is open.";
    }else if("documentPictureInPicture" in window && window.isSecureContext){
      els.overlaySupportText.textContent="Opens an always-on-top HUD over your game.";
    }else{
      els.overlaySupportText.textContent="Your browser will use a compact pop-out window for the HUD.";
    }
  }

  async function openGameOverlay(){
    window.ArcadeAudio.unlock();
    if(overlayIsOpen()){
      try{overlayWindow.focus();}catch(_){}
      renderOverlay();
      return;
    }
    if("documentPictureInPicture" in window && window.isSecureContext){
      try{
        const pip=await window.documentPictureInPicture.requestWindow({width:420,height:720});
        overlayWindow=pip;overlayKind="pip";prepareOverlayDocument(pip);renderOverlay();updateOverlayButton();showNotice("🖥 Game Overlay opened — it will stay above other windows.",3500);return;
      }catch(error){console.warn("Document Picture-in-Picture unavailable",error);}
    }
    const popup=window.open("","gameNightOverlay","popup=yes,width=420,height=720,resizable=yes,scrollbars=yes");
    if(!popup){showNotice("Pop-up blocked. Allow pop-ups for this site to use the fallback overlay.",5000);return;}
    overlayWindow=popup;overlayKind="popup";prepareOverlayDocument(popup);renderOverlay();updateOverlayButton();showNotice("🖥 Compact overlay opened. Use your OS/browser to keep it on top if needed.",4500);
  }

  function closeGameOverlay(){
    if(!overlayIsOpen()){overlayWindow=null;overlayKind=null;updateOverlayButton();return;}
    try{overlayWindow.close();}catch(_){}
    overlayWindow=null;overlayKind=null;updateOverlayButton();
  }

  function renderRankings(){
    const ps=publicState();const players=ps.players||Object.values(members()).map(m=>m.name);const board=window.ArcadeSession.leaderboard(players,ps.matchHistory||[],drinksMap());
    els.playerLeaderboard.innerHTML=board.map((row,index)=>`<div class="leaderboard-row ${index===0&&row.wins>0?"leader":""}"><span class="leader-rank">${index+1}</span><span class="dashboard-player-emoji">${emojiForName(row.name)}</span><span class="leader-name"><strong>${escapeHtml(row.name)}</strong><small>${row.scoredGames} scored · ${row.games} played</small></span><strong class="wins-badge">${row.wins}W</strong></div>`).join("");
    const drinks=[...board].sort((a,b)=>b.drinks-a.drinks||a.name.localeCompare(b.name));els.drinkLeaderboard.innerHTML=drinks.map((row,index)=>`<div class="leaderboard-row"><span class="leader-rank">${index+1}</span><span class="dashboard-player-emoji">${emojiForName(row.name)}</span><span class="leader-name"><strong>${escapeHtml(row.name)}</strong><small>Tonight</small></span><strong class="drink-badge">${row.drinks}</strong></div>`).join("");
  }

  function renderHistory(){
    const ps=publicState();els.playerCurrentHistory.innerHTML=[...(ps.matchHistory||[])].reverse().map(round=>{const g=game(round.gameId);return`<article class="match-log-row ${round.scoreless?"scoreless":""}"><img src="${g?.logo||""}" alt=""><span><strong>${escapeHtml(g?.name||round.gameId)}</strong><small>${round.scoreless?"SCORELESS":`WIN: ${(round.winners||[]).map(name=>`${emojiForName(name)} ${escapeHtml(name)}`).join(" + ")}`}</small><em>${(round.scores||[]).length?round.scores.map(entry=>`${escapeHtml(entry.label)} ${entry.score}`).join(" · "):"No score entered"}</em></span></article>`}).join("")||'<p class="empty-dashboard">No games yet tonight.</p>';
    const nights=Object.values(roomData?.history||{}).sort((a,b)=>(b.endedAt||0)-(a.endedAt||0));els.playerArchiveList.innerHTML=nights.map(night=>{const matches=Object.values(night.matches||{});const top=(night.leaderboard||[])[0];return`<details class="archive-night"><summary><span><strong>${escapeHtml(night.title||"Game Night")}</strong><small>${new Date(night.endedAt||Date.now()).toLocaleDateString()} · ${matches.length} games${top?` · 🏆 ${escapeHtml(top.name)}`:""}</small></span></summary><div class="archive-match-list">${matches.map(round=>{const g=game(round.gameId);return`<div class="archive-match"><span><strong>${escapeHtml(g?.name||round.gameId)}</strong><small>${round.scoreless?"Scoreless":`Winner: ${(round.winners||[]).join(", ")}`}</small></span></div>`}).join("")}</div></details>`}).join("")||'<p class="empty-dashboard">No previous nights saved yet.</p>';
  }

  function renderPlayers(){els.allPlayersGrid.innerHTML=Object.values(members()).map(member=>`<article class="all-player-card ${memberId&&me()?.name===member.name?"is-me":""}"><span>${member.emoji||"○"}</span><strong>${escapeHtml(member.name)}</strong><small>${member.uid?"CONNECTED":"NOT CLAIMED"}</small><em>${Number(member.drinks)||0} drinks</em></article>`).join("");}

  function renderEnded(){const ended=roomData?.meta?.status==="ended"||publicState().nightEnded;els.endedBanner.classList.toggle("hidden",!ended);if(!ended)return;const players=publicState().players||[];const board=window.ArcadeSession.leaderboard(players,publicState().matchHistory||[],drinksMap());els.endedTitle.textContent=board[0]?.wins?`${emojiForName(board[0].name)} ${board[0].name} wins the night!`:"Game night archived";els.endedPodium.innerHTML=board.slice(0,3).map((row,index)=>`<div><span>${["🥇","🥈","🥉"][index]}</span><strong>${emojiForName(row.name)} ${escapeHtml(row.name)}</strong><small>${row.wins} wins</small></div>`).join("");}

  function renderSoundboard(){
    const uid=window.ArcadeCloud.uid();const last=Number(roomData?.soundEvents?.[uid]?.at)||0;const remain=Math.max(0,(window.ARCADE_SOUND_COOLDOWN_MS||30000)-(Date.now()-last));const ended=roomData?.meta?.status==="ended"||publicState().nightEnded;const ready=!ended&&remain<=0;
    els.soundboardGrid.innerHTML=(window.ARCADE_SOUNDBOARD||[]).map(sound=>`<button type="button" data-sound-id="${sound.id}" ${ready?"":"disabled"}><span>${sound.emoji||"🔊"}</span><strong>${escapeHtml(sound.name)}</strong></button>`).join("");
    const text=ended?"Game night has ended.":ready?"Ready — choose one sound.":`Cooldown: ${Math.ceil(remain/1000)}s`;els.soundboardCooldown.textContent=text;els.soundCooldownText.textContent=ready?"Soundboard ready.":text;els.openSoundboardBtn.disabled=!ready;
  }

  function renderAll(){if(!memberId||!me())return;renderCurrentGame();renderMyCard();renderGameQueue();renderRankings();renderHistory();renderPlayers();renderEnded();renderSoundboard();renderOverlay();updateOverlayButton();}

  function setLiveMode(mode){document.body.dataset.mode=mode;document.querySelectorAll("#liveAnimationModal .mode-layer").forEach(layer=>layer.classList.remove("active"));$(`${mode}Mode`)?.classList.add("active");els.selectorViewport.className=`selector-viewport mode-${mode} spectator-selector`;}
  function showLiveResult({emoji="",title,subtitle}){els.liveResultEmoji.textContent=emoji;els.liveResultTitle.textContent=title;els.liveResultSubtitle.textContent=subtitle||"";els.liveAnimationResult.classList.remove("hidden");}
  function runMachineEvent(event){
    let pool=[];let winner=null;let title="The machine is rolling…";
    if(event.type==="gameRoll"){pool=(event.candidateIds||[]).map(game).filter(Boolean);winner=game(event.winnerId);title=`${modeNames[event.mode]||"Arcade"} is choosing the game…`;}
    else if(event.type==="playerRoll"){pool=(event.candidates||[]).map(item=>({...item}));winner=pool.find(item=>item.name===event.winnerName)||{id:"winner",name:event.winnerName,emoji:event.winnerEmoji,accent:"#ffd84c"};title=`${modeNames[event.mode]||"Arcade"} is choosing a player…`;}
    if(!pool.length||!winner)return;els.liveAnimationHeading.textContent=title;els.liveAnimationResult.classList.add("hidden");els.liveAnimationModal.classList.remove("hidden");setLiveMode(event.mode||"wheel");window.ArcadeModes.setPool(pool,"logo");const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;window.ArcadeModes.spin(event.mode||"wheel",pool,"logo",winner,Boolean(reduce),()=>{showLiveResult({emoji:event.type==="playerRoll"?winner.emoji:"",title:winner.name,subtitle:event.type==="playerRoll"?"Fate has spoken.":"The admin rolled this game."});});
  }

  function animateCoin(result){els.chaosKicker.textContent="LIVE COIN FLIP";els.chaosTitle.textContent="FLIPPING…";els.chaosSubtitle.textContent="The admin tossed the coin.";els.chaosEmoji.classList.add("hidden");els.coinStage.classList.remove("hidden");els.chaosModal.classList.remove("hidden");els.arcadeCoin.className="arcade-coin";void els.arcadeCoin.offsetWidth;els.arcadeCoin.classList.add(result==="HEADS"?"flip-heads":"flip-tails");setTimeout(()=>{els.chaosTitle.textContent=result;els.chaosSubtitle.textContent=result==="HEADS"?"Heads takes it.":"Tails takes it.";window.ArcadeAudio.play("winner",{volume:.55});},window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?500:2400);}

  function processLiveEvent(event){if(!event)return;const at=Number(event.at)||0;if(firstSnapshot){lastLiveAt=at;return;}if(at<=lastLiveAt)return;lastLiveAt=at;if(event.type==="gameRoll"){showNotice(`🎡 ${modeNames[event.mode]||"Arcade"} is rolling a game!`,5000);runMachineEvent(event);}else if(event.type==="playerRoll"){showNotice(`🎯 ${modeNames[event.mode]||"Arcade"} is choosing a player!`,5000);runMachineEvent(event);}else if(event.type==="coinFlip"){showNotice("🪙 Live coin flip!",3000);animateCoin(event.result);}else if(event.type==="modifier"){showNotice(`⚡ ${escapeHtml(event.text)}`,6000);}else if(event.type==="gameAccepted"){const g=game(event.gameId);showNotice(`🎮 ${g?.name||"Game"} selected!`,4000);}else if(event.type==="score"){showNotice(event.scoreless?"📝 Game saved as scoreless.":`🏆 ${(event.winners||[]).join(" + ")} wins!`,5000);}else if(event.type==="nightEnded"){showNotice("🏁 Game night finished — final results are in!",7000);}}

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
    els.enableLiveSoundBtn.addEventListener("click",()=>{window.ArcadeAudio.unlock();window.ArcadeAudio.play("button",{volume:.35});els.enableLiveSoundBtn.innerHTML="✅ <span>Sounds ready</span>";showNotice("🔊 Live sounds enabled on this device.")});
    els.openSoundboardBtn.addEventListener("click",()=>{renderSoundboard();els.soundboardModal.classList.remove("hidden")});els.closeSoundboardBtn.addEventListener("click",()=>els.soundboardModal.classList.add("hidden"));els.soundboardGrid.addEventListener("click",e=>{const button=e.target.closest("[data-sound-id]");if(button&&!button.disabled)playSound(button.dataset.soundId)});
    document.querySelectorAll(".player-tab").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".player-tab").forEach(b=>b.classList.toggle("active",b===button));document.querySelectorAll(".player-tab-panel").forEach(panel=>panel.classList.remove("active"));$(`tab${button.dataset.tab[0].toUpperCase()}${button.dataset.tab.slice(1)}`).classList.add("active")}));

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

    const dismissLiveAnimation=()=>els.liveAnimationModal.classList.add("hidden");
    els.closeLiveAnimationBtn.addEventListener("click",dismissLiveAnimation);
    els.liveAnimationModal.addEventListener("pointerdown",dismissLiveAnimation);
    els.closeChaosBtn.addEventListener("click",()=>{els.chaosModal.classList.add("hidden");els.arcadeCoin.className="arcade-coin"});
    window.addEventListener("resize",()=>{const row=activeGameInfoId?els.gameQueueList.querySelector(`[data-game-info-id="${activeGameInfoId}"]`):null;if(row)positionGameInfoPopover(row);});
    cooldownTimer=setInterval(()=>{if(memberId&&roomData)renderSoundboard()},500);
  }

  async function init(){window.ArcadeAudio.setup({soundEnabled:true,volume:.8});bind();updateOverlayButton();const query=new URLSearchParams(location.search).get("room");const saved=localStorage.getItem("game-night-player-room-v1");const initial=window.ArcadeCloud.cleanCode(query||saved||"");els.roomCodeInput.value=initial;if(initial)join(initial);}
  init();
})();
