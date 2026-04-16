const map = L.map('map', { worldCopyJump: true }).setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const ui = {
  searchLabel: document.getElementById('searchLabel'),
  chooseLabel: document.getElementById('chooseLabel'),
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  categoryBtn: document.getElementById('categoryBtn'),
  showCountriesBtn: document.getElementById('showCountriesBtn'),
  walkModeBtn: document.getElementById('walkModeBtn'),
  pickStartBtn: document.getElementById('pickStartBtn'),
  pickDestinationBtn: document.getElementById('pickDestinationBtn'),
  clearRouteBtn: document.getElementById('clearRouteBtn'),
  statusTitle: document.getElementById('statusTitle'),
  statusText: document.getElementById('statusText'),
  leftTitle: document.getElementById('leftTitle'),
  rightTitle: document.getElementById('rightTitle'),
  leftList: document.getElementById('leftList'),
  rightList: document.getElementById('rightList'),
  categorySelect: document.getElementById('categorySelect'),
  langButtons: [...document.querySelectorAll('.lang-btn')],
};

const phrases = {
  en: {
    searchLabel: 'Search places', chooseLabel: 'Or choose a category', searchPlaceholder: 'cafes, shops, museum...', searchBtn: 'Search', categoryBtn: 'Find',
    countriesBtn: 'Show countries', walkOff: 'Walk mode: OFF', walkOn: 'Walk mode: ON',
    pickStart: '1) Pick start', pickDest: '2) Pick destination', clearRoute: 'Clear route',
    howTo: 'How to use', howText: 'Press walk mode, pick start, pick destination, then it moves little by little.',
    leftTitle: 'Quick actions', rightTitle: 'Selected', countryLoaded: 'Countries loaded. Click one to focus.',
    noResult: 'No places found for this search.', walkNeedMode: 'Enable walk mode first.',
    walkStartSet: 'Start point set. Now press pick destination and click the map.',
    walkDestSet: 'Destination set. Walking now...', walkDone: 'Walk finished.',
    walkPickStart: 'Click on the map to set the start point.', walkPickDest: 'Click on the map to set destination point.',
  },
  el: {
    searchLabel: 'Αναζήτηση σημείων', chooseLabel: 'Ή διάλεξε κατηγορία', searchPlaceholder: 'καφέ, μαγαζιά, μουσείο...', searchBtn: 'Αναζήτηση', categoryBtn: 'Εύρεση',
    countriesBtn: 'Εμφάνιση χωρών', walkOff: 'Λειτουργία περπατήματος: OFF', walkOn: 'Λειτουργία περπατήματος: ON',
    pickStart: '1) Βάλε αρχή', pickDest: '2) Βάλε προορισμό', clearRoute: 'Καθαρισμός διαδρομής',
    howTo: 'Οδηγίες', howText: 'Πάτα λειτουργία περπατήματος, αρχή και προορισμό για σταδιακή κίνηση.',
    leftTitle: 'Γρήγορες ενέργειες', rightTitle: 'Επιλεγμένα', countryLoaded: 'Οι χώρες φορτώθηκαν. Πάτησε μία για εστίαση.',
    noResult: 'Δεν βρέθηκαν μέρη για αυτή την αναζήτηση.', walkNeedMode: 'Ενεργοποίησε πρώτα τη λειτουργία περπατήματος.',
    walkStartSet: 'Η αρχή μπήκε. Τώρα πάτα προορισμό και κλικ στον χάρτη.',
    walkDestSet: 'Ο προορισμός μπήκε. Ξεκινά η κίνηση...', walkDone: 'Η κίνηση ολοκληρώθηκε.',
    walkPickStart: 'Κλικ στον χάρτη για το σημείο αρχής.', walkPickDest: 'Κλικ στον χάρτη για το σημείο προορισμού.',
  },
  sq: {
    searchLabel: 'Kërko vende', chooseLabel: 'Ose zgjidh kategori', searchPlaceholder: 'kafe, dyqane, muze...', searchBtn: 'Kërko', categoryBtn: 'Gjej',
    countriesBtn: 'Shfaq shtetet', walkOff: 'Mënyra ecje: OFF', walkOn: 'Mënyra ecje: ON',
    pickStart: '1) Zgjidh nisjen', pickDest: '2) Zgjidh destinacionin', clearRoute: 'Pastro rrugën',
    howTo: 'Si përdoret', howText: 'Aktivizo ecjen, zgjidh nisjen dhe destinacionin për lëvizje graduale.',
    leftTitle: 'Veprime të shpejta', rightTitle: 'Të zgjedhura', countryLoaded: 'Shtetet u ngarkuan. Kliko një për fokus.',
    noResult: 'Nuk u gjetën vende për këtë kërkim.', walkNeedMode: 'Aktivizo fillimisht mënyrën e ecjes.',
    walkStartSet: 'Nisja u vendos. Tani zgjidh destinacionin dhe kliko në hartë.',
    walkDestSet: 'Destinacioni u vendos. Ecja po fillon...', walkDone: 'Ecja përfundoi.',
    walkPickStart: 'Kliko në hartë për pikën e nisjes.', walkPickDest: 'Kliko në hartë për pikën e destinacionit.',
  },
};

