// Estado de la aplicación (sin usar localStorage debido a sandbox)
const appState = {
  isAuthenticated: false,
  currentScreen: 'login',
  sensors: {
    temperature: {
      id: 1,
      name: 'Temperatura',
      unit: '°C',
      min: 0,
      max: 50,
      currentValue: 22.5,
      history: [22.5, 22.7, 22.4, 22.8, 22.3, 22.6, 22.5, 22.9, 22.4, 22.7]
    },
    humidity: {
      id: 2,
      name: 'Humedad',
      unit: '%',
      min: 0,
      max: 100,
      currentValue: 65,
      history: [65, 66, 64, 67, 63, 65, 66, 64, 65, 67]
    },
    light: {
      id: 3,
      name: 'Luz',
      unit: '%',
      min: 0,
      max: 100,
      currentValue: 75,
      history: [75, 76, 74, 77, 73, 75, 78, 74, 76, 75]
    }
  },
  actuators: {
    motor: { name: 'Bomba/Motor', state: false },
    lightIntensity: { name: 'Intensidad Luz', value: 180 },
    fan: { name: 'Ventilador', mode: 'Bajo' }
  },
  settings: {
    thresholds: {
      tempMin: 15,
      tempMax: 30,
      humidityMin: 40,
      humidityMax: 80,
      lightMax: 90
    },
    notifications: true,
    refreshInterval: 2
  },
  history: [],
  updateInterval: null,
  charts: {}
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  setupLoginForm();
  setupBottomNavigation();
  setupControlScreen();
  setupSettingsScreen();
  setupHistoryFilter();
  
  // Agregar algunos eventos iniciales al historial
  addHistoryEvent('sensor', 'Sistema iniciado', 'Estado: OK');
}

// === LOGIN SCREEN ===
function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnText = document.getElementById('loginBtnText');
  const loginLoader = document.getElementById('loginLoader');
  
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validación simple
    if (email && password) {
      // Mostrar loader
      loginBtnText.classList.add('hidden');
      loginLoader.classList.remove('hidden');
      loginBtn.disabled = true;
      
      // Simular autenticación
      setTimeout(() => {
        appState.isAuthenticated = true;
        navigateToScreen('dashboard');
        startSensorUpdates();
        addHistoryEvent('command', 'Usuario autenticado', `Email: ${email}`);
        
        // Resetear botón
        loginBtnText.classList.remove('hidden');
        loginLoader.classList.add('hidden');
        loginBtn.disabled = false;
      }, 1500);
    }
  });
}

// === NAVEGACIÓN ===
function setupBottomNavigation() {
  const bottomNav = document.getElementById('bottomNav');
  const logoutBtn = document.getElementById('logoutBtn');
  
  bottomNav.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
      const screen = navItem.dataset.screen;
      navigateToScreen(screen);
    }
  });
  
  logoutBtn.addEventListener('click', () => {
    appState.isAuthenticated = false;
    stopSensorUpdates();
    navigateToScreen('login');
    addHistoryEvent('command', 'Usuario cerró sesión', '');
    
    // Resetear formulario
    document.getElementById('loginForm').reset();
  });
}

function navigateToScreen(screenName) {
  // Ocultar todas las pantallas
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Mostrar la pantalla seleccionada
  const targetScreen = document.getElementById(`${screenName}Screen`);
  if (targetScreen) {
    targetScreen.classList.add('active');
    appState.currentScreen = screenName;
  }
  
  // Actualizar navegación activa
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.screen === screenName) {
      item.classList.add('active');
    }
  });
  
  // Mostrar/ocultar bottom nav
  const bottomNav = document.getElementById('bottomNav');
  if (screenName === 'login') {
    bottomNav.style.display = 'none';
  } else {
    bottomNav.style.display = 'flex';
  }
  
  // Inicializar gráficos si es dashboard
  if (screenName === 'dashboard') {
    setTimeout(() => initializeCharts(), 100);
  }
  
  // Actualizar historial si es la pantalla de historial
  if (screenName === 'history') {
    renderHistory();
  }
}

