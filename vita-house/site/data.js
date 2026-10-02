/* ==========================================================================
   VITA HOUSE — fictional content & availability engine
   Every provider, address, price and quote here is invented for a concept project.
   ========================================================================== */
(function () {
  'use strict';
  const VH = (window.VH = window.VH || {});

  /* ---------- safe storage ---------- */
  VH.store = {
    get(k, d) { try { const v = localStorage.getItem('vh.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('vh.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del(k) { try { localStorage.removeItem('vh.' + k); } catch (e) { /* ignore */ } }
  };

  /* ---------- formatting ---------- */
  const pad = n => String(n).padStart(2, '0');
  VH.fmt = {
    key: d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    parse: k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); },
    time: t => { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; return `${((h + 11) % 12) + 1}:${pad(m)} ${ap}`; },
    date: (d, o) => (typeof d === 'string' ? VH.fmt.parse(d) : d).toLocaleDateString('en-US', o || { weekday: 'long', month: 'long', day: 'numeric' }),
    short: d => VH.fmt.date(d, { weekday: 'short', month: 'short', day: 'numeric' }),
    rel(k) {
      const t = VH.fmt.parse(VH.fmt.key(new Date())), d = VH.fmt.parse(k), diff = Math.round((d - t) / 864e5);
      if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow'; if (diff === -1) return 'Yesterday';
      if (diff > 1 && diff < 7) return VH.fmt.date(d, { weekday: 'long' });
      return VH.fmt.date(d, { weekday: 'short', month: 'short', day: 'numeric' });
    },
    plus: (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; },
    money: n => '$' + Number(n).toFixed(2).replace(/\.00$/, '')
  };

  /* ---------- services ---------- */
  VH.services = [
    { id: 'primary', name: 'Primary care', icon: 'stethoscope', mins: '30–45 min', mode: 'In person or video', price: 'Covered by most insurance plans', blurb: 'A clinician who knows you: your history, your goals, your week. For check-ins, concerns and everything in between.', long: 'Your first stop for most things. We take time to listen, explain in plain language, and coordinate with specialists when you need one.', points: ['Same-day messaging with your care team', 'Referrals and coordination when you need a specialist', 'Care plans written in plain language'] },
    { id: 'exam', name: 'Annual wellness exam', icon: 'checklist', mins: '60 min', mode: 'In person', price: 'Included with membership', blurb: 'A relaxed, unhurried yearly visit to look ahead: what is going well, what to keep an eye on, what you would like to work on.', long: 'Longer than a standard visit, so there is room for questions. You leave with a one-page summary and clear next steps.', points: ['Time to talk, not just to be examined', 'Screening suggestions based on your age and history', 'A one-page summary you can actually use'] },
    { id: 'labs', name: 'Labs & screenings', icon: 'flask', mins: '15–20 min', mode: 'In person', price: 'Included with membership', blurb: 'Convenient blood work and routine screenings, with results in your dashboard and a human to walk you through them.', long: 'Walk-in friendly and quick. Results appear in your dashboard as soon as they are ready, with notes from your clinician.', points: ['On-site collection at every house', 'Results in your dashboard, explained in plain language', 'Follow-up booking in one tap'] },
    { id: 'mental', name: 'Mental wellness', icon: 'smile', mins: '50 min', mode: 'In person or video', price: 'Member rates available', blurb: 'Talk therapy and counseling with licensed clinicians, in person or by video, with evening and weekend times.', long: 'A calm, private space to talk. Sessions are scheduled around your life, and you can message your therapist between visits.', points: ['Evening and weekend appointments', 'Secure messaging between sessions', 'Coordinated with your primary care team, only if you choose'] },
    { id: 'nutrition', name: 'Nutrition', icon: 'apple', mins: '45 min', mode: 'In person or video', price: 'Member rates available', blurb: 'Practical, judgement-free guidance from registered dietitians, built around your schedule, budget and tastes.', long: 'No rigid plans or food rules. We start with what you already eat and what you would like to feel like day to day.', points: ['Plans that fit real kitchens and real budgets', 'Shopping lists and simple recipes', 'Follow-ups by message or video'] },
    { id: 'womens', name: "Women's health", icon: 'heart', mins: '40 min', mode: 'In person or video', price: 'Covered by most insurance plans', blurb: 'Routine and preventative care, family planning conversations and support through every stage of life.', long: 'Respectful, unhurried care from clinicians who are glad to answer the questions you thought were too small to ask.', points: ['Routine screenings and check-ups', 'Planning conversations at your pace', 'Female and nonbinary-affirming clinicians available'] },
    { id: 'family', name: 'Family & pediatrics', icon: 'baby', mins: '30 min', mode: 'In person or video', price: 'Covered by most insurance plans', blurb: 'One house for the whole household: well-child visits, school forms, and care coordinated for every age.', long: 'Playful exam rooms, calm waiting spaces and one calendar for the whole family.', points: ['Well-child visits and school forms', 'Shared family calendar and reminders', 'Back-to-back appointments for siblings'] },
    { id: 'vaccines', name: 'Vaccines & travel health', icon: 'syringe', mins: '15 min', mode: 'In person', price: 'Covered by most insurance plans', blurb: 'Seasonal and routine immunizations and pre-trip planning, with walk-in windows at every location.', long: 'Quick, friendly and well organised. Your immunization record lives in your dashboard.', points: ['Walk-in windows at every house', 'Pre-trip planning', 'Digital immunization record'] },
    { id: 'sleep', name: 'Sleep & recovery', icon: 'moon', mins: '45 min', mode: 'In person or video', price: 'Member rates available', blurb: 'A supportive look at your sleep habits, energy and routines, with small changes that are easy to keep.', long: 'We start with how you feel and how you live. Together we choose one or two gentle changes to try.', points: ['Routine and environment review', 'Simple, trackable experiments', 'Follow-ups by message'] }
  ];

  /* ---------- locations ---------- */
  const HOURS = ['Mon–Fri · 7:30 AM – 7:00 PM', 'Saturday · 9:00 AM – 2:00 PM', 'Sunday · Virtual visits only'];
  VH.locations = [
    { id: 'austin', name: 'Vita House East Austin', city: 'Austin', state: 'TX', addr: '1214 Juniper Row', zip: '78702', phone: '(512) 555-0142', lat: 30.27, lon: -97.72, dist: '0.8 mi', amen: ['Step-free entrance', 'On-site lab', 'Bike parking', 'Quiet room'], note: 'Corner of Juniper &amp; 12th. Free 2-hour parking behind the house.', seed: 1 },
    { id: 'denver', name: 'Vita House Highlands', city: 'Denver', state: 'CO', addr: '3380 Alder Street', zip: '80211', phone: '(303) 555-0178', lat: 39.74, lon: -104.99, dist: '2.4 mi', amen: ['Step-free entrance', 'On-site lab', 'Lactation room', 'Near transit'], note: 'Two blocks from the Alder light-rail stop.', seed: 2 },
    { id: 'brooklyn', name: 'Vita House Fort Greene', city: 'Brooklyn', state: 'NY', addr: '218 Marlowe Avenue', zip: '11205', phone: '(718) 555-0129', lat: 40.69, lon: -73.98, dist: '1.1 mi', amen: ['Step-free entrance', 'Near transit', 'Quiet room', 'Lactation room'], note: 'Ground-floor brownstone with a green door. Look for the arch.', seed: 3 },
    { id: 'atlanta', name: 'Vita House Inman Park', city: 'Atlanta', state: 'GA', addr: '640 Linden Court NE', zip: '30307', phone: '(404) 555-0163', lat: 33.75, lon: -84.39, dist: '1.6 mi', amen: ['Step-free entrance', 'On-site lab', 'Bike parking', 'Near transit'], note: 'Beside the BeltLine trail entrance.', seed: 4 },
    { id: 'portland', name: 'Vita House Alberta', city: 'Portland', state: 'OR', addr: '2905 NE Willow Street', zip: '97211', phone: '(503) 555-0116', lat: 45.52, lon: -122.68, dist: '3.0 mi', amen: ['Step-free entrance', 'Bike parking', 'On-site lab', 'Quiet room'], note: 'Covered bike racks at the front door.', seed: 5 },
    { id: 'chicago', name: 'Vita House West Loop', city: 'Chicago', state: 'IL', addr: '915 Fulton Terrace', zip: '60607', phone: '(312) 555-0191', lat: 41.88, lon: -87.65, dist: '1.9 mi', amen: ['Step-free entrance', 'On-site lab', 'Near transit', 'Lactation room'], note: 'Third floor, elevator from the courtyard.', seed: 6 }
  ].map(l => ({ ...l, hours: HOURS }));
  VH.virtual = { id: 'virtual', name: 'Video visit', city: 'From anywhere', state: '', addr: 'Join from your phone or computer', virtual: true };
  VH.loc = id => id === 'virtual' ? VH.virtual : VH.locations.find(l => l.id === id);

  /* ---------- providers ---------- */
  VH.providers = [
    { id: 'okafor', name: 'Dr. Amara Okafor', short: 'Dr. Okafor', creds: 'MD', role: 'Primary care · Internal medicine', services: ['primary', 'exam', 'labs'], locations: ['austin', 'brooklyn'], langs: ['English', 'Igbo'], years: 12, accepting: true, busy: .55,
      look: { skin: 's5', hair: 'black', style: 'curly', cloth: '#3F5C47', outfit: 'coat', steth: true, bg: 'sage' },
      quote: 'My job is to explain things so well that you could explain them to a friend.',
      bio: 'Dr. Okafor believes the most useful thing a doctor can offer is time. She leads the East Austin house and loves helping new patients map out a year of care that fits their life, not the other way around.',
      focus: ['Preventative care', 'Long-term health planning', 'Care for busy professionals'], beyond: 'Runs a community walking club on Saturday mornings.' },
    { id: 'reyes', name: 'Dr. Daniel Reyes', short: 'Dr. Reyes', creds: 'DO', role: 'Family medicine', services: ['primary', 'family', 'exam', 'vaccines'], locations: ['austin', 'denver'], langs: ['English', 'Spanish'], years: 9, accepting: true, busy: .5,
      look: { skin: 's3', hair: 'black', style: 'short', cloth: '#C4714C', outfit: 'coat', steth: true, glasses: true, bg: 'blush' },
      quote: 'Good care is a conversation that continues between visits.',
      bio: 'Dr. Reyes cares for patients from toddlers to grandparents, often in the same family. He is known for explaining each step before it happens and for remembering the names of everyone\'s pets.',
      focus: ['Whole-family care', 'Preventative screenings', 'Bilingual visits'], beyond: 'Weekend soccer coach and enthusiastic home cook.' },
    { id: 'raman', name: 'Priya Raman', short: 'Priya Raman', creds: 'NP', role: "Women's health · Primary care", services: ['womens', 'primary', 'exam'], locations: ['atlanta', 'brooklyn'], langs: ['English', 'Tamil', 'Hindi'], years: 8, accepting: true, busy: .6,
      look: { skin: 's4', hair: 'black', style: 'long', cloth: '#E8BC5E', outfit: 'knit', bg: 'sage2' },
      quote: 'No question is too small, and no appointment is too short for kindness.',
      bio: 'Priya provides routine and preventative care with a calm, practical approach. Patients describe her appointments as unhurried and refreshingly clear.',
      focus: ["Women's health", 'Routine screenings', 'Planning conversations'], beyond: 'Keeps a patient-friendly balcony herb garden.' },
    { id: 'bell', name: 'Dr. Marcus Bell', short: 'Dr. Bell', creds: 'PsyD', role: 'Mental wellness · Clinical psychology', services: ['mental'], locations: ['denver', 'atlanta', 'virtual'], langs: ['English'], years: 14, accepting: true, busy: .4,
      look: { skin: 's6', hair: 'black', style: 'beard', cloth: '#4D6F54', outfit: 'knit', bg: 'honey' },
      quote: 'You do not have to be at your worst to deserve support.',
      bio: 'Dr. Bell works with young professionals navigating stress, transitions and burnout. His sessions are warm, structured and always paced by you.',
      focus: ['Stress and burnout', 'Life transitions', 'Evening appointments'], beyond: 'Plays upright bass in a community jazz trio.' },
    { id: 'kobayashi', name: 'Hana Kobayashi', short: 'Hana Kobayashi', creds: 'RD', role: 'Nutrition · Registered dietitian', services: ['nutrition', 'sleep'], locations: ['portland', 'chicago', 'virtual'], langs: ['English', 'Japanese'], years: 7, accepting: true, busy: .65,
      look: { skin: 's1', hair: 'black', style: 'bob', cloth: '#C9D7C0', outfit: 'knit', bg: 'blush' },
      quote: 'Food should be one of the easy, enjoyable parts of your week.',
      bio: 'Hana builds flexible, no-guilt eating approaches around real schedules and real grocery budgets. She will happily help you with a one-pan dinner.',
      focus: ['Everyday nutrition', 'Meal planning', 'Sleep habits'], beyond: 'Ceramics studio on weekends. Her mugs are excellent.' },
    { id: 'vasquez', name: 'Dr. Elena Vasquez', short: 'Dr. Vasquez', creds: 'MD', role: 'Pediatrics', services: ['family', 'vaccines', 'primary'], locations: ['denver', 'chicago'], langs: ['English', 'Spanish'], years: 11, accepting: false, busy: .3,
      look: { skin: 's2', hair: 'auburn', style: 'bun', cloth: '#C4714C', outfit: 'coat', steth: true, bg: 'sand' },
      quote: 'Children can tell when a grown-up is really listening.',
      bio: 'Dr. Vasquez is a pediatrician with a gift for putting little ones at ease. Her exam room has a window seat, a sticker wall and zero white-coat nerves.',
      focus: ['Well-child visits', 'Adolescent care', 'Family coordination'], beyond: 'Reads picture books out loud in at least three voices.' },
    { id: 'whitaker', name: 'Jordan Whitaker', short: 'Jordan Whitaker', creds: 'PA-C', role: 'Same-day care · Primary care', services: ['primary', 'labs', 'vaccines'], locations: ['portland', 'atlanta', 'virtual'], langs: ['English'], years: 6, accepting: true, busy: .7,
      look: { skin: 's2', hair: 'blond', style: 'side', cloth: '#3F5C47', outfit: 'knit', glasses: true, bg: 'sage' },
      quote: 'When something comes up, you should be able to get care that day.',
      bio: 'Jordan runs our same-day clinic, helping patients who need an appointment without the wait. Efficient, friendly and a clear communicator.',
      focus: ['Same-day appointments', 'Routine labs and vaccines', 'Virtual visits'], beyond: 'Trail runner. Keeps snacks in the exam room for everyone.' },
    { id: 'feldman', name: 'Dr. Naomi Feldman', short: 'Dr. Feldman', creds: 'MD', role: 'Preventive medicine · Sleep', services: ['sleep', 'exam', 'primary'], locations: ['chicago', 'austin'], langs: ['English', 'Hebrew'], years: 18, accepting: true, busy: .45,
      look: { skin: 's1', hair: 'grey', style: 'bob', cloth: '#E8BC5E', outfit: 'coat', steth: true, bg: 'honey' },
      quote: 'Prevention is mostly about small things done kindly and consistently.',
      bio: 'Dr. Feldman has spent nearly two decades helping patients look ahead, with a particular interest in sleep, energy and the daily habits that add up.',
      focus: ['Preventive planning', 'Sleep and recovery', 'Healthy habits'], beyond: 'Keeps bees on the roof of her apartment building.' }
  ];
  VH.prov = id => VH.providers.find(p => p.id === id);
  VH.svc = id => VH.services.find(s => s.id === id);
  VH.provPortrait = (p, shape) => VH.portrait({ ...p.look, shape, alt: `Illustrated portrait of ${p.name}` });

  /* ---------- plans ---------- */
  VH.plans = [
    { id: 'open', name: 'Open Door', price: 0, per: '', who: 'Pay per visit', desc: 'Visit when you need us. Insurance is accepted at every house.', feats: ['Book any visit, in person or by video', 'Insurance accepted at every location', 'Patient dashboard and secure messaging', 'Visit summaries within 24 hours'] },
    { id: 'everyday', name: 'Everyday', price: 49, per: '/month', who: 'For adults', featured: true, desc: 'A steady, proactive relationship with your care team.', feats: ['Unlimited virtual visits', 'Annual wellness exam included', 'Same-day messaging with your care team', 'Routine labs at no extra cost', 'Priority evening and weekend booking', 'Member rates on nutrition and mental wellness'] },
    { id: 'house', name: 'Whole House', price: 129, per: '/month', who: 'Up to 4 people', desc: 'One care coordinator, one calendar, one simple bill.', feats: ['Everything in Everyday for up to four members', 'Pediatric and family visits included', 'A dedicated family care coordinator', 'Shared calendar and reminders', 'School and sports forms within 48 hours'] }
  ];
  VH.compare = [
    ['Insurance accepted', [1, 1, 1]], ['Book in person or video', [1, 1, 1]], ['Patient dashboard & messaging', [1, 1, 1]],
    ['Unlimited virtual visits', [0, 1, 1]], ['Annual wellness exam included', [0, 1, 1]], ['Routine labs included', [0, 1, 1]],
    ['Priority evening & weekend booking', [0, 1, 1]], ['Pediatric & family visits', [0, 0, 1]], ['Dedicated care coordinator', [0, 0, 1]], ['Covers up to 4 people', [0, 0, 1]]
  ];

  /* ---------- testimonials (fictional) ---------- */
  VH.quotes = [
    { text: 'I booked on my phone during a lunch break. Before I had finished my coffee I had a time, a name and a reminder.', name: 'Maya B.', where: 'Austin, TX', look: { skin: 's3', hair: 'brown', style: 'long', cloth: '#C4714C', outfit: 'knit', bg: 'blush' } },
    { text: 'For the first time our whole family is under one roof, and that is not just a figure of speech.', name: 'The Alvarez-Brooks family', where: 'Denver, CO', look: { skin: 's2', hair: 'black', style: 'bun', cloth: '#4D6F54', outfit: 'knit', bg: 'sage' } },
    { text: 'Nothing felt rushed. My provider explained things in plain language and wrote it all down for me afterwards.', name: 'Devon T.', where: 'Brooklyn, NY', look: { skin: 's5', hair: 'black', style: 'short', cloth: '#E8BC5E', outfit: 'knit', bg: 'sand' } }
  ];

  /* ---------- resources (fictional editorial) ---------- */
  VH.articles = [
    { id: 'a1', cat: 'Prevention', mins: 5, title: 'A gentler way to think about your annual checkup', ex: 'Why a yearly visit works best as a conversation, and how to make the most of the time.' },
    { id: 'a2', cat: 'Using Vita House', mins: 4, title: 'Five questions worth bringing to your first visit', ex: 'A short, friendly list to help you get what you need from a new relationship with a care team.' },
    { id: 'a3', cat: 'Sleep', mins: 6, title: "Building a wind-down routine you'll actually keep", ex: 'Tiny evening rituals, easy to repeat on the nights that go sideways.' },
    { id: 'a4', cat: 'Nutrition', mins: 5, title: 'Eating well on a busy week: a calm approach', ex: 'Five-minute planning habits that take pressure off weeknights.' },
    { id: 'a5', cat: 'Family', mins: 4, title: 'How to talk to your kids about their next visit', ex: 'Simple, honest words that help little ones feel prepared and brave.' },
    { id: 'a6', cat: 'Movement', mins: 3, title: 'Small movement, big difference: ten-minute resets', ex: 'Short routines you can do between meetings, in the kitchen or on a stoop.' },
    { id: 'a7', cat: 'Prevention', mins: 4, title: 'What happens at a lab visit (and how to prepare)', ex: 'A walkthrough from check-in to results, so there are no surprises.' },
    { id: 'a8', cat: 'Mind', mins: 7, title: 'Making space for your mind: a first-timer’s guide to talking with someone', ex: 'What a first session is like, what to share and what to expect afterwards.' }
  ];

  /* ---------- availability engine (deterministic, no backend) ---------- */
  function h32(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }
  VH.hash = h32;
  VH.appts = () => VH.store.get('appts', []);

  /* all candidate times for a given weekday and mode */
  function dayTimes(dow, mode) {
    const out = []; const add = (a, b) => { for (let m = a * 60; m <= b * 60; m += 30) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`); };
    if (dow === 0) { if (mode === 'virtual') add(10, 13.5); }
    else if (dow === 6) { add(9, 13.5); }
    else { add(8, 17.5); if (dow === 2 || dow === 4 || mode === 'virtual') add(18, 18.5); }
    return out;
  }
  VH.slots = (providerId, dateKey, mode = 'in-person') => {
    const p = VH.prov(providerId); if (!p) return [];
    const d = VH.fmt.parse(dateKey), now = new Date(), isToday = VH.fmt.key(now) === dateKey;
    const booked = new Set(VH.appts().filter(a => a.providerId === providerId && a.date === dateKey && a.status !== 'cancelled').map(a => a.time));
    const cutoff = now.getHours() * 60 + now.getMinutes() + 90;
    return dayTimes(d.getDay(), mode === 'video' || mode === 'virtual' ? 'virtual' : 'in-person').filter(t => {
      const [h, m] = t.split(':').map(Number);
      if (isToday && h * 60 + m < cutoff) return false;
      if (booked.has(t)) return false;
      return h32(providerId + dateKey + t) < p.busy;
    });
  };
  VH.nextAvail = (providerId, mode = 'in-person', from = new Date()) => {
    for (let i = 0; i < 21; i++) {
      const k = VH.fmt.key(VH.fmt.plus(from, i)), s = VH.slots(providerId, k, mode);
      if (s.length) return { date: k, time: s[0], label: `${VH.fmt.rel(k)}, ${VH.fmt.time(s[0])}` };
    }
    return null;
  };

  /* ---------- demo patient + seeded appointments ---------- */
  VH.patient = { first: 'Maya', last: 'Bennett', email: 'maya.bennett@example.com', phone: '(512) 555-0107', dob: '1996-04-12', home: 'austin', plan: 'everyday', since: 'March 2026', memberId: 'VH-2026-04412' };
  const wk = d => { while ([0, 6].includes(d.getDay())) d = VH.fmt.plus(d, 1); return d; };
  VH.seedAppts = () => {
    const t = new Date(); const K = d => VH.fmt.key(d);
    return [
      { id: 's1', serviceId: 'primary', providerId: 'okafor', locationId: 'austin', date: K(wk(VH.fmt.plus(t, 3))), time: '09:30', status: 'upcoming', mode: 'in-person', reason: 'Check-in and a question about low energy', seed: true },
      { id: 's2', serviceId: 'nutrition', providerId: 'kobayashi', locationId: 'virtual', date: K(wk(VH.fmt.plus(t, 13))), time: '12:30', status: 'upcoming', mode: 'video', reason: 'Meal planning for a busy work season', seed: true },
      { id: 'h1', serviceId: 'exam', providerId: 'okafor', locationId: 'austin', date: K(wk(VH.fmt.plus(t, -41))), time: '10:00', status: 'completed', mode: 'in-person', reason: 'Annual wellness exam', seed: true, summary: true },
      { id: 'h2', serviceId: 'mental', providerId: 'bell', locationId: 'virtual', date: K(wk(VH.fmt.plus(t, -83))), time: '18:00', status: 'completed', mode: 'video', reason: 'Introductory session', seed: true, summary: true },
      { id: 'h3', serviceId: 'labs', providerId: 'okafor', locationId: 'austin', date: K(wk(VH.fmt.plus(t, -41))), time: '09:00', status: 'completed', mode: 'in-person', reason: 'Routine bloodwork', seed: true, summary: true },
      { id: 'h4', serviceId: 'vaccines', providerId: 'whitaker', locationId: 'portland', date: K(wk(VH.fmt.plus(t, -170))), time: '16:30', status: 'cancelled', mode: 'in-person', reason: 'Seasonal immunization', seed: true }
    ];
  };
  VH.allAppts = () => VH.emptyMode ? [] : (VH.store.get('empty', false) ? [] : VH.seedAppts()).concat(VH.appts()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  /* .ics calendar file for a confirmed appointment */
  VH.ics = a => {
    const d = a.date.replace(/-/g, ''), [h, m] = a.time.split(':').map(Number), end = h * 60 + m + 45;
    const t1 = `${d}T${pad(h)}${pad(m)}00`, t2 = `${d}T${pad(Math.floor(end / 60))}${pad(end % 60)}00`;
    const p = VH.prov(a.providerId), l = VH.loc(a.locationId), s = VH.svc(a.serviceId);
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vita House concept//EN', 'BEGIN:VEVENT', `UID:${a.id}@vita-house.example`, `DTSTAMP:${VH.fmt.key(new Date()).replace(/-/g, '')}T000000`,
      `DTSTART:${t1}`, `DTEND:${t2}`, `SUMMARY:${s.name} with ${p.name}`, `LOCATION:${l.virtual ? 'Video visit' : `${l.name}, ${l.addr}, ${l.city} ${l.state}`}`,
      'DESCRIPTION:Concept project: this is a fictional appointment.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  };
  VH.download = (name, text, type = 'text/plain') => {
    const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  /* ---------- render helpers shared by pages ---------- */
  VH.cards = {
    service: (s, i = 0) => `<a class="card card-lift service-card reveal" href="services.html#${s.id}" style="transition-delay:${i * 60}ms">
        <span class="icon-chip ${['', 'clay', 'honey', ''][i % 4]}">${VH.icon(s.icon, 'icon-lg')}</span>
        <h3>${s.name}</h3><p>${s.blurb}</p>
        <span class="more">Learn more ${VH.icon('arrow-right')}</span></a>`,
    provider: (p, i = 0, link = true) => {
      const n = VH.nextAvail(p.id, p.locations[0] === 'virtual' ? 'video' : 'in-person');
      const inner = `<div class="portrait-wrap">${VH.portrait({ ...p.look, alt: `Illustrated portrait of ${p.name}` })}${n ? `<span class="next"><span class="dot"></span>${n.label}</span>` : ''}</div>
        <div><h3>${p.name}, ${p.creds}</h3><p class="role">${p.role}</p></div>
        <div class="tags"><span class="badge ${p.accepting ? 'badge-ok' : ''}">${p.accepting ? 'Welcoming new patients' : 'Waitlist only'}</span></div>`;
      return link ? `<a class="provider-card reveal" href="provider.html?id=${p.id}" style="transition-delay:${i * 70}ms">${inner}</a>` : `<div class="provider-card">${inner}</div>`;
    },
    location: (l, i = 0) => `<article class="card location-card reveal" style="transition-delay:${i * 60}ms">
        <div class="map-tile">${VH.mapTile(l.seed)}</div>
        <div><h3>${l.name}</h3><address>${l.addr}<br>${l.city}, ${l.state} ${l.zip}</address></div>
        <div class="meta"><span>${VH.icon('clock')} ${l.hours[0].replace('Mon–Fri · ', 'Weekdays ')}</span><span>${VH.icon('phone')} ${l.phone}</span></div>
        <div class="row"><a class="btn btn-primary btn-sm" href="book.html?location=${l.id}">Book here</a><a class="btn btn-soft btn-sm" href="locations.html#${l.id}">Details</a></div></article>`,
    article: (a, i = 0) => `<a class="article-card reveal" href="resources.html#${a.id}" style="transition-delay:${i * 50}ms"><div class="thumb">${VH.thumb(i + 2, a.title)}</div>
        <div class="meta"><span class="badge">${a.cat}</span><span>${a.mins} min read</span></div><h3>${a.title}</h3><p class="muted small">${a.ex}</p></a>`,
    quote: (q, i = 0) => `<figure class="card quote reveal" style="transition-delay:${i * 80}ms"><div class="stars" role="img" aria-label="5 out of 5 stars">${'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + VH.icons.star + '</svg>'.repeat(1)}${('<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + VH.icons.star + '</svg>').repeat(4)}</div>
        <blockquote>“${q.text}”</blockquote>
        <figcaption class="who"><span class="avatar">${VH.portrait({ ...q.look, shape: 'circle', alt: '' })}</span><span><b>${q.name}</b><span class="muted">${q.where} · fictional patient</span></span></figcaption></figure>`
  };
})();
