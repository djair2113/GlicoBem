let pieChartInstance = null;
let barChartInstance = null;

// Registro do Service Worker para Funcionar Offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('GlicoBem pronto para uso offline!'))
      .catch(err => console.log('Erro ao registrar SW:', err));
  });
}

// Data de nascimento da sogra (19/10/1958 -> Faz 68 anos em 19/10/2026)
const SOGRA_BIRTH_DATE = '1958-10-19';

const FRASES_MOTIVACIONAIS = [
  { text: "📖 \"Deus é o nosso refúgio e fortaleza, socorro bem presente na hora da angústia.\"", ref: "— Salmos 46:1" },
  { text: "☀️ \"Cada novo dia é uma oportunidade para cuidar da sua saúde com carinho e fé!\"", ref: "— Inspiração Diária" },
  { text: "💪 \"Pequenas vitórias diárias constroem uma vida cheia de saúde e vitalidade.\"", ref: "— Motivação Diária" },
  { text: "📖 \"Tudo posso naquele que me fortalece.\"", ref: "— Filipenses 4:13" },
  { text: "🌟 \"Sua dedicação diária garante a sua tranquilidade. Continue firme!\"", ref: "— Equipe GlicoBem" }
];

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  calculateAge();
  setDefaultDateTime();
  initContacts();
  initData();
  loadRandomMotivationalMessage();
  updateDashboard();
  initQRCode();
});

// --- CÁLCULO DE IDADE AUTOMÁTICO ---
function calculateAge() {
  const birth = new Date(SOGRA_BIRTH_DATE);
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

// --- CONTATOS DE EMERGÊNCIA EDITÁVEIS ---
const DEFAULT_CONTACTS = [
  { id: 1, name: "Djair Santos", relation: "Genro / Responsável", phone: "11999999999" },
  { id: 2, name: "SAMU", relation: "Emergência Médica", phone: "192" }
];

function getStoredContacts() {
  try {
    const data = localStorage.getItem('glicobem_contacts_sogra');
    return data ? JSON.parse(data) : DEFAULT_CONTACTS;
  } catch (err) {
    return DEFAULT_CONTACTS;
  }
}

function saveStoredContacts(contacts) {
  try {
    localStorage.setItem('glicobem_contacts_sogra', JSON.stringify(contacts));
  } catch (err) {}
}

function initContacts() {
  renderContacts();
}

function renderContacts() {
  const contactsList = document.getElementById('emergencyContactsList');
  if (!contactsList) return;

  const contacts = getStoredContacts();
  contactsList.innerHTML = '';

  contacts.forEach(c => {
    const item = document.createElement('div');
    item.className = 'contact-item';
    item.innerHTML = `
      <div>
        <strong>${c.name}</strong>
        <span>${c.relation}</span>
        <small>📱 ${c.phone}</small>
      </div>
      <div class="contact-actions">
        <a href="tel:${c.phone}" class="btn-call">📞 Ligar</a>
        <button type="button" class="btn-delete" onclick="deleteContact(${c.id})">✕</button>
      </div>
    `;
    contactsList.appendChild(item);
  });
}

function addNewContact() {
  const nameInput = document.getElementById('contactName');
  const relInput = document.getElementById('contactRelation');
  const phoneInput = document.getElementById('contactPhone');

  if (!nameInput || !phoneInput || !nameInput.value || !phoneInput.value) {
    alert('Por favor, preencha pelo menos o Nome e o Telefone.');
    return;
  }

  const contacts = getStoredContacts();
  const newContact = {
    id: Date.now(),
    name: nameInput.value,
    relation: relInput.value || 'Contato',
    phone: phoneInput.value.replace(/\D/g, '')
  };

  contacts.push(newContact);
  saveStoredContacts(contacts);
  renderContacts();

  nameInput.value = '';
  relInput.value = '';
  phoneInput.value = '';
}

function deleteContact(id) {
  if (confirm('Deseja remover este contato de emergência?')) {
    let contacts = getStoredContacts();
    contacts = contacts.filter(c => c.id !== id);
    saveStoredContacts(contacts);
    renderContacts();
  }
}

// --- TEMA CLARO E ESCURO ---
function initTheme() {
  const savedTheme = localStorage.getItem('glicobem_theme') || 'dark';
  document.body.className = savedTheme + '-theme';
  updateThemeButton(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.className = newTheme + '-theme';
  localStorage.setItem('glicobem_theme', newTheme);
  updateThemeButton(newTheme);
  updateDashboard();
}

function updateThemeButton(theme) {
  const btn = document.getElementById('themeBtn');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️ Tema Claro' : '🌙 Tema Escuro';
  }
}

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

function setDefaultDateTime() {
  const inputDate = document.getElementById('dataHoraGlicemia');
  if (inputDate) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    inputDate.value = now.toISOString().slice(0, 16);
  }
}

function getStoredData() {
  try {
    const data = localStorage.getItem('glicemia_records_sogra');
    return data ? JSON.parse(data) : [];
  } catch (err) { return []; }
}

function saveStoredData(data) {
  try {
    localStorage.setItem('glicemia_records_sogra', JSON.stringify(data));
  } catch (err) {}
}