// === DASHBOARD - GRÁFICOS ===
function initializeCharts() {
  // Destruir gráficos existentes
  Object.values(appState.charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  
  // Temperatura
  const tempCtx = document.getElementById('tempChart');
  if (tempCtx) {
    appState.charts.temperature = new Chart(tempCtx, {
      type: 'line',
      data: {
        labels: Array(10).fill(''),
        datasets: [{
          data: appState.sensors.temperature.history,
          borderColor: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: false, min: 20, max: 25 }
        }
      }
    });
  }
  
  // Humedad
  const humidityCtx = document.getElementById('humidityChart');
  if (humidityCtx) {
    appState.charts.humidity = new Chart(humidityCtx, {
      type: 'line',
      data: {
        labels: Array(10).fill(''),
        datasets: [{
          data: appState.sensors.humidity.history,
          borderColor: '#4ECDC4',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: false, min: 60, max: 70 }
        }
      }
    });
  }
  
  // Luz
  const lightCtx = document.getElementById('lightChart');
  if (lightCtx) {
    appState.charts.light = new Chart(lightCtx, {
      type: 'line',
      data: {
        labels: Array(10).fill(''),
        datasets: [{
          data: appState.sensors.light.history,
          borderColor: '#FFD93D',
          backgroundColor: 'rgba(255, 217, 61, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: false, min: 70, max: 80 }
        }
      }
    });
  }
}

// === ACTUALIZACIÓN DE SENSORES ===
function startSensorUpdates() {
  if (appState.updateInterval) {
    clearInterval(appState.updateInterval);
  }
  
  appState.updateInterval = setInterval(() => {
    updateSensorValues();
  }, appState.settings.refreshInterval * 1000);
}

function stopSensorUpdates() {
  if (appState.updateInterval) {
    clearInterval(appState.updateInterval);
    appState.updateInterval = null;
  }
}

function updateSensorValues() {
  // Temperatura
  const tempVariation = (Math.random() - 0.5) * 2;
  appState.sensors.temperature.currentValue = parseFloat(
    (appState.sensors.temperature.currentValue + tempVariation).toFixed(1)
  );
  appState.sensors.temperature.currentValue = Math.max(
    20,
    Math.min(25, appState.sensors.temperature.currentValue)
  );
  
  // Humedad
  const humidityVariation = (Math.random() - 0.5) * 3;
  appState.sensors.humidity.currentValue = Math.round(
    appState.sensors.humidity.currentValue + humidityVariation
  );
  appState.sensors.humidity.currentValue = Math.max(
    60,
    Math.min(70, appState.sensors.humidity.currentValue)
  );
  
  // Luz
  const lightVariation = (Math.random() - 0.5) * 5;
  appState.sensors.light.currentValue = Math.round(
    appState.sensors.light.currentValue + lightVariation
  );
  appState.sensors.light.currentValue = Math.max(
    70,
    Math.min(80, appState.sensors.light.currentValue)
  );
  
  // Actualizar historial
  updateSensorHistory('temperature');
  updateSensorHistory('humidity');
  updateSensorHistory('light');
  
  // Actualizar UI
  updateDashboardUI();
  
  // Verificar umbrales y agregar al historial si es necesario
  checkThresholds();
}

function updateSensorHistory(sensorType) {
  const sensor = appState.sensors[sensorType];
  sensor.history.push(sensor.currentValue);
  if (sensor.history.length > 10) {
    sensor.history.shift();
  }
}

function updateDashboardUI() {
  // Actualizar valores
  document.getElementById('tempValue').textContent = 
    appState.sensors.temperature.currentValue.toFixed(1);
  document.getElementById('humidityValue').textContent = 
    appState.sensors.humidity.currentValue;
  document.getElementById('lightValue').textContent = 
    appState.sensors.light.currentValue;
  
  // Actualizar timestamps
  const now = new Date().toLocaleTimeString('es-ES');
  document.getElementById('tempTimestamp').textContent = `Actualizado: ${now}`;
  document.getElementById('humidityTimestamp').textContent = `Actualizado: ${now}`;
  document.getElementById('lightTimestamp').textContent = `Actualizado: ${now}`;
  
  // Actualizar gráficos
  if (appState.charts.temperature) {
    appState.charts.temperature.data.datasets[0].data = appState.sensors.temperature.history;
    appState.charts.temperature.update('none');
  }
  if (appState.charts.humidity) {
    appState.charts.humidity.data.datasets[0].data = appState.sensors.humidity.history;
    appState.charts.humidity.update('none');
  }
  if (appState.charts.light) {
    appState.charts.light.data.datasets[0].data = appState.sensors.light.history;
    appState.charts.light.update('none');
  }
}

function checkThresholds() {
  const { tempMin, tempMax, humidityMin, humidityMax, lightMax } = appState.settings.thresholds;
  const temp = appState.sensors.temperature.currentValue;
  const humidity = appState.sensors.humidity.currentValue;
  const light = appState.sensors.light.currentValue;
  
  if (temp < tempMin || temp > tempMax) {
    addHistoryEvent('sensor', 'Alerta: Temperatura fuera de rango', `${temp}°C`);
  }
  
  if (humidity < humidityMin || humidity > humidityMax) {
    addHistoryEvent('sensor', 'Alerta: Humedad fuera de rango', `${humidity}%`);
  }
  
  if (light > lightMax) {
    addHistoryEvent('sensor', 'Alerta: Luz excede máximo', `${light}%`);
  }
}

// === CONTROL SCREEN ===
function setupControlScreen() {
  // Motor Toggle
  const motorToggle = document.getElementById('motorToggle');
  const motorStatus = document.getElementById('motorStatus');
  
  motorToggle.addEventListener('change', (e) => {
    appState.actuators.motor.state = e.target.checked;
    motorStatus.textContent = e.target.checked ? 'Encendido' : 'Apagado';
  });
  
  // Light Intensity Slider
  const lightIntensitySlider = document.getElementById('lightIntensitySlider');
  const lightIntensityValue = document.getElementById('lightIntensityValue');
  
  lightIntensitySlider.addEventListener('input', (e) => {
    appState.actuators.lightIntensity.value = parseInt(e.target.value);
    lightIntensityValue.textContent = e.target.value;
  });
  
  // Fan Selector
  const selectorBtns = document.querySelectorAll('.selector-btn');
  selectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.actuators.fan.mode = btn.dataset.value;
    });
  });
  
  // Send Command Button
  const sendCommandBtn = document.getElementById('sendCommandBtn');
  const commandSuccess = document.getElementById('commandSuccess');
  
  sendCommandBtn.addEventListener('click', () => {
    // Simular envío de comando
    sendCommandBtn.disabled = true;
    sendCommandBtn.textContent = 'Enviando...';
    
    setTimeout(() => {
      commandSuccess.classList.remove('hidden');
      sendCommandBtn.disabled = false;
      sendCommandBtn.textContent = 'Enviar Comando';
      
      // Agregar al historial
      addHistoryEvent('command', 'Actuadores actualizados', 
        `Motor: ${appState.actuators.motor.state ? 'ON' : 'OFF'}, Luz: ${appState.actuators.lightIntensity.value}, Ventilador: ${appState.actuators.fan.mode}`);
      
      setTimeout(() => {
        commandSuccess.classList.add('hidden');
      }, 3000);
    }, 1000);
  });
}

