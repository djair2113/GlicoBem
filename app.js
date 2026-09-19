document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('glicemiaForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addMeasurement();
  });
  updateDashboard();
});

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
  
  if (!valorInput) return;
  
  const valor = parseFloat(valorInput);
  const now = new Date();
  
  const record = {
    id: Date.now(),
    data: now.toISOString(),
    diaStr: now.toLocaleDateString('pt-BR'),
    momento: momentoSelect,
    valor: valor
  };
  
  const records = getStoredData();
  records.unshift(record);
  saveStoredData(records);
  
  showFeedback(valor);
  updateDashboard();
  document.getElementById('glicemiaForm').reset();
}

function showFeedback(valor) {
  const box = document.getElementById('feedbackBox');
  box.style.display = 'block';
  
  if (valor < 140) {
    box.className = 'alert-box alert-normal';
    box.innerHTML = '🎉 Parabéns! Diabetes normal.';
  } else if (valor >= 140 && valor <= 199) {
    box.className = 'alert-box alert-warning';
    box.innerHTML = '⚠️ Quase lá! Diabetes mediana (Atenção).';
  } else {
    box.className = 'alert-box alert-danger';
    box.innerHTML = '🚨 Fica alerta! Diabetes alta. Contate seu médico!';
  }
}

function updateDashboard() {
  const records = getStoredData();
  if (records.length === 0) {
    document.getElementById('avgTotal').innerText = '-';
    document.getElementById('avgMensal').innerText = '-';
    document.getElementById('avgTrimestral').innerText = '-';
    document.getElementById('avgAnual').innerText = '-';
    return;
  }
  
  const now = new Date();
  
  // Total
  const sumTotal = records.reduce((acc, r) => acc + r.valor, 0);
  const avgTotal = sumTotal / records.length;
  document.getElementById('avgTotal').innerText = avgTotal.toFixed(1) + ' mg/dL';
  
  // Mensal (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const mensalRecords = records.filter(r => new Date(r.data) >= thirtyDaysAgo);
  const avgMensal = mensalRecords.length > 0 ? mensalRecords.reduce((acc, r) => acc + r.valor, 0) / mensalRecords.length : avgTotal;
  document.getElementById('avgMensal').innerText = avgMensal.toFixed(1) + ' mg/dL';
  
  // Trimestral (últimos 90 dias)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(now.getDate() - 90);
  const trimestralRecords = records.filter(r => new Date(r.data) >= ninetyDaysAgo);
  const avgTrimestral = trimestralRecords.length > 0 ? trimestralRecords.reduce((acc, r) => acc + r.valor, 0) / trimestralRecords.length : avgTotal;
  document.getElementById('avgTrimestral').innerText = avgTrimestral.toFixed(1) + ' mg/dL';
  
  // Anual (últimos 365 dias)
  const yearAgo = new Date();
  yearAgo.setFullYear(now.getFullYear() - 1);
  const anualRecords = records.filter(r => new Date(r.data) >= yearAgo);
  const avgAnual = anualRecords.length > 0 ? anualRecords.reduce((acc, r) => acc + r.valor, 0) / anualRecords.length : avgTotal;
  document.getElementById('avgAnual').innerText = avgAnual.toFixed(1) + ' mg/dL';
}