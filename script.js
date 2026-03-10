


let tasks = [];
let currentFilter = 'all';
let editingIndex  = null;
let searchOpen    = false;
let bannerTimer   = null;


const TIPS = [
  "Break large tasks into sub-steps to maintain momentum.",
  "Use the Pomodoro technique: 25 min focus, 5 min break.",
  "Prioritise your top 3 tasks each morning.",
  "Review and reset your task list every Friday.",
  "Block distraction apps during deep work sessions.",
  "Mark urgent tasks 'High Priority' so nothing slips.",
  "A completed small task builds motivation for bigger ones.",
  "Write task descriptions clearly — your future self will thank you.",
];


document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadTasks();
  setCurrentDate();
  checkDeadlines();
  renderTasks();
  updateStats();

  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
  document.getElementById('taskDate').value = tomorrow.toISOString().slice(0, 16);

  const savedName = localStorage.getItem('stm_username') || 'Alex Dev';
  const initial   = savedName.charAt(0).toUpperCase();
  const el1 = document.getElementById('sidebarName');
  const el2 = document.getElementById('sidebarAvatar');
  const el3 = document.getElementById('topbarAvatar');
  if (el1) el1.textContent = savedName;
  if (el2) el2.textContent = initial;
  if (el3) el3.textContent = initial;
});

function loadTasks() {
  const saved = localStorage.getItem('stm_tasks');
  tasks = saved ? JSON.parse(saved) : [];
}
function saveTasks() {
  localStorage.setItem('stm_tasks', JSON.stringify(tasks));
}

function loadSettings() {
  const theme  = localStorage.getItem('stm_theme')  || 'dark';
  const accent = localStorage.getItem('stm_accent') || '#6c63ff';
  const accent2= localStorage.getItem('stm_accent2')|| '#a78bfa';
  const fs     = localStorage.getItem('stm_fs')     || '15px';

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.setProperty('--accent',  accent);
  document.documentElement.style.setProperty('--accent2', accent2);
  document.documentElement.style.fontSize = fs;
}

function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (el) el.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
function isUrgent(task) {
  if (task.status === 'completed' || !task.dueDate) return false;
  const diff = new Date(task.dueDate) - Date.now();
  return diff > 0 && diff <= 86400000;
}
function isOverdue(task) {
  if (task.status === 'completed' || !task.dueDate) return false;
  return new Date(task.dueDate) < Date.now();
}

function addTask(event) {
  event.preventDefault();

  const title    = document.getElementById('taskTitle').value.trim();
  const desc     = document.getElementById('taskDesc').value.trim();
  const dueDate  = document.getElementById('taskDate').value;
  const priority = document.getElementById('taskPriority').value;

  if (!title) { showTopBanner('⚠️ Please enter a task title.', 'warning'); return; }

  const newTask = {
    id: Date.now(), title, desc, dueDate, priority,
    status: 'pending', createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();
  updateStats();

  document.getElementById('taskForm').reset();
  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
  document.getElementById('taskDate').value = tomorrow.toISOString().slice(0, 16);

  showTopBanner(`✅ "${title}" has been successfully added!`, 'success');
  checkDeadlines();
}


function showTopBanner(message, type = 'success') {
  const banner = document.getElementById('successBanner');
  const text   = document.getElementById('bannerText');

  const oldBar = banner.querySelector('.banner-timer');
  const newBar = oldBar.cloneNode(true);
  oldBar.replaceWith(newBar);

  if (type === 'success') {
    banner.style.background = 'linear-gradient(90deg, #16a34a, #22d3a5)';
    banner.style.boxShadow  = '0 4px 24px rgba(34,211,165,0.35)';
  } else if (type === 'warning') {
    banner.style.background = 'linear-gradient(90deg, #d97706, #fbbf24)';
    banner.style.boxShadow  = '0 4px 24px rgba(251,191,36,0.35)';
  } else if (type === 'info') {
    banner.style.background = 'linear-gradient(90deg, #0369a1, #38bdf8)';
    banner.style.boxShadow  = '0 4px 24px rgba(56,189,248,0.35)';
  }

  text.textContent = message;
  banner.classList.add('show');

  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(closeBanner, 3500);
}
function closeBanner() {
  document.getElementById('successBanner').classList.remove('show');
}

function deleteTask(index) {
  const card = document.querySelector(`.task-card[data-index="${index}"]`);
  if (card) {
    card.style.transition = 'all 0.3s ease';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(0.88) translateY(-6px)';
    setTimeout(() => {
      tasks.splice(index, 1);
      saveTasks(); renderTasks(); updateStats();
    }, 280);
  }
  showTopBanner('🗑️ Task deleted.', 'info');
}

function toggleStatus(index) {
  tasks[index].status = tasks[index].status === 'completed' ? 'pending' : 'completed';
  saveTasks(); renderTasks(); updateStats();

  const msg = tasks[index].status === 'completed'
    ? `🎉 "${tasks[index].title}" marked as completed!`
    : `🔄 "${tasks[index].title}" moved back to pending.`;
  showTopBanner(msg, tasks[index].status === 'completed' ? 'success' : 'info');
}

function openEditModal(index) {
  editingIndex = index;
  const t = tasks[index];
  document.getElementById('editTitle').value    = t.title;
  document.getElementById('editDesc').value     = t.desc;
  document.getElementById('editDate').value     = t.dueDate;
  document.getElementById('editPriority').value = t.priority;
  document.getElementById('editOverlay').classList.remove('hidden');
}
function closeEditModal() {
  document.getElementById('editOverlay').classList.add('hidden');
  editingIndex = null;
}
function saveEdit(event) {
  event.preventDefault();
  if (editingIndex === null) return;
  tasks[editingIndex].title    = document.getElementById('editTitle').value.trim();
  tasks[editingIndex].desc     = document.getElementById('editDesc').value.trim();
  tasks[editingIndex].dueDate  = document.getElementById('editDate').value;
  tasks[editingIndex].priority = document.getElementById('editPriority').value;
  saveTasks(); renderTasks(); updateStats();
  closeEditModal();
  showTopBanner('✏️ Task updated successfully!', 'success');
}

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

function renderTasks() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const list  = document.getElementById('taskList');
  const empty = document.getElementById('emptyState');

  let filtered = tasks.filter(t => {
    if (currentFilter === 'pending')   return t.status === 'pending';
    if (currentFilter === 'completed') return t.status === 'completed';
    if (currentFilter === 'high')      return t.priority === 'high';
    return true;
  });

  if (query) {
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(query) ||
      (t.desc && t.desc.toLowerCase().includes(query))
    );
  }

  const indexed = filtered.map(t => ({ task: t, index: tasks.indexOf(t) }));

  document.getElementById('taskCount').textContent =
    `${indexed.length} task${indexed.length !== 1 ? 's' : ''}`;

  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) {
    clearBtn.classList.toggle('hidden', !query);
  }

  if (indexed.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = indexed.map(({ task: t, index: i }) => buildCard(t, i)).join('');
}