// === HISTORY SCREEN ===
function addHistoryEvent(type, description, value) {
  const event = {
    type,
    description,
    value,
    timestamp: new Date()
  };
  
  appState.history.unshift(event);
  
  // Mantener solo los últimos 20 eventos
  if (appState.history.length > 20) {
    appState.history = appState.history.slice(0, 20);
  }
}

function setupHistoryFilter() {
  const historyFilter = document.getElementById('historyFilter');
  historyFilter.addEventListener('change', () => {
    renderHistory();
  });
}

function renderHistory() {
  const historyList = document.getElementById('historyList');
  const filter = document.getElementById('historyFilter').value;
  
  let filteredHistory = appState.history;
  if (filter !== 'all') {
    filteredHistory = appState.history.filter(event => event.type === filter);
  }
  
  if (filteredHistory.length === 0) {
    historyList.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 20px;">No hay eventos registrados</p>';
    return;
  }
  
  historyList.innerHTML = filteredHistory.map(event => {
    const icon = event.type === 'sensor' ? '📊' : '⚡';
    const time = formatTimestamp(event.timestamp);
    
    return `
      <div class="history-item">
        <div class="history-icon ${event.type}">${icon}</div>
        <div class="history-details">
          <div class="history-type">${event.type === 'sensor' ? 'LECTURA' : 'COMANDO'}</div>
          <div class="history-description">${event.description}</div>
          ${event.value ? `<div class="history-value">${event.value}</div>` : ''}
        </div>
        <div class="history-time">${time}</div>
      </div>
    `;
  }).join('');
}

function formatTimestamp(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // segundos
  
  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// === SETTINGS SCREEN ===
function setupSettingsScreen() {
  // Refresh Interval Slider
  const refreshIntervalSlider = document.getElementById('refreshIntervalSlider');
  const refreshIntervalLabel = document.getElementById('refreshIntervalLabel');
  
  refreshIntervalSlider.addEventListener('input', (e) => {
    refreshIntervalLabel.textContent = e.target.value;
  });
  
  // Save Settings Button
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const settingsSuccess = document.getElementById('settingsSuccess');
  
  saveSettingsBtn.addEventListener('click', () => {
    // Guardar umbrales
    appState.settings.thresholds.tempMin = parseInt(document.getElementById('tempMin').value);
    appState.settings.thresholds.tempMax = parseInt(document.getElementById('tempMax').value);
    appState.settings.thresholds.humidityMin = parseInt(document.getElementById('humidityMin').value);
    appState.settings.thresholds.humidityMax = parseInt(document.getElementById('humidityMax').value);
    appState.settings.thresholds.lightMax = parseInt(document.getElementById('lightMax').value);
    
    // Guardar notificaciones
    appState.settings.notifications = document.getElementById('notificationsToggle').checked;
    
    // Guardar intervalo de refresco
    const newInterval = parseInt(refreshIntervalSlider.value);
    appState.settings.refreshInterval = newInterval;
    
    // Reiniciar actualización con nuevo intervalo
    if (appState.isAuthenticated) {
      stopSensorUpdates();
      startSensorUpdates();
    }
    
    // Mostrar mensaje de éxito
    saveSettingsBtn.disabled = true;
    saveSettingsBtn.textContent = 'Guardando...';
    
    setTimeout(() => {
      settingsSuccess.classList.remove('hidden');
      saveSettingsBtn.disabled = false;
      saveSettingsBtn.textContent = 'Guardar Cambios';
      
      addHistoryEvent('command', 'Configuración actualizada', 
        `Intervalo: ${newInterval}s, Notificaciones: ${appState.settings.notifications ? 'ON' : 'OFF'}`);
      
      setTimeout(() => {
        settingsSuccess.classList.add('hidden');
      }, 3000);
    }, 1000);
  });
}