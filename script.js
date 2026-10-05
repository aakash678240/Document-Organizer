// ---------- State ----------
let documents = [];
let selectedId = null;
let sortDir = 'desc';
const $ = id => document.getElementById(id);
const el = {
  file: $('fileInput'), drop: $('dropzone'), search: $('searchInput'), cat: $('categoryFilter'),
  sort: $('sortSelect'), dir: $('dirBtn'), list: $('documentsList'), head: $('previewHead'),
  body: $('contentPreview'), theme: $('themeToggle'), stats: $('stats'), toast: $('toast')
};
const CAT = {
  text:  { label: 'TXT', color: 'var(--c-text)' },
  pdf:   { label: 'PDF', color: 'var(--c-pdf)' },
  image: { label: 'IMG', color: 'var(--c-image)' },
  office:{ label: 'DOC', color: 'var(--c-office)' },
  other: { label: 'FILE', color: 'var(--c-other)' }
};

// ---------- Helpers ----------
const escapeHtml = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const fmtDate = t => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = t => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.toast.classList.remove('show'), 2400);
}

function getFileCategory(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['txt', 'md', 'html', 'css', 'js', 'json', 'csv', 'xml', 'log'].includes(ext)) return 'text';
  if (ext === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office';
  return 'other';
}

// ---------- Theme ----------
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('theme', t); } catch (e) {}
}
el.theme.addEventListener('click', () =>
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

// ---------- Upload ----------
function addFiles(fileList) {
  const files = Array.from(fileList);
  if (!files.length) return;
  let pending = files.length;
  files.forEach(file => {
    const category = getFileCategory(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      documents.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        name: file.name, type: file.type, category, size: file.size,
        lastModified: file.lastModified, addedAt: Date.now(), content: e.target.result
      });
      if (--pending === 0) {
        save(); render();
        toast(files.length === 1 ? 'Uploaded ' + files[0].name : files.length + ' files uploaded');
      }
    };
    reader.onerror = () => { pending--; toast('Could not read ' + file.name); };
    category === 'text' ? reader.readAsText(file) : reader.readAsDataURL(file);
  });
  el.file.value = '';
}
el.file.addEventListener('change', e => addFiles(e.target.files));
['dragenter', 'dragover'].forEach(ev => el.drop.addEventListener(ev, e => { e.preventDefault(); el.drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => el.drop.addEventListener(ev, e => { e.preventDefault(); el.drop.classList.remove('over'); }));
el.drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
el.drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.file.click(); } });

// ---------- Sort / filter ----------
function sortDocs(list) {
  const mode = el.sort.value;
  if (mode === 'all') return list;               // original upload order
  const keys = { size: d => d.size, time: d => d.addedAt, date: d => d.lastModified, name: d => d.name.toLowerCase() };
  const k = keys[mode], m = sortDir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => (k(a) > k(b) ? 1 : k(a) < k(b) ? -1 : 0) * m);
}
el.dir.addEventListener('click', () => {
  sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  el.dir.textContent = sortDir === 'asc' ? '↑' : '↓';
  render();
});
[el.search, el.cat, el.sort].forEach(c => c.addEventListener('input', render));

