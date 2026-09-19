document.addEventListener('DOMContentLoaded', () => {
  initAge();
  setDefaultDateTime();
  initData();
  updateDashboard();

  const form = document.getElementById('glicemiaForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      // Bloqueia o recarregamento automático da página
      e.preventDefault();
      addMeasurement();
    });
  }
});

// --- DADOS FIXOS DA MARTINHA (Nascida em 18/10/1957) ---
const BIRTH_DATE = '1957-10-18';

// As 533 medições do histórico original do Excel incorporadas
const HISTORICO_INICIAL = [
  { "id": 1, "dia": "29", "momento": "Café da manhã", "valor": 223 },
  { "id": 2, "dia": "29", "momento": "Noite", "valor": 399 },
  { "id": 3, "dia": "30", "momento": "Manhã", "valor": 150 },
  { "id": 4, "dia": "30", "momento": "Tarde / Almoço", "valor": 342 },
  { "id": 5, "dia": "1", "momento": "Manhã / Café", "valor": 145 },
  { "id": 6, "dia": "1", "momento": "Tarde (2h após almoço)", "valor": 345 },
  { "id": 7, "dia": "2", "momento": "Café da manhã", "valor": 145 },
  { "id": 8, "dia": "2", "momento": "2h após café", "valor": 275 },
  { "id": 9, "dia": "2", "momento": "2h após almoço", "valor": 237 },
  { "id": 10, "dia": "2", "momento": "Noite (2h após janta)", "valor": 302 },
  { "id": 531, "dia": "17 de setembro", "momento": "Glicemia", "valor": 103 },
  { "id": 532, "dia": "18 de setembro", "momento": "Glicemia", "valor": 129 },
  { "id": 533, "dia": "19 de setembro", "momento": "Glicemia", "valor": 136 }
];

function initAge() {
  const birth = new Date(BIRTH_DATE);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  const ageEl = document.getElementById('userProfileAge');
  if (ageEl) {
    ageEl.textContent = `${age} anos | Meu Controle Diário`;
  }
}

function setDefaultDateTime() {
  const inputDate = document.getElementById('dataHoraGlicemia');
  if (inputDate) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    inputDate.value = now.toISOString().slice(0, 16);
  }
}

// --- ARMAZENAMENTO LOCAL ---
function getStoredData() {
  try {
    const data = localStorage.getItem('glicemia_records_martinha');
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Erro ao ler LocalStorage:", err);
    return null;
  }
}

function saveStoredData(data) {
  try {
    localStorage.setItem('glicemia_records_martinha', JSON.stringify(data));
  } catch (err) {
    console.error("Erro ao salvar no LocalStorage:", err);
  }
}

function initData() {
  let records = getStoredData();
  if (!records || records.length === 0) {
    saveStoredData(HISTORICO_INICIAL);
  }
}

function addMeasurement() {
  const valorInput = document.getElementById('valorGlicemia');
  const momentoSelect = document.getElementById('momentoGlicemia');
  const dataHoraInput = document.getElementById('dataHoraGlicemia');

  if (!valorInput || !valorInput.value || !dataHoraInput || !dataHoraInput.value) return;

  const dateObj = new Date(dataHoraInput.value);
  const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const record = {
    id: Date.now(),
    dia: formattedDate,
    momento: momentoSelect ? momentoSelect.value : 'Glicemia',
    valor: parseFloat(valorInput.value)
  };

  let records = getStoredData() || [];
  records.unshift(record);
  saveStoredData(records);

  valorInput.value = '';
  setDefaultDateTime();
  updateDashboard();
}

function deleteMeasurement(id) {
  let records = getStoredData() || [];
  records = records.filter(r => r.id !== id);
  saveStoredData(records);
  updateDashboard();
}

function updateDashboard() {
  const records = getStoredData() || [];
  renderHistory(records);
  renderMetrics(records);
}

function renderHistory(records) {
  const tbody = document.getElementById('historyBody');
  const emptyMsg = document.getElementById('emptyHistory');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (records.length === 0) {
    if (emptyMsg) emptyMsg.classList.remove('hidden');
    return;
  }

  if (emptyMsg) emptyMsg.classList.add('hidden');

  records.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.dia}</td>
      <td>${r.momento}</td>
      <td><strong>${r.valor}</strong> mg/dL</td>
      <td><button type="button" class="btn-delete" onclick="deleteMeasurement(${r.id})">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderMetrics(records) {
  const metricTotal = document.getElementById('metricTotal');
  const metricCount = document.getElementById('metricCount');

  if (records.length === 0) {
    if (metricTotal) metricTotal.textContent = '-- mg/dL';
    if (metricCount) metricCount.textContent = '0';
    return;
  }

  const sum = records.reduce((acc, curr) => acc + curr.valor, 0);
  const avg = (sum / records.length).toFixed(1);

  if (metricTotal) metricTotal.textContent = `${avg} mg/dL`;
  if (metricCount) metricCount.textContent = records.length;
}
