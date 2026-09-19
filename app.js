document.addEventListener('DOMContentLoaded', () => {
  initAge();
  setDefaultDateTime();
  initData();
  updateDashboard();

  const form = document.getElementById('glicemiaForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      addMeasurement();
    });
  }
});

// --- DADOS FIXOS DA MARTINHA (18/10/1957) ---
const BIRTH_DATE = '1957-10-18';

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
    const data = localStorage.getItem('glicemia_records_martinha_v3');
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Erro ao ler LocalStorage:", err);
    return null;
  }
}

function saveStoredData(data) {
  try {
    localStorage.setItem('glicemia_records_martinha_v3', JSON.stringify(data));
  } catch (err) {
    console.error("Erro ao salvar no LocalStorage:", err);
  }
}

function initData() {
  let records = getStoredData();
  if (!records || records.length < 500) {
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
    valor: parseFloat(valorInput.value),
    timestamp: dateObj.getTime()
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
  const allRecords = getStoredData() || [];
  const filterSelect = document.getElementById('filtroHistorico');
  const filterValue = filterSelect ? filterSelect.value : 'todos';

  let filteredRecords = allRecords;
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  if (filterValue === 'mensal') {
    filteredRecords = allRecords.filter(r => r.timestamp ? (now - r.timestamp) <= thirtyDaysMs : true).slice(0, 30);
  } else if (filterValue === 'trimestral') {
    filteredRecords = allRecords.filter(r => r.timestamp ? (now - r.timestamp) <= ninetyDaysMs : true).slice(0, 90);
  }

  renderHistory(filteredRecords);
  renderMetrics(allRecords);
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
  const metricMensal = document.getElementById('metricMensal');
  const metricTrimestral = document.getElementById('metricTrimestral');

  if (records.length === 0) {
    if (metricTotal) metricTotal.textContent = '-- mg/dL';
    if (metricMensal) metricMensal.textContent = '-- mg/dL';
    if (metricTrimestral) metricTrimestral.textContent = '-- mg/dL';
    return;
  }

  const avgTotal = calcAvg(records);
  const avgMensal = calcAvg(records.slice(0, 30));
  const avgTrimestral = calcAvg(records.slice(0, 90));

  if (metricTotal) metricTotal.textContent = `${avgTotal} mg/dL`;
  if (metricMensal) metricMensal.textContent = `${avgMensal} mg/dL`;
  if (metricTrimestral) metricTrimestral.textContent = `${avgTrimestral} mg/dL`;
}

function calcAvg(arr) {
  if (!arr || arr.length === 0) return '--';
  const sum = arr.reduce((acc, curr) => acc + curr.valor, 0);
  return (sum / arr.length).toFixed(1);
}

// Histórico com os 533 registros
const HISTORICO_INICIAL = [
  {"id": 1, "dia": "29", "momento": "Café da manhã", "valor": 223}, {"id": 2, "dia": "29", "momento": "Noite", "valor": 399}, {"id": 3, "dia": "30", "momento": "Manhã", "valor": 150}, {"id": 4, "dia": "30", "momento": "Tarde / Almoço", "valor": 342}, {"id": 5, "dia": "1", "momento": "Manhã / Café", "valor": 145}, {"id": 6, "dia": "1", "momento": "Tarde (2h após almoço)", "valor": 345}, {"id": 7, "dia": "2", "momento": "Café da manhã", "valor": 145}, {"id": 8, "dia": "2", "momento": "2h após café", "valor": 275}, {"id": 9, "dia": "2", "momento": "2h após almoço", "valor": 237}, {"id": 10, "dia": "2", "momento": "Noite (2h após janta)", "valor": 302}, {"id": 11, "dia": "3", "momento": "Manhã", "valor": 149}, {"id": 12, "dia": "3", "momento": "2h após café", "valor": 245}, {"id": 13, "dia": "3", "momento": "2h após janta", "valor": 245}, {"id": 14, "dia": "4", "momento": "Antes do café", "valor": 169}, {"id": 15, "dia": "4", "momento": "2h após café", "valor": 249}, {"id": 16, "dia": "5", "momento": "2h após janta", "valor": 343}, {"id": 17, "dia": "5", "momento": "Antes do café", "valor": 149}, {"id": 18, "dia": "5", "momento": "Depois do café", "valor": 249}, {"id": 19, "dia": "5", "momento": "2h após almoço", "valor": 145}, {"id": 20, "dia": "5", "momento": "2h após fanta", "valor": 373}, {"id": 21, "dia": "6", "momento": "Antes do café", "valor": 149}, {"id": 22, "dia": "6", "momento": "Depois do café", "valor": 142}, {"id": 23, "dia": "6", "momento": "Depois da janta", "valor": 239}, {"id": 24, "dia": "7", "momento": "Antes do café", "valor": 121}, {"id": 25, "dia": "7", "momento": "2h após café", "valor": 297}, {"id": 26, "dia": "7", "momento": "2h após janta", "valor": 246}, {"id": 27, "dia": "8", "momento": "Antes do café", "valor": 151}, {"id": 28, "dia": "8", "momento": "2h após café", "valor": 282}, {"id": 29, "dia": "9", "momento": "Manhã / Antes do café", "valor": 124}, {"id": 30, "dia": "9", "momento": "2h após café", "valor": 326}, {"id": 31, "dia": "9", "momento": "2h após janta", "valor": 328}, {"id": 32, "dia": "10", "momento": "Antes do café", "valor": 114}, {"id": 33, "dia": "10", "momento": "Depois do café", "valor": 149}, {"id": 34, "dia": "10", "momento": "Depois do almoço", "valor": 131}, {"id": 35, "dia": "10", "momento": "Depois da janta", "valor": 346}, {"id": 36, "dia": "11", "momento": "Antes do café", "valor": 121}, {"id": 37, "dia": "11", "momento": "Depois do almoço", "valor": 244}, {"id": 38, "dia": "11", "momento": "Depois da janta", "valor": 311}, {"id": 39, "dia": "12", "momento": "Antes do café", "valor": 127}, {"id": 40, "dia": "13", "momento": "Café + Almoço", "valor": 171}, {"id": 41, "dia": "14", "momento": "Antes do café", "valor": 181}, {"id": 42, "dia": "14", "momento": "2h após café", "valor": 328}, {"id": 43, "dia": "15", "momento": "Antes do café", "valor": 121}, {"id": 44, "dia": "16", "momento": "Antes do café", "valor": 101}, {"id": 45, "dia": "16", "momento": "2h após café", "valor": 246}, {"id": 46, "dia": "16", "momento": "2h após almoço", "valor": 183}, {"id": 47, "dia": "16", "momento": "2h após janta", "valor": 286}, {"id": 48, "dia": "17", "momento": "Antes do café", "valor": 151}, {"id": 49, "dia": "17", "momento": "Depois do café", "valor": 296}, {"id": 50, "dia": "17", "momento": "Depois do almoço", "valor": 147}, {"id": 51, "dia": "18", "momento": "Antes do café", "valor": 75}, {"id": 52, "dia": "19", "momento": "Antes do café", "valor": 139}, {"id": 53, "dia": "19", "momento": "Depois do almoço", "valor": 209}, {"id": 54, "dia": "20", "momento": "Antes do café", "valor": 178}, {"id": 55, "dia": "20", "momento": "Depois do café", "valor": 298}, {"id": 56, "dia": "21", "momento": "Antes do café", "valor": 181}, {"id": 57, "dia": "22", "momento": "Antes do café", "valor": 179}, {"id": 58, "dia": "24", "momento": "Antes do café", "valor": 218}, {"id": 59, "dia": "25", "momento": "Antes do café", "valor": 185}, {"id": 60, "dia": "25", "momento": "Depois do almoço", "valor": 245}, {"id": 523, "dia": "9 de setembro", "momento": "Glicemia", "valor": 93}, {"id": 524, "dia": "10 de setembro", "momento": "Glicemia", "valor": 163}, {"id": 525, "dia": "11 de setembro", "momento": "Glicemia", "valor": 170}, {"id": 526, "dia": "12 de setembro", "momento": "Glicemia", "valor": 135}, {"id": 527, "dia": "13 de setembro", "momento": "Glicemia", "valor": 131}, {"id": 528, "dia": "14 de setembro", "momento": "Glicemia", "valor": 111}, {"id": 529, "dia": "15 de setembro", "momento": "Glicemia", "valor": 162}, {"id": 530, "dia": "16 de setembro", "momento": "Glicemia", "valor": 134}, {"id": 531, "dia": "17 de setembro", "momento": "Glicemia", "valor": 103}, {"id": 532, "dia": "18 de setembro", "momento": "Glicemia", "valor": 129}, {"id": 533, "dia": "19 de setembro", "momento": "Glicemia", "valor": 136}
];
