/**
 * DevPulse - API Monitoring Dashboard Frontend Application
 * Production-grade Developer Platform Architecture
 */

// Application State
const state = {
  stats: [],
  metrics: null,
  settings: {
    pingIntervalMs: 10000,
    latencyThresholdMs: 500,
    historyLimit: 50,
  },
  autoRefresh: true,
  refreshIntervalSeconds: 5,
  countdown: 5,
  filterStatus: 'all',
  searchQuery: '',
  pingingIds: new Set(),
  isPingingAll: false,
  countdownId: null,
  browserNotifications: false,
  previousStatusMap: new Map(),
  incidents: [],
  editingEndpointId: null,
  deletingEndpoint: null,
  currentInspectCurl: '',
};

// Cached DOM Elements
const elements = {
  // Metric Cards
  metricHealthValue: document.getElementById('metric-health-value'),
  metricHealthBadge: document.getElementById('metric-health-badge'),
  metricHealthBar: document.getElementById('metric-health-bar'),
  metricLatencyValue: document.getElementById('metric-latency-value'),
  metricLatencyTier: document.getElementById('metric-latency-tier'),
  metricLatencyBar: document.getElementById('metric-latency-bar'),
  metricEndpointsValue: document.getElementById('metric-endpoints-value'),
  metricEndpointsSubtext: document.getElementById('metric-endpoints-subtext'),
  metricIncidentsValue: document.getElementById('metric-incidents-value'),
  metricIncidentsBadge: document.getElementById('metric-incidents-badge'),
  metricIncidentsIcon: document.getElementById('metric-incidents-icon'),
  metricIncidentsSubtext: document.getElementById('metric-incidents-subtext'),
  metricIncidentsBar: document.getElementById('metric-incidents-bar'),

  // Table & Toolbar
  tableBody: document.getElementById('endpoints-table-body'),
  tableSummaryText: document.getElementById('table-summary-text'),
  tableSettingsSummary: document.getElementById('table-settings-summary'),
  searchInput: document.getElementById('search-input'),
  filterPills: document.querySelectorAll('.filter-pill'),

  // Navbar Controls
  autoRefreshToggle: document.getElementById('auto-refresh-toggle'),
  countdownBadge: document.getElementById('countdown-badge'),
  systemPulseBadge: document.getElementById('system-pulse-badge'),
  systemPulseText: document.getElementById('system-pulse-text'),
  btnPingAll: document.getElementById('btn-ping-all'),
  iconPingAll: document.getElementById('icon-ping-all'),
  btnOpenAddModal: document.getElementById('btn-open-add-modal'),
  btnOpenSettings: document.getElementById('btn-open-settings'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  btnOpenIncidents: document.getElementById('btn-open-incidents'),
  navIncidentsBadge: document.getElementById('nav-incidents-badge'),

  // Export / Import
  btnExportJson: document.getElementById('btn-export-json'),
  btnTriggerImport: document.getElementById('btn-trigger-import'),
  importFileInput: document.getElementById('import-file-input'),

  // Target Modal (Add / Edit)
  addModal: document.getElementById('add-modal'),
  modalTargetTitle: document.getElementById('modal-target-title'),
  presetsSection: document.getElementById('presets-section'),
  btnCloseAddModal: document.getElementById('btn-close-add-modal'),
  btnCancelAdd: document.getElementById('btn-cancel-add'),
  addForm: document.getElementById('add-endpoint-form'),
  inputEditId: document.getElementById('input-edit-id'),
  inputName: document.getElementById('input-name'),
  inputUrl: document.getElementById('input-url'),
  inputMethod: document.getElementById('input-method'),
  inputStatus: document.getElementById('input-status'),
  inputTimeout: document.getElementById('input-timeout'),
  inputTags: document.getElementById('input-tags'),
  assertionsContainer: document.getElementById('assertions-container'),
  assertionsEmptyHint: document.getElementById('assertions-empty-hint'),
  btnAddAssertionRow: document.getElementById('btn-add-assertion-row'),
  presetButtons: document.querySelectorAll('.preset-btn'),

  // Settings Modal
  settingsModal: document.getElementById('settings-modal'),
  btnCloseSettingsModal: document.getElementById('btn-close-settings-modal'),
  btnCancelSettings: document.getElementById('btn-cancel-settings'),
  settingsForm: document.getElementById('settings-form'),
  settingRefreshInterval: document.getElementById('setting-refresh-interval'),
  settingPingInterval: document.getElementById('setting-ping-interval'),
  settingLatencyThreshold: document.getElementById('setting-latency-threshold'),
  settingBrowserNotifications: document.getElementById('setting-browser-notifications'),

  // Incidents Modal
  incidentsModal: document.getElementById('incidents-modal'),
  btnCloseIncidentsModal: document.getElementById('btn-close-incidents-modal'),
  btnDismissIncidents: document.getElementById('btn-dismiss-incidents'),
  incidentsList: document.getElementById('incidents-list'),

  // History Modal
  historyModal: document.getElementById('history-modal'),
  historyModalTitle: document.getElementById('history-modal-title'),
  historyModalSubtitle: document.getElementById('history-modal-subtitle'),
  historyAvgLatency: document.getElementById('history-avg-latency'),
  historyChartBars: document.getElementById('history-chart-bars'),
  historyLogsList: document.getElementById('history-logs-list'),
  btnCloseHistoryModal: document.getElementById('btn-close-history-modal'),
  btnDismissHistory: document.getElementById('btn-dismiss-history'),

  // Diagnostics Inspector Modal
  inspectModal: document.getElementById('inspect-modal'),
  inspectModalTitle: document.getElementById('inspect-modal-title'),
  inspectModalSubtitle: document.getElementById('inspect-modal-subtitle'),
  inspectRootCauseBanner: document.getElementById('inspect-root-cause-banner'),
  inspectHttpStatus: document.getElementById('inspect-http-status'),
  inspectTotalLatency: document.getElementById('inspect-total-latency'),
  inspectTaxonomy: document.getElementById('inspect-taxonomy'),
  inspectClassification: document.getElementById('inspect-classification'),
  inspectTtfbBadge: document.getElementById('inspect-ttfb-badge'),
  inspectBarDns: document.getElementById('inspect-bar-dns'),
  inspectBarTcp: document.getElementById('inspect-bar-tcp'),
  inspectBarTtfb: document.getElementById('inspect-bar-ttfb'),
  inspectTimeDns: document.getElementById('inspect-time-dns'),
  inspectTimeTcp: document.getElementById('inspect-time-tcp'),
  inspectTimeTtfb: document.getElementById('inspect-time-ttfb'),
  inspectTimeTotal: document.getElementById('inspect-time-total'),
  inspectAssertionsCount: document.getElementById('inspect-assertions-count'),
  inspectAssertionsList: document.getElementById('inspect-assertions-list'),
  btnCopyCurl: document.getElementById('btn-copy-curl'),
  btnCopyCurlText: document.getElementById('btn-copy-curl-text'),
  inspectCurlCommand: document.getElementById('inspect-curl-command'),
  inspectContentType: document.getElementById('inspect-content-type'),
  inspectResponseBody: document.getElementById('inspect-response-body'),
  btnCloseInspectModal: document.getElementById('btn-close-inspect-modal'),
  btnDismissInspect: document.getElementById('btn-dismiss-inspect'),

  // Delete Confirmation Modal
  deleteModal: document.getElementById('delete-modal'),
  deleteTargetName: document.getElementById('delete-target-name'),
  btnCancelDelete: document.getElementById('btn-cancel-delete'),
  btnConfirmDelete: document.getElementById('btn-confirm-delete'),

  // Toasts
  toastContainer: document.getElementById('toast-container'),
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadLocalPreferences();
  setupEventListeners();
  fetchSettings();
  fetchStats();
  fetchIncidents();
  startAutoRefresh();
});

