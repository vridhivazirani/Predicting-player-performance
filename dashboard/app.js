/**
 * PlayerForm AI — Dashboard & News Intelligence Feed
 * ========================================================
 * Reads results.json. Zero hardcoded player data.
 * LiveScore design pattern: compact rows for players + card feed for news.
 */
"use strict";

// ─── LEAGUE / CLUB METADATA ──────────────────────────────────────────────
const CLUB_META = {
  "Real Madrid":      { league: "La Liga",          crest: "🇪🇸" },
  "Barcelona":        { league: "La Liga",          crest: "🇪🇸" },
  "Atletico Madrid":  { league: "La Liga",          crest: "🇪🇸" },
  "Man City":         { league: "Premier League",   crest: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  "Man United":       { league: "Premier League",   crest: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  "Liverpool":        { league: "Premier League",   crest: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  "Arsenal":          { league: "Premier League",   crest: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  "Chelsea":          { league: "Premier League",   crest: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  "Tottenham":        { league: "Premier League",   crest: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  "Newcastle":        { league: "Premier League",   crest: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  "Aston Villa":      { league: "Premier League",   crest: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  "Bayern Munich":    { league: "Bundesliga",       crest: "🇩🇪" },
  "Bayer Leverkusen": { league: "Bundesliga",       crest: "🇩🇪" },
  "PSG":              { league: "Ligue 1",          crest: "🇫🇷" },
  "Inter Milan":      { league: "Serie A",          crest: "🇮🇹" },
  "AC Milan":         { league: "Serie A",          crest: "🇮🇹" },
  "Juventus":         { league: "Serie A",          crest: "🇮🇹" },
  "Roma":             { league: "Serie A",          crest: "🇮🇹" },
  "Atalanta":         { league: "Serie A",          crest: "🇮🇹" },
  "Lazio":            { league: "Serie A",          crest: "🇮🇹" },
  "Sassuolo":         { league: "Serie A",          crest: "🇮🇹" },
  "Al Nassr":         { league: "Saudi Pro League", crest: "🇸🇦" },
  "Al Hilal":         { league: "Saudi Pro League", crest: "🇸🇦" },
  "Al Ittihad":       { league: "Saudi Pro League", crest: "🇸🇦" },
  "Al Ahli":          { league: "Saudi Pro League", crest: "🇸🇦" },
  "Al Arabi":         { league: "Saudi Pro League", crest: "🇸🇦" },
  "Inter Miami":      { league: "MLS",              crest: "🇺🇸" },
  "Galatasaray":      { league: "Süper Lig",        crest: "🇹🇷" },
  "Besiktas":         { league: "Süper Lig",        crest: "🇹🇷" },
  "Shakhtar":         { league: "Other",            crest: "🌍" },
};

function getLeague(club) {
  return CLUB_META[club] || { league: "Other", crest: "🌍" };
}

// ─── NEWS PHOTOS LIBRARY (29 Authentic Sports Action Photographs) ──────────
const STAR_PLAYER_PHOTOS = {
  "mbapp":   "images/players/mbappe_hero.jpg",
  "benzema": "images/players/benzema.jpg",
  "haaland": "images/players/haaland.jpg",
  "messi":   "images/players/messi.jpg",
  "ronaldo": "images/players/ronaldo.jpg",
};

function getInitialsAvatar(player) {
  const posColors = {
    FW: { g1: "#451216", g2: "#2a0d10", border: "rgba(248,113,113,0.5)", text: "#fca5a5" },
    MF: { g1: "#0e2a47", g2: "#081b2e", border: "rgba(96,165,250,0.5)", text: "#93c5fd" },
    DF: { g1: "#0b3820", g2: "#062214", border: "rgba(74,222,128,0.5)", text: "#86efac" },
    GK: { g1: "#3d2b07", g2: "#261a04", border: "rgba(251,191,36,0.5)", text: "#fde047" },
  };
  const theme = posColors[player.position] || { g1: "#27272a", g2: "#18181b", border: "rgba(161,161,170,0.4)", text: "#e4e4e7" };
  const raw = (player.name || "Player").trim();
  const parts = raw.split(/\s+/);
  const initials = (parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]) : raw.slice(0, 2)).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
    <defs>
      <linearGradient id="g_${player.player_id || 'p'}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.g1}"/>
        <stop offset="100%" stop-color="${theme.g2}"/>
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="19" fill="url(#g_${player.player_id || 'p'})" stroke="${theme.border}" stroke-width="1.5"/>
    <text x="20" y="24.5" text-anchor="middle" fill="${theme.text}" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,sans-serif" font-weight="700" font-size="13" letter-spacing="0.4">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const PLAYER_HEADSHOTS = {
  "Achraf Hakimi": "images/players/achraf_hakimi.png",
  "Ademola Lookman": "images/players/ademola_lookman.png",
  "Alejandro Balde": "images/players/alejandro_balde.png",
  "Alexander Isak": "images/players/alexander_isak.png",
  "Alisson Becker": "images/players/alisson_becker.png",
  "Alphonso Davies": "images/players/alphonso_davies.png",
  "Andrew Robertson": "images/players/andrew_robertson.png",
  "Antoine Griezmann": "images/players/antoine_griezmann.png",
  "Bernardo Silva": "images/players/bernardo_silva.png",
  "Bruno Fernandes": "images/players/bruno_fernandes.png",
  "Bukayo Saka": "images/players/bukayo_saka.png",
  "Casemiro": "images/players/casemiro.png",
  "Christopher Nkunku": "images/players/christopher_nkunku.png",
  "Cole Palmer": "images/players/cole_palmer.png",
  "Conor Gallagher": "images/players/conor_gallagher.png",
  "Cristiano Ronaldo": "images/players/ronaldo.jpg",
  "David Alaba": "images/players/david_alaba.png",
  "Declan Rice": "images/players/declan_rice.png",
  "Domenico Berardi": "images/players/domenico_berardi.png",
  "Ederson": "images/players/ederson.png",
  "Eduardo Camavinga": "images/players/eduardo_camavinga.png",
  "Erling Haaland": "images/players/haaland.jpg",
  "Federico Chiesa": "images/players/federico_chiesa.png",
  "Federico Valverde": "images/players/federico_valverde.png",
  "Florian Wirtz": "images/players/florian_wirtz.png",
  "Frenkie de Jong": "images/players/frenkie_de_jong.png",
  "Gabriel Jesus": "images/players/gabriel_jesus.png",
  "Gabriel Martinelli": "images/players/gabriel_martinelli.png",
  "Gavi": "images/players/gavi.png",
  "Gianluigi Donnarumma": "images/players/gianluigi_donnarumma.png",
  "Granit Xhaka": "images/players/granit_xhaka.png",
  "Harry Kane": "images/players/harry_kane.png",
  "Jamal Musiala": "images/players/jamal_musiala.png",
  "Jan Oblak": "images/players/jan_oblak.png",
  "John Stones": "images/players/john_stones.png",
  "Jonathan Tah": "images/players/jonathan_tah.png",
  "Joshua Kimmich": "images/players/joshua_kimmich.png",
  "Jude Bellingham": "images/players/jude_bellingham.png",
  "Jules Koundé": "images/players/jules_kound.png",
  "Kai Havertz": "images/players/kai_havertz.png",
  "Karim Benzema": "images/players/benzema.jpg",
  "Kevin De Bruyne": "images/players/kevin_de_bruyne.png",
  "Khvicha Kvaratskhelia": "images/players/khvicha_kvaratskhelia.png",
  "Kylian Mbappé": "images/players/mbappe_hero.jpg",
  "Lamine Yamal": "images/players/lamine_yamal.png",
  "Leandro Trossard": "images/players/leandro_trossard.png",
  "Leon Bailey": "images/players/leon_bailey.png",
  "Leroy Sané": "images/players/leroy_san.png",
  "Lionel Messi": "images/players/messi.jpg",
  "Luka Modrić": "images/players/luka_modri.png",
  "Manuel Neuer": "images/players/manuel_neuer.png",
  "Marcus Rashford": "images/players/marcus_rashford.png",
  "Marcus Thuram": "images/players/marcus_thuram.png",
  "Matteo Guendouzi": "images/players/matteo_guendouzi.png",
  "Mike Maignan": "images/players/mike_maignan.png",
  "Mohamed Salah": "images/players/mohamed_salah.png",
  "N'Golo Kanté": "images/players/n_golo_kant.png",
  "Ollie Watkins": "images/players/ollie_watkins.png",
  "Paulo Dybala": "images/players/paulo_dybala.png",
  "Pedri": "images/players/pedri.png",
  "Pedro Neto": "images/players/pedro_neto.png",
  "Phil Foden": "images/players/phil_foden.png",
  "Randal Kolo Muani": "images/players/randal_kolo_muani.png",
  "Robert Lewandowski": "images/players/robert_lewandowski.png",
  "Rodri": "images/players/rodri.png",
  "Rodrygo": "images/players/rodrygo.png",
  "Ruben Dias": "images/players/ruben_dias.png",
  "Sadio Mané": "images/players/sadio_man.png",
  "Sandro Tonali": "images/players/sandro_tonali.png",
  "Serge Gnabry": "images/players/serge_gnabry.png",
  "Thibaut Courtois": "images/players/thibaut_courtois.png",
  "Trent Alexander-Arnold": "images/players/trent_alexander_arnold.png",
  "Victor Osimhen": "images/players/victor_osimhen.png",
  "Virgil van Dijk": "images/players/virgil_van_dijk.png",
  "William Saliba": "images/players/william_saliba.png",
  "Xavi Simons": "images/players/xavi_simons.png",
  "Aurélien Tchouaméni": "images/players/aur_lien_tchouam_ni.png",
  "Dani Carvajal": "images/players/dani_carvajal.png",
  "Dušan Vlahović": "images/players/du_an_vlahovi.png",
  "Emiliano Martínez": "images/players/emiliano_mart_nez.png",
  "Enzo Fernández": "images/players/enzo_fern_ndez.png",
  "João Cancelo": "images/players/jo_o_cancelo.png",
  "Joško Gvardiol": "images/players/jo_ko_gvardiol.png",
  "Julián Álvarez": "images/players/juli_n_lvarez.png",
  "Lautaro Martínez": "images/players/lautaro_mart_nez.png",
  "Martin Ødegaard": "images/players/martin_degaard.png",
  "Moisés Caicedo": "images/players/mois_s_caicedo.png",
  "Mykhaylo Mudryk": "images/players/mykhaylo_mudryk.png",
  "Nicolò Barella": "images/players/nicol_barella.png",
  "Ousmane Dembélé": "images/players/ousmane_demb_l.png",
  "Rafael Leão": "images/players/rafael_le_o.png",
  "Robert Sánchez": "images/players/robert_s_nchez.png",
  "Ronald Araújo": "images/players/ronald_ara_jo.png",
  "Rúben Neves": "images/players/r_ben_neves.png",
  "Son Heung-min": "images/players/son_heung_min.png",
  "Éder Militão": "images/players/der_milit_o.png",
  "İlkay Gündoğan": "images/players/i_lkay_g_ndo_an.png",
  "Vinícius Júnior": "images/players/vinicius_junior.png",
  "Neymar Jr": "images/players/neymar_jr.png",
  "Toni Kroos": "images/players/toni_kroos.png",
  "Mats Hummels": "images/players/mats_hummels.png",
  "Ciro Immobile": "images/players/ciro_immobile.png",
  "Marco Verratti": "images/players/marco_verratti.png",
  "Riyad Mahrez": "images/players/riyad_mahrez.png",
  "Yerlan Yerlan": "images/players/mbappe_hero.jpg"
};

function getPlayerAvatar(player) {
  if (PLAYER_HEADSHOTS && PLAYER_HEADSHOTS[player.name]) {
    return PLAYER_HEADSHOTS[player.name];
  }
  const nameLower = (player.name || "").toLowerCase();
  for (const [name, path] of Object.entries(PLAYER_HEADSHOTS)) {
    if (nameLower.includes(name.toLowerCase()) || name.toLowerCase().includes(nameLower)) {
      return path;
    }
  }
  return getInitialsAvatar(player);
}

const NEWS_ACTION_PHOTOS = {
  slump: [
    "images/news/striker_shot.jpg",
    "images/news/player_sprint.jpg",
    "images/news/tactics_board.jpg",
    "images/news/referee_whistle.jpg",
    "images/news/stadium_tunnel.jpg",
    "images/news/training_ground.jpg"
  ],
  overvalued: [
    "images/news/football_boot.jpg",
    "images/news/press_conference.jpg",
    "images/news/locker_room.jpg",
    "images/news/midfielder_pass.jpg",
    "images/news/match_tackle_1.jpg"
  ],
  undervalued: [
    "images/news/ball_in_net.jpg",
    "images/news/goalkeeper_dive.jpg",
    "images/news/corner_kick.jpg",
    "images/news/grass_floodlights.jpg",
    "images/news/free_kick_wall.jpg"
  ],
  form: [
    "images/news/celebration_1.jpg",
    "images/news/derby_match.jpg",
    "images/news/ball_pitch_1.jpg",
    "images/news/stadium_aerial.jpg"
  ],
  sentiment: [
    "images/news/fans_scarf.jpg",
    "images/news/stadium_fans.jpg",
    "images/news/team_huddle.jpg",
    "images/news/pitch_night.jpg"
  ]
};

function getStoryPhoto(playerName, category, index) {
  const norm = (playerName || "").toLowerCase();
  for (const [key, path] of Object.entries(STAR_PLAYER_PHOTOS)) {
    if (norm.includes(key)) return path;
  }
  const pool = NEWS_ACTION_PHOTOS[category] || NEWS_ACTION_PHOTOS.form;
  return pool[index % pool.length];
}

// ─── APPLICATION STATE ───────────────────────────────────────────────────
const S = {
  raw: [],
  players: [],
  filtered: [],
  selectedWeek: null,
  posFilter: "ALL",
  leagueFilter: "ALL",
  sortBy: "slump_probability",
  activeTab: "ALL", // "ALL", "SLUMP", "OVERVALUED", "STABLE", "FAVORITES"
  searchQuery: "",
  activeView: "players", // "players" or "news"
  favorites: new Set(),
  modalCharts: {},
  collapsedLeagues: new Set(),
  currentModalPlayer: null,

  // News feed state
  allNews: [],
  newsFiltered: [],
  newsLeague: "ALL",
  newsCategory: "ALL",
  newsFavOnly: false,
  newsSearch: "",
};

// Load saved favorites
try {
  const saved = localStorage.getItem("playerform_favs");
  if (saved) S.favorites = new Set(JSON.parse(saved));
} catch (e) {
  console.warn("Could not load favorites from localStorage", e);
}

function saveFavorites() {
  try {
    localStorage.setItem("playerform_favs", JSON.stringify([...S.favorites]));
  } catch (e) {}
}

function toggleFavorite(playerId) {
  if (S.favorites.has(playerId)) {
    S.favorites.delete(playerId);
  } else {
    S.favorites.add(playerId);
  }
  saveFavorites();
  updateFavoritesUI();

  // If on favorites tab or favorites-only news, re-render
  if (S.activeTab === "FAVORITES") render();
  if (S.newsFavOnly) renderNews();
}

function updateFavoritesUI() {
  const count = S.favorites.size;

  // Tab badge in players view
  const badge = document.getElementById("favCountBadge");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline-flex" : "none";
  }

  // News favorites badge
  const newsBadge = document.getElementById("newsFavBadge");
  if (newsBadge) {
    newsBadge.textContent = count;
  }

  // Stars in player table
  document.querySelectorAll(".row-star").forEach(el => {
    const pid = el.dataset.starId;
    const isFav = S.favorites.has(pid);
    el.classList.toggle("starred", isFav);
    const svg = el.querySelector("svg");
    if (svg) svg.setAttribute("fill", isFav ? "currentColor" : "none");
  });

  // Star in modal
  const modalStar = document.getElementById("modalStarBtn");
  if (modalStar && S.currentModalPlayer) {
    modalStar.classList.toggle("starred", S.favorites.has(S.currentModalPlayer.player_id));
  }
}

// ─── DATA LOADING ────────────────────────────────────────────────────────
async function loadData() {
  const r = await fetch("results.json");
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  S.raw = await r.json();

  const map = new Map();
  for (const row of S.raw) {
    if (!map.has(row.player_id)) {
      map.set(row.player_id, {
        player_id: row.player_id,
        name: row.name,
        club: row.club,
        position: row.position,
        weeks: []
      });
    }
    map.get(row.player_id).weeks.push(row);
  }
  for (const p of map.values()) p.weeks.sort((a, b) => a.week - b.week);
  S.players = Array.from(map.values());

  const allWeeks = [...new Set(S.raw.map(r => r.week))].sort((a, b) => a - b);
  S.selectedWeek = allWeeks[allWeeks.length - 1];

  // Populate week selector
  const sel = document.getElementById("weekSelect");
  if (sel) {
    sel.innerHTML = `<option value="latest">Latest (W${S.selectedWeek})</option>`;
    for (const w of allWeeks.slice(0, -1).reverse()) {
      sel.innerHTML += `<option value="${w}">Week ${w}</option>`;
    }
  }

  // Populate league options in filter panel
  buildLeagueFilterOptions();

  // Programmatically generate news stories from current data
  S.allNews = generateAllNews(S.players, S.selectedWeek);
}

function getWD(player, week = S.selectedWeek) {
  return player.weeks.find(w => w.week === week) || player.weeks[player.weeks.length - 1];
}

// ─── STATUS HELPERS ──────────────────────────────────────────────────────
function slumpStatus(prob) {
  if (prob >= 0.65) return "slump";
  if (prob >= 0.35) return "at-risk";
  return "stable";
}
function valStatus(score) {
  if (score > 8)  return "over";
  if (score < -8) return "under";
  return "fair";
}

// ─── PROGRAMMATIC NEWS GENERATOR ─────────────────────────────────────────
/**
 * Automatically synthesizes realistic, varied news headlines and snippets
 * from the multimodal machine learning model outputs (form, slump probability,
 * market valuation gap, sentiment score, rolling trends).
 */
function generateAllNews(players, targetWeek) {
  const stories = [];
  const latestData = players.map(p => ({ player: p, wd: getWD(p, targetWeek) })).filter(x => Boolean(x.wd));

  // 1. SLUMP STORIES (high slump probability)
  const slumping = latestData
    .filter(x => (x.wd.slump_probability ?? 0) >= 0.40)
    .sort((a, b) => (b.wd.slump_probability ?? 0) - (a.wd.slump_probability ?? 0));

  const slumpHeadlineTemplates = [
    (p, wd, lg) => `${p.name} shows sharp form dip over past 3 weeks as slump risk climbs to ${(wd.slump_probability * 100).toFixed(0)}%`,
    (p, wd, lg) => `Alarm bells for ${p.club}: ${p.name}'s form rating plummets to ${(wd.per90_score).toFixed(2)} per-90`,
    (p, wd, lg) => `Tactical breakdown: Why ${p.name} is struggling to generate expected output at ${p.club}`,
    (p, wd, lg) => `Slump Watch: ${p.name} flagged with ${(wd.slump_probability * 100).toFixed(0)}% dip probability following recent matches`,
    (p, wd, lg) => `Form collapse: Performance model flags high-risk alert for ${p.club}'s ${p.name}`,
    (p, wd, lg) => `Critical dip: ${p.name}'s match impact contracts across 5-week evaluation window in ${lg.league}`,
  ];

  const slumpSnippetTemplates = [
    (p, wd) => `Expected metrics show a 3-week contraction, triggering a ${(wd.slump_probability * 100).toFixed(0)}% slump probability signal under multimodal analysis.`,
    (p, wd) => `Per-90 score of ${(wd.per90_score).toFixed(2)} sits well below seasonal baseline, with negative social sentiment (${(wd.sentiment_score).toFixed(2)}) compounding pitch pressure.`,
    (p, wd) => `Model detects severe xG and chance creation slowdown over recent fixtures, registering an abnormal form Z-score of ${(wd.form_z ?? -1.8).toFixed(2)}.`,
    (p, wd) => `Sustained dip below rolling 5-week averages indicates fatigue and reduced tactical efficiency for ${p.club}.`,
  ];

  slumping.slice(0, 7).forEach((item, idx) => {
    const { player: p, wd } = item;
    const lg = getLeague(p.club);
    const hlTpl = slumpHeadlineTemplates[idx % slumpHeadlineTemplates.length];
    const snTpl = slumpSnippetTemplates[idx % slumpSnippetTemplates.length];
    const isTop = idx < 2;

    stories.push({
      id: `slump-${p.player_id}`,
      playerId: p.player_id,
      playerName: p.name,
      club: p.club,
      league: lg.league,
      crest: lg.crest,
      category: "slump",
      categoryTag: "SLUMP ALERT",
      categoryClass: "slump",
      headline: hlTpl(p, wd, lg),
      snippet: snTpl(p, wd),
      source: idx % 2 === 0 ? "FotMob" : "The Athletic",
      time: idx === 0 ? "18m ago" : idx === 1 ? "1h ago" : idx === 2 ? "3h ago" : `${idx * 2 + 1}h ago`,
      isFeatured: isTop && idx === 0,
      themeClass: "slump-theme",
      
      photoUrl: getStoryPhoto(p.name, "slump", idx),
      timestampWeight: 1000 - idx * 25,
    });
  });

  // 2. OVERVALUED STORIES (market valuation >> model valuation)
  const overvalued = latestData
    .filter(x => (x.wd.overvaluation_score ?? 0) > 12)
    .sort((a, b) => (b.wd.overvaluation_score ?? 0) - (a.wd.overvaluation_score ?? 0));

  const overvalHeadlineTemplates = [
    (p, wd) => `${p.name}'s market value gap widens to €${Math.abs(wd.overvaluation_score).toFixed(1)}M amid performance lag`,
    (p, wd) => `Transfer reality check: Model estimates ${p.name} overvalued by €${Math.abs(wd.overvaluation_score).toFixed(1)}M`,
    (p, wd) => `Valuation disparity: Is ${p.club}'s ${p.name} commanding an unsustainable transfer premium?`,
    (p, wd) => `Market divergence: ${p.name}'s €${(wd.market_value).toFixed(1)}M tag outpaces performance-backed valuation`,
    (p, wd) => `Scouting intelligence: Performance model flags €${Math.abs(wd.overvaluation_score).toFixed(1)}M valuation bubble on ${p.name}`,
  ];

  const overvalSnippetTemplates = [
    (p, wd) => `Current market valuation of €${(wd.market_value).toFixed(1)}M exceeds model appraisal of €${(wd.predicted_value).toFixed(1)}M based on recent statistical contribution.`,
    (p, wd) => `High commercial market profile contrasts with recent per-90 output of ${(wd.per90_score).toFixed(2)}, indicating significant market inflation.`,
    (p, wd) => `Multimodal valuation index estimates a €${Math.abs(wd.overvaluation_score).toFixed(1)}M gap between transfer hype and statistically grounded valuation.`,
  ];

  overvalued.slice(0, 6).forEach((item, idx) => {
    const { player: p, wd } = item;
    const lg = getLeague(p.club);
    const hlTpl = overvalHeadlineTemplates[idx % overvalHeadlineTemplates.length];
    const snTpl = overvalSnippetTemplates[idx % overvalSnippetTemplates.length];

    stories.push({
      id: `overval-${p.player_id}`,
      playerId: p.player_id,
      playerName: p.name,
      club: p.club,
      league: lg.league,
      crest: lg.crest,
      category: "overvalued",
      categoryTag: "TRANSFER GAP",
      categoryClass: "overvalued",
      headline: hlTpl(p, wd),
      snippet: snTpl(p, wd),
      source: idx % 2 === 0 ? "The Athletic" : "SI",
      time: idx === 0 ? "35m ago" : idx === 1 ? "2h ago" : `${idx * 3}h ago`,
      isFeatured: idx === 0,
      themeClass: "overval-theme",
      
      photoUrl: getStoryPhoto(p.name, "overvalued", idx),
      timestampWeight: 980 - idx * 25,
    });
  });

  // 3. UNDERVALUED BARGAIN STORIES (model valuation >> market valuation)
  const undervalued = latestData
    .filter(x => (x.wd.overvaluation_score ?? 0) < -8)
    .sort((a, b) => (a.wd.overvaluation_score ?? 0) - (b.wd.overvaluation_score ?? 0));

  const undervalHeadlineTemplates = [
    (p, wd, lg) => `Undervalued gem: Model projects ${p.name} worth €${Math.abs(wd.overvaluation_score).toFixed(1)}M above current market price`,
    (p, wd, lg) => `Data highlights ${p.name} as one of ${lg.league}'s highest-value market bargains`,
    (p, wd, lg) => `${p.name} outperforming valuation with sustained ${(wd.per90_score).toFixed(2)} per-90 metrics at ${p.club}`,
    (p, wd, lg) => `Transfer radar: Why ${p.name}'s €${(wd.market_value).toFixed(1)}M price tag represents an elite value opportunity`,
    (p, wd, lg) => `Statistical bargain: ${p.name} generating elite output despite modest €${(wd.market_value).toFixed(1)}M valuation`,
  ];

  const undervalSnippetTemplates = [
    (p, wd) => `Model projects a fair market value of €${(wd.predicted_value).toFixed(1)}M against current €${(wd.market_value).toFixed(1)}M listing (gap: +€${Math.abs(wd.overvaluation_score).toFixed(1)}M).`,
    (p, wd) => `Standout form score of ${(wd.per90_score).toFixed(2)} per-90 suggests ${p.club} possesses one of European football's most underpriced assets.`,
    (p, wd) => `Multimodal transfer metrics identify ${p.name} as an optimal recruitment target with strong performance upside.`,
  ];

  undervalued.slice(0, 6).forEach((item, idx) => {
    const { player: p, wd } = item;
    const lg = getLeague(p.club);
    const hlTpl = undervalHeadlineTemplates[idx % undervalHeadlineTemplates.length];
    const snTpl = undervalSnippetTemplates[idx % undervalSnippetTemplates.length];

    stories.push({
      id: `underval-${p.player_id}`,
      playerId: p.player_id,
      playerName: p.name,
      club: p.club,
      league: lg.league,
      crest: lg.crest,
      category: "undervalued",
      categoryTag: "VALUE GEM",
      categoryClass: "undervalued",
      headline: hlTpl(p, wd, lg),
      snippet: snTpl(p, wd),
      source: idx % 2 === 0 ? "Sky Sports" : "The Athletic",
      time: idx === 0 ? "52m ago" : `${idx * 4 + 1}h ago`,
      isFeatured: false,
      themeClass: "form-theme",
      
      photoUrl: getStoryPhoto(p.name, "undervalued", idx),
      timestampWeight: 920 - idx * 25,
    });
  });

  // 4. FORM SURGE STORIES (elite form score, low slump risk)
  const topForm = latestData
    .filter(x => (x.wd.per90_score ?? 0) >= 8.2 && (x.wd.slump_probability ?? 0) < 0.25)
    .sort((a, b) => (b.wd.per90_score ?? 0) - (a.wd.per90_score ?? 0));

  const formHeadlineTemplates = [
    (p, wd, lg) => `${p.name} hitting peak form with standout ${(wd.per90_score).toFixed(2)} per-90 rating for ${p.club}`,
    (p, wd, lg) => `Key spark: ${p.name} continues dominant run across ${lg.league} fixtures`,
    (p, wd, lg) => `Model surge: ${p.name} records top form trajectory with ${(wd.per90_score).toFixed(2)} rating`,
    (p, wd, lg) => `Unstoppable rhythm: ${p.name}'s underlying metrics reach season-high at ${p.club}`,
    (p, wd, lg) => `Tactical engine: How ${p.name} is outclassing opposition in recent matchweeks`,
  ];

  const formSnippetTemplates = [
    (p, wd) => `Averaging ${(wd.per90_score).toFixed(2)} per-90 with fan sentiment soaring to +${(wd.sentiment_score).toFixed(2)} across recent matchweeks.`,
    (p, wd) => `Consistently generating peak expected output and driving ${p.club}'s attacking efficiency with near-zero slump risk.`,
    (p, wd) => `Rolling 5-week form mean reached ${(wd.per90_rolling_mean_5w ?? wd.per90_score).toFixed(2)}, solidifying an elite performance tier.`,
  ];

  topForm.slice(0, 5).forEach((item, idx) => {
    const { player: p, wd } = item;
    const lg = getLeague(p.club);
    const hlTpl = formHeadlineTemplates[idx % formHeadlineTemplates.length];
    const snTpl = formSnippetTemplates[idx % formSnippetTemplates.length];

    stories.push({
      id: `form-${p.player_id}`,
      playerId: p.player_id,
      playerName: p.name,
      club: p.club,
      league: lg.league,
      crest: lg.crest,
      category: "form",
      categoryTag: "FORM SURGE",
      categoryClass: "form",
      headline: hlTpl(p, wd, lg),
      snippet: snTpl(p, wd),
      source: idx % 2 === 0 ? "FotMob" : "Sky Sports",
      time: `${idx * 3 + 2}h ago`,
      isFeatured: false,
      themeClass: "form-theme",
      
      photoUrl: getStoryPhoto(p.name, "form", idx),
      timestampWeight: 880 - idx * 25,
    });
  });

  // 5. SENTIMENT SHIFT STORIES (extreme positive or negative fan discussion)
  const posSent = latestData
    .filter(x => (x.wd.sentiment_score ?? 0) >= 0.50)
    .sort((a, b) => (b.wd.sentiment_score ?? 0) - (a.wd.sentiment_score ?? 0))
    .slice(0, 3);

  const negSent = latestData
    .filter(x => (x.wd.sentiment_score ?? 0) <= -0.50)
    .sort((a, b) => (a.wd.sentiment_score ?? 0) - (b.wd.sentiment_score ?? 0))
    .slice(0, 3);

  posSent.forEach((item, idx) => {
    const { player: p, wd } = item;
    const lg = getLeague(p.club);
    stories.push({
      id: `sent-pos-${p.player_id}`,
      playerId: p.player_id,
      playerName: p.name,
      club: p.club,
      league: lg.league,
      crest: lg.crest,
      category: "sentiment",
      categoryTag: "FAN SENTIMENT",
      categoryClass: "sentiment",
      headline: idx === 0
        ? `Fan sentiment turns strongly positive for ${p.name} after commanding week`
        : `${p.club} supporters rally behind ${p.name} as positive sentiment surges to +${(wd.sentiment_score).toFixed(2)}`,
      snippet: `Digital sentiment climbed to +${(wd.sentiment_score).toFixed(2)} alongside an improved form score of ${(wd.per90_score).toFixed(2)} per-90.`,
      source: "BBC Sport",
      time: `${idx * 4 + 3}h ago`,
      isFeatured: false,
      themeClass: "sent-theme",
      
      photoUrl: getStoryPhoto(p.name, "sentiment", idx),
      timestampWeight: 840 - idx * 20,
    });
  });

  negSent.forEach((item, idx) => {
    const { player: p, wd } = item;
    const lg = getLeague(p.club);
    stories.push({
      id: `sent-neg-${p.player_id}`,
      playerId: p.player_id,
      playerName: p.name,
      club: p.club,
      league: lg.league,
      crest: lg.crest,
      category: "sentiment",
      categoryTag: "FAN SENTIMENT",
      categoryClass: "sentiment",
      headline: idx === 0
        ? `Social buzz sours: Online discourse around ${p.name} drops to ${(wd.sentiment_score).toFixed(2)}`
        : `Sentiment shift: Fan discussion surrounding ${p.club}'s ${p.name} turns critical`,
      snippet: `Negative social sentiment of ${(wd.sentiment_score).toFixed(2)} compounds pressure following recent match performances.`,
      source: "BBC Sport",
      time: `${idx * 4 + 4}h ago`,
      isFeatured: false,
      themeClass: "sent-theme",
      
      photoUrl: getStoryPhoto(p.name, "sentiment", idx + 3),
      timestampWeight: 820 - idx * 20,
    });
  });

  // Sort chronologically by assigned weight
  stories.sort((a, b) => b.timestampWeight - a.timestampWeight);

  // Guarantee at least 2 featured stories at top
  const featured = stories.filter(s => s.isFeatured);
  if (featured.length < 2 && stories.length >= 2) {
    stories[0].isFeatured = true;
    stories[1].isFeatured = true;
  }

  return stories;
}

// ─── NEWS RENDERING ──────────────────────────────────────────────────────
function applyNewsFilters() {
  let list = S.allNews;

  // League filter
  if (S.newsLeague !== "ALL") {
    list = list.filter(s => s.league === S.newsLeague);
  }

  // Category filter
  if (S.newsCategory !== "ALL") {
    list = list.filter(s => s.category === S.newsCategory);
  }

  // Favorites only
  if (S.newsFavOnly) {
    list = list.filter(s => S.favorites.has(s.playerId));
  }

  // Search
  const q = S.newsSearch.toLowerCase();
  if (q) {
    list = list.filter(s =>
      s.headline.toLowerCase().includes(q) ||
      s.snippet.toLowerCase().includes(q) ||
      s.playerName.toLowerCase().includes(q) ||
      s.club.toLowerCase().includes(q)
    );
  }

  S.newsFiltered = list;
}

function renderNews() {
  applyNewsFilters();

  const heroContainer = document.getElementById("fotmobHeroContainer");
  const feedList = document.getElementById("latestFeedList");
  const emptyState = document.getElementById("newsEmptyState");
  const featuredSection = document.getElementById("featuredSection");
  const feedSection = document.getElementById("feedSection");
  const countEl = document.getElementById("newsMetaCount");

  if (!heroContainer || !feedList) return;

  const total = S.newsFiltered.length;
  if (countEl) {
    countEl.textContent = `${total} stor${total === 1 ? "y" : "ies"} matching filters`;
  }

  // Handle empty state
  if (total === 0) {
    featuredSection.style.display = "none";
    feedSection.style.display = "none";
    emptyState.style.display = "block";

    const titleEl = document.getElementById("newsEmptyTitle");
    const textEl = document.getElementById("newsEmptyText");
    const actionBtn = document.getElementById("newsEmptyAction");

    if (S.newsFavOnly && S.favorites.size === 0) {
      titleEl.textContent = "No Starred Players Yet";
      textEl.textContent = "Click the ★ icon next to any player in the Players tab to track their dedicated intelligence updates in this feed.";
      actionBtn.textContent = "Browse Players to Star";
      actionBtn.onclick = () => switchView("players");
    } else {
      titleEl.textContent = "No stories match your filters";
      textEl.textContent = "Try clearing the search query or selecting 'All Leagues' to view all stories.";
      actionBtn.textContent = "Reset News Filters";
      actionBtn.onclick = resetNewsFilters;
    }
    return;
  }

  emptyState.style.display = "none";
  featuredSection.style.display = "block";
  feedSection.style.display = "block";

  // FotMob layout:
  // 1st story: Hero Card on Left
  // Next 4 stories: Trending Column on Right
  // Remaining stories: Latest Wire Grid
  const heroStory = S.newsFiltered[0];
  const trendingStories = S.newsFiltered.slice(1, Math.min(5, total));
  const wireStories = S.newsFiltered.slice(Math.min(5, total));

  // 1. Build FotMob Hero Container
  heroContainer.innerHTML = `
    <!-- Left Hero Card -->
    <div class="fotmob-hero-left" data-pid="${heroStory.playerId}">
      <div class="fotmob-hero-img-wrap">
        <img src="${heroStory.photoUrl}" alt="${heroStory.playerName}" class="fotmob-hero-img" loading="lazy" onerror="this.onerror=null;this.src='images/news/striker_shot.jpg';" />
        <span class="hero-cat-tag ${heroStory.categoryClass}">${heroStory.categoryTag}</span>
      </div>
      <h2 class="fotmob-hero-headline">${heroStory.headline}</h2>
      <p class="fotmob-hero-snippet">${heroStory.snippet}</p>
      <div class="fotmob-hero-meta">
        <span class="source-badge si">SI</span>
        <span class="news-meta-text">· ${heroStory.time}</span>
        <span class="hero-player-chip">${heroStory.playerName} (${heroStory.club}) ›</span>
      </div>
    </div>

    <!-- Right Trending Column -->
    <div class="fotmob-trending-col">
      <h3 class="trending-title">Trending</h3>
      <div class="trending-list">
        ${trendingStories.map((story, idx) => `
          <div class="trending-item" data-pid="${story.playerId}">
            <div class="trending-rank">${idx + 1}</div>
            <div class="trending-info">
              <div class="trending-headline">${story.headline}</div>
              <div class="trending-meta">${story.source || 'FotMob'} · ${story.time}</div>
            </div>
            <img src="${story.photoUrl}" alt="${story.playerName}" class="trending-thumb" loading="lazy" onerror="this.onerror=null;this.src='images/news/striker_shot.jpg';" />
          </div>
        `).join('')}
      </div>
      <div class="trending-footer">
        <button class="trending-see-more" id="trendingSeeMore">See more ↗</button>
      </div>
    </div>
  `;

  // Click on hero card opens player modal
  const heroEl = heroContainer.querySelector(".fotmob-hero-left");
  if (heroEl) {
    heroEl.addEventListener("click", () => {
      const p = S.players.find(x => x.player_id === heroStory.playerId);
      if (p) openModal(p);
    });
  }

  // Click on trending items opens player modal
  heroContainer.querySelectorAll(".trending-item").forEach(item => {
    item.addEventListener("click", () => {
      const pid = item.dataset.pid;
      const p = S.players.find(x => x.player_id === pid);
      if (p) openModal(p);
    });
  });

  // "See more ↗" scroll to wire
  const seeMoreBtn = document.getElementById("trendingSeeMore");
  if (seeMoreBtn) {
    seeMoreBtn.onclick = () => {
      feedSection.scrollIntoView({ behavior: "smooth" });
    };
  }

  // 2. Build Latest Wire Grid (below hero)
  feedList.innerHTML = "";
  if (wireStories.length === 0) {
    feedSection.style.display = "none";
  } else {
    feedSection.style.display = "block";
    wireStories.forEach(story => {
      const card = document.createElement("div");
      card.className = "news-wire-card";
      card.dataset.pid = story.playerId;
      card.innerHTML = `
        <div class="news-wire-thumb">
          <img src="${story.photoUrl}" alt="${story.playerName}" class="news-wire-img" loading="lazy" onerror="this.onerror=null;this.src='images/news/striker_shot.jpg';" />
          <span class="wire-cat-badge ${story.categoryClass}">${story.categoryTag}</span>
        </div>
        <div class="news-wire-body">
          <div class="news-wire-meta">
            <span class="source-badge default">${story.source || 'FotMob'}</span>
            <span class="news-meta-text">· ${story.time}</span>
          </div>
          <h4 class="news-wire-headline">${story.headline}</h4>
          <p class="news-wire-snippet">${story.snippet}</p>
          <div class="news-wire-footer">
            <span class="wire-player-text">${story.playerName} · ${story.club}</span>
            <span class="wire-arrow">›</span>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        const p = S.players.find(x => x.player_id === story.playerId);
        if (p) openModal(p);
      });

      feedList.appendChild(card);
    });
  }
}

function resetNewsFilters() {
  S.newsLeague = "ALL";
  S.newsCategory = "ALL";
  S.newsFavOnly = false;
  S.newsSearch = "";

  const searchInput = document.getElementById("newsSearchInput");
  if (searchInput) searchInput.value = "";

  const favToggle = document.getElementById("newsFavToggle");
  if (favToggle) favToggle.classList.remove("active");

  document.querySelectorAll("#newsLeaguePills .news-pill").forEach(p => {
    p.classList.toggle("active", p.dataset.league === "ALL");
  });
  document.querySelectorAll("#newsCategoryPills .news-cat-pill").forEach(p => {
    p.classList.toggle("active", p.dataset.cat === "ALL");
  });

  renderNews();
}

// ─── LEAGUE FILTER OPTIONS (in Filter Panel) ─────────────────────────────
function buildLeagueFilterOptions() {
  const leagues = [...new Set(S.players.map(p => getLeague(p.club).league))].sort();
  const container = document.getElementById("fpLeague");
  if (!container) return;

  container.innerHTML = `<button class="fp-pill active" data-league="ALL">All Leagues</button>`;
  for (const lg of leagues) {
    const meta = Object.values(CLUB_META).find(m => m.league === lg) || { crest: "🌍" };
    const btn = document.createElement("button");
    btn.className = "fp-pill";
    btn.dataset.league = lg;
    btn.textContent = `${meta.crest} ${lg}`;
    container.appendChild(btn);
  }
}

// ─── TICKER ──────────────────────────────────────────────────────────────
function renderTicker() {
  const tickerEl = document.getElementById("statsTicker");
  if (!tickerEl) return;

  const all = S.players.map(p => getWD(p)).filter(Boolean);
  const slumping = all.filter(d => (d.slump_probability ?? 0) >= 0.65).length;
  const atRisk   = all.filter(d => (d.slump_probability ?? 0) >= 0.35 && (d.slump_probability ?? 0) < 0.65).length;
  const overval  = all.filter(d => (d.overvaluation_score ?? 0) > 8).length;
  const avgForm  = (all.reduce((s, d) => s + (d.per90_score ?? 0), 0) / all.length).toFixed(2);
  const avgSent  = (all.reduce((s, d) => s + (d.sentiment_score ?? 0), 0) / all.length).toFixed(3);

  tickerEl.innerHTML = `
    <div class="ticker-item red"><div class="ticker-label">In Slump</div><div class="ticker-value">${slumping}</div><div class="ticker-sub">≥65% risk</div></div>
    <div class="ticker-item amber"><div class="ticker-label">At Risk</div><div class="ticker-value">${atRisk}</div><div class="ticker-sub">35–65%</div></div>
    <div class="ticker-item blue"><div class="ticker-label">Overvalued</div><div class="ticker-value">${overval}</div><div class="ticker-sub">&gt;€8M gap</div></div>
    <div class="ticker-item green"><div class="ticker-label">Avg Form</div><div class="ticker-value">${avgForm}</div><div class="ticker-sub">per-90 /10</div></div>
    <div class="ticker-item orange"><div class="ticker-label">Avg Sentiment</div><div class="ticker-value">${(+avgSent >= 0 ? "+" : "") + (+avgSent).toFixed(2)}</div><div class="ticker-sub">−1→+1</div></div>
    <div class="ticker-item"><div class="ticker-label">Players</div><div class="ticker-value">${S.players.length}</div><div class="ticker-sub">${[...new Set(S.raw.map(r=>r.week))].length} weeks</div></div>
  `;
}

// ─── MINI SPARKLINE ──────────────────────────────────────────────────────
function drawSpark(canvas, data, color) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = 80, h = 24;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + "px"; canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: 2 + (i / (data.length - 1)) * (w - 4),
    y: h - 3 - ((v - min) / range) * (h - 6),
  }));

  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i-1].x + pts[i].x) / 2;
    ctx.quadraticCurveTo(pts[i-1].x, pts[i-1].y, mx, (pts[i-1].y + pts[i].y) / 2);
  }
  ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
}

// ─── FILTER & SORT (PLAYERS) ─────────────────────────────────────────────
function applyFilters() {
  let pl = S.players;
  const q = S.searchQuery.toLowerCase();
  if (q) pl = pl.filter(p => p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q) || p.position.toLowerCase().includes(q));
  if (S.posFilter !== "ALL") pl = pl.filter(p => p.position === S.posFilter);
  if (S.leagueFilter !== "ALL") pl = pl.filter(p => getLeague(p.club).league === S.leagueFilter);

  // Tabs
  if (S.activeTab === "SLUMP")      pl = pl.filter(p => slumpStatus(getWD(p)?.slump_probability ?? 0) === "slump");
  if (S.activeTab === "OVERVALUED") pl = pl.filter(p => valStatus(getWD(p)?.overvaluation_score ?? 0) === "over");
  if (S.activeTab === "STABLE")     pl = pl.filter(p => slumpStatus(getWD(p)?.slump_probability ?? 0) === "stable");
  if (S.activeTab === "FAVORITES")  pl = pl.filter(p => S.favorites.has(p.player_id));

  pl = [...pl].sort((a, b) => {
    const wa = getWD(a), wb = getWD(b);
    if (S.sortBy === "name") return a.name.localeCompare(b.name);
    return (wb?.[S.sortBy] ?? 0) - (wa?.[S.sortBy] ?? 0);
  });
  S.filtered = pl;

  updateFilterChips();
}

function updateFilterChips() {
  const chipList = document.getElementById("chipList");
  const countBadge = document.getElementById("filterCount");
  if (!chipList) return;

  const chips = [];
  let count = 0;

  if (S.posFilter !== "ALL") {
    chips.push({ label: `Pos: ${S.posFilter}`, clear: () => setPosFilter("ALL") });
    count++;
  }
  if (S.leagueFilter !== "ALL") {
    chips.push({ label: S.leagueFilter, clear: () => setLeagueFilter("ALL") });
    count++;
  }
  if (S.sortBy !== "slump_probability") {
    const labels = { overvaluation_score: "Overvaluation", per90_score: "Form", market_value: "Market Value", name: "A–Z" };
    chips.push({ label: `Sort: ${labels[S.sortBy] || S.sortBy}`, clear: () => setSortBy("slump_probability") });
    count++;
  }

  if (countBadge) {
    countBadge.textContent = count > 0 ? count : "";
  }

  chipList.innerHTML = "";
  chips.forEach(c => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `<span>${c.label}</span><span class="chip-x">✕</span>`;
    chip.addEventListener("click", c.clear);
    chipList.appendChild(chip);
  });
}

function setPosFilter(pos) {
  S.posFilter = pos;
  document.querySelectorAll("#fpPos .fp-pill").forEach(p => p.classList.toggle("active", p.dataset.pos === pos));
  render();
}

function setLeagueFilter(lg) {
  S.leagueFilter = lg;
  document.querySelectorAll("#fpLeague .fp-pill").forEach(p => p.classList.toggle("active", p.dataset.league === lg));
  render();
}

function setSortBy(sort) {
  S.sortBy = sort;
  document.querySelectorAll("#fpSort .fp-pill").forEach(p => p.classList.toggle("active", p.dataset.sort === sort));
  render();
}

// ─── BUILD PLAYER ROW ─────────────────────────────────────────────────────
function buildRow(player) {
  const wd = getWD(player);
  if (!wd) return null;
  const prob = wd.slump_probability ?? 0;
  const overval = wd.overvaluation_score ?? 0;
  const st = slumpStatus(prob);
  const vs = valStatus(overval);
  const sent = wd.sentiment_score ?? 0;
  const sentClass = sent > 0.05 ? "pos" : sent < -0.05 ? "neg" : "neu";
  const pct = prob * 100;
  const slumpPct = pct < 1 ? pct.toFixed(1) + "%" : pct.toFixed(0) + "%";
  const slumpClass = st === "slump" ? "danger" : st === "at-risk" ? "warn" : "dim";
  const deltaSign = overval > 0 ? "+" : "";
  const deltaArrow = overval > 4 ? "↑" : overval < -4 ? "↓" : "→";

  const sparkColor = st === "slump" ? "#e53935" : st === "at-risk" ? "#f9a825" : "#43a047";
  const per90History = player.weeks.map(w => w.per90_score ?? 0);
  const isStarred = S.favorites.has(player.player_id);

  const avatarUrl = getPlayerAvatar(player);
  const fallbackSvg = getInitialsAvatar(player);
  const scoreVal = wd.per90_score ?? 0;
  const ratingTier = scoreVal >= 6.8 ? "elite" : scoreVal >= 5.6 ? "good" : "low";

  const row = document.createElement("div");
  row.className = "player-row";
  row.id = `row-${player.player_id}`;
  row.dataset.pid = player.player_id;
  row.innerHTML = `
    <div class="row-star ${isStarred ? "starred" : ""}" data-star-id="${player.player_id}" title="${isStarred ? "Remove from favorites" : "Add to favorites"}">
      <svg width="13" height="13" viewBox="0 0 20 20" fill="${isStarred ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8">
        <path d="M10 1l2.5 6.2H19l-5.4 4 2 6.2L10 13.7l-5.6 3.5 2-6.2L1 7.2h6.5z"/>
      </svg>
    </div>
    <div><span class="row-dot ${st}"></span></div>
    <div class="row-player">
      <div class="player-avatar-wrap">
        <img class="player-headshot" src="${avatarUrl}" alt="${player.name}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackSvg}';" />
      </div>
      <div class="player-info-col">
        <div class="row-name">${player.name}</div>
        <div class="row-club">${player.club} · ${player.position}</div>
      </div>
    </div>
    <div class="row-spark"><canvas class="mini-spark" id="sp-${player.player_id}"></canvas></div>
    <div class="row-score">
      <span class="rating-badge ${ratingTier}">${scoreVal.toFixed(2)}</span>
    </div>
    <div class="row-slump ${slumpClass}">${slumpPct}</div>
    <div class="row-mv">€${(wd.market_value ?? 0).toFixed(1)}M</div>
    <div class="row-pred">€${(wd.predicted_value ?? 0).toFixed(1)}M</div>
    <div class="row-delta ${vs}">${deltaArrow}${deltaSign}€${Math.abs(overval).toFixed(1)}M</div>
    <div class="row-sent ${sentClass}">${sent >= 0 ? "+" : ""}${sent.toFixed(2)}</div>
  `;

  // Row click opens modal
  row.addEventListener("click", () => openModal(player));

  // Star toggle
  const starEl = row.querySelector(".row-star");
  starEl.addEventListener("click", e => {
    e.stopPropagation();
    toggleFavorite(player.player_id);
  });

  requestAnimationFrame(() => {
    const c = document.getElementById(`sp-${player.player_id}`);
    if (c) drawSpark(c, per90History, sparkColor);
  });
  return row;
}

// ─── RENDER PLAYERS LIST ─────────────────────────────────────────────────
function render() {
  applyFilters();
  const list = document.getElementById("playerList");
  if (!list) return;

  list.innerHTML = "";
  const frag = document.createDocumentFragment();

  if (S.filtered.length === 0) {
    const el = document.createElement("div");
    el.className = "empty-row";
    el.textContent = S.activeTab === "FAVORITES"
      ? "No favorited players yet. Click the ★ icon next to any player to pin them to this view."
      : "No players match your filters.";
    frag.appendChild(el);
    list.appendChild(frag);
    return;
  }

  // Group by league
  const groups = new Map();
  for (const p of S.filtered) {
    const lg = getLeague(p.club).league;
    if (!groups.has(lg)) groups.set(lg, []);
    groups.get(lg).push(p);
  }

  // Sort groups by the max value of the sort key
  const groupMaxVal = new Map();
  for (const [lg, players] of groups.entries()) {
    if (S.sortBy === 'name') {
      groupMaxVal.set(lg, players[0]?.name || '');
    } else {
      groupMaxVal.set(lg, Math.max(...players.map(p => getWD(p)?.[S.sortBy] ?? 0)));
    }
  }
  const ordered = [...groups.keys()].sort((a, b) => {
    const av = groupMaxVal.get(a), bv = groupMaxVal.get(b);
    if (S.sortBy === 'name') return String(av).localeCompare(String(bv));
    return bv - av;
  });

  for (const league of ordered) {
    if (!groups.has(league)) continue;
    const players = groups.get(league);
    const meta = Object.values(CLUB_META).find(m => m.league === league) || { crest: "🌍" };

    const group = document.createElement("div");
    group.className = "league-group";

    // League header row
    const header = document.createElement("div");
    header.className = "league-header";
    const collapsed = S.collapsedLeagues.has(league);
    if (collapsed) header.classList.add("collapsed");
    header.innerHTML = `
      <span class="league-crest-big">${meta.crest}</span>
      <span class="league-name">${league}</span>
      <span class="league-count">${players.length} player${players.length !== 1 ? "s" : ""}</span>
      <span class="league-chevron">›</span>
    `;
    header.addEventListener("click", () => {
      if (S.collapsedLeagues.has(league)) S.collapsedLeagues.delete(league);
      else S.collapsedLeagues.add(league);
      header.classList.toggle("collapsed");
      rowsWrap.style.display = S.collapsedLeagues.has(league) ? "none" : "";
    });
    group.appendChild(header);

    // Rows container
    const rowsWrap = document.createElement("div");
    rowsWrap.className = "league-rows";
    if (collapsed) rowsWrap.style.display = "none";
    for (const player of players) {
      const row = buildRow(player);
      if (row) rowsWrap.appendChild(row);
    }
    group.appendChild(rowsWrap);
    frag.appendChild(group);
  }

  list.appendChild(frag);
  updateFavoritesUI();
}

// ─── DETAIL MODAL ────────────────────────────────────────────────────────
function destroyCharts() {
  for (const c of Object.values(S.modalCharts)) c.destroy();
  S.modalCharts = {};
}

const chartCfg = (labels, datasets, type = "line") => ({
  type,
  data: { labels, datasets },
  options: {
    responsive: true,
    animation: { duration: 350 },
    plugins: {
      legend: {
        display: datasets.length > 1,
        labels: { color: "#6b6b72", font: { size: 10, family: "Inter" }, boxWidth: 16, padding: 8 }
      }
    },
    scales: {
      x: { ticks: { color: "#6b6b72", font: { size: 9 }, maxTicksLimit: 10 }, grid: { color: "rgba(255,255,255,0.04)" } },
      y: { ticks: { color: "#6b6b72", font: { size: 9 } }, grid: { color: "rgba(255,255,255,0.06)" } },
    },
  },
});

function openModal(player) {
  destroyCharts();
  S.currentModalPlayer = player;
  const wd = getWD(player);
  if (!wd) return;
  const weeks = player.weeks;
  const labels = weeks.map(w => `W${w.week}`);
  const prob = wd.slump_probability ?? 0;
  const overval = wd.overvaluation_score ?? 0;
  const st = slumpStatus(prob);

  document.getElementById("modalPosTag").textContent = player.position;
  document.getElementById("modalName").textContent = player.name;
  document.getElementById("modalClub").textContent = player.club;

  const modalHeadshot = document.getElementById("modalHeadshot");
  if (modalHeadshot) {
    modalHeadshot.src = getPlayerAvatar(player);
    modalHeadshot.alt = player.name;
    modalHeadshot.onerror = () => { modalHeadshot.src = getInitialsAvatar(player); };
  }

  // Star in modal
  const modalStar = document.getElementById("modalStarBtn");
  if (modalStar) {
    modalStar.classList.toggle("starred", S.favorites.has(player.player_id));
    modalStar.onclick = () => toggleFavorite(player.player_id);
  }

  // Jump to row button
  const jumpBtn = document.getElementById("modalJumpBtn");
  if (jumpBtn) {
    jumpBtn.onclick = () => {
      closeModal();
      switchView("players");
      setTimeout(() => {
        const row = document.getElementById(`row-${player.player_id}`);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          row.classList.remove("row-flash");
          void row.offsetWidth; // re-flow
          row.classList.add("row-flash");
        }
      }, 100);
    };
  }

  const kpiColor = st === "slump" ? "#e53935" : st === "at-risk" ? "#f9a825" : "#43a047";
  const oColor   = overval > 5 ? "#e53935" : overval < -5 ? "#43a047" : "#9a9aa8";
  const sentColor = (wd.sentiment_score ?? 0) >= 0 ? "#43a047" : "#e53935";

  document.getElementById("modalKPIBar").innerHTML = `
    <div class="kpi-item"><div class="kpi-label">Form Score</div><div class="kpi-value" style="color:#5c9cf5">${(wd.per90_score??0).toFixed(2)}</div><div class="kpi-sub">per-90 /10</div></div>
    <div class="kpi-item"><div class="kpi-label">Slump Prob.</div><div class="kpi-value" style="color:${kpiColor}">${(prob*100).toFixed(0)}%</div><div class="kpi-sub">${st.replace("-"," ")}</div></div>
    <div class="kpi-item"><div class="kpi-label">Market Value</div><div class="kpi-value">€${(wd.market_value??0).toFixed(1)}M</div><div class="kpi-sub">Transfermarkt</div></div>
    <div class="kpi-item"><div class="kpi-label">Overvaluation</div><div class="kpi-value" style="color:${oColor}">${overval>=0?"+":""}€${Math.abs(overval).toFixed(1)}M</div><div class="kpi-sub">vs model</div></div>
    <div class="kpi-item"><div class="kpi-label">Sentiment</div><div class="kpi-value" style="color:${sentColor}">${(wd.sentiment_score??0)>=0?"+":""}${(wd.sentiment_score??0).toFixed(3)}</div><div class="kpi-sub">this week</div></div>
  `;

  // Form chart
  S.modalCharts.form = new Chart(document.getElementById("chartForm"), chartCfg(labels, [
    { label: "per-90", data: weeks.map(w=>(w.per90_score??0).toFixed(3)), borderColor:"#5c9cf5", backgroundColor:"rgba(92,156,245,0.08)", tension:0.4, fill:true, pointRadius:1.5 },
    { label: "5w avg", data: weeks.map(w=>(w.per90_rolling_mean_5w??0).toFixed(3)), borderColor:"#f60", backgroundColor:"transparent", tension:0.4, borderDash:[4,3], pointRadius:0 },
  ]));

  // Value chart
  S.modalCharts.value = new Chart(document.getElementById("chartValue"), chartCfg(labels, [
    { label: "Market (€M)", data: weeks.map(w=>(w.market_value??0).toFixed(2)), borderColor:"#f9a825", backgroundColor:"rgba(249,168,37,0.07)", tension:0.4, fill:false, pointRadius:1.5 },
    { label: "Predicted (€M)", data: weeks.map(w=>(w.predicted_value??0).toFixed(2)), borderColor:"#9a9aa8", backgroundColor:"transparent", tension:0.4, borderDash:[4,3], pointRadius:0 },
  ]));

  // Sentiment chart
  S.modalCharts.sent = new Chart(document.getElementById("chartSentiment"), chartCfg(labels, [
    { label: "Sentiment", data: weeks.map(w=>(w.sentiment_score??0).toFixed(4)), borderColor:"#43a047", backgroundColor:"rgba(67,160,71,0.08)", tension:0.4, fill:true, pointRadius:1.5 },
    { label: "4w avg",    data: weeks.map(w=>(w.sentiment_rolling_mean??0).toFixed(4)), borderColor:"#5c9cf5", backgroundColor:"transparent", tension:0.4, borderDash:[4,3], pointRadius:0 },
  ]));

  // Slump bar chart
  const slumpVals = weeks.map(w=>+((w.slump_probability??0)*100).toFixed(1));
  S.modalCharts.slump = new Chart(document.getElementById("chartSlump"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Slump %",
        data: slumpVals,
        backgroundColor: slumpVals.map(v => v>=65?"rgba(229,57,53,0.75)":v>=35?"rgba(249,168,37,0.65)":"rgba(67,160,71,0.55)"),
        borderRadius: 2
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 350 },
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color:"#6b6b72", font:{size:9}, maxTicksLimit:10 }, grid: { color:"rgba(255,255,255,0.04)" } },
        y: { min:0, max:100, ticks: { color:"#6b6b72", font:{size:9}, callback: v=>v+"%" }, grid: { color:"rgba(255,255,255,0.06)" } },
      }
    },
  });

  // Feature attributions
  const feats = [
    { name:"Form Trend (5w)", val: Math.abs(wd.per90_trend_5w??0)*100, desc:(wd.per90_trend_5w??0)<0?"Declining form over 5 weeks":"Improving form" },
    { name:"Form Z-Score",     val: Math.min(100,Math.abs(wd.form_z??0)*30), desc:`Z=${(wd.form_z??0).toFixed(2)} vs seasonal avg` },
    { name:"Sentiment Signal", val: Math.min(100,Math.abs(wd.sentiment_score??0)*80), desc:(wd.sentiment_score??0)<0?"Negative fan sentiment":"Positive sentiment" },
    { name:"Volume Momentum",  val: Math.min(100,Math.abs((wd.volume_momentum??1)-1)*120), desc:(wd.volume_momentum??1)>1.2?"Mention spike":"Normal volume" },
    { name:"Form Decay (EWM)", val: Math.min(100,Math.abs((wd.per90_score??0)-(wd.per90_decay??0))*25), desc:"Gap vs exponential baseline" },
    { name:"Overvaluation Gap",val: Math.min(100,Math.abs(wd.overvaluation_score??0)*2), desc:`€${Math.abs(overval).toFixed(1)}M ${overval>0?"above":"below"} model` },
  ].sort((a,b)=>b.val-a.val);

  document.getElementById("insightGrid").innerHTML = feats.map(f=>`
    <div class="insight-item">
      <div class="insight-feat">${f.name}</div>
      <div class="insight-bar-row">
        <div class="insight-track"><div class="insight-fill" style="width:${f.val.toFixed(0)}%"></div></div>
        <div class="insight-pct">${f.val.toFixed(0)}%</div>
      </div>
      <div class="insight-desc">${f.desc}</div>
    </div>
  `).join("");

  document.getElementById("modalBackdrop").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("open");
  document.body.style.overflow = "";
  destroyCharts();
  S.currentModalPlayer = null;
}

// ─── TOP LEVEL NAVIGATION SWITCHING ──────────────────────────────────────
function switchView(viewName) {
  S.activeView = viewName;

  document.querySelectorAll(".topnav-link").forEach(l => {
    l.classList.toggle("active", l.dataset.view === viewName);
  });

  const playersView = document.getElementById("viewPlayers");
  const newsView = document.getElementById("viewNews");
  const synthTag = document.getElementById("topNavSynthBadge");

  if (viewName === "news") {
    playersView.style.display = "none";
    newsView.style.display = "block";
    if (synthTag) synthTag.style.display = "inline-flex";
    renderNews();
  } else if (viewName === "players") {
    playersView.style.display = "block";
    newsView.style.display = "none";
    if (synthTag) synthTag.style.display = "none";
    render();
  } else if (viewName === "rankings") {
    playersView.style.display = "block";
    newsView.style.display = "none";
    if (synthTag) synthTag.style.display = "none";
    // Set to Form Score sort
    document.querySelectorAll(".sport-tab").forEach(t => t.classList.remove("active"));
    document.getElementById("tabAll")?.classList.add("active");
    S.activeTab = "ALL";
    setSortBy("per90_score");
  } else if (viewName === "transfers") {
    playersView.style.display = "block";
    newsView.style.display = "none";
    if (synthTag) synthTag.style.display = "none";
    // Set to Overvalued tab
    document.querySelectorAll(".sport-tab").forEach(t => t.classList.remove("active"));
    document.getElementById("tabOvervalued")?.classList.add("active");
    S.activeTab = "OVERVALUED";
    setSortBy("overvaluation_score");
  }
}

// ─── EVENT HANDLERS ───────────────────────────────────────────────────────
function initEvents() {
  // Topnav navigation
  document.querySelectorAll(".topnav-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view) switchView(view);
    });
  });

  // Search input in players tab
  let st;
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  searchInput.addEventListener("input", e => {
    clearTimeout(st);
    const val = e.target.value;
    searchClear.style.display = val ? "block" : "none";
    st = setTimeout(() => { S.searchQuery = val.trim(); render(); }, 150);
  });
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.style.display = "none";
    S.searchQuery = "";
    render();
  });

  // Filter button & dropdown panel
  const filterBtn = document.getElementById("filterBtn");
  const filterPanel = document.getElementById("filterPanel");
  const filterBackdrop = document.getElementById("filterBackdrop");
  const fpClose = document.getElementById("fpClose");
  const fpReset = document.getElementById("fpReset");

  function openFilterPanel() {
    filterPanel.hidden = false;
    filterBackdrop.classList.add("open");
    filterBtn.setAttribute("aria-expanded", "true");
  }
  function closeFilterPanel() {
    filterPanel.hidden = true;
    filterBackdrop.classList.remove("open");
    filterBtn.setAttribute("aria-expanded", "false");
  }

  filterBtn.addEventListener("click", () => {
    if (filterPanel.hidden) openFilterPanel();
    else closeFilterPanel();
  });
  filterBackdrop.addEventListener("click", closeFilterPanel);
  fpClose.addEventListener("click", closeFilterPanel);

  fpReset.addEventListener("click", () => {
    S.posFilter = "ALL";
    S.leagueFilter = "ALL";
    S.sortBy = "slump_probability";
    document.querySelectorAll("#fpPos .fp-pill").forEach(p => p.classList.toggle("active", p.dataset.pos === "ALL"));
    document.querySelectorAll("#fpLeague .fp-pill").forEach(p => p.classList.toggle("active", p.dataset.league === "ALL"));
    document.querySelectorAll("#fpSort .fp-pill").forEach(p => p.classList.toggle("active", p.dataset.sort === "slump_probability"));
    render();
  });

  // Position pills in filter panel
  document.getElementById("fpPos").addEventListener("click", e => {
    const pill = e.target.closest(".fp-pill");
    if (!pill) return;
    setPosFilter(pill.dataset.pos);
  });

  // League pills in filter panel
  document.getElementById("fpLeague").addEventListener("click", e => {
    const pill = e.target.closest(".fp-pill");
    if (!pill) return;
    setLeagueFilter(pill.dataset.league);
  });

  // Sort pills in filter panel
  document.getElementById("fpSort").addEventListener("click", e => {
    const pill = e.target.closest(".fp-pill");
    if (!pill) return;
    setSortBy(pill.dataset.sort);
  });

  // Week selector
  document.getElementById("weekSelect").addEventListener("change", e => {
    const v = e.target.value;
    const allWeeks = [...new Set(S.raw.map(r => r.week))].sort((a,b) => a-b);
    S.selectedWeek = v === "latest" ? allWeeks[allWeeks.length-1] : parseInt(v);
    renderTicker();
    render();
    S.allNews = generateAllNews(S.players, S.selectedWeek);
    if (S.activeView === "news") renderNews();
  });

  // Sport tabs (Status tabs)
  document.querySelectorAll(".sport-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".sport-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      if (tab.id === "tabAll") S.activeTab = "ALL";
      else if (tab.id === "tabSlumps") S.activeTab = "SLUMP";
      else if (tab.id === "tabOvervalued") S.activeTab = "OVERVALUED";
      else if (tab.id === "tabStable") S.activeTab = "STABLE";
      else if (tab.id === "tabFavorites") S.activeTab = "FAVORITES";

      render();
    });
  });

  // ─── NEWS EVENTS ───────────────────────────────────────────────────────
  // News Search
  let nst;
  const newsSearch = document.getElementById("newsSearchInput");
  const newsSearchClear = document.getElementById("newsSearchClear");
  if (newsSearch) {
    newsSearch.addEventListener("input", e => {
      clearTimeout(nst);
      const val = e.target.value;
      if (newsSearchClear) newsSearchClear.style.display = val ? "block" : "none";
      nst = setTimeout(() => { S.newsSearch = val.trim(); renderNews(); }, 150);
    });
  }
  if (newsSearchClear) {
    newsSearchClear.addEventListener("click", () => {
      newsSearch.value = "";
      newsSearchClear.style.display = "none";
      S.newsSearch = "";
      renderNews();
    });
  }

  // News Favorites Toggle
  const favToggle = document.getElementById("newsFavToggle");
  if (favToggle) {
    favToggle.addEventListener("click", () => {
      S.newsFavOnly = !S.newsFavOnly;
      favToggle.classList.toggle("active", S.newsFavOnly);
      renderNews();
    });
  }

  // News League Pills
  const newsLeaguePills = document.getElementById("newsLeaguePills");
  if (newsLeaguePills) {
    newsLeaguePills.addEventListener("click", e => {
      const pill = e.target.closest(".news-pill");
      if (!pill) return;
      newsLeaguePills.querySelectorAll(".news-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      S.newsLeague = pill.dataset.league;
      renderNews();
    });
  }

  // News Category Pills
  const newsCategoryPills = document.getElementById("newsCategoryPills");
  if (newsCategoryPills) {
    newsCategoryPills.addEventListener("click", e => {
      const pill = e.target.closest(".news-cat-pill");
      if (!pill) return;
      newsCategoryPills.querySelectorAll(".news-cat-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      S.newsCategory = pill.dataset.cat;
      renderNews();
    });
  }

  // Modal close handlers
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalBackdrop").addEventListener("click", e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}

// ─── CHIBI MESSI LOADING SCREEN ANIMATION CONTROLLER ────────────────────
function runLoadingAnimation(onComplete) {
  const runner = document.getElementById("chibiRunnerGroup");
  const fill = document.getElementById("loadingBarFill");
  const counter = document.getElementById("loadingPctCounter");
  const status = document.getElementById("loadingStatusText");
  const goal = document.getElementById("loadingGoalPost");

  if (!runner || !fill || !counter || !status) {
    if (onComplete) onComplete();
    return;
  }

  // Clean, professional steps without emojis
  const steps = [
    { at: 18, text: "Taking the pitch and ingesting match stats..." },
    { at: 42, text: "Calculating 5-week form trends and slump probabilities..." },
    { at: 68, text: "Evaluating transfer valuation gaps vs ML model..." },
    { at: 88, text: "Synthesizing fan sentiment and intelligence wire..." },
    { at: 100, text: "Goal scored. 105 player intelligence models loaded." },
  ];

  const duration = 3400; // Slower, smooth 3.4s dribble run across bar
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / duration);
    // Smooth ease-out curve
    const eased = 1 - Math.pow(1 - progress, 2.2);
    const pct = Math.min(100, Math.round(eased * 100));

    // Move fill and Chibi Messi along the bar
    fill.style.width = pct + "%";
    runner.style.left = pct + "%";
    counter.textContent = pct + "%";

    // Update dynamic status text
    const activeStep = steps.find(s => pct <= s.at) || steps[steps.length - 1];
    if (activeStep && status.textContent !== activeStep.text) {
      status.textContent = activeStep.text;
    }

    // Goal scored & celebration jump
    if (pct >= 96) {
      if (goal) goal.classList.add("goal-scored");
      runner.classList.add("goal-celebration");
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      setTimeout(() => {
        const overlay = document.getElementById("loadingOverlay");
        if (overlay) {
          overlay.classList.add("fade-out");
          setTimeout(() => {
            overlay.style.display = "none";
            if (onComplete) onComplete();
          }, 450);
        }
      }, 550);
    }
  }

  requestAnimationFrame(tick);
}

// ─── INITIALIZATION ───────────────────────────────────────────────────────
async function init() {
  try {
    document.getElementById("playerList").innerHTML = `<div class="empty-row">Loading player intelligence…</div>`;
    
    // Load dataset and setup UI
    const dataPromise = loadData().then(() => {
      renderTicker();
      render();
      initEvents();
    });

    // Run cute chibi kicking progress animation along the loading bar
    runLoadingAnimation(async () => {
      await dataPromise;
    });

  } catch (err) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = "none";
    document.getElementById("playerList").innerHTML = `
      <div class="empty-row">
        ⚠ Could not load results.json — run <code>python run_pipeline.py</code> first, then serve with <code>python -m http.server 8000</code><br>
        <small style="color:#6b6b72">${err.message}</small>
      </div>`;
    console.error("Initialization error:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);
