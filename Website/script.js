// Theme Toggle
const themeToggleBtn = document.getElementById('theme-toggle');
const root = document.documentElement;

// Check for saved theme preference or system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    root.setAttribute('data-theme', 'dark');
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
} else {
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
}

themeToggleBtn.addEventListener('click', () => {
    if (root.getAttribute('data-theme') === 'dark') {
        root.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
    updateChartTheme();
});

// Navigation Logic (SPA Routing)
const navLinks = document.querySelectorAll('.nav-links li');
const sections = document.querySelectorAll('.page-section');
const pageTitle = document.getElementById('page-title');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Remove active from all links and sections
        navLinks.forEach(l => l.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        // Add active to clicked
        link.classList.add('active');
        
        // Show correct section
        const targetId = link.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
        
        // Update Title
        pageTitle.innerText = link.innerText;
        
        // If navigating to analytics, resize the chart properly
        if(targetId === 'analytics') {
            tdsChart.resize();
            turbidityChart.resize();
        }
    });
});


// Chart.js Setup
const ctxTds = document.getElementById('tdsChart').getContext('2d');
const ctxTurb = document.getElementById('turbidityChart').getContext('2d');
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = root.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b';

const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { size: 13 },
            bodyFont: { size: 14, weight: 'bold' },
            padding: 12,
            cornerRadius: 8,
            displayColors: true
        }
    },
    scales: {
        x: {
            grid: {
                color: root.getAttribute('data-theme') === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                drawBorder: false
            }
        },
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: {
                color: root.getAttribute('data-theme') === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                drawBorder: false
            }
        }
    }
};

let tdsChart = new Chart(ctxTds, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'TDS (ppm)',
            data: [],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true
        }]
    },
    options: Object.assign({}, commonOptions, {
        scales: {
            ...commonOptions.scales,
            y: {
                ...commonOptions.scales.y,
                title: { display: true, text: 'TDS (ppm)' }
            }
        }
    })
});

let turbidityChart = new Chart(ctxTurb, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Turbidity (NTU)',
            data: [],
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true
        }]
    },
    options: Object.assign({}, commonOptions, {
        scales: {
            ...commonOptions.scales,
            y: {
                ...commonOptions.scales.y,
                title: { display: true, text: 'Turbidity (NTU)' }
            }
        }
    })
});

function updateChartTheme() {
    const isDark = root.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    
    Chart.defaults.color = textColor;
    
    [tdsChart, turbidityChart].forEach(chart => {
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.update();
    });
}

// Data Fetching and Updating
let previousTDS = null;
let previousTurbidity = null;

async function fetchWaterData() {
    try {
        const response = await fetch('api.php');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.error) {
            console.error('API Error:', data.error);
            updateConnectionStatus(false);
            return;
        }

        updateConnectionStatus(true);
        updateDashboard(data.latest, data.chart_data, data.history);
        
    } catch (error) {
        console.error('Fetch error:', error);
        updateConnectionStatus(false);
    }
}

function updateConnectionStatus(isConnected) {
    const badge = document.getElementById('connection-status');
    const text = document.getElementById('conn-text');
    
    if (isConnected) {
        badge.classList.remove('error');
        text.innerText = 'Live Data';
    } else {
        badge.classList.add('error');
        text.innerText = 'Disconnected';
    }
}

function updateDashboard(latest, chartData, history) {
    if (!latest) return;

    // Update DOM Elements
    const tdsVal = document.getElementById('tds-val');
    const turbVal = document.getElementById('turbidity-val');
    const statusText = document.getElementById('overall-status');
    const statusCard = document.getElementById('status-card');
    const alertBanner = document.getElementById('alert-banner');
    
    // Animate numbers
    animateValue(tdsVal, parseFloat(tdsVal.innerText) || 0, latest.tds, 1000);
    animateValue(turbVal, parseFloat(turbVal.innerText) || 0, latest.turbidity, 1000, true);

    // Calculate trends
    updateTrend('tds-trend', previousTDS, latest.tds, 'ppm');
    updateTrend('turbidity-trend', previousTurbidity, latest.turbidity, 'NTU');
    
    previousTDS = latest.tds;
    previousTurbidity = latest.turbidity;

    // Status logic
    const isSafe = latest.status.toUpperCase() === 'SAFE' && latest.tds <= 500 && latest.turbidity <= 5;
    
    if (isSafe) {
        statusText.innerText = 'SAFE';
        statusText.className = 'metric-value status-text status-safe';
        statusCard.classList.remove('danger');
        alertBanner.classList.add('hidden');
    } else {
        statusText.innerText = 'UNSAFE';
        statusText.className = 'metric-value status-text status-unsafe';
        statusCard.classList.add('danger');
        alertBanner.classList.remove('hidden');
    }

    // Update Chart
    const labels = chartData.map(item => {
        if (item.created_at) {
            return new Date(item.created_at).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit', second:'2-digit'});
        }
        return `ID: ${item.id}`;
    });
    const tdsData = chartData.map(item => item.tds);
    const turbData = chartData.map(item => item.turbidity);

    tdsChart.data.labels = labels;
    tdsChart.data.datasets[0].data = tdsData;
    tdsChart.update();

    turbidityChart.data.labels = labels;
    turbidityChart.data.datasets[0].data = turbData;
    turbidityChart.update();

    // Update History Table
    const tbody = document.querySelector('#history-table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        history.forEach(item => {
            const itemSafe = item.status.toUpperCase() === 'SAFE' && item.tds <= 500 && item.turbidity <= 5;
            const badgeClass = itemSafe ? 'badge-safe' : 'badge-unsafe';
            const statusLabel = itemSafe ? 'SAFE' : 'UNSAFE';

            const timeLabel = item.created_at ? new Date(item.created_at).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit', second:'2-digit'}) : `#${item.id}`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${timeLabel}</td>
                <td><strong>${item.tds}</strong></td>
                <td><strong>${item.turbidity}</strong></td>
                <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function updateTrend(elementId, prev, current, unit) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (prev === null) {
        el.innerHTML = 'Initial reading';
        return;
    }
    
    const diff = (current - prev).toFixed(1);
    if (diff > 0) {
        el.innerHTML = `<i class="fa-solid fa-arrow-trend-up trend-up"></i> <span class="trend-up">+${diff} ${unit}</span> vs last reading`;
    } else if (diff < 0) {
        el.innerHTML = `<i class="fa-solid fa-arrow-trend-down trend-down"></i> <span class="trend-down">${diff} ${unit}</span> vs last reading`;
    } else {
        el.innerHTML = `<i class="fa-solid fa-minus trend-neutral"></i> <span class="trend-neutral">No change</span> vs last reading`;
    }
}

function animateValue(obj, start, end, duration, isFloat=false) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = progress * (end - start) + start;
        obj.innerHTML = isFloat ? current.toFixed(1) : Math.round(current);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Initial Fetch and Polling
fetchWaterData();
setInterval(fetchWaterData, 3000); // Fetch every 3 seconds

const refreshBtn = document.getElementById('refresh-btn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        const icon = document.querySelector('#refresh-btn i');
        icon.classList.add('fa-spin');
        fetchWaterData().then(() => {
            setTimeout(() => icon.classList.remove('fa-spin'), 500);
        });
    });
}
