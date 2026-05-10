// ══════════════════════════════════════
//  AUTH
// ══════════════════════════════════════
let currentUser = null;

function getUsers() {
  return JSON.parse(localStorage.getItem('noteflow_users') || '{}');
}
function saveUsers(u) {
  localStorage.setItem('noteflow_users', JSON.stringify(u));
}
function userKey(username) {
  return 'noteflow_notes_' + username.toLowerCase();
}

function switchTab(tab) {
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  document.getElementById('loginError').textContent = '';
  document.getElementById('registerError').textContent = '';
}

function handleLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  if (!username || !password) { errEl.textContent = 'Please fill in all fields.'; return; }
  const users = getUsers();
  if (!users[username.toLowerCase()]) { errEl.textContent = 'Username not found.'; return; }
  if (users[username.toLowerCase()].password !== btoa(password)) { errEl.textContent = 'Incorrect password.'; return; }
  loginSuccess(username, users[username.toLowerCase()].name);
}

function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const username = document.getElementById('regUser').value.trim();
  const pass = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  const errEl = document.getElementById('registerError');
  if (!name || !username || !pass || !pass2) { errEl.textContent = 'Please fill in all fields.'; return; }
  if (pass !== pass2) { errEl.textContent = 'Passwords do not match.'; return; }
  if (pass.length < 4) { errEl.textContent = 'Password must be at least 4 characters.'; return; }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) { errEl.textContent = 'Username: letters, numbers, _ only.'; return; }
  const users = getUsers();
  if (users[username.toLowerCase()]) { errEl.textContent = 'Username already taken.'; return; }
  users[username.toLowerCase()] = { name, password: btoa(pass) };
  saveUsers(users);
  loginSuccess(username, name);
}

function loginSuccess(username, name) {
  currentUser = { username: username.toLowerCase(), name };
  localStorage.setItem('noteflow_session', JSON.stringify(currentUser));
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appWrap').classList.remove('hidden');
  document.getElementById('sidebarUser').textContent = name;
  notes = JSON.parse(localStorage.getItem(userKey(username)) || '[]');
  setGreetingAndDate();
  renderNotes();
}

function handleLogout() {
  if (!confirm('Sign out of NoteFlow?')) return;
  localStorage.removeItem('noteflow_session');
  currentUser = null;
  notes = [];
  document.getElementById('appWrap').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  switchTab('login');
}

// Auto-login from session
(function checkSession() {
  const session = localStorage.getItem('noteflow_session');
  if (session) {
    const s = JSON.parse(session);
    loginSuccess(s.username, s.name);
  }
})();

// Enter key support on auth
document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
document.getElementById('regPass2').addEventListener('keydown', e => { if (e.key === 'Enter') handleRegister(); });


// ══════════════════════════════════════
//  STATE
// ══════════════════════════════════════
let notes = [];
let activeNote = null;
let activeCategory = 'All';
let searchQuery = '';
let autosaveTimer = null;


// ══════════════════════════════════════
//  DOM
// ══════════════════════════════════════
const notesGrid       = document.getElementById('notesGrid');
const modalOverlay    = document.getElementById('modalOverlay');
const noteTitle       = document.getElementById('noteTitle');
const noteBody        = document.getElementById('noteBody');
const noteDate        = document.getElementById('noteDate');
const catSelect       = document.getElementById('catSelect');
const importanceSel   = document.getElementById('importanceSelect');
const pinBtn          = document.getElementById('pinBtn');
const deleteBtn       = document.getElementById('deleteBtn');
const closeBtn        = document.getElementById('closeBtn');
const saveBtn         = document.getElementById('saveBtn');
const searchInput     = document.getElementById('searchInput');
const themeToggle     = document.getElementById('themeToggle');
const themeIcon       = document.getElementById('themeIcon');
const pageTitle       = document.getElementById('pageTitle');
const noteCountLabel  = document.getElementById('noteCountLabel');
const autosaveLabel   = document.getElementById('autosaveLabel');
const menuToggle      = document.getElementById('menuToggle');
const sidebar         = document.getElementById('sidebar');
const quickTitle      = document.getElementById('quickTitle');
const quickBody       = document.getElementById('quickBody');
const quickCat        = document.getElementById('quickCat');
const quickImportance = document.getElementById('quickImportance');
const quickSaveBtn    = document.getElementById('quickSaveBtn');
const bannerGreeting  = document.getElementById('bannerGreeting');
const topbarDate      = document.getElementById('topbarDate');


// ══════════════════════════════════════
//  GREETING & DATE
// ══════════════════════════════════════
function setGreetingAndDate() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  if (currentUser) greeting += ', ' + currentUser.name.split(' ')[0];
  bannerGreeting.textContent = greeting;
  topbarDate.textContent = now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}