// ---------- Render ----------
function render() {
  const q = el.search.value.toLowerCase(), cat = el.cat.value;
  const shown = sortDocs(documents.filter(d => d.name.toLowerCase().includes(q) && (cat === 'all' || d.category === cat)));

  const total = documents.reduce((s, d) => s + d.size, 0);
  el.stats.innerHTML = `<span class="stat"><b>${documents.length}</b>documents</span>
    <span class="stat"><b>${fmtSize(total)}</b>total size</span>
    <span class="stat"><b>${shown.length}</b>showing</span>`;

  if (!shown.length) {
    el.list.innerHTML = `<div class="empty">${documents.length ? 'No documents match your search or filter.' : 'No documents yet. Drop a file above to get started.'}</div>`;
  } else {
    el.list.innerHTML = '';
    shown.forEach(doc => {
      const c = CAT[doc.category];
      const row = document.createElement('div');
      row.className = 'item' + (doc.id === selectedId ? ' active' : '');
      row.style.setProperty('--cat', c.color);
      row.innerHTML = `<div class="badge">${c.label}</div>
        <div class="info"><div class="name">${escapeHtml(doc.name)}</div>
        <div class="meta">${fmtSize(doc.size)} · modified ${fmtDate(doc.lastModified)} · added ${fmtTime(doc.addedAt)}</div></div>
        <div class="actions"><button class="btn danger" aria-label="Delete ${escapeHtml(doc.name)}">Delete</button></div>`;
      row.addEventListener('click', () => showPreview(doc));
      row.querySelector('.danger').addEventListener('click', e => { e.stopPropagation(); deleteDoc(doc.id); });
      el.list.appendChild(row);
    });
  }
  if (!selectedId) showPlaceholder();
}

// ---------- Preview ----------
function showPlaceholder() {
  el.head.innerHTML = '<h2>Preview</h2><div class="chips"><span class="chip">Nothing selected</span></div>';
  el.body.innerHTML = '<div class="placeholder"><div class="big">📄</div><strong>Select a document</strong><span>Click any file in the list to see it here.</span></div>';
}

async function showPreview(doc) {
  selectedId = doc.id;
  render();
  const chips = [CAT[doc.category].label, fmtSize(doc.size), 'Modified ' + fmtDate(doc.lastModified), 'Added ' + fmtDate(doc.addedAt) + ' ' + fmtTime(doc.addedAt)];
  let body = '';

  if (doc.category === 'text') {
    const words = (doc.content.match(/\S+/g) || []).length;
    chips.push(words + ' words', doc.content.split('\n').length + ' lines');
    body = `<pre>${escapeHtml(doc.content)}</pre>`;
  } else if (doc.category === 'image') {
    body = `<img src="${doc.content}" alt="${escapeHtml(doc.name)}">`;
  } else if (doc.category === 'pdf') {
    const blob = await (await fetch(doc.content)).blob();
    body = `<iframe src="${URL.createObjectURL(blob)}" title="${escapeHtml(doc.name)}"></iframe>`;
  } else {
    body = `<div class="placeholder"><div class="big">📦</div><strong>No preview for this file type</strong><span>Use Download to open it in another app.</span></div>`;
  }

  el.head.innerHTML = `<h2>${escapeHtml(doc.name)}</h2>
    <div class="chips">${chips.map(c => `<span class="chip">${escapeHtml(c)}</span>`).join('')}</div>
    <div class="head-actions"><button class="btn" id="dlBtn">Download</button>
    ${doc.category === 'text' ? '<button class="btn" id="copyBtn">Copy text</button>' : ''}
    <button class="btn" id="closeBtn">Close</button></div>`;
  el.body.innerHTML = body;

  $('dlBtn').onclick = () => {
    const a = document.createElement('a');
    a.download = doc.name;
    a.href = doc.category === 'text' ? URL.createObjectURL(new Blob([doc.content], { type: 'text/plain' })) : doc.content;
    a.click();
  };
  const copy = $('copyBtn');
  if (copy) copy.onclick = () => navigator.clipboard.writeText(doc.content).then(() => toast('Copied to clipboard'));
  $('closeBtn').onclick = () => { selectedId = null; render(); };
  if (window.innerWidth <= 860) $('previewCard').scrollIntoView({ behavior: 'smooth' });
}

function deleteDoc(id) {
  documents = documents.filter(d => d.id !== id);
  if (selectedId === id) selectedId = null;
  save(); render(); toast('Document deleted');
}

// ---------- Storage ----------
function save() {
  try { localStorage.setItem('documents', JSON.stringify(documents)); }
  catch (e) { toast('Storage full: changes last until you close this tab'); }
}
function load() {
  try { documents = JSON.parse(localStorage.getItem('documents')) || []; } catch (e) { documents = []; }
}

load();
render();