function initData() {
  let records = getStoredData();
  if (!records) {
    saveStoredData([]);
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

  const record = { id: Date.now(), dia: formattedDate, momento: momento, valor: valor };

  let records = getStoredData() || [];
  records.unshift(record);
  saveStoredData(records);

  triggerVisualFeedback(valor, momento);

  valorInput.value = '';
  setDefaultDateTime();
  updateDashboard();
}

function triggerVisualFeedback(valor, momento) {
  const isJejum = momento.toLowerCase().includes('jejum');
  const banner = document.getElementById('feedbackBanner');
  if (!banner) return;

  banner.className = 'feedback-banner';

  const contacts = getStoredContacts();
  const primaryPhone = contacts.length > 0 ? contacts[0].phone : '';

  if (isJejum) {
    if (valor < 100) {
      banner.classList.add('success');
      banner.innerHTML = `🎉 Parabéns! Sua glicemia em jejum de ${valor} mg/dL está ótima!`;
      launchConfetti();
    } else if (valor <= 125) {
      banner.classList.add('warning');
      banner.innerHTML = `⚠️ Atenção: Glicemia em jejum de ${valor} mg/dL (Atenção entre 100 e 125 mg/dL).`;
    } else {
      banner.classList.add('danger');
      banner.innerHTML = `🚨 Alerta de Hiperglicemia: ${valor} mg/dL!<br>
        <a href="https://api.whatsapp.com/send?phone=${primaryPhone}&text=ALERTA%20GLICEMIA:%20Valor%20de%20${valor}%20mg/dL!" target="_blank" class="btn-emergency-action">📲 Notificar Familiar via WhatsApp</a>`;
    }
  } else {
    if (valor < 140) {
      banner.classList.add('success');
      banner.innerHTML = `🎉 Excelente! Glicemia de ${valor} mg/dL dentro da meta ideal!`;
      launchConfetti();
    } else if (valor <= 199) {
      banner.classList.add('warning');
      banner.innerHTML = `⚠️ Atenção: Glicemia de ${valor} mg/dL.`;
    } else {
      banner.classList.add('danger');
      banner.innerHTML = `🚨 Alerta de Hiperglicemia: ${valor} mg/dL!<br>
        <a href="https://api.whatsapp.com/send?phone=${primaryPhone}&text=ALERTA%20GLICEMIA:%20Valor%20de%20${valor}%20mg/dL!" target="_blank" class="btn-emergency-action">📲 Notificar Familiar via WhatsApp</a>`;
    }
  }

  banner.classList.remove('hidden');
}

function launchConfetti() {
  if (typeof confetti === 'function') {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }
}

function deleteMeasurement(id) {
  if (confirm("Tem certeza de que deseja apagar este registro?")) {
    let records = getStoredData() || [];
    records = records.filter(r => r.id !== id);
    saveStoredData(records);
    updateDashboard();
  }
}

function updateDashboard() {
  const allRecords = getStoredData() || [];
  const filterSelect = document.getElementById('filtroHistorico');
  const filterValue = filterSelect ? filterSelect.value : 'todos';

  let filteredRecords = allRecords;
  if (filterValue === '10') filteredRecords = allRecords.slice(0, 10);
  else if (filterValue === '20') filteredRecords = allRecords.slice(0, 20);
  else if (filterValue === '50') filteredRecords = allRecords.slice(0, 50);
  else if (filterValue === 'mensal') filteredRecords = allRecords.slice(0, 30);
  else if (filterValue === 'trimestral') filteredRecords = allRecords.slice(0, 90);

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

  if (metricTotal) metricTotal.textContent = `${calcAvg(records)} mg/dL`;
  if (metricMensal) metricMensal.textContent = `${calcAvg(records.slice(0, 30))} mg/dL`;
  if (metricTrimestral) metricTrimestral.textContent = `${calcAvg(records.slice(0, 90))} mg/dL`;
}

function calcAvg(arr) {
  if (!arr || arr.length === 0) return '--';
  return (arr.reduce((acc, curr) => acc + curr.valor, 0) / arr.length).toFixed(1);
}

function renderCharts(records) {
  if (!records || records.length === 0) return;

  const isDark = document.body.classList.contains('dark-theme');
  const textColor = isDark ? '#ffffff' : '#333333';

  let normal = 0, atencao = 0, alta = 0;
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
        datasets: [{ data: [normal, atencao, alta], backgroundColor: ['#4caf50', '#ff9800', '#f44336'] }]
      },
      options: { responsive: true, plugins: { legend: { labels: { color: textColor } } } }
    });
  }

  const ctxBar = document.getElementById('barChart');
  if (ctxBar) {
    if (barChartInstance) barChartInstance.destroy();
    const displayRecords = records.slice(0, 20).reverse();
    barChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: displayRecords.map(r => r.dia),
        datasets: [{ label: 'Glicemia (mg/dL)', data: displayRecords.map(r => r.valor), backgroundColor: '#64b5f6' }]
      },
      options: {
        responsive: true,
        scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor } } },
        plugins: { legend: { labels: { color: textColor } } }
      }
    });
  }
}

function exportCSV() {
  const records = getStoredData() || [];
  let csvContent = "data:text/csv;charset=utf-8,ID,Data,Momento,Valor (mg/dL)\n";
  records.forEach(r => { csvContent += `${r.id},"${r.dia}","${r.momento}",${r.valor}\n`; });
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "relatorio_glicemia.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function initQRCode() {
  const qrDiv = document.getElementById("qrcode");
  if (qrDiv) {
    qrDiv.innerHTML = "";
    new QRCode(qrDiv, { text: window.location.href, width: 140, height: 140 });
  }
}

function toggleQRCode() {
  const container = document.getElementById("qrCodeContainer");
  if (container) container.classList.toggle("hidden");
}
