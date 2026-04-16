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
    searchLabel: 'Search places',
    chooseLabel: 'Or choose a category',
    searchPlaceholder: 'cafes, shops, museum...',
    searchBtn: 'Search',
    categoryBtn: 'Find',
    countriesBtn: 'Show countries',
    walkOff: 'Walk mode: OFF',
    walkOn: 'Walk mode: ON',
    howTo: 'How to use',
    howText: 'Press walk mode, then click anywhere on map to move little by little.',
    leftTitle: 'Quick actions',
    rightTitle: 'Selected',
    countryLoaded: 'Countries loaded. Click one to focus.',
    noResult: 'No places found for this search.',
  },
  el: {
    searchLabel: 'Αναζήτηση σημείων',
    chooseLabel: 'Ή διάλεξε κατηγορία',
    searchPlaceholder: 'καφέ, μαγαζιά, μουσείο...',
    searchBtn: 'Αναζήτηση',
    categoryBtn: 'Εύρεση',
    countriesBtn: 'Εμφάνιση χωρών',
    walkOff: 'Λειτουργία περπατήματος: OFF',
    walkOn: 'Λειτουργία περπατήματος: ON',
    howTo: 'Οδηγίες',
    howText: 'Πάτα τη λειτουργία περπατήματος και μετά κάνε κλικ στον χάρτη.',
    leftTitle: 'Γρήγορες ενέργειες',
    rightTitle: 'Επιλεγμένα',
    countryLoaded: 'Οι χώρες φορτώθηκαν. Πάτησε μία για εστίαση.',
    noResult: 'Δεν βρέθηκαν μέρη για αυτή την αναζήτηση.',
  },
  sq: {
    searchLabel: 'Kërko vende',
    chooseLabel: 'Ose zgjidh kategori',
    searchPlaceholder: 'kafe, dyqane, muze...',
    searchBtn: 'Kërko',
    categoryBtn: 'Gjej',
    countriesBtn: 'Shfaq shtetet',
    walkOff: 'Mënyra ecje: OFF',
    walkOn: 'Mënyra ecje: ON',
    howTo: 'Si përdoret',
    howText: 'Shtyp mënyrën e ecjes dhe kliko në hartë që të lëvizë gradualisht.',
    leftTitle: 'Veprime të shpejta',
    rightTitle: 'Të zgjedhura',
    countryLoaded: 'Shtetet u ngarkuan. Kliko një për fokus.',
    noResult: 'Nuk u gjetën vende për këtë kërkim.',
  },
};

const state = {
  language: 'en',
  walkMode: false,
  countriesLayer: null,
  routeLayer: null,
  walkMarker: null,
  moveTimer: null,
  placeMarkers: [],
};

function t(key) {
  return phrases[state.language][key] || key;
}

function applyLanguage(lang) {
  state.language = lang;
  ui.searchLabel.textContent = t('searchLabel');
  ui.chooseLabel.textContent = t('chooseLabel');
  ui.searchInput.placeholder = t('searchPlaceholder');
  ui.searchBtn.textContent = t('searchBtn');
  ui.categoryBtn.textContent = t('categoryBtn');
  ui.showCountriesBtn.textContent = t('countriesBtn');
  ui.walkModeBtn.textContent = state.walkMode ? t('walkOn') : t('walkOff');
  ui.statusTitle.textContent = t('howTo');
  ui.statusText.textContent = t('howText');
  ui.leftTitle.textContent = t('leftTitle');
  ui.rightTitle.textContent = t('rightTitle');

  ui.langButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.lang === lang);
  });
}

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

ui.langButtons.forEach((button) => {
  button.addEventListener('click', () => applyLanguage(button.dataset.lang));
});

async function geocodeQuery(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=20&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
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
    if (!rows.length) {
      ui.statusText.textContent = t('noResult');
      return;
    }

    rows.slice(0, 12).forEach((row) => {
      const marker = L.circleMarker([Number(row.lat), Number(row.lon)], {
        radius: 6,
        color: '#ff6a00',
        fillColor: '#c90000',
        fillOpacity: 0.8,
      }).addTo(map);
      marker.bindPopup(row.display_name);
      state.placeMarkers.push(marker);
    });

    const first = rows[0];
    map.setView([Number(first.lat), Number(first.lon)], 12);
    addRightItem(rows[0].display_name);
    ui.statusText.textContent = rows[0].display_name;
  } catch (error) {
    ui.statusText.textContent = String(error);
  }
}

ui.searchBtn.addEventListener('click', () => runSearch(ui.searchInput.value));
ui.categoryBtn.addEventListener('click', () => runSearch(ui.categorySelect.value));
ui.searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') runSearch(ui.searchInput.value);
});

ui.showCountriesBtn.addEventListener('click', async () => {
  addLeftItem('countries');
  if (state.countriesLayer) {
    map.fitBounds(state.countriesLayer.getBounds());
    return;
  }

  const response = await fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json');
  const geojson = await response.json();

  state.countriesLayer = L.geoJSON(geojson, {
    style: {
      color: '#ff6a00',
      weight: 1,
      fillColor: '#c90000',
      fillOpacity: 0.18,
    },
    onEachFeature: (feature, layer) => {
      const name = feature.properties.name || 'Country';
      layer.bindPopup(name);
      layer.on('click', () => {
        map.fitBounds(layer.getBounds());
        addRightItem(name);
        ui.statusText.textContent = name;
      });
    },
  }).addTo(map);

  ui.statusText.textContent = t('countryLoaded');
});

ui.walkModeBtn.addEventListener('click', () => {
  state.walkMode = !state.walkMode;
  ui.walkModeBtn.textContent = state.walkMode ? t('walkOn') : t('walkOff');
  ui.walkModeBtn.classList.toggle('blue', state.walkMode);
  addLeftItem(state.walkMode ? 'walk on' : 'walk off');
});

function animateWalk(toLatLng) {
  const from = state.walkMarker ? state.walkMarker.getLatLng() : map.getCenter();
  const to = L.latLng(toLatLng);
  const segments = [];

  for (let i = 0; i <= 30; i += 1) {
    const ratio = i / 30;
    const lat = from.lat + (to.lat - from.lat) * ratio;
    const lng = from.lng + (to.lng - from.lng) * ratio;
    segments.push([lat, lng]);
  }

  if (state.routeLayer) map.removeLayer(state.routeLayer);
  state.routeLayer = L.polyline(segments, {
    color: '#ff6a00',
    weight: 6,
    opacity: 0.9,
    dashArray: '10,6',
  }).addTo(map);

  if (!state.walkMarker) {
    const html = '<div class="walk-marker"></div>';
    state.walkMarker = L.marker(from, {
      icon: L.divIcon({ className: '', html, iconSize: [18, 18] }),
    }).addTo(map);
  }

  if (state.moveTimer) clearInterval(state.moveTimer);

  let index = 0;
  state.moveTimer = setInterval(() => {
    state.walkMarker.setLatLng(segments[index]);
    map.panTo(segments[index], { animate: false });
    index += 1;
    if (index >= segments.length) {
      clearInterval(state.moveTimer);
      state.moveTimer = null;
      addRightItem(`Walked to ${to.lat.toFixed(3)}, ${to.lng.toFixed(3)}`);
    }
  }, 120);
}

map.on('click', (event) => {
  if (!state.walkMode) return;
  animateWalk(event.latlng);
});

applyLanguage('en');
addLeftItem('cafes');
addLeftItem('shops');
addLeftItem('hotels');
