document.addEventListener('DOMContentLoaded', () => {
  initAge();
  setDefaultDateTime();
  initInitialData();
  updateDashboard();

  const form = document.getElementById('glicemiaForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addMeasurement();
  });
});

// --- DADOS FIXOS DA MARTINHA ---
const BIRTH_DATE = '1957-10-18';

function initAge() {
  const birth = new Date(BIRTH_DATE);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  document.getElementById('userProfileAge').textContent = `${age} anos | Meu Controle Diário`;
}

function setDefaultDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('dataHoraGlicemia').value = now.toISOString().slice(0, 16);
}

// --- ARMAZENAMENTO LOCAL ---
function getStoredData() {
  const data = localStorage.getItem('glicemia_records_martinha');
  return data ? JSON.parse(data) : [];
}

function saveStoredData(data) {
  localStorage.setItem('glicemia_records_martinha', JSON.stringify(data));
}

// Carrega o histórico inicial da planilha se estiver vazio
function initInitialData() {
  const stored = getStoredData();
  if (stored.length === 0) {
    // Registros extraídos do histórico do relatório final
    const initialHistory = [
      { id: 1, dia: "29", momento: "Café da manhã", valor: 223 },
      { id: 2, dia: "29", momento: "Noite", valor: 399 },
      { id: 3, dia: "30", momento: "Manhã", valor: 150 },
      { id: 4, dia: "30", momento: "Tarde / Almoço", valor: 342 },
      { id: 5, dia: "1", momento: "Manhã / Café", valor: 145 },
      { id: 6, dia: "1", momento: "Tarde (2h após almoço)", valor: 345 },
      { id: 7, dia: "2", momento: "Café da manhã", valor: 145 },
      { id: 8, dia: "2", momento: "2h após café", valor: 275 },
      { id: 9, dia: "2", momento: "2h após almoço", valor: 237 },
      { id: 10, dia: "2", momento: "Noite (2h após janta)", valor: 302 },
      { id: 11, dia: "18 de setembro", momento: "Glicemia", valor: 129 },
      { id: 12, dia: "19 de setembro", momento: "Glicemia", valor: 136 }
    ];
    saveStoredData(initialHistory);
  }
}

function addMeasurement() {
  const valorInput = document.getElementById('valorGlicemia').value;
  const momentoSelect = document.getElementById('momentoGlicemia').value;
  const dataHoraInput = document.getElementById('dataHoraGlicemia').value;

  if (!valorInput || !dataHoraInput) return;

  const dateObj = new Date(dataHoraInput);
  const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const record = {
    id: Date.now(),
    dia: formattedDate,
    momento: momentoSelect,
    valor: parseFloat(valorInput)
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
    tr.innerHTML = `
      <td>${r.dia}</td>
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
    document.getElementById('metricCount').textContent = '0';
    return;
  }

  const sum = records.reduce((acc, curr) => acc + curr.valor, 0);
  const avg = (sum / records.length).toFixed(1);

  document.getElementById('metricTotal').textContent = `${avg} mg/dL`;
  document.getElementById('metricCount').textContent = records.length;
}
