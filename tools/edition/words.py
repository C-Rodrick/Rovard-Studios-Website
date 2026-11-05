# -*- coding: utf-8 -*-
"""Creative Edition: every word on the site, in English and French.

Voice: confident, curious, plain. No invented clients, awards, statistics or results.
Edit a line here, then run  python tools/edition/build.py
"""

SITE = {
    'url': 'https://rovardstudio.com',
    'email': 'hello@rovardstudio.com',
    'formspree': 'https://formspree.io/f/xvkgepeo',
    'issue': '001',
    'year': '2026',
}

# Projects that are self-initiated concepts (same list as the earlier V2 work).
CONCEPT = {
    'vita-house', 'northstar-capital', 'mason-and-rowe', 'proxima-exchange', 'afaa-pay', 'vita-house-care',
    'northstar-capital-website', 'mason-and-rowe-residences', 'proxima-exchange-films', 'northstar-capital-ad',
}

# Six featured stories on the home page, in order, with the layout each one uses
# and the picture (cover, or a gallery number) that leads the spread.
FEATURES = [
    dict(slug='green-blueprint', layout='bleed', img=5, extra=[2]),
    dict(slug='jojo-foods', layout='offset', img=0, extra=[5]),
    dict(slug='proxima-exchange-films', layout='film', img=4),
    dict(slug='mason-and-rowe', layout='split', img=0, extra=[4]),
    dict(slug='bitefort', layout='interrupt', img=3, extra=[2]),
    dict(slug='linkrithm', layout='triptych', img=1, extra=[5, 6]),
]

# Pictures that rotate inside the hero headline: (slug, gallery number, 0 = cover)
HERO_IMAGES = [
    ('design-eigen', 6), ('jojo-foods', 0), ('green-blueprint', 2), ('proxima-exchange-films', 4),
    ('bitefort', 3), ('book-cover-design', 5), ('linkrithm', 9), ('mason-and-rowe', 4),
]
COVER_IMAGE = ('design-eigen', 6)

CATEGORY_ORDER = ['Brand Identity Design', 'Social Media Design', 'UI Design', 'Packaging', 'Motion Design']
CATEGORY = {
    'en': {'Brand Identity Design': 'Brand identity', 'Social Media Design': 'Social media',
           'UI Design': 'UI design', 'Packaging': 'Packaging', 'Motion Design': 'Motion'},
    'fr': {'Brand Identity Design': 'Identité de marque', 'Social Media Design': 'Réseaux sociaux',
           'UI Design': 'Design d’interface', 'Packaging': 'Emballage', 'Motion Design': 'Motion design'},
}

