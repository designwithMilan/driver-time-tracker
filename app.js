(function () {
  const STORAGE_KEYS = {
    users: 'driverTimeTrackerUsers',
    entries: 'driverTimeTrackerEntries',
    activeTimer: 'driverTimeTrackerActiveTimer',
    currentUser: 'driverTimeTrackerCurrentUser'
  };

  const state = {
    mode: 'login',
    activeUser: null,
    timer: null,
    entries: []
  };

  const els = {
    authScreen: document.getElementById('authScreen'),
    appScreen: document.getElementById('appScreen'),
    authForm: document.getElementById('authForm'),
    authTitle: document.getElementById('authTitle'),
    authMessage: document.getElementById('authMessage'),
    emailInput: document.getElementById('emailInput'),
    passwordInput: document.getElementById('passwordInput'),
    logoutBtn: document.getElementById('logoutBtn'),
    segments: document.querySelectorAll('.segment'),
    todayHours: document.getElementById('todayHours'),
    weekHours: document.getElementById('weekHours'),
    timerStatus: document.getElementById('timerStatus'),
    elapsedTimer: document.getElementById('elapsedTimer'),
    startTimerBtn: document.getElementById('startTimerBtn'),
    stopTimerBtn: document.getElementById('stopTimerBtn'),
    timerNotes: document.getElementById('timerNotes'),
    timerTags: document.getElementById('timerTags'),
    manualEntryForm: document.getElementById('manualEntryForm'),
    manualStart: document.getElementById('manualStart'),
    manualEnd: document.getElementById('manualEnd'),
    manualNotes: document.getElementById('manualNotes'),
    manualTags: document.getElementById('manualTags'),
    clearManualBtn: document.getElementById('clearManualBtn'),
    entriesList: document.getElementById('entriesList'),
    dailyReport: document.getElementById('dailyReport'),
    weeklyReport: document.getElementById('weeklyReport'),
    exportCsvBtn: document.getElementById('exportCsvBtn')
  };

  function loadFromStorage() {
    state.entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.entries) || '[]');
    state.timer = JSON.parse(localStorage.getItem(STORAGE_KEYS.activeTimer) || 'null');
    const currentUser = localStorage.getItem(STORAGE_KEYS.currentUser);
    state.activeUser = currentUser || null;
  }

  function saveEntries() {
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(state.entries));
  }

  function saveTimer() {
    localStorage.setItem(STORAGE_KEYS.activeTimer, JSON.stringify(state.timer));
  }

  function saveCurrentUser() {
    if (state.activeUser) {
      localStorage.setItem(STORAGE_KEYS.currentUser, state.activeUser);
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
    }
  }

  function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }

  function parseLocalDateTime(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatHoursMinutes(totalMinutes) {
    const safeMinutes = Math.max(0, Math.round(totalMinutes));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  function formatDurationFromMs(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map((v) => String(v).padStart(2, '0'))
      .join(':');
  }

  function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  function getDayKey(date) {
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
  }

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    start.setDate(d.getDate() + diff);
    return start;
  }

  function getFilteredEntries() {
    if (!state.activeUser) return [];
    return state.entries
      .filter((entry) => entry.userEmail === state.activeUser)
      .sort((a, b) => new Date(b.start) - new Date(a.start));
  }

  function calculateDurationMinutes(start, end) {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    if (Number.isNaN(startTime) || Number.isNaN(endTime)) return 0;
    return Math.max(0, (endTime - startTime) / 60000);
  }

  function updateSummaryCards() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const todayMinutes = getFilteredEntries()
      .filter((entry) => new Date(entry.end) >= startOfDay)
      .reduce((sum, entry) => sum + entry.durationMinutes, 0);

    const weekStart = getWeekStart(today);
    const weekMinutes = getFilteredEntries()
      .filter((entry) => new Date(entry.end) >= weekStart)
      .reduce((sum, entry) => sum + entry.durationMinutes, 0);

    els.todayHours.textContent = formatHoursMinutes(todayMinutes);
    els.weekHours.textContent = formatHoursMinutes(weekMinutes);

    if (state.timer) {
      const elapsed = Date.now() - new Date(state.timer.start).getTime();
      els.elapsedTimer.textContent = formatDurationFromMs(elapsed);
      els.timerStatus.textContent = 'Running';
      els.startTimerBtn.disabled = true;
      els.stopTimerBtn.disabled = false;
    } else {
      els.elapsedTimer.textContent = '00:00:00';
      els.timerStatus.textContent = 'Stopped';
      els.startTimerBtn.disabled = false;
      els.stopTimerBtn.disabled = true;
    }
  }

  function renderEntries() {
    const entries = getFilteredEntries();
    if (!entries.length) {
      els.entriesList.innerHTML = '<div class="empty-state">No time entries yet.</div>';
      return;
    }

    els.entriesList.innerHTML = entries
      .map((entry) => {
        const tags = (entry.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('');
        return `
          <article class="entry-item">
            <div class="entry-top">
              <div>
                <div class="entry-time">${formatDateTime(entry.start)} → ${formatDateTime(entry.end)}</div>
              </div>
              <span class="duration-badge">${formatHoursMinutes(entry.durationMinutes)}</span>
            </div>
            <div class="entry-notes">${entry.notes || 'No notes added.'}</div>
            <div class="tags">${tags || '<span class="tag">untagged</span>'}</div>
          </article>
        `;
      })
      .join('');
  }

  function renderDailyReport() {
    const entries = getFilteredEntries();
    if (!entries.length) {
      els.dailyReport.innerHTML = '<div class="empty-state">No entries for today.</div>';
      return;
    }

    const group = {};
    entries.forEach((entry) => {
      const key = getDayKey(entry.start);
      if (!group[key]) group[key] = 0;
      group[key] += entry.durationMinutes;
    });

    const rows = Object.entries(group)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7)
      .map(([date, minutes]) => `
        <div class="report-row">
          <span>${date}</span>
          <strong>${formatHoursMinutes(minutes)}</strong>
        </div>
      `)
      .join('');

    els.dailyReport.innerHTML = rows;
  }

  function renderWeeklyReport() {
    const entries = getFilteredEntries();
    if (!entries.length) {
      els.weeklyReport.innerHTML = '<div class="empty-state">No weekly data yet.</div>';
      return;
    }

    const group = {};
    entries.forEach((entry) => {
      const start = new Date(entry.start);
      const weekStart = getWeekStart(start);
      const key = weekStart.toISOString().slice(0, 10);
      if (!group[key]) group[key] = 0;
      group[key] += entry.durationMinutes;
    });

    const rows = Object.entries(group)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 8)
      .map(([week, minutes]) => `
        <div class="report-row">
          <span>${week}</span>
          <strong>${formatHoursMinutes(minutes)}</strong>
        </div>
      `)
      .join('');

    els.weeklyReport.innerHTML = rows;
  }

  function renderDashboard() {
    renderEntries();
    renderDailyReport();
    renderWeeklyReport();
    updateSummaryCards();
  }

  function setMessage(text, kind = '') {
    els.authMessage.textContent = text;
    els.authMessage.className = `message ${kind}`.trim();
  }

  function setMode(mode) {
    state.mode = mode;
    els.segments.forEach((button) => {
      const isActive = button.dataset.mode === mode;
      button.classList.toggle('active', isActive);
    });
    els.authTitle.textContent = mode === 'signup' ? 'Create Account' : 'Driver Login';
    if (mode === 'signup') {
      els.authForm.querySelector('button[type="submit"]').textContent = 'Create account';
    } else {
      els.authForm.querySelector('button[type="submit"]').textContent = 'Continue';
    }
  }

  function createUser(email, password) {
    const users = getUsers();
    const exists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { ok: false, message: 'An account with this email already exists.' };
    }

    users.push({ email: email.toLowerCase(), password });
    saveUsers(users);
    return { ok: true, message: 'Account created successfully.' };
  }

  function authenticate(email, password) {
    const users = getUsers();
    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { ok: false, message: 'No account found for this email address.' };
    }
    if (user.password !== password) {
      return { ok: false, message: 'Incorrect password.' };
    }
    return { ok: true };
  }

  function loginUser(email) {
    state.activeUser = email.toLowerCase();
    saveCurrentUser();
    els.authScreen.classList.add('hidden');
    els.appScreen.classList.remove('hidden');
    els.logoutBtn.classList.remove('hidden');
    els.emailInput.value = '';
    els.passwordInput.value = '';
    renderDashboard();
  }

  function logoutUser() {
    state.activeUser = null;
    saveCurrentUser();
    els.appScreen.classList.add('hidden');
    els.authScreen.classList.remove('hidden');
    els.logoutBtn.classList.add('hidden');
    setMessage('');
  }

  function ensureTimerState() {
    if (state.timer && state.timer.userEmail !== state.activeUser) {
      state.timer = null;
      saveTimer();
    }
  }

  function startTimer() {
    if (!state.activeUser) return;
    if (state.timer) {
      setMessage('A timer is already running.', 'error');
      return;
    }

    state.timer = {
      userEmail: state.activeUser,
      start: new Date().toISOString(),
      notes: els.timerNotes.value.trim(),
      tags: parseTags(els.timerTags.value)
    };
    saveTimer();
    setMessage('Shift timer started.', 'success');
    updateSummaryCards();
  }

  function stopTimer() {
    if (!state.activeUser || !state.timer) return;

    const start = new Date(state.timer.start);
    const end = new Date();
    const durationMinutes = calculateDurationMinutes(start, end);

    state.entries.push({
      id: crypto.randomUUID(),
      userEmail: state.activeUser,
      start: start.toISOString(),
      end: end.toISOString(),
      durationMinutes,
      notes: state.timer.notes || els.timerNotes.value.trim() || 'Shift logged',
      tags: state.timer.tags.length ? state.timer.tags : parseTags(els.timerTags.value)
    });

    saveEntries();
    state.timer = null;
    saveTimer();
    els.timerNotes.value = '';
    els.timerTags.value = '';
    renderDashboard();
    setMessage('Shift saved.', 'success');
  }

  function parseTags(value) {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function handleAuthSubmit(event) {
    event.preventDefault();
    const email = els.emailInput.value.trim();
    const password = els.passwordInput.value.trim();

    if (!email || !password) {
      setMessage('Please enter both email and password.', 'error');
      return;
    }

    if (state.mode === 'signup') {
      const result = createUser(email, password);
      if (!result.ok) {
        setMessage(result.message, 'error');
        return;
      }
      setMessage(result.message, 'success');
      setMode('login');
      els.emailInput.value = email;
      els.passwordInput.value = password;
      return;
    }

    const result = authenticate(email, password);
    if (!result.ok) {
      setMessage(result.message, 'error');
      return;
    }

    loginUser(email);
  }

  function handleManualEntry(event) {
    event.preventDefault();
    if (!state.activeUser) return;

    const start = parseLocalDateTime(els.manualStart.value);
    const end = parseLocalDateTime(els.manualEnd.value);
    if (!start || !end) {
      setMessage('Select both a start and end time.', 'error');
      return;
    }
    if (end <= start) {
      setMessage('End time must be later than start time.', 'error');
      return;
    }

    const durationMinutes = calculateDurationMinutes(start, end);
    const entry = {
      id: crypto.randomUUID(),
      userEmail: state.activeUser,
      start: start.toISOString(),
      end: end.toISOString(),
      durationMinutes,
      notes: els.manualNotes.value.trim() || 'Manual entry',
      tags: parseTags(els.manualTags.value)
    };

    state.entries.push(entry);
    saveEntries();
    els.manualEntryForm.reset();
    renderDashboard();
    setMessage('Manual entry saved.', 'success');
  }

  function exportToCsv() {
    const entries = getFilteredEntries();
    if (!entries.length) {
      setMessage('There are no entries to export yet.', 'error');
      return;
    }

    const rows = [
      ['Start', 'End', 'Duration (minutes)', 'Notes', 'Tags'],
      ...entries.map((entry) => [
        new Date(entry.start).toISOString(),
        new Date(entry.end).toISOString(),
        String(Math.round(entry.durationMinutes)),
        entry.notes || '',
        (entry.tags || []).join('; ')
      ])
    ];

    const csvContent = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `driver_time_log_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
                
    setMessage('CSV export created.', 'success');
  }

  function init() {
    loadFromStorage();
    els.segments.forEach((button) => {
      button.addEventListener('click', () => setMode(button.dataset.mode));
    });

    els.authForm.addEventListener('submit', handleAuthSubmit);
    els.logoutBtn.addEventListener('click', logoutUser);
    els.startTimerBtn.addEventListener('click', startTimer);
    els.stopTimerBtn.addEventListener('click', stopTimer);
    els.manualEntryForm.addEventListener('submit', handleManualEntry);
    els.clearManualBtn.addEventListener('click', () => els.manualEntryForm.reset());
    els.exportCsvBtn.addEventListener('click', exportToCsv);

    if (state.activeUser) {
      loginUser(state.activeUser);
    } else {
      els.authScreen.classList.remove('hidden');
      els.appScreen.classList.add('hidden');
    }

    setMode('login');
    setInterval(() => {
      if (state.activeUser) {
        ensureTimerState();
        updateSummaryCards();
      }
    }, 1000);
  }

  init();
})();
