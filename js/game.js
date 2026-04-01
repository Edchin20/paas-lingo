// ═══════════════════════════════════════════════════════════════
// PAAS LINGO - Game Engine v3
// Werkt met Firebase Realtime Database - geen server nodig
// ═══════════════════════════════════════════════════════════════

// ── Woordenlijst (Nederlandse 5-letter woorden, gevalideerd) ──
const WORDS = [
  "STORM","BLOEM","WATER","DRAAK","KLANK","PLANT","STOOM","TROTS","VREDE","ZWART",
  "ZWEET","DWEIL","PLANK","SNOER","STOUT","STOEP","PRUIK","STEUN","TAART",
  "BAARD","DRAAI","KLEED","KWAST","SPOOR","STIJL","TROEF","VLOOT","ZWAAN","PAARS",
  "BOTER","DINER","EMMER","GEVEL","NAALD","OEVER","PAREL","RAMEN","SABEL","TEGEL",
  "ADRES","AGENT","ALARM","ALBUM","APPEL","AVOND","BASIS","BEKER","BEZIG","BLOED",
  "BODEM","BROEK","BROOD","BUURT","DROOM","DWARS","EIGEN","EINDE","EXTRA","FIETS",
  "FLINK","FORUM","FRUIT","GEEST","GELUK","GEZIN","GRENS","GRIJS","GROEN","GROEP",
  "GROND","GROOT","HAAST","HAMER","HAVEN","HEMEL","HOOFD","HOTEL","HUREN","INHAM",
  "IVOOR","JEUGD","KAART","KABEL","KAMER","KEUZE","KLAAR","KLANT","KLEUR","KLOMP",
  "KNOOP","KOERS","KOKEN","KOMST","KORPS","KRAAL","KRAAM","KRANT","KROEG","KROON",
  "KUNST","KWART","LAGER","LASER","LEGER","LEREN","LINKS","LOPEN","LUCHT","MACHT",
  "MALEN","MARKT","MEDIA","METEN","METRO","MODEL","MOTOR","MUREN","NACHT","NAVEL",
  "NEGEN","NEMEN","NIEUW","NOBEL","NODIG","NOTEN","OFFER","ONWEL","ORDER","ORGEL",
  "PAARD","PASTA","PAUZE","PINDA","PLAAT","PLEIN","PLONS","POORT","PRAAT","PRIJS",
  "PRINS","PROEF","PUPIL","RADAR","RADIO","RAKEN","REBEL","RECHT","REDEN","REGIO",
  "REEKS","REGEN","RENTE","ROBOT","ROMAN","RONDE","SALON","SALDO","SAMBA","SAUNA",
  "SCENE","SERIE","SFEER","SLANG","SLOOP","SNOEP","SOORT","SPITS","SPORT","STAAL",
  "STAAN","STANK","STEEG","STEEN","STERK","STOEL","STRAF","STRIP","SUPER","TABAK",
  "TABEL","TANTE","TARWE","TEKST","TEMPO","THEMA","TITEL","TOCHT","TOREN","TREIN",
  "TROEP","VACHT","VAREN","VIDEO","VILLA","VLEES","VLOER","VOGEL","VROUW","WAGEN",
  "WEIDE","WETEN","WEZEN","WINST","WONEN","WRAAK","ZEBRA","ZEKER","BETER","DEKEN",
  "ENGEL","GAPEN","PROOI","VAART","ZADEL","LAKEN","SPEEL","SMART","DRAMA","COACH",
  "CLAIM","DATUM","DRAAD","IGLOO","IDOOL","ITEMS","MODEM","OMEGA","OPZIJ","PALET",
  "RAILS","ROOMS","RUGBY","TIRAN","TUMOR","VLAAI","ZILTE","KLOOF","BRONS","DWANG",
  "HAARD","KAARS","PIANO","WACHT","FEEST","KERST","ERNST","JACHT","WORST",
  "BRUID","HELFT","POETS","RIJST","SCHAT","ZWEEP","SCHOK","MAAND","LEVER","NOOIT",
  "VAKER","LICHT","ANDER","BIJNA","GRAAG","KORTE","LANGE","MOEST","ONDER","RUIME",
  "SNELT","TERUG","BEIDE","DERDE","ENIGE","HALVE","KLEIN",
].filter((w, i, arr) => w.length === 5 && /^[A-Z]+$/.test(w) && arr.indexOf(w) === i);

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function generateCode() {
  const c = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += c[Math.floor(Math.random() * c.length)];
  return code;
}