function buildCard(t, i) {
  const done    = t.status === 'completed';
  const urgent  = isUrgent(t);
  const overdue = isOverdue(t);

  const cardClass = ['task-card', done ? 'done' : '', urgent ? 'urgent' : ''].filter(Boolean).join(' ');
  const dueClass  = (urgent || overdue) && !done ? 'task-due near' : 'task-due';

  const urgentBadge  = urgent && !done
    ? `<span class="badge badge-urgent"><i class="fa-solid fa-triangle-exclamation"></i> Due Soon</span>` : '';
  const overdueBadge = overdue && !done
    ? `<span class="badge badge-high"><i class="fa-solid fa-clock-rotate-left"></i> Overdue</span>` : '';

  return `
    <div class="${cardClass}" data-index="${i}" data-priority="${t.priority}">
      <p class="task-title">${escapeHTML(t.title)}</p>
      ${t.desc ? `<p class="task-desc">${escapeHTML(t.desc)}</p>` : ''}
      <div class="task-meta">
        <span class="badge badge-${t.priority}">${priorityIcon(t.priority)} ${capitalize(t.priority)}</span>
        <span class="badge badge-${t.status}">${statusIcon(t.status)} ${capitalize(t.status)}</span>
        ${urgentBadge}${overdueBadge}
      </div>
      <div class="${dueClass}"><i class="fa-regular fa-clock"></i> ${formatDate(t.dueDate)}</div>
      <div class="task-actions">
        ${done
          ? `<button class="action-btn undo" onclick="toggleStatus(${i})"><i class="fa-solid fa-rotate-left"></i> Undo</button>`
          : `<button class="action-btn complete" onclick="toggleStatus(${i})"><i class="fa-solid fa-check"></i> Done</button>`}
        <button class="action-btn edit" onclick="openEditModal(${i})"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="action-btn delete" onclick="deleteTask(${i})"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    </div>`;
}

function updateStats() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending   = tasks.filter(t => t.status === 'pending').length;
  const high      = tasks.filter(t => t.priority === 'high').length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById('statTotal').textContent     = total;
  document.getElementById('statCompleted').textContent = completed;
  document.getElementById('statPending').textContent   = pending;
  document.getElementById('statHigh').textContent      = high;
  document.getElementById('progressBar').style.width   = pct + '%';
  document.getElementById('progressPercent').textContent = pct + '%';

  const msgEl = document.getElementById('progressMsg');
  if (msgEl) {
    if (total === 0) msgEl.textContent = 'Start adding tasks to track your progress.';
    else if (pct === 100) msgEl.textContent = '🎉 All tasks completed! Amazing work!';
    else if (pct >= 75)   msgEl.textContent = `🔥 Almost there — ${pending} task${pending !== 1 ? 's' : ''} left.`;
    else if (pct >= 50)   msgEl.textContent = `👍 Good momentum — keep going!`;
    else                  msgEl.textContent = `You've completed ${completed} of ${total} tasks. Keep it up!`;
  }

  const ssStreak = document.getElementById('ss-streak');
  const ssDone   = document.getElementById('ss-done');
  const ssRate   = document.getElementById('ss-rate');
  if (ssStreak) ssStreak.textContent = Math.min(completed, 30);
  if (ssDone)   ssDone.textContent   = completed;
  if (ssRate)   ssRate.textContent   = pct + '%';
}

