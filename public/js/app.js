/**
 * Hardware Asset Management System - Frontend Client Application
 * Pure Vanilla JavaScript DOM manipulation with role-based access control.
 */

// Application State
const state = {
  currentRole: localStorage.getItem('assetpulse_role') || 'admin',
  assets: [],
  filters: {
    search: '',
    type: '',
    status: ''
  },
  searchDebounceTimer: null,
  editingAssetId: null
};

// DOM Elements
const elements = {
  // Roles
  roleSelect: document.getElementById('role-select'),
  roleBadge: document.getElementById('role-badge'),
  auditorNotice: document.getElementById('auditor-notice'),
  adminOnlyActions: document.querySelectorAll('.admin-only-action'),

  // Stats
  statTotal: document.getElementById('stat-total'),
  statAvailable: document.getElementById('stat-available'),
  statAssigned: document.getElementById('stat-assigned'),
  statRepair: document.getElementById('stat-repair'),

  // Filters & Search
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  filterType: document.getElementById('filter-type'),
  filterStatus: document.getElementById('filter-status'),
  btnResetFilters: document.getElementById('btn-reset-filters'),
  btnEmptyClear: document.getElementById('btn-empty-clear'),
  btnExportCsv: document.getElementById('btn-export-csv'),

  // Table & States
  tableWrapper: document.getElementById('table-wrapper'),
  assetsTable: document.getElementById('assets-table'),
  assetsTbody: document.getElementById('assets-tbody'),
  loadingState: document.getElementById('loading-state'),
  emptyState: document.getElementById('empty-state'),
  assetCountDisplay: document.getElementById('asset-count-display'),

  // Asset Create/Edit Modal
  assetModal: document.getElementById('asset-modal'),
  modalTitle: document.getElementById('modal-title'),
  assetForm: document.getElementById('asset-form'),
  assetIdInput: document.getElementById('asset-id'),
  assetTagInput: document.getElementById('asset-tag'),
  serialNumberInput: document.getElementById('serial-number'),
  deviceTypeSelect: document.getElementById('device-type'),
  deviceStatusSelect: document.getElementById('device-status'),
  deviceModelInput: document.getElementById('device-model'),
  assignedToInput: document.getElementById('assigned-to'),
  departmentInput: document.getElementById('department'),
  modalErrorAlert: document.getElementById('modal-error-alert'),
  btnOpenCreateModal: document.getElementById('btn-open-create-modal'),
  btnCloseAssetModal: document.getElementById('btn-close-asset-modal'),
  btnCancelAssetModal: document.getElementById('btn-cancel-asset-modal'),
  btnSaveAsset: document.getElementById('btn-save-asset'),
  saveBtnSpinner: document.getElementById('save-btn-spinner'),
  saveBtnText: document.getElementById('save-btn-text'),

  // Assign Modal
  assignModal: document.getElementById('assign-modal'),
  assignForm: document.getElementById('assign-form'),
  assignAssetId: document.getElementById('assign-asset-id'),
  assignPreviewTag: document.getElementById('assign-preview-tag'),
  assignPreviewModel: document.getElementById('assign-preview-model'),
  assignEmployeeInput: document.getElementById('assign-employee'),
  assignDepartmentInput: document.getElementById('assign-department'),
  assignErrorAlert: document.getElementById('assign-error-alert'),
  btnCloseAssignModal: document.getElementById('btn-close-assign-modal'),
  btnCancelAssignModal: document.getElementById('btn-cancel-assign-modal'),

  // Delete Modal
  deleteModal: document.getElementById('delete-modal'),
  deleteAssetId: document.getElementById('delete-asset-id'),
  deleteAssetTag: document.getElementById('delete-asset-tag'),
  deleteAssetModel: document.getElementById('delete-asset-model'),
  btnConfirmDelete: document.getElementById('btn-confirm-delete'),
  btnCancelDelete: document.getElementById('btn-cancel-delete'),
  btnCloseDeleteModal: document.getElementById('btn-close-delete-modal'),

  // Toast Container
  toastContainer: document.getElementById('toast-container')
};

// ============================================================================
// Notification System (Toasts)
// ============================================================================
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || 'ℹ'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    removeToast(toast);
  });

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    removeToast(toast);
  }, duration);
}

