const STORAGE_KEY = 'expense-tracker-transactions';

const BALANCE_MOODS = {
  positive: ['🎉 You\'re in the green!', '💪 Nice balance!', '✨ Looking good!'],
  negative: ['⚠️ Time to cut back?', '📊 Track more to improve', '🔔 Mind your spending'],
  zero: ['Add transactions to get started', '📝 Add income or expenses above'],
};

const CATEGORY_EMOJI = {
  other: '📌',
  salary: '💼',
  freelance: '🖥️',
  gift: '🎁',
  investment: '📊',
  food: '🍕',
  transport: '🚗',
  shopping: '🛒',
  bills: '📄',
  entertainment: '🎬',
  health: '💊',
  travel: '✈️',
};

const CATEGORY_LABEL = {
  other: 'Other',
  salary: 'Salary',
  freelance: 'Freelance',
  gift: 'Gift',
  investment: 'Investment',
  food: 'Food & Dining',
  transport: 'Transport',
  shopping: 'Shopping',
  bills: 'Bills & Utilities',
  entertainment: 'Entertainment',
  health: 'Health',
  travel: 'Travel',
};

let transactions = [];
let currentFilter = 'all';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      transactions = Array.isArray(parsed) ? parsed : [];
      return;
    }
  } catch (_) {}
  transactions = [];
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (_) {}
}