const state = {
  language: 'en',
  walkMode: false,
  walkStep: null,
  countriesLayer: null,
  routeLayer: null,
  walkMarker: null,
  startPin: null,
  endPin: null,
  moveTimer: null,
  placeMarkers: [],
};

function t(key) { return phrases[state.language][key] || key; }

function addLeftItem(text) {
  const item = document.createElement('li');
  item.textContent = `• ${text}`;
  ui.leftList.prepend(item);
}

function addRightItem(text) {
  const item = document.createElement('li');
  item.textContent = `• ${text}`;
  ui.rightList.prepend(item);
}

function setStatus(text) {
  ui.statusText.textContent = text;
}

function updateWalkButtons() {
  const enabled = state.walkMode;
  ui.pickStartBtn.disabled = !enabled;
  ui.pickDestinationBtn.disabled = !enabled;
  ui.clearRouteBtn.disabled = !enabled;
  ui.walkModeBtn.textContent = state.walkMode ? t('walkOn') : t('walkOff');
  ui.walkModeBtn.classList.toggle('blue', state.walkMode);
}

function applyLanguage(lang) {
  state.language = lang;
  ui.searchLabel.textContent = t('searchLabel');
  ui.chooseLabel.textContent = t('chooseLabel');
  ui.searchInput.placeholder = t('searchPlaceholder');
  ui.searchBtn.textContent = t('searchBtn');
  ui.categoryBtn.textContent = t('categoryBtn');
  ui.showCountriesBtn.textContent = t('countriesBtn');
  ui.pickStartBtn.textContent = t('pickStart');
  ui.pickDestinationBtn.textContent = t('pickDest');
  ui.clearRouteBtn.textContent = t('clearRoute');
  ui.statusTitle.textContent = t('howTo');
  if (!state.walkMode) setStatus(t('howText'));
  ui.leftTitle.textContent = t('leftTitle');
  ui.rightTitle.textContent = t('rightTitle');

  ui.langButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.lang === lang);
  });
  updateWalkButtons();
}

ui.langButtons.forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.lang)));

