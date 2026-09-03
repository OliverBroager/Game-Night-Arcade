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
    "selectorViewport"
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

  function renderCurrentGame(){
    const ps=publicState();const current=game(ps.acceptedGameId);if(!current){els.liveGameName.textContent="Waiting for the first game…";els.liveGameLogo.classList.add("hidden");els.liveGameMeta.textContent="The admin controls the arcade. This page updates automatically.";els.playerRules.innerHTML="";els.playerTeams.innerHTML="";els.liveScore.innerHTML="";return;}
    els.liveGameName.textContent=current.name;els.liveGameLogo.src=current.logo;els.liveGameLogo.alt=`${current.name} logo`;els.liveGameLogo.classList.remove("hidden");els.liveGameMeta.textContent=[current.players,current.price,current.note].filter(Boolean).join(" · ");
    const teamResult=ps.teamResult;if(teamResult?.gameId===current.id&&teamResult.teams?.length){els.playerTeams.innerHTML=teamResult.teams.map((team,index)=>`<article class="team-card team-style-${index%8}"><div class="team-card-heading"><span class="team-number">${String(index+1).padStart(2,"0")}</span><div><small>TEAM</small><h4>${escapeHtml(team.name)}</h4></div><strong>${team.players.length}</strong></div><ol class="team-player-list">${team.players.map(name=>`<li class="${me()?.name===name?"is-me":""}"><span class="player-emoji-mini">${emojiForName(name)}</span>${escapeHtml(name)}</li>`).join("")}</ol></article>`).join("");}else els.playerTeams.innerHTML="";
    const round=(ps.matchHistory||[]).find(r=>r.id===ps.activeRoundId);if(round&&!round.scoreless){els.liveScore.innerHTML=`<span class="eyebrow">CURRENT RESULT</span><strong>${(round.winners||[]).map(name=>`${emojiForName(name)} ${escapeHtml(name)}`).join(" + ")} ${round.winners?.length===1?"LEADS / WINS":"WIN"}</strong><small>${(round.scores||[]).map(entry=>`${escapeHtml(entry.label)} ${entry.score}`).join(" · ")}</small>`;}else els.liveScore.innerHTML='<span class="eyebrow">MATCH RESULT</span><strong>Scoreless / not entered yet</strong>';
    const types=window.ARCADE_CONFIG.ruleTypes;els.playerRules.innerHTML=["red","yellow","green"].map(type=>`<section class="rule-group ${type}"><div class="rule-group-title"><span>${types[type].icon} ${types[type].label}</span></div><ul class="rule-list">${(current.rules?.[type]||[]).map(rule=>`<li>${escapeHtml(rule)}</li>`).join("")}</ul></section>`).join("");
    if(ps.currentModifier){els.liveModifier.textContent=`⚡ ${ps.currentModifier}`;els.liveModifier.classList.remove("hidden")}else els.liveModifier.classList.add("hidden");
  }

  function renderMyCard(){const member=me();if(!member)return;els.myEmoji.textContent=member.emoji||"🎮";els.myName.textContent=member.name;els.myDrinkCount.textContent=Math.max(0,Number(member.drinks)||0);const team=publicState().teamResult?.teams?.find(team=>team.players?.includes(member.name));els.myTeam.textContent=team?team.name:"No team assigned yet";const ended=roomData?.meta?.status==="ended"||publicState().nightEnded;els.myDrinkMinus.disabled=ended;els.myDrinkPlus.disabled=ended;}

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

  function renderAll(){if(!memberId||!me())return;renderCurrentGame();renderMyCard();renderRankings();renderHistory();renderPlayers();renderEnded();renderSoundboard();}

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
    els.enableLiveSoundBtn.addEventListener("click",()=>{window.ArcadeAudio.unlock();window.ArcadeAudio.play("button",{volume:.35});els.enableLiveSoundBtn.innerHTML="✅ <span>Sounds ready</span>";showNotice("🔊 Live sounds enabled on this device.")});
    els.openSoundboardBtn.addEventListener("click",()=>{renderSoundboard();els.soundboardModal.classList.remove("hidden")});els.closeSoundboardBtn.addEventListener("click",()=>els.soundboardModal.classList.add("hidden"));els.soundboardGrid.addEventListener("click",e=>{const button=e.target.closest("[data-sound-id]");if(button&&!button.disabled)playSound(button.dataset.soundId)});
    document.querySelectorAll(".player-tab").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".player-tab").forEach(b=>b.classList.toggle("active",b===button));document.querySelectorAll(".player-tab-panel").forEach(panel=>panel.classList.remove("active"));$(`tab${button.dataset.tab[0].toUpperCase()}${button.dataset.tab.slice(1)}`).classList.add("active")}));
    els.closeLiveAnimationBtn.addEventListener("click",()=>els.liveAnimationModal.classList.add("hidden"));els.closeChaosBtn.addEventListener("click",()=>{els.chaosModal.classList.add("hidden");els.arcadeCoin.className="arcade-coin"});
    cooldownTimer=setInterval(()=>{if(memberId&&roomData)renderSoundboard()},500);
  }

  async function init(){window.ArcadeAudio.setup({soundEnabled:true,volume:.8});bind();const query=new URLSearchParams(location.search).get("room");const saved=localStorage.getItem("game-night-player-room-v1");const initial=window.ArcadeCloud.cleanCode(query||saved||"");els.roomCodeInput.value=initial;if(initial)join(initial);}
  init();
})();
