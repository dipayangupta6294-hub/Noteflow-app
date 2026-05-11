window.addEventListener('DOMContentLoaded', function () {

  // ══ STATE ══
  let notes        = [];
  let currentUser  = null;
  let activeNote   = null;
  let activeCategory = 'All';
  let searchQuery  = '';
  let autosaveTimer = null;

  // ══ DOM ══
  const authPage        = document.getElementById('authPage');
  const appPage         = document.getElementById('appPage');
  const loginForm       = document.getElementById('loginForm');
  const registerForm    = document.getElementById('registerForm');
  const tabLogin        = document.getElementById('tabLogin');
  const tabRegister     = document.getElementById('tabRegister');
  const loginUserEl     = document.getElementById('loginUser');
  const loginPassEl     = document.getElementById('loginPass');
  const loginErrorEl    = document.getElementById('loginError');
  const loginBtn        = document.getElementById('loginBtn');
  const guestBtn        = document.getElementById('guestBtn');
  const regNameEl       = document.getElementById('regName');
  const regUserEl       = document.getElementById('regUser');
  const regPassEl       = document.getElementById('regPass');
  const regPass2El      = document.getElementById('regPass2');
  const regErrorEl      = document.getElementById('registerError');
  const registerBtn     = document.getElementById('registerBtn');

  const sidebar         = document.getElementById('sidebar');
  const menuToggle      = document.getElementById('menuToggle');
  const themeToggle     = document.getElementById('themeToggle');
  const themeIcon       = document.getElementById('themeIcon');
  const userAvatar      = document.getElementById('userAvatar');
  const userName        = document.getElementById('userName');
  const userRole        = document.getElementById('userRole');
  const switchAccountBtn= document.getElementById('switchAccountBtn');
  const accountSwitcher = document.getElementById('accountSwitcher');
  const accountList     = document.getElementById('accountList');
  const addAccountBtn   = document.getElementById('addAccountBtn');
  const logoutBtn       = document.getElementById('logoutBtn');

  const searchInput     = document.getElementById('searchInput');
  const notesGrid       = document.getElementById('notesGrid');
  const pageTitle       = document.getElementById('pageTitle');
  const noteCountLabel  = document.getElementById('noteCountLabel');
  const topbarDate      = document.getElementById('topbarDate');
  const bannerGreeting  = document.getElementById('bannerGreeting');
  const refreshBtn      = document.getElementById('refreshBtn');

  const quickTitle      = document.getElementById('quickTitle');
  const quickBody       = document.getElementById('quickBody');
  const quickCat        = document.getElementById('quickCat');
  const quickImp        = document.getElementById('quickImp');
  const quickSaveBtn    = document.getElementById('quickSaveBtn');

  const modalOverlay    = document.getElementById('modalOverlay');
  const noteTitle       = document.getElementById('noteTitle');
  const noteBody        = document.getElementById('noteBody');
  const noteDate        = document.getElementById('noteDate');
  const catSelect       = document.getElementById('catSelect');
  const impSelect       = document.getElementById('impSelect');
  const pinBtn          = document.getElementById('pinBtn');
  const deleteBtn       = document.getElementById('deleteBtn');
  const closeBtn        = document.getElementById('closeBtn');
  const saveBtn         = document.getElementById('saveBtn');
  const autosaveLabel   = document.getElementById('autosaveLabel');

  // ══ HELPERS ══
  function getUsers()        { return JSON.parse(localStorage.getItem('nf_users') || '{}'); }
  function saveUsers(u)      { localStorage.setItem('nf_users', JSON.stringify(u)); }
  function userKey(u)        { return 'nf_notes_' + u; }
  function genId()           { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function fmtDate(ts)       { return new Date(ts).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
  function esc(s)            { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function avatarChar(name)  { return (name||'G')[0].toUpperCase(); }

  // ══ THEME ══
  const savedTheme = localStorage.getItem('nf_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nf_theme', next);
    themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
  });

  // ══ AUTH TABS ══
  tabLogin.addEventListener('click', () => switchTab('login'));
  tabRegister.addEventListener('click', () => switchTab('register'));

  function switchTab(tab) {
    loginForm.classList.toggle('hidden', tab !== 'login');
    registerForm.classList.toggle('hidden', tab !== 'register');
    tabLogin.classList.toggle('active', tab === 'login');
    tabRegister.classList.toggle('active', tab === 'register');
    loginErrorEl.textContent = '';
    regErrorEl.textContent = '';
  }

  // ══ LOGIN ══
  loginBtn.addEventListener('click', handleLogin);
  loginPassEl.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  loginUserEl.addEventListener('keydown', e => { if (e.key === 'Enter') loginPassEl.focus(); });

  function handleLogin() {
    const username = loginUserEl.value.trim().toLowerCase();
    const password = loginPassEl.value;
    loginErrorEl.textContent = '';
    if (!username || !password) { loginErrorEl.textContent = 'Please fill in all fields.'; return; }
    const users = getUsers();
    if (!users[username]) { loginErrorEl.textContent = 'Username not found.'; return; }
    if (users[username].password !== btoa(password)) { loginErrorEl.textContent = 'Incorrect password.'; return; }
    loginSuccess(username, users[username].name, false);
  }

  // ══ GUEST ══
  guestBtn.addEventListener('click', () => {
    loginSuccess('__guest__', 'Guest', true);
  });

  // ══ REGISTER ══
  registerBtn.addEventListener('click', handleRegister);
  regPass2El.addEventListener('keydown', e => { if (e.key === 'Enter') handleRegister(); });

  function handleRegister() {
    const name     = regNameEl.value.trim();
    const username = regUserEl.value.trim().toLowerCase();
    const pass     = regPassEl.value;
    const pass2    = regPass2El.value;
    regErrorEl.textContent = '';
    if (!name||!username||!pass||!pass2) { regErrorEl.textContent = 'Please fill in all fields.'; return; }
    if (pass !== pass2)    { regErrorEl.textContent = 'Passwords do not match.'; return; }
    if (pass.length < 4)   { regErrorEl.textContent = 'Password must be at least 4 characters.'; return; }
    if (!/^[a-z0-9_]+$/.test(username)) { regErrorEl.textContent = 'Username: letters, numbers and _ only.'; return; }
    const users = getUsers();
    if (users[username])   { regErrorEl.textContent = 'Username already taken.'; return; }
    users[username] = { name, password: btoa(pass) };
    saveUsers(users);
    loginSuccess(username, name, false);
  }

  // ══ LOGIN SUCCESS ══
  function loginSuccess(username, name, isGuest) {
    currentUser = { username, name, isGuest };
    if (!isGuest) localStorage.setItem('nf_session', JSON.stringify({ username, name }));
    notes = JSON.parse(localStorage.getItem(userKey(username)) || '[]');

    // Update UI
    authPage.classList.add('hidden');
    appPage.classList.remove('hidden');
    userAvatar.textContent = avatarChar(name);
    userName.textContent   = name;
    userRole.textContent   = isGuest ? 'Guest Account' : '@' + username;

    setGreetingAndDate();
    renderAccountSwitcher();
    renderNotes();
  }

  // ══ LOGOUT ══
  logoutBtn.addEventListener('click', () => {
    if (!confirm('Sign out of NoteFlow?')) return;
    localStorage.removeItem('nf_session');
    currentUser = null; notes = [];
    appPage.classList.add('hidden');
    authPage.classList.remove('hidden');
    loginUserEl.value = ''; loginPassEl.value = '';
    switchTab('login');
    accountSwitcher.classList.add('hidden');
  });

  // ══ ACCOUNT SWITCHER ══
  switchAccountBtn.addEventListener('click', e => {
    e.stopPropagation();
    accountSwitcher.classList.toggle('hidden');
    if (!accountSwitcher.classList.contains('hidden')) renderAccountSwitcher();
  });
  document.addEventListener('click', e => {
    if (!accountSwitcher.contains(e.target) && e.target !== switchAccountBtn) {
      accountSwitcher.classList.add('hidden');
    }
  });

  addAccountBtn.addEventListener('click', () => {
    accountSwitcher.classList.add('hidden');
    localStorage.removeItem('nf_session');
    currentUser = null; notes = [];
    appPage.classList.add('hidden');
    authPage.classList.remove('hidden');
    loginUserEl.value = ''; loginPassEl.value = '';
    switchTab('register');
  });

  function renderAccountSwitcher() {
    const users = getUsers();
    accountList.innerHTML = '';

    // Guest entry
    const guestDiv = document.createElement('div');
    guestDiv.className = 'acc-item' + (currentUser && currentUser.username === '__guest__' ? ' active-acc' : '');
    guestDiv.innerHTML = `<div class="acc-avatar" style="background:#64748b">G</div>
      <span class="acc-name">Guest</span>
      ${currentUser && currentUser.username === '__guest__' ? '<span class="acc-badge">Active</span>' : ''}`;
    guestDiv.addEventListener('click', () => {
      accountSwitcher.classList.add('hidden');
      if (currentUser && currentUser.username === '__guest__') return;
      loginSuccess('__guest__', 'Guest', true);
    });
    accountList.appendChild(guestDiv);

    Object.entries(users).forEach(([uname, udata]) => {
      const isActive = currentUser && currentUser.username === uname;
      const div = document.createElement('div');
      div.className = 'acc-item' + (isActive ? ' active-acc' : '');
      div.innerHTML = `<div class="acc-avatar">${avatarChar(udata.name)}</div>
        <span class="acc-name">${esc(udata.name)}</span>
        ${isActive ? '<span class="acc-badge">Active</span>' : ''}`;
      div.addEventListener('click', () => {
        accountSwitcher.classList.add('hidden');
        if (isActive) return;
        // Switch: go to login for password
        localStorage.removeItem('nf_session');
        currentUser = null; notes = [];
        appPage.classList.add('hidden');
        authPage.classList.remove('hidden');
        loginUserEl.value = uname;
        loginPassEl.value = '';
        switchTab('login');
        loginPassEl.focus();
      });
      accountList.appendChild(div);
    });
  }

  // ══ AUTO-SESSION ══
  (function checkSession() {
    const s = localStorage.getItem('nf_session');
    if (!s) return;
    try {
      const { username, name } = JSON.parse(s);
      const users = getUsers();
      if (users[username]) loginSuccess(username, name, false);
      else localStorage.removeItem('nf_session');
    } catch(e) { localStorage.removeItem('nf_session'); }
  })();

  // ══ GREETING & DATE (FIXED) ══
  function setGreetingAndDate() {
    const now  = new Date();
    const hour = now.getHours(); // local time, 0-23
    let g;
    if      (hour >= 5  && hour < 12) g = 'Good Morning';
    else if (hour >= 12 && hour < 17) g = 'Good Afternoon';
    else if (hour >= 17 && hour < 21) g = 'Good Evening';
    else                              g = 'Good Night';

    const firstName = currentUser ? currentUser.name.split(' ')[0] : '';
    bannerGreeting.textContent = g + (firstName ? ', ' + firstName + '!' : '!');

    topbarDate.textContent = now.toLocaleDateString('en-IN', {
      weekday:'long', day:'numeric', month:'long', year:'numeric'
    });
  }

  // ══ MOBILE MENU ══
  menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) sidebar.classList.remove('open');
  });

  // ══ STORAGE ══
  function saveToStorage() {
    if (!currentUser) return;
    localStorage.setItem(userKey(currentUser.username), JSON.stringify(notes));
  }

  // ══ AUTO-NUMBERING ══
  function handleAutoNumber(e) {
    if (e.key !== 'Enter') return;
    const ta    = e.target;
    const val   = ta.value;
    const start = ta.selectionStart;
    const lines = val.substring(0, start).split('\n');
    const cur   = lines[lines.length - 1];

    const numMatch    = cur.match(/^(\s*)(\d+)([.)]\s)/);
    const bulletMatch = cur.match(/^(\s*)([-*]\s)/);

    if (numMatch) {
      e.preventDefault();
      const content = cur.replace(/^(\s*)(\d+)([.)]\s)/, '').trim();
      if (!content) {
        ta.value = val.substring(0, start - cur.length) + val.substring(start);
        ta.selectionStart = ta.selectionEnd = start - cur.length;
      } else {
        insertAt(ta, '\n' + numMatch[1] + (parseInt(numMatch[2]) + 1) + numMatch[3]);
      }
    } else if (bulletMatch) {
      e.preventDefault();
      const content = cur.replace(/^(\s*)([-*]\s)/, '').trim();
      if (!content) {
        ta.value = val.substring(0, start - cur.length) + val.substring(start);
        ta.selectionStart = ta.selectionEnd = start - cur.length;
      } else {
        insertAt(ta, '\n' + bulletMatch[1] + bulletMatch[2]);
      }
    }
  }

  function insertAt(ta, text) {
    const s = ta.selectionStart, e2 = ta.selectionEnd;
    ta.value = ta.value.substring(0, s) + text + ta.value.substring(e2);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.dispatchEvent(new Event('input'));
  }

  noteBody.addEventListener('keydown', handleAutoNumber);
  quickBody.addEventListener('keydown', e => {
    handleAutoNumber(e);
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') quickAdd();
  });
  quickTitle.addEventListener('keydown', e => { if (e.key === 'Enter') quickBody.focus(); });

  // ══ QUICK ADD ══
  quickSaveBtn.addEventListener('click', quickAdd);
  function quickAdd() {
    const title = quickTitle.value.trim();
    const body  = quickBody.value.trim();
    if (!title && !body) {
      quickTitle.focus();
      quickTitle.style.outline = '2px solid #4f7cff';
      setTimeout(() => quickTitle.style.outline = '', 1200);
      return;
    }
    notes.unshift({ id:genId(), title:title||'Untitled', body, category:quickCat.value, importance:quickImp.value, pinned:false, createdAt:Date.now(), updatedAt:Date.now() });
    saveToStorage(); renderNotes();
    quickTitle.value=''; quickBody.value=''; quickCat.value='Personal'; quickImp.value='low';
    quickSaveBtn.textContent = '✓ Saved!';
    setTimeout(() => quickSaveBtn.textContent = '＋ Add Note', 1500);
  }

  // ══ RENDER ══
  const IMP_LABEL = { low:'Low', medium:'Medium', high:'High', urgent:'Urgent' };
  const IMP_EMOJI = { low:'🟢', medium:'🟡', high:'🟠', urgent:'🔴' };
  const IMP_ORDER = { urgent:0, high:1, medium:2, low:3 };

  function renderNotes() {
    let filtered = notes.filter(n => {
      if (activeCategory === 'All')    return true;
      if (activeCategory === 'Pinned') return n.pinned;
      return n.category === activeCategory;
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
    }
    filtered.sort((a,b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const diff = IMP_ORDER[a.importance||'low'] - IMP_ORDER[b.importance||'low'];
      return diff !== 0 ? diff : b.updatedAt - a.updatedAt;
    });

    notesGrid.innerHTML = '';
    if (!filtered.length) {
      notesGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">✦</div>
        <p>${searchQuery ? 'No notes match your search.' : 'Your collection is empty.<br/>Write your first note above.'}</p></div>`;
      noteCountLabel.textContent = ''; updateCounts(); return;
    }

    filtered.forEach(note => {
      const imp  = note.importance || 'low';
      const card = document.createElement('div');
      card.className = `note-card imp-${imp}${note.pinned ? ' pinned' : ''}`;
      card.innerHTML = `
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
          <div class="note-card-title">${esc(note.title)}</div>
          ${note.pinned ? '<span class="pin-ind">📌</span>' : ''}
        </div>
        <div class="note-card-body">${esc(note.body)||'<em style="opacity:.4">No content</em>'}</div>
        <div class="note-card-footer">
          <span class="card-date">${fmtDate(note.updatedAt)}</span>
          <div class="card-tags">
            <span class="cat-badge">${note.category}</span>
            <span class="imp-badge">${IMP_EMOJI[imp]} ${IMP_LABEL[imp]}</span>
          </div>
        </div>`;
      card.addEventListener('click', () => openNote(note.id));
      notesGrid.appendChild(card);
    });

    noteCountLabel.textContent = `${filtered.length} note${filtered.length !== 1 ? 's' : ''}`;
    updateCounts();
  }

  function updateCounts() {
    document.getElementById('countAll').textContent      = notes.length;
    document.getElementById('countPersonal').textContent = notes.filter(n => n.category==='Personal').length;
    document.getElementById('countWork').textContent     = notes.filter(n => n.category==='Work').length;
    document.getElementById('countIdeas').textContent    = notes.filter(n => n.category==='Ideas').length;
    document.getElementById('countPinned').textContent   = notes.filter(n => n.pinned).length;
  }

  // ══ OPEN NOTE ══
  function openNote(id) {
    activeNote = notes.find(n => n.id === id);
    if (!activeNote) return;
    noteTitle.value   = activeNote.title;
    noteBody.value    = activeNote.body;
    catSelect.value   = activeNote.category;
    impSelect.value   = activeNote.importance || 'low';
    noteDate.textContent = 'Updated ' + fmtDate(activeNote.updatedAt);
    pinBtn.style.opacity = activeNote.pinned ? '1' : '0.4';
    autosaveLabel.classList.remove('show');
    modalOverlay.classList.remove('hidden');
    setTimeout(() => noteTitle.focus(), 80);
  }

  // ══ AUTO-SAVE ══
  function triggerSave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      if (!activeNote) return;
      activeNote.title      = noteTitle.value || 'Untitled';
      activeNote.body       = noteBody.value;
      activeNote.category   = catSelect.value;
      activeNote.importance = impSelect.value;
      activeNote.updatedAt  = Date.now();
      saveToStorage(); renderNotes();
      autosaveLabel.classList.add('show');
      setTimeout(() => autosaveLabel.classList.remove('show'), 2000);
    }, 800);
  }
  noteTitle.addEventListener('input', triggerSave);
  noteBody.addEventListener('input', triggerSave);
  catSelect.addEventListener('change', triggerSave);
  impSelect.addEventListener('change', triggerSave);

  // ══ SAVE BTN ══
  saveBtn.addEventListener('click', () => {
    if (!activeNote) return;
    activeNote.title = noteTitle.value||'Untitled'; activeNote.body = noteBody.value;
    activeNote.category = catSelect.value; activeNote.importance = impSelect.value;
    activeNote.updatedAt = Date.now();
    saveToStorage(); renderNotes(); closeModal();
  });

  // ══ PIN ══
  pinBtn.addEventListener('click', () => {
    if (!activeNote) return;
    activeNote.pinned = !activeNote.pinned;
    pinBtn.style.opacity = activeNote.pinned ? '1' : '0.4';
    saveToStorage(); renderNotes();
  });

  // ══ DELETE ══
  deleteBtn.addEventListener('click', () => {
    if (!activeNote) return;
    if (!confirm('Delete this note?')) return;
    notes = notes.filter(n => n.id !== activeNote.id);
    saveToStorage(); renderNotes(); closeModal();
  });

  // ══ CLOSE ══
  function closeModal() { modalOverlay.classList.add('hidden'); activeNote=null; clearTimeout(autosaveTimer); }
  closeBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target===modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal(); });

  // ══ SEARCH ══
  searchInput.addEventListener('input', e => { searchQuery = e.target.value; renderNotes(); });

  // ══ CATEGORIES ══
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      activeCategory = item.dataset.cat;
      pageTitle.textContent = activeCategory==='All' ? 'All Notes' :
                              activeCategory==='Pinned' ? 'Pinned Notes' :
                              activeCategory + ' Notes';
      renderNotes(); sidebar.classList.remove('open');
    });
  });

  // ══ REFRESH ══
  refreshBtn.addEventListener('click', () => {
    if (currentUser) notes = JSON.parse(localStorage.getItem(userKey(currentUser.username)) || '[]');
    setGreetingAndDate(); renderNotes();
    refreshBtn.style.color = '#4f7cff';
    setTimeout(() => refreshBtn.style.color = '', 600);
  });

});
