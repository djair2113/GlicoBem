let pieChartInstance = null;
let barChartInstance = null;

// Lista de Mensagens Motivacionais e Inspiradoras
const FRASES_MOTIVACIONAIS = [
  { text: "📖 \"Deus é o nosso refúgio e fortaleza, socorro bem presente na hora da angústia.\"", ref: "— Salmos 46:1" },
  { text: "☀️ \"Cada novo dia é uma nova oportunidade para cuidar da sua saúde com carinho e fé!\"", ref: "— Inspiração Diária" },
  { text: "💪 \"Pequenas vitórias diárias constroem uma vida cheia de saúde e vitalidade.\"", ref: "— Motivação Martinha" },
  { text: "📖 \"Tudo posso naquele que me fortalece.\"", ref: "— Filipenses 4:13" },
  { text: "🌟 \"Sua dedicação de hoje garante a sua tranquilidade de amanhã. Continue firme!\"", ref: "— Equipe GlicoBem" }
];

document.addEventListener('DOMContentLoaded', () => {
  initAge();
  setDefaultDateTime();
  initData();
  loadRandomMotivationalMessage();
  updateDashboard();
  initQRCode();

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

function loadRandomMotivationalMessage() {
  const msgText = document.getElementById('motivationalMessage');
  const msgRef = document.getElementById('motivationalRef');
  if (msgText && msgRef) {
    const randomIndex = Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length);
    const item = FRASES_MOTIVACIONAIS[randomIndex];
    msgText.innerHTML = item.text;
    msgRef.innerHTML = item.ref;
  }
}

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

// --- ARMAZENAMENTO LOCAL (LOCALSTORAGE v8) ---
function getStoredData() {
  try {
    const data = localStorage.getItem('glicemia_records_martinha_v8');
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Erro ao ler LocalStorage:", err);
    return null;
  }
}

function saveStoredData(data) {
  try {
    localStorage.setItem('glicemia_records_martinha_v8', JSON.stringify(data));
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

  const valor = parseFloat(valorInput.value);
  const momento = momentoSelect ? momentoSelect.value : 'Glicemia';
  const dateObj = new Date(dataHoraInput.value);
  const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const record = {
    id: Date.now(),
    dia: formattedDate,
    momento: momento,
    valor: valor
  };

  let records = getStoredData() || [];
  records.unshift(record);
  saveStoredData(records);

  // Avaliação e Alerta Visual com Parâmetros
  triggerVisualFeedback(valor, momento);

  valorInput.value = '';
  setDefaultDateTime();
  updateDashboard();
}

// --- AVALIAÇÃO DE PARÂMETROS E CONFETES ---
function triggerVisualFeedback(valor, momento) {
  const isJejum = momento.toLowerCase().includes('jejum');
  const banner = document.getElementById('feedbackBanner');
  if (!banner) return;

  banner.className = 'feedback-banner';

  if (isJejum) {
    if (valor < 100) {
      // BOM / NORMAL EM JEJUM (< 100)
      banner.classList.add('success');
      banner.innerHTML = `🎉 Parabéns, Martinha! Sua glicemia em jejum de ${valor} mg/dL está perfeita!`;
      launchConfetti();
    } else if (valor <= 125) {
      // ATENÇÃO EM JEJUM (100 - 125)
      banner.classList.add('warning');
      banner.innerHTML = `⚠️ Atenção: Sua glicemia em jejum de ${valor} mg/dL está no limiar de atenção (100-125 mg/dL).`;
    } else {
      // PERIGO EM JEJUM (>= 126)
      banner.classList.add('danger');
      banner.innerHTML = `🚨 Alerta de Hiperglicemia: Glicemia em jejum elevada (${valor} mg/dL). Siga as orientações médicas!`;
    }
  } else {
    // PÓS-REFEIÇÃO / OUTROS MOMENTOS
    if (valor < 140) {
      // BOM / NORMAL PÓS-REFEIÇÃO (< 140)
      banner.classList.add('success');
      banner.innerHTML = `🎉 Excelente resultado! Glicemia de ${valor} mg/dL dentro da meta ideal (<140 mg/dL)!`;
      launchConfetti();
    } else if (valor <= 199) {
      // ATENÇÃO PÓS-REFEIÇÃO (140 - 199)
      banner.classList.add('warning');
      banner.innerHTML = `⚠️ Atenção: Glicemia de ${valor} mg/dL em estado de atenção pós-refeição (140-199 mg/dL).`;
    } else {
      // PERIGO PÓS-REFEIÇÃO (>= 200)
      banner.classList.add('danger');
      banner.innerHTML = `🚨 Alerta: Glicemia pós-refeição acima de 200 mg/dL (${valor} mg/dL). Redobre os cuidados!`;
    }
  }

  // Oculta o banner após 10 segundos
  setTimeout(() => {
    banner.classList.add('hidden');
  }, 10000);
}

function launchConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function deleteMeasurement(id) {
  const confirmacao = confirm("Tem certeza de que deseja apagar este registro de glicemia?");
  if (confirmacao) {
    let records = getStoredData() || [];
    records = records.filter(r => r.id !== id);
    saveStoredData(records);
    updateDashboard();
  }
}

// --- ATUALIZAÇÃO DO PAINEL ---
function updateDashboard() {
  const allRecords = getStoredData() || [];
  const filterSelect = document.getElementById('filtroHistorico');
  const filterValue = filterSelect ? filterSelect.value : 'todos';

  let filteredRecords = allRecords;

  if (filterValue === '10') {
    filteredRecords = allRecords.slice(0, 10);
  } else if (filterValue === '20') {
    filteredRecords = allRecords.slice(0, 20);
  } else if (filterValue === '50') {
    filteredRecords = allRecords.slice(0, 50);
  } else if (filterValue === 'mensal') {
    filteredRecords = allRecords.slice(0, 30);
  } else if (filterValue === 'trimestral') {
    filteredRecords = allRecords.slice(0, 90);
  }

  renderHistory(filteredRecords);
  renderMetrics(allRecords);
  renderCharts(filteredRecords);
}

function renderHistory(records) {
  const tbody = document.getElementById('historyBody');
  const emptyMsg = document.getElementById('emptyHistory');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!records || records.length === 0) {
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

  if (!records || records.length === 0) {
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

// --- GRÁFICOS (PIZZA E COLUNAS) ---
function renderCharts(records) {
  if (!records || records.length === 0) return;

  let normal = 0;   // < 140
  let atencao = 0;  // 140 - 180
  let alta = 0;     // > 180

  records.forEach(r => {
    if (r.valor < 140) normal++;
    else if (r.valor <= 180) atencao++;
    else alta++;
  });

  const ctxPie = document.getElementById('pieChart');
  if (ctxPie) {
    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: ['Normal (<140)', 'Atenção (140-180)', 'Elevada (>180)'],
        datasets: [{
          data: [normal, atencao, alta],
          backgroundColor: ['#4caf50', '#ff9800', '#f44336']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#ffffff' } } }
      }
    });
  }

  const ctxBar = document.getElementById('barChart');
  if (ctxBar) {
    if (barChartInstance) barChartInstance.destroy();

    const displayRecords = records.slice(0, 20).reverse();
    const labels = displayRecords.map(r => r.dia);
    const dataVals = displayRecords.map(r => r.valor);

    barChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Glicemia (mg/dL)',
          data: dataVals,
          backgroundColor: '#64b5f6'
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { ticks: { color: '#cccccc' } },
          y: { ticks: { color: '#cccccc' } }
        },
        plugins: { legend: { labels: { color: '#ffffff' } } }
      }
    });
  }
}