// Load preferences from localStorage
function loadLocalPreferences() {
  const savedRefresh = localStorage.getItem('devpulse_refresh_interval');
  if (savedRefresh !== null) {
    state.refreshIntervalSeconds = parseInt(savedRefresh, 10);
    if (elements.settingRefreshInterval) elements.settingRefreshInterval.value = savedRefresh;
    if (state.refreshIntervalSeconds === 0) {
      state.autoRefresh = false;
      if (elements.autoRefreshToggle) elements.autoRefreshToggle.checked = false;
    }
  }

  const savedNotifications = localStorage.getItem('devpulse_browser_notifications');
  if (savedNotifications === 'true') {
    state.browserNotifications = true;
    if (elements.settingBrowserNotifications) elements.settingBrowserNotifications.checked = true;
  }
}

// Theme Toggle Functionality
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('devpulse_theme', isDark ? 'dark' : 'light');
}

// Close All Active Modals
function closeAllModals() {
  elements.addModal?.classList.add('hidden');
  elements.settingsModal?.classList.add('hidden');
  elements.incidentsModal?.classList.add('hidden');
  elements.historyModal?.classList.add('hidden');
  elements.inspectModal?.classList.add('hidden');
  elements.deleteModal?.classList.add('hidden');
}

// Event Listeners Setup
function setupEventListeners() {
  // Theme Toggle Button
  elements.btnThemeToggle?.addEventListener('click', toggleTheme);

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Esc key closes any open modal
    if (e.key === 'Escape') {
      closeAllModals();
    }
    // '/' key focuses search if not currently inside an input/textarea
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      elements.searchInput?.focus();
      elements.searchInput?.select();
    }
  });

  // Auto-refresh toggle
  elements.autoRefreshToggle?.addEventListener('change', (e) => {
    state.autoRefresh = e.target.checked;
    if (state.autoRefresh) {
      if (state.refreshIntervalSeconds === 0) {
        state.refreshIntervalSeconds = 5;
        if (elements.settingRefreshInterval) elements.settingRefreshInterval.value = '5';
      }
      startAutoRefresh();
      showToast('Live Polling Active', `Metrics update every ${state.refreshIntervalSeconds}s.`, 'info');
    } else {
      stopAutoRefresh();
      if (elements.countdownBadge) {
        elements.countdownBadge.textContent = 'Paused';
        elements.countdownBadge.className = 'font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1 py-0.2 rounded border border-slate-200 dark:border-white/[0.08]';
      }
      showToast('Polling Suspended', 'Real-time dashboard updates are paused.', 'info');
    }
  });

  // Ping Fleet button
  elements.btnPingAll?.addEventListener('click', handlePingAll);

  // Search input
  elements.searchInput?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    renderTable();
  });

  // Filter pills
  elements.filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      elements.filterPills.forEach((p) => {
        p.className = 'filter-pill px-2.5 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors';
      });
      pill.className = 'filter-pill px-2.5 py-1 rounded text-xs font-medium bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs transition-colors';
      state.filterStatus = pill.getAttribute('data-filter') || 'all';
      renderTable();
    });
  });

  // Add Assertion Row Button
  elements.btnAddAssertionRow?.addEventListener('click', () => {
    addAssertionRow();
  });

  // Add / Edit Modal
  elements.btnOpenAddModal?.addEventListener('click', openAddModal);
  elements.btnCloseAddModal?.addEventListener('click', closeAddModal);
  elements.btnCancelAdd?.addEventListener('click', closeAddModal);
  elements.addModal?.addEventListener('click', (e) => {
    if (e.target === elements.addModal) closeAddModal();
  });
  elements.addForm?.addEventListener('submit', handleSaveTargetForm);

  // Preset Buttons
  elements.presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      applyPreset(preset);
    });
  });

  // Diagnostics Inspector Modal
  elements.btnCloseInspectModal?.addEventListener('click', closeInspectModal);
  elements.btnDismissInspect?.addEventListener('click', closeInspectModal);
  elements.inspectModal?.addEventListener('click', (e) => {
    if (e.target === elements.inspectModal) closeInspectModal();
  });
  elements.btnCopyCurl?.addEventListener('click', handleCopyCurl);

  // Settings Modal
  elements.btnOpenSettings?.addEventListener('click', openSettingsModal);
  elements.btnCloseSettingsModal?.addEventListener('click', closeSettingsModal);
  elements.btnCancelSettings?.addEventListener('click', closeSettingsModal);
  elements.settingsModal?.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) closeSettingsModal();
  });
  elements.settingsForm?.addEventListener('submit', handleSaveSettings);

  // Incidents Modal
  elements.btnOpenIncidents?.addEventListener('click', openIncidentsModal);
  elements.btnCloseIncidentsModal?.addEventListener('click', closeIncidentsModal);
  elements.btnDismissIncidents?.addEventListener('click', closeIncidentsModal);
  elements.incidentsModal?.addEventListener('click', (e) => {
    if (e.target === elements.incidentsModal) closeIncidentsModal();
  });

  // Delete Modal
  elements.btnCancelDelete?.addEventListener('click', () => {
    elements.deleteModal?.classList.add('hidden');
    state.deletingEndpoint = null;
  });
  elements.deleteModal?.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) {
      elements.deleteModal.classList.add('hidden');
      state.deletingEndpoint = null;
    }
  });
  elements.btnConfirmDelete?.addEventListener('click', executeDeleteEndpoint);

  // Export / Import
  elements.btnExportJson?.addEventListener('click', handleExportJson);
  elements.btnTriggerImport?.addEventListener('click', () => elements.importFileInput?.click());
  elements.importFileInput?.addEventListener('change', handleImportJson);

  // History Modal
  elements.btnCloseHistoryModal?.addEventListener('click', closeHistoryModal);
  elements.btnDismissHistory?.addEventListener('click', closeHistoryModal);
  elements.historyModal?.addEventListener('click', (e) => {
    if (e.target === elements.historyModal) closeHistoryModal();
  });
}

// Dynamic Assertion Management
const ASSERTION_METADATA = {
  not_contains: {
    placeholderVal: 'Forbidden substring (e.g. ERR_DB_TIMEOUT)',
    placeholderProp: '',
    hint: 'Fails silently if the response body contains this forbidden string.',
  },
  contains: {
    placeholderVal: 'Required substring (e.g. "status":"ok")',
    placeholderProp: '',
    hint: 'Fails if the response body does not include this required string.',
  },
  json_key_value: {
    placeholderVal: 'Expected value (e.g. ok, true, 200)',
    placeholderProp: 'Key or path (e.g. status or data.id)',
    hint: 'Strictly evaluates a JSON property against the expected value.',
  },
  regex: {
    placeholderVal: 'Regex pattern (e.g. ^[0-9a-f]{8})',
    placeholderProp: '',
    hint: 'Validates entire response text against regular expression.',
  },
};

function updateAssertionRowUI(row, selectedType) {
  const meta = ASSERTION_METADATA[selectedType] || ASSERTION_METADATA.not_contains;
  const propContainer = row.querySelector('.assertion-prop-container');
  const propInput = row.querySelector('.assertion-prop');
  const valInput = row.querySelector('.assertion-val');
  const hintText = row.querySelector('.assertion-hint-text');

  if (selectedType === 'json_key_value') {
    propContainer?.classList.remove('hidden');
    if (propInput) propInput.placeholder = meta.placeholderProp;
  } else {
    propContainer?.classList.add('hidden');
  }

  if (valInput) valInput.placeholder = meta.placeholderVal;
  if (hintText) hintText.textContent = meta.hint;
}