// ══════════════════════════════════════
//  THEME
// ══════════════════════════════════════
const savedTheme = localStorage.getItem('noteflow_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('noteflow_theme', next);
  themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
});


// ══════════════════════════════════════
//  MOBILE MENU
// ══════════════════════════════════════
menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
document.addEventListener('click', e => {
  if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) sidebar.classList.remove('open');
});


// ══════════════════════════════════════
//  STORAGE
// ══════════════════════════════════════
function saveToStorage() {
  if (!currentUser) return;
  localStorage.setItem(userKey(currentUser.username), JSON.stringify(notes));
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


// ══════════════════════════════════════
//  AUTO-NUMBERING
// ══════════════════════════════════════
function handleAutoNumber(e) {
  const ta = e.target;
  if (e.key !== 'Enter') return;

  const val   = ta.value;
  const start = ta.selectionStart;
  const lines = val.substring(0, start).split('\n');
  const currentLine = lines[lines.length - 1];

  // Match patterns: "1. " or "1) " or "- " or "* "
  const numberedMatch = currentLine.match(/^(\s*)(\d+)([.)]\s)/);
  const bulletMatch   = currentLine.match(/^(\s*)([-*]\s)/);

  if (numberedMatch) {
    e.preventDefault();
    const indent  = numberedMatch[1];
    const num     = parseInt(numberedMatch[2]);
    const sep     = numberedMatch[3];
    // If current line is just the bullet with no content, remove it
    const content = currentLine.replace(/^(\s*)(\d+)([.)]\s)/, '');
    if (!content.trim()) {
      // Remove the empty bullet line
      const newVal = val.substring(0, start - currentLine.length) + val.substring(start);
      ta.value = newVal;
      const pos = start - currentLine.length;
      ta.selectionStart = ta.selectionEnd = pos;
      return;
    }
    const insert = '\n' + indent + (num + 1) + sep;
    insertAtCursor(ta, insert);
  } else if (bulletMatch) {
    e.preventDefault();
    const indent  = bulletMatch[1];
    const bullet  = bulletMatch[2];
    const content = currentLine.replace(/^(\s*)([-*]\s)/, '');
    if (!content.trim()) {
      const newVal = val.substring(0, start - currentLine.length) + val.substring(start);
      ta.value = newVal;
      ta.selectionStart = ta.selectionEnd = start - currentLine.length;
      return;
    }
    insertAtCursor(ta, '\n' + indent + bullet);
  }
}

function insertAtCursor(ta, text) {
  const start = ta.selectionStart;
  const end   = ta.selectionEnd;
  ta.value = ta.value.substring(0, start) + text + ta.value.substring(end);
  ta.selectionStart = ta.selectionEnd = start + text.length;
  ta.dispatchEvent(new Event('input'));
}

noteBody.addEventListener('keydown', handleAutoNumber);
quickBody.addEventListener('keydown', e => {
  handleAutoNumber(e);
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') quickAddNote();
});
quickTitle.addEventListener('keydown', e => { if (e.key === 'Enter') quickBody.focus(); });


// ══════════════════════════════════════
//  QUICK ADD
// ══════════════════════════════════════
function quickAddNote() {
  const title = quickTitle.value.trim();
  const body  = quickBody.value.trim();
  if (!title && !body) {
    quickTitle.focus();
    quickTitle.style.outline = '2px solid var(--gold)';
    setTimeout(() => quickTitle.style.outline = '', 1200);
    return;
  }
  const newNote = {
    id: genId(), title: title || 'Untitled', body,
    category: quickCat.value, importance: quickImportance.value,
    pinned: false, createdAt: Date.now(), updatedAt: Date.now()
  };
  notes.unshift(newNote);
  saveToStorage();
  renderNotes();
  quickTitle.value = ''; quickBody.value = '';
  quickCat.value = 'Personal'; quickImportance.value = 'low';
  quickSaveBtn.textContent = '✓ Saved!';
  setTimeout(() => quickSaveBtn.textContent = '＋ Add Note', 1500);
}
quickSaveBtn.addEventListener('click', quickAddNote);


// ══════════════════════════════════════
//  IMPORTANCE LABELS
// ══════════════════════════════════════
const impLabel = { low:'Low', medium:'Medium', high:'High', urgent:'Urgent' };
const impEmoji = { low:'🟢', medium:'🟡', high:'🟠', urgent:'🔴' };


