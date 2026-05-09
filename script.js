// ── STATE ──
let notes = JSON.parse(localStorage.getItem('noteflow_notes')) || [];
let activeNote = null;
let activeCategory = 'All';
let searchQuery = '';
let autosaveTimer = null;

// ── DOM ──
const notesGrid = document.getElementById('notesGrid');
const modalOverlay = document.getElementById('modalOverlay');
const noteTitle = document.getElementById('noteTitle');
const noteBody = document.getElementById('noteBody');
const noteDate = document.getElementById('noteDate');
const catSelect = document.getElementById('catSelect');
const pinBtn = document.getElementById('pinBtn');
const deleteBtn = document.getElementById('deleteBtn');
const closeBtn = document.getElementById('closeBtn');
const saveBtn = document.getElementById('saveBtn');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const pageTitle = document.getElementById('pageTitle');
const noteCountLabel = document.getElementById('noteCountLabel');
const autosaveLabel = document.getElementById('autosaveLabel');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const quickTitle = document.getElementById('quickTitle');
const quickBody = document.getElementById('quickBody');
const quickCat = document.getElementById('quickCat');
const quickSaveBtn = document.getElementById('quickSaveBtn');
const bannerGreeting = document.getElementById('bannerGreeting');
const topbarDate = document.getElementById('topbarDate');

// ── GREETING & DATE ──
function setGreetingAndDate() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = 'Good Morning';
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
  else if (hour >= 17) greeting = 'Good Evening';
  bannerGreeting.textContent = greeting;

  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  topbarDate.textContent = now.toLocaleDateString('en-IN', options);
}
setGreetingAndDate();

// ── THEME ──
const savedTheme = localStorage.getItem('noteflow_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('noteflow_theme', next);
  themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
});

// ── MOBILE MENU ──
menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
document.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

// ── STORAGE ──
function saveToStorage() {
  localStorage.setItem('noteflow_notes', JSON.stringify(notes));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── QUICK ADD ──
function quickAddNote() {
  const title = quickTitle.value.trim();
  const body = quickBody.value.trim();
  if (!title && !body) {
    quickTitle.focus();
    quickTitle.style.outline = '2px solid var(--gold)';
    setTimeout(() => quickTitle.style.outline = '', 1200);
    return;
  }
  const newNote = {
    id: genId(),
    title: title || 'Untitled',
    body,
    category: quickCat.value,
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  notes.unshift(newNote);
  saveToStorage();
  renderNotes();
  quickTitle.value = '';
  quickBody.value = '';
  quickCat.value = 'Personal';

  // Flash feedback
  quickSaveBtn.textContent = '✓ Saved!';
  setTimeout(() => quickSaveBtn.textContent = '＋ Add Note', 1500);
}

quickSaveBtn.addEventListener('click', quickAddNote);

quickBody.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') quickAddNote();
});
quickTitle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') quickBody.focus();
});

// ── RENDER ──
function renderNotes() {
  let filtered = notes.filter(n => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Pinned') return n.pinned;
    return n.category === activeCategory;
  });

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  notesGrid.innerHTML = '';

  if (filtered.length === 0) {
    notesGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✦</div>
        <p>${searchQuery ? 'No notes match your search.' : 'Your collection is empty.<br>Write your first note above.'}</p>
      </div>`;
    noteCountLabel.textContent = '';
    updateCounts();
    return;
  }

  filtered.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card' + (note.pinned ? ' pinned' : '');
    card.dataset.id = note.id;
    card.innerHTML = `
      <div class="note-card-top">
        <div class="note-card-title">${escapeHtml(note.title)}</div>
        ${note.pinned ? '<span class="pin-indicator">📌</span>' : ''}
      </div>
      <div class="note-card-body">${escapeHtml(note.body) || '<em style="opacity:0.5">No content</em>'}</div>
      <div class="note-card-footer">
        <span class="note-card-date">${formatDate(note.updatedAt)}</span>
        <span class="note-tag tag-${note.category}">${note.category}</span>
      </div>`;
    card.addEventListener('click', () => openNote(note.id));
    notesGrid.appendChild(card);
  });

  noteCountLabel.textContent = `${filtered.length} note${filtered.length !== 1 ? 's' : ''}`;
  updateCounts();
}

function updateCounts() {
  document.getElementById('countAll').textContent = notes.length;
  document.getElementById('countPersonal').textContent = notes.filter(n => n.category === 'Personal').length;
  document.getElementById('countWork').textContent = notes.filter(n => n.category === 'Work').length;
  document.getElementById('countIdeas').textContent = notes.filter(n => n.category === 'Ideas').length;
  document.getElementById('countPinned').textContent = notes.filter(n => n.pinned).length;
}

// ── OPEN NOTE (EDIT MODAL) ──
function openNote(id) {
  activeNote = notes.find(n => n.id === id);
  if (!activeNote) return;
  noteTitle.value = activeNote.title;
  noteBody.value = activeNote.body;
  catSelect.value = activeNote.category;
  noteDate.textContent = 'Updated ' + formatDate(activeNote.updatedAt);
  pinBtn.style.opacity = activeNote.pinned ? '1' : '0.4';
  autosaveLabel.classList.remove('show');
  modalOverlay.classList.add('open');
  setTimeout(() => noteTitle.focus(), 100);
}

// ── AUTO-SAVE ──
function triggerAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    if (!activeNote) return;
    activeNote.title = noteTitle.value || 'Untitled';
    activeNote.body = noteBody.value;
    activeNote.category = catSelect.value;
    activeNote.updatedAt = Date.now();
    saveToStorage();
    renderNotes();
    autosaveLabel.classList.add('show');
    setTimeout(() => autosaveLabel.classList.remove('show'), 2000);
  }, 800);
}
noteTitle.addEventListener('input', triggerAutosave);
noteBody.addEventListener('input', triggerAutosave);
catSelect.addEventListener('change', triggerAutosave);

// ── SAVE BTN ──
saveBtn.addEventListener('click', () => {
  if (!activeNote) return;
  activeNote.title = noteTitle.value || 'Untitled';
  activeNote.body = noteBody.value;
  activeNote.category = catSelect.value;
  activeNote.updatedAt = Date.now();
  saveToStorage();
  renderNotes();
  closeModal();
});

// ── PIN ──
pinBtn.addEventListener('click', () => {
  if (!activeNote) return;
  activeNote.pinned = !activeNote.pinned;
  pinBtn.style.opacity = activeNote.pinned ? '1' : '0.4';
  saveToStorage();
  renderNotes();
});

// ── DELETE ──
deleteBtn.addEventListener('click', () => {
  if (!activeNote) return;
  if (!confirm('Delete this note? This cannot be undone.')) return;
  notes = notes.filter(n => n.id !== activeNote.id);
  saveToStorage();
  renderNotes();
  closeModal();
});

// ── CLOSE MODAL ──
function closeModal() {
  modalOverlay.classList.remove('open');
  activeNote = null;
  clearTimeout(autosaveTimer);
}
closeBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── SEARCH ──
searchInput.addEventListener('input', e => {
  searchQuery = e.target.value;
  renderNotes();
});

// ── CATEGORIES ──
document.querySelectorAll('.cat-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    activeCategory = item.dataset.cat;
    pageTitle.textContent = activeCategory === 'All' ? 'All Notes' :
                            activeCategory === 'Pinned' ? 'Pinned Notes' :
                            activeCategory + ' Notes';
    renderNotes();
    sidebar.classList.remove('open');
  });
});

// ── INIT ──
renderNotes();