function addAssertionRow(type = 'not_contains', property = '', expectedValue = '') {
  if (!elements.assertionsContainer) return;

  if (elements.assertionsEmptyHint) {
    elements.assertionsEmptyHint.classList.add('hidden');
  }

  const meta = ASSERTION_METADATA[type] || ASSERTION_METADATA.not_contains;
  const isJsonKeyVal = type === 'json_key_value';

  const row = document.createElement('div');
  row.className = 'assertion-row p-2 rounded bg-slate-100/80 dark:bg-[#0c0e14] border border-slate-200 dark:border-white/[0.08] space-y-1 transition-all';

  row.innerHTML = `
    <div class="flex flex-wrap sm:flex-nowrap items-center gap-1.5">
      <div class="w-full sm:w-auto min-w-[140px]">
        <select class="assertion-type w-full bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/[0.1] rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500">
          <option value="not_contains" ${type === 'not_contains' ? 'selected' : ''}>Must NOT Contain</option>
          <option value="contains" ${type === 'contains' ? 'selected' : ''}>Must Contain</option>
          <option value="json_key_value" ${type === 'json_key_value' ? 'selected' : ''}>JSON Key Equals</option>
          <option value="regex" ${type === 'regex' ? 'selected' : ''}>Regex Pattern</option>
        </select>
      </div>
      <div class="assertion-prop-container flex-1 min-w-[120px] ${isJsonKeyVal ? '' : 'hidden'}">
        <input type="text" class="assertion-prop w-full bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/[0.1] rounded px-2 py-1 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-600" placeholder="${meta.placeholderProp}" value="${escapeHtml(property || '')}" />
      </div>
      <div class="assertion-val-container flex-1 min-w-[130px]">
        <input type="text" class="assertion-val w-full bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/[0.1] rounded px-2 py-1 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-600" placeholder="${meta.placeholderVal}" value="${escapeHtml(expectedValue || '')}" />
      </div>
      <button type="button" class="btn-remove-assertion text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-rose-500/10 transition-colors" title="Remove Rule">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
    <div class="assertion-hint text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pl-0.5">
      <span class="w-1 h-1 rounded-full bg-purple-500 inline-block"></span>
      <span class="assertion-hint-text">${meta.hint}</span>
    </div>
  `;

  const typeSelect = row.querySelector('.assertion-type');
  const removeBtn = row.querySelector('.btn-remove-assertion');

  typeSelect?.addEventListener('change', () => {
    updateAssertionRowUI(row, typeSelect.value);
  });

  removeBtn?.addEventListener('click', () => {
    row.remove();
    if (elements.assertionsContainer.querySelectorAll('.assertion-row').length === 0) {
      elements.assertionsEmptyHint?.classList.remove('hidden');
    }
  });

  elements.assertionsContainer.appendChild(row);
}

function clearAssertionRows() {
  if (elements.assertionsContainer) {
    elements.assertionsContainer.innerHTML = '';
  }
  elements.assertionsEmptyHint?.classList.remove('hidden');
}

function collectAssertions() {
  const assertions = [];
  if (!elements.assertionsContainer) return assertions;

  const rows = elements.assertionsContainer.querySelectorAll('.assertion-row');
  rows.forEach((row) => {
    const type = row.querySelector('.assertion-type')?.value;
    const property = row.querySelector('.assertion-prop')?.value.trim() || undefined;
    const expectedValue = row.querySelector('.assertion-val')?.value.trim() || '';

    if (type && expectedValue) {
      assertions.push({
        type,
        ...(type === 'json_key_value' && property ? { property } : {}),
        expectedValue,
      });
    }
  });

  return assertions;
}

// Quick Preset Handlers
function applyPreset(preset) {
  const origin = window.location.origin;
  switch (preset) {
    case 'fast':
      elements.inputName.value = 'Fast Mock Probe';
      elements.inputUrl.value = `${origin}/api/mock/fast`;
      elements.inputMethod.value = 'GET';
      elements.inputStatus.value = '200';
      elements.inputTimeout.value = '3000';
      elements.inputTags.value = 'mock, fast';
      clearAssertionRows();
      break;
    case 'slow':
      elements.inputName.value = 'Slow Latency Probe';
      elements.inputUrl.value = `${origin}/api/mock/slow`;
      elements.inputMethod.value = 'GET';
      elements.inputStatus.value = '200';
      elements.inputTimeout.value = '3000';
      elements.inputTags.value = 'mock, latency';
      clearAssertionRows();
      break;
    case 'flaky':
      elements.inputName.value = 'Flaky Service Target';
      elements.inputUrl.value = `${origin}/api/mock/flaky`;
      elements.inputMethod.value = 'GET';
      elements.inputStatus.value = '200';
      elements.inputTimeout.value = '3000';
      elements.inputTags.value = 'mock, flaky';
      clearAssertionRows();
      break;
    case 'error':
      elements.inputName.value = 'Error Server Target';
      elements.inputUrl.value = `${origin}/api/mock/error`;
      elements.inputMethod.value = 'GET';
      elements.inputStatus.value = '200';
      elements.inputTimeout.value = '3000';
      elements.inputTags.value = 'mock, error';
      clearAssertionRows();
      break;
    case 'corrupted':
      elements.inputName.value = 'Corrupted API (Silent Failure)';
      elements.inputUrl.value = `${origin}/api/mock/corrupted`;
      elements.inputMethod.value = 'GET';
      elements.inputStatus.value = '200';
      elements.inputTimeout.value = '3000';
      elements.inputTags.value = 'mock, silent-failure';
      clearAssertionRows();
      addAssertionRow('not_contains', '', 'ERR_DB_DISCONNECTED');
      addAssertionRow('json_key_value', 'status', 'ok');
      break;
  }
}

// Fetch Settings from Backend
async function fetchSettings() {
  try {
    const res = await fetch('/api/monitoring/settings');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.success && data.data) {
      state.settings = data.data;
      if (elements.settingPingInterval) elements.settingPingInterval.value = data.data.pingIntervalMs.toString();
      if (elements.settingLatencyThreshold) elements.settingLatencyThreshold.value = data.data.latencyThresholdMs.toString();
      updateSettingsSummaryUI();
    }
  } catch (err) {
    console.error('Failed to fetch settings:', err);
  }
}

function updateSettingsSummaryUI() {
  const pingSec = Math.round(state.settings.pingIntervalMs / 1000);
  if (elements.tableSettingsSummary) {
    elements.tableSettingsSummary.textContent = `Ping: ${pingSec}s • Alert Threshold: ${state.settings.latencyThresholdMs}ms`;
  }
}

// Fetch Stats from Backend
async function fetchStats() {
  try {
    const res = await fetch('/api/monitoring/stats');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    
    if (data.success && Array.isArray(data.data)) {
      checkStatusTransitions(data.data);
      state.stats = data.data;
      state.metrics = data.metrics || null;
      renderMetrics(data.metrics);
      renderTable();
      updatePulseBadge(data.isMonitoringRunning);
    }
  } catch (err) {
    console.error('Failed to fetch monitoring stats:', err);
  }
}

// Fetch Incidents from Backend
async function fetchIncidents() {
  try {
    const res = await fetch('/api/monitoring/incidents?limit=50');
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      state.incidents = data.data;
    }
  } catch (err) {
    console.error('Failed to fetch incidents:', err);
  }
}

// Browser Alert Notifications
function checkStatusTransitions(newStats) {
  if (!state.browserNotifications || Notification.permission !== 'granted') return;

  for (const stat of newStats) {
    const epId = stat.endpoint.id;
    const prevStatus = state.previousStatusMap.get(epId);

    if (prevStatus && prevStatus !== stat.status) {
      if (stat.status === 'down') {
        new Notification(`DevPulse Alert: ${stat.endpoint.name} is DOWN`, {
          body: `Code: ${stat.lastPing?.statusCode || 'Unreachable'} | Latency: ${stat.lastPing?.latencyMs || 0}ms`,
        });
      } else if (stat.status === 'corrupted') {
        new Notification(`DevPulse Alert: Silent Failure on ${stat.endpoint.name}`, {
          body: `Payload assertion failed despite HTTP ${stat.lastPing?.statusCode || 200}`,
        });
      } else if (stat.status === 'degraded' && prevStatus === 'healthy') {
        new Notification(`DevPulse Warning: High Latency on ${stat.endpoint.name}`, {
          body: `Latency: ${stat.averageLatencyMs}ms exceeds ${state.settings.latencyThresholdMs}ms threshold`,
        });
      }
    }

    state.previousStatusMap.set(epId, stat.status);
  }
}

// Update Active Engine Badge
function updatePulseBadge(isRunning) {
  if (!elements.systemPulseBadge || !elements.systemPulseText) return;
  if (isRunning) {
    elements.systemPulseBadge.className = 'hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20';
    elements.systemPulseText.textContent = 'Engine Online';
  } else {
    elements.systemPulseBadge.className = 'hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20';
    elements.systemPulseText.textContent = 'Engine Paused';
  }
}

