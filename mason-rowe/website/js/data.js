/* MASON & ROWE — content model.
   SELF-INITIATED CONCEPT PROJECT by Rovard Studios. Mason & Rowe, its developments, people, prices,
   availability and points of interest are entirely fictional and illustrative. */
(function () {
  var MR = (window.MR = window.MR || {});

  /* ── helpers ─────────────────────────────────────────────── */
  MR.usd = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  MR.usdShort = function (n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(n % 1e6 === 0 || (n / 1e6) >= 10 ? (n % 1e6 === 0 ? 0 : 1) : 2).replace(/\.?0+$/, '') + 'M';
    return '$' + Math.round(n / 1e3) + 'K';
  };
  MR.sf = function (n) { return Math.round(n).toLocaleString('en-US') + ' sq ft'; };
  MR.pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  function rngFor(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6D2B79F5; var t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── amenities ───────────────────────────────────────────── */
  MR.AMENITIES = {
    spa:       { name: 'Spa & Hammam',       icon: 'i-spa',    group: 'Wellness', text: 'A heated stone hammam, cold plunge and two treatment rooms, open to residents by reservation.' },
    pool:      { name: 'Lap Pool',           icon: 'i-pool',   group: 'Wellness', text: 'Twenty-five meters of still water beneath a ceiling of linear light.' },
    fitness:   { name: 'Fitness Studio',     icon: 'i-fit',    group: 'Wellness', text: 'A daylit training floor, a private Pilates room and a resident trainer on call.' },
    lounge:    { name: 'Residents’ Lounge',  icon: 'i-lounge', group: 'Social',   text: 'A library-quiet room with a fireplace, a long table and a bar nobody has to run.' },
    dining:    { name: 'Private Dining',     icon: 'i-dine',   group: 'Social',   text: 'A chef’s kitchen and a table for twelve, bookable for any evening of the year.' },
    cinema:    { name: 'Screening Room',     icon: 'i-film',   group: 'Social',   text: 'Twenty-two seats, reference-grade projection and a silence that holds.' },
    wine:      { name: 'Wine Cellar',        icon: 'i-wine',   group: 'Social',   text: 'Climate-held lockers set into the base of the building, with a tasting alcove.' },
    library:   { name: 'Library',            icon: 'i-book',   group: 'Social',   text: 'Floor-to-ceiling oak shelving, reading chairs and a quiet that is enforced gently.' },
    terrace:   { name: 'Roof Terrace',       icon: 'i-sun',    group: 'Outdoors', text: 'Planted, lit and sheltered: dining for twenty beneath an open sky.' },
    garden:    { name: 'Courtyard Garden',   icon: 'i-leaf',   group: 'Outdoors', text: 'A walled garden of stone, water and mature canopy, planted to be better in year ten.' },
    marina:    { name: 'Marina Access',      icon: 'i-pool',   group: 'Outdoors', text: 'Deep-water slips for residents, a short walk along the quay.' },
    concierge: { name: 'Concierge',          icon: 'i-bell',   group: 'Service',  text: 'Staffed around the clock by people who learn your name in the first week.' },
    garage:    { name: 'Valet Garage',       icon: 'i-car',    group: 'Service',  text: 'Secure, climate-controlled parking with the car brought to the door.' },
    ev:        { name: 'EV Charging',        icon: 'i-bolt',   group: 'Service',  text: 'A charging point at every bay, load-managed so the building never notices.' },
    security:  { name: 'Private Security',   icon: 'i-shield', group: 'Service',  text: 'A discreet, trained presence and a single, controlled point of arrival.' },
    pets:      { name: 'Pet Spa',            icon: 'i-paw',    group: 'Service',  text: 'A grooming room and a walking garden, because the household includes them.' },
    business:  { name: 'Business Suite',     icon: 'i-brief',  group: 'Service',  text: 'Two meeting rooms and a quiet desk, for the days the office is downstairs.' }
  };
  MR.AMENITY_GROUPS = ['Wellness', 'Social', 'Outdoors', 'Service'];

  /* ── developments ────────────────────────────────────────── */
  MR.DEVS = [
    {
      slug: 'halden-house', name: 'Halden House', city: 'New York', cityKey: 'ny', area: 'Tribeca', region: 'New York, NY',
      kind: 'Residential tower', status: 'Now selling', statusKey: 'selling', completion: 'Q3 2027',
      stories: 16, homes: 38, from: 3450000, size: '1,496 – 4,900 sq ft', beds: '2 – 4',
      tag: 'Sixteen stories of hand-set limestone and cast bronze.',
      lead: 'Halden House rises sixteen stories over the Tribeca roofline in limestone cut to the proportions of the street. Thirty-eight residences, each with a corner of light, a gallery long enough to hang a life’s work, and a door that closes with a sound you remember.',
      body: 'Every pier is a single course of limestone, set by hand. Every spandrel is cast bronze that will darken, as bronze does, toward the color of the city. Above the setbacks, a glass pavilion catches the last light of the day and gives it back after dark.',
      team: { 'Architecture': 'Lindqvist Aoki Architects', 'Interiors': 'Hale + Orsini', 'Landscape': 'Verdane Landscape' },
      img: { hero: 'halden', card: 'halden', city: 'city_ny', gallery: ['halden', 'halden-crown', 'halden-facade', 'halden-lobby', 'lobby', 'living', 'terrace'] },
      alt: { 'halden': 'Halden House at blue hour, a sixteen-story limestone and bronze tower, concept render', 'halden-crown': 'The glass pavilion crowning Halden House', 'halden-facade': 'Limestone piers and bronze spandrels', 'halden-lobby': 'The lit lobby of Halden House at street level', 'lobby': 'The entrance lobby, bronze fins and travertine reception', 'living': 'A residence living room at night', 'terrace': 'The roof terrace at dusk' },
      types: ['hh-a', 'hh-b', 'hh-c', 'hh-ph'],
      amenities: ['spa', 'pool', 'fitness', 'lounge', 'dining', 'cinema', 'wine', 'terrace', 'concierge', 'garage', 'pets', 'business'],
      materials: ['Hand-set limestone', 'Cast bronze', 'White oak', 'Honed travertine'],
      facts: [['Stories', '16'], ['Residences', '38'], ['Completion', 'Q3 2027'], ['From', '$3.45M']],
      stack: { kind: 'tower', floors: [[2, 11, ['hh-a', 'hh-b', 'hh-c']], [12, 14, ['hh-b', 'hh-c']], [15, 15, ['hh-ph']], [16, 16, ['hh-ph']]], mix: [0.54, 0.16, 0.30], premium: 0.012, views: ['North · skyline', 'South · street', 'West · river light'] },
      map: { style: 'ny', water: 'west' }
    },
    {
      slug: 'the-averly', name: 'The Averly', city: 'Miami', cityKey: 'mia', area: 'Edgewater', region: 'Miami, FL',
      kind: 'Waterfront tower', status: 'Now selling', statusKey: 'selling', completion: 'Q1 2028',
      stories: 20, homes: 52, from: 2950000, size: '1,496 – 3,392 sq ft', beds: '2 – 4',
      tag: 'Twenty stories of terraced shade, facing the bay.',
      lead: 'Each residence at The Averly is a sequence of terraces stepping toward the water, shaded by deep ivory slabs and softened by planting that climbs with the tower. Fifty-two homes. One long view.',
      body: 'The building is organised around the idea that the best rooms are the ones you can leave open. Every living space gives onto a terrace at least ten feet deep, and every terrace is planted, shaded and lit to be used after dark.',
      team: { 'Architecture': 'Marlowe & Fuentes', 'Interiors': 'Studio Ketteridge', 'Landscape': 'Verdane Landscape' },
      img: { hero: 'averly', card: 'averly', city: 'city_mia', gallery: ['averly', 'averly-slabs', 'averly-pier', 'averly-bay', 'living_charcoal', 'spa', 'terrace'] },
      alt: { 'averly': 'The Averly at sunset, a terraced waterfront tower on the bay, concept render', 'averly-slabs': 'Ivory slabs and planted terraces', 'averly-pier': 'The quay at the foot of the tower', 'averly-bay': 'The bay at golden hour', 'living_charcoal': 'A residence in the charcoal finish scheme', 'spa': 'The lap pool hall', 'terrace': 'The sky deck at dusk' },
      types: ['av-bay', 'av-terrace', 'av-sky'],
      amenities: ['pool', 'spa', 'fitness', 'lounge', 'dining', 'terrace', 'marina', 'concierge', 'garage', 'ev', 'security', 'pets'],
      materials: ['Ivory-cast slabs', 'Low-iron glass', 'Travertine', 'Cast bronze'],
      facts: [['Stories', '20'], ['Residences', '52'], ['Completion', 'Q1 2028'], ['From', '$2.95M']],
      stack: { kind: 'tower', floors: [[3, 18, ['av-bay', 'av-bay', 'av-terrace']], [19, 20, ['av-sky', 'av-sky']]], mix: null, premium: 0.010, views: ['East · open bay', 'South · marina', 'North · skyline'] },
      map: { style: 'mia', water: 'east' }
    },
    {
      slug: 'wren-canyon', name: 'Wren Canyon', city: 'Los Angeles', cityKey: 'la', area: 'Brentwood Hills', region: 'Los Angeles, CA',
      kind: 'Canyon villas', status: 'Preview release', statusKey: 'preview', completion: 'Q4 2027',
      stories: 2, homes: 12, from: 7900000, size: '3,392 – 5,208 sq ft', beds: '4 – 5',
      tag: 'Twelve villas, set into the canyon rather than on it.',
      lead: 'Twelve single-level villas step down a canyon in Brentwood Hills, each with a cantilevered roof plane, a still pool and a long glass room that opens to the evening. Landscape first, architecture second.',
      body: 'Wren Canyon is built from the ground up in the literal sense: terraces cut to follow the contours, retained in travertine, planted with the silver-greens that belong here. Each villa has one idea — a long room, a long roof, a long view — and holds to it.',
      team: { 'Architecture': 'Okafor Reyes Studio', 'Interiors': 'Hale + Orsini', 'Landscape': 'Verdane Landscape' },
      img: { hero: 'wren', card: 'wren', city: 'city_la', gallery: ['wren', 'wren-pavilion', 'wren-pool', 'wren-volume', 'living', 'spa', 'lobby'] },
      alt: { 'wren': 'Wren Canyon villa at dusk with a cantilevered roof and still pool, concept render', 'wren-pavilion': 'The glass living pavilion', 'wren-pool': 'The pool reflecting the villa', 'wren-volume': 'The timber-screened upper volume', 'living': 'A villa living room at night', 'spa': 'The pool hall', 'lobby': 'The gatehouse lobby' },
      types: ['wc-canyon', 'wc-ridge'],
      amenities: ['pool', 'spa', 'garden', 'wine', 'concierge', 'garage', 'ev', 'security'],
      materials: ['Honed travertine', 'Charcoal-stained timber', 'Cast bronze', 'White oak'],
      facts: [['Villas', '12'], ['Levels', '1–2'], ['Completion', 'Q4 2027'], ['From', '$7.9M']],
      stack: { kind: 'terraces', rows: [['Upper terrace', ['wc-ridge', 'wc-ridge', 'wc-canyon', 'wc-canyon']], ['Middle terrace', ['wc-canyon', 'wc-ridge', 'wc-canyon', 'wc-ridge']], ['Lower terrace', ['wc-canyon', 'wc-canyon', 'wc-ridge', 'wc-canyon']]], premium: 0, views: ['West · to the sea', 'South · canyon'] },
      map: { style: 'la', water: null }
    },
    {
      slug: 'quarry-house', name: 'Quarry House', city: 'Austin', cityKey: 'atx', area: 'Zilker', region: 'Austin, TX',
      kind: 'Courtyard residences', status: 'Registering interest', statusKey: 'register', completion: 'Q2 2028',
      stories: 5, homes: 24, from: 1850000, size: '1,152 – 2,268 sq ft', beds: '1 – 3',
      tag: 'Twenty-four residences around a limestone courtyard.',
      lead: 'Quarry House gathers twenty-four residences around a shaded courtyard and a century-old live oak. Cut Texas limestone, deep reveals that keep the afternoon out, and a roof terrace for every top-floor home.',
      body: 'The buildings are arranged like a village rather than a block: three masses of different heights, joined by a stone-paved court with a long reflecting trough at its centre. The oak was here first. The architecture is arranged to keep it company.',
      team: { 'Architecture': 'Okafor Reyes Studio', 'Interiors': 'Studio Ketteridge', 'Landscape': 'Verdane Landscape' },
      img: { hero: 'quarry', card: 'quarry', city: 'city_atx', gallery: ['quarry', 'quarry-oak', 'quarry-entry', 'quarry-tower', 'living_charcoal', 'lobby', 'terrace'] },
      alt: { 'quarry': 'Quarry House, limestone blocks around a courtyard with a live oak, concept render', 'quarry-oak': 'The live oak at the heart of the court', 'quarry-entry': 'The bronze entrance door in a deep limestone reveal', 'quarry-tower': 'The stair tower with its vertical slot windows', 'living_charcoal': 'A residence in the charcoal finish scheme', 'lobby': 'The arrival hall', 'terrace': 'A roof terrace at dusk' },
      types: ['qh-court', 'qh-garden', 'qh-roof'],
      amenities: ['garden', 'pool', 'fitness', 'lounge', 'library', 'terrace', 'concierge', 'ev', 'pets', 'business'],
      materials: ['Cut limestone', 'Cast bronze', 'Oiled oak', 'Lime plaster'],
      facts: [['Residences', '24'], ['Buildings', '3'], ['Completion', 'Q2 2028'], ['From', '$1.85M']],
      stack: { kind: 'tower', floors: [[1, 3, ['qh-court', 'qh-court', 'qh-court', 'qh-court']], [4, 4, ['qh-garden', 'qh-garden', 'qh-garden', 'qh-garden']], [5, 5, ['qh-roof', 'qh-roof', 'qh-roof', 'qh-roof']]], mix: null, premium: 0.02, views: ['Courtyard', 'Street', 'Greenbelt'] },
      map: { style: 'atx', water: 'river' }
    }
  ];

  /* ── residence types ─────────────────────────────────────── */
  MR.TYPES = {
    'hh-a':  { dev: 'halden-house', name: 'Residence A',   sub: 'Two-bedroom through-residence', plan: 't1', beds: 2, baths: '2',   base: 3450000, kind: 'Residence', blurb: 'A through-residence with a north-light living room and a gallery that doubles as a hanging wall.' },
    'hh-b':  { dev: 'halden-house', name: 'Residence B',   sub: 'Three-bedroom through-residence', plan: 't2', beds: 3, baths: '2', base: 5100000, kind: 'Residence', blurb: 'Three bedrooms, a long gallery and a kitchen that opens to a dining room built for twelve.' },
    'hh-c':  { dev: 'halden-house', name: 'Residence C',   sub: 'Four-bedroom corner residence', plan: 't3', beds: 4, baths: '3',   base: 7600000, kind: 'Residence', blurb: 'A corner great room, a scullery, a library and three further bedroom suites.' },
    'hh-ph': { dev: 'halden-house', name: 'The Penthouse', sub: 'Crown penthouse with terrace', plan: 't4', beds: 4, baths: '3', base: 14900000, kind: 'Penthouse', blurb: 'The crown of the building: a forty-foot great room and an 840 sq ft terrace beneath the glass pavilion.' },
    'av-bay':     { dev: 'the-averly', name: 'Bay Residence',     sub: 'Two-bedroom with terrace', plan: 't1', beds: 2, baths: '2',   base: 2950000, kind: 'Residence', blurb: 'Two bedrooms and a terrace that runs the full width of the living room.' },
    'av-terrace': { dev: 'the-averly', name: 'Terrace Residence', sub: 'Three-bedroom with wraparound terrace', plan: 't2', beds: 3, baths: '2', base: 4400000, kind: 'Residence', blurb: 'Three bedrooms, wrapped on two sides by planted terrace.' },
    'av-sky':     { dev: 'the-averly', name: 'Sky Villa',         sub: 'Four-bedroom, full-floor', plan: 't3', beds: 4, baths: '3',   base: 9800000, kind: 'Penthouse', blurb: 'A full floor in the sky: four bedrooms, a corner great room and terraces on every side.' },
    'wc-canyon': { dev: 'wren-canyon', name: 'Canyon Villa', sub: 'Single-level, four-bedroom with media room', plan: 't5', beds: 4, baths: '3', base: 11800000, kind: 'Villa', blurb: 'One long glass room, a media room, and a pool that holds the whole evening sky.' },
    'wc-ridge':  { dev: 'wren-canyon', name: 'Ridge Villa',  sub: 'Four-bedroom villa with terrace', plan: 't3v', beds: 4, baths: '3', base: 7900000, kind: 'Villa', blurb: 'The more compact villa: four bedrooms around a corner great room and a covered terrace.' },
    'qh-court':  { dev: 'quarry-house', name: 'Courtyard Residence', sub: 'One- or two-bedroom', plan: 't6', beds: 2, baths: '1', base: 1850000, kind: 'Residence', blurb: 'A calm, well-proportioned home that opens to the court.' },
    'qh-garden': { dev: 'quarry-house', name: 'Garden Residence',    sub: 'Three-bedroom', plan: 't7', beds: 3, baths: '2',   base: 2950000, kind: 'Residence', blurb: 'Three bedrooms, a deep hall and a kitchen made for people who cook.' },
    'qh-roof':   { dev: 'quarry-house', name: 'Roof House',          sub: 'Three-bedroom with roof terrace', plan: 't2r', beds: 3, baths: '2', base: 4600000, kind: 'Penthouse', blurb: 'The top-floor homes: three bedrooms and a private roof terrace among the canopy.' }
  };

  /* ── units & availability (deterministic) ────────────────── */
  var DIST = { 'halden-house': [0.58, 0.14], 'the-averly': [0.68, 0.12], 'wren-canyon': [0.66, 0.25], 'quarry-house': [0.74, 0.16] };
  MR.dev = function (slug) { return MR.DEVS.filter(function (d) { return d.slug === slug; })[0]; };
  MR.unitsFor = function (slug) {
    var d = MR.dev(slug); if (!d) return [];
    if (d._units) return d._units;
    var r = rngFor(slug), out = [], s = d.stack, dist = DIST[slug];
    function status() { var v = r(); return v < dist[0] ? 'available' : (v < dist[0] + dist[1] ? 'reserved' : 'sold'); }
    var letters = 'ABCDEF';
    if (s.kind === 'tower') {
      s.floors.forEach(function (rng) {
        for (var f = rng[0]; f <= rng[1]; f++) {
          rng[2].forEach(function (tid, i) {
            var t = MR.TYPES[tid], prem = 1 + (s.premium || 0) * (f - rng[0] + (rng[0] - 1)) * 1;
            var price = Math.round(t.base * prem / 5000) * 5000;
            out.push({ id: f + letters[i], dev: slug, floor: f, line: letters[i], row: 'Floor ' + f, type: tid, beds: t.beds, baths: t.baths, price: price,
              status: status(), view: s.views[i % s.views.length] });
          });
        }
      });
    } else {
      s.rows.forEach(function (row, ri) {
        row[1].forEach(function (tid, i) {
          var t = MR.TYPES[tid], price = Math.round(t.base * (1 + 0.035 * (2 - ri)) / 5000) * 5000;
          out.push({ id: 'V' + (ri * 4 + i + 1), dev: slug, floor: 3 - ri, line: letters[i], row: row[0], type: tid, beds: t.beds, baths: t.baths, price: price,
            status: status(), view: s.views[(i + ri) % s.views.length] });
        });
      });
    }
    d._units = out;
    return out;
  };
  MR.summary = function (slug) {
    var u = MR.unitsFor(slug), c = { available: 0, reserved: 0, sold: 0 };
    u.forEach(function (x) { c[x.status]++; });
    c.total = u.length; return c;
  };

  /* ── neighborhoods ──────────────────────────────────────── */
  MR.CATS = { Dining: 'Dining', Culture: 'Culture', Parks: 'Parks', Schools: 'Schools', Transit: 'Transit', Shopping: 'Shopping' };
  MR.HOODS = {
    ny: {
      title: 'Tribeca', line: 'Cast-iron streets, quiet courtyards and a river that is always a short walk away.',
      story: 'Tribeca keeps its own hours. Mornings begin at the bakery on Harrow Street; afternoons belong to galleries in former warehouses; evenings are long, low-lit and unhurried. Halden House sits on a block that still has its cobbles.',
      pois: [
        { n: 1, name: 'Harrow Street Bakery', cat: 'Dining', min: 3, mode: 'walk', x: 44, y: 36 }, { n: 2, name: 'The Corrigan Room', cat: 'Dining', min: 6, mode: 'walk', x: 62, y: 24 },
        { n: 3, name: 'Hollis Gallery', cat: 'Culture', min: 5, mode: 'walk', x: 30, y: 62 }, { n: 4, name: 'Cobble Park', cat: 'Parks', min: 4, mode: 'walk', x: 66, y: 62 },
        { n: 5, name: 'Westside Greenway', cat: 'Parks', min: 8, mode: 'walk', x: 12, y: 40 }, { n: 6, name: 'Franklin Day School', cat: 'Schools', min: 9, mode: 'walk', x: 78, y: 38 },
        { n: 7, name: 'Meridian Street Station', cat: 'Transit', min: 5, mode: 'walk', x: 54, y: 78 }, { n: 8, name: 'Beckett & Vane Market', cat: 'Shopping', min: 4, mode: 'walk', x: 36, y: 22 },
        { n: 9, name: 'Orla Cinema', cat: 'Culture', min: 8, mode: 'walk', x: 82, y: 70 }, { n: 10, name: 'Riverside Tennis Club', cat: 'Parks', min: 10, mode: 'walk', x: 20, y: 80 }
      ]
    },
    mia: {
      title: 'Edgewater', line: 'Open water to the east, a low-rise grain of galleries and cafés to the west.',
      story: 'Edgewater is where the city turns to face the bay. Mornings on the quay, lunch at a counter under an awning, evenings measured by when the light goes pink on the water. The Averly stands at the edge of all of it.',
      pois: [
        { n: 1, name: 'Salt & Linden', cat: 'Dining', min: 4, mode: 'walk', x: 46, y: 34 }, { n: 2, name: 'Ember Table', cat: 'Dining', min: 8, mode: 'walk', x: 30, y: 52 },
        { n: 3, name: 'Calder Arts Warehouse', cat: 'Culture', min: 9, mode: 'walk', x: 24, y: 28 }, { n: 4, name: 'Bayfront Promenade', cat: 'Parks', min: 2, mode: 'walk', x: 70, y: 48 },
        { n: 5, name: 'Mirador Park', cat: 'Parks', min: 7, mode: 'walk', x: 56, y: 70 }, { n: 6, name: 'Coral Pines Academy', cat: 'Schools', min: 12, mode: 'drive', x: 18, y: 72 },
        { n: 7, name: 'Edgewater Metromover', cat: 'Transit', min: 6, mode: 'walk', x: 40, y: 80 }, { n: 8, name: 'Alder & Finch', cat: 'Shopping', min: 6, mode: 'walk', x: 34, y: 40 },
        { n: 9, name: 'Quay Marina', cat: 'Parks', min: 3, mode: 'walk', x: 76, y: 28 }, { n: 10, name: 'Palmetto Playhouse', cat: 'Culture', min: 11, mode: 'drive', x: 14, y: 52 }
      ]
    },
    la: {
      title: 'Brentwood Hills', line: 'Eucalyptus ridgelines, the Pacific on a clear evening, the city a quarter-hour away.',
      story: 'The canyon is quiet in a way the city cannot be. Mornings begin with the trail; afternoons are for the pool; evenings are for the long room, with the sky going lilac above the ridge. The village is ten minutes down the hill.',
      pois: [
        { n: 1, name: 'Sycamore Village Market', cat: 'Shopping', min: 9, mode: 'drive', x: 34, y: 74 }, { n: 2, name: 'Olive & Ash', cat: 'Dining', min: 10, mode: 'drive', x: 50, y: 82 },
        { n: 3, name: 'Hillcrest Gallery', cat: 'Culture', min: 12, mode: 'drive', x: 70, y: 70 }, { n: 4, name: 'Canyon Ridge Trail', cat: 'Parks', min: 4, mode: 'walk', x: 62, y: 28 },
        { n: 5, name: 'Wren Point Overlook', cat: 'Parks', min: 7, mode: 'walk', x: 24, y: 22 }, { n: 6, name: 'Brentwood Hills School', cat: 'Schools', min: 11, mode: 'drive', x: 80, y: 52 },
        { n: 7, name: 'Westwood Metro', cat: 'Transit', min: 16, mode: 'drive', x: 86, y: 84 }, { n: 8, name: 'The Verandah', cat: 'Dining', min: 9, mode: 'drive', x: 18, y: 58 },
        { n: 9, name: 'Mandel Sculpture Garden', cat: 'Culture', min: 13, mode: 'drive', x: 74, y: 40 }, { n: 10, name: 'Pacific Coast Beaches', cat: 'Parks', min: 18, mode: 'drive', x: 10, y: 84 }
      ]
    },
    atx: {
      title: 'Zilker', line: 'Springs, live oaks and a greenbelt at the door; downtown ten minutes away on foot or by bike.',
      story: 'Zilker is Austin at its most unhurried: cold springs, long trails, and music from somewhere you cannot quite see. Quarry House sits on the edge of the greenbelt, close enough to hear the water.',
      pois: [
        { n: 1, name: 'Barton Springs Pool', cat: 'Parks', min: 6, mode: 'walk', x: 40, y: 52 }, { n: 2, name: 'Greenbelt Trailhead', cat: 'Parks', min: 3, mode: 'walk', x: 26, y: 36 },
        { n: 3, name: 'Limestone & Lard', cat: 'Dining', min: 5, mode: 'walk', x: 56, y: 38 }, { n: 4, name: 'Sunday Mill', cat: 'Dining', min: 8, mode: 'walk', x: 66, y: 60 },
        { n: 5, name: 'Lamar Street Records', cat: 'Culture', min: 9, mode: 'walk', x: 74, y: 30 }, { n: 6, name: 'Zilker Elementary', cat: 'Schools', min: 8, mode: 'walk', x: 22, y: 66 },
        { n: 7, name: 'Lakeline Bike Hub', cat: 'Transit', min: 4, mode: 'walk', x: 48, y: 74 }, { n: 8, name: 'South Congress Shops', cat: 'Shopping', min: 14, mode: 'drive', x: 80, y: 78 },
        { n: 9, name: 'Paramount Theatre Annex', cat: 'Culture', min: 12, mode: 'drive', x: 84, y: 18 }, { n: 10, name: 'Town Lake Boardwalk', cat: 'Parks', min: 10, mode: 'walk', x: 62, y: 14 }
      ]
    }
  };

  /* ── offices & people (fictional) ────────────────────────── */
  MR.OFFICES = [
    { city: 'New York', note: 'Sales gallery, by appointment', area: 'Tribeca', phone: '+1 (212) 555-0142', email: 'newyork@masonandrowe.example' },
    { city: 'Miami', note: 'Sales gallery, by appointment', area: 'Edgewater', phone: '+1 (305) 555-0168', email: 'miami@masonandrowe.example' },
    { city: 'Los Angeles', note: 'Studio & sales gallery, by appointment', area: 'Brentwood Hills', phone: '+1 (310) 555-0127', email: 'losangeles@masonandrowe.example' },
    { city: 'Austin', note: 'Sales gallery, by appointment', area: 'Zilker', phone: '+1 (512) 555-0183', email: 'austin@masonandrowe.example' }
  ];
  MR.PEOPLE = [
    { name: 'Eleanor Mason', role: 'Co-founder, Craft & Construction', init: 'EM', text: 'Third-generation stone mason. Believes a building should be able to be repaired by whoever inherits it.' },
    { name: 'Julian Rowe', role: 'Co-founder, Architecture & Design', init: 'JR', text: 'Architect by training, editor by temperament. Draws the section first, then the facade.' },
    { name: 'Priya Venkataraman', role: 'Director of Development', init: 'PV', text: 'Leads site selection and delivery across all four markets.' },
    { name: 'Tomás Alvarenga', role: 'Head of Interiors', init: 'TA', text: 'Specifies every material, then samples it again.' },
    { name: 'Hannah Whitcombe', role: 'Director, Client Advisory', init: 'HW', text: 'Hosts every private viewing and answers every question twice.' },
    { name: 'Daniel Osei', role: 'Head of Sustainability', init: 'DO', text: 'Makes the quiet decisions that make buildings last.' }
  ];

  MR.CONCEPT_LINE = 'Self-initiated concept project by Rovard Studios. Mason & Rowe is a fictional company; developments, prices, availability and people are illustrative.';
})();
