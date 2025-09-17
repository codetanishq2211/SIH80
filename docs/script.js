const API_BASE = window.API_CONFIG.API_BASE;

// Initialize app
window.addEventListener('DOMContentLoaded', async () => {
  await loadTrains();
  await loadSchedules();
  await loadAnalytics();
  setupModal();
  setDefaultDate();
});

function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
  document.getElementById('optimizeDate').value = today;
}

// Tab Management
function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
}

// Load trains dynamically
async function loadTrains() {
  try {
    const response = await fetch(`${API_BASE}/trains`);
    const trains = await response.json();
    const select = document.getElementById('trainId');
    select.innerHTML = '<option value="">Select Train</option>';
    trains.forEach(train => {
      const status = train.inIBL ? ' (IBL)' : '';
      select.innerHTML += `<option value="${train.trainId}">${train.trainId}${status}</option>`;
    });
  } catch (error) {
    console.error('Failed to load trains:', error);
  }
}

// Load schedules
async function loadSchedules() {
  try {
    const response = await fetch(`${API_BASE}/schedules`);
    const schedules = await response.json();
    const tbody = document.querySelector('#scheduleTable tbody');
    tbody.innerHTML = '';
    
    schedules.forEach(schedule => {
      const statusClass = getStatusClass(schedule.score);
      const statusText = schedule.recommendation || getStatusText(schedule.score);
      const conflictBadge = schedule.conflicts && schedule.conflicts.length > 0 
        ? `<span class="conflict-badge">${schedule.conflicts.length} conflicts</span>` 
        : '';
      
      tbody.innerHTML += `
        <tr>
          <td>${schedule.trainId}</td>
          <td>${schedule.station}</td>
          <td>${schedule.route}</td>
          <td>${schedule.date}</td>
          <td>${schedule.time}</td>
          <td class="${statusClass}">${schedule.score}%</td>
          <td>${statusText} ${conflictBadge}</td>
          <td>
            <button onclick="viewTrainDetails('${schedule.trainId}')" class="btn-small">Details</button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error('Failed to load schedules:', error);
  }
}

// Status helpers
function getStatusClass(score) {
  if (score >= 80) return 'status-optimal';
  if (score >= 60) return 'status-good';
  if (score >= 40) return 'status-caution';
  return 'status-avoid';
}

function getStatusText(score) {
  if (score >= 80) return 'Optimal';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Caution';
  return 'Avoid';
}

// Schedule form submission
document.getElementById("scheduleForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  
  const trainId = document.getElementById("trainId").value;
  const station = document.getElementById("station").value;
  const route = document.getElementById("route").value;
  const dateVal = document.getElementById("date").value;
  const timeVal = document.getElementById("time").value;

  if (!trainId || !station || !route || !dateVal || !timeVal) {
    alert("Please fill all required fields!");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainId, station, route, date: dateVal, time: timeVal
      })
    });

    const schedule = await response.json();
    
    if (response.ok) {
      displayScheduleResult(schedule);
      await loadSchedules();
      this.reset();
      setDefaultDate();
    } else {
      alert('Error: ' + schedule.error);
    }
  } catch (error) {
    alert('Failed to create schedule: ' + error.message);
  }
});

function displayScheduleResult(schedule) {
  const conflictsHtml = schedule.conflicts && schedule.conflicts.length > 0 
    ? `<div class="conflicts-section">
         <h4>⚠️ Conflicts Detected:</h4>
         <ul>${schedule.conflicts.map(c => `<li>${c}</li>`).join('')}</ul>
       </div>`
    : '<div class="no-conflicts">✅ No conflicts detected</div>';

  const breakdownHtml = Object.entries(schedule.breakdown)
    .map(([key, value]) => `<span class="breakdown-item">${key}: ${value}%</span>`)
    .join('');

  const resultHTML = `
    <div class="result-card">
      <div class="result-header">
        <h4>🚆 ${schedule.trainId} - ${schedule.station}</h4>
        <div class="ai-score ${getStatusClass(schedule.score)}">AI Score: ${schedule.score}%</div>
      </div>
      <div class="result-details">
        <p><strong>📍 Route:</strong> ${schedule.route}</p>
        <p><strong>📅 Date:</strong> ${schedule.date} at ${schedule.time}</p>
        <p><strong>🤖 Recommendation:</strong> ${schedule.recommendation}</p>
        <div class="breakdown">${breakdownHtml}</div>
      </div>
      ${conflictsHtml}
    </div>
  `;

  document.getElementById("result").innerHTML = resultHTML;
  document.getElementById("aiOutput").style.display = "block";
}

// AI Fleet Optimization
async function runAIOptimization() {
  const date = document.getElementById('optimizeDate').value;
  if (!date) {
    alert('Please select a target date');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/ai/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    });

    const result = await response.json();
    displayOptimizationResults(result);
  } catch (error) {
    alert('Optimization failed: ' + error.message);
  }
}

function displayOptimizationResults(result) {
  const summaryHtml = `
    <div class="optimization-summary">
      <h3>🤖 AI Fleet Optimization Results for ${result.date}</h3>
      <div class="summary-stats">
        <div class="stat">
          <span class="stat-number">${result.totalTrains}</span>
          <span class="stat-label">Total Trains</span>
        </div>
        <div class="stat">
          <span class="stat-number">${result.availableTrains}</span>
          <span class="stat-label">Available</span>
        </div>
        <div class="stat">
          <span class="stat-number">${result.summary.optimal}</span>
          <span class="stat-label">Optimal</span>
        </div>
        <div class="stat">
          <span class="stat-number">${result.summary.good}</span>
          <span class="stat-label">Good</span>
        </div>
      </div>
    </div>
  `;

  const recommendationsHtml = result.recommendations.map((rec, index) => `
    <div class="recommendation-item ${getStatusClass(rec.score)}">
      <div class="rank">#${index + 1}</div>
      <div class="train-info">
        <strong>${rec.trainId}</strong>
        <span class="score">${rec.score}%</span>
      </div>
      <div class="recommendation">${rec.recommendation}</div>
      ${rec.conflicts.length > 0 ? `<div class="conflicts">${rec.conflicts.join(', ')}</div>` : ''}
    </div>
  `).join('');

  document.getElementById('optimizationResults').innerHTML = summaryHtml + 
    '<div class="recommendations">' + recommendationsHtml + '</div>';
}

// Analytics Dashboard
async function loadAnalytics() {
  try {
    const [trainsRes, schedulesRes] = await Promise.all([
      fetch(`${API_BASE}/trains`),
      fetch(`${API_BASE}/schedules`)
    ]);

    const trains = await trainsRes.json();
    const schedules = await schedulesRes.json();

    displayFleetMetrics(trains);
    displayAIMetrics(schedules);
    displayConflictMetrics(schedules);
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

function displayFleetMetrics(trains) {
  const available = trains.filter(t => !t.inIBL).length;
  const inIBL = trains.filter(t => t.inIBL).length;
  
  document.getElementById('fleetMetrics').innerHTML = `
    <div class="metric">Total Trains: <strong>${trains.length}</strong></div>
    <div class="metric">Available: <strong>${available}</strong></div>
    <div class="metric">In IBL: <strong>${inIBL}</strong></div>
    <div class="metric">Utilization: <strong>${Math.round((available/trains.length)*100)}%</strong></div>
  `;
}

function displayAIMetrics(schedules) {
  if (schedules.length === 0) {
    document.getElementById('aiMetrics').innerHTML = '<div class="metric">No schedules yet</div>';
    return;
  }

  const avgScore = Math.round(schedules.reduce((sum, s) => sum + s.score, 0) / schedules.length);
  const optimal = schedules.filter(s => s.score >= 80).length;
  const good = schedules.filter(s => s.score >= 60 && s.score < 80).length;

  document.getElementById('aiMetrics').innerHTML = `
    <div class="metric">Avg AI Score: <strong>${avgScore}%</strong></div>
    <div class="metric">Optimal: <strong>${optimal}</strong></div>
    <div class="metric">Good: <strong>${good}</strong></div>
    <div class="metric">Total Scheduled: <strong>${schedules.length}</strong></div>
  `;
}

function displayConflictMetrics(schedules) {
  const totalConflicts = schedules.reduce((sum, s) => sum + (s.conflicts ? s.conflicts.length : 0), 0);
  const schedulesWithConflicts = schedules.filter(s => s.conflicts && s.conflicts.length > 0).length;

  document.getElementById('conflictMetrics').innerHTML = `
    <div class="metric">Total Conflicts: <strong>${totalConflicts}</strong></div>
    <div class="metric">Affected Schedules: <strong>${schedulesWithConflicts}</strong></div>
    <div class="metric">Conflict Rate: <strong>${schedules.length > 0 ? Math.round((schedulesWithConflicts/schedules.length)*100) : 0}%</strong></div>
  `;
}

// Train Details Modal
async function viewTrainDetails(trainId) {
  try {
    const response = await fetch(`${API_BASE}/trains/${trainId}/details`);
    const train = await response.json();
    
    const computeResponse = await fetch(`${API_BASE}/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainId })
    });
    const aiAnalysis = await computeResponse.json();

    displayTrainModal(train, aiAnalysis);
  } catch (error) {
    alert('Failed to load train details: ' + error.message);
  }
}

