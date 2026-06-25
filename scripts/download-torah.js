#!/usr/bin/env node
// download-torah.js — Fetch all Torah passages from Sefaria and save locally
// Usage: node scripts/download-torah.js
// Requires Node 18+ (built-in fetch). No npm install needed.
//
// Downloads ~378 aliyot (54 parashot × up to 7 aliyot each).
// Adds a 350ms delay between requests to be respectful of Sefaria's API.
// Total runtime: ~3-4 minutes.
// Saves files to data/{ParashaId}.json — commit them to the repo for offline use.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Same list as index.html — keep in sync if aliyot references ever change.
const PARASHOT = [
  { id: 'Bereshit',     en: 'Bereshit',          aliyot: ['Genesis 1:1-2:3','Genesis 2:4-2:19','Genesis 2:20-3:21','Genesis 3:22-4:26','Genesis 5:1-6:8'] },
  { id: 'Noach',        en: 'Noach',              aliyot: ['Genesis 6:9-6:22','Genesis 7:1-7:16','Genesis 7:17-8:14','Genesis 8:15-9:7','Genesis 9:8-9:17','Genesis 9:18-10:32','Genesis 11:1-11:32'] },
  { id: 'Lech-Lecha',   en: 'Lech Lecha',         aliyot: ['Genesis 12:1-12:13','Genesis 12:14-13:4','Genesis 13:5-13:18','Genesis 14:1-14:20','Genesis 14:21-15:6','Genesis 15:7-17:6','Genesis 17:7-17:27'] },
  { id: 'Vayera',       en: 'Vayera',             aliyot: ['Genesis 18:1-18:14','Genesis 18:15-18:33','Genesis 19:1-19:20','Genesis 19:21-21:4','Genesis 21:5-21:21','Genesis 21:22-21:34','Genesis 22:1-22:24'] },
  { id: 'Chayei-Sara',  en: 'Chayei Sara',        aliyot: ['Genesis 23:1-23:16','Genesis 23:17-24:9','Genesis 24:10-24:26','Genesis 24:27-24:52','Genesis 24:53-24:67','Genesis 25:1-25:11','Genesis 25:12-25:18'] },
  { id: 'Toldot',       en: 'Toldot',             aliyot: ['Genesis 25:19-26:5','Genesis 26:6-26:12','Genesis 26:13-26:22','Genesis 26:23-26:29','Genesis 26:30-27:27','Genesis 27:28-28:4','Genesis 28:5-28:9'] },
  { id: 'Vayetzei',     en: 'Vayetzei',           aliyot: ['Genesis 28:10-28:22','Genesis 29:1-29:17','Genesis 29:18-30:13','Genesis 30:14-30:27','Genesis 30:28-31:16','Genesis 31:17-31:42','Genesis 31:43-32:3'] },
  { id: 'Vayishlach',   en: 'Vayishlach',         aliyot: ['Genesis 32:4-32:13','Genesis 32:14-32:30','Genesis 32:31-33:5','Genesis 33:6-33:20','Genesis 34:1-35:11','Genesis 35:12-36:19','Genesis 36:20-36:43'] },
  { id: 'Vayeshev',     en: 'Vayeshev',           aliyot: ['Genesis 37:1-37:11','Genesis 37:12-37:22','Genesis 37:23-37:36','Genesis 38:1-38:30','Genesis 39:1-39:6','Genesis 39:7-40:11','Genesis 40:12-40:23'] },
  { id: 'Miketz',       en: 'Miketz',             aliyot: ['Genesis 41:1-41:14','Genesis 41:15-41:38','Genesis 41:39-41:52','Genesis 41:53-42:18','Genesis 42:19-43:15','Genesis 43:16-43:29','Genesis 43:30-44:17'] },
  { id: 'Vayigash',     en: 'Vayigash',           aliyot: ['Genesis 44:18-44:30','Genesis 44:31-45:7','Genesis 45:8-45:18','Genesis 45:19-45:27','Genesis 45:28-46:27','Genesis 46:28-47:10','Genesis 47:11-47:27'] },
  { id: 'Vayechi',      en: 'Vayechi',            aliyot: ['Genesis 47:28-48:9','Genesis 48:10-48:16','Genesis 48:17-48:22','Genesis 49:1-49:18','Genesis 49:19-49:26','Genesis 49:27-50:20','Genesis 50:21-50:26'] },
  { id: 'Shemot',       en: 'Shemot',             aliyot: ['Exodus 1:1-1:17','Exodus 1:18-2:10','Exodus 2:11-2:25','Exodus 3:1-3:15','Exodus 3:16-4:17','Exodus 4:18-5:23','Exodus 6:1'] },
  { id: 'Vaera',        en: "Va'era",             aliyot: ['Exodus 6:2-6:13','Exodus 6:14-6:28','Exodus 6:29-7:7','Exodus 7:8-7:25','Exodus 8:1-8:28','Exodus 9:1-9:16','Exodus 9:17-9:35'] },
  { id: 'Bo',           en: 'Bo',                 aliyot: ['Exodus 10:1-10:11','Exodus 10:12-10:23','Exodus 10:24-11:3','Exodus 11:4-12:20','Exodus 12:21-12:28','Exodus 12:29-12:51','Exodus 13:1-13:16'] },
  { id: 'Beshalach',    en: 'Beshalach',          aliyot: ['Exodus 13:17-14:8','Exodus 14:9-14:14','Exodus 14:15-25','Exodus 14:26-15:26','Exodus 15:27-16:10','Exodus 16:11-16:36','Exodus 17:1-17:16'] },
  { id: 'Yitro',        en: 'Yitro',              aliyot: ['Exodus 18:1-18:12','Exodus 18:13-18:23','Exodus 18:24-18:27','Exodus 19:1-19:6','Exodus 19:7-19:19','Exodus 19:20-20:14','Exodus 20:15-20:23'] },
  { id: 'Mishpatim',    en: 'Mishpatim',          aliyot: ['Exodus 21:1-21:19','Exodus 21:20-22:3','Exodus 22:4-22:26','Exodus 22:27-23:5','Exodus 23:6-23:19','Exodus 23:20-23:25','Exodus 23:26-24:18'] },
  { id: 'Terumah',      en: 'Terumah',            aliyot: ['Exodus 25:1-25:16','Exodus 25:17-25:30','Exodus 25:31-26:14','Exodus 26:15-26:30','Exodus 26:31-26:37','Exodus 27:1-27:8','Exodus 27:9-27:19'] },
  { id: 'Tetzaveh',     en: 'Tetzaveh',           aliyot: ['Exodus 27:20-28:12','Exodus 28:13-28:30','Exodus 28:31-28:43','Exodus 29:1-29:18','Exodus 29:19-29:37','Exodus 29:38-29:46','Exodus 30:1-30:10'] },
  { id: 'Ki-Tisa',      en: 'Ki Tisa',            aliyot: ['Exodus 30:11-31:17','Exodus 31:18-33:11','Exodus 33:12-33:16','Exodus 33:17-33:23','Exodus 34:1-34:9','Exodus 34:10-34:26','Exodus 34:27-34:35'] },
  { id: 'Vayakhel',     en: 'Vayakhel',           aliyot: ['Exodus 35:1-35:20','Exodus 35:21-35:29','Exodus 35:30-36:7','Exodus 36:8-36:19','Exodus 36:20-37:16','Exodus 37:17-37:29','Exodus 38:1-38:20'] },
  { id: 'Pekudei',      en: 'Pekudei',            aliyot: ['Exodus 38:21-39:1','Exodus 39:2-39:21','Exodus 39:22-39:32','Exodus 39:33-39:43','Exodus 40:1-40:16','Exodus 40:17-40:27','Exodus 40:28-40:38'] },
  { id: 'Vayikra',      en: 'Vayikra',            aliyot: ['Leviticus 1:1-1:13','Leviticus 1:14-2:6','Leviticus 2:7-2:16','Leviticus 3:1-3:17','Leviticus 4:1-4:26','Leviticus 4:27-5:10','Leviticus 5:11-5:26'] },
  { id: 'Tzav',         en: 'Tzav',               aliyot: ['Leviticus 6:1-6:11','Leviticus 6:12-7:10','Leviticus 7:11-7:38','Leviticus 8:1-8:13','Leviticus 8:14-8:21','Leviticus 8:22-8:29','Leviticus 8:30-8:36'] },
  { id: 'Shmini',       en: 'Shmini',             aliyot: ['Leviticus 9:1-9:16','Leviticus 9:17-9:23','Leviticus 10:1-10:11','Leviticus 10:12-10:15','Leviticus 10:16-10:20','Leviticus 11:1-11:32','Leviticus 11:33-11:47'] },
  { id: 'Tazria',       en: 'Tazria',             aliyot: ['Leviticus 12:1-12:8','Leviticus 13:1-13:17','Leviticus 13:18-13:23','Leviticus 13:24-13:28','Leviticus 13:29-13:39','Leviticus 13:40-13:54','Leviticus 13:55-13:59'] },
  { id: 'Metzora',      en: 'Metzora',            aliyot: ['Leviticus 14:1-14:12','Leviticus 14:13-14:20','Leviticus 14:21-14:32','Leviticus 14:33-14:53','Leviticus 14:54-15:15','Leviticus 15:16-15:28','Leviticus 15:29-15:33'] },
  { id: 'Achrei-Mot',   en: 'Achrei Mot',         aliyot: ['Leviticus 16:1-16:17','Leviticus 16:18-16:24','Leviticus 16:25-16:34','Leviticus 17:1-17:7','Leviticus 17:8-18:5','Leviticus 18:6-18:21','Leviticus 18:22-18:30'] },
  { id: 'Kedoshim',     en: 'Kedoshim',           aliyot: ['Leviticus 19:1-19:14','Leviticus 19:15-19:22','Leviticus 19:23-19:32','Leviticus 19:33-19:37','Leviticus 20:1-20:7','Leviticus 20:8-20:22','Leviticus 20:23-20:27'] },
  { id: 'Emor',         en: 'Emor',               aliyot: ['Leviticus 21:1-21:15','Leviticus 21:16-22:16','Leviticus 22:17-22:33','Leviticus 23:1-23:22','Leviticus 23:23-23:32','Leviticus 23:33-23:44','Leviticus 24:1-24:23'] },
  { id: 'Behar',        en: 'Behar',              aliyot: ['Leviticus 25:1-25:13','Leviticus 25:14-25:18','Leviticus 25:19-25:24','Leviticus 25:25-25:28','Leviticus 25:29-25:38','Leviticus 25:39-25:46','Leviticus 25:47-26:2'] },
  { id: 'Bechukotai',   en: 'Bechukotai',         aliyot: ['Leviticus 26:3-26:5','Leviticus 26:6-26:9','Leviticus 26:10-26:46','Leviticus 27:1-27:15','Leviticus 27:16-27:21','Leviticus 27:22-27:28','Leviticus 27:29-27:34'] },
  { id: 'Bamidbar',     en: 'Bamidbar',           aliyot: ['Numbers 1:1-1:19','Numbers 1:20-1:54','Numbers 2:1-2:34','Numbers 3:1-3:13','Numbers 3:14-3:39','Numbers 3:40-3:51','Numbers 4:1-4:20'] },
  { id: 'Nasso',        en: 'Nasso',              aliyot: ['Numbers 4:21-4:37','Numbers 4:38-4:49','Numbers 5:1-5:10','Numbers 5:11-6:27','Numbers 7:1-7:41','Numbers 7:42-7:71','Numbers 7:72-7:89'] },
  { id: 'Behaalotcha',  en: "Beha'alotcha",       aliyot: ['Numbers 8:1-8:14','Numbers 8:15-8:26','Numbers 9:1-9:14','Numbers 9:15-10:10','Numbers 10:11-10:34','Numbers 10:35-11:29','Numbers 11:30-12:16'] },
  { id: 'Shlach',       en: 'Shlach',             aliyot: ['Numbers 13:1-13:20','Numbers 13:21-14:7','Numbers 14:8-14:25','Numbers 14:26-15:7','Numbers 15:8-15:16','Numbers 15:17-15:26','Numbers 15:27-15:41'] },
  { id: 'Korach',       en: 'Korach',             aliyot: ['Numbers 16:1-16:13','Numbers 16:14-16:19','Numbers 16:20-17:8','Numbers 17:9-17:15','Numbers 17:16-17:24','Numbers 17:25-18:20','Numbers 18:21-18:32'] },
  { id: 'Chukat',       en: 'Chukat',             aliyot: ['Numbers 19:1-19:17','Numbers 19:18-20:6','Numbers 20:7-20:13','Numbers 20:14-20:21','Numbers 20:22-21:9','Numbers 21:10-21:20','Numbers 21:21-22:1'] },
  { id: 'Balak',        en: 'Balak',              aliyot: ['Numbers 22:2-22:12','Numbers 22:13-22:20','Numbers 22:21-22:38','Numbers 22:39-23:12','Numbers 23:13-23:26','Numbers 23:27-24:13','Numbers 24:14-25:9'] },
  { id: 'Pinchas',      en: 'Pinchas',            aliyot: ['Numbers 25:10-26:4','Numbers 26:5-26:51','Numbers 26:52-27:5','Numbers 27:6-27:23','Numbers 28:1-28:15','Numbers 28:16-29:11','Numbers 29:12-30:1'] },
  { id: 'Matot',        en: 'Matot',              aliyot: ['Numbers 30:2-30:9','Numbers 30:10-31:12','Numbers 31:13-31:24','Numbers 31:25-31:41','Numbers 31:42-31:54','Numbers 32:1-32:19','Numbers 32:20-32:42'] },
  { id: 'Masei',        en: 'Masei',              aliyot: ['Numbers 33:1-33:10','Numbers 33:11-33:49','Numbers 33:50-34:15','Numbers 34:16-34:29','Numbers 35:1-35:8','Numbers 35:9-35:34','Numbers 36:1-36:13'] },
  { id: 'Devarim',      en: 'Devarim',            aliyot: ['Deuteronomy 1:1-1:10','Deuteronomy 1:11-1:21','Deuteronomy 1:22-1:38','Deuteronomy 1:39-2:1','Deuteronomy 2:2-2:30','Deuteronomy 2:31-3:14','Deuteronomy 3:15-3:22'] },
  { id: 'Vaetchanan',   en: "Va'etchanan",        aliyot: ['Deuteronomy 3:23-4:4','Deuteronomy 4:5-4:40','Deuteronomy 4:41-4:49','Deuteronomy 5:1-5:18','Deuteronomy 5:19-6:3','Deuteronomy 6:4-6:25','Deuteronomy 7:1-7:11'] },
  { id: 'Eikev',        en: 'Eikev',              aliyot: ['Deuteronomy 7:12-8:10','Deuteronomy 8:11-9:3','Deuteronomy 9:4-9:29','Deuteronomy 10:1-10:11','Deuteronomy 10:12-11:9','Deuteronomy 11:10-11:21','Deuteronomy 11:22-11:25'] },
  { id: 'Reeh',         en: "Re'eh",              aliyot: ['Deuteronomy 11:26-12:10','Deuteronomy 12:11-12:28','Deuteronomy 12:29-13:19','Deuteronomy 14:1-14:21','Deuteronomy 14:22-14:29','Deuteronomy 15:1-15:18','Deuteronomy 15:19-16:17'] },
  { id: 'Shoftim',      en: 'Shoftim',            aliyot: ['Deuteronomy 16:18-17:13','Deuteronomy 17:14-17:20','Deuteronomy 18:1-18:5','Deuteronomy 18:6-19:13','Deuteronomy 19:14-20:9','Deuteronomy 20:10-21:9','Deuteronomy 21:1-21:9'] },
  { id: 'Ki-Teitzei',   en: 'Ki Teitzei',         aliyot: ['Deuteronomy 21:10-21:21','Deuteronomy 21:22-22:7','Deuteronomy 22:8-23:7','Deuteronomy 23:8-23:25','Deuteronomy 24:1-24:4','Deuteronomy 24:5-24:13','Deuteronomy 24:14-25:19'] },
  { id: 'Ki-Tavo',      en: 'Ki Tavo',            aliyot: ['Deuteronomy 26:1-26:11','Deuteronomy 26:12-26:15','Deuteronomy 26:16-27:8','Deuteronomy 27:9-27:26','Deuteronomy 28:1-28:6','Deuteronomy 28:7-28:69','Deuteronomy 29:1-29:8'] },
  { id: 'Nitzavim',     en: 'Nitzavim',           aliyot: ['Deuteronomy 29:9-29:11','Deuteronomy 29:12-29:14','Deuteronomy 29:15-29:28','Deuteronomy 30:1-30:6','Deuteronomy 30:7-30:10','Deuteronomy 30:11-30:14','Deuteronomy 30:15-30:20'] },
  { id: 'Vayeilech',    en: 'Vayeilech',          aliyot: ['Deuteronomy 31:1-31:3','Deuteronomy 31:4-31:6','Deuteronomy 31:7-31:9','Deuteronomy 31:10-31:13','Deuteronomy 31:14-31:19','Deuteronomy 31:20-31:24','Deuteronomy 31:25-31:30'] },
  { id: 'Haazinu',      en: "Ha'azinu",           aliyot: ['Deuteronomy 32:1-32:6','Deuteronomy 32:7-32:12','Deuteronomy 32:13-32:18','Deuteronomy 32:19-32:28','Deuteronomy 32:29-32:39','Deuteronomy 32:40-32:43','Deuteronomy 32:44-32:52'] },
  { id: 'VZot-HaBerachah', en: "V'Zot HaBerachah", aliyot: ['Deuteronomy 33:1-33:7','Deuteronomy 33:8-33:12','Deuteronomy 33:13-33:17','Deuteronomy 33:18-33:21','Deuteronomy 33:22-33:26','Deuteronomy 33:27-34:5','Deuteronomy 34:6-34:12'] },
];