// ══════════════════════════════════════
//  RENDER NOTES
// ══════════════════════════════════════
function renderNotes() {
  let filtered = notes.filter(n => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Pinned') return n.pinned;
    return n.category === activeCategory;
  });
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
  }
  // Sort: pinned first, then urgent→high→medium→low, then date
  const impOrder = { urgent:0, high:1, medium:2, low:3 };
  filtered.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const ia = impOrder[a.importance || 'low'];
    const ib = impOrder[b.importance || 'low'];
    if (ia !== ib) return ia - ib;
    return b.updatedAt - a.updatedAt;
  });

  notesGrid.innerHTML = '';
  if (filtered.length === 0) {
    notesGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">✦</div>
      <p>${searchQuery ? 'No notes match your search.' : 'Your collection is empty.<br>Write your first note above.'}</p></div>`;
    noteCountLabel.textContent = '';
    updateCounts(); return;
  }

  filtered.forEach(note => {
    const imp = note.importance || 'low';
    const card = document.createElement('div');
    card.className = `note-card imp-${imp}${note.pinned ? ' pinned' : ''}`;
    card.dataset.id = note.id;
    card.innerHTML = `
      <div class="note-card-top">
        <div class="note-card-title">${escapeHtml(note.title)}</div>
        ${note.pinned ? '<span class="pin-indicator">📌</span>' : ''}
      </div>
      <div class="note-card-body">${escapeHtml(note.body) || '<em style="opacity:0.4">No content</em>'}</div>
      <div class="note-card-footer">
        <span class="note-card-date">${formatDate(note.updatedAt)}</span>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          <span class="note-tag tag-${note.category}">${note.category}</span>
          <span class="imp-badge badge-${imp}">${impEmoji[imp]} ${impLabel[imp]}</span>
        </div>
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


// ══════════════════════════════════════
//  OPEN NOTE (MODAL)
// ══════════════════════════════════════
function openNote(id) {
  activeNote = notes.find(n => n.id === id);
  if (!activeNote) return;
  noteTitle.value = activeNote.title;
  noteBody.value  = activeNote.body;
  catSelect.value = activeNote.category;
  importanceSel.value = activeNote.importance || 'low';
  noteDate.textContent = 'Updated ' + formatDate(activeNote.updatedAt);
  pinBtn.style.opacity = activeNote.pinned ? '1' : '0.4';
  autosaveLabel.classList.remove('show');
  modalOverlay.classList.add('open');
  setTimeout(() => noteTitle.focus(), 100);
}


// ══════════════════════════════════════
//  AUTO-SAVE
// ══════════════════════════════════════
function triggerAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    if (!activeNote) return;
    activeNote.title      = noteTitle.value || 'Untitled';
    activeNote.body       = noteBody.value;
    activeNote.category   = catSelect.value;
    activeNote.importance = importanceSel.value;
    activeNote.updatedAt  = Date.now();
    saveToStorage(); renderNotes();
    autosaveLabel.classList.add('show');
    setTimeout(() => autosaveLabel.classList.remove('show'), 2000);
  }, 800);
}
noteTitle.addEventListener('input', triggerAutosave);
noteBody.addEventListener('input', triggerAutosave);
catSelect.addEventListener('change', triggerAutosave);
importanceSel.addEventListener('change', triggerAutosave);


// ══════════════════════════════════════
//  SAVE / PIN / DELETE / CLOSE
// ══════════════════════════════════════
saveBtn.addEventListener('click', () => {
  if (!activeNote) return;
  activeNote.title      = noteTitle.value || 'Untitled';
  activeNote.body       = noteBody.value;
  activeNote.category   = catSelect.value;
  activeNote.importance = importanceSel.value;
  activeNote.updatedAt  = Date.now();
  saveToStorage(); renderNotes(); closeModal();
});

pinBtn.addEventListener('click', () => {
  if (!activeNote) return;
  activeNote.pinned = !activeNote.pinned;
  pinBtn.style.opacity = activeNote.pinned ? '1' : '0.4';
  saveToStorage(); renderNotes();
});

deleteBtn.addEventListener('click', () => {
  if (!activeNote) return;
  if (!confirm('Delete this note? This cannot be undone.')) return;
  notes = notes.filter(n => n.id !== activeNote.id);
  saveToStorage(); renderNotes(); closeModal();
});

function closeModal() {
  modalOverlay.classList.remove('open');
  activeNote = null;
  clearTimeout(autosaveTimer);
}
closeBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });


// ══════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════
searchInput.addEventListener('input', e => { searchQuery = e.target.value; renderNotes(); });


// ══════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════
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


// ══════════════════════════════════════
//  REFRESH
// ══════════════════════════════════════
function refreshApp() {
  if (currentUser) {
    notes = JSON.parse(localStorage.getItem(userKey(currentUser.username)) || '[]');
  }
  setGreetingAndDate();
  renderNotes();
  // Flash the refresh button
  const btn = document.querySelector('.refresh-btn');
  btn.style.color = 'var(--gold-light)';
  setTimeout(() => btn.style.color = '', 600);
}