function displayTrainModal(train, aiAnalysis) {
  const certsHtml = Object.entries(train.fitnessCerts)
    .map(([type, expiry]) => `<li>${type}: ${expiry}</li>`)
    .join('');

  const breakdownHtml = Object.entries(aiAnalysis.breakdown)
    .map(([key, value]) => `<div class="breakdown-bar">
      <span>${key}</span>
      <div class="bar"><div class="fill" style="width: ${value}%"></div></div>
      <span>${value}%</span>
    </div>`)
    .join('');

  document.getElementById('trainDetails').innerHTML = `
    <div class="train-overview">
      <h3>${train.trainId} - ${train.inIBL ? 'In IBL' : 'Available'}</h3>
      <div class="ai-score ${getStatusClass(aiAnalysis.score)}">AI Score: ${aiAnalysis.score}%</div>
    </div>
    
    <div class="details-grid">
      <div class="detail-section">
        <h4>🏥 Fitness Certificates</h4>
        <ul>${certsHtml}</ul>
      </div>
      
      <div class="detail-section">
        <h4>🔧 Maintenance</h4>
        <p>Open Job Cards: ${train.openJobCards}</p>
        <p>Last Cleaning: ${train.lastCleaning}</p>
        <p>Stabling Bay: ${train.stablingBay}</p>
      </div>
      
      <div class="detail-section">
        <h4>📊 Mileage & Branding</h4>
        <p>Current: ${train.lastMileage} km</p>
        <p>Target: ${train.mileageTarget} km</p>
        <p>Advertiser: ${train.brandingContract.advertiser}</p>
      </div>
    </div>
    
    <div class="ai-breakdown">
      <h4>🤖 AI Analysis Breakdown</h4>
      ${breakdownHtml}
    </div>
    
    <div class="recommendation">
      <h4>💡 AI Recommendation</h4>
      <p>${aiAnalysis.recommendation}</p>
      ${aiAnalysis.conflicts.length > 0 ? 
        `<div class="conflicts">
          <strong>Conflicts:</strong>
          <ul>${aiAnalysis.conflicts.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>` : ''}
    </div>
  `;

  document.getElementById('trainModal').style.display = 'block';
}

function setupModal() {
  const modal = document.getElementById('trainModal');
  const span = document.getElementsByClassName('close')[0];

  span.onclick = function() {
    modal.style.display = 'none';
  }

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  }
}