const DELAY_MS = 350;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAliyah(ref, attempt = 1) {
  const encoded = encodeURIComponent(ref);
  const url = `https://www.sefaria.org/api/texts/${encoded}?context=0&commentary=0&pad=0`;
  const res = await fetch(url);
  if (res.status === 429 && attempt <= 3) {
    // Rate limited — back off and retry
    const wait = DELAY_MS * attempt * 3;
    process.stdout.write(` [rate limited, waiting ${wait}ms]`);
    await sleep(wait);
    return fetchAliyah(ref, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function parseVerses(data) {
  // Sefaria returns 2D arrays for multi-chapter passages — flatten to 1D
  const flat = arr => (arr.length && Array.isArray(arr[0])) ? arr.flat() : arr;
  const he = flat(data.he || []);
  const en = flat(Array.isArray(data.text) ? data.text : (data.text ? [data.text] : []));
  const maxLen = Math.max(he.length, en.length);
  const startVerse = data.sections ? data.sections[data.sections.length - 1] : 1;
  const verses = [];
  for (let i = 0; i < maxLen; i++) {
    verses.push({
      num: startVerse + i,
      he: (Array.isArray(he[i]) ? he[i].join(' ') : (he[i] || '')).replace(/<[^>]+>/g, '').trim(),
      en: (Array.isArray(en[i]) ? en[i].join(' ') : (en[i] || '')).replace(/<[^>]+>/g, '').trim(),
    });
  }
  return verses.filter(v => v.he || v.en);
}

async function main() {
  const args = process.argv.slice(2);
  const onlyId = args[0]; // optional: node download-torah.js Bereshit

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const targets = onlyId
    ? PARASHOT.filter(p => p.id.toLowerCase() === onlyId.toLowerCase())
    : PARASHOT;

  if (onlyId && targets.length === 0) {
    console.error(`No parasha found with id "${onlyId}". Check spelling.`);
    process.exit(1);
  }

  const total = targets.reduce((s, p) => s + p.aliyot.length, 0);
  console.log(`Downloading ${targets.length} parashot (${total} aliyot) from Sefaria...\n`);

  let fetched = 0;
  let failed = 0;

  for (const parasha of targets) {
    console.log(`[${PARASHOT.indexOf(parasha) + 1}/54] ${parasha.en}`);
    const aliyotData = [];

    for (let i = 0; i < parasha.aliyot.length; i++) {
      const ref = parasha.aliyot[i];
      process.stdout.write(`  Aliyah ${i + 1} (${ref})... `);
      try {
        const data = await fetchAliyah(ref);
        const verses = parseVerses(data);
        aliyotData.push({ ref, verses });
        console.log(`${verses.length} verses ✓`);
        fetched++;
      } catch (e) {
        console.error(`FAILED: ${e.message}`);
        aliyotData.push({ ref, verses: [] });
        failed++;
      }
      if (i < parasha.aliyot.length - 1) await sleep(DELAY_MS);
    }

    const outPath = path.join(DATA_DIR, `${parasha.id}.json`);
    fs.writeFileSync(outPath, JSON.stringify({ id: parasha.id, aliyot: aliyotData }));
    console.log(`  → saved data/${parasha.id}.json\n`);

    // Slightly longer pause between parashot
    if (targets.indexOf(parasha) < targets.length - 1) await sleep(DELAY_MS * 2);
  }

  console.log(`Done. ${fetched} aliyot downloaded, ${failed} failed.`);
  if (failed > 0) {
    console.log('Re-run with a specific parasha id to retry failed ones, e.g.:');
    console.log('  node scripts/download-torah.js Bereshit');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
