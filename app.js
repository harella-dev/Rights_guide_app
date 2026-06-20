// ─────────────────────────────────────────────────────────────────
// כל הטקסטים, הקישורים והתוכן מגיעים מהקובץ content.json בלבד.
// כדי לשנות קישור, תווית או תיאור — ערכו את content.json.
// כדי להוסיף מצב/מחלה — הוסיפו בלוק בתוך "topics" (אפשר גם להוסיף שדה "aliases": ["..."] לחיפוש).
// כדי להוסיף מדריך להורדה — הוסיפו בלוק ב-"downloads" ושימו PDF בתיקיית assets/.
// ─────────────────────────────────────────────────────────────────

const KZ_BASE = 'https://www.kolzchut.org.il';
const KZ_API  = KZ_BASE + '/w/api.php';

let C = null;
let searchTimer = null;

const state = { fund: null, helpCategory: null };

// ── Boot ──────────────────────────────────────────────────────────
fetch('content.json')
  .then(r => r.json())
  .then(data => {
    C = data;
    renderHome();
    buildQ1();
    initSearch();
    buildGuides();
  })
  .catch(() => {
    document.body.innerHTML =
      '<div style="padding:32px;text-align:center;direction:rtl">' +
      '<p>שגיאה: לא ניתן לטעון את קובץ התוכן (content.json).</p>' +
      '<p style="font-size:0.85rem;color:#64748b;margin-top:8px">' +
      'יש לפתוח את הדף דרך שרת מקומי (לא ישירות מהקובץ).</p></div>';
  });

// ── Screen navigation ─────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.scrollTo(0, 0);
}

// ── Home ──────────────────────────────────────────────────────────
function renderHome() {
  document.title = C.meta.appName;
  document.getElementById('home-app-name').textContent = C.meta.appName;
  document.getElementById('home-intro').textContent = C.meta.intro;
  document.getElementById('home-no-data').textContent = C.meta.noDataNote;
  document.getElementById('home-disclaimer').textContent = C.meta.disclaimerFull;
}

// ── Q1: health fund ───────────────────────────────────────────────
function buildQ1() {
  const container = document.getElementById('q1-buttons');
  Object.entries(C.funds).forEach(([key, fund]) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-choice';
    btn.textContent = fund.name;
    btn.onclick = () => { state.fund = key; showScreen('screen-q2'); };
    container.appendChild(btn);
  });
  const other = document.createElement('button');
  other.className = 'btn btn-choice';
  other.textContent = 'אחר / לא יודע';
  other.onclick = () => { state.fund = 'other'; showScreen('screen-q2'); };
  container.appendChild(other);
}

// ── Q2: help category ────────────────────────────────────────────
function selectCategory(cat) {
  state.helpCategory = cat;
  // clear previous search when entering Q3
  const input = document.getElementById('search-input');
  if (input) { input.value = ''; }
  clearSearchSections();
  showScreen('screen-q3');
  // autofocus the search box
  setTimeout(() => { if (input) input.focus(); }, 100);
}

// ── Q3: Search ────────────────────────────────────────────────────
function initSearch() {
  const input = document.getElementById('search-input');
  input.addEventListener('input', () => {
    const term = input.value.trim();
    if (term.length < 2) {
      clearSearchSections();
      return;
    }
    renderCurated(term);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => fetchKolZchut(term), 300);
  });
}

function clearSearchSections() {
  document.getElementById('section-curated').classList.add('hidden');
  document.getElementById('section-kolzchut').classList.add('hidden');
  document.getElementById('curated-results').innerHTML = '';
  document.getElementById('kolzchut-results').innerHTML = '';
}

// ── Section A: curated results ────────────────────────────────────
function renderCurated(term) {
  const lower = term.toLowerCase();
  const matches = C.topics.filter(t => {
    const inLabel = t.label.toLowerCase().includes(lower);
    const inAliases = (t.aliases || []).some(a => a.toLowerCase().includes(lower));
    return inLabel || inAliases;
  });

  const container = document.getElementById('curated-results');
  const section   = document.getElementById('section-curated');
  container.innerHTML = '';
  section.classList.remove('hidden');

  if (matches.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'search-empty';
    msg.textContent = 'לא נמצאו תוצאות במאגר שלנו — נסו לחפש בכל-זכות למטה.';
    container.appendChild(msg);
    return;
  }

  matches.forEach(topic => {
    const card = document.createElement('div');
    card.className = 'card curated-card';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = topic.label;
    card.appendChild(title);

    const links = document.createElement('div');
    links.className = 'source-links';

    // Kol Zchut
    if (topic.kolzchut && topic.kolzchut.url) {
      links.appendChild(makeSourceLink(topic.kolzchut.label, topic.kolzchut.url, 'kz'));
    }
    // Bituach Leumi
    if (topic.bituachLeumi && topic.bituachLeumi.url) {
      links.appendChild(makeSourceLink(topic.bituachLeumi.label, topic.bituachLeumi.url, 'btl'));
    }
    // Fund links
    appendFundLinksInline(links, topic);

    card.appendChild(links);
    container.appendChild(card);
  });
}