function getBalanceMood(balance) {
  if (balance > 0) return BALANCE_MOODS.positive[Math.floor(Math.random() * BALANCE_MOODS.positive.length)];
  if (balance < 0) return BALANCE_MOODS.negative[Math.floor(Math.random() * BALANCE_MOODS.negative.length)];
  return BALANCE_MOODS.zero[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function formatCurrency(amount) {
  const abs = Math.abs(amount);
  const sign = amount >= 0 ? '+' : '−';
  return `${sign}$${abs.toFixed(2)}`;
}

function updateUI() {
  const balance = transactions.reduce((sum, t) => sum + t.amount, 0);
  const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const balanceEl = document.getElementById('balance');
  balanceEl.textContent = `$${balance.toFixed(2)}`;
  balanceEl.className = 'balance-value ' + (balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'zero');

  document.getElementById('balance-mood').textContent = getBalanceMood(balance);
  document.getElementById('income').textContent = `$${income.toFixed(2)}`;
  document.getElementById('expense').textContent = `$${expense.toFixed(2)}`;

  const filtered = currentFilter === 'all'
    ? transactions
    : currentFilter === 'income'
      ? transactions.filter(t => t.amount > 0)
      : transactions.filter(t => t.amount < 0);

  const list = document.getElementById('transaction-history');
  const empty = document.getElementById('empty-state');
  list.innerHTML = '';

  if (filtered.length === 0) {
    list.classList.add('hidden');
    empty.classList.add('visible');
    empty.querySelector('.empty-emoji').textContent = currentFilter === 'all' ? '📭' : '🔍';
    empty.querySelector('p').textContent = currentFilter === 'all' ? 'No transactions yet' : `No ${currentFilter} transactions`;
    empty.querySelector('.empty-hint').textContent = currentFilter === 'all' ? 'Add your first one above!' : 'Try another filter.';
  } else {
    list.classList.remove('hidden');
    empty.classList.remove('visible');
    filtered.forEach((transaction, index) => {
      const globalIndex = transactions.indexOf(transaction);
      const li = document.createElement('li');
      li.className = `transaction-item ${transaction.amount > 0 ? 'income' : 'expense'}`;
      const catEmoji = CATEGORY_EMOJI[transaction.category] || '📌';
      li.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-name">${escapeHtml(transaction.name)}</div>
          <div class="transaction-meta">
            <span class="transaction-category">${catEmoji} ${escapeHtml(CATEGORY_LABEL[transaction.category] || transaction.category)}</span>
            <span>${formatDate(transaction.date)}</span>
          </div>
        </div>
        <span class="transaction-amount">${formatCurrency(transaction.amount)}</span>
        <div class="transaction-actions">
          <button type="button" class="btn-icon btn-edit" title="Edit" data-index="${globalIndex}">✏️</button>
          <button type="button" class="btn-icon btn-delete" title="Delete" data-index="${globalIndex}">🗑️</button>
        </div>
      `;
      list.appendChild(li);
    });
  }

  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === currentFilter);
  });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function addTransaction(event) {
  event.preventDefault();
  const name = document.getElementById('transaction-name').value.trim();
  const amountInput = document.getElementById('transaction-amount');
  const rawAmount = parseFloat(amountInput.value);
  const type = document.querySelector('input[name="type"]:checked').value;
  const category = document.getElementById('transaction-category').value;

  if (!name || isNaN(rawAmount) || rawAmount <= 0) return;

  const amount = type === 'expense' ? -rawAmount : rawAmount;
  transactions.push({
    name,
    amount,
    category: category || 'other',
    date: new Date().toISOString(),
  });

  document.getElementById('transaction-form').reset();
  document.querySelector('input[name="type"][value="income"]').checked = true;
  saveToStorage();
  updateUI();
  showToast('✅ Transaction added!', 'success');
}

function deleteTransaction(index) {
  transactions.splice(index, 1);
  saveToStorage();
  updateUI();
  showToast('🗑️ Transaction removed', 'info');
}

function startEdit(index) {
  const t = transactions[index];
  const list = document.getElementById('transaction-history');
  const item = list.querySelector(`.btn-edit[data-index="${index}"]`)?.closest('.transaction-item');
  if (!item) return;

  const info = item.querySelector('.transaction-info');
  const amountSpan = item.querySelector('.transaction-amount');
  const actions = item.querySelector('.transaction-actions');

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = t.name;
  nameInput.className = 'edit-input';
  nameInput.style.cssText = 'width:100%;padding:6px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:0.95rem;';

  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.value = Math.abs(t.amount).toFixed(2);
  amountInput.step = '0.01';
  amountInput.className = 'edit-input';
  amountInput.style.cssText = 'width:80px;padding:6px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:0.95rem;text-align:right;';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn-icon';
  saveBtn.textContent = '💾';
  saveBtn.title = 'Save';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn-icon';
  cancelBtn.textContent = '❌';
  cancelBtn.title = 'Cancel';

  info.innerHTML = '';
  info.appendChild(nameInput);
  amountSpan.textContent = '';
  amountSpan.appendChild(amountInput);
  actions.innerHTML = '';
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);

  nameInput.focus();

  function save() {
    const newName = nameInput.value.trim();
    const rawAmount = parseFloat(amountInput.value);
    if (!newName || isNaN(rawAmount) || rawAmount <= 0) return;
    t.name = newName;
    t.amount = t.amount < 0 ? -rawAmount : rawAmount;
    saveToStorage();
    updateUI();
    showToast('✏️ Transaction updated', 'success');
  }

  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', () => updateUI());
  amountInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') amountInput.focus(); });
}

function clearAll() {
  if (transactions.length === 0) return;
  if (!confirm('🗑️ Clear all transactions? This cannot be undone.')) return;
  transactions = [];
  saveToStorage();
  updateUI();
  showToast('📭 All cleared', 'info');
}

function setFilter(filter) {
  currentFilter = filter;
  updateUI();
}

function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = '';
  toast.appendChild(document.createTextNode(message));
  toast.className = `toast ${type} show`;
  clearTimeout(toast._tid);
  toast._tid = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

document.getElementById('transaction-form').addEventListener('submit', addTransaction);
document.getElementById('clear-all').addEventListener('click', clearAll);

document.querySelectorAll('.btn-filter').forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

document.getElementById('transaction-history').addEventListener('click', (e) => {
  const editBtn = e.target.closest('.btn-edit');
  const delBtn = e.target.closest('.btn-delete');
  if (editBtn) {
    const index = parseInt(editBtn.dataset.index, 10);
    if (!isNaN(index)) startEdit(index);
  }
  if (delBtn) {
    const index = parseInt(delBtn.dataset.index, 10);
    if (!isNaN(index)) deleteTransaction(index);
  }
});

loadFromStorage();
updateUI();