// Render Metric Cards
function renderMetrics(metrics) {
  const allStats = state.stats;
  const total = allStats.length;
  const activeStats = allStats.filter((s) => s.endpoint.isActive);
  const activeCount = activeStats.length;
  const pausedCount = total - activeCount;

  // Monitored Endpoints Card
  if (elements.metricEndpointsValue) elements.metricEndpointsValue.textContent = total.toString();
  if (elements.metricEndpointsSubtext) elements.metricEndpointsSubtext.textContent = `${activeCount} active • ${pausedCount} paused`;

  if (activeCount === 0) {
    // Neutral paused state
    if (elements.metricHealthValue) elements.metricHealthValue.textContent = '—';
    if (elements.metricHealthBadge) {
      elements.metricHealthBadge.textContent = 'Paused';
      elements.metricHealthBadge.className = 'font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10';
    }
    if (elements.metricHealthBar) elements.metricHealthBar.style.width = '0%';

    if (elements.metricLatencyValue) elements.metricLatencyValue.textContent = '— ms';
    if (elements.metricLatencyTier) {
      elements.metricLatencyTier.textContent = 'Paused';
      elements.metricLatencyTier.className = 'font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10';
    }
    if (elements.metricLatencyBar) elements.metricLatencyBar.style.width = '0%';

    if (elements.metricIncidentsValue) elements.metricIncidentsValue.textContent = '0';
    if (elements.metricIncidentsBadge) {
      elements.metricIncidentsBadge.textContent = 'Paused';
      elements.metricIncidentsBadge.className = 'font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10';
    }
    if (elements.metricIncidentsSubtext) elements.metricIncidentsSubtext.textContent = 'All monitored targets paused';
    if (elements.metricIncidentsBar) elements.metricIncidentsBar.style.width = '0%';
    if (elements.navIncidentsBadge) elements.navIncidentsBadge.classList.add('hidden');
    return;
  }

  // Use backend calculated metrics when available, or fall back to client
  const healthPercent = metrics && metrics.overallHealthPercentage !== null
    ? metrics.overallHealthPercentage
    : Math.round((activeStats.filter((s) => s.status === 'healthy').length / activeCount) * 100);

  if (elements.metricHealthValue) elements.metricHealthValue.textContent = `${healthPercent}%`;
  if (elements.metricHealthBar) elements.metricHealthBar.style.width = `${healthPercent}%`;

  if (elements.metricHealthBadge) {
    if (healthPercent >= 90) {
      elements.metricHealthBadge.textContent = 'Optimal';
      elements.metricHealthBadge.className = 'font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    } else if (healthPercent >= 60) {
      elements.metricHealthBadge.textContent = 'Degraded';
      elements.metricHealthBadge.className = 'font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    } else {
      elements.metricHealthBadge.textContent = 'Critical';
      elements.metricHealthBadge.className = 'font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
  }

  // Mean Latency
  const validLatencies = activeStats.map((s) => s.averageLatencyMs).filter((l) => l > 0);
  const avgLatency = metrics?.averageLatencyMs !== undefined
    ? metrics.averageLatencyMs
    : (validLatencies.length > 0 ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) : 0);

  if (elements.metricLatencyValue) elements.metricLatencyValue.textContent = `${avgLatency} ms`;
  const latencyWidth = Math.min(100, Math.round((avgLatency / 800) * 100));
  if (elements.metricLatencyBar) elements.metricLatencyBar.style.width = `${latencyWidth}%`;

  if (elements.metricLatencyTier) {
    if (avgLatency <= 100) {
      elements.metricLatencyTier.textContent = 'Fast';
      elements.metricLatencyTier.className = 'font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    } else if (avgLatency <= 400) {
      elements.metricLatencyTier.textContent = 'Moderate';
      elements.metricLatencyTier.className = 'font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    } else {
      elements.metricLatencyTier.textContent = 'High';
      elements.metricLatencyTier.className = 'font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  }

  // Active Incidents
  const activeIncidents = activeStats.filter((s) => s.status === 'down' || s.status === 'degraded' || s.status === 'corrupted');
  const incidentsCount = metrics?.activeIncidentsCount !== undefined ? metrics.activeIncidentsCount : activeIncidents.length;

  if (elements.metricIncidentsValue) elements.metricIncidentsValue.textContent = incidentsCount.toString();

  // Synchronize Navbar badge
  if (elements.navIncidentsBadge) {
    if (incidentsCount > 0) {
      elements.navIncidentsBadge.textContent = incidentsCount.toString();
      elements.navIncidentsBadge.classList.remove('hidden');
    } else {
      elements.navIncidentsBadge.textContent = '0';
      elements.navIncidentsBadge.classList.add('hidden');
    }
  }

  if (incidentsCount === 0) {
    if (elements.metricIncidentsBadge) {
      elements.metricIncidentsBadge.textContent = 'Operational';
      elements.metricIncidentsBadge.className = 'font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (elements.metricIncidentsIcon) {
      elements.metricIncidentsIcon.className = 'w-5 h-5 rounded flex items-center justify-center bg-emerald-500/10 text-emerald-500';
      elements.metricIncidentsIcon.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
    }
    if (elements.metricIncidentsSubtext) elements.metricIncidentsSubtext.textContent = 'All active endpoints operational';
    if (elements.metricIncidentsBar) elements.metricIncidentsBar.className = 'bg-emerald-500 h-1 rounded-full transition-all duration-300';
  } else {
    if (elements.metricIncidentsBadge) {
      elements.metricIncidentsBadge.textContent = `${incidentsCount} Alert${incidentsCount > 1 ? 's' : ''}`;
      elements.metricIncidentsBadge.className = 'font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
    if (elements.metricIncidentsIcon) {
      elements.metricIncidentsIcon.className = 'w-5 h-5 rounded flex items-center justify-center bg-rose-500/10 text-rose-500';
      elements.metricIncidentsIcon.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
    }
    if (elements.metricIncidentsSubtext) elements.metricIncidentsSubtext.textContent = 'Active outages, degradations or silent failures';
    if (elements.metricIncidentsBar) elements.metricIncidentsBar.className = 'bg-rose-500 h-1 rounded-full transition-all duration-300';
  }
}

// Render Endpoints Table
function renderTable() {
  if (!elements.tableBody) return;

  const filtered = state.stats.filter((stat) => {
    // Filter status
    if (state.filterStatus === 'paused') {
      if (stat.endpoint.isActive !== false) return false;
    } else if (state.filterStatus !== 'all' && stat.status !== state.filterStatus) {
      return false;
    }
    // Search query
    if (state.searchQuery) {
      const nameMatch = stat.endpoint.name.toLowerCase().includes(state.searchQuery);
      const urlMatch = stat.endpoint.url.toLowerCase().includes(state.searchQuery);
      const tagsMatch = stat.endpoint.tags?.some((t) => t.toLowerCase().includes(state.searchQuery));
      return nameMatch || urlMatch || tagsMatch;
    }
    return true;
  });

  if (elements.tableSummaryText) {
    elements.tableSummaryText.textContent = `Showing ${filtered.length} of ${state.stats.length} endpoints`;
  }

  if (filtered.length === 0) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-slate-400 dark:text-slate-500">
          <svg class="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-xs font-mono">No matching endpoints found</p>
        </td>
      </tr>
    `;
    return;
  }

  elements.tableBody.innerHTML = filtered.map((stat) => {
    const ep = stat.endpoint;
    const isPinging = state.pingingIds.has(ep.id);
    const isPaused = !ep.isActive;
    
    // Status Badge
    let statusBadgeHtml = '';
    if (isPaused) {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Paused
        </span>
      `;
    } else if (stat.status === 'healthy') {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Healthy
        </span>
      `;
    } else if (stat.status === 'degraded') {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Degraded
        </span>
      `;
    } else if (stat.status === 'corrupted') {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Silent Failure
        </span>
      `;
    } else if (stat.status === 'down') {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Outage
        </span>
      `;
    } else {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Pending
        </span>
      `;
    }

    // Method badge colors
    const methodColors = {
      GET: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
      POST: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      PUT: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      DELETE: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      PATCH: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
      HEAD: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
    };
    const methodClass = methodColors[ep.method] || 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20';

    // Latency
    const lastLatency = stat.lastPing ? `${stat.lastPing.latencyMs} ms` : '--';
    const latencyColor = !stat.lastPing 
      ? 'text-slate-400 dark:text-slate-500' 
      : stat.lastPing.latencyMs < 200 
      ? 'text-emerald-600 dark:text-emerald-400' 
      : stat.lastPing.latencyMs < state.settings.latencyThresholdMs 
      ? 'text-slate-700 dark:text-slate-300' 
      : 'text-amber-600 dark:text-amber-400';

    // Last Checked
    const lastChecked = stat.lastPing ? formatRelativeTime(stat.lastPing.timestamp) : 'Never';

    // Tags
    const tagsHtml = ep.tags && ep.tags.length > 0 
      ? ep.tags.map((t) => `<span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400">${escapeHtml(t)}</span>`).join(' ') 
      : '';

    const rowClass = isPaused 
      ? 'opacity-60 bg-slate-50/50 dark:bg-zinc-950/40' 
      : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/30';

    return `
      <tr class="${rowClass} transition-colors group">
        <!-- Target Name -->
        <td class="py-2.5 px-4">
          <div class="flex items-center gap-1.5">
            <span class="font-medium text-slate-900 dark:text-white">${escapeHtml(ep.name)}</span>
            ${isPaused ? `<span class="text-[9px] font-mono font-medium px-1 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">PAUSED</span>` : ''}
          </div>
          <div class="flex items-center gap-1 mt-0.5">${tagsHtml}</div>
        </td>

        <!-- Method & URL -->
        <td class="py-2.5 px-4 font-mono text-xs">
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.2 rounded border text-[10px] font-semibold ${methodClass}">${ep.method}</span>
            <span class="text-slate-600 dark:text-slate-400 truncate-cell font-mono text-[11px]" title="${escapeHtml(ep.url)}">${escapeHtml(ep.url)}</span>
          </div>
        </td>

        <!-- Status -->
        <td class="py-2.5 px-4">
          ${statusBadgeHtml}
        </td>

        <!-- Latency -->
        <td class="py-2.5 px-4 font-mono text-xs font-semibold ${latencyColor}">
          ${lastLatency}
        </td>

        <!-- Uptime / Availability -->
        <td class="py-2.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
          <div class="flex items-center gap-1.5">
            <span>${stat.uptimePercentage}%</span>
            <div class="w-12 bg-slate-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div class="h-1 rounded-full ${stat.uptimePercentage >= 90 ? 'bg-emerald-500' : stat.uptimePercentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'}" style="width: ${stat.uptimePercentage}%"></div>
            </div>
          </div>
        </td>

        <!-- Last Checked -->
        <td class="py-2.5 px-4 text-xs font-mono text-slate-400 dark:text-slate-500">
          ${lastChecked}
        </td>

        <!-- Actions -->
        <td class="py-2.5 px-4 text-right">
          <div class="inline-flex items-center gap-1">
            
            <!-- Inspect Diagnostics -->
            <button onclick="handleInspectEndpoint('${ep.id}', '${escapeHtml(ep.name)}')" title="Inspect Root Cause Diagnostics" class="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </button>

            <!-- Edit Target -->
            <button onclick="handleEditEndpoint('${ep.id}')" title="Edit Target Configuration" class="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <!-- Pause / Resume Toggle -->
            <button onclick="handleToggleEndpoint('${ep.id}', '${escapeHtml(ep.name)}')" title="${isPaused ? 'Resume automated tracking' : 'Pause automated tracking'}" class="p-1 ${isPaused ? 'text-amber-500 hover:bg-amber-500/10' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'} rounded transition-colors">
              ${isPaused 
                ? `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
                : `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
              }
            </button>

            <!-- Ping Now -->
            <button onclick="handlePingSingle('${ep.id}', '${escapeHtml(ep.name)}')" ${isPinging ? 'disabled' : ''} class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-white/[0.08] rounded transition-colors disabled:opacity-50">
              ${isPinging 
                ? `<svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> <span class="font-mono text-[11px]">Probing...</span>`
                : `<svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> <span class="font-mono text-[11px]">Ping</span>`
              }
            </button>

            <!-- Ping History -->
            <button onclick="handleViewHistory('${ep.id}', '${escapeHtml(ep.name)}', '${escapeHtml(ep.url)}')" title="View Ping History" class="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <!-- Delete -->
            <button onclick="handleDeleteEndpoint('${ep.id}', '${escapeHtml(ep.name)}')" title="Delete Endpoint" class="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Single Endpoint Ping Action
async function handlePingSingle(id, name) {
  if (state.pingingIds.has(id)) return;
  state.pingingIds.add(id);
  renderTable();

  try {
    const res = await fetch(`/api/monitoring/endpoints/${id}/ping`, { method: 'POST' });
    const data = await res.json();

    if (data.success && data.data) {
      const r = data.data;
      const statusDesc = r.statusCode ? `HTTP ${r.statusCode}` : 'Failed';
      const type = r.isHealthy ? 'success' : 'error';
      showToast(`${name}`, `${statusDesc} in ${r.latencyMs}ms`, type);
    } else {
      showToast('Probe Failure', data.error || 'Failed to ping target', 'error');
    }
  } catch (err) {
    showToast('Network Error', err.message, 'error');
  } finally {
    state.pingingIds.delete(id);
    fetchStats();
    fetchIncidents();
  }
}

// Toggle Target Pause / Resume
async function handleToggleEndpoint(id, name) {
  try {
    const res = await fetch(`/api/monitoring/endpoints/${id}/toggle`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) {
      const action = data.data.isActive ? 'resumed' : 'paused';
      showToast(name, `Target tracking ${action}.`, 'info');
      fetchStats();
    }
  } catch (err) {
    showToast('Toggle Error', err.message, 'error');
  }
}

// Ping Fleet Action
async function handlePingAll() {
  if (state.isPingingAll) return;
  state.isPingingAll = true;
  if (elements.btnPingAll) elements.btnPingAll.disabled = true;
  elements.iconPingAll?.classList.add('animate-spin');

  try {
    const res = await fetch('/api/monitoring/ping-all', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Fleet Probe Complete', `Probed ${data.count} active targets.`, 'success');
    }
  } catch (err) {
    showToast('Probe Fleet Error', err.message, 'error');
  } finally {
    state.isPingingAll = false;
    if (elements.btnPingAll) elements.btnPingAll.disabled = false;
    elements.iconPingAll?.classList.remove('animate-spin');
    fetchStats();
    fetchIncidents();
  }
}

// Open Add Target Modal
function openAddModal() {
  state.editingEndpointId = null;
  if (elements.modalTargetTitle) elements.modalTargetTitle.textContent = 'Add Monitored Target';
  if (elements.presetsSection) elements.presetsSection.classList.remove('hidden');
  elements.addForm?.reset();
  if (elements.inputEditId) elements.inputEditId.value = '';
  clearAssertionRows();
  elements.addModal?.classList.remove('hidden');
}

// Open Edit Target Modal
function handleEditEndpoint(id) {
  const stat = state.stats.find((s) => s.endpoint.id === id);
  if (!stat) return;
  const ep = stat.endpoint;

  state.editingEndpointId = id;
  if (elements.modalTargetTitle) elements.modalTargetTitle.textContent = `Edit Target: ${ep.name}`;
  if (elements.presetsSection) elements.presetsSection.classList.add('hidden'); // Hide presets in edit mode

  if (elements.inputEditId) elements.inputEditId.value = id;
  if (elements.inputName) elements.inputName.value = ep.name;
  if (elements.inputUrl) elements.inputUrl.value = ep.url;
  if (elements.inputMethod) elements.inputMethod.value = ep.method;
  if (elements.inputStatus) elements.inputStatus.value = ep.expectedStatus.toString();
  if (elements.inputTimeout) elements.inputTimeout.value = ep.timeoutMs.toString();
  if (elements.inputTags) elements.inputTags.value = (ep.tags || []).join(', ');

  clearAssertionRows();
  if (ep.assertions && Array.isArray(ep.assertions)) {
    ep.assertions.forEach((a) => {
      addAssertionRow(a.type, a.property || '', a.expectedValue);
    });
  }

  elements.addModal?.classList.remove('hidden');
}

function closeAddModal() {
  elements.addModal?.classList.add('hidden');
  state.editingEndpointId = null;
}

// Save Target Form (Handles both Add and Edit)
async function handleSaveTargetForm(e) {
  e.preventDefault();
  const editId = elements.inputEditId?.value || state.editingEndpointId;
  const name = elements.inputName?.value.trim();
  const url = elements.inputUrl?.value.trim();
  const method = elements.inputMethod?.value || 'GET';
  const expectedStatus = parseInt(elements.inputStatus?.value, 10);
  const timeoutMs = parseInt(elements.inputTimeout?.value, 10);
  const tags = (elements.inputTags?.value || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const assertions = collectAssertions();

  const payload = { name, url, method, expectedStatus, timeoutMs, tags, assertions };

  try {
    if (editId) {
      // Edit mode (PUT)
      const res = await fetch(`/api/monitoring/endpoints/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast('Update Failed', data.error || 'Failed to update target', 'error');
        return;
      }
      showToast('Target Updated', `${name} configuration saved.`, 'success');
    } else {
      // Add mode (POST)
      const res = await fetch('/api/monitoring/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 409 || !data.success) {
        showToast('Duplicate Target', data.error || 'Target URL already exists', 'error');
        return;
      }
      showToast('Target Added', `${name} is now monitored.`, 'success');
    }

    closeAddModal();
    fetchStats();
  } catch (err) {
    showToast('Request Error', err.message, 'error');
  }
}