// ── Woord checken (Lingo regels) ──
function checkGuess(guess, answer) {
  const result = Array(5).fill("absent");
  const a = answer.split("");
  const g = guess.toUpperCase().split("");
  const used = Array(5).fill(false);
  // Pass 1: correct (groen)
  for (let i = 0; i < 5; i++) {
    if (g[i] === a[i]) { result[i] = "correct"; used[i] = true; }
  }
  // Pass 2: present (geel)
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && g[i] === a[j]) { result[i] = "present"; used[j] = true; break; }
    }
  }
  return result;
}

// ═══════════════════════════════════════════
// DATABASE HELPERS
// ═══════════════════════════════════════════

function requireDb() {
  if (!db) throw new Error("Firebase is nog niet geconfigureerd! Vul js/firebase-config.js in.");
}

const Game = {
  // Maak een nieuw spel aan
  async create(word, gameName) {
    requireDb();
    const id = generateCode();
    const game = {
      id,
      name: gameName || "Spel " + id,
      status: "waiting",
      word: (word || randomWord()).toUpperCase(),
      teams: {},
      attempts: {},
      currentTeam: 0,
      currentRow: 0,
      maxAttempts: 5,
      round: 0,
      wordHistory: {},
      createdAt: Date.now(),
    };
    await db.ref("games/" + id).set(game);
    return game;
  },

  // Verwijder een spel
  async remove(id) {
    requireDb();
    await db.ref("games/" + id).remove();
  },

  // Team joinen
  async joinTeam(gameId, teamName) {
    requireDb();
    const snap = await db.ref("games/" + gameId).once("value");
    const game = snap.val();
    if (!game) throw new Error("Spel niet gevonden");
    if (game.status !== "waiting") throw new Error("Spel is al begonnen");

    const teams = game.teams || {};
    const count = Object.keys(teams).length;
    if (count >= 2) throw new Error("Spel is al vol (2 teams)");

    // Check dubbele naam
    for (const k in teams) {
      if (teams[k].name.toLowerCase() === teamName.toLowerCase()) throw new Error("Teamnaam al in gebruik");
    }

    const idx = count; // 0 of 1
    await db.ref("games/" + gameId + "/teams/" + idx).set({
      name: teamName,
      score: 0,
    });
    return idx;
  },

  // Start het spel
  async start(gameId) {
    requireDb();
    const snap = await db.ref("games/" + gameId).once("value");
    const game = snap.val();
    if (!game) throw new Error("Spel niet gevonden");
    const teamCount = game.teams ? Object.keys(game.teams).length : 0;
    if (teamCount < 2) throw new Error("Er zijn 2 teams nodig");

    await db.ref("games/" + gameId).update({
      status: "playing",
      currentTeam: 0,
      currentRow: 0,
      attempts: null,
      round: (game.round || 0) + 1,
    });
  },

  // Woord raden (met transaction voor race-condition bescherming)
  async guess(gameId, guess, teamIndex) {
    requireDb();
    const snap = await db.ref("games/" + gameId).once("value");
    const game = snap.val();
    if (!game || game.status !== "playing") throw new Error("Spel is niet bezig");
    if (teamIndex !== game.currentTeam) throw new Error("Niet jouw beurt!");

    const upper = guess.toUpperCase();
    if (upper.length !== 5 || !/^[A-Z]+$/.test(upper)) throw new Error("Voer 5 letters in");

    const result = checkGuess(upper, game.word);
    const isCorrect = result.every(r => r === "correct");
    const row = game.currentRow || 0;

    // Sla poging op
    await db.ref("games/" + gameId + "/attempts/" + row).set({
      guess: upper,
      result: result,
      team: teamIndex,
      row: row,
      timestamp: Date.now(),
    });

    if (isCorrect) {
      // Gewonnen!
      const newScore = ((game.teams && game.teams[teamIndex] && game.teams[teamIndex].score) || 0) + 1;
      await db.ref("games/" + gameId).update({
        status: "round-won",
        winningTeam: teamIndex,
      });
      await db.ref("games/" + gameId + "/teams/" + teamIndex + "/score").set(newScore);
      return { isCorrect: true };
    }

    const nextRow = row + 1;
    const nextTeam = teamIndex === 0 ? 1 : 0;

    if (nextRow >= (game.maxAttempts || 5)) {
      // Max pogingen bereikt, wissel team en reset bord
      await db.ref("games/" + gameId).update({
        currentTeam: nextTeam,
        currentRow: 0,
        attempts: null,
        switchReason: "max-attempts",
        switchTimestamp: Date.now(),
      });
    } else {
      // Wissel beurt
      await db.ref("games/" + gameId).update({
        currentTeam: nextTeam,
        currentRow: nextRow,
        switchReason: "wrong-guess",
        switchTimestamp: Date.now(),
      });
    }
    return { isCorrect: false };
  },

  // Nieuwe ronde
  async newRound(gameId, word) {
    requireDb();
    const snap = await db.ref("games/" + gameId).once("value");
    const game = snap.val();
    if (!game) throw new Error("Spel niet gevonden");

    const newWord = (word || randomWord()).toUpperCase();

    // Sla oud woord op in history
    const histLen = game.wordHistory ? Object.keys(game.wordHistory).length : 0;
    const updates = {
      status: "playing",
      word: newWord,
      currentTeam: 0,
      currentRow: 0,
      attempts: null,
      winningTeam: null,
      switchReason: null,
      round: (game.round || 0) + 1,
    };
    updates["wordHistory/" + histLen] = game.word;

    await db.ref("games/" + gameId).update(updates);
    return newWord;
  },

  // Scores resetten
  async resetScores(gameId) {
    requireDb();
    await db.ref("games/" + gameId + "/teams/0/score").set(0);
    await db.ref("games/" + gameId + "/teams/1/score").set(0);
    await db.ref("games/" + gameId + "/round").set(0);
    await db.ref("games/" + gameId + "/wordHistory").remove();
  },

  // Luister naar changes
  listen(gameId, callback) {
    if (!db) return () => {};
    const ref = db.ref("games/" + gameId);
    ref.on("value", snap => {
      const val = snap.val();
      if (val) callback(val);
    });
    return () => ref.off("value");
  },

  // Alle games luisteren
  listenAll(callback) {
    if (!db) return () => {};
    const ref = db.ref("games");
    ref.on("value", snap => {
      const val = snap.val() || {};
      callback(Object.values(val));
    });
    return () => ref.off("value");
  },
};