T = {
 'en': {
  'lang': 'en', 'other': 'fr', 'other_label': 'Français', 'other_short': 'FR', 'short': 'EN',
  'home_title': 'Rovard Studios — The Creative Edition. Independent creative studio, Canada',
  'home_desc': 'Rovard Studios is an independent creative studio in Canada. Brand identity, social media, UI, packaging, motion and web design for ideas that refuse to look ordinary.',
  'skip': 'Skip to content',
  'issue': 'Issue', 'edition': 'The Creative Edition',
  'nav': [('works', 'Works'), ('studio', 'Studio'), ('departments', 'Services'), ('archive', 'Archive'), ('contact', 'Contact')],
  'contents': 'Contents', 'close': 'Close',
  'toc_title': 'In this issue',
  'toc': [
   ('cover', 'The edition opening', 'Cover'),
   ('idea', 'The idea', 'We make ideas look different'),
   ('works', 'Selected works', 'Six stories'),
   ('studio', 'The studio', 'A point of view'),
   ('departments', 'Departments', 'What we make'),
   ('archive', 'The archive', 'Every project'),
   ('notes', 'Field notes', 'How we work'),
   ('contact', 'Open projects', 'Start one'),
  ],
  'cover_kicker': 'Rovard Studios / Independent creative studio',
  'cover_where': 'Canada · Worldwide',
  'cover_line': 'Designing ideas.<br><em>Shaping visual culture.</em>',
  'cover_inside': 'Inside this issue',
  'cover_caption': 'On the cover',
  'sticker': 'New<br>issue',
  'hero_label': 'The idea',
  'hero_words': ['We', 'make', 'ideas', 'look', 'different.'],
  'hero_aside': '(verb) to give form to a thought',
  'hero_lede': 'We explore ideas, develop visual identities and create experiences through design, motion and digital expression.',
  'hero_cta': 'Read the selected works',
  'start': 'Start a project',
  'fig': 'Fig.',
  'band': ['A studio for ideas', 'that refuse to look ordinary', 'Creative thinking', 'Unexpected execution'],
  'works_label': 'Selected works',
  'works_title': 'Six stories <em>from the archive.</em>',
  'works_intro': 'Identity, packaging, motion and interface work, chosen for how differently each one solves its problem.',
  'no': 'No.', 'read_story': 'Read the story', 'concept': 'Self-initiated concept',
  'all_works': 'Open the full archive',
  'projects': 'projects',
  'studio_label': 'The studio',
  'studio_statement': 'We don’t design for <s>decoration</s>.<br>We design for <em>perception.</em>',
  'studio_p1': 'From identity systems to digital interfaces, every decision is made to help a business communicate with confidence and move with intention.',
  'studio_p2': 'We look beyond the immediate deliverable. We ask what needs to be understood, who needs to believe it and what the design needs to make possible.',
  'principles_label': 'A small glossary',
  'principles': [
   ('Clarity', 'n.', 'Making the important thing unmistakable.'),
   ('Character', 'n.', 'A visual signature people can recognise.'),
   ('Craft', 'n.', 'Obsessing over the details that change perception.'),
   ('Consistency', 'n.', 'Building systems, not disconnected assets.'),
  ],
  'dept_label': 'Departments',
  'dept_title': 'One studio. <em>Many ways to move.</em>',
  'dept_intro': 'Strategy, visual design and digital thinking in one connected practice.',
  'departments': [
   ('Brand identity', 'Brand Identity Design', 'Identity systems that make clear what you stand for, and stay consistent wherever the brand appears.'),
   ('Social media', 'Social Media Design', 'Campaigns and content systems that keep a brand recognisable while giving every post a reason to exist.'),
   ('UI design', 'UI Design', 'Interfaces that turn complex products and services into clear, confident digital experiences.'),
   ('Packaging', 'Packaging', 'Physical objects designed to make products feel considered, desirable and unmistakably yours.'),
   ('Motion', 'Motion Design', 'Movement systems, campaign films and kinetic type that give an identity a pulse.'),
   ('Web design', 'web', 'Websites with strong art direction, clear structure and interaction that has a purpose.'),
  ],
  'in_archive': 'in the archive', 'live_sites': 'live sites',
  'archive_label': 'The archive',
  'archive_title': 'Every project, <em>in one sentence.</em>',
  'archive_hint': 'Hover a title to see it. Select one to read it.',
  'archive_open': 'Browse the archive as an index',
  'notes_label': 'Field notes',
  'notes_title': 'How an idea <em>becomes a system.</em>',
  'notes': [
   ('Discover', 'Start with the real problem.', 'We learn the business, audience, context and objective before we decide what the design should look like.'),
   ('Define', 'Turn context into direction.', 'We clarify the opportunity, positioning, audience and creative direction so the project has a clear north star.'),
   ('Design', 'Make the idea visible.', 'We explore, develop and execute the visual solution across the places it needs to live.'),
   ('Refine', 'Make good work better.', 'We review, test, remove what is not working and sharpen what is until the system feels inevitable.'),
   ('Deliver', 'Leave you with a system.', 'You receive organised, production-ready files and the guidance needed to use the work confidently.'),
  ],
  'contact_label': 'Open projects',
  'contact_title': 'Have an idea that refuses to look <em>ordinary?</em>',
  'contact_intro': 'Tell us what you are building, where you want to take it and what needs to change. We read every brief and reply to schedule a conversation.',
  'or_write': 'Or write to us directly',
  'f_name': 'Your name', 'f_email': 'Email', 'f_company': 'Company or brand',
  'f_services': 'What do you need?', 'f_budget': 'Approximate budget', 'f_timeline': 'Timeline',
  'f_select': 'Select', 'f_goals': 'What are you trying to achieve?', 'f_website': 'Website or social link (optional)',
  'f_send': 'Send the brief', 'f_sending': 'Sending…',
  'f_services_list': [('Brand Identity Design', 'Brand identity'), ('Social Media Design', 'Social media'), ('UI Design', 'UI design'),
                      ('Packaging', 'Packaging'), ('Motion Design', 'Motion'), ('Web Design', 'Web design')],
  'f_budgets': ['$2,500 – $5,000', '$5,000 – $10,000', '$10,000 – $20,000', '$20,000+', 'Let’s discuss'],
  'f_timelines': ['As soon as possible', 'Within 1 month', '1–3 months', '3–6 months', 'Flexible'],
  'f_ok_title': 'Brief received.', 'f_ok_text': 'Thank you. We will read it and reply to schedule a conversation.',
  'f_err': 'Something went wrong. Please try again or email hello@rovardstudio.com.',
  'f_need': 'Please fill in your name, email and a few words about the project.',
  'colophon': 'Colophon',
  'colophon_text': 'Issue 001 of the Rovard Studios edition. Set in Archivo, Instrument Serif and DM Mono. Designed and built by the studio in Canada, for clients everywhere.',
  'f_index': 'Index', 'f_contact': 'Contact', 'f_lang': 'Language',
  'rights': 'All rights reserved.',
  'back_top': 'Back to the cover',
  # archive page
  'arch_title': 'The Archive — Rovard Studios',
  'arch_desc': 'Every Rovard Studios project: brand identity, social media, UI, packaging and motion design.',
  'arch_h': 'The archive',
  'arch_intro': 'Every project in this issue, filed by discipline. Self-initiated concepts are always labelled.',
  'filter_all': 'All', 'view_index': 'Index', 'view_sheet': 'Contact sheet',
  'col_no': 'No.', 'col_title': 'Title', 'col_disc': 'Discipline', 'col_services': 'Services', 'col_year': 'Year',
  # case page
  'archive': 'Archive', 'discipline': 'Discipline', 'year': 'Year', 'services': 'Services', 'status': 'Status',
  'challenge': 'The challenge', 'approach': 'The approach', 'made': 'What was made',
  'films': 'Films', 'gallery': 'Plates', 'plate': 'Plate', 'next': 'Next in the archive', 'prev': 'Previous',
  'similar': 'Start a similar project', 'view_live': 'Explore the live site',
  'cursor_read': 'Read', 'cursor_open': 'Open',
 },
 'fr': {
  'lang': 'fr', 'other': 'en', 'other_label': 'English', 'other_short': 'EN', 'short': 'FR',
  'home_title': 'Rovard Studios — L’Édition créative. Studio de création indépendant, Canada',
  'home_desc': 'Rovard Studios est un studio de création indépendant au Canada. Identité de marque, réseaux sociaux, interfaces, emballage, motion design et sites Web pour des idées qui refusent d’avoir l’air ordinaires.',
  'skip': 'Aller au contenu',
  'issue': 'Numéro', 'edition': 'L’Édition créative',
  'nav': [('works', 'Projets'), ('studio', 'Studio'), ('departments', 'Services'), ('archive', 'Archives'), ('contact', 'Contact')],
  'contents': 'Sommaire', 'close': 'Fermer',
  'toc_title': 'Dans ce numéro',
  'toc': [
   ('cover', 'L’ouverture', 'Couverture'),
   ('idea', 'L’idée', 'Nous montrons les idées sous un autre jour'),
   ('works', 'Projets choisis', 'Six histoires'),
   ('studio', 'Le studio', 'Un point de vue'),
   ('departments', 'Les rubriques', 'Ce que nous créons'),
   ('archive', 'Les archives', 'Tous les projets'),
   ('notes', 'Notes de terrain', 'Notre méthode'),
   ('contact', 'Projets ouverts', 'Lancez le vôtre'),
  ],
  'cover_kicker': 'Rovard Studios / Studio de création indépendant',
  'cover_where': 'Canada · Partout dans le monde',
  'cover_line': 'Concevoir des idées.<br><em>Façonner la culture visuelle.</em>',
  'cover_inside': 'Dans ce numéro',
  'cover_caption': 'En couverture',
  'sticker': 'Nouveau<br>numéro',
  'hero_label': 'L’idée',
  'hero_words': ['Nous', 'montrons', 'les idées', 'sous un', 'autre jour.'],
  'hero_aside': '(verbe) donner forme à une pensée',
  'hero_lede': 'Nous explorons des idées, développons des identités visuelles et créons des expériences par le design, le mouvement et l’expression numérique.',
  'hero_cta': 'Lire les projets choisis',
  'start': 'Lancer un projet',
  'fig': 'Fig.',
  'band': ['Un studio pour les idées', 'qui refusent l’ordinaire', 'Pensée créative', 'Exécution inattendue'],
  'works_label': 'Projets choisis',
  'works_title': 'Six histoires <em>tirées des archives.</em>',
  'works_intro': 'Identité, emballage, mouvement et interfaces, choisis pour la façon très différente dont chacun résout son problème.',
  'no': 'N°', 'read_story': 'Lire l’histoire', 'concept': 'Concept autoinitié',
  'all_works': 'Ouvrir toutes les archives',
  'projects': 'projets',
  'studio_label': 'Le studio',
  'studio_statement': 'Nous ne créons pas pour la <s>décoration</s>.<br>Nous créons pour la <em>perception.</em>',
  'studio_p1': 'Des systèmes d’identité aux interfaces numériques, chaque décision aide une entreprise à communiquer avec assurance et à avancer avec intention.',
  'studio_p2': 'Nous regardons au-delà du livrable immédiat. Nous nous demandons ce qui doit être compris, qui doit y croire et ce que le design doit rendre possible.',
  'principles_label': 'Un petit glossaire',
  'principles': [
   ('Clarté', 'n.f.', 'Rendre l’essentiel impossible à manquer.'),
   ('Caractère', 'n.m.', 'Une signature visuelle que l’on reconnaît.'),
   ('Savoir-faire', 'n.m.', 'Soigner les détails qui changent la perception.'),
   ('Cohérence', 'n.f.', 'Bâtir des systèmes, pas des éléments isolés.'),
  ],
  'dept_label': 'Les rubriques',
  'dept_title': 'Un studio. <em>Plusieurs façons d’avancer.</em>',
  'dept_intro': 'Stratégie, design visuel et pensée numérique réunis dans une même pratique.',
  'departments': [
   ('Identité de marque', 'Brand Identity Design', 'Des systèmes d’identité qui disent clairement ce que vous défendez et restent cohérents partout où la marque apparaît.'),
   ('Réseaux sociaux', 'Social Media Design', 'Des campagnes et des systèmes de contenu qui gardent la marque reconnaissable et donnent à chaque publication une raison d’exister.'),
   ('Design d’interface', 'UI Design', 'Des interfaces qui transforment des produits et services complexes en expériences numériques claires et rassurantes.'),
   ('Emballage', 'Packaging', 'Des objets conçus pour que vos produits paraissent réfléchis, désirables et immédiatement à vous.'),
   ('Motion design', 'Motion Design', 'Des systèmes de mouvement, des films de campagne et de la typographie animée qui donnent un pouls à l’identité.'),
   ('Sites Web', 'web', 'Des sites à la direction artistique affirmée, à la structure claire et aux interactions utiles.'),
  ],
  'in_archive': 'dans les archives', 'live_sites': 'sites en ligne',
  'archive_label': 'Les archives',
  'archive_title': 'Tous les projets, <em>en une phrase.</em>',
  'archive_hint': 'Survolez un titre pour le voir. Choisissez-le pour le lire.',
  'archive_open': 'Parcourir les archives sous forme d’index',
  'notes_label': 'Notes de terrain',
  'notes_title': 'Comment une idée <em>devient un système.</em>',
  'notes': [
   ('Découvrir', 'Partir du vrai problème.', 'Nous apprenons l’entreprise, le public, le contexte et l’objectif avant de décider de l’allure du design.'),
   ('Définir', 'Transformer le contexte en direction.', 'Nous précisons l’occasion, le positionnement, le public et la direction créative pour que le projet ait un cap clair.'),
   ('Concevoir', 'Rendre l’idée visible.', 'Nous explorons, développons et réalisons la solution visuelle partout où elle doit vivre.'),
   ('Affiner', 'Rendre le bon travail meilleur.', 'Nous révisons, testons, retirons ce qui ne fonctionne pas et affûtons le reste jusqu’à ce que le système paraisse évident.'),
   ('Livrer', 'Vous laisser un système.', 'Vous recevez des fichiers organisés, prêts pour la production, et les conseils pour utiliser le travail en toute confiance.'),
  ],
  'contact_label': 'Projets ouverts',
  'contact_title': 'Une idée qui refuse d’avoir l’air <em>ordinaire ?</em>',
  'contact_intro': 'Dites-nous ce que vous construisez, où vous voulez l’emmener et ce qui doit changer. Nous lisons chaque demande et répondons pour fixer un échange.',
  'or_write': 'Ou écrivez-nous directement',
  'f_name': 'Votre nom', 'f_email': 'Courriel', 'f_company': 'Entreprise ou marque',
  'f_services': 'De quoi avez-vous besoin ?', 'f_budget': 'Budget approximatif', 'f_timeline': 'Échéancier',
  'f_select': 'Choisir', 'f_goals': 'Que cherchez-vous à accomplir ?', 'f_website': 'Site Web ou réseau social (facultatif)',
  'f_send': 'Envoyer la demande', 'f_sending': 'Envoi…',
  'f_services_list': [('Brand Identity Design', 'Identité de marque'), ('Social Media Design', 'Réseaux sociaux'), ('UI Design', 'Design d’interface'),
                      ('Packaging', 'Emballage'), ('Motion Design', 'Motion design'), ('Web Design', 'Sites Web')],
  'f_budgets': ['2 500 $ – 5 000 $', '5 000 $ – 10 000 $', '10 000 $ – 20 000 $', '20 000 $ et plus', 'À discuter'],
  'f_timelines': ['Dès que possible', 'D’ici 1 mois', '1 à 3 mois', '3 à 6 mois', 'Flexible'],
  'f_ok_title': 'Demande reçue.', 'f_ok_text': 'Merci. Nous allons la lire et vous répondre pour fixer un échange.',
  'f_err': 'Une erreur est survenue. Réessayez ou écrivez à hello@rovardstudio.com.',
  'f_need': 'Indiquez votre nom, votre courriel et quelques mots sur le projet.',
  'colophon': 'Colophon',
  'colophon_text': 'Numéro 001 de l’édition Rovard Studios. Composé en Archivo, Instrument Serif et DM Mono. Conçu et réalisé par le studio au Canada, pour des clients partout dans le monde.',
  'f_index': 'Index', 'f_contact': 'Contact', 'f_lang': 'Langue',
  'rights': 'Tous droits réservés.',
  'back_top': 'Retour à la couverture',
  'arch_title': 'Les archives — Rovard Studios',
  'arch_desc': 'Tous les projets de Rovard Studios : identité de marque, réseaux sociaux, interfaces, emballage et motion design.',
  'arch_h': 'Les archives',
  'arch_intro': 'Tous les projets de ce numéro, classés par discipline. Les concepts autoinitiés sont toujours identifiés.',
  'filter_all': 'Tous', 'view_index': 'Index', 'view_sheet': 'Planche contact',
  'col_no': 'N°', 'col_title': 'Titre', 'col_disc': 'Discipline', 'col_services': 'Services', 'col_year': 'Année',
  'archive': 'Archives', 'discipline': 'Discipline', 'year': 'Année', 'services': 'Services', 'status': 'Statut',
  'challenge': 'Le défi', 'approach': 'L’approche', 'made': 'Ce qui a été créé',
  'films': 'Films', 'gallery': 'Planches', 'plate': 'Planche', 'next': 'Suivant dans les archives', 'prev': 'Précédent',
  'similar': 'Lancer un projet semblable', 'view_live': 'Voir le site en ligne',
  'cursor_read': 'Lire', 'cursor_open': 'Ouvrir',
 },
}