function checkDeadlines() {
  const urgent = tasks.filter(t => isUrgent(t));
  if (urgent.length === 0) return;
  const names = urgent.map(t => `"${t.title}"`).join(', ');
  document.getElementById('reminderText').textContent =
    `${urgent.length === 1 ? 'Task' : 'Tasks'} ${names} ${urgent.length === 1 ? 'is' : 'are'} due within 24 hours!`;
  document.getElementById('reminderOverlay').classList.remove('hidden');
}
function closeReminder() {
  document.getElementById('reminderOverlay').classList.add('hidden');
}


function toggleSearch() {
  const expandable = document.getElementById('searchExpandable');
  const btn        = document.getElementById('searchToggleBtn');
  const input      = document.getElementById('searchInput');

  searchOpen = !searchOpen;
  expandable.classList.toggle('open', searchOpen);

  if (searchOpen) {
    btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    btn.style.background    = 'rgba(108,99,255,0.15)';
    btn.style.borderColor   = 'var(--accent)';
    btn.style.color         = 'var(--accent2)';
    setTimeout(() => input && input.focus(), 320);
  } else {
    btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
    btn.style.background  = '';
    btn.style.borderColor = '';
    btn.style.color       = '';
    if (input) { input.value = ''; renderTasks(); }
  }
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) { input.value = ''; input.focus(); renderTasks(); }
  document.getElementById('searchClear').classList.add('hidden');
}

function openSettings() {
  updateStats(); 
  document.getElementById('settingsOverlay').classList.remove('hidden');

  const savedTheme = localStorage.getItem('stm_theme') || 'dark';
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === savedTheme);
  });
}
function closeSettings() {
  document.getElementById('settingsOverlay').classList.add('hidden');
}

function applyTheme(theme, btn) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('stm_theme', theme);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showTopBanner(`🎨 Theme changed to ${capitalize(theme)}`, 'info');
}

function applyAccent(btn, c1, c2) {
  document.documentElement.style.setProperty('--accent',  c1);
  document.documentElement.style.setProperty('--accent2', c2);
  localStorage.setItem('stm_accent',  c1);
  localStorage.setItem('stm_accent2', c2);
  document.querySelectorAll('.accent-dot').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function applyFont(size, btn) {
  document.documentElement.style.fontSize = size;
  localStorage.setItem('stm_fs', size);
  document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function newTip() {
  const el = document.getElementById('proTip');
  if (!el) return;
  const cur = el.textContent;
  let next  = cur;
  while (next === cur) next = TIPS[Math.floor(Math.random() * TIPS.length)];
  el.style.opacity = '0';
  setTimeout(() => { el.textContent = next; el.style.opacity = '1'; }, 200);
  el.style.transition = 'opacity 0.2s';
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
function switchView(view, el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');

  const dash   = document.getElementById('dashboardSection');
  const tasks_ = document.getElementById('tasksSection');
  const title  = document.getElementById('viewTitle');

  if (view === 'dashboard') {
    dash.style.display   = '';
    tasks_.style.display = '';
    title.textContent    = 'Dashboard';
    currentFilter = 'all'; resetFilterBtns('all');
  } else if (view === 'all') {
    dash.style.display   = 'none';
    tasks_.style.display = '';
    title.textContent    = 'All Tasks';
    currentFilter = 'all'; resetFilterBtns('all');
  } else if (view === 'completed') {
    dash.style.display   = 'none';
    tasks_.style.display = '';
    title.textContent    = 'Completed Tasks';
    currentFilter = 'completed'; resetFilterBtns('completed');
  }

  renderTasks();
  document.getElementById('sidebar').classList.remove('open');
}
function resetFilterBtns(active) {
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === active);
  });
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
function priorityIcon(p) {
  if (p === 'high')   return '<i class="fa-solid fa-fire"></i>';
  if (p === 'medium') return '<i class="fa-solid fa-minus"></i>';
  return '<i class="fa-solid fa-leaf"></i>';
}
function statusIcon(s) {
  return s === 'completed'
    ? '<i class="fa-solid fa-circle-check"></i>'
    : '<i class="fa-solid fa-hourglass-half"></i>';
}

document.addEventListener('click', (e) => {
  if (e.target === document.getElementById('editOverlay'))    closeEditModal();
  if (e.target === document.getElementById('reminderOverlay')) closeReminder();
  if (e.target === document.getElementById('settingsOverlay')) closeSettings();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeEditModal(); closeReminder(); closeSettings();
    document.getElementById('sidebar').classList.remove('open');
    if (searchOpen) toggleSearch();
  }
});