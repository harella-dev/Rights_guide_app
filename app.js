// ─────────────────────────────────────────────────────────────────
// כל הטקסטים, הקישורים והתוכן מגיעים מהקובץ content.json בלבד.
// כדי לשנות קישור, תווית או תיאור — ערכו את content.json.
// כדי להוסיף מצב/מחלה — הוסיפו בלוק בתוך "topics" (אפשר גם להוסיף שדה "aliases": ["..."] לחיפוש).
// כדי להוסיף מדריך להורדה — הוסיפו בלוק ב-"downloads" ושימו PDF בתיקיית assets/.
// ─────────────────────────────────────────────────────────────────

let C = null;

// ── Boot ──────────────────────────────────────────────────────────
fetch('content.json')
  .then(r => r.json())
  .then(data => {
    C = data;
    renderHome();
    buildQ1();
    buildFunds();
    buildMedical();
    buildDiseases();
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

  const introEl = document.getElementById('home-intro');
  const intro = C.meta.intro;
  if (Array.isArray(intro)) {
    introEl.innerHTML = '';
    intro.forEach(text => {
      const p = document.createElement('p');
      p.textContent = text;
      introEl.appendChild(p);
    });
  } else {
    introEl.textContent = intro;
  }

  document.getElementById('home-no-data').textContent = C.meta.noDataNote;
  document.getElementById('home-disclaimer').textContent = C.meta.disclaimerFull;
}

// ── Q1: "מה מעניין אותך?" ─────────────────────────────────────────
function buildQ1() {
  document.getElementById('q1-label').textContent = C.navigation.q1Label;
  const container = document.getElementById('q1-buttons');
  container.innerHTML = '';

  C.navigation.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-choice';
    btn.textContent = opt.label;
    btn.onclick = () => {
      if (opt.action === 'link') {
        window.open(opt.url, '_blank', 'noopener,noreferrer');
      } else if (opt.id === 'funds') {
        showScreen('screen-funds');
      } else if (opt.id === 'medical') {
        showScreen('screen-medical');
      }
    };
    container.appendChild(btn);
  });
}

// ── Funds screen ──────────────────────────────────────────────────
function buildFunds() {
  const container = document.getElementById('funds-list');
  Object.values(C.funds).forEach(fund => {
    const card = document.createElement('div');
    card.className = 'card fund-card';

    const name = document.createElement('div');
    name.className = 'card-title';
    name.textContent = fund.name;
    card.appendChild(name);

    fund.links.forEach(link => {
      const desc = document.createElement('div');
      desc.className = 'card-note';
      desc.textContent = link.desc;
      card.appendChild(desc);

      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'btn btn-primary btn-sm';
      a.textContent = 'לעמוד הזכויות ←';
      card.appendChild(a);
    });

    container.appendChild(card);
  });
}

// ── Medical sub-menu ──────────────────────────────────────────────
function buildMedical() {
  const container = document.getElementById('medical-buttons');
  C.navigation.medicalOptions.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-choice';
    btn.textContent = opt.label;
    btn.onclick = () => {
      if (opt.action === 'screen') {
        showScreen('screen-diseases');
      } else {
        window.open(opt.url, '_blank', 'noopener,noreferrer');
      }
    };
    container.appendChild(btn);
  });
}

// ── Diseases dropdown ─────────────────────────────────────────────
function buildDiseases() {
  const sel = document.getElementById('diseases-select');
  const def = document.createElement('option');
  def.value = '';
  def.textContent = '— בחרו מחלה או מצב רפואי —';
  sel.appendChild(def);
  C.diseases.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.url;
    opt.textContent = d.label;
    sel.appendChild(opt);
  });
}

function openDisease() {
  const sel = document.getElementById('diseases-select');
  if (!sel.value) { sel.focus(); return; }
  window.open(sel.value, '_blank', 'noopener,noreferrer');
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
  showScreen('screen-home');
}