# French for project text that the earlier translation files did not cover.
FR_EXTRA = {
 'Healthcare brands default to cold clinical blue and institutional language. Vita House needed to communicate trust, warmth, professionalism and accessibility to young professionals and families, without looking or sounding like a hospital.':
  'Les marques de santé se rabattent souvent sur un bleu clinique et un langage institutionnel. Vita House devait inspirer confiance, chaleur, professionnalisme et accessibilité aux jeunes professionnels et aux familles, sans ressembler à un hôpital.',
 'The identity rests on one idea: care that feels like coming home. The symbol, The Open Door, joins an arch (the house), a V (Vita: open arms and a rising shoot) and a honey sun. Warm neutrals, sage and deep moss carry the system, with clay and honey as quiet accents and no blue at all. Fraunces gives the voice warmth, Figtree keeps it clear, and every colour pairing is checked for accessible contrast. An arch-based graphic language, a custom icon set, illustrated portraits and photography direction complete the guidelines.':
  'L’identité repose sur une idée : des soins qui donnent l’impression de rentrer chez soi. Le symbole, La Porte ouverte, réunit une arche (la maison), un V (Vita : des bras ouverts et une pousse qui monte) et un soleil couleur miel. Des neutres chauds, la sauge et la mousse profonde portent le système, l’argile et le miel servent d’accents discrets, sans aucun bleu. Fraunces donne de la chaleur à la voix, Figtree la garde claire, et chaque paire de couleurs est vérifiée pour un contraste accessible. Un langage graphique fondé sur l’arche, des icônes sur mesure, des portraits illustrés et une direction photo complètent les normes.',
 'Fintech brands default to padlocks, dollar signs and teal gradients, and speak in jargon. Northstar needed to feel confident, intelligent and credible to owners who are not finance people, without looking like a bank or a generic SaaS template.':
  'Les marques fintech se rabattent sur les cadenas, les signes de dollar et les dégradés turquoise, et parlent en jargon. Northstar devait paraître sûre, intelligente et crédible aux yeux de propriétaires qui ne sont pas des spécialistes de la finance, sans ressembler à une banque ni à un gabarit SaaS générique.',
 'The mark is a bold, geometric N with a blue wedge inlaid in its counter: a compass needle, a sail, an arrow pointing north. Traced, the N is also a cash-flow line (up, down, up). Night Ink, Paper and Slate carry the system, Polaris Blue is the single accent, and Surplus green is reserved for positive money. Geist and Geist Mono set the tone, and four graphic devices (the north wedge, a meridian grid, the rise-dip-rise line and a data constellation) are all derived from the mark.':
  'Le symbole est un N géométrique et affirmé, avec un coin bleu incrusté dans sa contreforme : une aiguille de boussole, une voile, une flèche vers le nord. Tracé, le N devient aussi une courbe de trésorerie (haut, bas, haut). Encre de nuit, Papier et Ardoise portent le système, le bleu Polaris est l’unique accent et le vert Surplus est réservé aux montants positifs. Geist et Geist Mono donnent le ton, et quatre éléments graphiques (le coin nord, une grille de méridiens, la ligne monte-descend-monte et une constellation de données) découlent tous du symbole.',
 'Luxury property brands tend to borrow the look of a brokerage: gold foil, stock palm trees and shouted superlatives. Mason & Rowe needed to read as an architecture and craft practice that happens to build homes in New York, Miami, Los Angeles and Austin, and to earn the trust of buyers who think in decades.':
  'Les marques immobilières de luxe empruntent souvent l’allure d’une agence de courtage : dorure, palmiers de banque d’images et superlatifs criés. Mason & Rowe devait se lire comme une pratique d’architecture et d’artisanat qui construit aussi des maisons à New York, Miami, Los Angeles et Austin, et gagner la confiance d’acheteurs qui pensent en décennies.',
 'The monogram, The Shared Pier, joins an M and an R on a single vertical, the way a pier carries two arches. Ivory Plaster, Warm Limewash, Charcoal Basalt, Soft Travertine and Muted Bronze carry the system, every pairing is contrast-checked, and bronze has two companions for small text. Newsreader sets an editorial voice and Jost keeps it precise. A plan-grid graphic language (hairlines, dimensions, section marks) makes every image feel measured, and the art direction fixes the look of the imagery: blue-hour exteriors, true verticals and raking light on material.':
  'Le monogramme, Le Pilier partagé, réunit un M et un R sur une même verticale, comme un pilier porte deux arches. Plâtre ivoire, Chaux chaude, Basalte charbon, Travertin doux et Bronze sourd portent le système ; chaque paire est vérifiée pour le contraste et le bronze a deux variantes pour les petits textes. Newsreader donne une voix éditoriale et Jost la garde précise. Un langage graphique de plan (filets, cotes, repères de coupe) donne à chaque image un air mesuré, et la direction artistique fixe le style des images : extérieurs à l’heure bleue, verticales droites et lumière rasante sur la matière.',
 'Trading platforms often feel cold, cluttered and untrustworthy. Proxima needed one calm, credible interface that handles crypto and forex side by side and carries its royal blue, navy and gold identity.':
  'Les plateformes de courtage paraissent souvent froides, encombrées et peu fiables. Proxima avait besoin d’une interface calme et crédible qui réunit cryptomonnaies et devises côte à côte et porte son identité bleu roi, marine et or.',
 'We turned the logo into the interface: its three colours drive the palette, and the mark itself is rebuilt as a layered 3D object. Bricolage Grotesque, Onest and Geist Mono give a confident, technical tone, with live market data, glass surfaces and fully responsive layouts.':
  'Nous avons fait du logo l’interface : ses trois couleurs dictent la palette et le symbole est reconstruit en objet 3D à plusieurs couches. Bricolage Grotesque, Onest et Geist Mono donnent un ton assuré et technique, avec des données de marché en direct, des surfaces de verre et des mises en page entièrement adaptatives.',
 'Informal commerce across Africa runs on "trust me": buyers pay strangers up front, sellers chase invoices, and disputes have no referee. A payment brand here has to feel safe before it feels fast.':
  'Le commerce informel en Afrique repose sur le « faites-moi confiance » : les acheteurs paient des inconnus d’avance, les vendeurs courent après leurs factures et les litiges n’ont pas d’arbitre. Ici, une marque de paiement doit paraître sûre avant de paraître rapide.',
 'We built the identity on one idea: two sides meeting at a verified point. The logo is an open A whose strokes converge on a green dot, the same dot that becomes the apostrophe in the wordmark. Black, white and electric blue carry the interface, and green is reserved for money that is verified or released. From there we designed the landing, pricing and security pages and a functional platform with milestone escrow, signed contracts, a wallet, disputes and an explainable trust score, thumb-first for mobile-money users.':
  'Nous avons bâti l’identité sur une idée : deux parties qui se rejoignent en un point vérifié. Le logo est un A ouvert dont les traits convergent vers un point vert, le même point qui devient l’apostrophe du logotype. Le noir, le blanc et le bleu électrique portent l’interface, et le vert est réservé à l’argent vérifié ou libéré. Nous avons ensuite conçu les pages d’accueil, de tarifs et de sécurité, ainsi qu’une plateforme fonctionnelle avec séquestre par étapes, contrats signés, portefeuille, litiges et un score de confiance explicable, pensée pour le pouce des utilisateurs de paiement mobile.',
 'Healthcare interfaces tend to be dense, jargon-heavy and hidden behind logins. The brief was to reimagine the digital front door for young professionals and families, with a clear information hierarchy, accessibility built in, and kind error, empty and confirmation states.':
  'Les interfaces de santé sont souvent denses, pleines de jargon et cachées derrière une connexion. Le mandat : réinventer la porte d’entrée numérique pour les jeunes professionnels et les familles, avec une hiérarchie d’information claire, une accessibilité intégrée et des messages d’erreur, d’état vide et de confirmation bienveillants.',
 'We designed ten website pages, a booking journey with one decision per step, and a dashboard for appointments, care team, messages, documents, membership and settings, all on one design system. WCAG AA contrast, 44px targets, error summaries, text-size and reduced-motion settings, and mobile versions of the booking flow and dashboard with a bottom tab bar and sticky actions.':
  'Nous avons conçu dix pages Web, un parcours de réservation avec une décision par étape et un tableau de bord pour les rendez-vous, l’équipe de soins, les messages, les documents, l’abonnement et les réglages, le tout sur un même système de design. Contraste WCAG AA, cibles de 44 px, résumés d’erreurs, réglages de taille du texte et de réduction des animations, et versions mobiles du parcours de réservation et du tableau de bord avec barre d’onglets et actions fixes.',
 'A responsive eight-page website for a fictional U.S. fintech, with a working product dashboard behind it. The hero is the product itself, not a stock photo.':
  'Un site adaptatif de huit pages pour une fintech américaine fictive, avec un vrai tableau de bord derrière. L’image d’ouverture, c’est le produit lui-même, pas une photo de banque d’images.',
 'Small-business finance sites tend to lean on stock photography, vague claims and jargon. The brief was a site that proves the product in the first scroll, stays honest about what it is, and works as well on a phone as on a desktop.':
  'Les sites de finance pour petites entreprises s’appuient souvent sur des photos génériques, des promesses vagues et du jargon. Le mandat : un site qui prouve le produit dès le premier défilement, reste honnête sur ce qu’il est et fonctionne aussi bien sur téléphone que sur ordinateur.',
 'The homepage tells the story in eleven beats: a live cash-flow chart, a self-playing product tour, plain-English insights, an interactive what-if forecast, invoicing, security, testimonials and pricing. Everything is built from one design system with light and dark themes, a validated chart palette and a custom icon set. Behind the site sits a nine-view dashboard on realistic, fictional data: scenario planning, an invoice drawer and builder, reports, notifications and a command palette.':
  'La page d’accueil raconte l’histoire en onze temps : un graphique de trésorerie en direct, une visite du produit qui se joue seule, des analyses en langage simple, une prévision interactive, la facturation, la sécurité, des témoignages et les tarifs. Tout est bâti sur un même système de design avec thèmes clair et sombre, une palette de graphiques validée et des icônes sur mesure. Derrière le site, un tableau de bord de neuf vues sur des données fictives réalistes : planification de scénarios, création de factures, rapports, notifications et palette de commandes.',
 'Property websites usually bury the home under search filters and stock photography. The brief was an editorial experience that feels like an architectural monograph on arrival, then turns practical: where is it, what is it like inside, which residence is still available, and how do I see it?':
  'Les sites immobiliers enterrent souvent la maison sous les filtres de recherche et les photos génériques. Le mandat : une expérience éditoriale qui ressemble d’abord à une monographie d’architecture, puis devient pratique : où est-ce, à quoi ressemble l’intérieur, quelle résidence est encore disponible et comment la visiter ?',
 'Eleven pages share one design system. The homepage is a slow, cinematic sequence; each development page carries a gallery, floor plans generated from data, specifications, an illustrated neighbourhood map and an interactive stacking plan with a unit panel. Booking is three calm steps with a custom calendar. On phones the experience is rebuilt rather than shrunk, with a full-screen menu and a sticky enquire and viewing bar.':
  'Onze pages partagent un même système de design. La page d’accueil est une séquence lente et cinématographique ; chaque page de projet comprend une galerie, des plans générés à partir de données, des caractéristiques, une carte illustrée du quartier et un plan d’étages interactif avec fiche d’unité. La réservation tient en trois étapes calmes avec un calendrier sur mesure. Sur téléphone, l’expérience est repensée plutôt que réduite, avec un menu plein écran et une barre fixe pour se renseigner et réserver une visite.',
 'The snack aisle is loud. JoJo Foods needed a pouch that reads from across the shop, feels friendly rather than corporate, and still shows off the product inside.':
  'Le rayon des collations est bruyant. JoJo Foods avait besoin d’un sachet lisible de l’autre bout du magasin, sympathique plutôt que corporatif, et qui montre quand même le produit.',
 'We put the JoJo Foods wordmark on a cream roundel so it holds its own against a high-energy red and orange sunburst. A chunky retro script carries "Crispy Snack" and the "Potato Chips" tag, and a clear window shows the product through the middle of the pack.':
  'Nous avons placé le logotype JoJo Foods sur une pastille crème pour qu’il tienne tête à un soleil rouge et orange plein d’énergie. Une écriture rétro bien grasse porte « Crispy Snack » et la mention « Potato Chips », et une fenêtre transparente montre le produit au centre du sachet.',
 'We built the logo as a layered 3D object and shot it with a virtual camera: rack focus, light rays and lens streaks, a deep blue and gold grade, and a score cut to every hit. A second, frame-accurate film runs the actual website UI, live chart and markets table on the same timeline.':
  'Nous avons construit le logo en objet 3D à plusieurs couches et l’avons filmé avec une caméra virtuelle : bascule de mise au point, rayons de lumière et reflets d’objectif, un étalonnage bleu profond et or, et une musique calée sur chaque impact. Un second film, précis à l’image près, fait défiler la vraie interface du site, le graphique en direct et le tableau des marchés sur la même ligne de temps.',
 'A 90-second brand film that turns the Rovard identity, services and selected work into one continuous piece of motion.':
  'Un film de marque de 90 secondes qui fait de l’identité, des services et des projets de Rovard une seule pièce de mouvement continue.',
 'The studio needed a single film that could introduce who Rovard is, what it does and the quality of its work in under two minutes.':
  'Le studio avait besoin d’un seul film capable de présenter qui est Rovard, ce qu’il fait et la qualité de son travail en moins de deux minutes.',
 'Explore the live concept ↗': 'Voir le concept en ligne ↗',
 'Explore the live website ↗': 'Voir le site en ligne ↗',
}