function removeToast(toast) {
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(40px)';
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 250);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// API Client Layer
// ============================================================================
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-role': state.currentRole,
    ...(options.headers || {})
  };

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage = data?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(errorMessage);
      err.status = res.status;
      err.code = data?.error?.code;
      err.details = data?.error?.details;
      throw err;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// Data Fetching & Dashboard Calculations
// ============================================================================
async function loadAssets() {
  try {
    showLoading(true);

    const queryParams = new URLSearchParams();
    if (state.filters.search) queryParams.set('search', state.filters.search);
    if (state.filters.type) queryParams.set('type', state.filters.type);
    if (state.filters.status) queryParams.set('status', state.filters.status);

    const endpoint = `/api/v1/assets?${queryParams.toString()}`;
    const response = await apiRequest(endpoint);

    state.assets = response.data || [];
    renderAssets(state.assets);
    updateStats(state.assets);
  } catch (err) {
    showToast(`Failed to load assets: ${err.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

function updateStats(assets) {
  const total = assets.length;
  const available = assets.filter(a => a.status === 'AVAILABLE').length;
  const assigned = assets.filter(a => a.status === 'ASSIGNED').length;
  const repairOrRetired = assets.filter(a => a.status === 'UNDER_REPAIR' || a.status === 'RETIRED').length;

  elements.statTotal.textContent = total;
  elements.statAvailable.textContent = available;
  elements.statAssigned.textContent = assigned;
  elements.statRepair.textContent = repairOrRetired;
}

function showLoading(isLoading) {
  if (isLoading) {
    elements.loadingState.classList.remove('hidden');
    elements.tableWrapper.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
  } else {
    elements.loadingState.classList.add('hidden');
    elements.tableWrapper.classList.remove('hidden');
  }
}

// ============================================================================
// Rendering Assets Table
// ============================================================================
function renderAssets(assets) {
  elements.assetsTbody.innerHTML = '';
  elements.assetCountDisplay.textContent = `Showing ${assets.length} device${assets.length === 1 ? '' : 's'}`;

  if (assets.length === 0) {
    elements.tableWrapper.classList.add('hidden');
    elements.emptyState.classList.remove('hidden');
    return;
  }

  elements.emptyState.classList.add('hidden');
  elements.tableWrapper.classList.remove('hidden');

  const isAdmin = state.currentRole === 'admin';

  assets.forEach(asset => {
    const tr = document.createElement('tr');
    tr.dataset.id = asset.id;

    // Type icon & text
    const typeIcons = {
      LAPTOP: '💻',
      MONITOR: '🖥️',
      PHONE: '📱',
      PERIPHERAL: '⌨️'
    };
    const typeIcon = typeIcons[asset.type] || '📦';

    // Status Badge formatted
    const statusClass = `status-${asset.status.toLowerCase()}`;
    const statusLabel = asset.status.replace('_', ' ');

    // Assignee display
    const assigneeHtml = asset.assigned_to 
      ? `<span class="assignee-name font-medium">${escapeHtml(asset.assigned_to)}</span>`
      : `<span class="text-muted">—</span>`;

    const departmentHtml = asset.department
      ? `<span class="department-badge">${escapeHtml(asset.department)}</span>`
      : `<span class="text-muted">—</span>`;

    // Action buttons based on Role & Status
    let actionsHtml = '';
    if (isAdmin) {
      let assignBtn = '';
      if (asset.status === 'AVAILABLE') {
        assignBtn = `<button class="btn-table assign-btn" onclick="openAssignModal('${asset.id}')" title="Assign to employee">Assign</button>`;
      } else if (asset.status === 'ASSIGNED') {
        assignBtn = `<button class="btn-table unassign-btn" onclick="handleUnassign('${asset.id}')" title="Unassign and return to pool">Unassign</button>`;
      }

      actionsHtml = `
        <div class="action-btn-group">
          ${assignBtn}
          <button class="btn-table" onclick="openEditModal('${asset.id}')" title="Edit device details">Edit</button>
          <button class="btn-table delete-btn" onclick="openDeleteModal('${asset.id}')" title="Delete record">Delete</button>
        </div>
      `;
    } else {
      actionsHtml = `<span class="text-muted" style="font-size: 0.75rem;">Read-only</span>`;
    }

    tr.innerHTML = `
      <td class="asset-tag-cell">${escapeHtml(asset.asset_tag)}</td>
      <td class="asset-model-cell">${escapeHtml(asset.model)}</td>
      <td>
        <span class="device-type-badge">${typeIcon} ${escapeHtml(asset.type)}</span>
      </td>
      <td class="mono" style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(asset.serial_number)}</td>
      <td>${assigneeHtml}</td>
      <td>${departmentHtml}</td>
      <td>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </td>
      <td class="text-right">${actionsHtml}</td>
    `;

    elements.assetsTbody.appendChild(tr);
  });
}

// ============================================================================
// Role Switching
// ============================================================================
function setRole(newRole) {
  state.currentRole = newRole;
  localStorage.setItem('assetpulse_role', newRole);
  elements.roleSelect.value = newRole;

  if (newRole === 'admin') {
    elements.roleBadge.textContent = 'Full Access';
    elements.roleBadge.className = 'role-badge badge-admin';
    elements.auditorNotice.classList.add('hidden');
    elements.btnOpenCreateModal.classList.remove('hidden');
  } else {
    elements.roleBadge.textContent = 'Read-Only';
    elements.roleBadge.className = 'role-badge badge-auditor';
    elements.auditorNotice.classList.remove('hidden');
    elements.btnOpenCreateModal.classList.add('hidden');
  }

  // Re-render table with updated action buttons
  renderAssets(state.assets);
  showToast(`Role switched to ${newRole.toUpperCase()} mode`, 'info', 2500);
}

// ============================================================================
// Create / Edit Asset Modal Handlers
// ============================================================================
function openCreateModal() {
  if (state.currentRole !== 'admin') {
    showToast('Only IT Operators (Admin) can add new assets.', 'error');
    return;
  }
  state.editingAssetId = null;
  elements.modalTitle.textContent = 'Add New Hardware Asset';
  elements.saveBtnText.textContent = 'Create Asset';
  elements.assetForm.reset();
  elements.assetIdInput.value = '';
  clearValidationErrors();
  elements.modalErrorAlert.classList.add('hidden');
  elements.assetModal.classList.remove('hidden');
  elements.assetTagInput.focus();
}

function openEditModal(assetId) {
  if (state.currentRole !== 'admin') {
    showToast('Only IT Operators (Admin) can edit assets.', 'error');
    return;
  }
  const asset = state.assets.find(a => a.id === assetId);
  if (!asset) return;

  state.editingAssetId = assetId;
  elements.modalTitle.textContent = `Edit Asset: ${asset.asset_tag}`;
  elements.saveBtnText.textContent = 'Save Changes';
  clearValidationErrors();
  elements.modalErrorAlert.classList.add('hidden');

  elements.assetIdInput.value = asset.id;
  elements.assetTagInput.value = asset.asset_tag;
  elements.serialNumberInput.value = asset.serial_number;
  elements.deviceTypeSelect.value = asset.type;
  elements.deviceStatusSelect.value = asset.status;
  elements.deviceModelInput.value = asset.model;
  elements.assignedToInput.value = asset.assigned_to || '';
  elements.departmentInput.value = asset.department || '';

  elements.assetModal.classList.remove('hidden');
}

function closeAssetModal() {
  elements.assetModal.classList.add('hidden');
  elements.assetForm.reset();
  state.editingAssetId = null;
}

// Client-side validation
function validateAssetForm() {
  let isValid = true;
  clearValidationErrors();

  const tagVal = elements.assetTagInput.value.trim();
  const serialVal = elements.serialNumberInput.value.trim();
  const modelVal = elements.deviceModelInput.value.trim();

  // Asset Tag pattern ^IT-[0-9]{5}$
  const tagRegex = /^IT-[0-9]{5}$/;
  if (!tagVal) {
    showFieldError('error-asset-tag', 'Asset tag is required.');
    elements.assetTagInput.classList.add('is-invalid');
    isValid = false;
  } else if (!tagRegex.test(tagVal)) {
    showFieldError('error-asset-tag', 'Format must be IT-XXXXX (5 digits, e.g. IT-00042).');
    elements.assetTagInput.classList.add('is-invalid');
    isValid = false;
  }

  // Serial Number
  if (!serialVal) {
    showFieldError('error-serial-number', 'Serial number is required.');
    elements.serialNumberInput.classList.add('is-invalid');
    isValid = false;
  }

  // Model
  if (!modelVal) {
    showFieldError('error-device-model', 'Device make & model is required.');
    elements.deviceModelInput.classList.add('is-invalid');
    isValid = false;
  }

  return isValid;
}

function showFieldError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (el) el.textContent = message;
}

function clearValidationErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));
}

async function handleAssetFormSubmit(e) {
  e.preventDefault();
  if (!validateAssetForm()) return;

  const payload = {
    asset_tag: elements.assetTagInput.value.trim(),
    serial_number: elements.serialNumberInput.value.trim(),
    type: elements.deviceTypeSelect.value,
    status: elements.deviceStatusSelect.value,
    model: elements.deviceModelInput.value.trim(),
    assigned_to: elements.assignedToInput.value.trim() || null,
    department: elements.departmentInput.value.trim() || null
  };

  try {
    elements.saveBtnSpinner.classList.remove('hidden');
    elements.btnSaveAsset.disabled = true;

    if (state.editingAssetId) {
      // Update
      await apiRequest(`/api/v1/assets/${state.editingAssetId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast(`Asset ${payload.asset_tag} updated successfully!`, 'success');
    } else {
      // Create
      await apiRequest('/api/v1/assets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast(`Asset ${payload.asset_tag} created successfully!`, 'success');
    }

    closeAssetModal();
    loadAssets();
  } catch (err) {
    elements.modalErrorAlert.textContent = err.message;
    elements.modalErrorAlert.classList.remove('hidden');
  } finally {
    elements.saveBtnSpinner.classList.add('hidden');
    elements.btnSaveAsset.disabled = false;
  }
}

// ============================================================================
// Assign / Unassign Handlers
// ============================================================================
window.openAssignModal = function(assetId) {
  if (state.currentRole !== 'admin') {
    showToast('Auditor role cannot assign assets.', 'error');
    return;
  }

  const asset = state.assets.find(a => a.id === assetId);
  if (!asset) return;

  if (asset.status === 'UNDER_REPAIR' || asset.status === 'RETIRED') {
    showToast(`Cannot assign asset: Currently ${asset.status}`, 'error');
    return;
  }

  elements.assignAssetId.value = asset.id;
  elements.assignPreviewTag.textContent = asset.asset_tag;
  elements.assignPreviewModel.textContent = asset.model;
  elements.assignEmployeeInput.value = '';
  elements.assignDepartmentInput.value = '';
  elements.assignErrorAlert.classList.add('hidden');
  clearValidationErrors();

  elements.assignModal.classList.remove('hidden');
  elements.assignEmployeeInput.focus();
};

function closeAssignModal() {
  elements.assignModal.classList.add('hidden');
}

async function handleAssignSubmit(e) {
  e.preventDefault();
  const assetId = elements.assignAssetId.value;
  const assigned_to = elements.assignEmployeeInput.value.trim();
  const department = elements.assignDepartmentInput.value.trim();

  let hasError = false;
  if (!assigned_to) {
    showFieldError('error-assign-employee', 'Employee name is required.');
    hasError = true;
  }
  if (!department) {
    showFieldError('error-assign-department', 'Department is required.');
    hasError = true;
  }
  if (hasError) return;

  try {
    const res = await apiRequest(`/api/v1/assets/${assetId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assigned_to, department })
    });

    showToast(`Assigned successfully to ${assigned_to}!`, 'success');
    closeAssignModal();
    loadAssets();
  } catch (err) {
    elements.assignErrorAlert.textContent = err.message;
    elements.assignErrorAlert.classList.remove('hidden');
  }
}

window.handleUnassign = async function(assetId) {
  if (state.currentRole !== 'admin') {
    showToast('Auditor role cannot unassign assets.', 'error');
    return;
  }

  const asset = state.assets.find(a => a.id === assetId);
  if (!asset) return;

  if (!confirm(`Unassign asset ${asset.asset_tag} (${asset.model}) and return to AVAILABLE pool?`)) {
    return;
  }

  try {
    await apiRequest(`/api/v1/assets/${assetId}/unassign`, {
      method: 'PATCH'
    });
    showToast(`Asset ${asset.asset_tag} unassigned and returned to available pool.`, 'success');
    loadAssets();
  } catch (err) {
    showToast(`Unassign failed: ${err.message}`, 'error');
  }
};

// ============================================================================
// Delete Handlers
// ============================================================================
window.openDeleteModal = function(assetId) {
  if (state.currentRole !== 'admin') {
    showToast('Auditor role cannot delete assets.', 'error');
    return;
  }

  const asset = state.assets.find(a => a.id === assetId);
  if (!asset) return;

  elements.deleteAssetId.value = asset.id;
  elements.deleteAssetTag.textContent = asset.asset_tag;
  elements.deleteAssetModel.textContent = asset.model;
  elements.deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
  elements.deleteModal.classList.add('hidden');
}

async function handleConfirmDelete() {
  const assetId = elements.deleteAssetId.value;
  try {
    await apiRequest(`/api/v1/assets/${assetId}`, {
      method: 'DELETE'
    });
    showToast('Asset deleted successfully!', 'success');
    closeDeleteModal();
    loadAssets();
  } catch (err) {
    showToast(`Failed to delete asset: ${err.message}`, 'error');
  }
}

// ============================================================================
// Export CSV (Available to both Admin and Auditor)
// ============================================================================
function exportToCsv() {
  if (!state.assets || state.assets.length === 0) {
    showToast('No assets available to export.', 'info');
    return;
  }

  const headers = ['Asset Tag', 'Make & Model', 'Type', 'Serial Number', 'Status', 'Assigned To', 'Department', 'Created At'];
  const rows = state.assets.map(a => [
    `"${a.asset_tag}"`,
    `"${a.model.replace(/"/g, '""')}"`,
    `"${a.type}"`,
    `"${a.serial_number}"`,
    `"${a.status}"`,
    `"${(a.assigned_to || '').replace(/"/g, '""')}"`,
    `"${(a.department || '').replace(/"/g, '""')}"`,
    `"${a.created_at}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `hardware_assets_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(`Exported ${state.assets.length} assets to CSV!`, 'success');
}

// ============================================================================
// Event Listeners Setup
// ============================================================================
function setupEventListeners() {
  // Role selector
  elements.roleSelect.addEventListener('change', (e) => {
    setRole(e.target.value);
  });

  // Search input with 300ms debounce
  elements.searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) {
      elements.searchClearBtn.classList.remove('hidden');
    } else {
      elements.searchClearBtn.classList.add('hidden');
    }

    clearTimeout(state.searchDebounceTimer);
    state.searchDebounceTimer = setTimeout(() => {
      state.filters.search = val;
      loadAssets();
    }, 300);
  });

  // Search clear button
  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.searchClearBtn.classList.add('hidden');
    state.filters.search = '';
    loadAssets();
    elements.searchInput.focus();
  });

  // Type filter
  elements.filterType.addEventListener('change', (e) => {
    state.filters.type = e.target.value;
    loadAssets();
  });

  // Status filter
  elements.filterStatus.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    loadAssets();
  });

  // Reset filter buttons
  const resetFilters = () => {
    elements.searchInput.value = '';
    elements.searchClearBtn.classList.add('hidden');
    elements.filterType.value = '';
    elements.filterStatus.value = '';
    state.filters.search = '';
    state.filters.type = '';
    state.filters.status = '';
    loadAssets();
  };
  elements.btnResetFilters.addEventListener('click', resetFilters);
  elements.btnEmptyClear.addEventListener('click', resetFilters);

  // Export CSV button
  elements.btnExportCsv.addEventListener('click', exportToCsv);

  // Create Modal
  elements.btnOpenCreateModal.addEventListener('click', openCreateModal);
  elements.btnCloseAssetModal.addEventListener('click', closeAssetModal);
  elements.btnCancelAssetModal.addEventListener('click', closeAssetModal);
  elements.assetForm.addEventListener('submit', handleAssetFormSubmit);

  // Assign Modal
  elements.btnCloseAssignModal.addEventListener('click', closeAssignModal);
  elements.btnCancelAssignModal.addEventListener('click', closeAssignModal);
  elements.assignForm.addEventListener('submit', handleAssignSubmit);

  // Delete Modal
  elements.btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
  elements.btnCancelDelete.addEventListener('click', closeDeleteModal);
  elements.btnConfirmDelete.addEventListener('click', handleConfirmDelete);

  // Close modals when clicking backdrop
  [elements.assetModal, elements.assignModal, elements.deleteModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      elements.assetModal.classList.add('hidden');
      elements.assignModal.classList.add('hidden');
      elements.deleteModal.classList.add('hidden');
    }
  });
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setRole(state.currentRole);
  loadAssets();
});