async function geocodeQuery(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=20&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Search failed (${response.status})`);
  return response.json();
}

function clearPlaceMarkers() {
  state.placeMarkers.forEach((marker) => map.removeLayer(marker));
  state.placeMarkers = [];
}

async function runSearch(query) {
  if (!query.trim()) return;
  clearPlaceMarkers();
  addLeftItem(query);

  try {
    const rows = await geocodeQuery(query);
    if (!rows.length) return setStatus(t('noResult'));

    rows.slice(0, 12).forEach((row) => {
      const marker = L.circleMarker([Number(row.lat), Number(row.lon)], {
        radius: 6, color: '#ff6a00', fillColor: '#c90000', fillOpacity: 0.8,
      }).addTo(map);
      marker.bindPopup(row.display_name);
      state.placeMarkers.push(marker);
    });

    const first = rows[0];
    map.setView([Number(first.lat), Number(first.lon)], 12);
    addRightItem(rows[0].display_name);
    setStatus(rows[0].display_name);
  } catch (error) {
    setStatus(String(error.message || error));
  }
}

ui.searchBtn.addEventListener('click', () => runSearch(ui.searchInput.value));
ui.categoryBtn.addEventListener('click', () => runSearch(ui.categorySelect.value));
ui.searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') runSearch(ui.searchInput.value);
});

ui.showCountriesBtn.addEventListener('click', async () => {
  addLeftItem('countries');
  if (state.countriesLayer) return map.fitBounds(state.countriesLayer.getBounds());

  try {
    const response = await fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json');
    if (!response.ok) throw new Error(`Countries failed (${response.status})`);
    const geojson = await response.json();

    state.countriesLayer = L.geoJSON(geojson, {
      style: { color: '#ff6a00', weight: 1, fillColor: '#c90000', fillOpacity: 0.18 },
      onEachFeature: (feature, layer) => {
        const name = feature.properties.name || 'Country';
        layer.bindPopup(name);
        layer.on('click', () => {
          map.fitBounds(layer.getBounds());
          addRightItem(name);
          setStatus(name);
        });
      },
    }).addTo(map);

    setStatus(t('countryLoaded'));
  } catch (error) {
    setStatus(String(error.message || error));
  }
});

function createPin(colorClass, latlng) {
  return L.marker(latlng, {
    icon: L.divIcon({ className: '', html: `<div class="${colorClass}"></div>`, iconSize: [14, 14] }),
  }).addTo(map);
}

function clearRoute() {
  if (state.moveTimer) clearInterval(state.moveTimer);
  state.moveTimer = null;
  state.walkStep = null;
  if (state.routeLayer) map.removeLayer(state.routeLayer);
  if (state.walkMarker) map.removeLayer(state.walkMarker);
  if (state.startPin) map.removeLayer(state.startPin);
  if (state.endPin) map.removeLayer(state.endPin);
  state.routeLayer = null;
  state.walkMarker = null;
  state.startPin = null;
  state.endPin = null;
}

function animateWalk(start, end) {
  const segments = [];
  for (let i = 0; i <= 36; i += 1) {
    const ratio = i / 36;
    segments.push([
      start.lat + (end.lat - start.lat) * ratio,
      start.lng + (end.lng - start.lng) * ratio,
    ]);
  }

  if (state.routeLayer) map.removeLayer(state.routeLayer);
  state.routeLayer = L.polyline(segments, {
    color: '#ff6a00', weight: 6, opacity: 0.92, dashArray: '10,6',
  }).addTo(map);

  const html = '<div class="walk-marker"></div>';
  if (state.walkMarker) map.removeLayer(state.walkMarker);
  state.walkMarker = L.marker(start, { icon: L.divIcon({ className: '', html, iconSize: [18, 18] }) }).addTo(map);

  let index = 0;
  if (state.moveTimer) clearInterval(state.moveTimer);
  state.moveTimer = setInterval(() => {
    state.walkMarker.setLatLng(segments[index]);
    map.panTo(segments[index], { animate: false });
    index += 1;
    if (index >= segments.length) {
      clearInterval(state.moveTimer);
      state.moveTimer = null;
      setStatus(t('walkDone'));
      addRightItem(`Walked to ${end.lat.toFixed(3)}, ${end.lng.toFixed(3)}`);
    }
  }, 100);
}

ui.walkModeBtn.addEventListener('click', () => {
  state.walkMode = !state.walkMode;
  state.walkStep = null;
  updateWalkButtons();
  if (!state.walkMode) clearRoute();
  setStatus(state.walkMode ? t('walkPickStart') : t('howText'));
  addLeftItem(state.walkMode ? 'walk on' : 'walk off');
});

ui.pickStartBtn.addEventListener('click', () => {
  if (!state.walkMode) return setStatus(t('walkNeedMode'));
  state.walkStep = 'start';
  setStatus(t('walkPickStart'));
});

ui.pickDestinationBtn.addEventListener('click', () => {
  if (!state.walkMode) return setStatus(t('walkNeedMode'));
  if (!state.startPin) return setStatus(t('walkPickStart'));
  state.walkStep = 'destination';
  setStatus(t('walkPickDest'));
});

ui.clearRouteBtn.addEventListener('click', () => {
  clearRoute();
  setStatus(t('howText'));
  addRightItem('route cleared');
});

map.on('click', (event) => {
  if (!state.walkMode || !state.walkStep) return;

  if (state.walkStep === 'start') {
    if (state.startPin) map.removeLayer(state.startPin);
    state.startPin = createPin('pin-start', event.latlng);
    state.walkStep = null;
    setStatus(t('walkStartSet'));
    addRightItem(`Start: ${event.latlng.lat.toFixed(3)}, ${event.latlng.lng.toFixed(3)}`);
    return;
  }

  if (state.walkStep === 'destination') {
    if (state.endPin) map.removeLayer(state.endPin);
    state.endPin = createPin('pin-end', event.latlng);
    state.walkStep = null;
    setStatus(t('walkDestSet'));
    addRightItem(`Destination: ${event.latlng.lat.toFixed(3)}, ${event.latlng.lng.toFixed(3)}`);
    animateWalk(state.startPin.getLatLng(), state.endPin.getLatLng());
  }
});

applyLanguage('en');
updateWalkButtons();
addLeftItem('cafes');
addLeftItem('shops');
addLeftItem('hotels');
