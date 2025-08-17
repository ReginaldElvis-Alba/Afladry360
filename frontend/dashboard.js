// Dashboard JavaScript for AFLA-DRY 360
class Dashboard {
    constructor() {
        this.currentUser = null;
        this.sensors = [];
        this.readings = [];
        this.charts = {};
        this.updateInterval = null;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        this.initializeCharts();
        this.loadDashboardData();
        this.startRealTimeUpdates();
    }

    async checkAuth() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const data = await response.json();
            this.currentUser = data.data.user;
            this.updateUserInfo();
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            // Update sidebar user info
            document.getElementById('user-name').textContent = this.currentUser.full_name || 'Farmer';
            document.getElementById('user-email').textContent = this.currentUser.email;
            
            // Update welcome header
            const welcomeUserName = document.getElementById('welcome-user-name');
            if (welcomeUserName) {
                welcomeUserName.textContent = this.currentUser.full_name || 'Farmer';
            }
        }
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Add sensor modal
        document.getElementById('add-sensor-btn').addEventListener('click', () => {
            this.showModal('add-sensor-modal');
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Add sensor form
        document.getElementById('add-sensor-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSensor();
        });



        // Quick action buttons
        document.getElementById('export-data-btn').addEventListener('click', () => this.exportData());
        document.getElementById('generate-report-btn').addEventListener('click', () => this.generateReport());
        document.getElementById('contact-support-btn').addEventListener('click', () => this.contactSupport());
        document.getElementById('calibrate-btn').addEventListener('click', () => this.calibrateSensors());
    }

    initializeCharts() {
        // Temperature Gauge
        this.charts.temperature = this.createGauge('temp-gauge', 'Temperature', '°C', 0, 100, 25);
        
        // Humidity Gauge
        this.charts.humidity = this.createGauge('humidity-gauge', 'Humidity', '%', 0, 100, 60);
        
        // Moisture Gauge
        this.charts.moisture = this.createGauge('moisture-gauge', 'Moisture', '%', 0, 100, 45);
    }

    createGauge(canvasId, label, unit, min, max, value) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Draw gauge background
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Draw gauge value
        const percentage = (value - min) / (max - min);
        const angle = percentage * Math.PI;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + angle);
        ctx.strokeStyle = this.getGaugeColor(percentage);
        ctx.lineWidth = 8;
        ctx.stroke();

        // Draw center text
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${value}${unit}`, centerX, centerY + 5);

        return { canvas, ctx, min, max, update: (newValue) => this.updateGauge(canvasId, newValue) };
    }

    getGaugeColor(percentage) {
        if (percentage < 0.3) return '#4CAF50'; // Green
        if (percentage < 0.7) return '#FF9800'; // Orange
        return '#F44336'; // Red
    }

    updateGauge(canvasId, value) {
        const chart = this.charts[canvasId.replace('-gauge', '')];
        if (!chart) return;

        const percentage = (value - chart.min) / (chart.max - chart.min);
        const angle = percentage * Math.PI;
        
        // Clear canvas
        chart.ctx.clearRect(0, 0, chart.canvas.width, chart.canvas.height);
        
        // Redraw background
        chart.ctx.beginPath();
        chart.ctx.arc(chart.canvas.width/2, chart.canvas.height/2, chart.canvas.width/2 - 10, 0, 2 * Math.PI);
        chart.ctx.strokeStyle = '#e0e0e0';
        chart.ctx.lineWidth = 8;
        chart.ctx.stroke();

        // Redraw value
        chart.ctx.beginPath();
        chart.ctx.arc(chart.canvas.width/2, chart.canvas.height/2, chart.canvas.width/2 - 10, -Math.PI/2, -Math.PI/2 + angle);
        chart.ctx.strokeStyle = this.getGaugeColor(percentage);
        chart.ctx.lineWidth = 8;
        chart.ctx.stroke();

        // Redraw text
        chart.ctx.fillStyle = '#333';
        chart.ctx.font = 'bold 16px Arial';
        chart.ctx.textAlign = 'center';
        chart.ctx.fillText(`${value}${chart.unit || ''}`, chart.canvas.width/2, chart.canvas.height/2 + 5);
    }

    async loadDashboardData() {
        await Promise.all([
            this.loadSensors(),
            this.loadReadings(),
            this.loadSystemStatus()
        ]);
    }

    async loadSensors() {
        try {
            const response = await fetch('http://localhost:5000/api/users/sensors', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.sensors = data.data.sensors || [];
                this.updateSensorList();
            }
        } catch (error) {
            console.error('Failed to load sensors:', error);
            // Use mock data for demo
            this.sensors = [
                { id: 1, name: 'Temp Sensor 1', type: 'temperature', location: 'Storage Unit A', status: 'active' },
                { id: 2, name: 'Humidity Sensor 1', type: 'humidity', location: 'Storage Unit A', status: 'active' },
                { id: 3, name: 'Moisture Sensor 1', type: 'moisture', location: 'Storage Unit A', status: 'active' }
            ];
            this.updateSensorList();
        }
    }

    async loadReadings() {
        try {
            const response = await fetch('http://localhost:5000/api/users/farm-data?limit=5', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.readings = data.data.farm_data || [];
                this.updateReadingsList();
            }
        } catch (error) {
            console.error('Failed to load readings:', error);
            // Use mock data for demo
            this.readings = [
                { temperature: 25.5, humidity: 65, moisture: 45, aflatoxin_level: 2.1, reading_date: new Date().toISOString() },
                { temperature: 24.8, humidity: 67, moisture: 47, aflatoxin_level: 1.8, reading_date: new Date(Date.now() - 60000).toISOString() },
                { temperature: 26.2, humidity: 63, moisture: 43, aflatoxin_level: 2.3, reading_date: new Date(Date.now() - 120000).toISOString() }
            ];
            this.updateReadingsList();
        }
    }

    async loadSystemStatus() {
        // Mock system status data
        const statusData = {
            'sensors-connected': '3/3',
            'active-nodes': '5',
            'total-tokens': '1,250',
            'token-balance': '850',
            'users-found': '12',
            'system-health': 'Healthy'
        };

        Object.entries(statusData).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updateSensorList() {
        const sensorList = document.getElementById('sensor-list');
        sensorList.innerHTML = '';

        this.sensors.forEach(sensor => {
            const sensorItem = document.createElement('div');
            sensorItem.className = 'sensor-item';
            sensorItem.innerHTML = `
                <div class="sensor-info">
                    <h4>${sensor.name}</h4>
                    <p><i class="ri-map-pin-line"></i> ${sensor.location}</p>
                    <span class="sensor-type ${sensor.type}">${sensor.type}</span>
                </div>
                <div class="sensor-status">
                    <span class="status-indicator ${sensor.status}"></span>
                    <button class="btn-small" onclick="dashboard.editSensor(${sensor.id})">
                        <i class="ri-edit-line"></i>
                    </button>
                </div>
            `;
            sensorList.appendChild(sensorItem);
        });
    }

    updateReadingsList() {
        const readingsList = document.getElementById('readings-list');
        readingsList.innerHTML = '';

        this.readings.forEach(reading => {
            const readingItem = document.createElement('div');
            readingItem.className = 'reading-item';
            readingItem.innerHTML = `
                <div class="reading-time">
                    ${new Date(reading.reading_date).toLocaleTimeString()}
                </div>
                <div class="reading-values">
                    <span class="reading-value temp">${reading.temperature}°C</span>
                    <span class="reading-value humidity">${reading.humidity}%</span>
                    <span class="reading-value moisture">${reading.moisture}%</span>
                    <span class="reading-value aflatoxin ${reading.aflatoxin_level > 10 ? 'alert' : ''}">${reading.aflatoxin_level} ppb</span>
                </div>
            `;
            readingsList.appendChild(readingItem);
        });
    }

    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateRealTimeData();
        }, 5000); // Update every 5 seconds
    }

    updateRealTimeData() {
        // Simulate real-time sensor updates
        const mockData = {
            temperature: 20 + Math.random() * 15,
            humidity: 50 + Math.random() * 30,
            moisture: 30 + Math.random() * 40,
            aflatoxin: Math.random() * 50
        };

        // Update top stats
        document.getElementById('current-temp').textContent = `${mockData.temperature.toFixed(1)}°C`;
        document.getElementById('current-humidity').textContent = `${mockData.humidity.toFixed(1)}%`;
        document.getElementById('current-moisture').textContent = `${mockData.moisture.toFixed(1)}%`;
        document.getElementById('current-aflatoxin').textContent = `${mockData.aflatoxin.toFixed(1)} ppb`;

        // Update gauges
        this.updateGauge('temp-gauge', mockData.temperature.toFixed(1));
        this.updateGauge('humidity-gauge', mockData.humidity.toFixed(1));
        this.updateGauge('moisture-gauge', mockData.moisture.toFixed(1));

        // Check for aflatoxin alerts
        if (mockData.aflatoxin > 10) {
            this.showAflatoxinAlert(mockData.aflatoxin);
        }
    }

    showAflatoxinAlert(level) {
        const alertPanel = document.getElementById('alert-panel');
        const alertItem = document.createElement('div');
        alertItem.className = 'alert-item high';
        alertItem.innerHTML = `
            <i class="ri-alert-line"></i>
            <div class="alert-content">
                <strong>High Aflatoxin Level Detected!</strong>
                <p>Current level: ${level.toFixed(1)} ppb (Threshold: 10 ppb)</p>
                <small>${new Date().toLocaleString()}</small>
            </div>
            <button class="alert-dismiss" onclick="this.parentElement.remove()">
                <i class="ri-close-line"></i>
            </button>
        `;
        alertPanel.insertBefore(alertItem, alertPanel.firstChild);
    }

    async addSensor() {
        const formData = new FormData(document.getElementById('add-sensor-form'));
        const sensorData = {
            name: formData.get('sensor-name'),
            type: formData.get('sensor-type'),
            location: formData.get('sensor-location'),
            description: formData.get('sensor-description')
        };

        try {
            const response = await fetch('http://localhost:5000/api/users/sensors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(sensorData)
            });

            if (response.ok) {
                this.hideModal('add-sensor-modal');
                document.getElementById('add-sensor-form').reset();
                await this.loadSensors();
                this.showNotification('Sensor added successfully!', 'success');
            } else {
                throw new Error('Failed to add sensor');
            }
        } catch (error) {
            console.error('Failed to add sensor:', error);
            this.showNotification('Failed to add sensor. Please try again.', 'error');
        }
    }



    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="ri-${type === 'success' ? 'check-line' : type === 'error' ? 'close-line' : 'information-line'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async logout() {
        try {
            await fetch('http://localhost:5000/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
    }

    // Quick action methods
    exportData() {
        this.showNotification('Exporting farm data...', 'info');
        // Implementation for data export
    }

    generateReport() {
        this.showNotification('Generating report...', 'info');
        // Implementation for report generation
    }

    contactSupport() {
        this.showNotification('Opening support chat...', 'info');
        // Implementation for support contact
    }

    calibrateSensors() {
        this.showNotification('Starting sensor calibration...', 'info');
        // Implementation for sensor calibration
    }

    editSensor(sensorId) {
        this.showNotification(`Editing sensor ${sensorId}...`, 'info');
        // Implementation for sensor editing
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});
