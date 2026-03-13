const screens = [...document.querySelectorAll('.screen')];
const profileKey = 'spathiProfileV1';
const gameState = {
  difficulty: 'easy',
  currentScreen: 'screen-login',
  selectedRoom: 'room1',
  profile: null,
  settings: { music: false, sound: true },
  match: null,
  audioCtx: null,
  missions: [
    { id: 'play1', title: 'Luaj 1 ndeshje', reward: 15, target: 1 },
    { id: 'win1', title: 'Fito 1 ndeshje', reward: 25, target: 1 },
    { id: 'spades5', title: 'Kap 5 spathi gjithsej', reward: 20, target: 5 },
  ],
  shop: {
    tables: [
      { id: 'table_classic', name: 'Tavolina Klasike', price: 0, type: 'tables', preview: 'green' },
      { id: 'table_red', name: 'Tavolina Neon Red', price: 120, type: 'tables', preview: 'red' },
      { id: 'table_gold', name: 'Tavolina Gold Elite', price: 220, type: 'tables', preview: 'gold' },
    ],
    backs: [
      { id: 'back_classic', name: 'Kartat Klasike', price: 0, type: 'backs', preview: 'red' },
      { id: 'back_shadow', name: 'Kartat Shadow', price: 90, type: 'backs', preview: 'green' },
      { id: 'back_gold', name: 'Kartat Gold', price: 160, type: 'backs', preview: 'gold' },
    ],
    frames: [
      { id: 'frame_classic', name: 'Kornizë Klasike', price: 0, type: 'frames', preview: 'green' },
      { id: 'frame_ruby', name: 'Kornizë Ruby', price: 110, type: 'frames', preview: 'red' },
      { id: 'frame_royal', name: 'Kornizë Royal', price: 180, type: 'frames', preview: 'gold' },
    ]
  }
};

const el = id => document.getElementById(id);

const roomCpuNames = {
  room1: 'Royal CPU',
  room2: 'Boss CPU',
  room3: 'Classic CPU',
  room4: 'Night CPU'
};


function defaultProfile(name = '', age = '') {
  return {
    name,
    age,
    coins: 100,
    wins: 0,
    losses: 0,
    level: 1,
    xp: 0,
    gamesPlayed: 0,
    stats: { spadesCaptured: 0, missions: { play1: 0, win1: 0, spades5: 0 } },
    owned: { tables: ['table_classic'], backs: ['back_classic'], frames: ['frame_classic'] },
    equipped: { tables: 'table_classic', backs: 'back_classic', frames: 'frame_classic' }
  };
}