// In-app Delete Confirmation Workflow
function handleDeleteEndpoint(id, name) {
  state.deletingEndpoint = { id, name };
  if (elements.deleteTargetName) {
    elements.deleteTargetName.textContent = name;
  }
  elements.deleteModal?.classList.remove('hidden');
}

async function executeDeleteEndpoint() {
  if (!state.deletingEndpoint) return;
  const { id, name } = state.deletingEndpoint;

  try {
    const res = await fetch(`/api/monitoring/endpoints/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Target Deleted', `"${name}" removed from monitoring.`, 'info');
      fetchStats();
    } else {
      showToast('Delete Error', data.error || 'Failed to delete target', 'error');
    }
  } catch (err) {
    showToast('Delete Error', err.message, 'error');
  } finally {
    elements.deleteModal?.classList.add('hidden');
    state.deletingEndpoint = null;
  }
}

// Export JSON
async function handleExportJson() {
  try {
    const res = await fetch('/api/monitoring/export');
    const data = await res.json();
    if (data.success) {
      const jsonStr = JSON.stringify(data.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devpulse-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Export Ready', 'Configuration downloaded as JSON.', 'success');
    }
  } catch (err) {
    showToast('Export Failed', err.message, 'error');
  }
}

// Import JSON
async function handleImportJson(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const json = JSON.parse(event.target?.result);
      const res = await fetch('/api/monitoring/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      const data = await res.json();
      if (data.success) {
        const skipped = data.skippedDuplicates?.length || 0;
        if (skipped > 0) {
          showToast('Import Finished', `Imported ${data.importedCount} targets (${skipped} duplicate skipped).`, 'info');
        } else {
          showToast('Import Succeeded', `Imported ${data.importedCount} targets.`, 'success');
        }
        fetchStats();
        fetchSettings();
      } else {
        showToast('Import Failed', data.error || 'Invalid file format.', 'error');
      }
    } catch (err) {
      showToast('Import Error', 'Failed to parse JSON file.', 'error');
    } finally {
      if (elements.importFileInput) elements.importFileInput.value = '';
    }
  };
  reader.readAsText(file);
}

// Settings Modal Handlers
function openSettingsModal() {
  elements.settingsModal?.classList.remove('hidden');
}

function closeSettingsModal() {
  elements.settingsModal?.classList.add('hidden');
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const refreshInterval = parseInt(elements.settingRefreshInterval?.value || '5', 10);
  const pingIntervalMs = parseInt(elements.settingPingInterval?.value || '10000', 10);
  const latencyThresholdMs = parseInt(elements.settingLatencyThreshold?.value || '500', 10);
  const enableNotifications = elements.settingBrowserNotifications?.checked;

  if (enableNotifications && 'Notification' in window) {
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        if (elements.settingBrowserNotifications) elements.settingBrowserNotifications.checked = false;
        showToast('Notification Blocked', 'Permission denied by browser.', 'info');
      } else {
        state.browserNotifications = true;
        localStorage.setItem('devpulse_browser_notifications', 'true');
      }
    } else {
      state.browserNotifications = true;
      localStorage.setItem('devpulse_browser_notifications', 'true');
    }
  } else {
    state.browserNotifications = false;
    localStorage.setItem('devpulse_browser_notifications', 'false');
  }

  state.refreshIntervalSeconds = refreshInterval;
  localStorage.setItem('devpulse_refresh_interval', refreshInterval.toString());
  if (refreshInterval === 0) {
    state.autoRefresh = false;
    if (elements.autoRefreshToggle) elements.autoRefreshToggle.checked = false;
    stopAutoRefresh();
  } else {
    state.autoRefresh = true;
    if (elements.autoRefreshToggle) elements.autoRefreshToggle.checked = true;
    startAutoRefresh();
  }

  try {
    const res = await fetch('/api/monitoring/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pingIntervalMs, latencyThresholdMs }),
    });
    const data = await res.json();
    if (data.success) {
      state.settings = data.data;
      updateSettingsSummaryUI();
      showToast('Settings Saved', 'Monitoring configuration updated.', 'success');
      closeSettingsModal();
      fetchStats();
    }
  } catch (err) {
    showToast('Save Error', err.message, 'error');
  }
}

// Incidents Modal Handlers
async function openIncidentsModal() {
  elements.incidentsModal?.classList.remove('hidden');
  if (elements.incidentsList) {
    elements.incidentsList.innerHTML = '<div class="text-xs font-mono text-slate-400 py-6 text-center">Loading incident timeline...</div>';
  }

  try {
    const res = await fetch('/api/monitoring/incidents?limit=50');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      renderIncidents(data.data);
    }
  } catch (err) {
    if (elements.incidentsList) {
      elements.incidentsList.innerHTML = `<div class="text-xs font-mono text-rose-500 py-4 text-center">Error: ${escapeHtml(err.message)}</div>`;
    }
  }
}

function closeIncidentsModal() {
  elements.incidentsModal?.classList.add('hidden');
}

function renderIncidents(incidents) {
  if (!elements.incidentsList) return;

  if (incidents.length === 0) {
    elements.incidentsList.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <svg class="w-6 h-6 mx-auto text-emerald-500 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">No Outages Recorded</p>
        <p class="text-[11px] text-slate-400 mt-0.5 font-mono">100% availability across monitored targets.</p>
      </div>
    `;
    return;
  }

  elements.incidentsList.innerHTML = incidents.map((inc) => {
    let typeBadge = '';
    let borderClass = 'border-slate-200 dark:border-white/[0.08]';

    if (inc.type === 'down') {
      typeBadge = `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">OUTAGE</span>`;
      borderClass = 'border-rose-500/30 bg-rose-500/5';
    } else if (inc.type === 'degraded') {
      typeBadge = `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">DEGRADED</span>`;
      borderClass = 'border-amber-500/30 bg-amber-500/5';
    } else if (inc.type === 'corrupted') {
      typeBadge = `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">SILENT FAILURE</span>`;
      borderClass = 'border-purple-500/30 bg-purple-500/5';
    } else {
      typeBadge = `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">RESOLVED</span>`;
      borderClass = 'border-emerald-500/30 bg-emerald-500/5';
    }

    const durationText = inc.resolvedAt 
      ? `Resolved at ${formatTimestamp(inc.resolvedAt)}` 
      : `<span class="text-rose-500 font-semibold animate-pulse">Ongoing Outage</span>`;

    return `
      <div class="p-2.5 rounded-md border ${borderClass} flex flex-col gap-1 text-xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            ${typeBadge}
            <span class="font-semibold text-slate-900 dark:text-white font-mono">${escapeHtml(inc.endpointName)}</span>
          </div>
          <span class="text-[10px] font-mono text-slate-400">${formatTimestamp(inc.timestamp)}</span>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span class="truncate max-w-sm">${escapeHtml(inc.message)}</span>
          <span>${durationText}</span>
        </div>
      </div>
    `;
  }).join('');
}

// View History Action
async function handleViewHistory(id, name, url) {
  if (elements.historyModalTitle) elements.historyModalTitle.textContent = `History: ${name}`;
  if (elements.historyModalSubtitle) elements.historyModalSubtitle.textContent = url;
  if (elements.historyChartBars) elements.historyChartBars.innerHTML = '<div class="text-xs font-mono text-slate-400 py-4">Loading history...</div>';
  if (elements.historyLogsList) elements.historyLogsList.innerHTML = '';
  elements.historyModal?.classList.remove('hidden');

  try {
    const res = await fetch(`/api/monitoring/endpoints/${id}/history?limit=20`);
    const data = await res.json();
    
    if (data.success && Array.isArray(data.data)) {
      const records = data.data;
      if (records.length === 0) {
        if (elements.historyChartBars) elements.historyChartBars.innerHTML = '<div class="text-xs font-mono text-slate-400 py-3">No pings recorded yet.</div>';
        if (elements.historyLogsList) elements.historyLogsList.innerHTML = '<p class="text-xs font-mono text-slate-400 text-center py-4">No probe records available.</p>';
        if (elements.historyAvgLatency) elements.historyAvgLatency.textContent = 'Avg: 0 ms';
        return;
      }

      const avg = Math.round(records.reduce((sum, r) => sum + r.latencyMs, 0) / records.length);
      if (elements.historyAvgLatency) elements.historyAvgLatency.textContent = `Avg: ${avg} ms`;

      const maxLatency = Math.max(...records.map((r) => r.latencyMs), 100);
      const chronological = [...records].reverse();
      
      if (elements.historyChartBars) {
        elements.historyChartBars.innerHTML = chronological.map((r) => {
          const heightPct = Math.max(12, Math.min(100, Math.round((r.latencyMs / maxLatency) * 100)));
          const barColor = r.isHealthy 
            ? (r.latencyMs > state.settings.latencyThresholdMs ? 'bg-amber-500' : 'bg-blue-500') 
            : 'bg-rose-500';
          return `
            <div class="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div class="${barColor} rounded-xs w-full transition-all duration-200 group-hover:opacity-80" style="height: ${heightPct}%"></div>
              <div class="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-slate-900 dark:bg-black text-[10px] font-mono text-white px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none whitespace-nowrap shadow-lg">
                ${r.latencyMs}ms • ${r.statusCode || 'Err'}
              </div>
            </div>
          `;
        }).join('');
      }

      if (elements.historyLogsList) {
        elements.historyLogsList.innerHTML = records.map((r) => {
          const statusBadge = r.isHealthy
            ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">${r.statusCode || 200} OK</span>`
            : `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">${r.statusCode || 'FAIL'}</span>`;
          return `
            <div class="p-2 rounded bg-slate-50 dark:bg-[#090a0f] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-xs font-mono">
              <div class="flex items-center gap-2.5">
                ${statusBadge}
                <span class="text-slate-800 dark:text-slate-200 font-semibold">${r.latencyMs} ms</span>
                ${r.errorMessage ? `<span class="text-rose-500 text-[10px] truncate max-w-xs">${escapeHtml(r.errorMessage)}</span>` : ''}
              </div>
              <span class="text-[10px] text-slate-400">${formatTimestamp(r.timestamp)}</span>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    if (elements.historyChartBars) elements.historyChartBars.innerHTML = `<div class="text-xs font-mono text-rose-500 py-3">Error: ${escapeHtml(err.message)}</div>`;
  }
}

function closeHistoryModal() {
  elements.historyModal?.classList.add('hidden');
}

// Diagnostics & Root-Cause Inspector Action
async function handleInspectEndpoint(id, name) {
  if (elements.inspectModalTitle) elements.inspectModalTitle.textContent = `Diagnostics: ${name}`;
  if (elements.inspectModalSubtitle) elements.inspectModalSubtitle.textContent = 'Probing latest diagnostics snapshot...';
  if (elements.inspectRootCauseBanner) elements.inspectRootCauseBanner.innerHTML = '<div class="text-slate-400 py-2 font-mono text-center">Fetching diagnostic snapshot...</div>';
  if (elements.inspectHttpStatus) elements.inspectHttpStatus.textContent = '--';
  if (elements.inspectTotalLatency) elements.inspectTotalLatency.textContent = '-- ms';
  if (elements.inspectTaxonomy) elements.inspectTaxonomy.textContent = '--';
  if (elements.inspectClassification) elements.inspectClassification.textContent = '--';
  if (elements.inspectAssertionsList) elements.inspectAssertionsList.innerHTML = '<div class="text-slate-500 py-2 font-mono text-center">Evaluating assertions...</div>';
  if (elements.inspectResponseBody) elements.inspectResponseBody.textContent = 'Loading response body...';
  
  elements.inspectModal?.classList.remove('hidden');

  try {
    const res = await fetch(`/api/monitoring/endpoints/${id}/diagnostic`);
    const data = await res.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to load diagnostic details');
    }

    const { endpoint, stats, latestPing, diagnostic } = data.data;
    if (elements.inspectModalSubtitle) elements.inspectModalSubtitle.textContent = `${endpoint.method} ${endpoint.url}`;
    state.currentInspectCurl = diagnostic?.curlCommand || `curl -X ${endpoint.method} "${endpoint.url}"`;
    if (elements.inspectCurlCommand) elements.inspectCurlCommand.textContent = state.currentInspectCurl;

    // Target has NOT been pinged yet
    if (!latestPing) {
      if (elements.inspectHttpStatus) elements.inspectHttpStatus.textContent = 'PENDING';
      if (elements.inspectTotalLatency) elements.inspectTotalLatency.textContent = '--';
      if (elements.inspectTaxonomy) elements.inspectTaxonomy.textContent = 'AWAITING_PROBE';
      if (elements.inspectClassification) elements.inspectClassification.textContent = 'UNTESTED';

      if (elements.inspectRootCauseBanner) {
        elements.inspectRootCauseBanner.className = 'p-3 rounded-md border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300';
        elements.inspectRootCauseBanner.innerHTML = `
          <div class="flex items-center gap-1.5 font-mono text-xs font-semibold">
            <span class="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>Awaiting First Diagnostic Probe</span>
          </div>
          <p class="text-[11px] font-mono text-slate-400 mt-0.5">This target has not executed a health probe yet. Trigger a manual ping or wait for the scheduler cycle.</p>
        `;
      }
      return;
    }

    const status = stats?.status || 'unknown';
    const statusCode = latestPing?.statusCode ? `HTTP ${latestPing.statusCode}` : 'Failed';
    const latency = latestPing?.latencyMs !== undefined ? `${latestPing.latencyMs} ms` : '-- ms';
    const taxonomy = diagnostic?.failureReason || 'NONE';

    if (elements.inspectHttpStatus) elements.inspectHttpStatus.textContent = statusCode;
    if (elements.inspectTotalLatency) elements.inspectTotalLatency.textContent = latency;
    if (elements.inspectTaxonomy) elements.inspectTaxonomy.textContent = taxonomy;
    if (elements.inspectClassification) elements.inspectClassification.textContent = status.toUpperCase();

    // Failure Taxonomy Alert Banner
    if (elements.inspectRootCauseBanner) {
      if (taxonomy === 'ASSERTION_FAILED') {
        elements.inspectRootCauseBanner.className = 'p-3 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300';
        elements.inspectRootCauseBanner.innerHTML = `
          <div class="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
            <span class="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Silent Failure Detected (Corrupted Payload)</span>
          </div>
          <p class="text-xs font-mono mt-1">${escapeHtml(diagnostic.rootCause)}</p>
          <p class="text-[10px] font-mono text-purple-500/80 mt-0.5">HTTP status was ${latestPing?.statusCode || 200} (OK), but payload failed assertion rules.</p>
        `;
      } else if (taxonomy === 'HTTP_ERROR') {
        elements.inspectRootCauseBanner.className = 'p-3 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300';
        elements.inspectRootCauseBanner.innerHTML = `
          <div class="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>HTTP Status Code Mismatch</span>
          </div>
          <p class="text-xs font-mono mt-1">${escapeHtml(diagnostic?.rootCause || 'Unexpected HTTP status code')}</p>
        `;
      } else if (taxonomy === 'TIMEOUT') {
        elements.inspectRootCauseBanner.className = 'p-3 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
        elements.inspectRootCauseBanner.innerHTML = `
          <div class="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Connection Timeout</span>
          </div>
          <p class="text-xs font-mono mt-1">${escapeHtml(diagnostic?.rootCause || 'Target failed to respond within timeout window')}</p>
        `;
      } else if (taxonomy === 'NETWORK_ERROR') {
        elements.inspectRootCauseBanner.className = 'p-3 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300';
        elements.inspectRootCauseBanner.innerHTML = `
          <div class="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Network Disconnect</span>
          </div>
          <p class="text-xs font-mono mt-1">${escapeHtml(diagnostic?.rootCause || 'Failed to establish connection to target')}</p>
        `;
      } else {
        elements.inspectRootCauseBanner.className = 'p-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
        elements.inspectRootCauseBanner.innerHTML = `
          <div class="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Target Healthy &amp; Validated</span>
          </div>
          <p class="text-xs font-mono mt-1">${escapeHtml(diagnostic?.rootCause || 'Expected status code and assertion rules verified successfully.')}</p>
        `;
      }
    }

    // Timing Breakdown
    if (diagnostic?.timingBreakdown) {
      const tb = diagnostic.timingBreakdown;
      const total = Math.max(tb.totalMs, 1);
      const dnsPct = Math.max(5, Math.round((tb.dnsMs / total) * 100));
      const tcpPct = Math.max(5, Math.round((tb.tcpMs / total) * 100));
      const ttfbPct = Math.max(10, 100 - dnsPct - tcpPct);

      if (elements.inspectBarDns) elements.inspectBarDns.style.width = `${dnsPct}%`;
      if (elements.inspectBarTcp) elements.inspectBarTcp.style.width = `${tcpPct}%`;
      if (elements.inspectBarTtfb) elements.inspectBarTtfb.style.width = `${ttfbPct}%`;

      if (elements.inspectTimeDns) elements.inspectTimeDns.textContent = `${tb.dnsMs} ms`;
      if (elements.inspectTimeTcp) elements.inspectTimeTcp.textContent = `${tb.tcpMs} ms`;
      if (elements.inspectTimeTtfb) elements.inspectTimeTtfb.textContent = `${tb.ttfbMs} ms`;
      if (elements.inspectTimeTotal) elements.inspectTimeTotal.textContent = `${tb.totalMs} ms`;
      if (elements.inspectTtfbBadge) elements.inspectTtfbBadge.textContent = `TTFB: ${tb.ttfbMs} ms`;
    }

    // Assertions List
    const assertions = diagnostic?.assertionResults || [];
    if (elements.inspectAssertionsCount) {
      elements.inspectAssertionsCount.textContent = `${assertions.length} rule${assertions.length === 1 ? '' : 's'} evaluated`;
    }

    if (elements.inspectAssertionsList) {
      if (assertions.length === 0) {
        elements.inspectAssertionsList.innerHTML = `
          <div class="p-2 rounded bg-slate-50 dark:bg-[#090a0f] border border-slate-200 dark:border-white/[0.08] text-slate-400 font-mono text-center text-[10px]">
            No payload assertions configured for this target. HTTP status evaluated only.
          </div>
        `;
      } else {
        elements.inspectAssertionsList.innerHTML = assertions.map((a) => {
          const badge = a.passed
            ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">PASSED</span>`
            : `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">FAILED</span>`;
          const border = a.passed ? 'border-slate-200 dark:border-white/[0.08]' : 'border-purple-500/30 bg-purple-500/5';

          let ruleDesc = `Rule: <strong class="font-mono text-slate-900 dark:text-white">${a.type}</strong>`;
          if (a.property) ruleDesc += ` (Property: <span class="font-mono text-blue-500">${escapeHtml(a.property)}</span>)`;
          ruleDesc += ` &bull; Expected: <span class="font-mono text-slate-700 dark:text-slate-300">"${escapeHtml(a.expectedValue)}"</span>`;

          return `
            <div class="p-2 rounded border ${border} flex flex-col gap-0.5 text-xs font-mono">
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-slate-700 dark:text-slate-300">${ruleDesc}</span>
                ${badge}
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <span>${escapeHtml(a.message)}</span>
                ${a.actualValue ? `<span>Actual: "${escapeHtml(a.actualValue)}"</span>` : ''}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Response Body Snippet
    if (elements.inspectResponseBody) {
      if (diagnostic?.response?.bodySnippet) {
        if (elements.inspectContentType) elements.inspectContentType.textContent = diagnostic.response.contentType || 'text/plain';
        try {
          const parsed = JSON.parse(diagnostic.response.bodySnippet);
          elements.inspectResponseBody.textContent = JSON.stringify(parsed, null, 2);
        } catch {
          elements.inspectResponseBody.textContent = diagnostic.response.bodySnippet;
        }
      } else {
        if (elements.inspectContentType) elements.inspectContentType.textContent = 'None';
        elements.inspectResponseBody.textContent = 'No response payload captured.';
      }
    }

  } catch (err) {
    if (elements.inspectRootCauseBanner) {
      elements.inspectRootCauseBanner.className = 'p-2.5 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-500 font-mono text-xs';
      elements.inspectRootCauseBanner.textContent = `Diagnostic Inspection Failed: ${err.message}`;
    }
  }
}

function closeInspectModal() {
  elements.inspectModal?.classList.add('hidden');
}

// 1-Click Copy as cURL
async function handleCopyCurl() {
  if (!state.currentInspectCurl) return;
  try {
    await navigator.clipboard.writeText(state.currentInspectCurl);
    if (elements.btnCopyCurlText) elements.btnCopyCurlText.textContent = 'Copied!';
    showToast('cURL Copied', 'Repro command copied to clipboard.', 'success');
    setTimeout(() => {
      if (elements.btnCopyCurlText) elements.btnCopyCurlText.textContent = 'Copy cURL';
    }, 2000);
  } catch (err) {
    showToast('Copy Failed', err.message, 'error');
  }
}

// Auto Refresh Timer Loop
function startAutoRefresh() {
  stopAutoRefresh();
  if (!state.autoRefresh || state.refreshIntervalSeconds <= 0) return;

  state.countdown = state.refreshIntervalSeconds;
  updateCountdownUI();

  state.countdownId = setInterval(() => {
    state.countdown--;
    if (state.countdown <= 0) {
      state.countdown = state.refreshIntervalSeconds;
      fetchStats();
      fetchIncidents();
    }
    updateCountdownUI();
  }, 1000);
}

function stopAutoRefresh() {
  if (state.countdownId) {
    clearInterval(state.countdownId);
    state.countdownId = null;
  }
}

function updateCountdownUI() {
  if (state.autoRefresh && elements.countdownBadge) {
    elements.countdownBadge.textContent = `${state.countdown}s`;
    elements.countdownBadge.className = 'font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold px-1 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40';
  }
}

// Toast Notifications System
function showToast(title, message, type = 'info') {
  if (!elements.toastContainer) return;

  const toast = document.createElement('div');
  const borderStyles = {
    success: 'border-emerald-500/30 bg-white dark:bg-[#11141c] text-slate-800 dark:text-slate-100',
    error: 'border-rose-500/30 bg-white dark:bg-[#11141c] text-slate-800 dark:text-slate-100',
    info: 'border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#11141c] text-slate-800 dark:text-slate-100',
  };

  const icons = {
    success: `<div class="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg></div>`,
    error: `<div class="w-4 h-4 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg></div>`,
    info: `<div class="w-4 h-4 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>`,
  };

  toast.className = `animate-toast pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg border ${borderStyles[type] || borderStyles.info} shadow-xl`;
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div class="flex-1">
      <h4 class="text-xs font-semibold font-mono">${escapeHtml(title)}</h4>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">${escapeHtml(message)}</p>
    </div>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

// Utility Helpers
function formatRelativeTime(isoString) {
  const diff = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatTimestamp(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