// --- EXPORTAÇÃO CSV PARA O MÉDICO ---
function exportCSV() {
  const records = getStoredData() || [];
  if (records.length === 0) return alert('Nenhum dado para exportar.');

  let csvContent = "data:text/csv;charset=utf-8,ID,Data,Momento,Valor (mg/dL)\n";
  records.forEach(r => {
    csvContent += `${r.id},"${r.dia}","${r.momento}",${r.valor}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "relatorio_glicemia_martinha.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- GERADOR DE QR CODE ---
function initQRCode() {
  const qrDiv = document.getElementById("qrcode");
  if (qrDiv) {
    qrDiv.innerHTML = "";
    new QRCode(qrDiv, {
      text: window.location.href,
      width: 140,
      height: 140
    });
  }
}

function toggleQRCode() {
  const container = document.getElementById("qrCodeContainer");
  if (container) {
    container.classList.toggle("hidden");
  }
}

// Histórico com TODOS os 533 registros
const HISTORICO_INICIAL = [
  {"id": 533, "dia": "19 de setembro", "momento": "Glicemia", "valor": 136},
  {"id": 532, "dia": "18 de setembro", "momento": "Glicemia", "valor": 129},
  {"id": 531, "dia": "17 de setembro", "momento": "Glicemia", "valor": 103},
  {"id": 530, "dia": "16 de setembro", "momento": "Glicemia", "valor": 134},
  {"id": 529, "dia": "15 de setembro", "momento": "Glicemia", "valor": 162},
  {"id": 528, "dia": "14 de setembro", "momento": "Glicemia", "valor": 111},
  {"id": 527, "dia": "13 de setembro", "momento": "Glicemia", "valor": 131},
  {"id": 526, "dia": "12 de setembro", "momento": "Glicemia", "valor": 135},
  {"id": 525, "dia": "11 de setembro", "momento": "Glicemia", "valor": 170},
  {"id": 524, "dia": "10 de setembro", "momento": "Glicemia", "valor": 163},
  {"id": 523, "dia": "9 de setembro", "momento": "Glicemia", "valor": 93},
  {"id": 522, "dia": "8 de setembro", "momento": "Glicemia", "valor": 113},
  {"id": 521, "dia": "7 de setembro", "momento": "Glicemia", "valor": 152},
  {"id": 520, "dia": "6 de setembro", "momento": "Glicemia", "valor": 130},
  {"id": 519, "dia": "5 de setembro", "momento": "Glicemia", "valor": 134},
  {"id": 518, "dia": "4 de setembro", "momento": "Glicemia", "valor": 130},
  {"id": 517, "dia": "3 de setembro", "momento": "Glicemia", "valor": 135},
  {"id": 516, "dia": "2 de setembro", "momento": "Glicemia", "valor": 152},
  {"id": 515, "dia": "1 de setembro", "momento": "Glicemia", "valor": 136},
  {"id": 514, "dia": "31 de agosto", "momento": "Glicemia", "valor": 130},
  {"id": 513, "dia": "30 de agosto", "momento": "Glicemia", "valor": 158},
  {"id": 512, "dia": "29 de agosto", "momento": "Glicemia", "valor": 152},
  {"id": 511, "dia": "28 de agosto", "momento": "Glicemia", "valor": 163},
  {"id": 510, "dia": "27 de agosto", "momento": "Glicemia", "valor": 180},
  {"id": 509, "dia": "26 de agosto", "momento": "Glicemia", "valor": 97},
  {"id": 508, "dia": "25 de agosto", "momento": "Glicemia", "valor": 205},
  {"id": 507, "dia": "24 de agosto", "momento": "Glicemia", "valor": 160},
  {"id": 506, "dia": "23 de agosto", "momento": "Glicemia", "valor": 164},
  {"id": 505, "dia": "22 de agosto", "momento": "Glicemia", "valor": 164},
  {"id": 504, "dia": "21 de agosto", "momento": "Glicemia", "valor": 145},
  {"id": 503, "dia": "19 de agosto", "momento": "Glicemia", "valor": 127},
  {"id": 502, "dia": "18 de agosto", "momento": "Glicemia", "valor": 146},
  {"id": 501, "dia": "17 de agosto", "momento": "Glicemia", "valor": 164},
  {"id": 500, "dia": "16 de agosto", "momento": "Glicemia", "valor": 153},
  {"id": 499, "dia": "15 de agosto", "momento": "Glicemia", "valor": 131},
  {"id": 498, "dia": "14 de agosto", "momento": "Glicemia", "valor": 143},
  {"id": 497, "dia": "13 de agosto (2)", "momento": "Glicemia", "valor": 103},
  {"id": 496, "dia": "13 de agosto", "momento": "Glicemia", "valor": 153},
  {"id": 495, "dia": "12 de agosto", "momento": "Glicemia", "valor": 138},
  {"id": 494, "dia": "10 de agosto", "momento": "Glicemia", "valor": 139},
  {"id": 493, "dia": "9 de agosto", "momento": "Glicemia", "valor": 95},
  {"id": 492, "dia": "8 de agosto", "momento": "Glicemia", "valor": 148},
  {"id": 491, "dia": "7 de agosto", "momento": "Glicemia", "valor": 194},
  {"id": 490, "dia": "6 de agosto", "momento": "Glicemia", "valor": 128},
  {"id": 489, "dia": "5 de agosto", "momento": "Glicemia", "valor": 174},
  {"id": 488, "dia": "4 de agosto", "momento": "Glicemia", "valor": 179},
  {"id": 487, "dia": "3 de agosto", "momento": "Glicemia", "valor": 147},
  {"id": 486, "dia": "2 de agosto", "momento": "Glicemia", "valor": 138},
  {"id": 485, "dia": "1 de agosto", "momento": "Glicemia", "valor": 161},
  {"id": 484, "dia": "31 de julho", "momento": "Glicemia", "valor": 131},
  {"id": 483, "dia": "30 de julho", "momento": "Glicemia", "valor": 139},
  {"id": 482, "dia": "29 de julho", "momento": "Glicemia", "valor": 127},
  {"id": 481, "dia": "27 de julho", "momento": "Glicemia", "valor": 156},
  {"id": 480, "dia": "26 de julho", "momento": "Glicemia", "valor": 99},
  {"id": 479, "dia": "25 de julho", "momento": "Glicemia", "valor": 99},
  {"id": 478, "dia": "24 de julho", "momento": "Glicemia", "valor": 146},
  {"id": 477, "dia": "23 de julho", "momento": "Glicemia", "valor": 129},
  {"id": 476, "dia": "22 de julho", "momento": "Glicemia", "valor": 109},
  {"id": 475, "dia": "21 de julho", "momento": "Glicemia", "valor": 146},
  {"id": 474, "dia": "20 de julho", "momento": "Glicemia", "valor": 106},
  {"id": 473, "dia": "18 de julho", "momento": "Glicemia", "valor": 133},
  {"id": 472, "dia": "17 de julho", "momento": "Glicemia", "valor": 132},
  {"id": 471, "dia": "16 de julho", "momento": "Glicemia", "valor": 163},
  {"id": 470, "dia": "15 de julho", "momento": "Glicemia", "valor": 174},
  {"id": 469, "dia": "14 de julho", "momento": "Glicemia", "valor": 187},
  {"id": 468, "dia": "13 de julho", "momento": "Glicemia", "valor": 117},
  {"id": 467, "dia": "12 de julho", "momento": "Glicemia", "valor": 122},
  {"id": 466, "dia": "11 de julho", "momento": "Glicemia", "valor": 123},
  {"id": 465, "dia": "10 de julho", "momento": "Glicemia", "valor": 93},
  {"id": 464, "dia": "9 de julho", "momento": "Glicemia", "valor": 198},
  {"id": 463, "dia": "8 de julho", "momento": "Glicemia", "valor": 124},
  {"id": 462, "dia": "6 de julho", "momento": "Glicemia", "valor": 184},
  {"id": 461, "dia": "5 de julho", "momento": "Glicemia", "valor": 157},
  {"id": 460, "dia": "4 de julho", "momento": "Glicemia", "valor": 117},
  {"id": 459, "dia": "3 de julho", "momento": "Glicemia", "valor": 151},
  {"id": 458, "dia": "2 de julho", "momento": "Glicemia", "valor": 141},
  {"id": 457, "dia": "1 de julho", "momento": "Glicemia", "valor": 162},
  {"id": 456, "dia": "30 de junho", "momento": "Glicemia", "valor": 170},
  {"id": 455, "dia": "29 de junho", "momento": "Glicemia", "valor": 166},
  {"id": 454, "dia": "28 de junho", "momento": "Glicemia", "valor": 203},
  {"id": 453, "dia": "26 de junho", "momento": "Glicemia", "valor": 153},
  {"id": 452, "dia": "25 de junho", "momento": "Glicemia", "valor": 173},
  {"id": 451, "dia": "24 de junho", "momento": "Glicemia", "valor": 140},
  {"id": 450, "dia": "23 de junho", "momento": "Glicemia", "valor": 175},
  {"id": 449, "dia": "22 de junho", "momento": "Glicemia", "valor": 149},
  {"id": 448, "dia": "21 de junho", "momento": "Glicemia", "valor": 148},
  {"id": 447, "dia": "20 de junho", "momento": "Glicemia", "valor": 152},
  {"id": 446, "dia": "19 de junho", "momento": "Glicemia", "valor": 182},
  {"id": 445, "dia": "18 de junho", "momento": "Glicemia", "valor": 135},
  {"id": 444, "dia": "17 de junho", "momento": "Glicemia", "valor": 140},
  {"id": 443, "dia": "16 de junho", "momento": "Glicemia", "valor": 191},
  {"id": 442, "dia": "15 de junho", "momento": "Glicemia", "valor": 128},
  {"id": 441, "dia": "14 de junho", "momento": "Glicemia", "valor": 159},
  {"id": 440, "dia": "12 de junho", "momento": "Glicemia", "valor": 143},
  {"id": 439, "dia": "11 de junho", "momento": "Glicemia", "valor": 117},
  {"id": 438, "dia": "10 de junho", "momento": "Glicemia", "valor": 132},
  {"id": 437, "dia": "9 de junho", "momento": "Glicemia", "valor": 198},
  {"id": 436, "dia": "8 de junho", "momento": "Glicemia", "valor": 117},
  {"id": 435, "dia": "7 de junho", "momento": "Glicemia", "valor": 126},
  {"id": 434, "dia": "6 de junho", "momento": "Glicemia", "valor": 146},
  {"id": 433, "dia": "5 de junho", "momento": "Glicemia", "valor": 155},
  {"id": 432, "dia": "4 de junho", "momento": "Glicemia", "valor": 168},
  {"id": 431, "dia": "3 de junho", "momento": "Glicemia", "valor": 152},
  {"id": 430, "dia": "2 de junho", "momento": "Glicemia", "valor": 193},
  {"id": 429, "dia": "1 de junho", "momento": "Glicemia", "valor": 177},
  {"id": 428, "dia": "31 de maio", "momento": "Glicemia", "valor": 154},
  {"id": 427, "dia": "30 de maio", "momento": "Glicemia", "valor": 132},
  {"id": 426, "dia": "29 de maio", "momento": "Glicemia", "valor": 142},
  {"id": 425, "dia": "28 de maio", "momento": "Glicemia", "valor": 150},
  {"id": 424, "dia": "26 de maio", "momento": "Glicemia", "valor": 158},
  {"id": 423, "dia": "25 de maio", "momento": "Glicemia", "valor": 148},
  {"id": 422, "dia": "24 de maio", "momento": "Glicemia", "valor": 150},
  {"id": 421, "dia": "23 de maio", "momento": "Glicemia", "valor": 142},
  {"id": 420, "dia": "22 de maio", "momento": "Glicemia", "valor": 142},
  {"id": 419, "dia": "20 de maio", "momento": "Glicemia", "valor": 159},
  {"id": 418, "dia": "19 de maio", "momento": "Glicemia", "valor": 127},
  {"id": 417, "dia": "18 de maio", "momento": "Glicemia", "valor": 146},
  {"id": 416, "dia": "17 de maio", "momento": "Glicemia", "valor": 136},
  {"id": 415, "dia": "16 de maio", "momento": "Glicemia", "valor": 154},
  {"id": 414, "dia": "15 de maio", "momento": "Glicemia", "valor": 152},
  {"id": 413, "dia": "14", "momento": "Antes do café", "valor": 108},
  {"id": 412, "dia": "13", "momento": "Antes do café", "valor": 135},
  {"id": 411, "dia": "12", "momento": "Antes do café", "valor": 153},
  {"id": 410, "dia": "11", "momento": "Antes do café", "valor": 87},
  {"id": 409, "dia": "10", "momento": "Antes do café", "valor": 159},
  {"id": 408, "dia": "9", "momento": "Antes do café", "valor": 158},
  {"id": 407, "dia": "8", "momento": "Antes do café", "valor": 166},
  {"id": 406, "dia": "7", "momento": "Antes do café", "valor": 106},
  {"id": 405, "dia": "6", "momento": "Antes do café", "valor": 153},
  {"id": 404, "dia": "5", "momento": "Antes do café", "valor": 117},
  {"id": 403, "dia": "4", "momento": "Antes do café", "valor": 104},
  {"id": 402, "dia": "3", "momento": "Antes do café", "valor": 125},
  {"id": 401, "dia": "2", "momento": "Antes do café", "valor": 129},
  {"id": 400, "dia": "1", "momento": "Antes do café (1º Janeiro)", "valor": 133},
  {"id": 399, "dia": "31", "momento": "Antes do café", "valor": 122},
  {"id": 398, "dia": "30", "momento": "Antes do café", "valor": 162},
  {"id": 397, "dia": "29", "momento": "Antes do café", "valor": 140},
  {"id": 396, "dia": "28", "momento": "Antes do café", "valor": 128},
  {"id": 395, "dia": "27", "momento": "Antes do café", "valor": 120},
  {"id": 394, "dia": "26", "momento": "Antes do café", "valor": 123},
  {"id": 393, "dia": "25", "momento": "Antes do café", "valor": 197},
  {"id": 392, "dia": "23", "momento": "Antes do café", "valor": 110},
  {"id": 391, "dia": "22", "momento": "Antes do café", "valor": 123},
  {"id": 390, "dia": "21", "momento": "Antes do café", "valor": 204},
  {"id": 389, "dia": "20", "momento": "Antes do café", "valor": 95},
  {"id": 388, "dia": "19", "momento": "Antes do café (Dezembro)", "valor": 153},
  {"id": 387, "dia": "18", "momento": "Antes do café", "valor": 137},
  {"id": 386, "dia": "17", "momento": "Antes do café", "valor": 116},
  {"id": 385, "dia": "16", "momento": "Antes do café", "valor": 168},
  {"id": 384, "dia": "15", "momento": "Antes do café", "valor": 289},
  {"id": 383, "dia": "14", "momento": "Antes do café", "valor": 159},
  {"id": 382, "dia": "13", "momento": "Antes do café", "valor": 101},
  {"id": 381, "dia": "12", "momento": "Antes do café", "valor": 154},
  {"id": 380, "dia": "10", "momento": "Antes do café", "valor": 100},
  {"id": 379, "dia": "9", "momento": "Antes do café", "valor": 92},
  {"id": 378, "dia": "8", "momento": "Antes do café", "valor": 120},
  {"id": 377, "dia": "7", "momento": "Antes do café", "valor": 165},
  {"id": 376, "dia": "6", "momento": "Antes do café", "valor": 80},
  {"id": 375, "dia": "5", "momento": "Antes do café", "valor": 112},
  {"id": 374, "dia": "4", "momento": "Antes do café", "valor": 136},
  {"id": 373, "dia": "3", "momento": "Antes do café", "valor": 117},
  {"id": 372, "dia": "1", "momento": "Antes do café (Dezembro)", "valor": 155},
  {"id": 371, "dia": "30", "momento": "Antes do café", "valor": 113},
  {"id": 370, "dia": "29", "momento": "Antes do café", "valor": 121},
  {"id": 369, "dia": "28", "momento": "Antes do café", "valor": 130},
  {"id": 368, "dia": "27", "momento": "Antes do café", "valor": 136},
  {"id": 367, "dia": "26", "momento": "Antes do café", "valor": 106},
  {"id": 366, "dia": "25", "momento": "Antes do café", "valor": 141},
  {"id": 365, "dia": "24", "momento": "Antes do café", "valor": 144},
  {"id": 364, "dia": "23", "momento": "Antes do café", "valor": 114},
  {"id": 363, "dia": "22", "momento": "Antes do café", "valor": 107},
  {"id": 362, "dia": "21", "momento": "Antes do café", "valor": 135},
  {"id": 361, "dia": "20", "momento": "Antes do café (Novembro)", "valor": 135},
  {"id": 360, "dia": "18", "momento": "Antes do café", "valor": 115},
  {"id": 359, "dia": "17", "momento": "Antes do café", "valor": 136},
  {"id": 358, "dia": "16", "momento": "Antes do café", "valor": 144},
  {"id": 357, "dia": "15", "momento": "Antes do café", "valor": 65},
  {"id": 356, "dia": "14", "momento": "Antes do café", "valor": 113},
  {"id": 355, "dia": "13", "momento": "Antes do café", "valor": 132},
  {"id": 354, "dia": "12", "momento": "Antes do café", "valor": 109},
  {"id": 353, "dia": "11", "momento": "Antes do café", "valor": 158},
  {"id": 352, "dia": "10", "momento": "Antes do café", "valor": 106},
  {"id": 351, "dia": "9", "momento": "Antes do café", "valor": 185},
  {"id": 350, "dia": "8", "momento": "Antes do café", "valor": 133},
  {"id": 349, "dia": "7", "momento": "Antes do café", "valor": 107},
  {"id": 348, "dia": "6", "momento": "Antes do café", "valor": 222},
  {"id": 347, "dia": "5", "momento": "Antes do café", "valor": 133},
  {"id": 346, "dia": "4", "momento": "Antes do café", "valor": 166},
  {"id": 345, "dia": "3", "momento": "Antes do café", "valor": 182},
  {"id": 344, "dia": "2", "momento": "Antes do café", "valor": 171},
  {"id": 343, "dia": "1", "momento": "Antes do café (Novembro)", "valor": 100},
  {"id": 342, "dia": "31", "momento": "Antes do café", "valor": 182},
  {"id": 341, "dia": "30", "momento": "Antes do café", "valor": 150},
  {"id": 340, "dia": "29", "momento": "Antes do café", "valor": 128},
  {"id": 339, "dia": "28", "momento": "Antes do café", "valor": 129},
  {"id": 338, "dia": "27", "momento": "Antes do café", "valor": 171},
  {"id": 337, "dia": "26", "momento": "Antes do café", "valor": 146},
  {"id": 336, "dia": "25", "momento": "Antes do café", "valor": 111},
  {"id": 335, "dia": "24", "momento": "Antes do café", "valor": 177},
  {"id": 334, "dia": "23", "momento": "Antes do café (Outubro)", "valor": 185},
  {"id": 333, "dia": "22", "momento": "Antes do café", "valor": 213},
  {"id": 332, "dia": "21", "momento": "Antes do café", "valor": 312},
  {"id": 331, "dia": "20", "momento": "Antes do café", "valor": 138},
  {"id": 330, "dia": "19", "momento": "Depois do café", "valor": 335},
  {"id": 329, "dia": "18", "momento": "Antes do café", "valor": 127},
  {"id": 328, "dia": "17", "momento": "Antes do café", "valor": 235},
  {"id": 327, "dia": "16", "momento": "Antes do café", "valor": 166},
  {"id": 326, "dia": "15", "momento": "Antes do café", "valor": 129},
  {"id": 325, "dia": "14", "momento": "Antes do café", "valor": 200},
  {"id": 324, "dia": "13", "momento": "Antes do café", "valor": 133},
  {"id": 323, "dia": "12", "momento": "Antes do café", "valor": 153},
  {"id": 322, "dia": "11", "momento": "Antes do café", "valor": 88},
  {"id": 321, "dia": "10", "momento": "Antes do café", "valor": 172},
  {"id": 320, "dia": "9", "momento": "Antes do café", "valor": 145},
  {"id": 319, "dia": "8", "momento": "Antes do café", "valor": 117},
  {"id": 318, "dia": "7", "momento": "Antes do café", "valor": 160},
  {"id": 317, "dia": "6", "momento": "Antes do café", "valor": 155},
  {"id": 316, "dia": "5", "momento": "Antes do café", "valor": 166},
  {"id": 315, "dia": "4", "momento": "Antes do café", "valor": 150},
  {"id": 314, "dia": "3", "momento": "Antes do café", "valor": 204},
  {"id": 313, "dia": "2", "momento": "Antes do café", "valor": 162},
  {"id": 312, "dia": "1", "momento": "Antes do café (Outubro)", "valor": 150},
  {"id": 311, "dia": "29", "momento": "Antes do café", "valor": 162},
  {"id": 310, "dia": "28", "momento": "Antes do café", "valor": 142},
  {"id": 309, "dia": "27", "momento": "Antes do café", "valor": 131},
  {"id": 308, "dia": "26", "momento": "Antes do café", "valor": 174},
  {"id": 307, "dia": "25", "momento": "Antes do café (Setembro)", "valor": 115},
  {"id": 306, "dia": "24", "momento": "Antes do café", "valor": 132},
  {"id": 305, "dia": "23", "momento": "Antes do café", "valor": 140},
  {"id": 304, "dia": "22", "momento": "Antes do café", "valor": 132},
  {"id": 303, "dia": "21", "momento": "Antes do café", "valor": 143},
  {"id": 302, "dia": "20", "momento": "Antes do café", "valor": 110},
  {"id": 301, "dia": "19", "momento": "Antes do café", "valor": 172},
  {"id": 300, "dia": "18", "momento": "Antes do café", "valor": 116},
  {"id": 299, "dia": "17", "momento": "Antes do café", "valor": 162},
  {"id": 298, "dia": "16", "momento": "Antes do café (Setembro)", "valor": 172},
  {"id": 297, "dia": "28", "momento": "Antes do café", "valor": 189},
  {"id": 296, "dia": "26", "momento": "Depois da janta", "valor": 165},
  {"id": 295, "dia": "26", "momento": "Antes do café", "valor": 333},
  {"id": 294, "dia": "25", "momento": "Antes do café", "valor": 133},
  {"id": 293, "dia": "24", "momento": "Antes do café", "valor": 149},
  {"id": 292, "dia": "23", "momento": "Antes do café", "valor": 142},
  {"id": 291, "dia": "22", "momento": "Antes do café", "valor": 157},
  {"id": 290, "dia": "21", "momento": "Depois do almoço", "valor": 128},
  {"id": 289, "dia": "21", "momento": "Antes do café", "valor": 248},
  {"id": 288, "dia": "20", "momento": "Antes do café", "valor": 170},
  {"id": 287, "dia": "19", "momento": "Antes do café", "valor": 252},
  {"id": 286, "dia": "18", "momento": "Antes do café", "valor": 175},
  {"id": 285, "dia": "17", "momento": "Antes do café", "valor": 202},
  {"id": 284, "dia": "16", "momento": "Antes do café", "valor": 142},
  {"id": 283, "dia": "15", "momento": "Antes do café", "valor": 195},
  {"id": 282, "dia": "14", "momento": "Antes do café", "valor": 158},
  {"id": 281, "dia": "13", "momento": "Antes do café (13 Agosto)", "valor": 145},
  {"id": 280, "dia": "11", "momento": "Antes do café", "valor": 254},
  {"id": 279, "dia": "10", "momento": "Antes do café", "valor": 148},
  {"id": 278, "dia": "9", "momento": "Antes do café", "valor": 179},
  {"id": 277, "dia": "8", "momento": "Antes do café", "valor": 155},
  {"id": 276, "dia": "7", "momento": "Antes do café", "valor": 142},
  {"id": 275, "dia": "6", "momento": "Antes do café", "valor": 252},
  {"id": 274, "dia": "5", "momento": "Antes do café", "valor": 150},
  {"id": 273, "dia": "4", "momento": "Antes do café", "valor": 206},
  {"id": 272, "dia": "3", "momento": "Antes do café", "valor": 182},
  {"id": 271, "dia": "2", "momento": "Antes do café", "valor": 154},
  {"id": 270, "dia": "1", "momento": "Antes do café (1º Agosto)", "valor": 157},
  {"id": 269, "dia": "30", "momento": "Antes do café", "valor": 236},
  {"id": 268, "dia": "29", "momento": "Antes do café", "valor": 185},
  {"id": 267, "dia": "28", "momento": "Antes do café", "valor": 219},
  {"id": 266, "dia": "26", "momento": "Antes do café", "valor": 187},
  {"id": 265, "dia": "25", "momento": "Antes do café", "valor": 123},
  {"id": 264, "dia": "24", "momento": "Antes do café", "valor": 155},
  {"id": 263, "dia": "24", "momento": "Antes do café", "valor": 169},
  {"id": 262, "dia": "23", "momento": "Antes do café", "valor": 124},
  {"id": 261, "dia": "22", "momento": "Antes do café", "valor": 172},
  {"id": 260, "dia": "21", "momento": "Antes do café", "valor": 155},
  {"id": 259, "dia": "19", "momento": "Antes do café", "valor": 123},
  {"id": 258, "dia": "18", "momento": "Antes do café", "valor": 166},
  {"id": 257, "dia": "16", "momento": "Antes do café", "valor": 132},
  {"id": 256, "dia": "15", "momento": "Antes do café", "valor": 146},
  {"id": 255, "dia": "13", "momento": "Antes do café (Julho)", "valor": 276},
  {"id": 254, "dia": "12", "momento": "Antes do café", "valor": 136},
  {"id": 253, "dia": "12", "momento": "Antes do café", "valor": 185},
  {"id": 252, "dia": "11", "momento": "Antes do café", "valor": 232},
  {"id": 251, "dia": "10", "momento": "Antes do café", "valor": 152},
  {"id": 250, "dia": "8", "momento": "Antes do café", "valor": 138},
  {"id": 249, "dia": "7", "momento": "Antes do café", "valor": 132},
  {"id": 248, "dia": "6", "momento": "Antes do café", "valor": 142},
  {"id": 247, "dia": "5", "momento": "Antes do café", "valor": 102},
  {"id": 246, "dia": "4", "momento": "Antes do café", "valor": 142},
  {"id": 245, "dia": "3", "momento": "Antes do café", "valor": 132},
  {"id": 244, "dia": "2", "momento": "Antes do café", "valor": 120},
  {"id": 243, "dia": "1", "momento": "Antes do café", "valor": 166},
  {"id": 242, "dia": "30", "momento": "Antes do café", "valor": 128},
  {"id": 241, "dia": "29", "momento": "Antes do café", "valor": 131},
  {"id": 240, "dia": "28", "momento": "Antes do café", "valor": 121},
  {"id": 239, "dia": "27", "momento": "Antes do café", "valor": 125},
  {"id": 238, "dia": "26", "momento": "Antes do café", "valor": 151},
  {"id": 237, "dia": "25", "momento": "Antes do café", "valor": 121},
  {"id": 236, "dia": "24", "momento": "Antes do café", "valor": 121},
  {"id": 235, "dia": "23", "momento": "Antes do café", "valor": 112},
  {"id": 234, "dia": "22", "momento": "Antes do café", "valor": 104},
  {"id": 233, "dia": "21", "momento": "Antes do café", "valor": 145},
  {"id": 232, "dia": "20", "momento": "Antes do café", "valor": 111},
  {"id": 231, "dia": "19", "momento": "Antes do café", "valor": 103},
  {"id": 230, "dia": "18", "momento": "Antes do café", "valor": 94},
  {"id": 229, "dia": "17", "momento": "Antes do café", "valor": 152},
  {"id": 228, "dia": "16", "momento": "Antes do café (Junho)", "valor": 146},
  {"id": 227, "dia": "14", "momento": "Antes do café", "valor": 104},
  {"id": 226, "dia": "13", "momento": "Antes do café", "valor": 127},
  {"id": 225, "dia": "12", "momento": "Antes do café", "valor": 98},
  {"id": 224, "dia": "11", "momento": "Antes do café", "valor": 187},
  {"id": 223, "dia": "10", "momento": "Antes do café", "valor": 191},
  {"id": 222, "dia": "9", "momento": "Antes do café", "valor": 188},
  {"id": 221, "dia": "8", "momento": "Antes do café", "valor": 130},
  {"id": 220, "dia": "7", "momento": "Antes do café", "valor": 110},
  {"id": 219, "dia": "6", "momento": "Antes do café", "valor": 150},
  {"id": 218, "dia": "5", "momento": "Antes do café", "valor": 145},
  {"id": 217, "dia": "4", "momento": "Antes do café", "valor": 123},
  {"id": 216, "dia": "3", "momento": "Antes do café", "valor": 139},
  {"id": 215, "dia": "2", "momento": "Antes do café", "valor": 169},
  {"id": 214, "dia": "1", "momento": "Antes do café", "valor": 138},
  {"id": 213, "dia": "31", "momento": "Antes do café", "valor": 146},
  {"id": 212, "dia": "30", "momento": "Antes do café", "valor": 226},
  {"id": 211, "dia": "29", "momento": "Antes do café", "valor": 191},
  {"id": 210, "dia": "28", "momento": "Antes do café", "valor": 164},
  {"id": 209, "dia": "27", "momento": "Antes do café", "valor": 214},
  {"id": 208, "dia": "26", "momento": "Antes do café", "valor": 200},
  {"id": 207, "dia": "25", "momento": "Antes do café", "valor": 224},
  {"id": 206, "dia": "24", "momento": "Antes do café", "valor": 171},
  {"id": 205, "dia": "23", "momento": "Antes do café", "valor": 200},
  {"id": 204, "dia": "22", "momento": "Antes do café", "valor": 131},
  {"id": 203, "dia": "21", "momento": "Antes do café", "valor": 140},
  {"id": 202, "dia": "20", "momento": "Antes do café", "valor": 211},
  {"id": 201, "dia": "19", "momento": "Antes do café", "valor": 198},
  {"id": 200, "dia": "18", "momento": "Antes do café", "valor": 140},
  {"id": 199, "dia": "17", "momento": "Antes do café", "valor": 160},
  {"id": 198, "dia": "16", "momento": "Antes do café", "valor": 189},
  {"id": 197, "dia": "15", "momento": "Antes do café", "valor": 207},
  {"id": 196, "dia": "14", "momento": "Antes do café", "valor": 198},
  {"id": 195, "dia": "13", "momento": "Antes do café", "valor": 193},
  {"id": 194, "dia": "12", "momento": "Antes do café", "valor": 169},
  {"id": 193, "dia": "11", "momento": "Antes do café", "valor": 95},
  {"id": 192, "dia": "10", "momento": "Antes do café", "valor": 179},
  {"id": 191, "dia": "9", "momento": "Antes do café", "valor": 252},
  {"id": 190, "dia": "8", "momento": "Antes do café", "valor": 256},
  {"id": 189, "dia": "7", "momento": "Antes do café", "valor": 269},
  {"id": 188, "dia": "6", "momento": "Antes do café", "valor": 338},
  {"id": 187, "dia": "5", "momento": "Antes do café", "valor": 288},
  {"id": 186, "dia": "4", "momento": "Antes do café", "valor": 190},
  {"id": 185, "dia": "3", "momento": "Antes do café", "valor": 150},
  {"id": 184, "dia": "2", "momento": "Antes do café", "valor": 163},
  {"id": 183, "dia": "1", "momento": "Antes do café (Maio)", "valor": 113},
  {"id": 182, "dia": "30", "momento": "Antes do café", "valor": 179},
  {"id": 181, "dia": "29", "momento": "Antes do café", "valor": 209},
  {"id": 180, "dia": "28", "momento": "Antes do café", "valor": 198},
  {"id": 179, "dia": "27", "momento": "Antes do café", "valor": 289},
  {"id": 178, "dia": "26", "momento": "Antes do café", "valor": 198},
  {"id": 177, "dia": "25", "momento": "Antes do café", "valor": 193},
  {"id": 176, "dia": "23", "momento": "Antes do café", "valor": 192},
  {"id": 175, "dia": "22", "momento": "Antes do café", "valor": 183},
  {"id": 174, "dia": "21", "momento": "Antes do café", "valor": 210},
  {"id": 173, "dia": "19", "momento": "Antes do café", "valor": 179},
  {"id": 172, "dia": "18", "momento": "Antes do café", "valor": 227},
  {"id": 171, "dia": "17", "momento": "Antes do café", "valor": 269},
  {"id": 170, "dia": "16", "momento": "Antes do café", "valor": 210},
  {"id": 169, "dia": "15", "momento": "Antes do café", "valor": 169},
  {"id": 168, "dia": "14", "momento": "Antes do café", "valor": 185},
  {"id": 167, "dia": "13", "momento": "Antes do café", "valor": 172},
  {"id": 166, "dia": "12", "momento": "Antes do café", "valor": 113},
  {"id": 165, "dia": "11", "momento": "Antes do café", "valor": 172},
  {"id": 164, "dia": "10", "momento": "Antes do café", "valor": 150},
  {"id": 163, "dia": "9", "momento": "Antes do café", "valor": 95},
  {"id": 162, "dia": "8", "momento": "Antes do café", "valor": 148},
  {"id": 161, "dia": "7", "momento": "Antes do café", "valor": 137},
  {"id": 160, "dia": "6", "momento": "Antes do café", "valor": 115},
  {"id": 159, "dia": "5", "momento": "Antes do café", "valor": 162},
  {"id": 158, "dia": "4", "momento": "Antes do café", "valor": 122},
  {"id": 157, "dia": "3", "momento": "Antes do café", "valor": 140},
  {"id": 156, "dia": "2", "momento": "Antes do café (Abril)", "valor": 142},
  {"id": 155, "dia": "31", "momento": "Antes do café", "valor": 130},
  {"id": 154, "dia": "29", "momento": "Antes do café", "valor": 179},
  {"id": 153, "dia": "28", "momento": "Antes do café", "valor": 149},
  {"id": 152, "dia": "27", "momento": "Antes do café", "valor": 169},
  {"id": 151, "dia": "26", "momento": "Antes do café", "valor": 142},
  {"id": 150, "dia": "25", "momento": "Antes do café", "valor": 198},
  {"id": 149, "dia": "23", "momento": "Antes do café", "valor": 130},
  {"id": 148, "dia": "15", "momento": "Antes do café", "valor": 200},
  {"id": 147, "dia": "14", "momento": "Antes do café", "valor": 130},
  {"id": 146, "dia": "13", "momento": "Antes do café", "valor": 138},
  {"id": 145, "dia": "12", "momento": "Antes do café", "valor": 131},
  {"id": 144, "dia": "11", "momento": "Antes do café", "valor": 190},
  {"id": 143, "dia": "10", "momento": "Antes do café", "valor": 160},
  {"id": 142, "dia": "9", "momento": "Antes do café", "valor": 188},
  {"id": 141, "dia": "8", "momento": "Antes do café", "valor": 144},
  {"id": 140, "dia": "7", "momento": "Antes do café", "valor": 155},
  {"id": 139, "dia": "6", "momento": "Antes do café", "valor": 134},
  {"id": 138, "dia": "5", "momento": "Antes do café", "valor": 134},
  {"id": 137, "dia": "4", "momento": "Antes do café", "valor": 132},
  {"id": 136, "dia": "3", "momento": "Antes do café", "valor": 125},
  {"id": 135, "dia": "2", "momento": "Antes do café", "valor": 140},
  {"id": 134, "dia": "1", "momento": "Antes do café", "valor": 138},
  {"id": 133, "dia": "28", "momento": "Antes do café", "valor": 108},
  {"id": 132, "dia": "27", "momento": "Antes do café", "valor": 227},
  {"id": 131, "dia": "25", "momento": "Antes do café", "valor": 187},
  {"id": 130, "dia": "24", "momento": "Antes do café", "valor": 146},
  {"id": 129, "dia": "23", "momento": "Antes do café", "valor": 179},
  {"id": 128, "dia": "22", "momento": "Antes do café", "valor": 149},
  {"id": 127, "dia": "21", "momento": "Antes do café", "valor": 130},
  {"id": 126, "dia": "20", "momento": "Antes do café", "valor": 198},
  {"id": 125, "dia": "19", "momento": "Antes do café", "valor": 155},
  {"id": 124, "dia": "18", "momento": "Antes do café", "valor": 178},
  {"id": 123, "dia": "17", "momento": "Antes do café", "valor": 218},
  {"id": 122, "dia": "16", "momento": "Antes do café", "valor": 187},
  {"id": 121, "dia": "15", "momento": "Antes do café", "valor": 166},
  {"id": 120, "dia": "14", "momento": "Antes do café", "valor": 170},
  {"id": 119, "dia": "13", "momento": "Antes do café", "valor": 185},
  {"id": 118, "dia": "12", "momento": "Antes do café", "valor": 152},
  {"id": 117, "dia": "11", "momento": "Antes do café", "valor": 184},
  {"id": 116, "dia": "10", "momento": "Antes do café", "valor": 155},
  {"id": 115, "dia": "9", "momento": "Antes do café", "valor": 248},
  {"id": 114, "dia": "8", "momento": "Antes do café", "valor": 179},
  {"id": 113, "dia": "7", "momento": "Antes do café", "valor": 229},
  {"id": 112, "dia": "6", "momento": "Antes do café", "valor": 189},
  {"id": 111, "dia": "5", "momento": "Antes do café", "valor": 159},
  {"id": 110, "dia": "4", "momento": "Antes do café", "valor": 115},
  {"id": 109, "dia": "3", "momento": "Antes do café", "valor": 145},
  {"id": 108, "dia": "2", "momento": "Antes do café", "valor": 115},
  {"id": 107, "dia": "1", "momento": "Antes do almoço/café", "valor": 179},
  {"id": 106, "dia": "31", "momento": "Antes do café", "valor": 185},
  {"id": 105, "dia": "30", "momento": "Antes do café", "valor": 147},
  {"id": 104, "dia": "29", "momento": "Antes do café", "valor": 196},
  {"id": 103, "dia": "28", "momento": "Antes do café", "valor": 127},
  {"id": 102, "dia": "27", "momento": "Antes do café", "valor": 157},
  {"id": 101, "dia": "26", "momento": "Antes do café", "valor": 163},
  {"id": 100, "dia": "24", "momento": "Antes do café", "valor": 209},
  {"id": 99, "dia": "23", "momento": "2h após almoço", "valor": 174},
  {"id": 98, "dia": "23", "momento": "2h após café", "valor": 124},
  {"id": 97, "dia": "22", "momento": "2h após almoço", "valor": 289},
  {"id": 96, "dia": "22", "momento": "Antes do café", "valor": 194},
  {"id": 95, "dia": "21", "momento": "2h após almoço", "valor": 124},
  {"id": 94, "dia": "21", "momento": "2h após café", "valor": 143},
  {"id": 93, "dia": "21", "momento": "Antes do café", "valor": 220},
  {"id": 92, "dia": "24", "momento": "Antes do café", "valor": 224},
  {"id": 91, "dia": "21", "momento": "Antes do café", "valor": 220},
  {"id": 90, "dia": "20", "momento": "Antes do café", "valor": 174},
  {"id": 89, "dia": "19", "momento": "Antes do café", "valor": 220},
  {"id": 88, "dia": "18", "momento": "Antes do café", "valor": 189},
  {"id": 87, "dia": "17", "momento": "Antes do café", "valor": 223},
  {"id": 86, "dia": "16", "momento": "Antes do café", "valor": 195},
  {"id": 85, "dia": "15", "momento": "Antes do café", "valor": 155},
  {"id": 84, "dia": "14", "momento": "Antes do café", "valor": 154},
  {"id": 83, "dia": "13", "momento": "Antes do café", "valor": 153},
  {"id": 82, "dia": "12", "momento": "Antes do café", "valor": 164},
  {"id": 81, "dia": "11", "momento": "Antes do café", "valor": 188},
  {"id": 80, "dia": "10", "momento": "Antes do café", "valor": 188},
  {"id": 79, "dia": "9", "momento": "Antes do café", "valor": 148},
  {"id": 78, "dia": "8", "momento": "Antes do café", "valor": 248},
  {"id": 77, "dia": "7", "momento": "Antes do café", "valor": 189},
  {"id": 76, "dia": "6", "momento": "Antes do café", "valor": 160},
  {"id": 75, "dia": "5", "momento": "Antes do café", "valor": 216},
  {"id": 74, "dia": "4", "momento": "Antes do café", "valor": 214},
  {"id": 73, "dia": "3", "momento": "Antes do café", "valor": 228},
  {"id": 72, "dia": "2", "momento": "Antes do café", "valor": 213},
  {"id": 71, "dia": "1", "momento": "Antes do café", "valor": 226},
  {"id": 70, "dia": "31", "momento": "2h após café", "valor": 298},
  {"id": 69, "dia": "31", "momento": "Antes do café", "valor": 228},
  {"id": 68, "dia": "30", "momento": "Antes do café", "valor": 158},
  {"id": 67, "dia": "29", "momento": "Antes do café", "valor": 158},
  {"id": 66, "dia": "29", "momento": "Antes do café", "valor": 168},
  {"id": 65, "dia": "27", "momento": "2h após almoço", "valor": 280},
  {"id": 64, "dia": "27", "momento": "2h após café", "valor": 293},
  {"id": 63, "dia": "27", "momento": "Antes do café", "valor": 198},
  {"id": 62, "dia": "26", "momento": "Depois do café", "valor": 311},
  {"id": 61, "dia": "26", "momento": "Antes do café", "valor": 136},
  {"id": 60, "dia": "25", "momento": "Depois do almoço", "valor": 245},
  {"id": 59, "dia": "25", "momento": "Antes do café", "valor": 185},
  {"id": 58, "dia": "24", "momento": "Antes do café", "valor": 218},
  {"id": 57, "dia": "22", "momento": "Antes do café", "valor": 179},
  {"id": 56, "dia": "21", "momento": "Antes do café", "valor": 181},
  {"id": 55, "dia": "20", "momento": "Depois do café", "valor": 298},
  {"id": 54, "dia": "20", "momento": "Antes do café", "valor": 178},
  {"id": 53, "dia": "19", "momento": "Depois do almoço", "valor": 209},
  {"id": 52, "dia": "19", "momento": "Antes do café", "valor": 139},
  {"id": 51, "dia": "18", "momento": "Antes do café", "valor": 75},
  {"id": 50, "dia": "17", "momento": "Depois do almoço", "valor": 147},
  {"id": 49, "dia": "17", "momento": "Depois do café", "valor": 296},
  {"id": 48, "dia": "17", "momento": "Antes do café", "valor": 151},
  {"id": 47, "dia": "16", "momento": "2h após janta", "valor": 286},
  {"id": 46, "dia": "16", "momento": "2h após almoço", "valor": 183},
  {"id": 45, "dia": "16", "momento": "2h após café", "valor": 246},
  {"id": 44, "dia": "16", "momento": "Antes do café", "valor": 101},
  {"id": 43, "dia": "15", "momento": "Antes do café", "valor": 121},
  {"id": 42, "dia": "14", "momento": "2h após café", "valor": 328},
  {"id": 41, "dia": "14", "momento": "Antes do café", "valor": 181},
  {"id": 40, "dia": "13", "momento": "Café + Almoço", "valor": 171},
  {"id": 39, "dia": "12", "momento": "Antes do café", "valor": 127},
  {"id": 38, "dia": "11", "momento": "Depois da janta", "valor": 311},
  {"id": 37, "dia": "11", "momento": "Depois do almoço", "valor": 244},
  {"id": 36, "dia": "11", "momento": "Antes do café", "valor": 121},
  {"id": 35, "dia": "10", "momento": "Depois da janta", "valor": 346},
  {"id": 34, "dia": "10", "momento": "Depois do almoço", "valor": 131},
  {"id": 33, "dia": "10", "momento": "Depois do café", "valor": 149},
  {"id": 32, "dia": "10", "momento": "Antes do café", "valor": 114},
  {"id": 31, "dia": "9", "momento": "2h após janta", "valor": 328},
  {"id": 30, "dia": "9", "momento": "2h após café", "valor": 326},
  {"id": 29, "dia": "9", "momento": "Manhã / Antes do café", "valor": 124},
  {"id": 28, "dia": "8", "momento": "2h após café", "valor": 282},
  {"id": 27, "dia": "8", "momento": "Antes do café", "valor": 151},
  {"id": 26, "dia": "7", "momento": "2h após janta", "valor": 246},
  {"id": 25, "dia": "7", "momento": "2h após café", "valor": 297},
  {"id": 24, "dia": "7", "momento": "Antes do café", "valor": 121},
  {"id": 23, "dia": "6", "momento": "Depois da janta", "valor": 239},
  {"id": 22, "dia": "6", "momento": "Depois do café", "valor": 142},
  {"id": 21, "dia": "6", "momento": "Antes do café", "valor": 149},
  {"id": 20, "dia": "5", "momento": "2h após fanta", "valor": 373},
  {"id": 19, "dia": "5", "momento": "2h após almoço", "valor": 145},
  {"id": 18, "dia": "5", "momento": "Depois do café", "valor": 249},
  {"id": 17, "dia": "5", "momento": "Antes do café", "valor": 149},
  {"id": 16, "dia": "5", "momento": "2h após janta", "valor": 343},
  {"id": 15, "dia": "4", "momento": "2h após café", "valor": 249},
  {"id": 14, "dia": "4", "momento": "Antes do café", "valor": 169},
  {"id": 13, "dia": "3", "momento": "2h após janta", "valor": 245},
  {"id": 12, "dia": "3", "momento": "2h após café", "valor": 245},
  {"id": 11, "dia": "3", "momento": "Manhã", "valor": 149},
  {"id": 10, "dia": "2", "momento": "Noite (2h após janta)", "valor": 302},
  {"id": 9, "dia": "2", "momento": "2h após almoço", "valor": 237},
  {"id": 8, "dia": "2", "momento": "2h após café", "valor": 275},
  {"id": 7, "dia": "2", "momento": "Café da manhã", "valor": 145},
  {"id": 6, "dia": "1", "momento": "Tarde (2h após almoço)", "valor": 345},
  {"id": 5, "dia": "1", "momento": "Manhã / Café", "valor": 145},
  {"id": 4, "dia": "30", "momento": "Tarde / Almoço", "valor": 342},
  {"id": 3, "dia": "30", "momento": "Manhã", "valor": 150},
  {"id": 2, "dia": "29", "momento": "Noite", "valor": 399},
  {"id": 1, "dia": "29", "momento": "Café da manhã", "valor": 223}
];