function saveProfile() {
  localStorage.setItem(profileKey, JSON.stringify(gameState.profile));
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(profileKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function showScreen(id) {
  screens.forEach(s => s.classList.toggle('active', s.id === id));
  gameState.currentScreen = id;
}

function toast(message) {
  const t = el('toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 2400);
}

function beep(freq = 520, length = 0.08, type = 'sine', volume = 0.02) {
  if (!gameState.settings.sound) return;
  try {
    if (!gameState.audioCtx) gameState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = gameState.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + length);
  } catch {}
}

function setProfileUI() {
  const p = gameState.profile;
  if (!p) return;
  el('avatarCircle').textContent = p.name?.slice(0,1)?.toUpperCase() || 'S';
  el('profileName').textContent = p.name;
  el('profileAge').textContent = `Mosha: ${p.age}`;
  el('coinsValue').textContent = p.coins;
  el('gameCoinsValue').textContent = p.coins;
  el('levelValue').textContent = p.level;
  el('winsValue').textContent = p.wins;
  el('lossesValue').textContent = p.losses;
  el('leaderCoins').textContent = p.coins;
  el('leaderWins').textContent = p.wins;
  el('leaderLevel').textContent = p.level;
  el('playerHudName').textContent = p.name;
  applyCosmetics();
  applyRoomTheme();
}

function applyRoomTheme() {
  const table = el('pokerTable');
  if (!table) return;
  table.classList.remove('room1-theme','room2-theme','room3-theme','room4-theme');
  table.classList.add(`${gameState.selectedRoom}-theme`);
}

function gainCoins(amount, reason = '') {
  gameState.profile.coins += amount;
  saveProfile();
  setProfileUI();
  if (amount > 0) toast(`Fitove +${amount} coins${reason ? ' • ' + reason : ''}`);
}

function addXP(amount) {
  const p = gameState.profile;
  p.xp += amount;
  while (p.xp >= p.level * 100) {
    p.xp -= p.level * 100;
    p.level += 1;
    toast(`Niveli u rrit! Tani je niveli ${p.level}`);
    beep(740, 0.1, 'triangle', 0.03);
  }
  saveProfile();
  setProfileUI();
}

function progressMission(id, amount = 1) {
  const p = gameState.profile;
  p.stats.missions[id] = (p.stats.missions[id] || 0) + amount;
  const mission = gameState.missions.find(m => m.id === id);
  if (mission && p.stats.missions[id] === mission.target) {
    gainCoins(mission.reward, `Mision: ${mission.title}`);
  }
  saveProfile();
  renderMissions();
}

function renderMissions() {
  const box = el('missionsList');
  const p = gameState.profile;
  if (!p) return;
  box.innerHTML = '';
  gameState.missions.forEach(m => {
    const current = p.stats.missions[m.id] || 0;
    const done = current >= m.target;
    const div = document.createElement('div');
    div.className = 'mission-item';
    div.innerHTML = `
      <div class="item-row"><strong>${m.title}</strong><span>${done ? '✅' : '⏳'}</span></div>
      <div class="item-row"><span>Përparimi</span><strong>${Math.min(current, m.target)}/${m.target}</strong></div>
      <div class="item-row"><span>Shpërblimi</span><strong>🪙 ${m.reward}</strong></div>
    `;
    box.appendChild(div);
  });
}

function renderShop(tab = 'tables') {
  const box = el('shopItems');
  box.innerHTML = '';
  const p = gameState.profile;
  gameState.shop[tab].forEach(item => {
    const owned = p.owned[tab].includes(item.id);
    const equipped = p.equipped[tab] === item.id;
    const card = document.createElement('div');
    card.className = 'shop-item';
    card.innerHTML = `
      <div class="preview ${item.preview}"></div>
      <div class="item-row"><strong>${item.name}</strong><span>🪙 ${item.price}</span></div>
      <div class="item-row">
        <span>${owned ? 'E blerë' : 'Nuk e ke'}</span>
        <button class="secondary-btn small shop-action">${equipped ? 'Aktive' : owned ? 'Përdor' : 'Blej'}</button>
      </div>
    `;
    card.querySelector('.shop-action').addEventListener('click', () => buyOrEquip(tab, item));
    box.appendChild(card);
  });
}

function buyOrEquip(tab, item) {
  const p = gameState.profile;
  const owned = p.owned[tab].includes(item.id);
  if (!owned) {
    if (p.coins < item.price) {
      toast('Nuk ke coins të mjaftueshme.');
      beep(220, .12, 'sawtooth', .02);
      return;
    }
    p.coins -= item.price;
    p.owned[tab].push(item.id);
    toast(`Bleve ${item.name}`);
    beep(640, .09, 'triangle', .03);
  }
  p.equipped[tab] = item.id;
  saveProfile();
  setProfileUI();
  renderShop(tab);
}

function applyCosmetics() {
  const p = gameState.profile;
  if (!p) return;
  const table = el('pokerTable');
  table.style.background = '';
  const eqTable = p.equipped.tables;
  if (eqTable === 'table_red') {
    table.style.background = 'radial-gradient(circle at center, rgba(255,255,255,.05), transparent 28%), linear-gradient(180deg, #4d1212, #240808)';
  } else if (eqTable === 'table_gold') {
    table.style.background = 'radial-gradient(circle at center, rgba(255,255,255,.05), transparent 28%), linear-gradient(180deg, #5b4b18, #1e1605)';
  }
  const avatar = el('avatarCircle');
  avatar.style.boxShadow = '0 0 20px rgba(255, 87, 87, .2)';
  if (p.equipped.frames === 'frame_ruby') avatar.style.boxShadow = '0 0 24px rgba(255, 60, 60, .4)';
  if (p.equipped.frames === 'frame_royal') avatar.style.boxShadow = '0 0 28px rgba(244,210,125,.38)';
}

function cardLabel(rank) {
  return ({ 1:'A',11:'J',12:'Q',13:'K' }[rank] || String(rank));
}
function suitSymbol(suit) {
  return ({ spades:'♠', hearts:'♥', diamonds:'♦', clubs:'♣' }[suit]);
}
function suitClass(suit) {
  return (suit === 'hearts' || suit === 'diamonds') ? 'red-suit' : 'black-suit';
}
function rankValueForSum(rank) {
  return rank > 10 ? null : rank;
}
function cardPointsValue(card) { return rankValueForSum(card.rank); }

function createDeck() {
  const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
  const deck = [];
  suits.forEach(suit => {
    for (let rank = 1; rank <= 13; rank++) deck.push({ suit, rank, id: `${suit}-${rank}-${Math.random().toString(36).slice(2,6)}` });
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function findCaptureSets(tableCards, target) {
  const eligible = tableCards.filter(c => cardPointsValue(c) !== null && cardPointsValue(c) <= 10);
  const results = [];
  const n = eligible.length;
  function bt(start, sum, arr, usedIds) {
    if (sum === target && arr.length) {
      results.push([...arr]);
      return;
    }
    if (sum >= target) return;
    for (let i = start; i < n; i++) {
      const c = eligible[i];
      if (usedIds.has(c.id)) continue;
      usedIds.add(c.id);
      arr.push(c);
      bt(i + 1, sum + cardPointsValue(c), arr, usedIds);
      arr.pop();
      usedIds.delete(c.id);
    }
  }
  bt(0, 0, [], new Set());
  return results;
}

function getPossibleCaptures(card, tableCards) {
  const captures = [];
  tableCards.forEach(tc => { if (tc.rank === card.rank) captures.push([tc]); });
  const val = cardPointsValue(card);
  if (val !== null && val <= 10) captures.push(...findCaptureSets(tableCards, val));
  // unique by ids string
  const seen = new Set();
  return captures.filter(set => {
    const key = set.map(c => c.id).sort().join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bestCapture(captures) {
  if (!captures.length) return null;
  return captures.sort((a, b) => scoreCaptureSet(b) - scoreCaptureSet(a))[0];
}

function scoreCaptureSet(set) {
  return set.length * 10 + set.filter(c => c.suit === 'spades').length * 3 + set.some(c => c.suit === 'spades' && c.rank === 2) * 12 + set.some(c => c.suit === 'diamonds' && c.rank === 10) * 10;
}

function startMatch() {
  const difficultyLabel = { easy: 'Lehtë', medium: 'Mesatare', hard: 'Vështirë' };
  const cpuBaseName = roomCpuNames[gameState.selectedRoom || 'room1'] || 'CPU';
  const cpuDisplayName = `${cpuBaseName} • ${difficultyLabel[gameState.difficulty]}`;
  toast(`Hyre në ${cpuBaseName}. Loja po nis...`);
  el('cpuName').textContent = cpuDisplayName;
  el('cpuZoneName').textContent = cpuDisplayName;
  const deck = createDeck();
  const tableCards = [deck.pop(), deck.pop(), deck.pop(), deck.pop()];
  gameState.match = {
    deck,
    tableCards,
    playerHand: [],
    cpuHand: [],
    captured: { player: [], cpu: [] },
    matchScore: { player: 0, cpu: 0 },
    turn: 'player',
    lastCapturer: null,
    selectedId: null,
    waitingCpu: false,
  };
  dealHandsIfNeeded();
  renderGame();
  applyRoomTheme();
  showScreen('screen-game');
  progressMission('play1', 1);
}

function dealHandsIfNeeded() {
  const m = gameState.match;
  if (!m.playerHand.length && !m.cpuHand.length && m.deck.length) {
    for (let i = 0; i < 4; i++) {
      m.playerHand.push(m.deck.pop());
      m.cpuHand.push(m.deck.pop());
    }
    beep(450, .06, 'square', .01);
  }
}

function renderCard(card, hidden = false, interactive = false) {
  const div = document.createElement('div');
  div.className = `card dealt ${hidden ? 'card-back' : ''} ${interactive ? 'playable' : ''}`;
  if (hidden) {
    div.innerHTML = `<div>♠</div>`;
    return div;
  }
  div.innerHTML = `
    <div class="card-value-top ${suitClass(card.suit)}">${cardLabel(card.rank)}</div>
    <div class="card-suit ${suitClass(card.suit)}">${suitSymbol(card.suit)}</div>
    <div class="card-value-bottom ${suitClass(card.suit)}">${cardLabel(card.rank)}</div>
  `;
  return div;
}

function renderGame() {
  const m = gameState.match;
  if (!m) return;
  const playerRow = el('playerHandRow');
  const cpuRow = el('cpuHandRow');
  const tableRow = el('tableCardsRow');
  const table = el('pokerTable');
  playerRow.innerHTML = '';
  cpuRow.innerHTML = '';
  tableRow.innerHTML = '';
  table.classList.toggle('player-turn', m.turn === 'player');
  table.classList.toggle('cpu-turn', m.turn === 'cpu');
  m.cpuHand.forEach((_, i) => {
    const card = renderCard({}, true);
    card.style.animationDelay = `${i * 60}ms`;
    cpuRow.appendChild(card);
  });
  m.tableCards.forEach((card, i) => {
    const c = renderCard(card, false, false);
    c.style.animationDelay = `${i * 55}ms`;
    tableRow.appendChild(c);
  });
  m.playerHand.forEach((card, i) => {
    const c = renderCard(card, false, true);
    c.style.animationDelay = `${i * 70}ms`;
    if (m.selectedId === card.id) c.classList.add('selected');
    c.addEventListener('click', () => playPlayerCard(card.id));
    playerRow.appendChild(c);
  });
  updateHud();
}

function updateHud() {
  const m = gameState.match;
  el('playerMatchScore').textContent = m.matchScore.player;
  el('cpuMatchScore').textContent = m.matchScore.cpu;
  el('playerCapturedCount').textContent = m.captured.player.length;
  el('cpuCapturedCount').textContent = m.captured.cpu.length;
  el('playerSpadesCount').textContent = m.captured.player.filter(c => c.suit === 'spades').length;
  el('cpuSpadesCount').textContent = m.captured.cpu.filter(c => c.suit === 'spades').length;
  el('turnBadge').textContent = m.turn === 'player' ? 'Radha jote!' : 'Radha e CPU';
  el('gameInfo').textContent = m.turn === 'player' ? 'Zgjidh letrën më të fortë dhe godit tavolinën.' : 'Kompjuteri po mendon lëvizjen më të mirë...';
  const hint = el('captureHint');
  if (hint) hint.textContent = m.turn === 'player' ? 'Shiko nëse mund të kapësh kombinime deri në 10.' : 'CPU po llogarit kapjen më të mirë.';
}

function playPlayerCard(cardId) {
  const m = gameState.match;
  if (!m || m.turn !== 'player' || m.waitingCpu) return;
  const idx = m.playerHand.findIndex(c => c.id === cardId);
  if (idx < 0) return;
  const card = m.playerHand[idx];
  playCard('player', card, idx);
}

function playCard(side, card, handIndex) {
  const m = gameState.match;
  const hand = side === 'player' ? m.playerHand : m.cpuHand;
  hand.splice(handIndex, 1);
  const possible = getPossibleCaptures(card, m.tableCards);
  const chosen = bestCapture(possible);
  if (chosen) {
    m.captured[side].push(card, ...chosen);
    m.tableCards = m.tableCards.filter(c => !chosen.some(x => x.id === c.id));
    m.lastCapturer = side;
    toast(`${side === 'player' ? gameState.profile.name : el('cpuName').textContent} kapi ${chosen.length} letra!`);
    beep(660, .08, 'triangle', .025);
  } else {
    m.tableCards.push(card);
    beep(360, .06, 'square', .02);
  }
  if (side === 'player') {
    m.turn = 'cpu';
    renderGame();
    maybeAdvanceOrCpu();
  } else {
    m.turn = 'player';
    renderGame();
    maybeAdvanceRound();
  }
}

function maybeAdvanceOrCpu() {
  maybeAdvanceRound();
  if (gameState.match && gameState.match.turn === 'cpu') cpuTurn();
}

function maybeAdvanceRound() {
  const m = gameState.match;
  if (!m.playerHand.length && !m.cpuHand.length) {
    if (m.deck.length) {
      dealHandsIfNeeded();
      renderGame();
      if (m.turn === 'cpu') cpuTurn();
      return;
    }
    if (m.tableCards.length && m.lastCapturer) {
      m.captured[m.lastCapturer].push(...m.tableCards);
      m.tableCards = [];
    }
    finishDeal();
  }
}

function finishDeal() {
  const m = gameState.match;
  const p = calcDealPoints(m.captured.player, m.captured.cpu);
  m.matchScore.player += p.player;
  m.matchScore.cpu += p.cpu;
  renderGame();
  if (m.captured.player.filter(c => c.suit === 'spades').length) progressMission('spades5', m.captured.player.filter(c => c.suit === 'spades').length);
  if (m.matchScore.player >= 21 || m.matchScore.cpu >= 21) {
    endMatch();
    return;
  }
  setTimeout(() => {
    toast(`Dora mbaroi • Ti ${p.player} pikë • CPU ${p.cpu} pikë`);
    const deck = createDeck();
    gameState.match = {
      deck,
      tableCards: [deck.pop(), deck.pop(), deck.pop(), deck.pop()],
      playerHand: [],
      cpuHand: [],
      captured: { player: [], cpu: [] },
      matchScore: { ...m.matchScore },
      turn: 'player',
      lastCapturer: null,
      selectedId: null,
      waitingCpu: false,
    };
    dealHandsIfNeeded();
    renderGame();
  }, 900);
}

function calcDealPoints(playerCards, cpuCards) {
  const playerCount = playerCards.length;
  const cpuCount = cpuCards.length;
  const playerSpades = playerCards.filter(c => c.suit === 'spades').length;
  const cpuSpades = cpuCards.filter(c => c.suit === 'spades').length;
  let player = 0, cpu = 0;
  if (playerCount > cpuCount && playerCount > 26) player += 2;
  else if (cpuCount > playerCount && cpuCount > 26) cpu += 2;
  else if (playerCount === 26 && cpuCount === 26) { player += 1; cpu += 1; }
  if (playerSpades > cpuSpades) player += 1;
  else if (cpuSpades > playerSpades) cpu += 1;
  if (playerCards.some(c => c.suit === 'spades' && c.rank === 2)) player += 1;
  else cpu += cpuCards.some(c => c.suit === 'spades' && c.rank === 2) ? 1 : 0;
  if (playerCards.some(c => c.suit === 'diamonds' && c.rank === 10)) player += 1;
  else cpu += cpuCards.some(c => c.suit === 'diamonds' && c.rank === 10) ? 1 : 0;
  return { player, cpu };
}

function cpuTurn() {
  const m = gameState.match;
  if (!m || m.waitingCpu) return;
  m.waitingCpu = true;
  renderGame();
  const delay = gameState.difficulty === 'easy' ? 750 : gameState.difficulty === 'medium' ? 1000 : 1250;
  setTimeout(() => {
    const idx = chooseCpuMove();
    const card = m.cpuHand[idx];
    m.waitingCpu = false;
    playCard('cpu', card, idx);
  }, delay);
}

function chooseCpuMove() {
  const m = gameState.match;
  const options = m.cpuHand.map((card, idx) => ({ card, idx, captures: getPossibleCaptures(card, m.tableCards) }));
  if (gameState.difficulty === 'easy') {
    const capturers = options.filter(o => o.captures.length);
    const pool = capturers.length ? capturers : options;
    return pool[Math.floor(Math.random() * pool.length)].idx;
  }
  const scored = options.map(o => {
    let score = 0;
    const best = bestCapture(o.captures);
    if (best) score += scoreCaptureSet(best);
    if (o.card.suit === 'spades') score += 2;
    if (o.card.suit === 'spades' && o.card.rank === 2) score += 8;
    if (o.card.suit === 'diamonds' && o.card.rank === 10) score += 8;
    if (!best && rankValueForSum(o.card.rank) && rankValueForSum(o.card.rank) <= 4) score += 1;
    return { idx: o.idx, score };
  });
  scored.sort((a,b) => b.score - a.score);
  if (gameState.difficulty === 'medium') return scored[0].idx;
  // hard: if tie, prefer preserving face cards less, or higher impact
  return scored[0].idx;
}

function endMatch() {
  const m = gameState.match;
  const playerWon = m.matchScore.player > m.matchScore.cpu;
  const diffRewards = { easy: 15, medium: 25, hard: 40 };
  gameState.profile.gamesPlayed += 1;
  if (playerWon) {
    gameState.profile.wins += 1;
    gainCoins(diffRewards[gameState.difficulty], 'Fitore ndaj CPU');
    addXP(45 + (gameState.difficulty === 'hard' ? 25 : gameState.difficulty === 'medium' ? 15 : 0));
    progressMission('win1', 1);
  } else {
    gameState.profile.losses += 1;
    addXP(10);
  }
  saveProfile();
  setProfileUI();
  el('resultTitle').textContent = playerWon ? 'Fitore!' : 'Humbje';
  el('resultText').textContent = `Rezultati final: ${m.matchScore.player} - ${m.matchScore.cpu}`;
  el('resultModal').classList.remove('hidden');
}

function closeModalToHome() {
  el('resultModal').classList.add('hidden');
  showScreen('screen-home');
}

function setupEvents() {
  el('saveProfileBtn').addEventListener('click', () => {
    const name = el('nicknameInput').value.trim();
    const age = el('ageInput').value.trim();
    if (!name) return el('loginError').textContent = 'Shkruaj pseudonimin.';
    if (!age) return el('loginError').textContent = 'Shkruaj moshën.';
    gameState.profile = defaultProfile(name, age);
    saveProfile();
    setProfileUI();
    renderMissions();
    renderShop();
    showScreen('screen-home');
  });
  el('resetProfileBtn').addEventListener('click', () => {
    if (!confirm('Ta fshij profilin lokal?')) return;
    localStorage.removeItem(profileKey);
    location.reload();
  });
  el('openCasualBtn').addEventListener('click', () => showScreen('screen-casual'));
  el('openShopBtn').addEventListener('click', () => { renderShop(document.querySelector('.shop-tab.active')?.dataset.shopTab || 'tables'); showScreen('screen-shop'); });
  el('openMissionsBtn').addEventListener('click', () => { renderMissions(); showScreen('screen-missions'); });
  el('openLeaderboardBtn').addEventListener('click', () => showScreen('screen-leaderboard'));
  el('openRulesBtn').addEventListener('click', () => showScreen('screen-rules'));
  document.querySelectorAll('[data-back-home]').forEach(btn => btn.addEventListener('click', () => showScreen('screen-home')));
  document.querySelectorAll('.difficulty-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.difficulty-btn').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    gameState.difficulty = btn.dataset.difficulty;
  }));
  el('startGameBtn').addEventListener('click', startMatch);
  el('playAgainBtn').addEventListener('click', () => { el('resultModal').classList.add('hidden'); startMatch(); });
  el('modalHomeBtn').addEventListener('click', closeModalToHome);
  document.querySelectorAll('.shop-tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.shop-tab').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    renderShop(tab.dataset.shopTab);
  }));
  el('musicToggle').addEventListener('click', () => {
    gameState.settings.music = !gameState.settings.music;
    toast(gameState.settings.music ? 'Muzika u aktivizua (placeholder).' : 'Muzika u ndal.');
  });
  el('soundToggle').addEventListener('click', () => {
    gameState.settings.sound = !gameState.settings.sound;
    toast(gameState.settings.sound ? 'Zëri u aktivizua.' : 'Zëri u ndal.');
  });
}

function init() {
  setupEvents();
  const existing = loadProfile();
  if (existing) {
    gameState.profile = existing;
    setProfileUI();
    renderMissions();
    renderShop();
    showScreen('screen-home');
  } else {
    showScreen('screen-login');
  }
}

init();


document.querySelectorAll('.room-card').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.room-card').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    gameState.selectedRoom = btn.dataset.room;
    const cpuName = roomCpuNames[gameState.selectedRoom] || 'CPU';
    toast(`Zgjodhe ${btn.querySelector('.room-badge').textContent} • Kundër ${cpuName}`);
    applyRoomTheme();
  });
});