function appendFundLinksInline(container, topic) {
  if (state.fund === 'other') {
    Object.entries(C.funds).forEach(([key, fund]) => {
      const overrides = topic.fundOverrides && topic.fundOverrides[key];
      const links = overrides
        ? (Array.isArray(overrides) ? overrides : [overrides])
        : fund.links;
      links.forEach(l => {
        if (l && l.url) container.appendChild(makeSourceLink(fund.name, l.url, 'fund'));
      });
    });
  } else if (state.fund && C.funds[state.fund]) {
    const fund = C.funds[state.fund];
    const overrides = topic.fundOverrides && topic.fundOverrides[state.fund];
    const links = overrides
      ? (Array.isArray(overrides) ? overrides : [overrides])
      : fund.links;
    links.forEach(l => {
      if (l && l.url) container.appendChild(makeSourceLink(fund.name, l.url, 'fund'));
    });
  }
}

function makeSourceLink(label, url, type) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'source-link source-link-' + type;
  a.textContent = label;
  return a;
}

// ── Section B: live Kol Zchut opensearch ─────────────────────────
function fetchKolZchut(term) {
  const container = document.getElementById('kolzchut-results');
  const section   = document.getElementById('section-kolzchut');
  section.classList.remove('hidden');
  container.innerHTML = '<p class="search-loading">מחפש בכל-זכות…</p>';

  const url = KZ_API +
    '?action=opensearch' +
    '&search=' + encodeURIComponent(term) +
    '&limit=8&namespace=0&format=json&origin=*';

  fetch(url)
    .then(r => r.json())
    .then(data => {
      const titles = data[1] || [];
      const urls   = data[3] || [];
      container.innerHTML = '';

      if (titles.length === 0) {
        const msg = document.createElement('p');
        msg.className = 'search-empty';
        msg.textContent = 'לא נמצאו תוצאות בכל-זכות לחיפוש זה.';
        container.appendChild(msg);
        return;
      }

      titles.forEach((title, i) => {
        const a = document.createElement('a');
        a.href = urls[i];
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'kz-result-item';
        a.textContent = title;
        container.appendChild(a);
      });
    })
    .catch(() => {
      container.innerHTML =
        '<p class="search-empty">לא ניתן להתחבר לכל-זכות כרגע. בדקו את החיבור לאינטרנט.</p>';
    });
}

// ── Guides ────────────────────────────────────────────────────────
function buildGuides() {
  buildArticles();
  buildDownloads();
}

function buildArticles() {
  const container = document.getElementById('guides-articles');
  C.articles.forEach(article => {
    const item = document.createElement('div');
    item.className = 'guide-item';

    const text = document.createElement('div');
    text.className = 'guide-item-text';
    const title = document.createElement('div');
    title.className = 'guide-item-title';
    title.textContent = article.title;
    text.appendChild(title);
    item.appendChild(text);

    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary btn-sm';
    btn.textContent = 'קראו עוד';
    btn.onclick = () => openArticle(article);
    item.appendChild(btn);

    container.appendChild(item);
  });
}

function buildDownloads() {
  const container = document.getElementById('guides-downloads');
  C.downloads.forEach(dl => {
    const item = document.createElement('div');
    item.className = 'guide-item';

    const text = document.createElement('div');
    text.className = 'guide-item-text';
    const title = document.createElement('div');
    title.className = 'guide-item-title';
    title.textContent = dl.title;
    const desc = document.createElement('div');
    desc.className = 'guide-item-desc';
    desc.textContent = dl.desc;
    text.appendChild(title);
    text.appendChild(desc);
    item.appendChild(text);

    const action = document.createElement('div');
    fetch(dl.file, { method: 'HEAD' })
      .then(r => {
        if (r.ok) {
          const link = document.createElement('a');
          link.href = dl.file;
          link.download = '';
          link.className = 'btn btn-primary btn-sm';
          link.textContent = 'הורדת PDF';
          action.appendChild(link);
        } else { throw new Error(); }
      })
      .catch(() => {
        const badge = document.createElement('span');
        badge.className = 'soon-badge';
        badge.textContent = 'בקרוב';
        action.appendChild(badge);
      });
    item.appendChild(action);
    container.appendChild(item);
  });
}

// ── Article screen ────────────────────────────────────────────────
function openArticle(article) {
  document.getElementById('article-title').textContent = article.title;
  const body = document.getElementById('article-body');
  body.innerHTML = '';
  article.body.forEach(para => {
    const p = document.createElement('p');
    p.textContent = para;
    body.appendChild(p);
  });
  showScreen('screen-article');
}

// ── Flow helpers ──────────────────────────────────────────────────
function startFlow() { showScreen('screen-q1'); }

function restart() {
  state.fund = null;
  state.helpCategory = null;
  showScreen('screen-home');
}
