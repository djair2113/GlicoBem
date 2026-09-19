document.addEventListener('DOMContentLoaded', () => {
  initProfile();
  setDefaultDateTime();
  
  const form = document.getElementById('glicemiaForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addMeasurement();
  });

  setupProfileModal();
  updateDashboard();
});

// --- PERFIL DE UTILIZADOR ---
const DEFAULT_USER = {
  name: 'Martinha',
  birthDate: '1959-10-18'
};

function getProfile() {
  const data = localStorage.getItem('glicobem_profile');
  return data ? JSON.parse(data) : DEFAULT_USER;
}

function saveProfile(profile) {
  localStorage.setItem('glicobem_profile', JSON.stringify(profile));
}

function calculateAge(birthDateStr) {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function initProfile() {
  const profile = getProfile();
  document.getElementById('userProfileName').textContent = profile.name;
  const age = calculateAge(profile.birthDate);
  document.getElementById('userProfileAge').textContent = `${age} anos | Meu Controle Diário`;
}

function setupProfileModal() {
  const modal = document.getElementById('modalProfile');
  const btnEdit = document.getElementById('btnEditProfile');
  const btnCancel = document.getElementById('btnCancelProfile');
  const btnSave = document.getElementById('btnSaveProfile');

  btnEdit.addEventListener('click', () => {
    const profile = getProfile();
    document.getElementById('inputUserName').value = profile.name;
    document.getElementById('inputUserBirth').value = profile.birthDate;
    modal.classList.remove('hidden');
  });

  btnCancel.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  btnSave.addEventListener('click', () => {
    const newName = document.getElementById('inputUserName').value.trim();
    const newBirth = document.getElementById('inputUserBirth').value;

    if (newName && newBirth) {
      saveProfile({ name: newName, birthDate: newBirth });
      initProfile();
      modal.classList.add('hidden');
    }
  });
}

// --- DADOS E MEDIÇÕES ---
function setDefaultDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('dataHoraGlicemia').value = now.toISOString().slice(0, 16);
}

function getStoredData() {
  const data = localStorage.getItem('glicemia_records');
  return data ? JSON.parse(data) : [];
}

function saveStoredData(data) {
  localStorage.setItem('glicemia_records', JSON.stringify(data));
}

function addMeasurement() {
  const valorInput = document.getElementById('valorGlicemia').value;
  const momentoSelect = document.getElementById('momentoGlicemia').value;
  const dataHoraInput = document.getElementById('dataHoraGlicemia').value;

  if (!valorInput || !dataHoraInput) return;

  const record = {
    id: Date.now(),
    valor: parseFloat(valorInput),
    momento: momentoSelect,
    dataHora: dataHoraInput
  };

  const records = getStoredData();
  records.unshift(record);
  saveStoredData(records);

  document.getElementById('valorGlicemia').value = '';
  setDefaultDateTime();
  updateDashboard();
}

function deleteMeasurement(id) {
  let records = getStoredData();
  records = records.filter(r => r.id !== id);
  saveStoredData(records);
  updateDashboard();
}

// --- DASHBOARD E HISTÓRICO ---
function updateDashboard() {
  const records = getStoredData();
  renderHistory(records);
  renderMetrics(records);
}

function renderHistory(records) {
  const tbody = document.getElementById('historyBody');
  const emptyMsg = document.getElementById('emptyHistory');
  tbody.innerHTML = '';

  if (records.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }

  emptyMsg.classList.add('hidden');

  records.forEach(r => {
    const tr = document.createElement('tr');
    const dateFormatted = new Date(r.dataHora).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    tr.innerHTML = `
      <td>${dateFormatted}</td>
      <td>${r.momento}</td>
      <td><strong>${r.valor}</strong> mg/dL</td>
      <td><button class="btn-delete" onclick="deleteMeasurement(${r.id})">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderMetrics(records) {
  if (records.length === 0) {
    document.getElementById('metricTotal').textContent = '-- mg/dL';
    document.getElementById('metricMensal').textContent = '-- mg/dL';
    document.getElementById('metricTrimestral').textContent = '-- mg/dL';
    document.getElementById('metricAnual').textContent = '-- mg/dL';
    return;
  }

  const now = new Date();
  const avgTotal = calcAverage(records);
  const avgMensal = calcAverage(records.filter(r => (now - new Date(r.dataHora)) <= 30 * 24 * 60 * 60 * 1000));
  const avgTrimestral = calcAverage(records.filter(r => (now - new Date(r.dataHora)) <= 90 * 24 * 60 * 60 * 1000));
  const avgAnual = calcAverage(records.filter(r => (now - new Date(r.dataHora)) <= 365 * 24 * 60 * 60 * 1000));

  document.getElementById('metricTotal').textContent = `${avgTotal} mg/dL`;
  document.getElementById('metricMensal').textContent = `${avgMensal} mg/dL`;
  document.getElementById('metricTrimestral').textContent = `${avgTrimestral} mg/dL`;
  document.getElementById('metricAnual').textContent = `${avgAnual} mg/dL`;
}

function calcAverage(arr) {
  if (arr.length === 0) return '--';
  const sum = arr.reduce((acc, curr) => acc + curr.valor, 0);
  return (sum / arr.length).toFixed(1);
}