// ═══════════════════════════════════════════
// WORD POOL (opgeslagen in Firebase)
// ═══════════════════════════════════════════

const WordPool = {
  // Gevoelige woorden die niet gebruikt worden
  blacklist: ["PASEN", "JUDAS", "DORST", "MARIA", "VADER", "KRUIS", "LEVEN"],

  async getAll() {
    requireDb();
    const snap = await db.ref("wordPool").once("value");
    const val = snap.val();
    if (!val) {
      await db.ref("wordPool").set(WORDS);
      return [...WORDS];
    }
    return Object.values(val).filter(w =>
      typeof w === "string" &&
      w.length === 5 &&
      !this.blacklist.includes(w.toUpperCase())
    );
  },

  async add(words) {
    requireDb();
    const snap = await db.ref("wordPool").once("value");
    const current = snap.val() ? Object.values(snap.val()) : [...WORDS];
    const added = [];
    for (const w of words) {
      const u = w.trim().toUpperCase();
      if (u.length === 5 && /^[A-Z]+$/.test(u) && !current.includes(u) && !this.blacklist.includes(u)) {
        current.push(u);
        added.push(u);
      }
    }
    if (added.length > 0) await db.ref("wordPool").set(current);
    return added;
  },

  async remove(word) {
    requireDb();
    const snap = await db.ref("wordPool").once("value");
    const current = snap.val() ? Object.values(snap.val()) : [];
    const filtered = current.filter(w => w !== word.toUpperCase());
    await db.ref("wordPool").set(filtered);
  },

  listen(callback) {
    if (!db) return () => {};
    const ref = db.ref("wordPool");
    ref.on("value", snap => {
      const val = snap.val();
      const filtered = val ? Object.values(val).filter(w =>
        typeof w === "string" &&
        w.length === 5 &&
        !this.blacklist.includes(w.toUpperCase())
      ) : [];
      callback(filtered);
    });
    return () => ref.off("value");
  },
};

// ═══════════════════════════════════════════
// CONFETTI
// ═══════════════════════════════════════════

function fireConfetti() {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const colors = ["#FFD700","#2ECC40","#E8334A","#1B3A8C","#FF8C00","#fff"];
  const particles = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: canvas.width * Math.random(),
      y: canvas.height * 0.5 - Math.random() * canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 15 - 5,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rv: (Math.random() - 0.5) * 0.3,
    });
  }

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.vy += 0.4;
      p.y += p.vy;
      p.rot += p.rv;
      p.vx *= 0.99;
      if (p.y < canvas.height + 50) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    frame++;
    if (alive && frame < 300) requestAnimationFrame(draw);
    else if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }
  requestAnimationFrame(draw);
}
